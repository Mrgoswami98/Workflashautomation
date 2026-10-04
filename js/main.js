// =========================================================
// Workflash Automation – site scripts
// =========================================================
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
  const icon = (id) => `<svg class="ic"><use href="#i-${id}"/></svg>`;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const { WA_NUMBER, EMAIL, FORM_ENDPOINT } = window.WF;
  const track = window.WF.track;
  const FOUNDED = 2021;

  // Save a lead into the Google Sheet (fire-and-forget, never blocks WhatsApp / download).
  // Every lead carries its source: UTM tags, Google/Meta click ID and landing page (see js/site.js).
  const saveLead = (fields) => {
    if (!FORM_ENDPOINT) return;
    const attrib = window.WF.attribution ? window.WF.attribution() : {};
    const payload = new URLSearchParams(Object.assign({
      page: location.href, referrer: document.referrer || '', userAgent: navigator.userAgent,
    }, attrib, fields));
    try { fetch(FORM_ENDPOINT, { method: 'POST', mode: 'no-cors', keepalive: true, body: payload }); } catch (err) {}
  };

  // ---------- Basics ----------
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if ($('#yearsExp')) $('#yearsExp').textContent = Math.max(1, new Date().getFullYear() - FOUNDED) + '+';

  // ---------- Nav, progress, back-to-top ----------
  const progress = $('#progress');
  const toTop = $('#toTop');
  const onScroll = () => {
    const y = window.scrollY;
    if (toTop) toTop.classList.toggle('show', y > 900);
    const h = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
  };
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
  if (toTop) toTop.addEventListener('click', () => scrollTo({ top: 0 }));

  // Active nav link
  const links = $$('#navLinks a:not(.btn)').filter((l) => /^#[\w-]+$/.test(l.getAttribute('href') || ''));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((l) => { const s = $(l.getAttribute('href')); if (s) spy.observe(s); });

  // ---------- Reveal + counters ----------
  const countUp = (el) => {
    const target = +el.dataset.count, t0 = performance.now(), dur = 1500;
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('en-IN');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      $$('[data-count]', e.target).forEach(countUp);
      io.unobserve(e.target);
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach((el) => io.observe(el));

  if ($('#home')) {
  // ---------- Hero: typing rotator ----------
  const words = ['lead follow-ups', 'sales reports', 'invoices & reminders', 'customer support', 'data pipelines in Python', 'entire operations'];
  const rot = $('#rotator');
  if (!reduceMotion) {
    let w = 0, c = words[0].length, deleting = true;
    const type = () => {
      const word = words[w];
      c += deleting ? -1 : 1;
      rot.textContent = word.slice(0, c);
      let delay = deleting ? 40 : 75;
      if (!deleting && c === word.length) { deleting = true; delay = 1800; }
      else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; delay = 300; }
      setTimeout(type, delay);
    };
    setTimeout(type, 2000);
  }

  // ---------- Hero: console log ----------
  const logLines = [
    'CRM: lead assigned to sales team (round-robin)',
    'python report.py → MIS dashboard refreshed',
    'AI agent drafted quotation Q-1182 in 6s',
    'invoice INV-2207 generated & emailed',
    'payment reminder sent on WhatsApp',
    'Power BI dataset refreshed · 12,480 rows',
    'lead #4822 captured from Meta Ads',
  ];
  const log = $('#consoleLog');
  let li = 0;
  setInterval(() => {
    const d = new Date();
    const ts = d.toTimeString().slice(0, 8);
    const row = document.createElement('div');
    row.innerHTML = `<span class="ok">✓</span> ${ts} ${logLines[li++ % logLines.length]}`;
    log.appendChild(row);
    if (log.children.length > 3) log.firstElementChild.remove();
  }, 2600);

  // ---------- Hero: neural network canvas ----------
  const cv = $('#net');
  const ctx = cv.getContext('2d');
  let pts = [], running = true, W = 0, H = 0;
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.offsetWidth; H = cv.offsetHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(80, Math.floor(W / 18));
    pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35 }));
  };
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      for (let j = i + 1; j < pts.length; j++) {
        const q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy;
        if (d < 17000) {
          ctx.strokeStyle = `rgba(80,170,255,${(1 - d / 17000) * .35})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
      ctx.fillStyle = 'rgba(120,210,255,.8)';
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2); ctx.fill();
    }
    if (running && !reduceMotion) requestAnimationFrame(draw);
  };
  resize(); draw();
  addEventListener('resize', resize);
  new IntersectionObserver(([e]) => {
    const was = running; running = e.isIntersecting;
    if (running && !was && !reduceMotion) requestAnimationFrame(draw);
  }).observe($('#home'));
  }

  // ---------- Automation Journey ----------
  const LEVELS = [
    {
      name: 'Digital Basics', tag: 'Stop doing the same task twice',
      for: 'Small shops, clinics, startups',
      desc: 'The foundation. Simple, low-cost automations that remove daily copy-paste work and make sure no customer message goes unanswered.',
      items: ['WhatsApp auto-replies, quick replies & catalogue', 'Smart Google Sheets / Excel templates with formulas', 'Automatic invoices & payment reminders', 'Daily sales summary sent to the owner on WhatsApp'],
      tools: ['WhatsApp Business', 'Google Sheets', 'Excel', 'Google Forms'],
      meters: [25, 10, 15], time: '3–5 days',
    },
    {
      name: 'Connected Workflows', tag: 'Your apps start talking to each other',
      for: 'Teams getting leads from many sources',
      desc: 'Every lead and order flows automatically between portals, CRM, email and WhatsApp. It gets assigned, followed up and tracked with zero re-typing.',
      items: ['IndiaMART, JustDial & Meta leads auto-imported to CRM', 'Round-robin lead assignment to salespeople', 'Automated follow-up sequences on WhatsApp & email', 'Status tracking with reminders for every deal'],
      tools: ['Zoho / HubSpot', 'n8n', 'Make', 'Zapier', 'WhatsApp API'],
      meters: [45, 25, 45], time: '1–2 weeks',
    },
    {
      name: 'Data-Driven Business', tag: 'Decisions from live data, not guesswork',
      for: 'SMEs with multiple departments',
      desc: 'Python pipelines collect, clean and combine data from every system into live dashboards. Management sees the truth every morning without anyone building a report.',
      items: ['Python + Pandas data pipelines, built in Anaconda', 'Auto-refreshing Power BI / Google Sheets dashboards', 'Employee-wise MIS, call, lead & incentive reports', 'Instant alerts when a KPI drops'],
      tools: ['Python', 'Pandas', 'Anaconda', 'Jupyter', 'Power BI', 'SQL'],
      meters: [62, 55, 60], time: '2–4 weeks',
    },
    {
      name: 'AI-Powered Operations', tag: 'AI that reads, writes and responds',
      for: 'Businesses ready to adopt AI',
      desc: 'Generative AI takes over judgement-based tasks: answering customers, scoring leads, drafting quotations and reading documents. Your team only reviews.',
      items: ['24/7 AI chatbot in Hindi & English, trained on your business', 'AI lead scoring & automatic quotation drafts', 'Document AI: invoices & PDFs into structured data', 'Internal AI assistant for staff SOPs & knowledge'],
      tools: ['OpenAI GPT', 'Claude AI', 'LangChain', 'Python', 'Vector DB'],
      meters: [78, 85, 72], time: '3–6 weeks',
    },
    {
      name: 'Autonomous Enterprise', tag: 'The business runs itself, and people steer it',
      for: 'Enterprises & ambitious SMEs',
      desc: 'Multiple AI agents and bots coordinate sales, operations and finance end-to-end. Humans approve exceptions, and everything is logged and measured.',
      items: ['Multi-agent systems across sales, ops & finance', 'Machine-learning demand & sales forecasting', 'RPA across ERP, Tally & government portals', 'Exception-only approvals with full audit trail'],
      tools: ['Python ML', 'scikit-learn', 'RPA', 'REST APIs', 'Cloud'],
      meters: [92, 95, 95], time: 'Phased, 1–3 months',
    },
  ];
  const METER_LABELS = ['Manual work automated', 'AI & data intelligence', 'System integration'];
  const levelsEl = $('#levels');
  const panel = $('#levelPanel');
  if (levelsEl && panel) {
  levelsEl.innerHTML = LEVELS.map((l, i) => `
    <button class="lvl" role="tab" data-i="${i}" aria-selected="false">
      <span class="n">L${i + 1}</span><span><b>${l.name}</b><small>${l.tag}</small></span>
    </button>`).join('');
  const showLevel = (i) => {
    const l = LEVELS[i];
    $$('.lvl', levelsEl).forEach((b, k) => { b.classList.toggle('active', k === i); b.setAttribute('aria-selected', k === i); });
    panel.innerHTML = `
      <div class="fade-in">
        <div class="lp-top">
          <div><span class="lp-kicker">Level ${i + 1} of 5</span><h3>${l.name}</h3><p>${l.desc}</p></div>
          <span class="lp-for">Best for: <b>${l.for}</b></span>
        </div>
        <div class="lp-grid">
          <div><h4>What we automate</h4><ul class="lp-list">${l.items.map((t) => `<li>${icon('check')}${t}</li>`).join('')}</ul></div>
          <div><h4>Impact profile</h4>
            ${l.meters.map((m, k) => `<div class="meter"><div><span>${METER_LABELS[k]}</span><span>${m}%</span></div><i><b data-w="${m}"></b></i></div>`).join('')}
            <div class="tools">${l.tools.map((t) => `<span>${t}</span>`).join('')}</div>
          </div>
        </div>
        <div class="lp-foot"><span>Typical timeline: <strong>${l.time}</strong></span>
          <a href="/contact.html" class="btn btn-primary btn-sm" data-level="${i + 1}">Plan my Level ${i + 1} automation ${icon('arrow')}</a></div>
      </div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => $$('.meter b', panel).forEach((b) => { b.style.width = b.dataset.w + '%'; })));
  };
  levelsEl.addEventListener('click', (e) => { const b = e.target.closest('.lvl'); if (b) { showLevel(+b.dataset.i); stopAuto(); } });
  showLevel(0);
  // auto-advance until the visitor interacts
  // (disabled on touch screens so the text doesn't change while someone is reading)
  let autoLvl = 0;
  const autoTimer = canHover && !reduceMotion
    ? setInterval(() => { autoLvl = (autoLvl + 1) % LEVELS.length; showLevel(autoLvl); }, 6000)
    : null;
  const stopAuto = () => { if (autoTimer) clearInterval(autoTimer); };
  ['mouseenter', 'focusin', 'pointerdown'].forEach((ev) => $('.journey').addEventListener(ev, stopAuto));
  }

  // ---------- Departments ----------
  const DEPTS = [
    { name: 'Sales', ic: 'target', tasks: [
      ['Lead capture & assignment', 'Leads from every portal land in the CRM and are assigned instantly.', '2 hrs/day', '0 min', '−100%'],
      ['Quotation generation', 'AI drafts a branded quotation from the enquiry in seconds.', '30 min each', '2 min', '−93%'],
      ['Follow-up reminders', 'No lead is forgotten. Reminders and WhatsApp nudges go out automatically.', 'Manual memory', 'Automatic', '0 missed'],
      ['Salesperson performance', 'Hot/cold, qualified and conversion reports per employee, live.', '3 hrs/week', 'Live', '−100%'],
    ] },
    { name: 'Marketing', ic: 'mega', tasks: [
      ['Campaign lead reports', 'Meta & Google Ads leads with cost-per-lead analysis, auto-compiled.', '4 hrs/week', 'Auto', '−95%'],
      ['WhatsApp broadcasts', 'Segmented, personalised broadcasts scheduled in advance.', '1 day', '15 min', '−90%'],
      ['AI content drafts', 'Posts, captions and emails drafted by AI in your brand voice.', '5 hrs/week', '1 hr', '−80%'],
      ['Source-wise ROI', 'Know exactly which channel brings paying customers.', 'Guesswork', 'Live data', 'Clarity'],
    ] },
    { name: 'Customer Support', ic: 'headset', tasks: [
      ['AI chatbot for FAQs', 'Answers product, price and policy questions 24/7.', '60% of queries', 'Auto-resolved', '24/7'],
      ['Order status updates', 'Customers get dispatch & delivery updates automatically.', '40 calls/day', '5 calls/day', '−88%'],
      ['Ticket routing', 'Complaints are categorised and routed to the right person.', '1 hr/day', '0 min', '−100%'],
      ['Feedback & reviews', 'Automatic feedback requests with sentiment analysis.', 'Rarely done', 'Every order', '+100%'],
    ] },
    { name: 'Finance & Accounts', ic: 'rupee', tasks: [
      ['Invoice generation', 'Invoices created from orders and emailed automatically.', '10 min each', '0 min', '−100%'],
      ['Payment reminders', 'Polite, escalating reminders on WhatsApp & email.', '2 hrs/day', 'Auto', '−100%'],
      ['Reconciliation', 'Bank, Tally and sales data matched by Python scripts.', '2 days/month', '1 hour', '−94%'],
      ['PDF data extraction', 'Purchase bills and GST invoices read by Document AI.', '3 min/bill', '5 sec', '−97%'],
    ] },
    { name: 'HR & Admin', ic: 'users', tasks: [
      ['Resume screening', 'AI shortlists candidates against your job criteria.', '6 hrs/opening', '20 min', '−94%'],
      ['Attendance & leave', 'Requests, approvals and records in one automated flow.', '1 hr/day', '5 min', '−92%'],
      ['Onboarding documents', 'Offer letters and joining kits generated from templates.', '45 min', '2 min', '−95%'],
      ['Incentive calculation', 'Weekly/monthly incentives computed from sales data.', '1 day', 'Instant', '−100%'],
    ] },
    { name: 'Operations', ic: 'truck', tasks: [
      ['Order processing', 'Orders from all channels flow into one system automatically.', '3 hrs/day', '15 min', '−92%'],
      ['Inventory alerts', 'Low-stock and dead-stock alerts before they hurt.', 'Stock-outs', 'Predicted', 'Proactive'],
      ['Dispatch updates', 'Tracking details sent to customers the moment goods leave.', '1 hr/day', '0 min', '−100%'],
      ['Vendor follow-ups', 'Automatic PO reminders and delivery confirmations.', '5 hrs/week', 'Auto', '−100%'],
    ] },
    { name: 'Management', ic: 'chart', tasks: [
      ['Daily MIS on WhatsApp', 'Yesterday\'s numbers in your inbox at 9 AM, every day.', 'Ask & wait', '9:00 AM daily', 'Instant'],
      ['KPI dashboards', 'One live screen for sales, cash, operations and team.', '5 reports', '1 dashboard', 'Unified'],
      ['Forecasting', 'Python ML models forecast sales and demand.', 'Gut feeling', 'Data model', 'Predictive'],
      ['Exception alerts', 'Get notified only when something needs your attention.', 'Firefighting', 'Early warning', 'Proactive'],
    ] },
  ];
  const tabs = $('#deptTabs'), body = $('#deptBody');
  if (tabs && body) {
  tabs.innerHTML = DEPTS.map((d, i) => `<button class="dtab" role="tab" data-i="${i}">${icon(d.ic)}${d.name}</button>`).join('');
  const showDept = (i) => {
    $$('.dtab', tabs).forEach((b, k) => { b.classList.toggle('active', k === i); b.setAttribute('aria-selected', k === i); });
    body.innerHTML = DEPTS[i].tasks.map(([t, p, before, after, save], k) => `
      <div class="task" style="animation-delay:${k * 60}ms">
        <h4>${t}</h4><span class="saving">${save}</span>
        <p>${p}</p>
        <div class="time">${icon('clock')}<s>${before}</s>${icon('arrow')}<b>${after}</b></div>
      </div>`).join('');
  };
  tabs.addEventListener('click', (e) => { const b = e.target.closest('.dtab'); if (b) showDept(+b.dataset.i); });
  showDept(0);
  }

  // ---------- ROI calculator ----------
  const ids = ['people', 'hours', 'salary', 'auto'];
  let roiSummary = '';
  const fillRange = (el) => el.style.setProperty('--p', ((el.value - el.min) / (el.max - el.min)) * 100 + '%');
  const calc = () => {
    const [people, hours, salary, auto] = ids.map((id) => +$('#' + id).value);
    ids.forEach((id) => fillRange($('#' + id)));
    const DAYS = 26, DAY = 8;
    const manualHrs = people * hours * DAYS;
    const saved = manualHrs * (auto / 100);
    const yearly = saved * (salary / (DAYS * DAY)) * 12;
    $('#oPeople').textContent = people;
    $('#oHours').textContent = hours;
    $('#oSalary').textContent = inr(salary);
    $('#oAuto').textContent = auto + '%';
    $('#rMoney').textContent = inr(yearly);
    $('#r3y').textContent = inr(yearly * 3);
    $('#rHours').textContent = Math.round(saved).toLocaleString('en-IN') + ' hrs';
    $('#rFte').textContent = (saved / (DAYS * DAY)).toFixed(1);
    $('#bAfter').style.width = (100 - auto) + '%';
    $('#tBefore').textContent = Math.round(manualHrs).toLocaleString('en-IN') + ' h';
    $('#tAfter').textContent = Math.round(manualHrs - saved).toLocaleString('en-IN') + ' h';
    roiSummary = `ROI estimate: ${people} people, ${hours} hrs/day manual work, ${auto}% automatable → approx. ${inr(yearly)} saved per year.`;
  };
  if ($('#people')) {
    ids.forEach((id) => $('#' + id).addEventListener('input', calc));
    calc();
  }

  // ---------- Readiness assessment ----------
  const QUIZ = [
    ['How do you capture leads and enquiries today?', ['Notebook / phone memory', 'Excel or Google Sheets', 'A CRM, updated manually', 'A CRM that updates automatically']],
    ['How fast does a new lead get its first reply?', ['Hours or next day', 'Within an hour', 'Within a few minutes', 'Instantly, automated']],
    ['How are sales & MIS reports prepared?', ['We rarely make reports', 'Manually in Excel', 'Semi-automated templates', 'Live auto-refreshing dashboards']],
    ['How connected are your tools (CRM, accounts, WhatsApp, ERP)?', ['Not connected at all', 'Copy-paste between them', 'A few integrations', 'Fully integrated']],
    ['How do you use AI in daily work?', ['Not at all', 'Staff use ChatGPT occasionally', 'AI in one process', 'AI agents in several processes']],
    ['How much of your team\'s day is repetitive work?', ['More than 50%', '30–50%', '10–30%', 'Less than 10%']],
  ];
  const answers = [];
  const qBody = $('#qBody');
  if (qBody) {
  let quizResult = '';
  const renderQ = (n) => {
    $('#qCount').textContent = `Question ${n + 1} of ${QUIZ.length}`;
    $('#qBar').style.width = (n / QUIZ.length) * 100 + '%';
    const [q, opts] = QUIZ[n];
    qBody.innerHTML = `<div class="q fade-in"><h3>${q}</h3><div class="opts">${opts.map((o, i) => `<button class="opt" data-v="${i}">${o}</button>`).join('')}</div>
      ${n > 0 ? '<button class="q-back" id="qBack">← Back</button>' : ''}</div>`;
  };
  const renderResult = () => {
    $('#qCount').textContent = 'Your result';
    $('#qBar').style.width = '100%';
    const score = answers.reduce((a, b) => a + b, 0);
    const pct = Math.round((score / (QUIZ.length * 3)) * 100);
    const lvl = Math.min(5, 1 + Math.floor(score / 4));
    const cur = LEVELS[lvl - 1];
    const next = LEVELS[Math.min(lvl, 4)];
    const C = 2 * Math.PI * 70;
    const recs = lvl < 5 ? next.items.slice(0, 3) : ['Optimise existing agents for cost & accuracy', 'Add predictive models to more departments', 'Quarterly automation audit & roadmap'];
    quizResult = `Automation readiness score: ${pct}/100 (Level ${lvl} – ${cur.name}).`;
    qBody.innerHTML = `
      <div class="result fade-in">
        <div class="gauge"><svg viewBox="0 0 170 170"><circle class="bg" cx="85" cy="85" r="70"/><circle class="fg" cx="85" cy="85" r="70" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg>
          <div><strong>${pct}</strong><span>/ 100</span></div></div>
        <div>
          <span class="eyebrow">You are at Level ${lvl} of 5</span>
          <h3>${cur.name}</h3>
          <p>${lvl < 5 ? `Your next milestone is <b>Level ${lvl + 1}: ${next.name}</b>. Here's what we'd automate first:` : 'You are among the most automated businesses. Next focus:'}</p>
          <ul>${recs.map((r) => `<li>${icon('check')}${r}</li>`).join('')}</ul>
          <div class="result-actions">
            <a href="/contact.html" class="btn btn-primary" id="quizQuote">Get a quote for this plan ${icon('arrow')}</a>
            <button class="btn btn-ghost" id="quizRetry">Retake</button>
          </div>
        </div>
      </div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => { $('.gauge .fg', qBody).style.strokeDashoffset = C * (1 - pct / 100); }));
  };
  qBody.addEventListener('click', (e) => {
    const opt = e.target.closest('.opt');
    if (opt) { answers.push(+opt.dataset.v); answers.length < QUIZ.length ? renderQ(answers.length) : renderResult(); return; }
    if (e.target.closest('#qBack')) { answers.pop(); renderQ(answers.length); return; }
    if (e.target.closest('#quizRetry')) { answers.length = 0; quizResult = ''; renderQ(0); return; }
    if (e.target.closest('#quizQuote')) prefill(quizResult);
  });
  renderQ(0);
  }

  // ---------- Python Lab (Pyodide) ----------
  const code = $('#pyCode');
  if (code) {
  code.value = $('#pySource').textContent.trim();
  code.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const s = code.selectionStart;
    code.setRangeText('    ', s, code.selectionEnd, 'end');
  });
  const out = $('#pyOut'), status = $('#pyStatus'), runBtn = $('#runPy'), chart = $('#pyChart');
  let pyodide = null;
  const setStatus = (t, cls = '') => { status.textContent = t; status.className = 'mono py-status ' + cls; };
  const loadScript = (src) => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  const drawChart = (data) => {
    const max = Math.max(...Object.values(data).flat(), 1);
    chart.innerHTML = `<div class="py-legend"><span><i style="background:#3A4A80"></i>Manual follow-up</span><span><i style="background:linear-gradient(120deg,#1BC8F5,#0B5CFF)"></i>Workflash automation</span></div>` +
      Object.entries(data).map(([k, [m, a]]) => `<div class="py-row"><span>${k}</span><div class="py-bars"><span class="m" data-w="${(m / max) * 100}">${m}%</span><span class="a" data-w="${(a / max) * 100}">${a}%</span></div></div>`).join('');
    requestAnimationFrame(() => requestAnimationFrame(() => $$('.py-bars span', chart).forEach((s) => { s.style.width = Math.max(s.dataset.w, 12) + '%'; })));
  };
  runBtn.addEventListener('click', async () => {
    runBtn.disabled = true;
    chart.innerHTML = '';
    try {
      if (!pyodide) {
        setStatus('loading Python runtime…', 'run');
        out.textContent = '>>> Downloading Python (WebAssembly)…';
        await loadScript('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');
        pyodide = await window.loadPyodide();
      }
      setStatus('running…', 'run');
      let buf = '';
      pyodide.setStdout({ batched: (s) => { buf += s + '\n'; } });
      const t0 = performance.now();
      const res = await pyodide.runPythonAsync(code.value);
      const ms = Math.round(performance.now() - t0);
      out.textContent = buf || '(no output)';
      setStatus(`done in ${ms} ms · Pyodide ${pyodide.version}`, 'done');
      if (res && res.toJs) {
        const data = res.toJs({ dict_converter: Object.fromEntries });
        res.destroy?.();
        if (data && typeof data === 'object' && Object.values(data).every((v) => Array.isArray(v) && v.length === 2)) drawChart(data);
      }
    } catch (err) {
      out.textContent = String(err.message || err);
      setStatus(pyodide ? 'error in code' : 'could not load Python – check internet', 'err');
    } finally {
      runBtn.disabled = false;
    }
  });

  }

  // ---------- Quote form (lives on /contact.html) ----------
  // Buttons on other pages (pricing, projects, industries, ROI, readiness score, automation services)
  // save what the visitor picked and link to /contact.html, where the form is filled in for them.
  const form = $('#quoteForm');
  const note = $('#formNote');
  const PREFILL_KEY = 'wf_prefill';
  const KINDS = /^(ROI estimate|Automation readiness score|Interested in Level|Interested in: |Industry: )/;
  const applyPrefill = (d) => {
    if (!form || !d) return;
    if (d.text) {
      const kind = (d.text.match(KINDS) || [])[1];
      const lines = form.message.value.split('\n').filter((l) => l.trim() && !(kind && l.startsWith(kind)) && l !== d.text);
      form.message.value = [d.text, ...lines].join('\n');
    }
    (d.svcs || []).concat(d.project ? [d.project] : []).forEach((v) => {
      const box = $$('input[name=svc]', form).find((c) => c.value === v);
      if (box) box.checked = true;
    });
    if (d.size) form.size.value = d.size;
    if (d.package) form.package.value = d.package;
  };
  const prefill = (d) => {
    if (typeof d === 'string') d = { text: d };
    if (!d || (!d.text && !d.size && !d.project && !(d.svcs || []).length)) return;
    if (form) { applyPrefill(d); return; }
    try {
      const cur = JSON.parse(sessionStorage.getItem(PREFILL_KEY) || 'null') || {};
      const texts = (cur.text ? cur.text.split('\n') : []).filter((l) => {
        const kind = d.text && (d.text.match(KINDS) || [])[1];
        return l.trim() && !(kind && l.startsWith(kind)) && l !== d.text;
      });
      sessionStorage.setItem(PREFILL_KEY, JSON.stringify({
        text: [d.text, ...texts].filter(Boolean).join('\n'),
        project: d.project || cur.project || null,
        svcs: [...new Set([...(cur.svcs || []), ...(d.svcs || [])])],
        size: d.size || cur.size || '', package: d.package || cur.package || '',
      }));
    } catch (err) {}
  };
  window.WF.prefill = prefill;

  const roiBtn = $('#roiQuote');
  if (roiBtn) roiBtn.addEventListener('click', () => prefill(roiSummary));
  $$('[data-size]').forEach((b) => b.addEventListener('click', () => prefill({ size: b.dataset.size, package: b.dataset.package || '' })));
  // Live projects: "Get this for my business" ticks the matching checkbox
  $$('[data-project]').forEach((b) => b.addEventListener('click', () => {
    prefill({ text: `Interested in: ${b.dataset.project} (seen in your live projects).`, project: b.dataset.project });
  }));
  // Automation page: every service line ("n8n Workflow Automation", "Shopify Store"...) pre-fills the form
  $$('[data-interest]').forEach((b) => b.addEventListener('click', () => {
    prefill({ text: `Interested in: ${b.dataset.interest}.`, svcs: b.dataset.svc ? [b.dataset.svc] : [] });
    track('service_interest', { service: b.dataset.interest });
  }));
  // Live projects: screenshot lightbox
  const lb = $('#lightbox');
  if (lb && typeof lb.showModal === 'function') {
    const lbImg = $('img', lb);
    $$('.shot').forEach((b) => b.addEventListener('click', () => {
      const img = $('img', b);
      lbImg.src = b.dataset.full; lbImg.alt = img.alt;
      lb.showModal();
    }));
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target.closest('.lb-close')) lb.close(); });
  } else {
    $$('.shot').forEach((b) => b.addEventListener('click', () => window.open(b.dataset.full, '_blank', 'noopener')));
  }
  if (panel) panel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-level]');
    if (b) prefill(`Interested in Level ${b.dataset.level}: ${LEVELS[b.dataset.level - 1].name}.`);
  });

  if (form) {
  // what the visitor picked on another page (or in the Flash 5.0 chat)
  try {
    const pre = JSON.parse(sessionStorage.getItem(PREFILL_KEY) || 'null');
    if (pre) { applyPrefill(pre); sessionStorage.removeItem(PREFILL_KEY); }
  } catch (err) {}

  let via = 'whatsapp';
  $$('button[type=submit]', form).forEach((b) => b.addEventListener('click', () => { via = b.dataset.via; }));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const d = Object.fromEntries(fd);
    const svcs = fd.getAll('svc');
    const digits = (d.phone || '').replace(/\D/g, '').slice(-10);
    const okName = d.name.trim().length > 1, okPhone = /^[6-9]\d{9}$/.test(digits);
    form.name.classList.toggle('invalid', !okName);
    form.phone.classList.toggle('invalid', !okPhone);
    if (!okName || !okPhone) {
      note.className = 'form-note err';
      note.textContent = 'Please enter your name and a valid 10-digit mobile number.';
      return;
    }
    if (d.website) return; // spam bot filled the hidden field
    const msg = [
      'Hi Workflash Automation, I would like a quote.', '',
      `Name: ${d.name}`, `Mobile: ${d.phone}`,
      d.email && `Email: ${d.email}`, d.company && `Company: ${d.company}`,
      `Company size: ${d.size}`, `Package: ${d.package}`, `Timeline: ${d.timeline}`,
      `Interested in: ${svcs.length ? svcs.join(', ') : 'Not sure yet'}`,
      d.message && `\n${d.message}`,
    ].filter(Boolean).join('\n');
    // 1) save a copy of the enquiry in Google Sheets (fire-and-forget, never blocks WhatsApp)
    saveLead({
      form: 'Quote', name: d.name, phone: d.phone, email: d.email || '', company: d.company || '',
      size: d.size, package: d.package, timeline: d.timeline, services: svcs.join(', '), message: d.message || '',
      via, optin: d.optin ? 'yes' : '',
    });
    track('generate_lead', { method: via, company_size: d.size });
    // 2) open WhatsApp / email with the message ready to send
    if (via === 'email') {
      location.href = `mailto:${EMAIL}?subject=${encodeURIComponent('Quote request – ' + d.name + (d.company ? ' (' + d.company + ')' : ''))}&body=${encodeURIComponent(msg)}`;
    } else {
      window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    }
    note.className = 'form-note';
    note.textContent = 'Thank you! Your request is ready to send. We reply within 24 hours.';
  });

  }

  // ---------- Industries: "Plan for my industry" fills the quote form ----------
  $$('[data-industry]').forEach((b) => b.addEventListener('click', () => {
    prefill(`Industry: ${b.dataset.industry}.`);
    track('industry_click', { industry: b.dataset.industry });
  }));

  // ---------- Free checklist (lead magnet): name + mobile → Google Sheet → PDF download ----------
  const ck = $('#ckDialog');
  if (ck) {
    const ckForm = $('#ckForm', ck), ckNote = $('#ckNote', ck);
    const PDF = window.WF.CHECKLIST_PDF || '/assets/sme-automation-checklist.pdf';
    const download = () => {
      const a = document.createElement('a');
      a.href = PDF; a.download = 'Workflash-SME-Automation-Checklist.pdf';
      document.body.appendChild(a); a.click(); a.remove();
    };
    const done = (() => { try { return sessionStorage.getItem('wf_ck_done') === '1'; } catch (e) { return false; } });
    const openCk = () => {
      ck.classList.toggle('done', done());
      ckNote.textContent = ''; ckNote.className = 'form-note';
      if (typeof ck.showModal === 'function') ck.showModal(); else ck.setAttribute('open', '');
      track('checklist_open');
      if (!done()) setTimeout(() => ckForm.name.focus(), 60);
    };
    const closeCk = () => { if (ck.close) ck.close(); else ck.removeAttribute('open'); };
    $$('[data-checklist]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); openCk(); }));
    ck.addEventListener('click', (e) => { if (e.target === ck || e.target.closest('.ck-close')) closeCk(); });
    $('#ckAgain', ck).addEventListener('click', download);
    ckForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(ckForm));
      const digits = (d.phone || '').replace(/\D/g, '').slice(-10);
      const okName = (d.name || '').trim().length > 1, okPhone = /^[6-9]\d{9}$/.test(digits);
      ckForm.name.classList.toggle('invalid', !okName);
      ckForm.phone.classList.toggle('invalid', !okPhone);
      if (!okName || !okPhone) {
        ckNote.className = 'form-note err';
        ckNote.textContent = 'Please enter your name and a valid 10-digit mobile number.';
        return;
      }
      if (d.website) return; // spam bot
      saveLead({
        form: 'Checklist download', name: d.name, phone: d.phone, email: d.email || '', company: d.company || '',
        size: '', package: '', timeline: '', services: 'SME Automation Checklist (PDF)',
        message: 'Downloaded the free SME Automation Checklist', via: 'checklist', optin: d.optin ? 'yes' : '',
      });
      track('generate_lead', { method: 'checklist' });
      try { sessionStorage.setItem('wf_ck_done', '1'); } catch (err) {}
      download();
      ck.classList.add('done');
    });
  }

  // ---------- Motion (inspired by wipro.com) ----------
  // Headlines slide up word by word, cards appear one after another, a soft spotlight follows
  // the mouse, the hero drifts on scroll and the delivery timeline fills as you scroll.
  if (!reduceMotion) {
    // 1) headline word reveal
    const split = (h) => {
      if (!h || h.dataset.split) return;
      h.dataset.split = '1';
      h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
      let i = 0;
      const unit = (node) => {
        const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
        const inner = document.createElement('span'); inner.style.setProperty('--i', i++);
        inner.appendChild(node); w.appendChild(inner); return w;
      };
      [...h.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            frag.appendChild(/^\s+$/.test(part) ? document.createTextNode(' ') : unit(document.createTextNode(part)));
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          n.replaceWith(unit(n.cloneNode(true)));
        }
      });
      h.classList.add('split');
    };
    $$('.reveal h2, .head h2').forEach(split);
    const h1 = $('.hero h1');
    split(h1);
    setTimeout(() => h1 && h1.classList.add('in'), 150);

    // 2) stagger cards inside grids
    ['.svc-grid', '.tiers', '.projects', '.timeline', '.strip-grid', '.bento', '.explore-grid', '.ax-cols', '.ax-items'].forEach((sel) => $$(sel).forEach((g) => {
      $$(':scope > .reveal', g).forEach((el, k) => {
        el.style.transitionDelay = Math.min(k, 7) * 90 + 'ms';
        el.addEventListener('transitionend', () => { el.style.transitionDelay = ''; }, { once: true });
      });
    }));

    // 3) spotlight that follows the mouse + gentle 3D tilt on industry tiles
    if (canHover) {
      $$('.svc, .tier, .project, .ind').forEach((el) => el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        el.style.setProperty('--mx', x + 'px'); el.style.setProperty('--my', y + 'px');
        if (el.classList.contains('ind')) {
          el.style.setProperty('--ry', ((x / r.width) - .5) * 6 + 'deg');
          el.style.setProperty('--rx', (.5 - (y / r.height)) * 6 + 'deg');
        }
      }));
      $$('.ind').forEach((el) => el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); }));
    }

    // 4) hero drift + 5) timeline fill, in one scroll handler
    const heroCopy = $('.hero-copy'), heroVis = $('.hero-visual'), tl = $('.timeline');
    const steps = tl ? $$('li', tl) : [];
    let ticking = false;
    const onMotionScroll = () => {
      ticking = false;
      const y = scrollY;
      if (heroCopy && heroVis && innerWidth > 900 && y < innerHeight * 1.2) {
        heroCopy.style.translate = `0 ${y * 0.16}px`;
        heroCopy.style.opacity = Math.max(0, 1 - y / (innerHeight * 0.95)).toFixed(3);
        heroVis.style.translate = `0 ${y * 0.07}px`;
      } else if (heroCopy && heroVis && innerWidth <= 900) {
        heroCopy.style.translate = heroVis.style.translate = heroCopy.style.opacity = '';
      }
      if (tl) {
        const r = tl.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (innerHeight * 0.55)));
        tl.style.setProperty('--tl', p.toFixed(3));
        steps.forEach((li, k) => li.classList.toggle('done', p >= (k + 0.6) / steps.length));
      }
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onMotionScroll); } }, { passive: true });
    onMotionScroll();
  }
})();
