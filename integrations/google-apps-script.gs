/**
 * Workflash Automation – save website enquiries into a Google Sheet
 *
 * SETUP (one time, ~3 minutes):
 * 1. Create a new Google Sheet (e.g. "Workflash Website Leads").
 * 2. Extensions → Apps Script. Delete everything and paste this whole file. Save.
 * 3. Deploy → New deployment → type "Web app".
 *      Execute as: Me   |   Who has access: Anyone
 *    Click Deploy, allow the permissions, and copy the Web app URL
 *    (it looks like https://script.google.com/macros/s/XXXXXXXX/exec).
 * 4. Paste that URL into FORM_ENDPOINT at the top of js/site.js and commit.
 *
 * Every enquiry from the website form is then added as a new row, even if the
 * visitor closes WhatsApp without pressing Send. Optional: set NOTIFY_EMAIL to
 * also receive an email for every new enquiry.
 */
const SHEET_NAME = 'Leads';
const NOTIFY_EMAIL = ''; // e.g. 'Workflashspace@gmail.com'
const HEADERS = ['Received (IST)', 'Name', 'Mobile', 'Email', 'Company', 'Company size',
  'Timeline', 'Services', 'Message', 'Sent via', 'Page', 'Referrer', 'Device'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const p = (e && e.parameter) || {};
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) {
      sh.appendRow(HEADERS);
      sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
    const clean = (v) => String(v || '').slice(0, 2000).replace(/^[=+\-@]/, "'$&"); // block formula injection
    const row = [
      Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss'),
      clean(p.name), clean(p.phone), clean(p.email), clean(p.company), clean(p.size),
      clean(p.timeline), clean(p.services), clean(p.message), clean(p.via),
      clean(p.page), clean(p.referrer), clean(p.userAgent),
    ];
    sh.appendRow(row);
    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(NOTIFY_EMAIL, 'New website enquiry – ' + row[1],
        HEADERS.map((h, i) => h + ': ' + row[i]).join('\n'));
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput('Workflash lead endpoint is running.');
}
