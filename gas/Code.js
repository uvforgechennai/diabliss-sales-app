// ═══════════════════════════════════════════════════════════
// DIABLISS SALES APP v2 — Google Apps Script
// Deploy as: Web App → Execute as: Me → Access: Anyone
// Paste the deployment URL into SCRIPT_URL in index.html
// ═══════════════════════════════════════════════════════════
const APP_VERSION = '1.7.180';
const TIMEZONE = 'Asia/Kolkata';
function nowIST() { return Utilities.formatDate(new Date(), TIMEZONE, 'dd/MM/yyyy HH:mm:ss'); }
function nowISO_IST() { return Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss'+05:30'"); }
function nowIST_() { return Utilities.formatDate(new Date(), TIMEZONE, 'dd MMM yyyy, hh:mm a'); }
function todayIST_() { return Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd'); }

const SPREADSHEET_ID  = '1KUV-ypJjagfufmDfcaON1Kb0cqRqaN6OlQebD6xVQpE';
const DRIVE_FOLDER_ID = '18-X2yLEzHJUY1uv5_HOIZddi6B4kZZXK';
const WEB_APP_URL     = 'https://script.google.com/macros/s/AKfycbzznExu7LAHKDdsTuSIWr4wSAwCojqpDeKKwbCTZBO3Al-Zci244jva788dTFWz74Hf/exec';
const REPORT_PAGE_URL = 'https://lowgifoods.co.in/diabliss-sales-app/mis-report.html';

const SHEET_ORDERS     = 'Orders';
const SHEET_ATTENDANCE = 'Attendance';
const SHEET_USERS      = 'Users';
const SHEET_STORES     = 'Stores';
const SHEET_WHITELIST  = 'Whitelist';
const SHEET_INVOICES   = 'Invoices';
const SHEET_INST_VISITS= 'Institution Visits';
const ALL_TERRITORIES  = ['Chennai','ROTN','Kerala','AP','TS','Bangalore','ROK','Odisha','Others'];
const MIS_CACHE_SECONDS = 21600;
const SUPABASE_URL = 'https://ndxbbuejunkawfomvjrl.supabase.co';
const SUPABASE_SECRET_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5keGJidWVqdW5rYXdmb212anJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTk0Mjk2MSwiZXhwIjoyMTAxNTE4OTYxfQ.Xug9bycNK7nzoYYt4Le9476-MdbwkDVR_xv8tE80b-A';

function getWebAppUrl() {
  if (WEB_APP_URL && WEB_APP_URL.indexOf('https://') === 0) return WEB_APP_URL;
  return ScriptApp.getService().getUrl();
}

// ══ doPost ══
// ══ TEST RUNNER ══
function testStorePhoto() {
  const tinyPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  saveStorePhoto({
    photo: 'data:image/png;base64,' + tinyPng,
    storeName: 'TEST STORE',
    storeCity: 'Chennai',
    addedBy: 'Debug Run',
    orderId: 'TEST-001'
  });
}

// ══ DEBUG SHEET LOGGER ══
function dbg(msg) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sh = ss.getSheetByName('Debug');
    if (!sh) sh = ss.insertSheet('Debug');
    sh.appendRow([new Date(), String(msg)]);
  } catch(err) {}
}

function doPost(e) {
  try {
    const rawText = e.postData.contents || Utilities.newBlob(e.postData.getBytes()).getDataAsString('UTF-8');
    const data = JSON.parse(rawText);
    dbg('doPost: action=' + (data.action||'none') + ' b64len=' + (data.base64Audio||'').length);
    // ── Security token check ──
    const secret = PropertiesService.getScriptProperties().getProperty('API_SECRET');
    if (secret && data.token !== secret) {
      return ContentService.createTextOutput(JSON.stringify({status:'error',message:'Unauthorized'})).setMimeType(ContentService.MimeType.JSON);
    }
    const action = data.action || 'order';
    if (action === 'photo') dbg('doPost: photo action arrived');
    if      (action === 'generatePdf')            return generatePdfNative(data);
    else if (action === 'saveStatementToDrive')  return saveStatementToDrive(data);
    else if (action === 'savePdfToDrive')         return savePdfToDrive(data);
    else if (action === 'updateLedgerEntry')       { updateLedgerEntryInSheet(data); }
    else if (action === 'deleteLedgerEntry')       { deleteLedgerEntryFromSheet(data); }
    else if (action === 'saveProspect')            { saveProspectToSheet(data); }
    else if (action === 'saveStoreVisit')          { saveStoreVisitToSheet(data); }
    else if (action === 'photo')              saveStorePhoto(data);
    else if (action === 'updateLocation')     updateOrderLocation(data);
    else if (action === 'startDay')           saveAttendance(data);
    else if (action === 'endDay')             saveAttendance(data);
    else if (action === 'leave')              saveAttendance(data);
    else if (action === 'reopenDay')          reopenDay(data);
    else if (action === 'sendLeaveEmail')     sendLeaveEmail(data);
    else if (action === 'sendAlertEmail')     sendAlertEmail(data);
    else if (action === 'requestOTP')         return json(requestOTP(data));
    else if (action === 'verifyOTP')          return json(verifyOTP(data));
    else if (action === 'saveCorrection')     saveCorrection(data);
    else if (action === 'archiveOrders')      archiveOrders(data);
    else if (action === 'saveHoliday')        saveHoliday(data);
    else if (action === 'saveStore')          saveStore(data);
    else if (action === 'deleteStore')        deleteRecord('Stores', data.id);
    else if (action === 'deleteInstitution')  deleteRecord('Institutions', data.id);
    else if (action === 'saveDist')           saveDist(data);
    else if (action === 'deleteDist')         deleteRecord('Distributors', data.id);
    else if (action === 'saveInstitution')    saveInstitution(data);
    else if (action === 'saveTarget')         saveTargetToSheet(data);
    else if (action === 'saveLedgerEntry')    saveLedgerEntryToSheet(data);
    else if (action === 'saveBroadcast')      saveBroadcastToSheet(data);
    else if (action === 'deactivateBroadcast') deactivateBroadcastInSheet(data);
    else if (action === 'saveProduct')        saveProduct(data);
    else if (action === 'saveFollowup')       saveFollowup(data);
    else if (action === 'loginLocation')      saveLoginLocation(data);
    else if (action === 'savePushSubscription') savePushSubscription(data);
    else if (action === 'sendForceRefresh')     sendForceRefresh(data);
    else if (action === 'invoice')            saveInvoice(data);
    else if (action === 'institutionVisit')   saveInstitutionVisit(data);
    else if (action === 'addEmployee')        addEmployeeToWhitelist(data);
    else if (action === 'saveExpense')        saveExpense(data);
    else if (action === 'cancelOrder')        cancelOrder(data);
    else if (action === 'backup')             backupData(data);
    else if (action === 'handover')           handoverData(data);
    else if (action === 'sendMIS')            sendMISReport(data);
    else if (action === 'aiPrompt')       return handleAIPrompt(data);
    else if (action === 'voiceEntry')      return handleVoiceEntry(data);
    else if (action === 'handleChatbot')   return handleChatbot(data);
    else if (action === 'verifyAdminPin') return verifyAdminPin(data);
    else if (action === 'masterLoginAudit') { saveMasterLoginAudit(data); }
    else if (action === 'saveCompetitorPhoto')  return saveCompetitorPhoto(data);
    else if (action === 'newUserRegistered')    { notifyNewUserRegistered(data); }
    else if (action === 'updateOrderStatus')    return updateOrderStatus(data);
    else if (action === 'parsePO')               return handleParsePO(data);
    else if (action === 'setAppVersion')         setAppVersion(data.version||'');
    else                                      saveOrder(data);
    return ok();
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status:'error',msg:err.message})).setMimeType(ContentService.MimeType.JSON);
  }
}

// ══ SAVE PROSPECT ══
function saveProspectToSheet(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Prospects');
  if (!sheet) {
    sheet = ss.insertSheet('Prospects');
    sheet.appendRow(['ID','Name','Type','Interest','City','Territory','Contact','Mobile','Follow-up Date','Notes','Officer','Mobile','Role','Timestamp']);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,14).setBackground('#4B2D8E').setFontColor('#ffffff').setFontWeight('bold');
  }
  sheet.appendRow([data.id||'',data.name||'',data.type||'',data.interest||'',data.city||'',data.territory||'',data.contact||'',data.mobile||'',data.followup||'',data.notes||'',data.officer||'',data.officerMobile||'',data.officerRole||'',nowISO_IST()]);
}

// ══ SAVE STORE VISIT ══
function saveStoreVisitToSheet(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Store Visits');
  if (!sheet) {
    sheet = ss.insertSheet('Store Visits');
    sheet.appendRow(['ID','Store ID','Store Name','Notes','Officer','Mobile','Territory','Date','Timestamp']);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,9).setBackground('#159ADB').setFontColor('#ffffff').setFontWeight('bold');
  }
  sheet.appendRow([data.id||'',data.storeId||'',data.storeName||'',data.notes||'',data.officer||'',data.officerMobile||'',data.territory||'',data.date||'',nowISO_IST()]);
}

// ══ UPDATE LEDGER ENTRY ══
function updateLedgerEntryInSheet(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Ledger');
  if (!sheet) return;
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(data.id).trim()) {
      sheet.getRange(i+1, 2).setValue(data.date || rows[i][1]);
      sheet.getRange(i+1, 6).setValue(data.type || rows[i][5]);
      sheet.getRange(i+1, 7).setValue(data.amount || rows[i][6]);
      sheet.getRange(i+1, 8).setValue(data.drCr || rows[i][7]);
      sheet.getRange(i+1, 9).setValue(data.particulars || rows[i][8]);
      return;
    }
  }
}

// ══ DELETE LEDGER ENTRY ══
function deleteLedgerEntryFromSheet(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Ledger');
  if (!sheet) return;
  var rows = sheet.getDataRange().getValues();
  for (var i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][0]).trim() === String(data.entryId).trim()) {
      sheet.deleteRow(i + 1);
      clearLedgerCache(data.partyId||null);
      return;
    }
  }
}

// ══ GAS-NATIVE PDF GENERATION (v1.6.90) ══
// Converts HTML → PDF, saves to Drive folder, returns view URL.
// Auto-deletes files older than 7 days from the same folder on each call.
function generatePdfNative(data) {
  try {
    var html = data.html || '';
    if (!html) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Missing html' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var title = (data.filename || 'Diabliss_Document').replace(/[^a-zA-Z0-9_\-]/g, '_');

    // Ensure a full HTML document
    if (html.indexOf('<html') === -1) {
      html = '<html><head><meta charset="UTF-8"></head><body>' + html + '</body></html>';
    }

    var pdfBlob = Utilities.newBlob(html, 'text/html', title + '.html')
                    .getAs('application/pdf')
                    .setName(title + '.pdf');

    // Get or create folder
    var folderName = 'Diabliss PDF Statements';
    var folder;
    var folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }

    // Auto-delete files older than 7 days
    var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    var oldFiles = folder.getFiles();
    while (oldFiles.hasNext()) {
      var f = oldFiles.next();
      if (f.getDateCreated() < cutoff) { f.setTrashed(true); }
    }

    // Save PDF to Drive
    pdfBlob.setContentType('application/pdf');
    var file = folder.createFile(pdfBlob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileId = file.getId();
    var url = 'https://drive.google.com/file/d/' + fileId + '/view?usp=sharing';
    var downloadUrl = file.getDownloadUrl();
    return ContentService.createTextOutput(JSON.stringify({ url: url, downloadUrl: downloadUrl }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(e) {
    return ContentService.createTextOutput(JSON.stringify({ error: e.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ══ SAVE PDF TO DRIVE ══
function savePdfToDrive(data) {
  try {
    var base64Pdf = data.base64Pdf || '';
    var title = data.title || 'Diabliss_Statement';
    var safeName = title.replace(/[^a-zA-Z0-9_]/g, '_').replace(/__+/g, '_') + '_' +
                   Utilities.formatDate(new Date(), 'Asia/Kolkata', 'ddMMMyyyy') + '.pdf';

    var folderName = 'Diabliss Statements';
    var folder;
    var folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }

    var pdfBytes = Utilities.base64Decode(base64Pdf);
    var blob = Utilities.newBlob(pdfBytes, 'application/pdf', safeName);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileId = file.getId();
    var url = 'https://drive.google.com/file/d/' + fileId + '/view?usp=sharing';
    return ContentService.createTextOutput(JSON.stringify({ url: url }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(e) {
    return ContentService.createTextOutput(JSON.stringify({ error: e.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ══ SAVE STATEMENT TO DRIVE ══
function saveStatementToDrive(data) {
  try {
    const html = data.html || '';
    const title = data.title || 'Diabliss_Statement';
    const safeName = title.replace(/[^a-zA-Z0-9_]/g, '_').replace(/__+/g, '_') + '_' +
                     Utilities.formatDate(new Date(), 'Asia/Kolkata', 'ddMMMyyyy') + '.html';

    // Get or create Diabliss Statements folder in Drive
    const folderName = 'Diabliss Statements';
    let folder;
    const folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }

    // Save HTML file to Drive
    const blob = Utilities.newBlob(html, 'text/html', safeName);
    const file = folder.createFile(blob);

    // Make accessible to anyone with the link
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = file.getId();
    const url = 'https://drive.google.com/file/d/' + fileId + '/view?usp=sharing';
    return ContentService.createTextOutput(JSON.stringify({ url }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(e) {
    return ContentService.createTextOutput(JSON.stringify({ error: e.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


// ══ doGet ══
function doGet(e) {
  try {
    const action = e.parameter.action;
    const mobile = e.parameter.mobile;
    // ── Security token check (skip for misReport — opened in browser) ──
    if (action !== 'misReport') {
      const secret = PropertiesService.getScriptProperties().getProperty('API_SECRET');
      if (secret && e.parameter.token !== secret) {
        return ContentService.createTextOutput(JSON.stringify({status:'error',message:'Unauthorized'})).setMimeType(ContentService.MimeType.JSON);
      }
    }

    if (action === 'misReport') {
      try {
        const id = e.parameter.id || '';
        const openTerritory = e.parameter.territory || '';
        const reportData = getMISReportById(id);
        if (!reportData) {
          return HtmlService.createHtmlOutput(
            '<div style="font-family:Arial,sans-serif;padding:40px;text-align:center;color:#888">' +
            '<h3>Report not found or has expired.</h3>' +
            '<p style="font-size:13px">MIS report links are generated fresh with each email and may no longer be available.</p></div>'
          ).setTitle('Diabliss MIS Report');
        }
        return HtmlService.createHtmlOutput(renderMISReportPage(reportData, openTerritory, getWebAppUrl()))
          .setTitle('Diabliss MIS Report')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      } catch(misErr) {
        return HtmlService.createHtmlOutput(
          '<div style="font-family:Arial,sans-serif;padding:40px;text-align:center;color:#888">' +
          '<h3>Could not load report</h3>' +
          '<p style="font-size:12px;color:#bbb">' + String(misErr.message||misErr).replace(/</g,'&lt;') + '</p></div>'
        ).setTitle('Diabliss MIS Report');
      }
    }

    if (action === 'getStoreHistory') {
      const store = e.parameter.store || '';
      const limit = parseInt(e.parameter.limit || '10');
      return json({ history: getStoreHistory(store, limit) });
    }

    if (action === 'getMISJson') {
      const id = e.parameter.id || '';
      const reportData = getMISReportById(id);
      return json(reportData ? { status: 'ok', report: reportData } : { status: 'not_found' });
    }

    if (action === 'checkAccess' && mobile) { return json(checkUserAccess(mobile)); }
    if (action === 'getFiles')              { return json({files: getCompanyFiles()}); }
    if (action === 'getProductPhotos')      { return getProductPhotos(); }
    if (action === 'getEmployees')          { return json({employees: getEmployees()}); }
    if (action === 'getEmployeeConfig')     { return json({config: getEmployeeConfig(e.parameter.mobile||'')}); }
    if (action === 'getExpenses')           { return json({expenses: getSheetData('Expenses', [])}); }
    if (action === 'getAttendance')         { return json({attendance: getSheetData('Attendance', [])}); }
    if (action === 'getOrders')             { return json({orders: getOrdersFromSheet(e.parameter.territory||'', 30)}); }
    if (action === 'getOrdersRange')        { return json({orders: getOrdersFromSheet(e.parameter.territory||'', 0, e.parameter.from||'', e.parameter.to||'')}); }
    if (action === 'getStores')             { return json({stores: getStoresFromSheet(e.parameter.territory||'')}); }
    if (action === 'getDists')              { return json({dists: getDistsFromSheet(e.parameter.territory||'')}); }
    if (action === 'getInsts')              { return json({insts: getInstsFromSheet(e.parameter.territory||'')}); }
    if (action === 'getHolidays')           { return json({holidays: getHolidaysFromSheet()}); }
    if (action === 'getTargets')            { return json({targets: getTargetsFromSheet()}); }
    if (action === 'getLedger')             { return json({entries: getLedgerFromSheet(e.parameter.partyId||'')}); }
    if (action === 'getBroadcast')          { return json({broadcast: getActiveBroadcastFromSheet()}); }
    if (action === 'getProducts')           { return json({products: getProductsFromSheet()}); }
    if (action === 'getVersion')            { return json({version: getAppVersion()}); }
    if (action === 'getInvoiceNum')         { return json({num: getNextInvoiceNum()}); }
    if (action === 'aiPrompt')              { return handleAIPrompt({ apiKey: e.parameter.apiKey, model: e.parameter.model, prompt: e.parameter.prompt }); }
    if (action === 'handleChatbot')         { return handleChatbot({ prompt: e.parameter.prompt }); }
    if (action === 'geocode')               { return handleGeocode(e.parameter.lat||'', e.parameter.lng||''); }
    if (action === 'getOfficerLocations')   { return json({locations: getOfficerLocations(e.parameter.date||'')}); }
    if (action === 'getOfficerDayRoute')     { return json(getOfficerDayRoute(e.parameter.mobile||'', e.parameter.date||'')); }
    if (action === 'getMISDetail')          { return json({report: getMISDetail(e.parameter.from||'', e.parameter.to||'')}); }

  } catch(err) {}
  return ok();
}

function ok()    { return ContentService.createTextOutput(JSON.stringify({status:'ok'})).setMimeType(ContentService.MimeType.JSON); }
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// ══ ACCESS CHECK ══
function checkUserAccess(mobile) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_WHITELIST);
  if (!sheet) return { status: 'not_found' };
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const row          = data[i];
    const wlMobile     = String(row[0]).trim();
    const status       = String(row[2]).trim().toLowerCase();
    const role         = String(row[3]).trim() || 'Officer';
    const alertMobile  = String(row[6]||'').trim();
    const territory    = String(row[7]||'').trim();
    const alertEmail   = String(row[8]||'').trim();
    const personalEmail= String(row[9]||'').trim();
    if (wlMobile === String(mobile).trim()) {
      if (status === 'blocked') return { status:'blocked', role, name: String(row[1]).trim(), alertMobile, territory, alertEmail, personalEmail };
      try { updateLastActive(String(row[1]).trim(), wlMobile, role, territory); } catch(e){}
      return { status:'ok', role, name: String(row[1]).trim(), alertMobile, territory, alertEmail, personalEmail };
    }
  }
  return { status: 'not_found' };
}

// ══ SAVE ORDER ══
function saveOrder(data) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet   = ss.getSheetByName(SHEET_ORDERS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ORDERS);
    sheet.appendRow(['Order ID','Date','Time','Officer','Officer Mobile','Role','Territory','Store','Store City','Store Territory','Margin %','Distributor','Dist Type','Dist Territory','Dist City','Products Ordered','Audit Summary','Unsaleable Summary','Basic Value (ex-GST)','GST','Grand Total','Special Price?','Unsaleable?','Notes','Latitude','Longitude','Address','Map Link','Synced At']);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,29).setBackground('#159ADB').setFontColor('#ffffff').setFontWeight('bold');
  }
  sheet.getRange('B:C').setNumberFormat('@');
  sheet.getRange('AC:AC').setNumberFormat('@');
  const _existingRows = sheet.getDataRange().getValues();
  for (let _i = 1; _i < _existingRows.length; _i++) {
    if (String(_existingRows[_i][0]).trim() === String(data.id||data.orderId).trim()) {
      Logger.log('Duplicate order skipped: ' + (data.id||data.orderId));
      return;
    }
  }
  sheet.appendRow([
    data.id||data.orderId, data.date, data.time,
    data.officer, data.officerMobile, data.officerRole||'', data.territory||'',
    data.store, data.storeCity||'', data.storeTerritory||'', data.storeMargin||'',
    data.distributor||'', data.distType||'', data.distTerritory||'', data.distCity||'',
    data.products||'', data.auditSummary||'', data.unsaleableSummary||'',
    data.subtotal||data.sub||'', data.gst||'', data.total||data.grand||'',
    data.hasSpecial ? 'YES' : 'No',
    data.hasUns||data.hasUnsaleable ? 'YES' : 'No',
    data.notes||'', '', '', '', '',
    nowISO_IST()
  ]);
  const lastRow = sheet.getLastRow();
  if (data.hasSpecial || data.hasUns || data.hasUnsaleable) {
    sheet.getRange(lastRow, 1, 1, 29).setBackground('#fff3cd');
  }
  registerUser(data.officer, data.officerMobile, data.officerRole, data.territory);
  try {
    const lastRow = sheet.getLastRow();
    if (lastRow > 2) {
      sheet.getRange(2, 1, lastRow - 1, 29).sort({ column: 29, ascending: true });
    }
  } catch(e) { Logger.log('Sort error: ' + e.message); }
}

// ══ UPDATE ORDER LOCATION ══
function updateOrderLocation(data) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_ORDERS);
  if (!sheet) return;
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() == String(data.orderId).trim()) {
      sheet.getRange(i+1, 25).setValue(data.lat||'');
      sheet.getRange(i+1, 26).setValue(data.lng||'');
      sheet.getRange(i+1, 27).setValue(data.address||'');
      if (data.mapLink) sheet.getRange(i+1, 28).setValue(data.mapLink);
      break;
    }
  }
}

// ══ ATTENDANCE ══
function saveAttendance(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_ATTENDANCE);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ATTENDANCE);
    sheet.appendRow(['Date','Officer','Mobile','Role','Territory','Action','Start Time','End Time','Route Plan','Target Stores','Orders Count','Stores Count','Total Value (₹)','KMs Covered','Start Lat','Start Lng','End Lat','End Lng','Leave Type','Reason','Remarks','Synced At']);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,22).setBackground('#159ADB').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setColumnWidths(1,22,130);
  }
  const accompNote = data.accompanyingName ? 'Accompanying: '+data.accompanyingName+' ('+data.accompanyingMobile+')' : '';
  const finalRemarks = [data.remarks||'', accompNote].filter(Boolean).join(' | ');
  sheet.appendRow([
    data.date||'', data.officer||'', data.officerMobile||'', data.officerRole||'', data.territory||'',
    data.action||'', data.startTime||'', data.endTime||'', data.route||'', data.target||'',
    data.ordersCount||'', data.storesCount||'', data.totalValue||'', data.kmsCovered||'',
    data.startLat||'', data.startLng||'', data.endLat||'', data.endLng||'',
    data.leaveType||'', data.reason||'', finalRemarks, nowISO_IST()
  ]);
}

// ══ REOPEN DAY ══
function reopenDay(data) {
  // Called when officer taps "Reopen day" after accidentally ending their day.
  // Finds the most recent endDay row for this officer today and marks it reopened.
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_ATTENDANCE);
  if (!sheet || sheet.getLastRow() < 2) return;
  const rows = sheet.getDataRange().getValues();
  // Col indices (0-based): Date=0, Officer=1, Mobile=2, Action=5, EndTime=7, Remarks=20
  for (let i = rows.length - 1; i >= 1; i--) {
    const rowDate   = String(rows[i][0] || '').trim();
    const rowMobile = String(rows[i][2] || '').trim();
    const rowAction = String(rows[i][5] || '').trim();
    if (rowDate === (data.date || '') && rowMobile === String(data.officerMobile || '') && rowAction === 'endDay') {
      // Mark end time as REOPENED
      sheet.getRange(i + 1, 8).setValue('REOPENED');
      // Append to remarks
      const existingRemarks = String(rows[i][20] || '');
      const reopenNote = '↩ Reopened at ' + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'HH:mm');
      sheet.getRange(i + 1, 21).setValue(existingRemarks ? existingRemarks + ' | ' + reopenNote : reopenNote);
      break;
    }
  }
}

// ══ LOGIN LOCATION ══
function saveLoginLocation(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Location Log');
  if (!sheet) {
    sheet = ss.insertSheet('Location Log');
    sheet.appendRow(['Officer','Mobile','Latitude','Longitude','Address','Map Link','TriggerType','Timestamp']);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,8).setBackground('#185FA5').setFontColor('#ffffff').setFontWeight('bold');
  }
  // Add TriggerType column if existing sheet only has 7 cols
  if (sheet.getLastColumn() < 8) sheet.getRange(1,8).setValue('TriggerType');
  const mapLink = data.lat && data.lng ? 'https://maps.google.com/?q='+data.lat+','+data.lng : '';
  sheet.appendRow([data.officer||'', data.mobile||'', data.lat||'', data.lng||'', data.address||'', mapLink, data.triggerType||'login', nowISO_IST()]);
}

// ══ OFFICER DISPLAY NAME LOOKUP ══
// Returns map of { mobile → cleanName } from Whitelist sheet
// Used to resolve raw officer names (e.g. "pradeepkumar pradeep") to proper display names
function getOfficerDisplayNames() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_WHITELIST);
  if (!sheet || sheet.getLastRow() < 2) return {};
  const rows = sheet.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < rows.length; i++) {
    const mobile = String(rows[i][0]||'').trim();
    const name   = String(rows[i][1]||'').trim();
    if (mobile && name) map[mobile] = name;
  }
  return map;
}

// ══ MIS DETAIL — deep drill-down with any date range ══
function getMISDetail(fromStr, toStr) {
  const from = fromStr || todayIST_();
  const to   = toStr   || todayIST_();

  // ── Cache: 5 min for today, 2 min for other ranges ──
  const cacheKey = 'misdetail_' + from + '_' + to;
  const cacheTtl = (from === to && from === todayIST_()) ? 300 : 120;
  try {
    const cached = CacheService.getScriptCache().get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch(e) {}

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_ORDERS);
  if (!sheet || sheet.getLastRow() < 2) return null;

  const rows = sheet.getDataRange().getValues();
  const filtered = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!String(r[ORDER_COL.id]||'').trim()) continue;
    if (String(r[ORDER_COL.notes]||'').includes('CANCELLED')) continue;
    const ts = String(tsCellToIso_(r[ORDER_COL.date], r[ORDER_COL.time], r[ORDER_COL.syncedAt])||'').trim();
    if (!ts) continue;
    const d = ts.slice(0,10);
    if (d < from || d > to) continue;
    filtered.push(r);
  }

  // Build hierarchy: territory → officer (by mobile) → store → orders
  const hierarchy = {};
  const officerNames = {}; // mobile → clean name
  const productMap = {};   // product name → {orders, value}
  const displayNames = getOfficerDisplayNames(); // Whitelist mobile → proper name

  // Fetch location km data for today (if date range is today)
  const locMap = {};
  if (from === to && from === todayIST_()) {
    const locData = getOfficerLocations(from);
    locData.forEach(l => { locMap[l.mobile] = l.kmToday; });
  }

  filtered.forEach(r => {
    const terr    = String(r[ORDER_COL.territory]||'Unknown').trim()||'Unknown';
    const officer = String(r[ORDER_COL.officer]||'Unassigned').trim();
    const mobile  = String(r[ORDER_COL.officerMobile]||'').trim();
    const store   = String(r[ORDER_COL.store]||'Unknown').trim();
    const dist    = String(r[ORDER_COL.distributor]||'').trim();
    const city    = String(r[ORDER_COL.storeCity]||'').trim();
    const total   = parseFloat(r[ORDER_COL.grandTotal])||0;
    const products= String(r[ORDER_COL.products]||'').trim();
    const audit   = String(r[ORDER_COL.auditSummary]||'').trim();
    const notes   = String(r[ORDER_COL.notes]||'').trim();
    const lat     = String(r[ORDER_COL.latitude]||'').trim();
    const lng     = String(r[ORDER_COL.longitude]||'').trim();
    const address = String(r[ORDER_COL.address]||'').trim();
    const mapLink = String(r[ORDER_COL.mapLink]||'').trim();
    const orderId = String(r[ORDER_COL.id]||'').trim();
    const date    = String(r[ORDER_COL.date]||'').trim();
    const time    = String(r[ORDER_COL.time]||'').trim();
    const key     = mobile || officer; // use mobile as officer key

    if (mobile && officer) officerNames[key] = displayNames[mobile] || officer;

    if (!hierarchy[terr]) hierarchy[terr] = {};
    if (!hierarchy[terr][key]) hierarchy[terr][key] = { orders:0, value:0, stores:{}, km: locMap[mobile]||null };
    hierarchy[terr][key].orders++;
    hierarchy[terr][key].value += total;

    if (!hierarchy[terr][key].stores[store]) hierarchy[terr][key].stores[store] = { orders:0, value:0, dist, city, orderList:[] };
    hierarchy[terr][key].stores[store].orders++;
    hierarchy[terr][key].stores[store].value += total;
    hierarchy[terr][key].stores[store].orderList.push({ id:orderId, date, time, value:Math.round(total), products, auditSummary:audit, notes, lat, lng, address, mapLink });

    // Product breakdown (skip NO ORDER rows)
    if (products && products.indexOf('NO ORDER') !== 0) {
      products.split(/[|;,]/).forEach(seg => {
        seg = seg.trim(); if (!seg) return;
        const m = seg.match(/^(.+?)[×x](\d+)@/i);
        const name = m ? m[1].trim() : seg.split('×')[0].split('x')[0].trim();
        const qty  = m ? parseInt(m[2]) : 1;
        const vm   = seg.match(/@[₹]?([\d.]+)/);
        const val  = vm ? parseFloat(vm[1]) * qty : 0;
        if (name) {
          if (!productMap[name]) productMap[name] = { name, qty:0, orders:0, value:0 };
          productMap[name].qty += qty;
          productMap[name].orders++;
          productMap[name].value += val;
        }
      });
    }
  });

  const totalValue = filtered.reduce((a,r) => a+(parseFloat(r[ORDER_COL.grandTotal])||0), 0);
  const totalStores = new Set(filtered.map(r=>String(r[ORDER_COL.store]||'').trim())).size;
  const totalOfficers = new Set(filtered.map(r=>String(r[ORDER_COL.officerMobile]||r[ORDER_COL.officer]||'').trim()).filter(Boolean)).size;

  // Shape territories
  const territories = Object.entries(hierarchy).map(([tName, officers]) => {
    const offList = Object.entries(officers).map(([key, od]) => {
      const name = officerNames[key] || key;
      const stores = Object.entries(od.stores).map(([sName, sd]) => ({
        name: sName, distributor: sd.dist, city: sd.city,
        orders: sd.orders, value: Math.round(sd.value),
        orderList: sd.orderList.sort((a,b) => (b.date+b.time).localeCompare(a.date+a.time))
      })).sort((a,b) => b.value - a.value);
      return { name, mobile: key, orders: od.orders, value: Math.round(od.value), stores: stores.length, kmToday: od.km, storeList: stores };
    }).sort((a,b) => b.value - a.value);
    const terrOrders = offList.reduce((a,o)=>a+o.orders,0);
    const terrValue  = offList.reduce((a,o)=>a+o.value,0);
    return { name: tName, orders: terrOrders, value: terrValue, officers: offList };
  }).filter(t => t.orders > 0).sort((a,b) => b.value - a.value);

  // Top products
  const products = Object.values(productMap).sort((a,b) => b.value - a.value).slice(0,10).map(p => ({
    name: p.name, qty: p.qty, orders: p.orders,
    value: Math.round(p.value),
    pct: totalValue > 0 ? Math.round(p.value/totalValue*100) : 0
  }));

  const result = {
    from, to,
    periodLabel: from === to ? from : from + ' to ' + to,
    generatedAt: nowIST_(),
    totals: { orders: filtered.length, value: Math.round(totalValue), stores: totalStores, officers: totalOfficers },
    territories,
    products
  };

  // ── Store in cache ──
  try {
    const json = JSON.stringify(result);
    if (json.length < 95000) CacheService.getScriptCache().put(cacheKey, json, cacheTtl);
  } catch(e) {}

  return result;
}

// ══ OFFICER LOCATIONS ══
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function getOfficerLocations(dateStr) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Location Log');
  if (!sheet || sheet.getLastRow() < 2) return [];
  const today = dateStr || todayIST_();
  const rows = sheet.getDataRange().getValues();
  const byMobile = {};
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const mobile = String(r[1]||'').trim();
    const ts = String(r[7]||'');
    if (!mobile || !ts) continue;
    const rowDate = ts.slice(0,10);
    if (rowDate !== today) continue;
    const lat = parseFloat(r[2]);
    const lng = parseFloat(r[3]);
    if (isNaN(lat) || isNaN(lng)) continue;
    if (!byMobile[mobile]) byMobile[mobile] = { officer: String(r[0]||''), mobile, points: [], lastAddress: '', lastTs: '' };
    byMobile[mobile].points.push({ lat, lng, ts, address: String(r[4]||'') });
  }
  return Object.values(byMobile).map(emp => {
    const pts = emp.points.sort((a,b) => a.ts.localeCompare(b.ts));
    let km = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = haversineKm(pts[i-1].lat, pts[i-1].lng, pts[i].lat, pts[i].lng);
      if (d <= 50) km += d;
    }
    const last = pts[pts.length - 1];
    return {
      mobile: emp.mobile,
      officer: emp.officer,
      lastLat: last.lat,
      lastLng: last.lng,
      lastAddress: last.address || '',
      lastTs: last.ts,
      kmToday: Math.round(km * 10) / 10,
      pointCount: pts.length
    };
  });
}

// ══ OFFICER DAY ROUTE ══
function getOfficerDayRoute(mobile, dateStr) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const today = dateStr || todayIST_();
  const points = [];

  // 1. Start day GPS from Attendance sheet
  const attSheet = ss.getSheetByName(SHEET_ATTENDANCE);
  if (attSheet && attSheet.getLastRow() > 1) {
    const attRows = attSheet.getDataRange().getValues();
    for (let i = 1; i < attRows.length; i++) {
      const r = attRows[i];
      const rowMobile = String(r[2]||'').trim();
      const rowDate = String(r[0]||'').slice(0,10);
      const action = String(r[5]||'');
      if (rowMobile !== mobile || rowDate !== today) continue;
      if (action === 'startDay' && r[14] && r[15]) {
        points.push({ lat: parseFloat(r[14]), lng: parseFloat(r[15]), ts: String(r[6]||today+'T06:00:00'), type: 'start' });
      }
      if (action === 'endDay' && r[16] && r[17]) {
        points.push({ lat: parseFloat(r[16]), lng: parseFloat(r[17]), ts: String(r[7]||today+'T20:00:00'), type: 'end' });
      }
    }
  }

  // 2. Order locations from Orders sheet
  const ordSheet = ss.getSheetByName('Orders');
  if (ordSheet && ordSheet.getLastRow() > 1) {
    const ordRows = ordSheet.getDataRange().getValues();
    const headers = ordRows[0].map(h => String(h).toLowerCase().trim());
    const mobileIdx = headers.indexOf('officermobile');
    const tsIdx = headers.indexOf('ts');
    const latIdx = headers.indexOf('lat');
    const lngIdx = headers.indexOf('lng');
    const storeIdx = headers.indexOf('store');
    if (mobileIdx>=0 && tsIdx>=0 && latIdx>=0 && lngIdx>=0) {
      for (let i = 1; i < ordRows.length; i++) {
        const r = ordRows[i];
        const rowMobile = String(r[mobileIdx]||'').trim();
        const ts = String(r[tsIdx]||'');
        const rowDate = ts.slice(0,10);
        const lat = parseFloat(r[latIdx]);
        const lng = parseFloat(r[lngIdx]);
        if (rowMobile !== mobile || rowDate !== today || isNaN(lat) || isNaN(lng)) continue;
        points.push({ lat, lng, ts, type: 'order', label: storeIdx>=0 ? String(r[storeIdx]||'') : '' });
      }
    }
  }

  // 3. Location log pings — only include if >45 min gap from surrounding points
  const locSheet = ss.getSheetByName('Location Log');
  if (locSheet && locSheet.getLastRow() > 1) {
    const locRows = locSheet.getDataRange().getValues();
    const pings = [];
    for (let i = 1; i < locRows.length; i++) {
      const r = locRows[i];
      const rowMobile = String(r[1]||'').trim();
      const ts = String(r[7]||'');
      const rowDate = ts.slice(0,10);
      const lat = parseFloat(r[2]);
      const lng = parseFloat(r[3]);
      const trigType = String(r[6]||'');
      if (rowMobile !== mobile || rowDate !== today || isNaN(lat) || isNaN(lng)) continue;
      if (trigType === 'login') continue; // skip login-time ping, already in start
      pings.push({ lat, lng, ts, type: 'ping' });
    }
    // Add ping only if no order within 45 min either side
    const GAP_MS = 45 * 60 * 1000;
    const orderPts = points.filter(p => p.type === 'order');
    pings.forEach(ping => {
      const pingTs = new Date(ping.ts).getTime();
      const nearOrder = orderPts.some(o => Math.abs(new Date(o.ts).getTime() - pingTs) < GAP_MS);
      if (!nearOrder) points.push(ping);
    });
  }

  if (!points.length) return { status: 'error', msg: 'No location data for today' };

  // Sort by timestamp, remove invalid coords
  points.sort((a,b) => a.ts.localeCompare(b.ts));
  const valid = points.filter(p => p.lat && p.lng && !isNaN(p.lat) && !isNaN(p.lng));

  return { status: 'ok', points: valid, count: valid.length };
}

// ══ PUSH SUBSCRIPTIONS ══
function savePushSubscription(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('PushSubscriptions');
  if (!sheet) {
    sheet = ss.insertSheet('PushSubscriptions');
    sheet.appendRow(['OfficerMobile','OfficerName','Endpoint','P256dh','Auth','UpdatedAt']);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,6).setBackground('#185FA5').setFontColor('#ffffff').setFontWeight('bold');
  }
  const rows = sheet.getDataRange().getValues();
  let found = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(data.mobile||'').trim()) { found = i + 1; break; }
  }
  const row = [data.mobile||'', data.name||'', data.endpoint||'', data.p256dh||'', data.auth||'', nowISO_IST()];
  if (found > 0) sheet.getRange(found, 1, 1, 6).setValues([row]);
  else sheet.appendRow(row);
}

function sendForceRefresh(data) {
  const subs = getPushSubscriptions();
  let targets = [];
  if (data.broadcast) {
    targets = subs;
  } else if (data.targetMobile) {
    targets = subs.filter(s => s.mobile === data.targetMobile);
  }
  let sent = 0;
  targets.forEach(sub => {
    try {
      sendFCMSilent(sub, { type: 'force_refresh' });
      sent++;
    } catch(e) { Logger.log('sendForceRefresh error: ' + e); }
  });
  return { sent: sent };
}

function sendFCMSilent(subscription, dataPayload) {
  const props = PropertiesService.getScriptProperties();
  const projectId = props.getProperty('FCM_PROJECT_ID');
  const token = getFCMAccessToken();
  const fcmToken = subscription.endpoint.split('/').pop();
  const payload = {
    message: {
      token: fcmToken,
      data: dataPayload,
      android: { priority: 'high' },
      apns: { headers: { 'apns-priority': '10' } }
    }
  };
  UrlFetchApp.fetch('https://fcm.googleapis.com/v1/projects/' + projectId + '/messages:send', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}


function getPushSubscriptions() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('PushSubscriptions');
  if (!sheet || sheet.getLastRow() < 2) return [];
  const rows = sheet.getDataRange().getValues();
  return rows.slice(1).map(r => ({ mobile: String(r[0]), name: String(r[1]), endpoint: String(r[2]), p256dh: String(r[3]), auth: String(r[4]) })).filter(r => r.endpoint);
}

// ══ FCM SEND PUSH ══
function getFCMAccessToken() {
  const props = PropertiesService.getScriptProperties();
  const clientEmail = props.getProperty('FCM_CLIENT_EMAIL');
  const privateKey  = props.getProperty('FCM_PRIVATE_KEY').replace(/\\n/g, '\n');
  const now = Math.floor(Date.now() / 1000);
  const header  = Utilities.base64EncodeWebSafe(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = Utilities.base64EncodeWebSafe(JSON.stringify({
    iss: clientEmail, scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now
  }));
  const sigInput = header + '.' + payload;
  const sig = Utilities.base64EncodeWebSafe(Utilities.computeRsaSha256Signature(sigInput, privateKey));
  const jwt = sigInput + '.' + sig;
  const resp = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post', contentType: 'application/x-www-form-urlencoded', muteHttpExceptions: true,
    payload: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt
  });
  const token = JSON.parse(resp.getContentText());
  return token.access_token;
}

function sendFCMPush(subscription, title, body, triggerType) {
  const props = PropertiesService.getScriptProperties();
  const projectId = props.getProperty('FCM_PROJECT_ID');
  const token = getFCMAccessToken();
  const message = {
    message: {
      token: subscription.endpoint.split('/').pop(), // FCM registration token
      notification: { title, body },
      data: { triggerType: triggerType||'push', mobile: subscription.mobile, name: subscription.name },
      webpush: { notification: { icon: 'https://lowgifoods.co.in/diabliss-sales-app/icon-192.png', badge: 'https://lowgifoods.co.in/diabliss-sales-app/icon-192.png', tag: triggerType||'diabliss-push' } }
    }
  };
  try {
    UrlFetchApp.fetch('https://fcm.googleapis.com/v1/projects/' + projectId + '/messages:send', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { Authorization: 'Bearer ' + token },
      payload: JSON.stringify(message)
    });
  } catch(e) { Logger.log('FCM send error: ' + e); }
}

// ══ MORNING PUSH — 10:30am IST ══
function sendMorningPush() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const attSheet = ss.getSheetByName('Attendance');
  if (!attSheet) return;
  const todayStr = nowISO_IST().substring(0, 10);
  const attRows = attSheet.getDataRange().getValues();
  const started = new Set();
  for (let i = 1; i < attRows.length; i++) {
    const rowDate = String(attRows[i][0]).substring(0, 10);
    if (rowDate === todayStr && String(attRows[i][5]) === 'startDay') started.add(String(attRows[i][2]).trim());
  }
  const subs = getPushSubscriptions();
  const emps = getSheetData('Employee Config', []);
  subs.forEach(sub => {
    const emp = emps.find(e => String(e.mobile||'').trim() === sub.mobile);
    if (!emp || !['Officer','ASM','RSM'].includes(emp.role)) return;
    if (!started.has(sub.mobile)) {
      sendFCMPush(sub, '⏰ Start your day', 'Please open the app and tap Start My Day', 'morning_push_tap');
    }
  });
  // Alert GM/ASM if officers haven't started
  const pending = subs.filter(s => {
    const emp = emps.find(e => String(e.mobile||'').trim() === s.mobile);
    return emp && ['Officer','ASM','RSM'].includes(emp.role) && !started.has(s.mobile);
  });
  if (pending.length) {
    const gmSubs = subs.filter(s => { const e = emps.find(x => String(x.mobile||'').trim() === s.mobile); return e && ['GM','Admin','Sub-Admin'].includes(e.role); });
    gmSubs.forEach(s => sendFCMPush(s, '⚠️ Officers not started', pending.length + ' officer(s) haven\'t started their day', 'morning_alert'));
  }
}

// ══ EVENING DIGEST — 7pm IST ══
function sendEveningDigest() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const todayStr = todayIST_(); // yyyy-MM-dd
  const attRows = (ss.getSheetByName('Attendance') || {getDataRange:()=>({getValues:()=>[]})}).getDataRange().getValues();
  const ended = new Set();
  const started = new Set();
  for (let i = 1; i < attRows.length; i++) {
    const rowDate = String(attRows[i][0]).substring(0, 10);
    if (rowDate !== todayStr) continue;
    if (String(attRows[i][5]) === 'startDay') started.add(String(attRows[i][2]).trim());
    if (String(attRows[i][5]) === 'endDay')   ended.add(String(attRows[i][2]).trim());
  }
  const orders = getOrdersFromSheet('').filter(o => o.ts && String(o.ts).substring(0,10) === todayStr && !o.noOrder && String(o.ts||'').indexOf('CANCELLED') === -1);
  const totalValue = orders.reduce((s, o) => s + (o.grand || 0), 0);
  const subs = getPushSubscriptions();
  const emps = getSheetData('Employee Config', []);
  subs.forEach(sub => {
    const emp = emps.find(e => String(e.mobile||'').trim() === sub.mobile);
    if (!emp) return;
    if (['Officer','ASM','RSM'].includes(emp.role) && started.has(sub.mobile) && !ended.has(sub.mobile)) {
      sendFCMPush(sub, '🌙 End your day', 'Please open the app and tap End My Day', 'evening_push_tap');
    }
    if (['GM','Admin','Sub-Admin'].includes(emp.role)) {
      sendFCMPush(sub, '📊 Today\'s Summary', 'Orders: ' + orders.length + ' · Value: ₹' + Math.round(totalValue).toLocaleString('en-IN') + ' · Officers active: ' + started.size, 'evening_digest');
    }
  });
}

// ══ PROFORMA INVOICE ══
function saveInvoice(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_INVOICES);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_INVOICES);
    sheet.appendRow(['Invoice No','Date','Officer','Bill To','Ship To','Products','Basic Value (₹)','GST (₹)','Grand Total (₹)','Billing Pattern','Remarks','Synced At']);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,12).setBackground('#EF9F27').setFontColor('#ffffff').setFontWeight('bold');
  }
  sheet.appendRow([data.piNum||'', data.date||'', data.officer||'', data.billTo||'', data.shipTo||'', data.products||'', data.base||'', data.gst||'', data.grand||'', data.pattern||'', data.remarks||'', nowISO_IST()]);
  const props = PropertiesService.getScriptProperties();
  const current = parseInt(props.getProperty('pi_num')||'1');
  props.setProperty('pi_num', String(current+1));
}

function getNextInvoiceNum() {
  const props = PropertiesService.getScriptProperties();
  return parseInt(props.getProperty('pi_num')||'1');
}

// ══ INSTITUTION VISIT ══
function saveInstitutionVisit(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_INST_VISITS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_INST_VISITS);
    sheet.appendRow(['Visit ID','Date','Time','Officer','Mobile','Role','Territory','Institution','Type','City','Contact Person','Status','Follow-up Date','Notes','Latitude','Longitude','Map Link','Synced At']);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,18).setBackground('#4B2D8E').setFontColor('#ffffff').setFontWeight('bold');
  }
  sheet.getRange('B:C').setNumberFormat('@');
  sheet.getRange('R:R').setNumberFormat('@');
  const loc = data.location||{};
  const mapLink = loc.lat&&loc.lng ? 'https://maps.google.com/?q='+loc.lat+','+loc.lng : '';
  sheet.appendRow([
    data.id||'', new Date(data.ts||Date.now()).toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata'}), new Date(data.ts||Date.now()).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kolkata'}),
    data.officer||'', data.officerMobile||'', data.officerRole||'', data.territory||'',
    data.inst?.name||'', data.inst?.type||'', data.inst?.city||'',
    data.contact||'', data.status||'', data.followup||'', data.notes||'',
    loc.lat||'', loc.lng||'', mapLink, nowISO_IST()
  ]);
}

// ══ STORE PHOTO ══
function saveStorePhoto(data) {
  Logger.log('saveStorePhoto called, photo length: ' + (data.photo||'').length + ', store: ' + data.storeName);
  dbg('saveStorePhoto called, photo length: ' + (data.photo||'').length + ', store: ' + data.storeName);
  if (!data.photo || !DRIVE_FOLDER_ID) { dbg('saveStorePhoto: missing photo or DRIVE_FOLDER_ID'); return; }
  try {
    var _sf_parent;
    try { _sf_parent = DriveApp.getFolderById(DRIVE_FOLDER_ID); }
    catch(fe) { dbg('saveStorePhoto: DRIVE_FOLDER_ID failed, using root'); _sf_parent = DriveApp.getRootFolder(); }
    const folder      = _sf_parent;
    const storeFolder = getOrCreateFolder(folder, (data.storeName||'Store') + ' — ' + (data.storeCity||''));
    const parts       = data.photo.split(',');
    const base64      = parts.length > 1 ? parts[1] : parts[0];
    const blob        = Utilities.newBlob(Utilities.base64Decode(base64), 'image/jpeg', 'shelf_' + nowIST_() + '.jpg');
    const file        = storeFolder.createFile(blob);
    file.setDescription('Added by: ' + (data.addedBy||'Officer') + ' on ' + new Date().toLocaleDateString());
    const fileUrl = file.getUrl();
    dbg('saveStorePhoto: file saved to Drive: ' + fileUrl);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Stores');
    if (sheet) {
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][1]).trim() === String(data.storeName||'').trim()) {
          sheet.getRange(i+1, 15).setValue(fileUrl);
          break;
        }
      }
    }
    // Shelf photo email alert — disabled
  } catch(e) { dbg('saveStorePhoto ERROR: ' + e.toString()); }
}

// ══ EMPLOYEE MANAGEMENT ══
function addEmployeeToWhitelist(data) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet   = ss.getSheetByName(SHEET_WHITELIST);
  if (!sheet) { setupWhitelistSheet(); sheet = ss.getSheetByName(SHEET_WHITELIST); }
  const rows  = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(data.mobile).trim()) {
      sheet.getRange(i+1, 2).setValue(data.name||rows[i][1]);
      sheet.getRange(i+1, 3).setValue(data.status||'Active');
      sheet.getRange(i+1, 4).setValue(data.role||rows[i][3]);
      sheet.getRange(i+1, 6).setValue(data.notes||rows[i][5]);
      sheet.getRange(i+1, 7).setValue(data.alertMobile||rows[i][6]);
      sheet.getRange(i+1, 8).setValue(data.territory||rows[i][7]);
      sheet.getRange(i+1, 9).setValue(data.alertEmail||rows[i][8]||'');
      sheet.getRange(i+1, 10).setValue(data.personalEmail||rows[i][9]||'');
      saveEmployeeConfig(ss, data);
      return;
    }
  }
  sheet.appendRow([data.mobile||'', data.name||'', data.status||'Active', data.role||'Officer', nowISO_IST(), data.notes||'', data.alertMobile||'', data.territory||'', data.alertEmail||'', data.personalEmail||'']);
  saveEmployeeConfig(ss, data);
}

function getEmployees() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_WHITELIST);
  if (!sheet) return [];
  const rows  = sheet.getDataRange().getValues();
  const result = [];
  for (let i = 1; i < rows.length; i++) {
    const r      = rows[i];
    const mobile = String(r[0]||'').trim();
    const name   = String(r[1]||'').trim();
    if (!mobile || !name) continue;
    if (mobile.startsWith('(example)') || mobile === 'Mobile Number') continue;
    result.push({ mobile, name, status: String(r[2]||'Active').trim(), role: String(r[3]||'Officer').trim(), addedOn: String(r[4]||'').trim(), notes: String(r[5]||'').trim(), alertMobile: String(r[6]||'').trim(), territory: String(r[7]||'').trim(), alertEmail: String(r[8]||'').trim(), personalEmail: String(r[9]||'').trim() });
  }
  const cfgSheet = ss.getSheetByName('Employee Config');
  if (cfgSheet && cfgSheet.getLastRow() > 1) {
    const cfgRows = cfgSheet.getDataRange().getValues();
    const cfgMap = {};
    for (let i = 1; i < cfgRows.length; i++) {
      const mob = String(cfgRows[i][0]||'').trim();
      if (!mob) continue;
      let tMonth = cfgRows[i][2];
      if (tMonth instanceof Date) tMonth = Utilities.formatDate(tMonth, 'Asia/Kolkata', 'yyyy-MM');
      else { tMonth = String(tMonth||'').trim(); if (tMonth.length > 7) tMonth = tMonth.slice(0,7); }
      cfgMap[mob] = { monthlyTarget: parseFloat(cfgRows[i][1])||0, targetMonth: tMonth, fareLocal: parseFloat(cfgRows[i][3])||0, fareExmarket: parseFloat(cfgRows[i][4])||0, fareNight: parseFloat(cfgRows[i][5])||0, expExmarket: String(cfgRows[i][6]).trim()==='Yes', expNight: String(cfgRows[i][7]).trim()==='Yes', inc1: parseFloat(cfgRows[i][8])||0, inc2: parseFloat(cfgRows[i][9])||0, reportsTo: String(cfgRows[i][10]||'').trim(), reportsTo2: String(cfgRows[i][11]||'').trim() };
    }
    result.forEach(emp => { if (cfgMap[emp.mobile]) Object.assign(emp, cfgMap[emp.mobile]); });
  }
  const usersSheet = ss.getSheetByName(SHEET_USERS);
  if (usersSheet && usersSheet.getLastRow() > 1) {
    const userRows = usersSheet.getDataRange().getValues();
    const lastActiveMap = {};
    for (let i = 1; i < userRows.length; i++) { const mob = String(userRows[i][1]||'').trim(); if (mob) lastActiveMap[mob] = String(userRows[i][5]||'').trim(); }
    result.forEach(emp => { emp.lastActive = lastActiveMap[emp.mobile] || ''; });
  }
  return result;
}

// ══ COMPANY FILES ══
function getCompanyFiles() {
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get('company_files');
    if (cached) return JSON.parse(cached);
    const companyFolder = DriveApp.getFolderById('14SY3lgRVGd3V_Ry_RJB1deTzFb48AFOj');
    const files = companyFolder.getFiles();
    const result = [];
    while (files.hasNext()) {
      const f    = files.next();
      const name = f.getName();
      const ext  = name.split('.').pop().toLowerCase();
      const type = ext === 'pdf' ? 'pdf' : ['jpg','jpeg','png','gif','webp'].includes(ext) ? 'image' : 'other';
      if (type === 'other') continue;
      result.push({ name, type, url: f.getDownloadUrl(), size: formatSize(f.getSize()), description: f.getDescription()||'' });
    }
    try { if (result.length) cache.put('company_files', JSON.stringify(result), 21600); } catch(ce) {}
    return result;
  } catch(e) { Logger.log('ERROR: ' + e); return []; }
}

function clearCompanyFilesCache() {
  CacheService.getScriptCache().remove('company_files');
  Logger.log('Company files cache cleared');
}
// ══ PERF LOG ══
function perfLog_(action, ms) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('Perf Log');
    if (!sheet) {
      sheet = ss.insertSheet('Perf Log');
      sheet.appendRow(['Timestamp','Action','Duration (ms)','Slow?']);
      sheet.setFrozenRows(1);
      sheet.getRange(1,1,1,4).setBackground('#159ADB').setFontColor('#fff').setFontWeight('bold');
    }
    const slow = ms > 3000 ? 'YES' : '';
    sheet.appendRow([nowISO_IST(), action, ms, slow]);
    // Keep only last 500 rows
    const last = sheet.getLastRow();
    if (last > 501) sheet.deleteRows(2, last - 501);
  } catch(e) {}
}

function formatSize(bytes) {
  if (bytes > 1048576) return (bytes/1048576).toFixed(1)+' MB';
  return Math.round(bytes/1024)+' KB';
}

// ══ USER REGISTRY ══
function registerUser(name, mobile, role, territory) { updateLastActive(name, mobile, role, territory); }

function updateLastActive(name, mobile, role, territory) {
  if (!mobile) return;
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet   = ss.getSheetByName(SHEET_USERS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_USERS);
    sheet.appendRow(['Name','Mobile','Role','Territory','First Seen','Last Active']);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,6).setBackground('#159ADB').setFontColor('#ffffff').setFontWeight('bold');
    sheet.getRange('E:F').setNumberFormat('@');
  }
  const data  = sheet.getDataRange().getValues();
  const found = data.findIndex((row,i) => i>0 && String(row[1]).trim() == String(mobile).trim());
  if (found > 0) { sheet.getRange(found+1, 6).setValue(nowISO_IST()); }
  else { sheet.appendRow([name||'', mobile||'', role||'Officer', territory||'', nowISO_IST(), nowISO_IST()]); }
}

function fixSpreadsheetTimezone() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  ss.setSpreadsheetTimeZone(TIMEZONE);
}

function setupWhitelistSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_WHITELIST);
  if (!sheet) sheet = ss.insertSheet(SHEET_WHITELIST);
  sheet.getRange(1,1,1,10).setValues([['Mobile Number','Name','Status','Role','Added On','Notes','Alert Mobile','Territory','Alert Email','Employee Email']]);
  sheet.getRange(1,1,1,10).setBackground('#159ADB').setFontColor('#ffffff').setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function getOrCreateFolder(parent, name) {
  const iter = parent.getFoldersByName(name);
  if (iter.hasNext()) return iter.next();
  return parent.createFolder(name);
}

// ══ EXPENSES ══
function saveExpense(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Expenses');
  if (!sheet) {
    sheet = ss.insertSheet('Expenses');
    sheet.appendRow(['Expense ID','Date','Officer','Mobile','Role','Territory','Travel Type','Base Fare','Additional Expenses','Total','Items','Notes','Status','Synced At']);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,14).setBackground('#EF9F27').setFontColor('#ffffff').setFontWeight('bold');
  }
  const items = (data.items||[]).map(i=>i.desc+': ₹'+i.amt).join(' | ');
  sheet.appendRow([data.id||'',data.date||'',data.officer||'',data.officerMobile||'',data.officerRole||'',data.territory||'',data.typeLabel||data.type||'',data.baseFare||0,data.extra||0,data.total||0,items,data.notes||'','Submitted',nowISO_IST()]);
}

// ══ CANCEL ORDER ══
function cancelOrder(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_ORDERS);
  if (!sheet) return;
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(data.orderId).trim()) {
      sheet.getRange(i+1,29).setValue('CANCELLED');
      sheet.getRange(i+1,1,1,29).setBackground('#fde8e8').setFontColor('#888');
      break;
    }
  }
}

// ══ SEND LEAVE EMAIL ══
function sendLeaveEmail(data) {
  const alertEmail = data.alertEmail || '';
  if (!alertEmail) return;
  const subject = 'Leave Notification — ' + (data.officer||'') + ' — ' + (data.date||'');
  const body = `<div style="font-family:Arial,sans-serif;max-width:480px"><div style="background:#159ADB;color:#fff;padding:14px 18px;border-radius:6px 6px 0 0"><div style="font-size:15px;font-weight:700">Diabliss Leave Notification</div></div><div style="background:#f9f9f9;padding:16px 18px;border:1px solid #eee"><table style="width:100%;font-size:13px"><tr><td style="color:#666;width:120px">Officer</td><td style="font-weight:600">${data.officer||''}</td></tr><tr><td style="color:#666">Territory</td><td>${data.territory||''}</td></tr><tr><td style="color:#666">Date</td><td>${data.date||''}</td></tr><tr><td style="color:#666">Leave type</td><td style="font-weight:600;color:#159ADB">${data.leaveType||''}</td></tr>${data.reason?'<tr><td style="color:#666">Reason</td><td>'+data.reason+'</td></tr>':''}</table></div></div>`;
  try { GmailApp.sendEmail(alertEmail, subject, '', { htmlBody: body, name: 'Diabliss Sales App' }); } catch(e) {}
}

// ══ SEND ALERT EMAIL ══
function sendAlertEmail(data) {
  const recipients = data.recipients || '';
  if (!recipients) return;
  const subject  = data.subject || 'Diabliss Alert';
  const htmlBody = data.htmlBody || '';
  try {
    recipients.split(',').forEach(email => {
      email = email.trim();
      if (email && email.includes('@')) GmailApp.sendEmail(email, subject, '', { htmlBody, name: 'Diabliss Sales App' });
    });
  } catch(e) { Logger.log('Alert email error: ' + e.message); }
}

// ══ SAVE CORRECTION ══
function saveCorrection(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Correction Log');
  if (!sheet) {
    sheet = ss.insertSheet('Correction Log');
    sheet.appendRow(['Type','Officer','Record ID','Date','Original Value','New Value','Reason','Corrected By','Corrected At']);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,9).setBackground('#EF9F27').setFontColor('#ffffff').setFontWeight('bold');
  }
  sheet.getRange('D:D').setNumberFormat('@'); sheet.getRange('I:I').setNumberFormat('@');
  sheet.appendRow([data.type||'',data.officer||'',data.orderId||data.expId||data.date||'',data.date||'',data.originalStatus||data.original||'',data.newStatus||data.action||'',data.reason||'',data.correctedBy||'',data.correctedAt||nowISO_IST()]);
  sheet.getRange(sheet.getLastRow(),1,1,9).setBackground('#FFF3CD');
}

// ══ ARCHIVE ORDERS ══
function archiveOrders(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const ordersSheet = ss.getSheetByName(SHEET_ORDERS);
  if (!ordersSheet) return;
  let archiveSheet = ss.getSheetByName('Orders Archive');
  if (!archiveSheet) {
    archiveSheet = ss.insertSheet('Orders Archive');
    const headers = ordersSheet.getRange(1,1,1,ordersSheet.getLastColumn()).getValues();
    archiveSheet.appendRow(headers[0]);
    archiveSheet.setFrozenRows(1);
    archiveSheet.getRange(1,1,1,headers[0].length).setBackground('#888').setFontColor('#ffffff').setFontWeight('bold');
  }
}

// ══ SAVE HOLIDAY ══
function saveHoliday(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Holidays');
  if (!sheet) {
    sheet = ss.insertSheet('Holidays');
    sheet.appendRow(['ID','Date','Name','Type','Territories','Added By','Added At']);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,7).setBackground('#4B2D8E').setFontColor('#ffffff').setFontWeight('bold');
  }
  sheet.appendRow([data.id||'',data.date||'',data.name||'',data.type||'universal',(data.territories||[]).join(', '),'',nowISO_IST()]);
}

// ══ BACKUP ══
function backupData(data) {
  if (!DRIVE_FOLDER_ID) return;
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const backupsRoot = getOrCreateFolder(folder, 'Backups');
  const backupFolder = getOrCreateFolder(backupsRoot, 'App Backups');
  const officerFolder = getOrCreateFolder(backupFolder, (data.officer||'Unknown') + ' — ' + (data.territory||'All'));
  officerFolder.createFile(Utilities.newBlob(JSON.stringify(data, null, 2), 'application/json', 'backup_' + todayIST_() + '.json'));
}

// ══ HANDOVER ══
function handoverData(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Handover Log');
  if (!sheet) { sheet = ss.insertSheet('Handover Log'); sheet.appendRow(['From Officer','To Officer','Done By','Timestamp']); sheet.setFrozenRows(1); }
  sheet.appendRow([data.from||'',data.to||'',data.by||'',nowISO_IST()]);
}

// ══ PRODUCTS ══
function saveProduct(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Products');
  if (!sheet) {
    sheet = ss.insertSheet('Products');
    sheet.appendRow(['Product ID','Name','Category','MRP (₹)','Case Qty','HSN','Active','Added By','Added At']);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,9).setBackground('#159ADB').setFontColor('#ffffff').setFontWeight('bold');
  }
  sheet.getRange('I:I').setNumberFormat('@');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(data.id).trim()) {
      sheet.getRange(i+1,3).setValue(data.category||data.cat||'');
      sheet.getRange(i+1,4).setValue(data.mrp||0);
      sheet.getRange(i+1,5).setValue(data.case||data.casePack||0);
      sheet.getRange(i+1,6).setValue(data.hsn||'');
      sheet.getRange(i+1,7).setValue(data.active!==false?'Yes':'No');
      return;
    }
  }
  sheet.appendRow([data.id||'',data.name||'',data.category||data.cat||'',data.mrp||0,data.case||data.casePack||0,data.hsn||'',data.active!==false?'Yes':'No',data.addedBy||'',data.addedAt||nowIST()]);
}

function getProductsFromSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Products');
  if (!sheet || sheet.getLastRow() < 2) return [];
  const rows = sheet.getDataRange().getValues();
  const result = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!String(r[0]).trim()) continue;
    result.push({ id: String(r[0]).trim(), name: String(r[1]).trim(), category: String(r[2]).trim(), cat: String(r[2]).trim(), mrp: parseFloat(r[3])||0, case: parseInt(r[4])||1, casePack: parseInt(r[4])||1, hsn: String(r[5]).trim(), active: String(r[6]).trim()!=='No', addedBy: String(r[7]).trim(), addedAt: String(r[8]).trim() });
  }
  return result;
}

// ══ FOLLOW-UPS ══
function saveFollowup(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Follow-ups');
  if (!sheet) {
    sheet = ss.insertSheet('Follow-ups');
    sheet.appendRow(['ID','Store/Party','Visit Type','Note','Follow-up Date','Officer','Territory','Created At','Done']);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,9).setBackground('#EF9F27').setFontColor('#ffffff').setFontWeight('bold');
  }
  sheet.appendRow([data.id||'',data.store||'',data.type||'',data.note||'',data.followupDate||'',data.officer||'',data.territory||'',data.createdAt||nowISO_IST(),data.done?'Yes':'No']);
}

// ══ EMPLOYEE CONFIG ══
function saveEmployeeConfig(ss, data) {
  if (!data.mobile) return;
  let tSheet = ss.getSheetByName('Employee Config');
  if (!tSheet) {
    tSheet = ss.insertSheet('Employee Config');
    tSheet.appendRow(['Mobile','Monthly Target','Target Month','Local Fare','Exmarket Fare','Night Fare','Exp Exmarket','Exp Night','Inc1%','Inc2%','Reports To','Reports To 2','Updated At']);
    tSheet.setFrozenRows(1);
    tSheet.getRange(1,1,1,13).setBackground('#159ADB').setFontColor('#ffffff').setFontWeight('bold');
  }
  const tRows = tSheet.getDataRange().getValues();
  const newRow = [data.mobile||'',data.monthlyTarget||0,(data.targetMonth?new Date(data.targetMonth+'-01'):''),data.fareLocal||0,data.fareExmarket||0,data.fareNight||0,data.expExmarket?'Yes':'No',data.expNight?'Yes':'No',data.inc1||0,data.inc2||0,data.reportsTo||'',data.reportsTo2||'',nowISO_IST()];
  for (let i = 1; i < tRows.length; i++) {
    if (String(tRows[i][0]).trim() === String(data.mobile).trim()) { tSheet.getRange(i+1,1,1,13).setValues([newRow]); return; }
  }
  tSheet.appendRow(newRow);
}

function getEmployeeConfig(mobile) {
  if (!mobile) return null;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const cfgSheet = ss.getSheetByName('Employee Config');
  if (!cfgSheet) return null;
  const rows = cfgSheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(mobile).trim()) {
      return { monthlyTarget: parseFloat(rows[i][1])||0, targetMonth: String(rows[i][2]).trim(), fareLocal: parseFloat(rows[i][3])||0, fareExmarket: parseFloat(rows[i][4])||0, fareNight: parseFloat(rows[i][5])||0, expExmarket: String(rows[i][6]).trim()==='Yes', expNight: String(rows[i][7]).trim()==='Yes', inc1: parseFloat(rows[i][8])||0, inc2: parseFloat(rows[i][9])||0, reportsTo: String(rows[i][10]).trim(), reportsTo2: String(rows[i][11]).trim() };
    }
  }
  return null;
}

// ══ GENERIC SHEET DATA READER ══
function getSheetData(sheetName, expectedHeaders) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0].map(h => String(h).trim());
  const result = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!String(r[0]).trim()) continue;
    const obj = {};
    headers.forEach((h, idx) => { obj[h.toLowerCase().replace(/\s+/g,'_')] = String(r[idx]||'').trim(); });
    result.push(obj);
  }
  return result.slice(-200);
}

// ══ DELETE RECORD ══
function deleteRecord(sheetName, id) {
  if (!id) return;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  const rows = sheet.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][0]).trim() === String(id).trim()) { sheet.deleteRow(i + 1); return; }
  }
}

// ══ ORDERS ══
const ORDER_COL = {
  id:0, date:1, time:2, officer:3, officerMobile:4, role:5, territory:6,
  store:7, storeCity:8, storeTerritory:9, margin:10,
  distributor:11, distType:12, distTerritory:13, distCity:14,
  products:15, auditSummary:16, unsaleableSummary:17,
  basicValue:18, gst:19, grandTotal:20, hasSpecial:21, hasUns:22,
  notes:23, latitude:24, longitude:25, address:26, mapLink:27, syncedAt:28
};

function tsCellToIso_(dateCell, timeCell, syncedAtCell) {
  // Prefer the order's actual date+time over Synced At — Synced At is when
  // the row was written to the sheet, which can lag behind (or differ from)
  // when the order was actually placed, breaking "is this today's order"
  // checks used by team dashboards and MIS reports.
  const dateStr = dateCell ? String(dateCell).trim() : '';
  if (dateStr) {
    const timeStr = timeCell ? String(timeCell).trim() : '';
    const combined = timeStr ? new Date(dateStr + ' ' + timeStr) : new Date(dateStr);
    if (!isNaN(combined.getTime())) return combined.toISOString();
  }
  const raw = syncedAtCell;
  if (!raw) return '';
  if (raw instanceof Date) return raw.toISOString();
  const d = new Date(String(raw).trim());
  return isNaN(d.getTime()) ? String(raw).trim() : d.toISOString();
}

function getOrdersFromSheet(territory, dayLimit, fromDate, toDate) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_ORDERS);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const rows = sheet.getDataRange().getValues();
  const result = [];
  const now = new Date();
  const cutoff = dayLimit ? new Date(now.getTime() - dayLimit * 864e5) : null;
  const fromD = fromDate ? new Date(fromDate + 'T00:00:00+05:30') : null;
  const toD = toDate ? new Date(toDate + 'T23:59:59+05:30') : null;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const id = String(r[ORDER_COL.id]||'').trim();
    if (!id) continue;
    const terr = String(r[ORDER_COL.territory]||'').trim();
    if (territory && territory !== 'All' && terr !== territory) continue;
    const ts = tsCellToIso_(r[ORDER_COL.date], r[ORDER_COL.time], r[ORDER_COL.syncedAt]);
    if (ts) {
      const tsD = new Date(ts);
      if (cutoff && tsD < cutoff) continue;
      if (fromD && tsD < fromD) continue;
      if (toD && tsD > toD) continue;
    }
    let dateStr = '', timeStr = '';
    const tsDate = ts ? new Date(ts) : null;
    if (tsDate && !isNaN(tsDate.getTime())) {
      dateStr = Utilities.formatDate(tsDate, 'Asia/Kolkata', 'dd MMM yyyy');
      timeStr = Utilities.formatDate(tsDate, 'Asia/Kolkata', 'hh:mm a');
    } else {
      dateStr = String(r[ORDER_COL.date]||'').trim();
      timeStr = String(r[ORDER_COL.time]||'').trim();
    }
    const productsText = String(r[ORDER_COL.products]||'').trim();
    result.push({ id, date: dateStr, time: timeStr, officer: String(r[ORDER_COL.officer]||'').trim(), officerMobile: String(r[ORDER_COL.officerMobile]||'').trim(), officerRole: String(r[ORDER_COL.role]||'').trim()||'Officer', store: String(r[ORDER_COL.store]||'').trim(), storeCity: String(r[ORDER_COL.storeCity]||'').trim(), storeTerritory: String(r[ORDER_COL.storeTerritory]||'').trim(), distributor: String(r[ORDER_COL.distributor]||'').trim(), territory: terr, productsText, items: parseProductsText_(productsText), sub: parseFloat(r[ORDER_COL.basicValue])||0, gst: parseFloat(r[ORDER_COL.gst])||0, grand: parseFloat(r[ORDER_COL.grandTotal])||0, total: parseFloat(r[ORDER_COL.grandTotal])||0, hasSpecial: String(r[ORDER_COL.hasSpecial]||'').toUpperCase()==='YES', hasUns: String(r[ORDER_COL.hasUns]||'').toUpperCase()==='YES', notes: String(r[ORDER_COL.notes]||'').trim(), noOrder: productsText.indexOf('NO ORDER')===0, ts });
  }
  return result;
}

function parseProductsText_(text) {
  if (!text || text.indexOf('NO ORDER')===0) return [];
  const items = [];
  text.split(',').forEach(part => {
    part = part.trim();
    if (!part) return;
    const m = part.match(/^(.*?)[×xX]\s*(\d+)\s*@\s*₹?\s*([\d.]+)/);
    if (m) { const qty = parseInt(m[2])||0; const price = parseFloat(m[3])||0; items.push({ name: m[1].trim(), qty, price, total: Math.round(qty*price*100)/100 }); }
    else items.push({ name: part, qty: 0, price: 0, total: 0 });
  });
  return items;
}

// ══ STORES ══
const STORE_COL = { id:0, name:1, address:2, city:3, territory:4, contact:5, phone:6, mobile:7, email:8, gstin:9, margin:10, addedBy:11, addedAt:12, closed:13, photoUrl:14, distId:15, distName:16 };

function saveStore(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Stores');
  if (!sheet) {
    sheet = ss.insertSheet('Stores');
    sheet.appendRow(['Store ID','Name','Address','City','Territory','Contact','Phone','Mobile','Email','GSTIN','Margin','Added By','Added At','Closed','Photo URL','Distributor ID','Distributor Name']);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,17).setBackground('#159ADB').setFontColor('#ffffff').setFontWeight('bold');
  }
  sheet.getRange('M:M').setNumberFormat('@');
  const row = [data.id,data.name||'',data.address||'',data.city||'',data.territory||'',data.contact||'',data.phone||'',data.mobile||'',data.email||'',data.gstin||'',data.margin||'',data.addedBy||'',data.addedAt||nowIST(),data.closed?'Yes':'No',data.photoUrl||'',data.distId||'',data.distName||''];
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(data.id).trim()) { row[STORE_COL.addedAt] = data.addedAt || rows[i][STORE_COL.addedAt] || nowIST(); sheet.getRange(i+1,1,1,17).setValues([row]); return; }
  }
  sheet.appendRow(row);
}

function getStoresFromSheet(territory) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Stores');
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  const result = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const id = String(r[STORE_COL.id]||'').trim();
    const name = String(r[STORE_COL.name]||'').trim();
    if (!id || !name) continue;
    const terr = String(r[STORE_COL.territory]||'').trim();
    if (territory && territory !== 'All' && terr !== territory) continue;
    result.push({ id, name, address: String(r[STORE_COL.address]||'').trim(), city: String(r[STORE_COL.city]||'').trim(), territory: terr, contact: String(r[STORE_COL.contact]||'').trim(), phone: String(r[STORE_COL.phone]||'').trim(), mobile: String(r[STORE_COL.mobile]||'').trim(), email: String(r[STORE_COL.email]||'').trim(), gstin: String(r[STORE_COL.gstin]||'').trim(), margin: String(r[STORE_COL.margin]||'').trim(), addedBy: String(r[STORE_COL.addedBy]||'').trim(), addedAt: String(r[STORE_COL.addedAt]||'').trim(), closed: String(r[STORE_COL.closed]||'').trim()==='Yes', distId: String(r[STORE_COL.distId]||'').trim(), distName: String(r[STORE_COL.distName]||'').trim() });
  }
  return result;
}

// ══ DISTRIBUTORS ══
function saveDist(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Distributors');
  if (!sheet) {
    sheet = ss.insertSheet('Distributors');
    sheet.appendRow(['Dist ID','Name','Type','Pattern','Territory','City','Contact','Mobile','GSTIN','Address','Added By','Added At']);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,12).setBackground('#185FA5').setFontColor('#ffffff').setFontWeight('bold');
  }
  sheet.getRange('L:L').setNumberFormat('@');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(data.id).trim()) { sheet.getRange(i+1,1,1,12).setValues([[data.id,data.name||'',data.type||'',data.pattern||'',data.territory||'',data.city||'',data.contact||'',data.mobile||'',data.gstin||'',data.address||'',data.addedBy||'',data.addedAt||'']]); return; }
  }
  sheet.appendRow([data.id,data.name||'',data.type||'',data.pattern||'',data.territory||'',data.city||'',data.contact||'',data.mobile||'',data.gstin||'',data.address||'',data.addedBy||'',data.addedAt||nowIST()]);
}

function getDistsFromSheet(territory) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Distributors');
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => String(h).trim().toLowerCase());
  const col = (name) => { const i = headers.indexOf(name); return i >= 0 ? i : -1; };
  const result = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const id = String(col('dist id')>=0?r[col('dist id')]:r[0]||'').trim();
    const name = String(col('name')>=0?r[col('name')]:r[1]||'').trim();
    if (!id || !name) continue;
    const terr = String(col('territory')>=0?r[col('territory')]:r[4]||'').trim();
    if (territory && territory !== 'All' && terr !== territory) continue;
    result.push({ id, name, type: String(col('type')>=0?r[col('type')]:r[2]||'').trim(), pattern: String(col('pattern')>=0?r[col('pattern')]:r[3]||'').trim(), territory: terr, city: String(col('city')>=0?r[col('city')]:r[5]||'').trim(), contact: String(col('contact')>=0?r[col('contact')]:r[6]||'').trim(), mobile: String(col('mobile')>=0?r[col('mobile')]:r[7]||'').trim(), gstin: String(col('gstin')>=0?r[col('gstin')]:r[8]||'').trim(), address: String(col('address')>=0?r[col('address')]:r[9]||'').trim() });
  }
  return result;
}

// ══ INSTITUTIONS ══
function saveInstitution(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Institutions');
  if (!sheet) {
    sheet = ss.insertSheet('Institutions');
    sheet.appendRow(['Inst ID','Name','Type','Address','City','Territory','Contact','Dept','Mobile','Status','Added By','Added At','Distributor ID','Distributor Name']);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,14).setBackground('#4B2D8E').setFontColor('#ffffff').setFontWeight('bold');
  }
  sheet.getRange('L:L').setNumberFormat('@');
  const row = [data.id,data.name||'',data.type||'',data.address||'',data.city||'',data.territory||'',data.contact||'',data.dept||'',data.mobile||'',data.status||'',data.addedBy||'',data.addedAt||nowIST(),data.distId||'',data.distName||''];
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(data.id).trim()) { row[11] = data.addedAt || rows[i][11] || nowIST(); sheet.getRange(i+1,1,1,14).setValues([row]); return; }
  }
  sheet.appendRow(row);
}

function getInstsFromSheet(territory) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Institutions');
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  const result = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!String(r[0]).trim()) continue;
    const terr = String(r[5]).trim();
    if (territory && territory !== 'All' && terr !== territory) continue;
    result.push({ id:String(r[0]).trim(), name:String(r[1]).trim(), type:String(r[2]).trim(), address:String(r[3]).trim(), city:String(r[4]).trim(), territory:terr, contact:String(r[6]).trim(), dept:String(r[7]).trim(), mobile:String(r[8]).trim(), status:String(r[9]).trim(), distId:String(r[12]||'').trim(), distName:String(r[13]||'').trim() });
  }
  return result;
}

// ══ HOLIDAYS ══
function saveHolidayToSheet(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Holidays');
  if (!sheet) { sheet = ss.insertSheet('Holidays'); sheet.appendRow(['ID','Date','Name','Type','Territories','Added By','Added At']); sheet.setFrozenRows(1); sheet.getRange(1,1,1,7).setBackground('#4B2D8E').setFontColor('#ffffff').setFontWeight('bold'); }
  sheet.appendRow([data.id||'',data.date||'',data.name||'',data.type||'universal',(data.territories||[]).join(', '),data.by||'',nowISO_IST()]);
}

function getHolidaysFromSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Holidays');
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  const result = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!String(r[0]).trim()) continue;
    result.push({ id:String(r[0]).trim(), date:String(r[1]).trim(), name:String(r[2]).trim(), type:String(r[3]).trim(), territories:String(r[4]).trim().split(',').map(t=>t.trim()).filter(Boolean) });
  }
  return result;
}

// ══ TARGETS ══
function saveTargetToSheet(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Targets');
  if (!sheet) { sheet = ss.insertSheet('Targets'); sheet.appendRow(['Mobile','Officer','Monthly Target (₹)','Target Month','Set By','Updated At']); sheet.setFrozenRows(1); sheet.getRange(1,1,1,6).setBackground('#159ADB').setFontColor('#ffffff').setFontWeight('bold'); }
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(data.mobile).trim()) { sheet.getRange(i+1,3).setValue(data.monthly||0); sheet.getRange(i+1,4).setValue(data.targetMonth||''); sheet.getRange(i+1,5).setValue(data.setBy||''); sheet.getRange(i+1,6).setValue(nowISO_IST()); return; }
  }
  sheet.appendRow([data.mobile||'',data.officer||'',data.monthly||0,data.targetMonth||'',data.setBy||'',nowISO_IST()]);
}

function getTargetsFromSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Targets');
  if (!sheet) return {};
  const rows = sheet.getDataRange().getValues();
  const result = {};
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!String(r[0]).trim()) continue;
    result[String(r[0]).trim()] = { monthly: parseFloat(r[2])||0, targetMonth: String(r[3]).trim() };
  }
  return result;
}

// ══ LEDGER ══
function saveLedgerEntryToSheet(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Ledger');
  if (!sheet) { sheet = ss.insertSheet('Ledger'); sheet.appendRow(['Entry ID','Date','Party ID','Party Name','Party Type','Entry Type','Amount (₹)','Dr/Cr','Particulars','Added By','Timestamp']); sheet.setFrozenRows(1); sheet.getRange(1,1,1,11).setBackground('#185FA5').setFontColor('#ffffff').setFontWeight('bold'); }
  sheet.appendRow([data.id||'',data.date||'',data.partyId||'',data.partyName||'',data.partyType||'',data.type||'',data.amount||0,data.drCr||'',data.particulars||'',data.by||'',nowISO_IST()]);
  const lastRow = sheet.getLastRow();
  if (data.type==='debit') sheet.getRange(lastRow,1,1,11).setBackground('#FCEBEB');
  else if (data.type==='credit') sheet.getRange(lastRow,1,1,11).setBackground('#DCF0FB');
  clearLedgerCache(data.partyId||null);
}

function getLedgerFromSheet(partyId) {
  try {
    const cacheKey = 'ledger_' + (partyId || 'all');
    const cache = CacheService.getScriptCache();
    const cached = cache.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch(ce) {}
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Ledger');
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  const result = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!String(r[0]).trim()) continue;
    if (partyId && String(r[2]).trim() !== String(partyId).trim()) continue;
    result.push({ id:String(r[0]).trim(), date: r[1] ? Utilities.formatDate(new Date(r[1]), 'Asia/Kolkata', 'yyyy-MM-dd') : '', partyId:String(r[2]).trim(), type:String(r[5]).trim(), amount:parseFloat(r[6])||0, drCr:String(r[7]).trim(), particulars:String(r[8]).trim(), by:String(r[9]).trim() });
  }
  const sorted = result.sort((a,b) => a.date.localeCompare(b.date));
  try {
    const json = JSON.stringify(sorted);
    if (json.length < 100000) CacheService.getScriptCache().put('ledger_' + (partyId || 'all'), json, 1800);
  } catch(ce) {}
  return sorted;
}

function clearLedgerCache(partyId) {
  try {
    const cache = CacheService.getScriptCache();
    if (partyId) cache.remove('ledger_' + partyId);
    cache.remove('ledger_all');
  } catch(e) {}
}

// ══ BROADCASTS ══
function saveBroadcastToSheet(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Broadcasts');
  if (!sheet) { sheet = ss.insertSheet('Broadcasts'); sheet.appendRow(['ID','Message','By','Expires','Active','Target Roles','Timestamp']); sheet.setFrozenRows(1); sheet.getRange(1,1,1,7).setBackground('#185FA5').setFontColor('#ffffff').setFontWeight('bold'); }
  sheet.appendRow([data.id||'',data.msg||'',data.by||'',data.expiry||'',data.active?'Yes':'No',(data.targetRoles||[]).join(','),nowISO_IST()]);
}

function deactivateBroadcastInSheet(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Broadcasts');
  if (!sheet) return;
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(data.id||'').trim()) {
      sheet.getRange(i+1, 5).setValue('No');
      return;
    }
  }
}

function getActiveBroadcastFromSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Broadcasts');
  if (!sheet) return null;
  const rows = sheet.getDataRange().getValues();
  const now = new Date();
  for (let i = rows.length-1; i >= 1; i--) {
    const r = rows[i];
    if (String(r[4]).trim() !== 'Yes') continue;
    if (r[3] && new Date(r[3]) < now) continue;
    return { id:String(r[0]).trim(), msg:String(r[1]).trim(), by:String(r[2]).trim(), expiry:String(r[3]).trim(), targetRoles:String(r[5]).trim().split(',') };
  }
  return null;
}

// ══ MIS REPORT ══
function computeMISData(type) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const ordersSheet = ss.getSheetByName(SHEET_ORDERS);
  const now = new Date();
  const tz = TIMEZONE;
  let periodLabel;
  if (type === 'daily') { periodLabel = 'Daily Report — ' + Utilities.formatDate(now, tz, 'dd MMM yyyy'); }
  else if (type === 'yesterday_compare') { periodLabel = 'Yesterday'; now.setDate(now.getDate()-1); }
  else if (type === 'weekly') { const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate()-7); periodLabel = 'Weekly Report — ' + Utilities.formatDate(weekAgo, tz, 'dd/MM/yyyy') + ' to ' + Utilities.formatDate(now, tz, 'dd/MM/yyyy'); }
  else { const monthStart = new Date(now.getFullYear(), now.getMonth(), 1); periodLabel = 'Monthly Report — ' + Utilities.formatDate(monthStart, tz, 'MMM yyyy'); }
  const filtered = [];
  if (ordersSheet && ordersSheet.getLastRow() >= 2) {
    const rows = ordersSheet.getDataRange().getValues();
    const tsCol = ORDER_COL.syncedAt, dateCol = ORDER_COL.date, timeCol = ORDER_COL.time;
    const yesterday = new Date(now); if (type !== 'yesterday_compare') yesterday.setDate(yesterday.getDate()-1);
    const yStr = Utilities.formatDate(yesterday, tz, 'yyyy-MM-dd');
    const weekAgoStr = Utilities.formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()-7), tz, 'yyyy-MM-dd');
    const monthStartStr = Utilities.formatDate(new Date(now.getFullYear(), now.getMonth(), 1), tz, 'yyyy-MM-dd');
    const todayStr = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!String(r[0]).trim()) continue;
      if (String(r[28]||'').includes('CANCELLED')) continue;
      const ts = String(tsCellToIso_(r[dateCol], r[timeCol], r[tsCol]) || '').trim();
      if (!ts) continue;
      const rowDateStr = ts.slice(0,10);
      if (type === 'daily' && rowDateStr !== todayStr) continue;
      if (type === 'yesterday_compare' && rowDateStr !== yStr) continue;
      if (type === 'weekly' && (rowDateStr < weekAgoStr || rowDateStr > todayStr)) continue;
      if (type === 'monthly' && rowDateStr < monthStartStr) continue;
      filtered.push({ row: r });
    }
  }
  const terrCol = ORDER_COL.territory, offCol = ORDER_COL.officer, storeCol = ORDER_COL.store, distCol = ORDER_COL.distributor, totalCol = ORDER_COL.grandTotal, itemsCol = ORDER_COL.products, idCol = ORDER_COL.id;
  const hierarchy = {};
  const mobileCol = ORDER_COL.officerMobile;
  filtered.forEach(({row: r}) => {
    const terr = String(terrCol>=0?r[terrCol]:'Unknown').trim()||'Unknown';
    const rawOfficer = String(offCol>=0?r[offCol]:'').trim()||'Unassigned';
    const mobile = String(mobileCol>=0?r[mobileCol]:'').trim();
    const key = mobile || rawOfficer; // prefer mobile as dedup key
    const store = String(storeCol>=0?r[storeCol]:'').trim()||'Unknown store';
    const dist = String(distCol>=0?r[distCol]:'').trim();
    const total = parseFloat(totalCol>=0?r[totalCol]:0)||0;
    const items = String(itemsCol>=0?r[itemsCol]:'').trim();
    const orderId = String(idCol>=0?r[idCol]:'').trim();
    if (!hierarchy[terr]) hierarchy[terr] = { orders:0, value:0, officers:{} };
    hierarchy[terr].orders++; hierarchy[terr].value += total;
    const to = hierarchy[terr].officers;
    if (!to[key]) to[key] = { orders:0, value:0, stores:{}, mobile, rawName: rawOfficer };
    to[key].orders++; to[key].value += total;
    const ts = to[key].stores;
    if (!ts[store]) ts[store] = { orders:0, value:0, dist, orderList:[] };
    ts[store].orders++; ts[store].value += total;
    ts[store].orderList.push({ id: orderId, value: total, products: items });
  });
  ALL_TERRITORIES.forEach(t => { if (!hierarchy[t]) hierarchy[t] = { orders:0, value:0, officers:{} }; });
  // ── ASM Accompaniment tagging ──
  // Build map: officerMobile → ASM name from Attendance remarks
  const accompMap = {};
  try {
    const attSheet = ss.getSheetByName(SHEET_ATTENDANCE);
    if (attSheet && attSheet.getLastRow() > 1) {
      const attRows = attSheet.getDataRange().getValues();
      attRows.slice(1).forEach(r => {
        const remarks = String(r[20]||'');
        if (remarks.includes('Accompanying:')) {
          // This row is an ASM who was accompanying — skip
        }
        // Find officers who were accompanied: check if any ASM row references this officer mobile
        const asmMobile = String(r[2]||'').trim();
        const m = remarks.match(/Accompanying: ([^(]+) \(([^)]+)\)/);
        if (m) {
          const accompMobile = m[2].trim();
          const asmName = String(r[1]||'').trim();
          accompMap[accompMobile] = asmName;
        }
      });
    }
  } catch(e) {}
  // Tag officer entries with accompaniment
  Object.values(hierarchy).forEach(td => {
    Object.entries(td.officers).forEach(([key, od]) => {
      if (accompMap[od.mobile]) od.accompaniedBy = accompMap[od.mobile];
    });
  });
  const totalOrders = filtered.length;
  const totalValue = filtered.reduce((a,{row: r}) => a + (parseFloat(totalCol>=0?r[totalCol]:0)||0), 0);
  const activeTerritories = Object.values(hierarchy).filter(t => t.orders > 0).length;
  const totalOfficers = new Set(filtered.map(({row: r}) => String(offCol>=0?r[offCol]:''))).size;
  return { type, periodLabel, generatedAt: Utilities.formatDate(now, tz, 'dd MMM yyyy, hh:mm a'), totals: { orders: totalOrders, value: Math.round(totalValue), territories: activeTerritories, officers: totalOfficers }, hierarchy };
}

function shapeMISDataForStorage(misData) {
  const totalVal = misData.totals.value || 1;
  const displayNames = getOfficerDisplayNames(); // mobile → proper name from Whitelist
  // Product breakdown from hierarchy
  const productMap = {};
  Object.values(misData.hierarchy).forEach(td => {
    Object.values(td.officers).forEach(od => {
      Object.values(od.stores).forEach(sd => {
        (sd.orderList||[]).forEach(o => {
          const products = String(o.products||'');
          if (!products || products.indexOf('NO ORDER')===0) return;
          products.split(/[|;,]/).forEach(seg => {
            seg = seg.trim(); if (!seg) return;
            const m = seg.match(/^(.+?)[×x](\d+)@[₹]?([\d.]+)/i);
            if (!m) return;
            const name = m[1].trim(); const qty = parseInt(m[2]); const val = parseFloat(m[3])*qty;
            if (!productMap[name]) productMap[name] = {name,qty:0,orders:0,value:0};
            productMap[name].qty+=qty; productMap[name].orders++; productMap[name].value+=val;
          });
        });
      });
    });
  });
  const products = Object.values(productMap).sort((a,b)=>b.value-a.value).slice(0,10).map(p=>({
    name:p.name, qty:p.qty, orders:p.orders, value:Math.round(p.value), pct:Math.round(p.value/totalVal*100)
  }));
  const allStores = new Set();
  const territories = Object.entries(misData.hierarchy).map(([tName, td]) => {
    const officers = Object.entries(td.officers).map(([oKey, od]) => {
      // Resolve display name: Whitelist mobile lookup → rawName fallback → key
      const displayName = (od.mobile && displayNames[od.mobile]) ? displayNames[od.mobile]
                        : (od.rawName || oKey);
      const stores = Object.entries(od.stores).map(([sName, sd]) => {
        allStores.add(sName);
        return { name: sName, distributor: sd.dist||'', orders: sd.orders, value: Math.round(sd.value), orderList: sd.orderList.map(o => ({ id: o.id, value: Math.round(o.value), products: o.products })) };
      }).sort((a,b) => b.value - a.value);
      return { name: displayName, orders: od.orders, value: Math.round(od.value), stores: stores.length, storeList: stores, accompaniedBy: od.accompaniedBy||'' };
    }).sort((a,b) => b.value - a.value);
    return { name: tName, orders: td.orders, value: Math.round(td.value), officers };
  }).sort((a,b) => b.value - a.value);
  const totals = { ...misData.totals, stores: allStores.size };
  return { id: '', type: misData.type, periodLabel: misData.periodLabel, generatedAt: misData.generatedAt, totals, territories, products };
}

function generateReportId() { return Utilities.getUuid().replace(/-/g, ''); }
const MIS_CHUNK_SIZE = 45000;

function storeMISReportData(id, shapedData) {
  const json = JSON.stringify(shapedData);
  if (json.length < 95000) { try { CacheService.getScriptCache().put('mis_' + id, json, MIS_CACHE_SECONDS); } catch(e) {} }
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('MIS Reports Data');
  if (!sheet) { sheet = ss.insertSheet('MIS Reports Data'); sheet.appendRow(['Report ID','Type','Period Label','Created At','Data JSON (chunked)']); sheet.setFrozenRows(1); sheet.getRange(1,1,1,5).setBackground('#159ADB').setFontColor('#ffffff').setFontWeight('bold'); sheet.hideSheet(); }
  const chunks = [];
  for (let i = 0; i < json.length; i += MIS_CHUNK_SIZE) chunks.push(json.slice(i, i + MIS_CHUNK_SIZE));
  sheet.appendRow([id, shapedData.type, shapedData.periodLabel, nowISO_IST()].concat(chunks));
}

function getMISReportById(id) {
  if (!id) return null;
  try { const cached = CacheService.getScriptCache().get('mis_' + id); if (cached) return JSON.parse(cached); } catch(e) {}
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('MIS Reports Data');
  if (!sheet) return null;
  const rows = sheet.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][0]).trim() === id) {
      try { const json = rows[i].slice(4).map(c => String(c||'')).join(''); const parsed = JSON.parse(json); if (json.length < 95000) { try { CacheService.getScriptCache().put('mis_' + id, json, MIS_CACHE_SECONDS); } catch(e) {} } return parsed; } catch(e) { return null; }
    }
  }
  return null;
}

function sendMISReport(data) {
  data = data || {};
  const misData = computeMISData(data.type);
  const shaped = shapeMISDataForStorage(misData);
  const reportId = generateReportId();
  shaped.id = reportId;
  storeMISReportData(reportId, shaped);
  const webAppUrl = getWebAppUrl();
  const green = '#159ADB';
  const darkBlue = '#0d47a1';

  // ── Yesterday comparison (daily only) ──────────────────────────────────────
  let yestValue = 0;
  let trendHtml = '';
  if (data.type === 'daily') {
    try {
      const yestData = computeMISData('yesterday_compare');
      yestValue = yestData.totals.value || 0;
    } catch(e) {}
    if (yestValue > 0) {
      const diff = misData.totals.value - yestValue;
      const pct = Math.round(Math.abs(diff) / yestValue * 100);
      const up = diff >= 0;
      trendHtml = `<div style="margin-top:10px;font-size:15px;font-weight:700;color:${up?'#ffffff':'#ffcccc'}">
        ${up?'&#9650;':'&#9660;'} ${up?'+':''}${pct}% vs yesterday (&#8377;${yestValue.toLocaleString('en-IN')})
      </div>`;
    }
  }

  // ── Top 3 performers ───────────────────────────────────────────────────────
  const allOfficers = [];
  Object.entries(misData.hierarchy).forEach(([terrName, td]) => {
    Object.values(td.officers).forEach(od => {
      allOfficers.push({ name: od.rawName, value: od.value, orders: od.orders, territory: terrName });
    });
  });
  allOfficers.sort((a,b) => b.value - a.value);
  const medals = ['&#127942;','&#129352;','&#129353;'];
  const podiumHtml = allOfficers.slice(0,3).map((o,i) =>
    `<td style="width:33%;padding:12px 6px;text-align:center;border-right:${i<2?'1px solid #eef0f3':'none'}">
      <div style="font-size:20px">${medals[i]}</div>
      <div style="font-size:12px;font-weight:700;color:#1a1a1a;margin-top:4px">${o.name.split(' ').slice(0,2).join(' ')}</div>
      <div style="font-size:13px;font-weight:800;color:${green};margin-top:2px">&#8377;${Math.round(o.value).toLocaleString('en-IN')}</div>
      <div style="font-size:11px;color:#888;margin-top:1px">${o.orders} orders</div>
      <div style="font-size:10px;color:#bbb;margin-top:2px;text-transform:uppercase;letter-spacing:.5px">${o.territory}</div>
    </td>`
  ).join('');

  // ── Email body ─────────────────────────────────────────────────────────────
  let body = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #dde3ea;border-radius:10px;overflow:hidden">`;

  // Header
  body += `<div style="background:linear-gradient(135deg,#1565c0 0%,#159ADB 100%);padding:28px 24px;text-align:center">
    <div style="font-size:12px;color:rgba(255,255,255,0.75);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Diabliss Sales App</div>
    <div style="font-size:14px;color:rgba(255,255,255,0.85);font-weight:600;margin-bottom:16px">${misData.periodLabel}</div>
    <div style="font-size:48px;font-weight:900;color:#ffffff;letter-spacing:-1px;line-height:1">&#8377;${misData.totals.value.toLocaleString('en-IN')}</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:6px">Total Revenue</div>
    ${trendHtml}
    <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-top:12px">Generated ${misData.generatedAt}</div>
  </div>`;

  // Summary tiles
  body += `<table style="width:100%;border-collapse:collapse;border-bottom:2px solid #eef0f3">
    <tr>
      <td style="width:25%;padding:16px 8px;text-align:center;border-right:1px solid #eef0f3">
        <div style="font-size:26px;font-weight:900;color:${green}">${misData.totals.orders}</div>
        <div style="font-size:11px;color:#888;font-weight:700;margin-top:3px;text-transform:uppercase">&#128230; Orders</div>
      </td>
      <td style="width:25%;padding:16px 8px;text-align:center;border-right:1px solid #eef0f3;background:#f0f7ff">
        <div style="font-size:26px;font-weight:900;color:${green}">&#8377;${misData.totals.value.toLocaleString('en-IN')}</div>
        <div style="font-size:11px;color:#888;font-weight:700;margin-top:3px;text-transform:uppercase">&#128181; Value</div>
      </td>
      <td style="width:25%;padding:16px 8px;text-align:center;border-right:1px solid #eef0f3">
        <div style="font-size:26px;font-weight:900;color:${green}">${misData.totals.territories}</div>
        <div style="font-size:11px;color:#888;font-weight:700;margin-top:3px;text-transform:uppercase">&#128506; Territories</div>
      </td>
      <td style="width:25%;padding:16px 8px;text-align:center">
        <div style="font-size:26px;font-weight:900;color:${green}">${misData.totals.officers}</div>
        <div style="font-size:11px;color:#888;font-weight:700;margin-top:3px;text-transform:uppercase">&#128100; Officers</div>
      </td>
    </tr>
  </table>`;

  // Top performers podium
  if (podiumHtml) {
    body += `<div style="padding:20px 24px 0">
      <div style="font-size:13px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px">&#127942; Top Performers</div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #eef0f3;border-radius:8px">
        <tr>${podiumHtml}</tr>
      </table>
    </div>`;
  }



  // Territory table
  body += `<div style="padding:20px 24px">
    <div style="font-size:13px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px">Territory Breakdown</div>
    <div style="margin-bottom:14px;padding:10px 14px;background:#f0f7ff;border-left:4px solid ${green};border-radius:4px;font-size:14px;color:#444">
      &#9759; Tap any territory name to view officer, store &amp; product-level detail.
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr style="background:#f7f8fa">
        <th style="padding:10px 12px;text-align:left;font-size:13px;color:#555;font-weight:700;border-radius:6px 0 0 6px">Territory</th>
        <th style="padding:10px 8px;text-align:center;font-size:13px;color:#555;font-weight:700">Officers</th>
        <th style="padding:10px 8px;text-align:center;font-size:13px;color:#555;font-weight:700">Orders</th>
        <th style="padding:10px 12px;text-align:right;font-size:13px;color:#555;font-weight:700;border-radius:0 6px 6px 0">&#8377; Value</th>
      </tr>`;
  shaped.territories.forEach((t,i) => {
    const link = REPORT_PAGE_URL + '?territory=' + encodeURIComponent(t.name);
    const isZero = t.orders === 0;
    const bg = i % 2 === 0 ? '#ffffff' : '#fafbfc';
    const officerCount = t.officers ? t.officers.length : 0;
    body += `<tr style="background:${bg};border-bottom:1px solid #eef0f3">
      <td style="padding:13px 12px">
        <a href="${link}" style="color:${isZero?'#aaa':green};font-size:15px;font-weight:700;text-decoration:none">${t.name}</a>
      </td>
      <td style="padding:13px 8px;text-align:center;font-size:15px;font-weight:600;color:${isZero?'#aaa':'#1a1a1a'}">${officerCount}</td>
      <td style="padding:13px 8px;text-align:center;font-size:15px;font-weight:600;color:${isZero?'#aaa':'#1a1a1a'}">${t.orders}</td>
      <td style="padding:13px 12px;text-align:right;font-size:15px;font-weight:800;color:${isZero?'#aaa':green}"><span style="font-size:13px;font-weight:600">&#8377;</span>${t.value.toLocaleString('en-IN')}</td>
    </tr>`;
  });
  body += `</table>
  </div>`;
  // Footer
  body += `<div style="background:#f7f8fa;border-top:1px solid #eef0f3;padding:16px;text-align:center;font-size:13px;color:#aaa">
    Diabliss Consumer Products Pvt Ltd &nbsp;·&nbsp; Automated Report
  </div></div>`;
  const recipients = data.recipients || '';
  if (!recipients) return;
  const subject = 'Diabliss Sales App — ' + misData.periodLabel + ' | \u20B9' + misData.totals.value.toLocaleString('en-IN') + ' \u00B7 ' + misData.totals.orders + ' Orders';
  recipients.split(',').forEach(email => { email = email.trim(); if (email) GmailApp.sendEmail(email, subject, '', { htmlBody: body, name: 'Diabliss Reports' }); });
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let logSheet = ss.getSheetByName('MIS Log');
  if (!logSheet) { logSheet = ss.insertSheet('MIS Log'); logSheet.appendRow(['Type','Recipients','Sent By','Orders','Value','Report ID','Status','Timestamp']); logSheet.setFrozenRows(1); }
  logSheet.appendRow([data.type, recipients, data.sentBy||'', misData.totals.orders, misData.totals.value, reportId, 'Sent', misData.generatedAt]);
}

function getStoreHistory(storeName, limit) {
  if (!storeName) return [];
  limit = Math.min(Math.max(limit || 10, 1), 50);
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_ORDERS);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const rows = sheet.getDataRange().getValues();
  const target = String(storeName).trim().toLowerCase();
  const result = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!String(r[0]).trim()) continue;
    if (String(r[28]||'').includes('CANCELLED')) continue;
    if (String(r[ORDER_COL.store]||'').trim().toLowerCase() !== target) continue;
    result.push({ id: String(r[ORDER_COL.id]||'').trim(), date: String(r[ORDER_COL.date]||'').trim(), officer: String(r[ORDER_COL.officer]||'').trim(), distributor: String(r[ORDER_COL.distributor]||'').trim(), value: Math.round(parseFloat(r[ORDER_COL.grandTotal])||0), products: String(r[ORDER_COL.products]||'').trim(), ts: tsCellToIso_(r[ORDER_COL.date], r[ORDER_COL.time], r[ORDER_COL.syncedAt]) });
  }
  result.sort((a,b) => b.ts.localeCompare(a.ts));
  return result.slice(0, limit);
}

function renderMISReportPage(reportData, openTerritory, webAppUrl) {
  const dataJson = JSON.stringify(reportData).replace(/</g, '\\u003c');
  const openTerritoryJson = JSON.stringify(openTerritory || '');
  const appUrlJson = JSON.stringify(webAppUrl || '');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>Diabliss MIS Report</title><style>:root{--green:#159ADB;--lightgreen:#DCF0FB;--ink:#222;--muted:#888}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;background:#f5f5f3;margin:0;padding:20px;color:var(--ink)}.wrap{max-width:720px;margin:0 auto}.header{background:var(--green);color:#fff;padding:24px;border-radius:10px 10px 0 0;text-align:center}.header h1{margin:0;font-size:20px}.header p{margin:6px 0 0;opacity:.9;font-size:13px}.summary{display:flex;background:#fff;border-bottom:1px solid #eee}.summary div{flex:1;text-align:center;padding:14px;border-right:1px solid #eee}.summary div:last-child{border-right:none}.summary .num{font-size:20px;font-weight:700;color:var(--green)}.summary .lbl{font-size:11px;color:var(--muted)}.body{background:#fff;border-radius:0 0 10px 10px;padding:16px}.row{border:1px solid #e6e6e6;border-radius:8px;margin-bottom:8px;overflow:hidden}.row-head{padding:12px 14px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;user-select:none}.row-head:hover{background:#fafafa}.row-head .name{font-weight:600;font-size:14px}.row-head .meta{font-size:12px;color:var(--muted)}.row-head .chev{transition:transform .15s;color:var(--muted);font-size:12px;margin-left:8px}.row.open>.row-head .chev{transform:rotate(90deg)}.row-body{display:none;padding:0 14px 12px 14px}.row.open>.row-body{display:block}.territory>.row-head{background:var(--green);color:#fff}.territory>.row-head .meta{color:#e8fff5}.officer{margin-top:8px}.officer>.row-head{background:#f3f3f1}.store>.row-head{background:var(--lightgreen)}.order-line{font-size:12px;padding:8px 0;border-bottom:1px dashed #eee;cursor:pointer}.order-line:last-child{border-bottom:none}.order-line .top{display:flex;justify-content:space-between;color:#333;font-weight:600}.order-line .products{display:none;margin-top:6px;color:#666;font-style:italic;font-size:11px;line-height:1.5}.order-line.open .products{display:block}.hist-link{display:inline-block;margin-top:8px;font-size:11px;color:var(--green);cursor:pointer;text-decoration:underline}.hist-box{margin-top:8px;border-top:1px solid #e6e6e6;padding-top:8px}.hist-title{font-size:11px;font-weight:700;color:#666;margin-bottom:4px;text-transform:uppercase;letter-spacing:.4px}.hist-item{font-size:11px;padding:6px 0;border-bottom:1px dashed #eee}.hist-item:last-child{border-bottom:none}.hist-item .h-top{display:flex;justify-content:space-between;color:#333}.hist-item .h-prod{color:#777;font-style:italic;margin-top:2px;line-height:1.4}.hist-loading{font-size:11px;color:var(--muted);font-style:italic}.empty{text-align:center;padding:30px;color:var(--muted);font-size:13px}.zero{opacity:.45}.footer{text-align:center;font-size:11px;color:#999;padding:14px}</style></head><body><div class="wrap"><div class="header"><h1>Diabliss MIS Report</h1><p id="periodLabel"></p><p id="generatedAt" style="opacity:.7;font-size:11px"></p></div><div class="summary" id="summary"></div><div class="body" id="territoryList"></div><div class="footer">Diabliss Sales App · Diabliss Consumer Products Pvt Ltd</div></div><script>const REPORT=${dataJson};const OPEN_TERRITORY=${openTerritoryJson};const APP_URL=${appUrlJson};document.getElementById('periodLabel').textContent=REPORT.periodLabel;document.getElementById('generatedAt').textContent='Generated '+REPORT.generatedAt;const summaryEl=document.getElementById('summary');summaryEl.innerHTML=[['Orders',REPORT.totals.orders],['Value','₹'+REPORT.totals.value.toLocaleString('en-IN')],['Territories',REPORT.totals.territories],['Officers',REPORT.totals.officers]].map(([lbl,val])=>'<div><div class="num">'+val+'</div><div class="lbl">'+lbl+'</div></div>').join('');function fmt(v){return'₹'+v.toLocaleString('en-IN')}function toggle(el){el.classList.toggle('open')}function buildProducts(text){if(!text)return'No product detail recorded';return String(text).split(/[|;\n]/).map(s=>esc(s.trim())).filter(Boolean).join('<br>')}function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}function buildStore(store){const ordersHtml=store.orderList.map(o=>'<div class="order-line" onclick="toggle(this)"><div class="top"><span>Order '+esc(o.id||'—')+'</span><span>'+fmt(o.value)+'</span></div><div class="products">'+buildProducts(o.products)+'</div></div>').join('');return'<div class="row store" data-store="'+esc(store.name)+'"><div class="row-head" onclick="toggle(this.parentElement)"><div><div class="name">'+esc(store.name)+'</div><div class="meta">Distributor: '+esc(store.distributor||'—')+'</div></div><div style="display:flex;align-items:center"><div class="meta">'+store.orders+' orders · '+fmt(store.value)+'</div><span class="chev">&#9656;</span></div></div><div class="row-body">'+ordersHtml+'<span class="hist-link" onclick="loadHistory(event,this)">View previous orders</span><div class="hist-box" style="display:none"></div></div></div>'}function loadHistory(ev,link){ev.stopPropagation();const storeEl=link.closest('.store');const box=storeEl.querySelector('.hist-box');if(box.style.display!=='none'){box.style.display='none';link.textContent='View previous orders';return}box.style.display='block';link.textContent='Hide previous orders';if(box.dataset.loaded)return;box.innerHTML='<div class="hist-loading">Loading order history…</div>';const storeName=storeEl.getAttribute('data-store');fetch(APP_URL+'?action=getStoreHistory&store='+encodeURIComponent(storeName)+'&limit=10').then(r=>r.json()).then(data=>{box.dataset.loaded='1';const hist=(data&&data.history)||[];if(!hist.length){box.innerHTML='<div class="hist-loading">No previous orders found.</div>';return}box.innerHTML='<div class="hist-title">Previous orders (latest '+hist.length+')</div>'+hist.map(h=>'<div class="hist-item"><div class="h-top"><span>'+esc(h.date||'')+' · '+esc(h.officer||'')+'</span><span>'+fmt(h.value||0)+'</span></div>'+(h.products?'<div class="h-prod">'+buildProducts(h.products)+'</div>':'')+'</div>').join('')}).catch(()=>{box.innerHTML='<div class="hist-loading">Could not load history.</div>'})}function buildOfficer(officer){const accompTag=officer.accompaniedBy?'<span style="font-size:10px;background:#e8f5e9;color:#1a7a3c;border-radius:4px;padding:1px 5px;margin-left:6px">🤝 '+esc(officer.accompaniedBy)+'</span>':'';return'<div class="row officer"><div class="row-head" onclick="toggle(this.parentElement)"><div class="name">'+esc(officer.name)+accompTag+'</div><div style="display:flex;align-items:center"><div class="meta">'+officer.orders+' orders · '+fmt(officer.value)+'</div><span class="chev">&#9656;</span></div></div><div class="row-body">'+officer.stores.map(buildStore).join('')+'</div></div>'}function buildTerritory(territory){const isZero=territory.orders===0;return'<div class="row territory'+(isZero?' zero':'')+'" data-name="'+esc(territory.name)+'"><div class="row-head" onclick="toggle(this.parentElement)"><div class="name">'+esc(territory.name)+'</div><div style="display:flex;align-items:center"><div class="meta">'+territory.orders+' orders · '+fmt(territory.value)+'</div><span class="chev">&#9656;</span></div></div><div class="row-body">'+(territory.officers.length?territory.officers.map(buildOfficer).join(''):'<div class="empty">No orders recorded</div>')+'</div></div>'}const listEl=document.getElementById('territoryList');if(!REPORT.territories.length){listEl.innerHTML='<div class="empty">No data available</div>'}else{listEl.innerHTML=REPORT.territories.map(buildTerritory).join('');if(OPEN_TERRITORY){const target=listEl.querySelector('[data-name="'+OPEN_TERRITORY.replace(/"/g,'')+'"]');if(target){target.classList.add('open');try{target.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){}}}}</script></body></html>`;
}

// ══ COMPLIANCE CHECKS ══
function autoCloseStaleAttendanceDays() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const attSheet = ss.getSheetByName(SHEET_ATTENDANCE);
  const ordersSheet = ss.getSheetByName(SHEET_ORDERS);
  if (!attSheet) return;
  const todayStr = todayIST_();
  const rows = attSheet.getDataRange().getValues();
  const closedOrLeave = new Set();
  const starts = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const date = String(r[0]).trim(), mobile = String(r[2]).trim(), action = r[5];
    if (!date || !mobile) continue;
    const key = mobile + '|' + date;
    if (action === 'endDay' || action === 'leave') closedOrLeave.add(key);
    if (action === 'startDay' && date !== todayStr) starts.push({ date, officer: String(r[1]).trim(), mobile, role: String(r[3]).trim(), territory: String(r[4]).trim() });
  }
  const stale = starts.filter(s => !closedOrLeave.has(s.mobile + '|' + s.date));
  if (!stale.length) return;
  let orderRows = [];
  if (ordersSheet && ordersSheet.getLastRow() > 1) orderRows = ordersSheet.getDataRange().getValues();
  stale.forEach(s => {
    let ordersCount = 0, totalValue = 0;
    const storesSet = new Set();
    for (let i = 1; i < orderRows.length; i++) {
      const r = orderRows[i];
      if (!String(r[ORDER_COL.id]||'').trim()) continue;
      const ts = tsCellToIso_(r[ORDER_COL.date], r[ORDER_COL.time], r[ORDER_COL.syncedAt]);
    if (ts) {
      const tsD = new Date(ts);
      if (cutoff && tsD < cutoff) continue;
      if (fromD && tsD < fromD) continue;
      if (toD && tsD > toD) continue;
    }
      if (!ts || ts.slice(0,10) !== s.date) continue;
      if (String(r[ORDER_COL.officer]||'').trim() !== s.officer) continue;
      ordersCount++; storesSet.add(String(r[ORDER_COL.store]||'').trim());
      totalValue += parseFloat(r[ORDER_COL.grandTotal])||0;
    }
    attSheet.appendRow([s.date, s.officer, s.mobile, s.role, s.territory, 'endDay', '', 'Auto-closed', '', '', ordersCount, storesSet.size, totalValue, '', '', '', '', '', '', '', '⚠️ Auto-closed — officer did not end this day', nowISO_IST()]);
  });
}

function checkEndOfDayCompliance() {
  autoCloseStaleAttendanceDays();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const attSheet = ss.getSheetByName(SHEET_ATTENDANCE), wlSheet = ss.getSheetByName(SHEET_WHITELIST);
  if (!attSheet || !wlSheet) return;
  const todayStr = todayIST_();
  const attRows = attSheet.getDataRange().getValues();
  const started = new Set(), ended = new Set();
  for (let i = 1; i < attRows.length; i++) {
    const r = attRows[i];
    if (String(r[0]).trim() !== todayStr) continue;
    const mobile = String(r[2]).trim();
    if (!mobile) continue;
    if (r[5] === 'startDay') started.add(mobile);
    if (r[5] === 'endDay') ended.add(mobile);
  }
  const pending = [...started].filter(m => !ended.has(m));
  if (!pending.length) return;
  const wlRows = wlSheet.getDataRange().getValues();
  const pendingDetails = [];
  pending.forEach(mobile => {
    const row = wlRows.find((r,i) => i>0 && String(r[0]).trim() === mobile);
    const name = row ? String(row[1]||'').trim() : mobile;
    const email = row ? String(row[9]||row[8]||'').trim() : '';
    pendingDetails.push({ mobile, name, email });
    if (email && email.includes('@')) { try { GmailApp.sendEmail(email, 'Reminder: End your day on Diabliss Sales App', '', { htmlBody: '<p>Hi '+name+',</p><p>Please open the Diabliss Sales App and tap <b>End my day</b>.</p>', name: 'Diabliss Sales App' }); } catch(e) {} }
  });
  const cfg = getMISConfig();
  if (cfg.recipients) {
    const rows = pendingDetails.map(p => '<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">'+p.name+'</td><td style="padding:6px 10px;border-bottom:1px solid #eee">'+p.mobile+'</td></tr>').join('');
    const html = '<div style="font-family:Arial;max-width:480px"><div style="background:#159ADB;color:#fff;padding:16px;border-radius:8px 8px 0 0"><h2 style="margin:0;font-size:16px">&#9200; End-of-day — '+pendingDetails.length+' pending</h2></div><div style="background:#fff;border:1px solid #eee;padding:12px 16px"><table style="width:100%;border-collapse:collapse;font-size:13px"><tr style="color:#888;font-size:11px"><th style="padding:6px 10px">Name</th><th style="padding:6px 10px">Mobile</th></tr>'+rows+'</table></div></div>';
    cfg.recipients.split(',').forEach(email => { email = email.trim(); if (email && email.includes('@')) { try { GmailApp.sendEmail(email, 'Diabliss — '+pendingDetails.length+' officer(s) haven\'t ended their day', '', { htmlBody: html, name: 'Diabliss Sales App' }); } catch(e) {} } });
  }
}

function checkStartOfDayCompliance() {
  autoCloseStaleAttendanceDays();
  const now = new Date();
  const dow = Number(Utilities.formatDate(now, TIMEZONE, 'u'));
  if (dow === 7) return;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const attSheet = ss.getSheetByName(SHEET_ATTENDANCE), wlSheet = ss.getSheetByName(SHEET_WHITELIST);
  if (!attSheet || !wlSheet) return;
  const todayStr = todayIST_();
  const holidays = getHolidaysFromSheet().filter(h => h.date === todayStr);
  const universalHoliday = holidays.some(h => h.type === 'universal' || !h.territories.length);
  if (universalHoliday) return;
  const holidayTerritories = new Set();
  holidays.forEach(h => h.territories.forEach(t => holidayTerritories.add(t)));
  const attRows = attSheet.getDataRange().getValues();
  const started = new Set(), onLeave = new Set();
  for (let i = 1; i < attRows.length; i++) {
    const r = attRows[i];
    if (String(r[0]).trim() !== todayStr) continue;
    const mobile = String(r[2]).trim();
    if (!mobile) continue;
    if (r[5] === 'startDay') started.add(mobile);
    if (r[5] === 'leave') onLeave.add(mobile);
  }
  const wlRows = wlSheet.getDataRange().getValues();
  const pendingDetails = [];
  for (let i = 1; i < wlRows.length; i++) {
    const row = wlRows[i];
    const mobile = String(row[0]||'').trim(), status = String(row[2]||'').trim(), role = String(row[3]||'').trim(), territory = String(row[7]||'').trim();
    if (!mobile || status !== 'Active' || !['Officer','ASM','RSM'].includes(role)) continue;
    if (started.has(mobile) || onLeave.has(mobile) || holidayTerritories.has(territory)) continue;
    const name = String(row[1]||'').trim(), email = String(row[9]||row[8]||'').trim();
    pendingDetails.push({ mobile, name, email });
    if (email && email.includes('@')) { try { GmailApp.sendEmail(email, 'Reminder: Start your day on Diabliss Sales App', '', { htmlBody: '<p>Hi '+name+',</p><p>Please open the Diabliss Sales App and tap <b>Start my day</b>.</p>', name: 'Diabliss Sales App' }); } catch(e) {} }
  }
  if (!pendingDetails.length) return;
  const cfg = getMISConfig();
  if (cfg.recipients) {
    const rows = pendingDetails.map(p => '<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">'+p.name+'</td><td style="padding:6px 10px;border-bottom:1px solid #eee">'+p.mobile+'</td></tr>').join('');
    const html = '<div style="font-family:Arial;max-width:480px"><div style="background:#159ADB;color:#fff;padding:16px;border-radius:8px 8px 0 0"><h2 style="margin:0;font-size:16px">&#9200; Start-of-day — '+pendingDetails.length+' not started</h2></div><div style="background:#fff;border:1px solid #eee;padding:12px 16px"><table style="width:100%;border-collapse:collapse;font-size:13px"><tr style="color:#888;font-size:11px"><th style="padding:6px 10px">Name</th><th style="padding:6px 10px">Mobile</th></tr>'+rows+'</table></div></div>';
    cfg.recipients.split(',').forEach(email => { email = email.trim(); if (email && email.includes('@')) { try { GmailApp.sendEmail(email, 'Diabliss — '+pendingDetails.length+' officer(s) haven\'t started their day', '', { htmlBody: html, name: 'Diabliss Sales App' }); } catch(e) {} } });
  }
}

function getAppVersion() {
  const override = PropertiesService.getScriptProperties().getProperty('APP_VERSION_OVERRIDE');
  return override || APP_VERSION;
}

function setAppVersion(version) {
  if (!version) return;
  PropertiesService.getScriptProperties().setProperty('APP_VERSION_OVERRIDE', version);
}

function runDailyBackup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let logSheet = ss.getSheetByName('Backup Log');
  if (!logSheet) { logSheet = ss.insertSheet('Backup Log'); logSheet.appendRow(['Timestamp','Type','Status','Officer','Notes']); logSheet.setFrozenRows(1); logSheet.getRange(1,1,1,5).setBackground('#159ADB').setFontColor('#ffffff').setFontWeight('bold'); }
  try {
    const parentFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const backupFolder = getOrCreateFolder(getOrCreateFolder(parentFolder, 'Backups'), 'Sheet Backups');
    const name = 'Diabliss DB Backup — ' + Utilities.formatDate(new Date(), TIMEZONE, 'dd MMM yyyy, HH-mm') + ' IST';
    DriveApp.getFileById(SPREADSHEET_ID).makeCopy(name, backupFolder);
    logSheet.appendRow([nowISO_IST(),'Scheduled','Success','System','Saved as "'+name+'"']);
  } catch(e) { logSheet.appendRow([nowISO_IST(),'Scheduled','FAILED','System','Error: '+e.message]); }
}

function setupMISTriggers() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('mis_recipients')) { props.setProperty('mis_recipients', 'info@diabliss.com,ramesh@diabliss.com'); }
  ScriptApp.getProjectTriggers().forEach(t => { if (['sendDailyMIS','sendWeeklyMIS','sendMonthlyMIS','runDailyBackup','checkEndOfDayCompliance','checkStartOfDayCompliance','gasKeepAlive'].includes(t.getHandlerFunction())) ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('runDailyBackup').timeBased().everyDays(1).atHour(23).create();
  ScriptApp.newTrigger('checkStartOfDayCompliance').timeBased().everyDays(1).atHour(10).create();
  ScriptApp.newTrigger('checkEndOfDayCompliance').timeBased().everyDays(1).atHour(19).create();
  ScriptApp.newTrigger('sendDailyMIS').timeBased().everyDays(1).atHour(20).create();
  ScriptApp.newTrigger('sendWeeklyMIS').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(9).create();
  ScriptApp.newTrigger('sendMonthlyMIS').timeBased().onMonthDay(1).atHour(10).create();
  ScriptApp.newTrigger('gasKeepAlive').timeBased().everyMinutes(5).create();
  Logger.log('All triggers set up including keep-alive every 5 min.');
}

// ══ SUPABASE SYNC ══════════════════════════════════════════════════════════

function supabaseRequest_(method, path, payload) {
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + SUPABASE_SECRET_KEY,
      'apikey': SUPABASE_SECRET_KEY,
      'Prefer': 'return=minimal,resolution=merge-duplicates'
    },
    muteHttpExceptions: true,
    deadline: 60
  };
  if (payload) options.payload = JSON.stringify(payload);
  const res = UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/' + path, options);
  Logger.log('Supabase ' + method + ' ' + path + ' → ' + res.getResponseCode() + ' ' + res.getContentText().slice(0,300));
  return { code: res.getResponseCode(), body: res.getContentText() };
}

function testSupabaseConnection() {
  // Test with a single dummy-safe fetch first
  const res = supabaseRequest_('GET', 'orders?limit=1', null);
  Logger.log('Test result: ' + res.code + ' ' + res.body.slice(0,500));
}

function syncOrdersToSupabase() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_ORDERS);
    if (!sheet || sheet.getLastRow() < 2) return;

    // Only sync last 90 days to keep payload small
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = Utilities.formatDate(cutoff, TIMEZONE, 'yyyy-MM-dd');

    const rows = sheet.getDataRange().getValues();
    const batch = [];

    const seenIds = new Set();
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const id = String(r[ORDER_COL.id]||'').trim();
      if (!id) continue;
      if (seenIds.has(id)) continue; // skip duplicate IDs
      if (String(r[ORDER_COL.notes]||'').includes('CANCELLED')) continue;
      if (String(r[ORDER_COL.id]||'').toUpperCase().includes('CANCELLED')) continue;

      const ts = tsCellToIso_(r[ORDER_COL.date], r[ORDER_COL.time], r[ORDER_COL.syncedAt]);
      if (!ts) continue;
      const dateStr = ts.slice(0,10);
      // Skip if date is not a valid date string
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;
      if (dateStr < cutoffStr) continue;
      seenIds.add(id);

      batch.push({
        id: id,
        order_date: dateStr,
        order_time: String(r[ORDER_COL.time]||'').trim(),
        officer: String(r[ORDER_COL.officer]||'').trim(),
        officer_mobile: String(r[ORDER_COL.officerMobile]||'').trim(),
        role: String(r[ORDER_COL.role]||'').trim(),
        territory: String(r[ORDER_COL.territory]||'').trim(),
        store: String(r[ORDER_COL.store]||'').trim(),
        store_city: String(r[ORDER_COL.storeCity]||'').trim(),
        store_territory: String(r[ORDER_COL.storeTerritory]||'').trim(),
        margin: parseFloat(r[ORDER_COL.margin])||0,
        distributor: String(r[ORDER_COL.distributor]||'').trim(),
        dist_type: String(r[ORDER_COL.distType]||'').trim(),
        dist_territory: String(r[ORDER_COL.distTerritory]||'').trim(),
        dist_city: String(r[ORDER_COL.distCity]||'').trim(),
        products: String(r[ORDER_COL.products]||'').trim(),
        audit_summary: String(r[ORDER_COL.auditSummary]||'').trim(),
        unsaleable_summary: String(r[ORDER_COL.unsaleableSummary]||'').trim(),
        basic_value: parseFloat(r[ORDER_COL.basicValue])||0,
        gst: parseFloat(r[ORDER_COL.gst])||0,
        grand_total: parseFloat(r[ORDER_COL.grandTotal])||0,
        has_special: String(r[ORDER_COL.hasSpecial]||'').toLowerCase()==='true',
        has_unsaleable: String(r[ORDER_COL.hasUns]||'').toLowerCase()==='true',
        notes: String(r[ORDER_COL.notes]||'').trim(),
        latitude: String(r[ORDER_COL.latitude]||'').trim(),
        longitude: String(r[ORDER_COL.longitude]||'').trim(),
        address: String(r[ORDER_COL.address]||'').trim(),
        map_link: String(r[ORDER_COL.mapLink]||'').trim(),
        synced_at: ts
      });
    }

    if (!batch.length) { dbg('syncOrdersToSupabase: no rows to sync'); return; }

    // Send in chunks of 200 rows
    const CHUNK = 200;
    for (let i = 0; i < batch.length; i += CHUNK) {
      const chunk = batch.slice(i, i + CHUNK);
      const res = supabaseRequest_('POST', 'orders?on_conflict=id', chunk);
      if (res.code < 200 || res.code > 299) {
        dbg('syncOrdersToSupabase error chunk ' + i + ': ' + res.code + ' ' + res.body.slice(0,200));
      }
    }
    dbg('syncOrdersToSupabase: synced ' + batch.length + ' rows OK');
  } catch(e) {
    dbg('syncOrdersToSupabase exception: ' + e.message);
  }
}

function setupSupabaseSyncTrigger() {
  // Remove existing sync trigger if any
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'syncOrdersToSupabase') ScriptApp.deleteTrigger(t);
  });
  // Sync every 5 minutes
  ScriptApp.newTrigger('syncOrdersToSupabase').timeBased().everyMinutes(5).create();
  Logger.log('Supabase sync trigger created — every 5 minutes');
}

// ── Keep GAS warm — fires every 5 min to prevent cold starts ──
function gasKeepAlive() {
  // Lightweight: just touch script properties and pre-warm today's MIS cache
  try {
    const today = todayIST_();
    const cacheKey = 'misdetail_' + today + '_' + today;
    const cached = CacheService.getScriptCache().get(cacheKey);
    if (!cached) {
      // Cache miss — pre-warm in background (within working hours 8am–9pm IST only)
      const hour = parseInt(Utilities.formatDate(new Date(), TIMEZONE, 'H'));
      if (hour >= 8 && hour <= 21) getMISDetail(today, today);
    }
  } catch(e) {}
}

function sendDailyMIS()  {
  const now = new Date();
  // Skip Sundays
  if (now.getDay() === 0) return;
  // Skip universal holidays
  const todayStr = todayIST_();
  const holidays = getHolidaysFromSheet().filter(h => h.date === todayStr);
  const universalHoliday = holidays.some(h => h.type === 'universal' || !h.territories || !h.territories.length);
  if (universalHoliday) return;
  const cfg = getMISConfig();
  sendMISReport({ type: 'daily', recipients: cfg.recipients, sentBy: 'Scheduled' });
}
function sendWeeklyMIS() { const cfg = getMISConfig(); sendMISReport({ type: 'weekly',  recipients: cfg.recipients, sentBy: 'Scheduled' }); }
function sendMonthlyMIS(){ const cfg = getMISConfig(); sendMISReport({ type: 'monthly', recipients: cfg.recipients, sentBy: 'Scheduled' }); }

function getMISConfig() {
  const props = PropertiesService.getScriptProperties();
  const recipients = props.getProperty('mis_recipients') || '';
  return { recipients, from: props.getProperty('mis_from')||'' };
}

function lockAllDateColumnsToText() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const map = { 'Orders':['B','C','AC'], 'Attendance':['A','G','H','V'], 'Location Log':['G'], 'Invoices':['B','L'], 'Institution Visits':['B','C','R'], 'Employee Config':['M'], 'Users':['E','F'], 'Whitelist':['E'], 'Expenses':['B','N'], 'Targets':['E','F'], 'Broadcasts':['F','G'], 'Correction Log':['D','I'], 'Holidays':['B','G'], 'Ledger':['B','I','K'], 'Handover Log':['D'], 'MIS Reports Data':['D'], 'MIS Log':['H'], 'Backup Log':['A'], 'Products':['I'], 'Follow-ups':['E','H'], 'Stores':['M'], 'Distributors':['L'], 'Institutions':['L'], 'Orders Archive':['B','C','AC'] };
  Object.keys(map).forEach(sheetName => { const sheet = ss.getSheetByName(sheetName); if (!sheet) return; map[sheetName].forEach(col => { try { sheet.getRange(col+':'+col).setNumberFormat('@'); } catch(e) {} }); });
}

function testAI() {
  var result = handleAIPrompt({
    model: 'openrouter/auto',
    prompt: 'Say hello in one sentence.'
  });
  Logger.log(result.getContent());
}

function handleGeocode(lat, lng) {
  try {
    if (!lat || !lng) return json({ error: 'Missing coordinates' });
    const apiKey = PropertiesService.getScriptProperties().getProperty('MAPS_API_KEY');
    if (!apiKey) return json({ error: 'MAPS_API_KEY not set in Script Properties' });
    const url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + ',' + lng + '&key=' + apiKey;
    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  } catch(e) {
    return json({ error: e.message });
  }
}

function handleAIPrompt(data) {
  try {
    var apiKey = PropertiesService.getScriptProperties().getProperty('OPENROUTER_API_KEY');
    if (!apiKey) throw new Error('OPENROUTER_API_KEY not set in Script Properties');
    var aiRes = UrlFetchApp.fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + apiKey },
      payload: JSON.stringify({ model: data.model || 'openrouter/auto', messages: [{ role: 'user', content: data.prompt }] }),
      muteHttpExceptions: true
    });
    var rawText = aiRes.getContentText();
    Logger.log('OpenRouter response: ' + rawText);
    var aiData = JSON.parse(rawText);
    var result = aiData.choices && aiData.choices[0] ? aiData.choices[0].message.content : (aiData.error ? aiData.error.message : 'No response');
    return ContentService.createTextOutput(JSON.stringify({ result: result })).setMimeType(ContentService.MimeType.JSON);
  } catch(e) {
    Logger.log('handleAIPrompt error: ' + e.message);
    return ContentService.createTextOutput(JSON.stringify({ result: 'AI unavailable: ' + e.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ══ SAVE COMPETITOR SIGHTING PHOTO → DRIVE + EMAIL ══
function saveCompetitorPhoto(data) {
  try {
    const cfg = getMISConfig();
    const recipients = cfg.recipients || '';
    const parentFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const compFolder = getOrCreateFolder(parentFolder, 'Competitor Sightings');

    // Save photo to Drive
    let fileUrl = '';
    if (data.photo && data.photo.indexOf('base64,') > -1) {
      const base64 = data.photo.split('base64,')[1];
      const blob = Utilities.newBlob(
        Utilities.base64Decode(base64),
        'image/jpeg',
        'Competitor_' + (data.brand||'Unknown') + '_' + (data.officer||'') + '_' + todayIST_() + '.jpg'
      );
      const file = compFolder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fileUrl = file.getUrl();
      dbg('saveCompetitorPhoto: saved to Drive — ' + fileUrl);
    }

    // Email GM/Admin
    if (recipients) {
      const subject = '🔍 Competitor Sighting — ' + (data.brand||'Unknown') + ' | ' + (data.store||'Unknown Store') + ' | ' + (data.officer||'');
      const html = '<div style="font-family:Arial,sans-serif;max-width:500px">' +
        '<div style="background:#c0392b;color:#fff;padding:14px 16px;border-radius:8px 8px 0 0"><h3 style="margin:0;font-size:15px">🔍 Competitor Sighting Alert</h3></div>' +
        '<div style="border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px;padding:14px 16px">' +
        '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
        '<tr><td style="padding:6px 0;font-weight:600;width:35%;color:#555">Brand</td><td style="padding:6px 0">' + (data.brand||'—') + '</td></tr>' +
        '<tr style="background:#f9f9f9"><td style="padding:6px 4px;font-weight:600;color:#555">SKU / Product</td><td style="padding:6px 4px">' + (data.sku||'—') + '</td></tr>' +
        '<tr><td style="padding:6px 0;font-weight:600;color:#555">Price</td><td style="padding:6px 0">' + (data.price ? '₹'+data.price : '—') + '</td></tr>' +
        '<tr style="background:#f9f9f9"><td style="padding:6px 4px;font-weight:600;color:#555">Store</td><td style="padding:6px 4px">' + (data.store||'—') + '</td></tr>' +
        '<tr><td style="padding:6px 0;font-weight:600;color:#555">Territory</td><td style="padding:6px 0">' + (data.territory||'—') + '</td></tr>' +
        '<tr style="background:#f9f9f9"><td style="padding:6px 4px;font-weight:600;color:#555">Officer</td><td style="padding:6px 4px">' + (data.officer||'—') + '</td></tr>' +
        '<tr><td style="padding:6px 0;font-weight:600;color:#555">Notes</td><td style="padding:6px 0">' + (data.notes||'—') + '</td></tr>' +
        '<tr style="background:#f9f9f9"><td style="padding:6px 4px;font-weight:600;color:#555">Date / Time</td><td style="padding:6px 4px">' + nowIST_() + '</td></tr>' +
        (fileUrl ? '<tr><td style="padding:6px 0;font-weight:600;color:#555">Photo</td><td style="padding:6px 0"><a href="' + fileUrl + '" style="color:#159ADB">View photo on Drive</a></td></tr>' : '') +
        '</table></div></div>';
      GmailApp.sendEmail(recipients, subject, '', { htmlBody: html, name: 'Diabliss Sales App' });
      dbg('saveCompetitorPhoto: email sent to ' + recipients);
    }

    return ContentService.createTextOutput(JSON.stringify({status:'ok', fileUrl}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(e) {
    dbg('saveCompetitorPhoto error: ' + e.message);
    return ContentService.createTextOutput(JSON.stringify({status:'error', msg:e.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ══ NOTIFY ADMIN — NEW USER REGISTRATION ══
function notifyNewUserRegistered(data) {
  try {
    var subject = '🆕 New User Registered — Diabliss Sales App';
    var body = '<div style="font-family:Arial,sans-serif;max-width:480px">' +
      '<div style="background:#159ADB;color:#fff;padding:14px 16px;border-radius:8px 8px 0 0">' +
      '<h3 style="margin:0;font-size:15px">🆕 New User Registered</h3></div>' +
      '<div style="border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px;padding:14px 16px">' +
      '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
      '<tr><td style="padding:6px 0;font-weight:600;width:35%;color:#555">Name</td><td style="padding:6px 0">' + (data.name||'—') + '</td></tr>' +
      '<tr style="background:#f9f9f9"><td style="padding:6px 4px;font-weight:600;color:#555">Mobile</td><td style="padding:6px 4px">' + (data.mobile||'—') + '</td></tr>' +
      '<tr><td style="padding:6px 0;font-weight:600;color:#555">Territory</td><td style="padding:6px 0">' + (data.territory||'—') + '</td></tr>' +
      '<tr style="background:#f9f9f9"><td style="padding:6px 4px;font-weight:600;color:#555">Role</td><td style="padding:6px 4px">' + (data.role||'—') + '</td></tr>' +
      '<tr><td style="padding:6px 0;font-weight:600;color:#555">Registered at</td><td style="padding:6px 0">' + (data.ts||nowIST_()) + '</td></tr>' +
      '</table></div></div>';
    MailApp.sendEmail({
      to: 'info@diabliss.com',
      subject: subject,
      htmlBody: body
    });
  } catch(e) {
    Logger.log('notifyNewUserRegistered error: ' + e);
  }
}

function saveMasterLoginAudit(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('AuditLog') || ss.insertSheet('AuditLog');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Admin Mobile', 'Target Mobile', 'Target Name', 'Target Role', 'Type']);
  }
  sheet.appendRow([nowIST_(), data.adminMobile||'', data.targetMobile||'', data.targetName||'', data.targetRole||'', 'MasterLogin']);
}

function verifyAdminPin(data) {
  try {
    var storedPin = PropertiesService.getScriptProperties().getProperty('ADMIN_IMPERSONATE_PIN');
    if (!storedPin) throw new Error('ADMIN_IMPERSONATE_PIN not set in Script Properties');
    var ok = (data.pin === storedPin);
    return ContentService.createTextOutput(JSON.stringify({ valid: ok })).setMimeType(ContentService.MimeType.JSON);
  } catch(e) {
    return ContentService.createTextOutput(JSON.stringify({ valid: false, msg: e.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ══ UPDATE ORDER SUPPLY STATUS ══
function updateOrderStatus(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(SHEET_ORDERS);
    if (!sh) return ContentService.createTextOutput(JSON.stringify({status:'error',msg:'Orders sheet not found'})).setMimeType(ContentService.MimeType.JSON);
    const rows = sh.getDataRange().getValues();
    const headers = rows[0].map(h => h.toString().toLowerCase().trim());
    let idCol = headers.indexOf('id');
    if (idCol < 0) idCol = headers.indexOf('order id');
    if (idCol < 0) return ContentService.createTextOutput(JSON.stringify({status:'error',msg:'ID column not found'})).setMimeType(ContentService.MimeType.JSON);
    // Find or create Supplied and SuppliedAt columns
    let supCol = headers.indexOf('supplied');
    let supAtCol = headers.indexOf('suppliedat');
    if (supCol < 0) {
      supCol = headers.length;
      sh.getRange(1, supCol + 1).setValue('Supplied');
    }
    if (supAtCol < 0) {
      supAtCol = headers.indexOf('suppliedat') < 0 ? supCol + 1 : headers.indexOf('suppliedat');
      sh.getRange(1, supAtCol + 1).setValue('SuppliedAt');
    }
    // Find matching order row and update
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idCol] && rows[i][idCol].toString() === data.orderId) {
        sh.getRange(i + 1, supCol + 1).setValue(data.supplied ? 'Yes' : '');
        sh.getRange(i + 1, supAtCol + 1).setValue(data.suppliedAt || '');
        return ContentService.createTextOutput(JSON.stringify({status:'ok'})).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({status:'error',msg:'Order not found'})).setMimeType(ContentService.MimeType.JSON);
  } catch(e) {
    Logger.log('updateOrderStatus error: ' + e.message);
    return ContentService.createTextOutput(JSON.stringify({status:'error',msg:e.message})).setMimeType(ContentService.MimeType.JSON);
  }
}


function testMISDetail() {
  const result = getMISDetail('2026-07-01', '2026-07-14');
  Logger.log(JSON.stringify(result));
}

// ══ VOICE ENTRY — OpenRouter Audio Transcription ══
function handleChatbot(data) {
  var prompt = data.prompt || '';
  if (!prompt) return ContentService.createTextOutput(
    JSON.stringify({status:'error', result:'No prompt'})
  ).setMimeType(ContentService.MimeType.JSON);

  var GROQ_KEY = PropertiesService.getScriptProperties().getProperty('GROQ_API_KEY');
  try {
    var res = UrlFetchApp.fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + GROQ_KEY,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400,
        temperature: 0.3
      }),
      muteHttpExceptions: true,
      deadline: 30
    });
    var parsed = JSON.parse(res.getContentText());
    var reply = parsed.choices && parsed.choices[0] && parsed.choices[0].message && parsed.choices[0].message.content
      ? parsed.choices[0].message.content.trim()
      : '';
    return ContentService.createTextOutput(
      JSON.stringify({status:'ok', result: reply})
    ).setMimeType(ContentService.MimeType.JSON);
  } catch(e) {
    return ContentService.createTextOutput(
      JSON.stringify({status:'error', result:'Groq error: ' + e.message})
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleVoiceEntry(data) {
  var base64Audio = data.base64Audio || '';
  var mimeType    = data.mimeType || 'audio/webm';

  if (!base64Audio) return ContentService.createTextOutput(
    JSON.stringify({status:'error', msg:'No audio'})
  ).setMimeType(ContentService.MimeType.JSON);

  // Build product list — hardcoded for reliability
  var prodList = [
    'Sugar 40x5g Sachet Box (casePack:54)',
    'Sugar 500g Standy Pouch (casePack:24)',
    'Sugar 1kg PET Jar (casePack:12)',
    'Sugar 1.75kg PET Jar (casePack:6)',
    'Sugar 5kg (casePack:10)',
    'Sugar 10kg (casePack:5)',
    'Jaggery 500g Standy Pouch (casePack:24)',
    'Jaggery 750g PET Jar (casePack:12)',
    'Jaggery 1.25kg PET Jar (casePack:6)',
    'Jaggery 5kg Bag (casePack:10)',
    'Lemon Tea 10x10g (casePack:84)',
    'Lemon Tea 30x10g (casePack:36)',
    'Lemon Tea 500g (casePack:24)',
    'Combo Tea 30x10g (casePack:36)',
    'Ginger Tea 10x10g (casePack:84)',
    'Masala Chai 10x10g (casePack:84)',
    'Millet Cookies 120g (casePack:60)',
    'Millet Cookies with Moringa 120g (casePack:60)',
    'Millet Cookies with Chia 120g (casePack:60)',
    'Mixed Fruit Jam 225g (casePack:24)',
    'Guava Jam 225g (casePack:24)',
    'Pineapple Ginger Jam 225g (casePack:24)'
  ].join(', ');

  // Step 1: Transcribe audio using Groq Whisper
var GROQ_KEY = PropertiesService.getScriptProperties().getProperty('GROQ_API_KEY');
var transcript = '';
try {
  var audioBlob = Utilities.newBlob(Utilities.base64Decode(base64Audio), mimeType, 'audio.webm');
  var formData = {
    file: audioBlob,
    model: 'whisper-large-v3',
    response_format: 'text',
    language: 'en',
    prompt: 'Diabliss FMCG products spoken fast in Indian English: Sugar, Jaggery, Lemon Tea, Ginger Tea, Masala Chai, Combo Tea, Millet Cookies, Mixed Fruit Jam, Guava Jam, Pineapple Ginger Jam. Words: pouch, jar, box, sachet, bag, numbers, cases. May include Tamil, Telugu, Kannada, Malayalam, Hindi or Odia number words.',
    prompt: 'Sugar, Jaggery, Lemon Tea, Ginger Tea, Masala Chai, Combo Tea, Millet Cookies, Jam, pouch, jar, box, sachet, kg, numbers, cases, petti'
  };
  var tRes = UrlFetchApp.fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'post',
    headers: { 'Authorization': 'Bearer ' + GROQ_KEY },
    payload: formData,
    muteHttpExceptions: true,
    deadline: 30
  });
  dbg('handleVoiceEntry: groq_raw=' + tRes.getContentText().substring(0, 300));
  transcript = tRes.getContentText().trim();
  dbg('handleVoiceEntry: transcript=' + transcript.substring(0, 200));
} catch(e) { dbg('handleVoiceEntry: transcription error=' + e.message); }

  if (!transcript) return ContentService.createTextOutput(
    JSON.stringify({status:'error', msg:'Transcription failed'})
  ).setMimeType(ContentService.MimeType.JSON);

  // Step 2: Parse products locally — no API call needed, instant result
  dbg('handleVoiceEntry: prodList=' + prodList.substring(0, 300));
  var items = parseTranscriptLocally_(transcript);
  dbg('handleVoiceEntry: local_parse=' + JSON.stringify(items));
  return ContentService.createTextOutput(
    JSON.stringify({status:'ok', transcript:transcript, items:items})
  ).setMimeType(ContentService.MimeType.JSON);
}

function parseTranscriptLocally_(transcript) {
  var t = transcript.toLowerCase();
  var items = [];
  
  // Number word map
  var numMap = {
    // English
    'one':1,'two':2,'three':3,'four':4,'five':5,'six':6,'seven':7,'eight':8,'nine':9,'ten':10,
    'eleven':11,'twelve':12,'thirteen':13,'fourteen':14,'fifteen':15,'sixteen':16,
    'seventeen':17,'eighteen':18,'nineteen':19,'twenty':20,'thirty':30,'fifty':50,'hundred':100,
    // Tamil
    'onnu':1,'rendu':2,'moonu':3,'naalu':4,'anju':5,'aaru':6,'ezhu':7,'ettu':8,'onbathu':9,'pathu':10,
    'pathinonnu':11,'pannirendu':12,'pathinaalu':14,'pathinanju':15,'pathinaaru':16,'pathinezhu':17,
    'pathinettu':18,'patthombathu':19,'irubathu':20,'muppathu':30,'aimbathu':50,
    // Telugu
    'okati':1,'rendu':2,'moodu':3,'nalugu':4,'aedu':5,'aaru':6,'edu':7,'enimidi':8,'tommidi':9,'padi':10,
    'padakondu':11,'pannendu':12,'padamoodu':13,'padanaalugu':14,'padihenu':15,'padaharu':16,
    'padahenu':17,'padanenimidi':18,'pandommidi':19,'iyyi':20,'mubbai':30,'yabhai':50,
    // Kannada
    'ondu':1,'eradu':2,'mooru':3,'naalku':4,'aidu':5,'aaru':6,'yelu':7,'entu':8,'ombattu':9,'hattu':10,
    'hannondu':11,'hanneradu':12,'hadmooru':13,'hadnaalku':14,'hadinaidhu':15,'hadinaru':16,
    'hadinemtu':18,'hathombattu':19,'ippathu':20,'muppatthu':30,'aimpathu':50,
    // Malayalam
    'onnu':1,'randu':2,'moonu':3,'naalu':4,'anchu':5,'aaru':6,'ezhu':7,'ettu':8,'onpathu':9,'pathu':10,
    'pathinonnu':11,'pannendu':12,'pathimoonu':13,'pathinaalu':14,'pathinanchu':15,'pathinaaru':16,
    'iruppathu':20,'muppathu':30,'anppathu':50,
    // Hindi
    'ek':1,'do':2,'teen':3,'char':4,'paanch':5,'chhe':6,'saat':7,'aath':8,'nau':9,'das':10,
    'gyarah':11,'barah':12,'terah':13,'chaudah':14,'pandrah':15,'solah':16,
    'satrah':17,'atharah':18,'unnis':19,'bees':20,'tees':30,'pachaas':50,
    // Odia
    'gote':1,'dui':2,'tini':3,'chari':4,'pancha':5,'chha':6,'saat':7,'aat':8,'nau':9,'dasa':10,
    'egara':11,'bara':12,'tera':13,'choudha':14,'pandra':15,'sola':16,
    'satra':17,'athra':18,'unisha':19,'bish':20,'trisha':30,'panchasa':50
  };
  
  // Product mapping rules — ordered from most specific to least
  var rules = [
    // Sugar
    {keys:['sugar sachet','sugar box','sugar 40','sachet box'], name:'Sugar 40x5g Sachet Box', pack:54},
    {keys:['sugar 1.75','big jar','1.75 jar','large jar'], name:'Sugar 1.75kg PET Jar', pack:6},
    {keys:['sugar 1kg','sugar 1 kg','sugar one kg'], name:'Sugar 1kg PET Jar', pack:12},
    {keys:['sugar 500','sugar 500g'], name:'Sugar 500g Standy Pouch', pack:24},
    {keys:['sugar 5kg','sugar 5 kg','sugar five kg'], name:'Sugar 5kg', pack:10},
    {keys:['sugar 10kg','sugar 10 kg','sugar ten kg'], name:'Sugar 10kg', pack:5},
    {keys:['sugar jar','sugar cha','sugarjar'], name:'Sugar 1kg PET Jar', pack:12},
    {keys:['sugar pouch','sugar standy','sugar paus','sugar poch'], name:'Sugar 500g Standy Pouch', pack:24},
    // Jaggery
    {keys:['jaggery 1.25','jaggery large jar','jaggery big jar'], name:'Jaggery 1.25kg PET Jar', pack:6},
    {keys:['jaggery 750','jaggery 750g'], name:'Jaggery 750g PET Jar', pack:12},
    {keys:['jaggery 500','jaggery 500g'], name:'Jaggery 500g Standy Pouch', pack:24},
    {keys:['jaggery 5kg','jaggery 5 kg'], name:'Jaggery 5kg Bag', pack:10},
    {keys:['jaggery jar','jaggery cha','jagery jar','jegary jar'], name:'Jaggery 750g PET Jar', pack:12},
    {keys:['jaggery pouch','jaggery standy','jagery pouch','jegary pouch'], name:'Jaggery 500g Standy Pouch', pack:24},
    // Lemon Tea
    {keys:['lemon tea 500','lemon tea pouch','lemon tea standy'], name:'Lemon Tea 500g', pack:24},
    {keys:['lemon tea 30 by 10','lemon tea 30 x 10','lemon tea 30x10','lemon tea 30s','lemon tea 30','lemon tea box','lemon tea 300'], name:'Lemon Tea 30x10g', pack:36},
    {keys:['lemon tea sachet','tea sachet','lemon tea 10 by 10','lemon tea 10 x 10','lemon tea 10x10','lemon tea 10s','lemon tea 10','lemon tea 100'], name:'Lemon Tea 10x10g', pack:84},
    // Other teas
    {keys:['combo tea','herbal tea combo'], name:'Combo Tea 30x10g', pack:36},
    {keys:['ginger tea'], name:'Ginger Tea 10x10g', pack:84},
    {keys:['masala chai','masala tea'], name:'Masala Chai 10x10g', pack:84},
    // Cookies
    {keys:['moringa cookie','moringa biscuit'], name:'Millet Cookies with Moringa 120g', pack:60},
    {keys:['chia cookie','chia biscuit'], name:'Millet Cookies with Chia 120g', pack:60},
    {keys:['plain cookie','plain biscuit','millet cookie 120'], name:'Millet Cookies 120g', pack:60},
    // Jams
    {keys:['mixed fruit jam','mixed jam','mixer jam','fruit jam','mix jam','mixed fruit'], name:'Mixed Fruit Jam 225g', pack:24},
    {keys:['guava jam'], name:'Guava Jam 225g', pack:24},
    {keys:['pineapple jam','ginger jam','pineapple ginger'], name:'Pineapple Ginger Jam 225g', pack:24}
  ];
  
  // Extract quantity near a keyword match
  function extractQty(text, matchIdx, keyLen) {
    // Look for number AFTER the keyword match (skip SKU numbers embedded in product name)
    var afterMatch = text.substring(matchIdx + keyLen, matchIdx + keyLen + 40);
    // Check word numbers after match
    for (var word in numMap) {
      if (afterMatch.indexOf(word) !== -1) return numMap[word];
    }
    // Check digits after match  
    var dm = afterMatch.match(/\b(\d+)\b/);
    if (dm) return parseInt(dm[1]);
    // Fallback: check before match
    var beforeMatch = text.substring(Math.max(0, matchIdx-10), matchIdx);
    for (var word2 in numMap) {
      if (beforeMatch.indexOf(word2) !== -1) return numMap[word2];
    }
    var dm2 = beforeMatch.match(/\b(\d+)\b/);
    if (dm2) return parseInt(dm2[1]);
    return 1;
  }
  
  // Check each rule
  for (var i = 0; i < rules.length; i++) {
    var rule = rules[i];
    var matched = false;
    var matchIdx = -1;
    for (var k = 0; k < rule.keys.length; k++) {
      var idx = t.indexOf(rule.keys[k]);
      if (idx !== -1) { matched = true; matchIdx = idx; break; }
    }
    if (matched) {
      // Check not already added
      var already = false;
      for (var j = 0; j < items.length; j++) { if (items[j].name === rule.name) { already = true; break; } }
      if (!already) {
        var qty = extractQty(t, matchIdx, rule.keys[k] ? rule.keys[k].length : 10);
        // Handle case/petti — multiply by casePack
        var windowText = t.substring(Math.max(0, matchIdx-10), matchIdx+60);
        if (windowText.indexOf('case') !== -1 || windowText.indexOf('petti') !== -1 || windowText.indexOf('carton') !== -1) {
          qty = qty * rule.pack;
        }
        items.push({name: rule.name, qty: qty});
      }
    }
  }
  
  return items;
}

function handleParsePO(data) {
  var fileBase64 = data.fileBase64 || '';
  var mimeType   = data.mimeType || 'application/pdf';
  var fileName   = data.fileName || 'PO_' + new Date().toLocaleDateString('en-CA');
  var store      = data.store || '';

  if (!fileBase64) return ContentService.createTextOutput(
    JSON.stringify({status:'error', msg:'No file'})
  ).setMimeType(ContentService.MimeType.JSON);

  dbg('handleParsePO: START file=' + fileName + ' size=' + fileBase64.length);
  // Save to Drive — use general folder as fallback
  var driveUrl = '';
  try {
    var folderId = '1p6ZPGg_EiWvG2jODEg4HOb-Y86h2ZJp8'; // General Drive folder — known working
    var folder;
    try { folder = DriveApp.getFolderById(folderId); }
    catch(fe) {
      dbg('handleParsePO: Bulk PO folder failed, using root');
      folder = DriveApp.getRootFolder();
    }
    var b64 = fileBase64.indexOf(',') > -1 ? fileBase64.split(',')[1] : fileBase64;
    var blob = Utilities.newBlob(Utilities.base64Decode(b64), mimeType, fileName);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    driveUrl = file.getUrl();
    dbg('handleParsePO: Drive save OK url=' + driveUrl);
  } catch(e) { dbg('handleParsePO: Drive error=' + e.message); }

  // Build product list — hardcoded to avoid empty Products sheet
  // Product list with alternate names to help AI match PO descriptions
  var prodList = [
    'Sugar 40x5g Sachet Box (also: sachet, 40x5g, 5g sachet)',
    'Sugar 500g Standy Pouch (also: sugar 500g, 500g sugar, herbal cane sugar 500g)',
    'Sugar 1kg PET Jar (also: sugar 1kg, 1kg sugar)',
    'Sugar 1.75kg PET Jar (also: sugar 1.75kg)',
    'Sugar 5kg (also: sugar 5kg bag)',
    'Sugar 10kg (also: sugar 10kg bag)',
    'Jaggery 500g Standy Pouch (also: jaggery 500g)',
    'Jaggery 750g PET Jar (also: jaggery 750g)',
    'Jaggery 1.25kg PET Jar (also: jaggery 1.25kg)',
    'Jaggery 5kg Bag (also: jaggery 5kg)',
    'Lemon Tea 10x10g (also: lemon tea 10s, lemon tea small, 10 sachets)',
    'Lemon Tea 30x10g (also: lemon tea 30s, lemon tea 30, herbal lemon tea 30s, 30 sachets)',
    'Lemon Tea 500g (also: lemon tea 500g, bulk lemon tea)',
    'Combo Tea 30x10g (also: combo tea 30s, assorted tea 30s)',
    'Ginger Tea 10x10g (also: ginger tea 10s, ginger tea small)',
    'Masala Chai 10x10g (also: masala chai 10s, masala tea)',
    'Millet Cookies 120g (also: millet cookies, plain cookies)',
    'Millet Cookies with Moringa 120g (also: moringa cookies)',
    'Millet Cookies with Chia 120g (also: chia cookies)',
    'Mixed Fruit Jam 225g (also: fruit jam, mixed jam)',
    'Guava Jam 225g (also: guava jam)',
    'Pineapple Ginger Jam 225g (also: pineapple jam, ginger jam)'
  ].join('; ');

  // Extract with OpenRouter (vision model — replaces Gemini direct API)
  var OPENROUTER_KEY = PropertiesService.getScriptProperties().getProperty('OPENROUTER_API_KEY');
  var prompt = 'This is a Purchase Order document. Extract ONLY Diabliss brand products from it. '
    + 'Ignore all other brands completely. '
    + 'The complete list of Diabliss products is: ' + prodList + '. '
    + 'Match each item in the PO to the closest product name from the list above — use the EXACT product name from the list, not what is written in the PO. '
    + 'Return ONLY a raw JSON array (no markdown, no explanation): [{"name":"exact product name from list","qty":number}]. '
    + 'If no Diabliss products are found, return [].';
  try {
    var b64p = fileBase64.indexOf(',') > -1 ? fileBase64.split(',')[1] : fileBase64;
    var dataUrl = 'data:' + mimeType + ';base64,' + b64p;
    var messages = [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: dataUrl } }
      ]
    }];
    var orPayload = { model: 'openrouter/auto', messages: messages };
    var res = UrlFetchApp.fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + OPENROUTER_KEY },
      payload: JSON.stringify(orPayload),
      muteHttpExceptions: true,
      deadline: 45
    });
    var rawText = res.getContentText();
    dbg('handleParsePO: OR raw=' + rawText.slice(0,300));
    var resData = JSON.parse(rawText);
    if (resData.error) {
      dbg('handleParsePO: OR error=' + JSON.stringify(resData.error).slice(0,200));
      return ContentService.createTextOutput(
        JSON.stringify({status:'error', msg:'OpenRouter error: ' + (resData.error.message||'unknown'), driveUrl:driveUrl})
      ).setMimeType(ContentService.MimeType.JSON);
    }
    var text = (((resData.choices||[])[0]||{}).message||{}).content || '';
    text = text.replace(/```json|```/g,'').trim();
    dbg('handleParsePO: parsed text=' + text.slice(0,200));
    var match = text.match(/\[[\s\S]*\]/);
    var items = match ? JSON.parse(match[0]) : [];
    return ContentService.createTextOutput(
      JSON.stringify({status:'ok', items:items, driveUrl:driveUrl, store:store})
    ).setMimeType(ContentService.MimeType.JSON);
  } catch(e) {
    dbg('handleParsePO: exception=' + e.message);
    return ContentService.createTextOutput(
      JSON.stringify({status:'error', msg:e.message, driveUrl:driveUrl})
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ══ PRODUCT PHOTOS ══
function getProductPhotos() {
  try {
    var cache = CacheService.getScriptCache();
    var cached = cache.get('product_photos');
    if (cached) return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
    var result = [];
    var folders = DriveApp.getFoldersByName('Product Photos');
    if (!folders.hasNext()) return ContentService.createTextOutput(JSON.stringify({groups:[], error:'Not found'})).setMimeType(ContentService.MimeType.JSON);
    var parent = folders.next();
    var subfolders = parent.getFolders();
    while (subfolders.hasNext()) {
      var group = subfolders.next();
      var albums = [];
      var albumIter = group.getFolders();
      while (albumIter.hasNext()) {
        var album = albumIter.next();
        var fileList = collectImagesDeep(album, 3);
        fileList.sort(function(a,b){return a.name.localeCompare(b.name);});
        if (fileList.length > 0) albums.push({name: album.getName(), files: fileList});
      }
      albums.sort(function(a,b){return a.name.localeCompare(b.name);});
      var directFiles = collectImagesDeep(group, 1);
      directFiles.sort(function(a,b){return a.name.localeCompare(b.name);});
      if (directFiles.length > 0) albums.unshift({name: group.getName(), files: directFiles});
      var cover = (albums.length > 0 && albums[0].files.length > 0) ? albums[0].files[0].thumbUrl : '';
      if (albums.length > 0) result.push({name: group.getName(), cover: cover, albums: albums});
    }
    var ORDER = ['Sugar','Jaggery','Tea','Jam','Cookies'];
    result.sort(function(a,b){
      var ai = ORDER.indexOf(a.name), bi = ORDER.indexOf(b.name);
      if(ai===-1 && bi===-1) return a.name.localeCompare(b.name);
      if(ai===-1) return 1; if(bi===-1) return -1;
      return ai - bi;
    });
    var json = JSON.stringify({groups: result});
    try { if (json.length < 100000) cache.put('product_photos', json, 21600); } catch(ce) {}
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  } catch(e) {
    return ContentService.createTextOutput(JSON.stringify({groups: [], error: e.message})).setMimeType(ContentService.MimeType.JSON);
  }
}

function clearProductPhotosCache() {
  CacheService.getScriptCache().remove('product_photos');
  Logger.log('Cache cleared');
}

function collectImagesDeep(folder, depth) {
  var fileList = [];
  if (depth <= 0) return fileList;
  var filesIter = folder.getFiles();
  while (filesIter.hasNext()) {
    var f = filesIter.next();
    if (f.getMimeType().indexOf('image/') === 0) {
      fileList.push({name: f.getName(), url: 'https://drive.google.com/uc?export=view&id=' + f.getId(), thumbUrl: 'https://drive.google.com/thumbnail?id=' + f.getId() + '&sz=w400'});
    }
  }
  var subIter = folder.getFolders();
  while (subIter.hasNext()) {
    var sub = collectImagesDeep(subIter.next(), depth - 1);
    for (var i=0; i<sub.length; i++) fileList.push(sub[i]);
  }
  return fileList;
}

function testPhotoAccess() {
  try {
    var f = DriveApp.getFolderById('1BtoC5M39etUANKgIK1c9ZCgvlxsPZDSD');
    Logger.log('Name: ' + f.getName());
    var subs = f.getFolders();
    while(subs.hasNext()) { Logger.log('Sub: ' + subs.next().getName()); }
  } catch(e) { Logger.log('Error: ' + e.message); }
}
function findProductPhotosFolder() {
  var folders = DriveApp.getFoldersByName('Product Photos');
  while(folders.hasNext()) {
    var f = folders.next();
    Logger.log('Found: ' + f.getName() + ' ID: ' + f.getId() + ' Parent: ' + f.getParents().next().getName());
  }
}
function testGetProductPhotos() {
  var result = getProductPhotos();
  Logger.log(result.getContent());
}

// ══ FORGOT PIN — OTP ══
function requestOTP(data) {
  const mobile = String(data.mobile||'').trim();
  if (!mobile) return {ok:false, error:'no_mobile'};
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const emp = getSheetData('Employees', []).find(r => String(r.mobile||r[2]||'').trim() === mobile);
  if (!emp) return {ok:false, error:'not_found'};
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  CacheService.getScriptCache().put('otp_' + mobile, otp, 300); // 5 min TTL
  const name = emp.name || emp[0] || mobile;
  const waMsg = encodeURIComponent('Diabliss Sales App PIN Reset\nOfficer: ' + name + '\nMobile: ' + mobile + '\nOTP: ' + otp + '\n(Valid 5 minutes)');
  const waUrl = 'https://wa.me/918939853354?text=' + waMsg;
  return {ok:true, waUrl};
}

function verifyOTP(data) {
  const mobile = String(data.mobile||'').trim();
  const otp = String(data.otp||'').trim();
  if (!mobile || !otp) return {ok:false, error:'missing_fields'};
  const cached = CacheService.getScriptCache().get('otp_' + mobile);
  if (!cached) return {ok:false, error:'expired'};
  if (cached !== otp) return {ok:false, error:'wrong'};
  CacheService.getScriptCache().remove('otp_' + mobile);
  return {ok:true}; // Frontend sets new PIN locally after verification
}
