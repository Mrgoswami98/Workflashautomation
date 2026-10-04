// =========================================================
// Workflash Automation – shared settings & scripts (all pages)
// =========================================================
window.WF = {
  // ---------- Site settings (fill these in, see README) ----------
  WA_NUMBER: '919354676636',            // WhatsApp number with country code
  EMAIL: 'Workflashspace@gmail.com',
  // Google Apps Script web-app URL that saves every enquiry into a Google Sheet.
  // Leave empty to only use WhatsApp / email.  e.g. 'https://script.google.com/macros/s/XXXX/exec'
  FORM_ENDPOINT: 'https://script.google.com/macros/s/AKfycbz7hONANJgrZfHiyx0gPuIHuhvhOzV66KI9RNr1YGeE8CPpqKB4bnDuYPhmAXoazbM/exec',
  // Flash 5.0 chat uses the same Apps Script URL. Only fill this if you deploy a separate script for chat.
  CHAT_ENDPOINT: '',
  // Google Analytics 4 Measurement ID, e.g. 'G-ABC123XYZ'. Leave empty to disable.
  GA4_ID: 'G-NGHRRHJLE9',
  // Meta (Facebook/Instagram) Pixel ID, e.g. '123456789012345'. Leave empty to disable.
  META_PIXEL_ID: '',
  // Free lead magnet (downloaded after the visitor leaves name + mobile)
  CHECKLIST_PDF: '/assets/sme-automation-checklist.pdf',
};

(() => {
  const WF = window.WF;
  const ls = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const ss = {
    get(k) { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const isHome = !!document.getElementById('home');
  const home = (hash) => (isHome ? hash : '/' + hash);   // '#quote' on the home page, '/#quote' elsewhere

  // =========================================================
  // Cookie consent (Google Consent Mode v2)
  // GA4 always loads, but only stores cookies after "Accept";
  // before that it sends cookieless pings. Meta Pixel loads only after consent.
  // =========================================================
  const CONSENT_KEY = 'wf_consent_v1';
  let consent = ls.get(CONSENT_KEY);           // { analytics: bool, marketing: bool, at: ISO }
  const gstate = (c) => ({
    analytics_storage: c && c.analytics ? 'granted' : 'denied',
    ad_storage: c && c.marketing ? 'granted' : 'denied',
    ad_user_data: c && c.marketing ? 'granted' : 'denied',
    ad_personalization: c && c.marketing ? 'granted' : 'denied',
  });

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  if (WF.GA4_ID) {
    window.gtag('consent', 'default', Object.assign(gstate(consent), { wait_for_update: 500 }));
    const s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + WF.GA4_ID;
    document.head.appendChild(s);
    window.gtag('js', new Date());
    window.gtag('config', WF.GA4_ID);
  }
  let pixelOn = false;
  const loadPixel = () => {
    if (pixelOn || !WF.META_PIXEL_ID) return;
    pixelOn = true;
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', WF.META_PIXEL_ID);
    window.fbq('track', 'PageView');
  };
  if (consent && consent.marketing) loadPixel();

  const saveConsent = (c) => {
    consent = { analytics: !!c.analytics, marketing: !!c.marketing, at: new Date().toISOString() };
    ls.set(CONSENT_KEY, consent);
    if (WF.GA4_ID) window.gtag('consent', 'update', gstate(consent));
    if (consent.marketing) loadPixel();
    if (consent.analytics) persistAttribution();
  };

  WF.track = (name, params = {}) => {
    try { if (window.gtag && WF.GA4_ID) window.gtag('event', name, params); } catch (e) {}
    try { if (window.fbq && name === 'generate_lead') window.fbq('track', 'Lead', params); } catch (e) {}
    try { if (window.fbq && name === 'contact') window.fbq('track', 'Contact', params); } catch (e) {}
  };
  // WhatsApp / phone / email clicks
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const h = a.getAttribute('href');
    if (h.startsWith('https://wa.me')) WF.track('contact', { method: 'whatsapp' });
    else if (h.startsWith('tel:')) WF.track('contact', { method: 'phone' });
    else if (h.startsWith('mailto:')) WF.track('contact', { method: 'email' });
  });

  // =========================================================
  // Lead source tracking (UTM, Google/Meta click IDs, landing page)
  // Sent with every form so the Google Sheet shows which ad/campaign brought the lead.
  // Kept for this visit (sessionStorage); remembered across visits only after cookie consent.
  // =========================================================
  const ATTR_KEY = 'wf_attr_v1';
  const q = new URLSearchParams(location.search);
  const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  const touch = {};
  UTM.forEach((k) => { const v = q.get(k); if (v) touch[k] = v.slice(0, 150); });
  const clickId = q.get('gclid') ? 'gclid:' + q.get('gclid') : q.get('fbclid') ? 'fbclid:' + q.get('fbclid') : '';
  if (clickId) touch.click_id = clickId.slice(0, 200);
  let extRef = '';
  try { if (document.referrer && new URL(document.referrer).host !== location.host) extRef = document.referrer.slice(0, 300); } catch (e) {}
  const guessSource = (t, ref) => {
    if (t.utm_source) return t.utm_source + (t.utm_medium ? ' / ' + t.utm_medium : '');
    if ((t.click_id || '').startsWith('gclid')) return 'google / cpc';
    if ((t.click_id || '').startsWith('fbclid')) return 'facebook / paid-or-social';
    if (ref) { try { return new URL(ref).host.replace(/^www\./, '') + ' / referral'; } catch (e) {} }
    return '(direct)';
  };
  let attr = ss.get(ATTR_KEY) || ls.get(ATTR_KEY);
  const fresh = Object.keys(touch).length > 0 || (!!extRef && !attr);
  if (!attr || fresh) {
    const now = Object.assign({}, touch, { source: guessSource(touch, extRef), landing: (location.pathname + location.search).slice(0, 300), referrer: extRef, at: new Date().toISOString() });
    attr = { first: (attr && attr.first) || now, last: now };
  }
  ss.set(ATTR_KEY, attr);
  const persistAttribution = () => ls.set(ATTR_KEY, attr);
  if (consent && consent.analytics) persistAttribution();
  // Flat fields for the Google Sheet ("last touch" = the ad/campaign that brought this visit)
  WF.attribution = () => {
    const l = attr.last || {}, f = attr.first || {};
    return {
      source: l.source || '(direct)', utm_source: l.utm_source || '', utm_medium: l.utm_medium || '',
      utm_campaign: l.utm_campaign || '', utm_term: l.utm_term || '', utm_content: l.utm_content || '',
      click_id: l.click_id || '', landing: l.landing || '', first_source: f.source || '', first_referrer: f.referrer || '',
    };
  };

  // =========================================================
  // Skip link (keyboard / screen-reader users)
  // =========================================================
  const main = document.querySelector('main');
  if (main) {
    if (!main.id) main.id = 'main';
    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
    const skip = document.createElement('a');
    skip.className = 'skip-link'; skip.href = '#' + main.id; skip.textContent = 'Skip to content';
    document.body.prepend(skip);
  }

  // =========================================================
  // Mega menu under "Services" (inspired by wipro.com "What We Do")
  // =========================================================
  const nav = document.getElementById('nav');
  const navLinks = document.getElementById('navLinks');
  const svcLink = navLinks && [...navLinks.querySelectorAll('a')].find((a) => /#services$/.test(a.getAttribute('href')));
  if (svcLink) {
    const chev = '<svg class="mm-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    const arrow = '<svg class="mm-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    const col = (title, items) => `<div class="mm-col"><h6>${title}</h6>${items.map(([href, t, d]) => `<a href="${href}"><b>${t}</b>${d ? `<small>${d}</small>` : ''}</a>`).join('')}</div>`;
    const wrap = document.createElement('div');
    wrap.className = 'nav-item has-mega';
    wrap.innerHTML = `
      <a href="${svcLink.getAttribute('href')}" class="nav-trigger" aria-expanded="false" aria-controls="megaServices">Services ${chev}</a>
      <div class="mega" id="megaServices">
        <div class="container mega-inner">
          ${col('Services', [
            ['/services/whatsapp-automation.html', 'WhatsApp &amp; AI Chatbots', 'Instant replies, catalogues, reminders'],
            ['/services/crm-lead-automation.html', 'CRM &amp; Lead Automation', 'IndiaMART, JustDial, Meta Ads → CRM'],
            ['/services/mis-dashboards-reporting.html', 'MIS &amp; Dashboards', 'Reports that refresh themselves'],
            ['/services/python-automation.html', 'Python Automation', 'Data pipelines, reports, integrations'],
            ['/services/ai-agents.html', 'Custom AI Agents', 'Trained on your business data'],
          ])}
          ${col('Live systems', [
            [home('#projects'), 'Sales CRM'], [home('#projects'), 'Delegation Software'],
            [home('#projects'), 'Smart Inventory Controller'], [home('#projects'), 'Attendance System'],
          ])}
          ${col('Industries', [
            [home('#industries'), 'Manufacturing'], [home('#industries'), 'Trading &amp; Distribution'],
            [home('#industries'), 'Real Estate'], [home('#industries'), 'Education &amp; Coaching'],
            [home('#industries'), 'Clinics, Retail &amp; Services'],
          ])}
          <div class="mm-feature">
            <span class="mm-kicker">Free resource</span>
            <b>The SME Automation Checklist</b>
            <p>28 daily tasks your team can stop doing by hand. Free PDF.</p>
            <a href="${home('#checklist')}" class="mm-cta">Get the checklist ${arrow}</a>
            <a href="${home('#assessment')}" class="mm-cta alt">Free readiness score ${arrow}</a>
          </div>
        </div>
      </div>`;
    svcLink.replaceWith(wrap);
    const trigger = wrap.querySelector('.nav-trigger');
    const hoverable = window.matchMedia('(hover: hover) and (pointer: fine)');
    const mobile = () => window.innerWidth <= 900;
    let closeT;
    const setOpen = (open) => {
      clearTimeout(closeT);
      wrap.classList.toggle('open', open);
      trigger.setAttribute('aria-expanded', open);
      if (nav) nav.classList.toggle('mega-open', open && !mobile());
    };
    wrap.addEventListener('mouseenter', () => { if (hoverable.matches && !mobile()) setOpen(true); });
    wrap.addEventListener('mouseleave', () => { if (hoverable.matches && !mobile()) closeT = setTimeout(() => setOpen(false), 160); });
    trigger.addEventListener('click', (e) => {
      // touch screens and the mobile menu: first tap opens the panel, a second tap follows the link
      if (!hoverable.matches || mobile()) {
        if (!wrap.classList.contains('open')) { e.preventDefault(); setOpen(true); return; }
      }
      setOpen(false);
    });
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); setOpen(true); const first = wrap.querySelector('.mega a'); if (first) first.focus(); }
    });
    wrap.addEventListener('focusout', (e) => { if (!wrap.contains(e.relatedTarget)) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && wrap.classList.contains('open')) { setOpen(false); trigger.focus(); } });
    document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) setOpen(false); });
    wrap.querySelectorAll('.mega a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  }

  // ---------- Navbar (all pages) ----------
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    const toggle = document.getElementById('navToggle');
    if (toggle) toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
    document.querySelectorAll('#navLinks a:not(.nav-trigger)').forEach((a) => a.addEventListener('click', () => nav.classList.remove('open')));
  }
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  // =========================================================
  // Cookie banner + "Privacy preferences" panel (inspired by wipro.com)
  // =========================================================
  const cc = document.createElement('div');
  cc.className = 'cc';
  cc.setAttribute('role', 'dialog');
  cc.setAttribute('aria-labelledby', 'ccTitle');
  cc.hidden = true;
  cc.innerHTML = `
    <div class="cc-card">
      <div class="cc-main">
        <b id="ccTitle">We value your privacy</b>
        <p>We use cookies to understand which pages help visitors and to measure our ads. The website works fine without them. <a href="/privacy.html#cookies">Privacy Policy</a></p>
      </div>
      <div class="cc-prefs" hidden>
        <label class="cc-row"><span><b>Strictly necessary</b><small>Needed for the site and your choices to work.</small></span><input type="checkbox" checked disabled /><i class="cc-sw" aria-hidden="true"></i></label>
        <label class="cc-row"><span><b>Analytics</b><small>Google Analytics: counts visits and popular pages.</small></span><input type="checkbox" data-cc-key="analytics" /><i class="cc-sw" aria-hidden="true"></i></label>
        <label class="cc-row"><span><b>Marketing</b><small>Meta / Google ads measurement.</small></span><input type="checkbox" data-cc-key="marketing" /><i class="cc-sw" aria-hidden="true"></i></label>
      </div>
      <div class="cc-actions">
        <button type="button" class="cc-btn cc-link" data-cc="settings">Settings</button>
        <button type="button" class="cc-btn cc-ghost" data-cc="reject">Reject all</button>
        <button type="button" class="cc-btn cc-ghost" data-cc="save" hidden>Save my choices</button>
        <button type="button" class="cc-btn cc-primary" data-cc="accept">Accept all</button>
      </div>
    </div>`;
  document.body.appendChild(cc);
  const prefs = cc.querySelector('.cc-prefs');
  const boxes = [...cc.querySelectorAll('[data-cc-key]')];
  const showBanner = (withPrefs) => {
    boxes.forEach((b) => { b.checked = !!(consent && consent[b.dataset.ccKey]); });
    prefs.hidden = !withPrefs;
    cc.querySelector('[data-cc="settings"]').hidden = !!withPrefs;
    cc.querySelector('[data-cc="save"]').hidden = !withPrefs;
    cc.hidden = false;
    requestAnimationFrame(() => cc.classList.add('show'));
  };
  const hideBanner = () => { cc.classList.remove('show'); setTimeout(() => { cc.hidden = true; }, 350); };
  cc.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cc]');
    if (!b) return;
    const act = b.dataset.cc;
    if (act === 'settings') { showBanner(true); return; }
    if (act === 'accept') saveConsent({ analytics: true, marketing: true });
    if (act === 'reject') saveConsent({ analytics: false, marketing: false });
    if (act === 'save') saveConsent(Object.fromEntries(boxes.map((x) => [x.dataset.ccKey, x.checked])));
    hideBanner();
  });
  if (!consent) setTimeout(() => showBanner(false), 1200);
  WF.cookieSettings = () => showBanner(true);
  // "Cookie settings" link in every footer
  document.querySelectorAll('.legal-links').forEach((el) => {
    const a = document.createElement('a');
    a.href = '#'; a.textContent = 'Cookie settings';
    a.addEventListener('click', (e) => { e.preventDefault(); showBanner(true); });
    el.appendChild(a);
  });
})();
