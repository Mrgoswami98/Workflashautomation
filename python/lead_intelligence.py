# Workflash Lead Intelligence: runs 100% in your browser
# (This is the same script the website's "Live Python Lab" executes via Pyodide.
#  It uses only the Python standard library, so it also runs with plain `python lead_intelligence.py`.)
import random, statistics
from collections import defaultdict

random.seed(2021)
SOURCES = ["IndiaMART", "JustDial", "Meta Ads", "Website", "WhatsApp"]
QUALITY = {"IndiaMART": .30, "JustDial": .22, "Meta Ads": .26,
           "Website": .38, "WhatsApp": .45}

# 1) Simulate 600 leads: manual follow-up vs Workflash automation
leads = []
for i in range(600):
    src = random.choice(SOURCES)
    automated = i % 2 == 0
    reply_min = random.uniform(0.05, 0.1) if automated else random.expovariate(1/95)
    # faster replies convert better (decay after first 5 minutes)
    p = QUALITY[src] * (1.0 if reply_min < 5 else max(0.35, 1 - reply_min/300))
    leads.append((src, automated, reply_min, random.random() < p))

# 2) Analyse
def rate(rows):
    return 100 * sum(r[3] for r in rows) / max(1, len(rows))

manual = [l for l in leads if not l[1]]
auto   = [l for l in leads if l[1]]
print(f"Leads analysed        : {len(leads)}")
print(f"Avg reply (manual)    : {statistics.mean(l[2] for l in manual):6.1f} min")
print(f"Avg reply (automated) : {statistics.mean(l[2] for l in auto)*60:6.1f} sec")
print(f"Conversion manual     : {rate(manual):5.1f} %")
print(f"Conversion automated  : {rate(auto):5.1f} %")
print(f"Uplift                : +{rate(auto) - rate(manual):.1f} pts\n")

by_src = defaultdict(lambda: {"m": [], "a": []})
for l in leads:
    by_src[l[0]]["a" if l[1] else "m"].append(l)

print(f"{'Source':<10}{'Manual %':>10}{'Auto %':>10}")
result = {}
for s in SOURCES:
    m, a = rate(by_src[s]["m"]), rate(by_src[s]["a"])
    result[s] = [round(m, 1), round(a, 1)]
    print(f"{s:<10}{m:>10.1f}{a:>10.1f}")

best = max(result, key=lambda s: result[s][1])
print(f"\nInsight: automate '{best}' first for the biggest win.")
result  # returned to the page to draw the chart
