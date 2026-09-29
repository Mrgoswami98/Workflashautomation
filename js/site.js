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
};

(() => {
  const WF = window.WF;

  // ---------- Analytics (loads only when an ID is set) ----------
  if (WF.GA4_ID) {
    const s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + WF.GA4_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', WF.GA4_ID);
  }
  if (WF.META_PIXEL_ID) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', WF.META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }
  WF.track = (name, params = {}) => {
    try { if (window.gtag) window.gtag('event', name, params); } catch (e) {}
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

  // ---------- Navbar (all pages) ----------
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    const toggle = document.getElementById('navToggle');
    if (toggle) toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
    document.querySelectorAll('#navLinks a').forEach((a) => a.addEventListener('click', () => nav.classList.remove('open')));
  }
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
