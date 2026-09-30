"""
Builds assets/sme-automation-checklist.pdf – the free lead-magnet PDF on the website.

Edit the DEPTS / SCORE text below, then run (inside the Anaconda env):
    pip install playwright && playwright install chromium     # one time
    python python/make_checklist_pdf.py
Optional: python python/make_checklist_pdf.py --fonts /path/to/folder/with/inter-and-sora-woff2
"""
import argparse
import base64
import html
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "sme-automation-checklist.pdf"
LOGO = ROOT / "assets" / "logo-full-white.png"

# Same tasks as the "Automation by department" section on the website (js/main.js → DEPTS)
DEPTS = [
    ("Sales", [
        ("Lead capture & assignment", "Leads from every portal land in the CRM and are assigned instantly.", "2 hrs/day", "0 min"),
        ("Quotation generation", "AI drafts a branded quotation from the enquiry in seconds.", "30 min each", "2 min"),
        ("Follow-up reminders", "Reminders and WhatsApp nudges go out automatically, so no lead is forgotten.", "Manual memory", "Automatic"),
        ("Salesperson performance", "Hot/cold, qualified and conversion reports per employee, live.", "3 hrs/week", "Live"),
    ]),
    ("Marketing", [
        ("Campaign lead reports", "Meta & Google Ads leads with cost-per-lead analysis, auto-compiled.", "4 hrs/week", "Auto"),
        ("WhatsApp broadcasts", "Segmented, personalised broadcasts scheduled in advance.", "1 day", "15 min"),
        ("AI content drafts", "Posts, captions and emails drafted by AI in your brand voice.", "5 hrs/week", "1 hr"),
        ("Source-wise ROI", "Know exactly which channel brings paying customers.", "Guesswork", "Live data"),
    ]),
    ("Customer Support", [
        ("AI chatbot for FAQs", "Answers product, price and policy questions 24/7.", "Staff time", "24/7 bot"),
        ("Order status updates", "Customers get dispatch & delivery updates automatically.", "40 calls/day", "5 calls/day"),
        ("Ticket routing", "Complaints are categorised and routed to the right person.", "1 hr/day", "0 min"),
        ("Feedback & reviews", "Automatic feedback requests after every order.", "Rarely done", "Every order"),
    ]),
    ("Finance & Accounts", [
        ("Invoice generation", "Invoices created from orders and emailed automatically.", "10 min each", "0 min"),
        ("Payment reminders", "Polite, escalating reminders on WhatsApp & email.", "2 hrs/day", "Auto"),
        ("Reconciliation", "Bank, Tally and sales data matched by Python scripts.", "2 days/month", "1 hour"),
        ("PDF data extraction", "Purchase bills and GST invoices read by Document AI.", "3 min/bill", "5 sec"),
    ]),
    ("HR & Admin", [
        ("Resume screening", "AI shortlists candidates against your job criteria.", "6 hrs/opening", "20 min"),
        ("Attendance & leave", "Requests, approvals and records in one automated flow.", "1 hr/day", "5 min"),
        ("Onboarding documents", "Offer letters and joining kits generated from templates.", "45 min", "2 min"),
        ("Incentive calculation", "Weekly/monthly incentives computed from sales data.", "1 day", "Instant"),
    ]),
    ("Operations", [
        ("Order processing", "Orders from all channels flow into one system automatically.", "3 hrs/day", "15 min"),
        ("Inventory alerts", "Low-stock and dead-stock alerts before they hurt.", "Stock-outs", "Early alerts"),
        ("Dispatch updates", "Tracking details sent to customers the moment goods leave.", "1 hr/day", "0 min"),
        ("Vendor follow-ups", "Automatic PO reminders and delivery confirmations.", "5 hrs/week", "Auto"),
    ]),
    ("Management", [
        ("Daily MIS on WhatsApp", "Yesterday's numbers on your phone at 9 AM, every day.", "Ask & wait", "9:00 AM daily"),
        ("KPI dashboard", "One live screen for sales, cash, operations and team.", "5 reports", "1 dashboard"),
        ("Forecasting", "Python models forecast sales and demand.", "Gut feeling", "Data model"),
        ("Exception alerts", "Get notified only when something needs your attention.", "Firefighting", "Early warning"),
    ]),
]

SCORE = [
    ("0 – 7 ticks", "Well systemised", "Your basics run themselves. Look at AI agents, forecasting and connecting departments next."),
    ("8 – 16 ticks", "Clear quick wins", "Several daily tasks are still manual. Most are good candidates for simple Level 1–2 automation."),
    ("17 – 28 ticks", "Big opportunity", "Manual work is taking a large share of your team's day. Start with sales and finance, where time lost costs the most."),
]

CSS = """
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; color: #3A4568; font-size: 10.5pt; line-height: 1.5; }
h1, h2, h3, b.h { font-family: 'Sora', 'Inter', Arial, sans-serif; color: #0A1440; letter-spacing: -.01em; }
.page { width: 210mm; height: 297mm; padding: 16mm 16mm 14mm; position: relative; page-break-after: always; overflow: hidden; }
.page:last-child { page-break-after: auto; }
.cover { padding: 0; }
.band { background: radial-gradient(120mm 80mm at 90% 0%, rgba(11,92,255,.55), transparent 70%), radial-gradient(90mm 70mm at 0% 100%, rgba(27,200,245,.25), transparent 70%), #050C2A; color: #C9D3F0; padding: 12mm 16mm 11mm; }
.band img { width: 36mm; }
.kicker { font-family: 'Sora', Arial, sans-serif; font-size: 8.5pt; letter-spacing: .18em; text-transform: uppercase; color: #1BC8F5; font-weight: 600; }
.band .kicker { display: block; margin-top: 9mm; }
.band h1 { color: #fff; font-size: 29pt; line-height: 1.1; margin: 3mm 0 4mm; font-weight: 700; }
.band p { font-size: 12.5pt; max-width: 150mm; }
.band .grad { color: #1BC8F5; }
.pills { display: flex; gap: 2.5mm; margin-top: 5mm; flex-wrap: wrap; }
.pills span { border: 1px solid rgba(140,170,255,.35); border-radius: 20mm; padding: 1.5mm 4mm; font-size: 9pt; color: #E3E9FB; }
.inner { padding: 9mm 16mm 0; }
h2 { font-size: 15pt; margin-bottom: 3mm; }
.steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5mm; }
.step { border: 1px solid #E2E8F4; border-radius: 4mm; padding: 4mm; background: #F4F7FD; }
.step .n { display: inline-grid; place-items: center; width: 8mm; height: 8mm; border-radius: 50%; background: linear-gradient(120deg, #1BC8F5, #0B5CFF); color: #fff; font-weight: 700; font-size: 10pt; margin-bottom: 2mm; }
.step b { display: block; color: #0A1440; margin-bottom: 1mm; }
.score { margin-top: 7mm; }
.score table { width: 100%; border-collapse: separate; border-spacing: 0 2mm; }
.score td { padding: 3mm 4mm; background: #fff; border-top: 1px solid #E2E8F4; border-bottom: 1px solid #E2E8F4; vertical-align: top; }
.score td:first-child { border-left: 4px solid #0B5CFF; border-radius: 2mm 0 0 2mm; width: 32mm; font-weight: 700; color: #0B5CFF; font-family: 'Sora', Arial, sans-serif; }
.score td:nth-child(2) { width: 38mm; font-weight: 600; color: #0A1440; }
.score td:last-child { border-right: 1px solid #E2E8F4; border-radius: 0 2mm 2mm 0; }
.note { font-size: 8.5pt; color: #6A7596; margin-top: 4mm; }
.dept { margin-bottom: 7mm; break-inside: avoid; }
.dept-h { display: flex; align-items: baseline; justify-content: space-between; border-bottom: 2px solid #0A1440; padding-bottom: 1.5mm; margin-bottom: 1mm; }
.dept-h h3 { font-size: 13pt; }
.dept-h span { font-size: 8.5pt; color: #6A7596; }
table.tasks { width: 100%; border-collapse: collapse; }
.tasks th { white-space: nowrap; text-align: left; font-size: 7.5pt; letter-spacing: .1em; text-transform: uppercase; color: #6A7596; font-weight: 600; padding: 2mm 2mm 1mm; }
.tasks td { padding: 2.4mm 2mm; border-bottom: 1px solid #E2E8F4; vertical-align: top; font-size: 9.5pt; }
.tasks td.box { width: 8mm; }
.tasks td.box i { display: block; width: 4.6mm; height: 4.6mm; border: 1.5px solid #8391BB; border-radius: 1mm; margin-top: .3mm; }
.tasks td.t { width: 45mm; font-weight: 600; color: #0A1440; }
.tasks td.ba { width: 46mm; white-space: nowrap; font-size: 9pt; }
.tasks s { color: #F0506E; }
.tasks .ba b { color: #0B5CFF; }
.count { float: right; font-size: 8.5pt; color: #6A7596; }
.count i { display: inline-block; width: 12mm; border-bottom: 1px solid #8391BB; margin-left: 2mm; }
.foot { position: absolute; left: 16mm; right: 16mm; bottom: 9mm; display: flex; justify-content: space-between; font-size: 8pt; color: #8391BB; border-top: 1px solid #E2E8F4; padding-top: 2.5mm; }
.lines { display: grid; gap: 1mm; margin: 0 0 5mm; }
.line { display: flex; gap: 4mm; align-items: flex-end; }
.line b { font-family: 'Sora', Arial, sans-serif; color: #0B5CFF; font-size: 13pt; width: 7mm; }
.line i { flex: 1; border-bottom: 1px solid #8391BB; height: 8mm; }
.ladder { display: grid; grid-template-columns: repeat(5, 1fr); gap: 3mm; margin: 1mm 0 5mm; }
.ladder div { border: 1px solid #E2E8F4; border-radius: 3mm; padding: 3.5mm; font-size: 8.5pt; background: #F4F7FD; }
.ladder div b { display: block; font-family: 'Sora', Arial, sans-serif; color: #0A1440; font-size: 9.5pt; margin: 1mm 0; }
.ladder div span { font-weight: 700; color: #0B5CFF; font-size: 8pt; letter-spacing: .08em; }
.cta { border-radius: 5mm; padding: 6mm 8mm; color: #C9D3F0; background: radial-gradient(90mm 60mm at 100% 0%, rgba(11,92,255,.5), transparent 70%), #050C2A; }
.cta h2 { color: #fff; margin-bottom: 2mm; }
.cta .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm 8mm; margin-top: 4mm; font-size: 10.5pt; }
.cta .grid small { display: block; font-size: 7.5pt; letter-spacing: .12em; text-transform: uppercase; color: #1BC8F5; }
.cta .grid div { color: #fff; font-weight: 600; }
"""


def font_css(folder):
    if not folder:
        return ""
    folder = pathlib.Path(folder)
    out = []
    for fam, prefix in (("Inter", "inter"), ("Sora", "sora")):
        for w in (400, 600, 700):
            f = folder / f"{prefix}-latin-{w}-normal.woff2"
            if f.exists():
                data = base64.b64encode(f.read_bytes()).decode()
                out.append(f"@font-face{{font-family:'{fam}';font-weight:{w};src:url(data:font/woff2;base64,{data}) format('woff2');}}")
    return "\n".join(out)


def e(s):
    return html.escape(s)


def dept_block(name, tasks):
    rows = "".join(
        f"<tr><td class='box'><i></i></td><td class='t'>{e(t)}</td><td>{e(d)}</td>"
        f"<td class='ba'><s>{e(b)}</s> &rarr; <b>{e(a)}</b></td></tr>"
        for t, d, b, a in tasks
    )
    return (f"<div class='dept'><div class='dept-h'><h3>{e(name)}</h3><span class='count'>Ticks<i></i> / {len(tasks)}</span></div>"
            f"<table class='tasks'><tr><th></th><th>Still done by hand?</th><th>What automation does</th><th>Typical before &rarr; after*</th></tr>{rows}</table></div>")


def build_html(fonts):
    logo = base64.b64encode(LOGO.read_bytes()).decode()
    total = sum(len(t) for _, t in DEPTS)
    foot = lambda n: f"<div class='foot'><span>Workflash Automation · workflash.in</span><span>The SME Automation Checklist · {n}</span></div>"
    score_rows = "".join(f"<tr><td>{e(a)}</td><td>{e(b)}</td><td>{e(c)}</td></tr>" for a, b, c in SCORE)
    p1 = f"""
<section class='page cover'>
  <div class='band'>
    <img src='data:image/png;base64,{logo}' alt='Workflash Automation'>
    <span class='kicker'>Free guide · {total} tasks · {len(DEPTS)} departments</span>
    <h1>The SME <span class='grad'>Automation</span> Checklist</h1>
    <p>{total} daily tasks that growing Indian businesses automate first, from the first enquiry to the owner's daily numbers. Tick what your team still does by hand and find out where to start.</p>
    <div class='pills'>{''.join(f'<span>{e(n)}</span>' for n, _ in DEPTS)}</div>
  </div>
  <div class='inner'>
    <h2>How to use this checklist</h2>
    <div class='steps'>
      <div class='step'><span class='n'>1</span><b>Tick honestly</b>Go through each department and tick every task your team still does by hand today.</div>
      <div class='step'><span class='n'>2</span><b>Count per department</b>Write the number of ticks next to each department and add up your total.</div>
      <div class='step'><span class='n'>3</span><b>Pick your first 3</b>In the department with the most ticks, choose the 3 tasks that eat the most hours.</div>
    </div>
    <div class='score'>
      <h2>What your total means</h2>
      <table>{score_rows}</table>
    </div>
  </div>
  {foot(1)}
</section>"""
    # 3 departments on page 2, 3 on page 3, the last one on page 4 above the action plan
    p2 = f"<section class='page'>{''.join(dept_block(n, t) for n, t in DEPTS[:3])}" \
         f"<p class='note'>*Indicative outcomes. Actual results depend on your processes and scope.</p>{foot(2)}</section>"
    p3 = f"<section class='page'>{''.join(dept_block(n, t) for n, t in DEPTS[3:6])}" \
         f"<p class='note'>*Indicative outcomes. Actual results depend on your processes and scope.</p>{foot(3)}</section>"
    levels = [("L1", "Digital Basics", "Stop doing the same task twice"), ("L2", "Connected Workflows", "Your apps talk to each other"),
              ("L3", "Data-Driven", "Live dashboards, not guesswork"), ("L4", "AI-Powered", "AI reads, writes and replies"),
              ("L5", "Autonomous", "The business runs itself")]
    p4 = f"""
<section class='page'>
  {''.join(dept_block(n, t) for n, t in DEPTS[6:])}
  <h2 style='margin-top:2mm'>My total: ______ / {total}</h2>
  <p>Department with the most ticks: ______________________________</p>
  <h2 style='margin-top:5mm'>My first 3 automations</h2>
  <div class='lines'><div class='line'><b>1</b><i></i></div><div class='line'><b>2</b><i></i></div><div class='line'><b>3</b><i></i></div></div>
  <h2>The 5 levels of automation</h2>
  <div class='ladder'>{''.join(f"<div><span>{a}</span><b>{e(b)}</b>{e(c)}</div>" for a, b, c in levels)}</div>
  <div class='cta'>
    <span class='kicker'>Next step · free automation audit</span>
    <h2>Send us your ticked list</h2>
    <p>Share a photo of this checklist on WhatsApp. Within 24 hours you get a free automation plan with a clear quote and expected savings. Hindi ya English, jaise aapko aasaan lage.</p>
    <div class='grid'>
      <div><small>WhatsApp / Call</small>+91 93546 76636</div>
      <div><small>Email</small>Workflashspace@gmail.com</div>
      <div><small>Website</small>workflash.in</div>
      <div><small>Instagram</small>@workflash.tech</div>
    </div>
  </div>
  {foot(4)}
</section>"""
    return f"<!doctype html><html><head><meta charset='utf-8'><style>{font_css(fonts)}{CSS}</style></head><body>{p1}{p2}{p3}{p4}</body></html>"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fonts", help="folder with inter-latin-400-normal.woff2 etc. (optional)")
    ap.add_argument("--html", help="also save the HTML here (for checking the layout)")
    args = ap.parse_args()
    doc = build_html(args.fonts)
    if args.html:
        pathlib.Path(args.html).write_text(doc, encoding="utf-8")
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page()
        pg.set_content(doc, wait_until="load")
        pg.pdf(path=str(OUT), format="A4", print_background=True, prefer_css_page_size=True)
        b.close()
    print("saved", OUT)


if __name__ == "__main__":
    main()
