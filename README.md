# Workflash Automation – Website

Official website of **Workflash Automation** — AI Automation Specialists since 2021.
Founder: Ankush Goswami · 📞 +91 72108 76636 / +91 93546 76636 · ✉️ Workflashspace@gmail.com

## What's inside
```
index.html                  → the website (single page)
css/style.css               → brand styles (navy / blue / cyan from the logo)
js/main.js                  → all interactive features
assets/                     → logo files (transparent PNG), favicon
python/lead_intelligence.py → the script the "Live Python Lab" runs in the browser
python/automation_report.py → Pandas/Excel lead report generator (Anaconda)
python/environment.yml      → Anaconda environment definition
.nojekyll                   → tells GitHub Pages to serve files as-is
```

## Website features
- Animated hero with a live "lead-to-revenue" automation pipeline and AI network background
- **Automation Journey**: 5 interactive levels, from Digital Basics to Autonomous Enterprise
- Solutions for Small Business, Growing SMEs and Enterprise
- Department-wise automation (Sales, Marketing, Support, Finance, HR, Operations, Management)
- **Live Python Lab**: real Python (Pyodide / WebAssembly) runs a lead analysis in the visitor's browser
- ROI calculator in ₹ (yearly + 3-year savings)
- **Automation Readiness Score**: a 6-question assessment with level, score gauge and recommendations
- Quote form that sends the enquiry on WhatsApp or email (no server needed)

## Deploy on GitHub Pages (free)
1. Create a new **Public** repository at https://github.com/new (e.g. `workflash-website`).
2. Click **"uploading an existing file"** and drag in **all files and folders from this zip** (not the zip itself). Then click **Commit changes**.
3. Go to **Settings → Pages** → Source: **Deploy from a branch** → Branch: **main** / **(root)** → **Save**.
4. After 1–2 minutes the site is live at `https://<username>.github.io/workflash-website/`.

Tip: name the repo `<username>.github.io` to get the shorter URL `https://<username>.github.io/`.
Custom domain: Settings → Pages → Custom domain (e.g. `www.workflash.in`), then add a CNAME record at your domain provider pointing to `<username>.github.io`.

## Python tools (Anaconda)
```bash
cd python
conda env create -f environment.yml
conda activate workflash
python automation_report.py              # demo report with sample data
python automation_report.py leads.xlsx   # your own lead export
```

## Editing
- Phone / email / text: `index.html` (WhatsApp number is also at the top of `js/main.js`)
- Colours: `:root` variables at the top of `css/style.css`
- Journey levels, departments and quiz questions: the data arrays in `js/main.js`
