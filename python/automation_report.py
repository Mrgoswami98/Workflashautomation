"""
Workflash Automation - Lead & Sales Automation Report (Anaconda / Pandas)

Reads a lead export (CSV or Excel) and produces a formatted Excel report with:
  - Summary KPIs
  - Source-wise performance
  - Salesperson-wise performance
  - Day-wise trend

Usage (inside the Anaconda environment from environment.yml):
    conda env create -f environment.yml
    conda activate workflash
    python automation_report.py                      # demo with generated sample data
    python automation_report.py leads.xlsx           # your own export
    python automation_report.py leads.csv -o out.xlsx

Expected columns (names are matched case-insensitively):
    date, source, salesperson, status, response_minutes
"""
import argparse
import sys
from pathlib import Path

import numpy as np
import pandas as pd

WON = {"won", "converted", "closed", "order"}


def sample_data(n: int = 800, seed: int = 2021) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    sources = ["IndiaMART", "JustDial", "Meta Ads", "Website", "WhatsApp"]
    people = ["Sales Rep 1", "Sales Rep 2", "Sales Rep 3", "Sales Rep 4"]
    df = pd.DataFrame({
        "date": pd.Timestamp("2026-01-01") + pd.to_timedelta(rng.integers(0, 90, n), unit="D"),
        "source": rng.choice(sources, n),
        "salesperson": rng.choice(people, n),
        "response_minutes": rng.exponential(60, n).round(1),
    })
    p = 0.35 * np.exp(-df["response_minutes"] / 120)
    df["status"] = np.where(rng.random(n) < p, "Won", rng.choice(["Lost", "Follow-up", "Quoted"], n))
    return df


def load(path: Path) -> pd.DataFrame:
    df = pd.read_excel(path) if path.suffix.lower() in {".xlsx", ".xls"} else pd.read_csv(path)
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    missing = {"date", "source", "salesperson", "status"} - set(df.columns)
    if missing:
        sys.exit(f"Missing columns: {', '.join(sorted(missing))}")
    df["date"] = pd.to_datetime(df["date"], errors="coerce", dayfirst=True)
    if "response_minutes" not in df:
        df["response_minutes"] = np.nan
    return df.dropna(subset=["date"])


def breakdown(df: pd.DataFrame, by: str) -> pd.DataFrame:
    g = df.groupby(by).agg(
        leads=("status", "size"),
        won=("won", "sum"),
        avg_response_min=("response_minutes", "mean"),
    )
    g["conversion_%"] = (100 * g["won"] / g["leads"]).round(1)
    g["avg_response_min"] = g["avg_response_min"].round(1)
    return g.sort_values("conversion_%", ascending=False).reset_index()


def build_report(df: pd.DataFrame, out: Path) -> None:
    df = df.copy()
    df["won"] = df["status"].astype(str).str.strip().str.lower().isin(WON)

    summary = pd.DataFrame({
        "Metric": ["Total leads", "Won", "Conversion %", "Avg response (min)", "Period"],
        "Value": [
            len(df), int(df["won"].sum()),
            round(100 * df["won"].mean(), 1),
            round(df["response_minutes"].mean(), 1),
            f"{df['date'].min():%d-%b-%Y} to {df['date'].max():%d-%b-%Y}",
        ],
    })
    by_source = breakdown(df, "source")
    by_person = breakdown(df, "salesperson")
    daily = df.groupby(df["date"].dt.date).agg(leads=("status", "size"), won=("won", "sum")).reset_index()

    with pd.ExcelWriter(out, engine="openpyxl") as xw:
        for name, frame in [("Summary", summary), ("Source Wise", by_source),
                            ("Salesperson Wise", by_person), ("Day Wise", daily),
                            ("Lead Data", df.drop(columns="won"))]:
            frame.to_excel(xw, sheet_name=name, index=False)
            ws = xw.sheets[name]
            for col in ws.columns:
                width = max(len(str(c.value or "")) for c in col) + 2
                ws.column_dimensions[col[0].column_letter].width = min(width, 40)

    best = by_source.iloc[0]
    print(f"Report saved: {out.resolve()}")
    print(f"Best source: {best['source']} ({best['conversion_%']}% conversion)")


def main() -> None:
    ap = argparse.ArgumentParser(description="Workflash lead automation report")
    ap.add_argument("file", nargs="?", help="CSV/Excel lead export (omit for demo data)")
    ap.add_argument("-o", "--out", default="workflash_lead_report.xlsx")
    args = ap.parse_args()
    df = load(Path(args.file)) if args.file else sample_data()
    build_report(df, Path(args.out))


if __name__ == "__main__":
    main()
