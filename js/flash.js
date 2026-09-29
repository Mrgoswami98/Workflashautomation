// =========================================================
// Flash 5.0 – Workflash Automation chat assistant
// AI mode: talks through the Google Apps Script endpoint (any language).
// Offline mode: guided problem finder in English, Hindi and Hinglish.
// =========================================================
(() => {
  const WF = window.WF || {};
  const ENDPOINT = WF.CHAT_ENDPOINT || WF.FORM_ENDPOINT || '';
  const WA = WF.WA_NUMBER || '919354676636';
  const PATH = location.pathname;
  const IS_HOME = PATH === '/' || /\/index\.html$/.test(PATH);
  const QUOTE = IS_HOME ? '#quote' : '/#quote';
  const MAX_HISTORY = 12;

  // ---------- storage (per browser tab session) ----------
  const KEY = 'flash5';
  const load = () => { try { return JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { return null; } };
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const rid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
  let S = load() || { sid: rid(), msgs: [], lang: null, topic: null, size: null, open: false, aiOff: !ENDPOINT, teased: false };
  if (!ENDPOINT) S.aiOff = true;

  // ---------- language ----------
  const detectLang = (t) => {
    if (/[ऀ-ॿ]/.test(t)) return 'hi';
    if (/[ঀ-෿؀-ۿ฀-࿿぀-鿿가-힯Ѐ-ӿ]/.test(t)) return 'other';
    if (/\b(hai|hain|ho|kya|kyu|kyun|nahi|nhi|nahin|mujhe|muje|hume|humein|chahiye|chaiye|karna|karni|karte|kaise|kitna|kitne|mera|meri|mere|hamara|hamari|humara|kaam|bhai|ji|aap|apka|aapka|batao|bataiye|bataye|hota|hoti|wala|wali|raha|rahi|rahe|sakta|sakte|dikkat|pareshani|samasya|problem hai)\b/i.test(t)) return 'hx';
    return 'en';
  };
  const L = () => (S.lang === 'hi' || S.lang === 'hx' ? S.lang : 'en');

  // ---------- knowledge for offline mode ----------
  const PKG = {
    basic: { en: 'Basic', price: '₹15,000 – ₹40,000' },
    medium: { en: 'Medium', price: '₹50,000 – ₹1,50,000' },
    advanced: { en: 'Advanced', price: '₹1,50,000 – ₹5,00,000+' },
  };
  const TOPICS = {
    leads: {
      re: /lead|enquir|inquir|india ?mart|just ?dial|meta ad|facebook ad|follow ?-?up|customer|client|sales|crm|conversion|लीड|ग्राहक|फॉलो|बिक्री|सेल्स|इन्क्वायरी|पूछताछ/i,
      project: 'Sales CRM', pkg: 'medium', link: '/services/crm-lead-automation.html',
      title: { en: 'Sales CRM with automatic lead follow-up', hx: 'Sales CRM + automatic lead follow-up', hi: 'सेल्स CRM + ऑटोमैटिक लीड फॉलो-अप' },
      pts: {
        en: ['IndiaMART, JustDial, Meta and website leads land in one CRM automatically', 'Each lead is assigned to a salesperson and gets an instant WhatsApp reply', 'Follow-up reminders, quotation → order → dispatch tracking and a daily report on WhatsApp'],
        hx: ['IndiaMART, JustDial, Meta aur website ki saari leads apne aap ek CRM mein', 'Har lead salesperson ko assign hoti hai aur turant WhatsApp reply jaata hai', 'Follow-up reminders, quotation → order → dispatch tracking aur roz ki report WhatsApp par'],
        hi: ['IndiaMART, JustDial, Meta और वेबसाइट की सारी लीड अपने आप एक CRM में', 'हर लीड सेल्सपर्सन को असाइन होती है और तुरंत WhatsApp पर जवाब जाता है', 'फॉलो-अप रिमाइंडर, कोटेशन → ऑर्डर → डिस्पैच ट्रैकिंग और रोज़ की रिपोर्ट WhatsApp पर'],
      },
    },
    tasks: {
      re: /task|delegat|deadline|pending|employee|staff|team|kaam|kam nahi|work not|accountab|time par nahi|टास्क|काम|कर्मचारी|स्टाफ|डेडलाइन|समय पर/i,
      project: 'Delegation Software', pkg: 'medium', link: '/#projects',
      title: { en: 'Delegation Software for team tasks', hx: 'Team ke kaam ke liye Delegation Software', hi: 'टीम के काम के लिए डेलिगेशन सॉफ्टवेयर' },
      pts: {
        en: ['Assign tasks with deadlines in seconds', 'Automatic follow-ups, so you stop chasing people', 'Weekly MIS score per employee: on time, revised once or twice, overdue'],
        hx: ['Deadline ke saath task seconds mein assign karein', 'Follow-up apne aap hota hai, aapko baar-baar poochna nahi padta', 'Har employee ka weekly MIS score: time par, ek/do baar revise, overdue'],
        hi: ['डेडलाइन के साथ टास्क सेकंडों में असाइन करें', 'फॉलो-अप अपने आप होता है, आपको बार-बार पूछना नहीं पड़ता', 'हर कर्मचारी का साप्ताहिक MIS स्कोर: समय पर, रिवाइज़, ओवरड्यू'],
      },
    },
    attendance: {
      re: /attendance|hazri|haziri|salary|payroll|leave|punch|late|absent|chhutti|chutti|छुट्टी|हाजिरी|हाज़िरी|सैलरी|वेतन|अटेंडेंस|तनख्वाह/i,
      project: 'Attendance System', pkg: 'medium', link: '/#projects',
      title: { en: 'Attendance, leave & salary system', hx: 'Attendance, leave aur salary system', hi: 'अटेंडेंस, छुट्टी और सैलरी सिस्टम' },
      pts: {
        en: ['Staff punch in and out; late, half-day and absent are marked automatically', 'Leave requests and approvals in one place', 'Monthly salary and payout calculated from attendance'],
        hx: ['Staff punch in/out karta hai; late, half-day, absent apne aap mark', 'Leave request aur approval ek jagah', 'Attendance se monthly salary aur payout apne aap calculate'],
        hi: ['स्टाफ पंच इन/आउट करता है; लेट, हाफ-डे, एब्सेंट अपने आप दर्ज', 'छुट्टी की रिक्वेस्ट और अप्रूवल एक जगह', 'अटेंडेंस से मासिक सैलरी और पेआउट अपने आप'],
      },
    },
    inventory: {
      re: /inventory|stock|purchase|vendor|supplier|raw material|godown|warehouse|maal|rate badh|rate increase|माल|स्टॉक|खरीद|वेंडर|गोदाम|इन्वेंटरी|सप्लायर/i,
      project: 'Smart Inventory Controller', pkg: 'medium', link: '/#projects',
      title: { en: 'Smart Inventory Controller', hx: 'Smart Inventory Controller', hi: 'स्मार्ट इन्वेंटरी कंट्रोलर' },
      pts: {
        en: ['Live stock and valuation from your purchase data', 'Alerts when a vendor charges above the approved rate, with the extra cost in ₹', 'Bulk import from Excel and one-click reports'],
        hx: ['Purchase data se live stock aur valuation', 'Vendor approved rate se zyada lagaye to alert, extra cost ₹ mein', 'Excel se bulk import aur ek click mein reports'],
        hi: ['खरीद के डेटा से लाइव स्टॉक और वैल्यूएशन', 'वेंडर तय रेट से ज़्यादा ले तो अलर्ट, अतिरिक्त खर्च ₹ में', 'Excel से बल्क इम्पोर्ट और एक क्लिक में रिपोर्ट'],
      },
    },
    reports: {
      re: /report|\bmis\b|dashboard|excel|sheet|analysis|analytics|power ?bi|hisab|hisaab|numbers|रिपोर्ट|डैशबोर्ड|हिसाब|डेटा|एक्सेल/i,
      project: null, pkg: 'medium', link: '/services/mis-dashboards-reporting.html',
      title: { en: 'Automatic MIS reports & live dashboards', hx: 'Automatic MIS reports aur live dashboard', hi: 'ऑटोमैटिक MIS रिपोर्ट और लाइव डैशबोर्ड' },
      pts: {
        en: ['Sales, lead, call and incentive reports that build themselves', 'Live dashboards in Google Sheets, Excel or Power BI', "Yesterday's numbers on your WhatsApp every morning"],
        hx: ['Sales, lead, call aur incentive reports jo apne aap banti hain', 'Google Sheets, Excel ya Power BI mein live dashboard', 'Kal ke numbers har subah aapke WhatsApp par'],
        hi: ['सेल्स, लीड, कॉल और इंसेंटिव रिपोर्ट जो अपने आप बनती हैं', 'Google Sheets, Excel या Power BI में लाइव डैशबोर्ड', 'कल के आंकड़े हर सुबह आपके WhatsApp पर'],
      },
    },
    whatsapp: {
      re: /whats ?app|reply|replies|message|chat ?bot|broadcast|catalog|व्हाट्सएप|व्हाट्सऐप|मैसेज|जवाब/i,
      project: null, pkg: 'basic', link: '/services/whatsapp-automation.html',
      title: { en: 'WhatsApp automation & chatbot', hx: 'WhatsApp automation aur chatbot', hi: 'WhatsApp ऑटोमेशन और चैटबॉट' },
      pts: {
        en: ['Instant replies with price list, catalogue and FAQs, 24/7', 'Leads saved automatically to your Sheet or CRM', 'Payment reminders and follow-up messages on schedule'],
        hx: ['Price list, catalogue aur FAQs ke instant replies, 24/7', 'Leads apne aap Sheet ya CRM mein save', 'Payment reminder aur follow-up messages time par'],
        hi: ['प्राइस लिस्ट, कैटलॉग और सवालों के तुरंत जवाब, 24/7', 'लीड अपने आप Sheet या CRM में सेव', 'पेमेंट रिमाइंडर और फॉलो-अप मैसेज समय पर'],
      },
    },
    ai: {
      re: /\bai\b|agent|gpt|chatgpt|artificial|machine learning|एआई/i,
      project: null, pkg: 'advanced', link: '/services/ai-agents.html',
      title: { en: 'Custom AI agent for your business', hx: 'Aapke business ke liye custom AI agent', hi: 'आपके बिज़नेस के लिए कस्टम AI एजेंट' },
      pts: {
        en: ['Answers customers in their language, trained on your business', 'Drafts quotations and reads invoices and PDFs', 'Important actions still wait for a person to approve'],
        hx: ['Customer ko unki bhasha mein jawab, aapke business par trained', 'Quotation draft karta hai, invoice aur PDF padhta hai', 'Zaroori kaam par aakhri approval insaan ka'],
        hi: ['ग्राहकों को उनकी भाषा में जवाब, आपके बिज़नेस पर ट्रेन्ड', 'कोटेशन ड्राफ्ट करता है, इनवॉइस और PDF पढ़ता है', 'ज़रूरी काम पर आख़िरी मंज़ूरी इंसान की'],
      },
    },
  };
  const RE_PRICE = /price|cost|kitna|kitne|charges?|budget|fees?|pricing|paisa|kharcha|कीमत|खर्च|कितना|कितने|दाम|फीस|चार्ज/i;
  const RE_HUMAN = /call|talk to|contact|number|phone|baat kar|human|person|insaan|address|office|location|kahan ho|kaha ho|instagram|insta|बात|कॉल|संपर्क|नंबर|पता|ऑफिस/i;
  const RE_GREET = /^\s*(hi+|hello|hey|namaste|namaskar|hola|good (morning|evening|afternoon)|नमस्ते|नमस्कार|हेलो|हाय)\b/i;
  const RE_THANKS = /thank|thanks|shukriya|dhanyavad|धन्यवाद|शुक्रिया/i;

  const T = {
    greet: {
      en: "Hi, I'm **Flash 5.0**, Workflash Automation's assistant.\nTell me what is slowing your business down, in any language, and I'll suggest the right solution.",
      hx: 'Namaste! Main **Flash 5.0** hoon, Workflash Automation ka assistant.\nBataiye aapke business mein kya pareshani aa rahi hai, kisi bhi bhasha mein. Main sahi solution bataunga.',
      hi: 'नमस्ते! मैं **Flash 5.0** हूँ, Workflash Automation का असिस्टेंट।\nबताइए आपके बिज़नेस में क्या परेशानी आ रही है, किसी भी भाषा में। मैं सही समाधान बताऊँगा।',
    },
    solution: { en: 'Here is what I would suggest:', hx: 'Iske liye mera suggestion:', hi: 'इसके लिए मेरा सुझाव:' },
    live: { en: 'Live example', hx: 'Live example', hi: 'लाइव उदाहरण' },
    askSize: { en: 'How many people work in your business? This helps me suggest the right package.', hx: 'Aapke business mein kitne log kaam karte hain? Isse main sahi package bata paunga.', hi: 'आपके बिज़नेस में कितने लोग काम करते हैं? इससे मैं सही पैकेज बता पाऊँगा।' },
    sizes: { en: ['1–20 people', '20–500 people', '500+ people'], hx: ['1–20 log', '20–500 log', '500+ log'], hi: ['1–20 लोग', '20–500 लोग', '500+ लोग'] },
    pkg: { en: 'Suggested package', hx: 'Suggested package', hi: 'सुझाया गया पैकेज' },
    pkgNote: { en: 'One-time setup, excluding GST. You get a fixed quote after a free audit.', hx: 'One-time setup, GST alag. Free audit ke baad fixed quote milega.', hi: 'एक बार का सेटअप, GST अलग। फ्री ऑडिट के बाद फिक्स कोटेशन मिलेगा।' },
    next: { en: 'Want a free automation plan? Message us on WhatsApp or fill the quote form. Our team replies within 24 hours.', hx: 'Free automation plan chahiye? WhatsApp par message kariye ya quote form bhariye. Team 24 ghante mein reply karti hai.', hi: 'फ्री ऑटोमेशन प्लान चाहिए? WhatsApp पर मैसेज करें या कोटेशन फॉर्म भरें। टीम 24 घंटे में जवाब देती है।' },
    pricing: {
      en: 'Our packages (one-time setup, excluding GST):\n- **Basic**: ₹15,000 – ₹40,000 (WhatsApp replies, Sheets tracker, reminders)\n- **Medium**: ₹50,000 – ₹1,50,000 (CRM, delegation, attendance, inventory, dashboards)\n- **Advanced**: ₹1,50,000 – ₹5,00,000+ (AI agents, multi-department automation)\nTell me your problem and I will tell you which one fits.',
      hx: 'Hamare packages (one-time setup, GST alag):\n- **Basic**: ₹15,000 – ₹40,000 (WhatsApp replies, Sheets tracker, reminders)\n- **Medium**: ₹50,000 – ₹1,50,000 (CRM, delegation, attendance, inventory, dashboards)\n- **Advanced**: ₹1,50,000 – ₹5,00,000+ (AI agents, multi-department automation)\nApni pareshani bataiye, main bataunga kaunsa sahi rahega.',
      hi: 'हमारे पैकेज (एक बार का सेटअप, GST अलग):\n- **Basic**: ₹15,000 – ₹40,000 (WhatsApp जवाब, Sheets ट्रैकर, रिमाइंडर)\n- **Medium**: ₹50,000 – ₹1,50,000 (CRM, डेलिगेशन, अटेंडेंस, इन्वेंटरी, डैशबोर्ड)\n- **Advanced**: ₹1,50,000 – ₹5,00,000+ (AI एजेंट, कई विभागों का ऑटोमेशन)\nअपनी परेशानी बताइए, मैं बताऊँगा कौन-सा सही रहेगा।',
    },
    human: { en: 'Sure. Tap **WhatsApp us** below, call us on **+91 93546 76636**, or email Workflashspace@gmail.com.\nHead office: Kirari, Nangloi, Delhi – 110086 · Instagram: @workflash.tech', hx: 'Bilkul. Neeche **WhatsApp us** dabaiye, **+91 93546 76636** par call kariye, ya email: Workflashspace@gmail.com\nHead office: Kirari, Nangloi, Delhi – 110086 · Instagram: @workflash.tech', hi: 'ज़रूर। नीचे **WhatsApp us** दबाएँ, **+91 93546 76636** पर कॉल करें, या ईमेल: Workflashspace@gmail.com\nहेड ऑफिस: किराड़ी, नांगलोई, दिल्ली – 110086 · Instagram: @workflash.tech' },
    unknown: { en: "I want to understand this properly. Which of these is closest to your problem? Or describe it in a little more detail.", hx: 'Main ise sahi se samajhna chahta hoon. Inmein se kaunsi pareshani sabse kareeb hai? Ya thoda aur detail mein bataiye.', hi: 'मैं इसे ठीक से समझना चाहता हूँ। इनमें से कौन-सी परेशानी सबसे करीब है? या थोड़ा और विस्तार से बताइए।' },
    other: { en: "I understand English, Hindi and Hinglish best right now, so I'm replying in English. For help in your language, message our team on WhatsApp.", hx: '', hi: '' },
    thanks: { en: 'Happy to help! Anything else about your business I can help with?', hx: 'Khushi hui madad karke! Business mein aur koi pareshani?', hi: 'मदद करके खुशी हुई! बिज़नेस में और कोई परेशानी?' },
    error: { en: "Sorry, I couldn't connect just now. Please try again, or message us on WhatsApp.", hx: 'Maaf kijiye, abhi connect nahi ho paya. Dobara try kariye ya WhatsApp par message kariye.', hi: 'माफ़ कीजिए, अभी कनेक्ट नहीं हो पाया। दोबारा कोशिश करें या WhatsApp पर मैसेज करें।' },
    placeholder: { en: 'Type your problem, any language…', hx: 'Apni pareshani likhiye…', hi: 'अपनी परेशानी लिखिए…' },
  };
  const PROBLEM_CHIPS = [
    'Leads miss ho rahe hain / follow-up nahi hota',
    'Team ka kaam time par nahi hota',
    'Attendance aur salary ka hisaab',
    'Stock aur purchase rate control',
    'Reports banane mein bahut time lagta hai',
    'WhatsApp par replies late jaate hain',
  ];

  // ---------- DOM ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (s) => {
    let h = esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    h = h.replace(/(https:\/\/(?:workflash\.in|wa\.me)\/[^\s<]*)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    const lines = h.split('\n');
    let out = '', inList = false;
    lines.forEach((ln) => {
      const m = ln.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)$/);
      if (m) { if (!inList) { out += '<ul>'; inList = true; } out += `<li>${m[1]}</li>`; }
      else { if (inList) { out += '</ul>'; inList = false; } if (ln.trim()) out += `<p>${ln}</p>`; }
    });
    if (inList) out += '</ul>';
    return out;
  };
  const BOLT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="currentColor"/></svg>';
  const root = document.createElement('div');
  root.className = 'flash';
  root.innerHTML = `
    <button class="flash-launch" type="button" aria-controls="flashPanel" aria-expanded="false">
      <span class="flash-launch-ic">${BOLT}</span><span class="flash-launch-txt"><b>Flash 5.0</b><small>Ask me anything</small></span>
    </button>
    <div class="flash-tease" hidden><button type="button" class="flash-tease-x" aria-label="Dismiss">×</button><span>Business mein koi pareshani? <b>Flash 5.0</b> se poochiye.</span></div>
    <section class="flash-panel" id="flashPanel" role="dialog" aria-label="Flash 5.0 chat assistant" hidden>
      <header class="flash-head">
        <span class="flash-avatar">${BOLT}</span>
        <div class="flash-title"><b>Flash 5.0</b><small><i class="live"></i>AI assistant · any language</small></div>
        <button type="button" class="flash-icon flash-reset" title="Start a new chat" aria-label="Start a new chat"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <button type="button" class="flash-icon flash-close" aria-label="Close chat"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
      </header>
      <div class="flash-log" aria-live="polite"></div>
      <div class="flash-chips"></div>
      <div class="flash-actions">
        <a class="flash-wa" target="_blank" rel="noopener" href="https://wa.me/${WA}">WhatsApp us</a>
        <a class="flash-quote" href="${QUOTE}">Get a free quote</a>
      </div>
      <form class="flash-form">
        <textarea rows="1" maxlength="1000" aria-label="Message Flash 5.0"></textarea>
        <button type="submit" aria-label="Send"><svg viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      </form>
      <p class="flash-note">Flash 5.0 is an AI assistant and can make mistakes. Chats may be saved to help our team reply. <a href="/privacy.html">Privacy</a></p>
    </section>`;
  document.body.appendChild(root);
  document.body.classList.add('has-flash');
  const $ = (s) => root.querySelector(s);
  const panel = $('.flash-panel'), log = $('.flash-log'), chips = $('.flash-chips'), input = $('textarea'), launch = $('.flash-launch'), tease = $('.flash-tease');

  // ---------- rendering ----------
  const cardHTML = (c) => `<div class="flash-card">
      <b class="fc-title">${esc(c.title)}</b>
      <ul>${c.pts.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
      ${c.project ? `<a class="fc-live" href="${IS_HOME ? '#projects' : '/#projects'}"><i class="live"></i>${esc(c.liveLabel)}: ${esc(c.project)}</a>` : ''}
      ${c.link && c.link !== '/#projects' ? `<a class="fc-more" href="${c.link}">Learn more →</a>` : ''}
    </div>`;
  const pkgHTML = (p) => `<div class="flash-card flash-pkg"><small>${esc(p.label)}</small><b>${esc(p.name)}</b><strong>${esc(p.price)}</strong><span>${esc(p.note)}</span></div>`;
  const render = () => {
    log.innerHTML = S.msgs.map((m) => {
      if (m.role === 'user') return `<div class="fm fm-user"><div class="fb">${esc(m.text)}</div></div>`;
      return `<div class="fm fm-bot"><span class="fm-av">${BOLT}</span><div class="fb">${m.text ? fmt(m.text) : ''}${m.card ? cardHTML(m.card) : ''}${m.pkg ? pkgHTML(m.pkg) : ''}</div></div>`;
    }).join('');
    const last = S.msgs[S.msgs.length - 1];
    chips.innerHTML = (last && last.role === 'assistant' && last.chips ? last.chips : []).map((c) => `<button type="button">${esc(c)}</button>`).join('');
    input.placeholder = T.placeholder[L()];
    updateLinks();
    log.scrollTop = log.scrollHeight;
  };
  const typing = (on) => {
    const t = log.querySelector('.fm-typing');
    if (on && !t) { log.insertAdjacentHTML('beforeend', `<div class="fm fm-bot fm-typing"><span class="fm-av">${BOLT}</span><div class="fb"><i></i><i></i><i></i></div></div>`); log.scrollTop = log.scrollHeight; }
    if (!on && t) t.remove();
  };
  const say = (m) => { S.msgs.push({ role: 'assistant', ...m }); save(); render(); };

  // summary for WhatsApp / quote form
  const summary = () => {
    const firstUser = S.msgs.find((m) => m.role === 'user');
    const problem = S.problem || (firstUser && firstUser.text);
    const bits = ['Hi Workflash, I chatted with Flash 5.0 on your website.'];
    if (problem) bits.push('Problem: ' + problem.slice(0, 300));
    if (S.topic && TOPICS[S.topic]) bits.push('Suggested: ' + TOPICS[S.topic].title.en);
    if (S.size) bits.push('Team size: ' + S.size);
    return bits.join('\n');
  };
  const updateLinks = () => { $('.flash-wa').href = `https://wa.me/${WA}?text=${encodeURIComponent(summary())}`; };
  $('.flash-quote').addEventListener('click', (e) => {
    const form = document.getElementById('quoteForm');
    if (form && form.message) {
      const s = summary();
      if (!form.message.value.includes('Flash 5.0')) form.message.value = s + (form.message.value ? '\n' + form.message.value : '');
      if (S.topic && TOPICS[S.topic].project) {
        const box = [...form.querySelectorAll('input[name=svc]')].find((c) => c.value === TOPICS[S.topic].project);
        if (box) box.checked = true;
      }
      setOpen(false);
    } else {
      try { sessionStorage.setItem('wf_prefill', JSON.stringify({ text: summary(), project: S.topic ? TOPICS[S.topic].project : null })); } catch (err) {}
    }
    if (window.WF && WF.track) WF.track('flash_quote_click');
  });
  $('.flash-wa').addEventListener('click', () => { if (window.WF && WF.track) WF.track('contact', { method: 'whatsapp_flash' }); });

  // ---------- offline brain ----------
  const pickTopic = (t) => {
    let best = null, score = 0;
    Object.entries(TOPICS).forEach(([k, v]) => {
      const n = (t.match(new RegExp(v.re.source, 'gi')) || []).length;
      if (n > score) { score = n; best = k; }
    });
    return best;
  };
  const sizeToPkg = (i) => (i === 0 ? 'basic' : i === 1 ? 'medium' : 'advanced');
  const offlineReply = (text) => {
    const lang = L();
    const note = S.lang === 'other' ? T.other.en + '\n\n' : '';
    const sizeIdx = [T.sizes.en, T.sizes.hx, T.sizes.hi].map((a) => a.indexOf(text)).find((i) => i >= 0);
    if (sizeIdx !== undefined) {
      S.size = T.sizes.en[sizeIdx];
      let key = sizeToPkg(sizeIdx);
      const topicPkg = S.topic ? TOPICS[S.topic].pkg : null;
      if (topicPkg === 'advanced' && key !== 'advanced') key = 'medium';
      const p = PKG[key];
      const extra = key === 'basic' && topicPkg === 'medium'
        ? { en: 'For a small team we usually start with a simpler Google Sheets version, then upgrade as you grow.', hx: 'Chhoti team ke liye hum pehle simple Google Sheets version se shuru karte hain, phir zaroorat ke hisaab se upgrade.', hi: 'छोटी टीम के लिए हम पहले आसान Google Sheets वर्ज़न से शुरू करते हैं, फिर ज़रूरत के हिसाब से अपग्रेड।' }[lang]
        : '';
      say({ text: note + (extra ? extra + '\n' : ''), pkg: { label: T.pkg[lang], name: p.en, price: p.price, note: T.pkgNote[lang] } });
      say({ text: T.next[lang] });
      return;
    }
    if (RE_HUMAN.test(text)) { say({ text: note + T.human[lang] }); return; }
    const topic = pickTopic(text);
    if (topic) {
      S.topic = topic; S.problem = text;
      const tp = TOPICS[topic];
      say({ text: note + T.solution[lang], card: { title: tp.title[lang], pts: tp.pts[lang], project: tp.project, liveLabel: T.live[lang], link: tp.link } });
      say({ text: T.askSize[lang], chips: T.sizes[lang] });
      return;
    }
    if (RE_PRICE.test(text)) { say({ text: note + T.pricing[lang], chips: PROBLEM_CHIPS }); return; }
    if (RE_THANKS.test(text)) { say({ text: note + T.thanks[lang] }); return; }
    if (RE_GREET.test(text)) { say({ text: T.greet[lang], chips: PROBLEM_CHIPS }); return; }
    say({ text: note + T.unknown[lang], chips: PROBLEM_CHIPS });
  };

  // ---------- AI brain (via Apps Script) ----------
  const aiReply = async () => {
    const history = S.msgs.filter((m) => m.text || m.card).slice(-MAX_HISTORY).map((m) => ({
      role: m.role,
      content: (m.text || '') + (m.card ? `\n[Suggested: ${m.card.title}]` : '') + (m.pkg ? `\n[Package: ${m.pkg.name} ${m.pkg.price}]` : ''),
    }));
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 45000);
    try {
      const res = await fetch(ENDPOINT, { method: 'POST', body: JSON.stringify({ action: 'chat', sid: S.sid, page: location.href, messages: history }), signal: ctrl.signal });
      const data = await res.json();
      if (data && data.ok && data.reply) return { ok: true, reply: data.reply };
      return { ok: false, reason: (data && data.reason) || 'error' };
    } catch (e) {
      return { ok: false, reason: 'network' };
    } finally { clearTimeout(timer); }
  };

  // save offline-mode chats to the Google Sheet (fire-and-forget)
  const logOffline = (text, replies) => {
    if (!ENDPOINT) return;
    const bot = replies.map((m) => [m.text, m.card && ('[' + m.card.title + ']'), m.pkg && ('[' + m.pkg.name + ' ' + m.pkg.price + ']')].filter(Boolean).join(' ')).join(' | ');
    try { fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', keepalive: true, body: JSON.stringify({ action: 'log', sid: S.sid, page: location.href, user: text, bot }) }); } catch (e) {}
  };

  let busy = false;
  const send = async (text) => {
    text = String(text || '').trim().slice(0, 1000);
    if (!text || busy) return;
    const lang = detectLang(text);
    // switch back to English only on a real sentence, so 'ok' / 'yes' don't flip the language
    if (lang !== 'en' || !S.lang || text.length > 14) S.lang = lang;
    S.msgs.push({ role: 'user', text });
    save(); render();
    input.value = ''; input.style.height = '';
    busy = true; typing(true);
    if (!S.aiOff) {
      const r = await aiReply();
      typing(false);
      if (r.ok) {
        const t = pickTopic(text); if (t) { S.topic = t; S.problem = text; } else if (!S.problem && text.length > 15) S.problem = text;
        say({ text: r.reply });
        busy = false; return;
      }
      if (r.reason === 'ai_not_configured') { S.aiOff = true; save(); }
      else if (r.reason === 'rate_limited' || r.reason === 'daily_limit') { say({ text: T.human[L()] }); busy = false; return; }
    }
    await new Promise((res) => setTimeout(res, 450));
    typing(false);
    const before = S.msgs.length;
    offlineReply(text);
    logOffline(text, S.msgs.slice(before));
    busy = false;
  };

  // ---------- open / close ----------
  const setOpen = (open) => {
    S.open = open; save();
    panel.hidden = !open;
    root.classList.toggle('is-open', open);
    launch.setAttribute('aria-expanded', open);
    tease.hidden = true;
    if (open) {
      if (!S.msgs.length) say({ text: T.greet.en + '\n' + 'Aap Hindi, English ya kisi bhi bhasha mein likh sakte hain.', chips: PROBLEM_CHIPS });
      else render();
      if (window.matchMedia('(min-width: 641px)').matches) setTimeout(() => input.focus(), 50);
      if (window.WF && WF.track) WF.track('flash_open');
    }
  };
  launch.addEventListener('click', () => setOpen(panel.hidden));
  $('.flash-close').addEventListener('click', () => setOpen(false));
  $('.flash-reset').addEventListener('click', () => {
    S = { sid: rid(), msgs: [], lang: null, topic: null, size: null, open: true, aiOff: S.aiOff, teased: true };
    save(); setOpen(true);
  });
  chips.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) send(b.textContent); });
  $('.flash-form').addEventListener('submit', (e) => { e.preventDefault(); send(input.value); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input.value); } });
  input.addEventListener('input', () => { input.style.height = ''; input.style.height = Math.min(input.scrollHeight, 110) + 'px'; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) setOpen(false); });
  $('.flash-tease-x').addEventListener('click', () => { tease.hidden = true; });
  tease.addEventListener('click', (e) => { if (!e.target.closest('.flash-tease-x')) setOpen(true); });

  if (S.open) setOpen(true);
  else if (!S.teased) {
    setTimeout(() => { if (panel.hidden) { tease.hidden = false; S.teased = true; save(); } }, 20000);
  }
})();
