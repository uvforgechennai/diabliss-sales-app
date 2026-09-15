/**
 * Diabliss B2C Order Portal — Google Apps Script backend.
 * Standalone Web App. Deploy as: Execute as "Me", Access "Anyone".
 */

const CONFIG = {
  SHEET_ID: 'TO_BE_FILLED',
  CALLMEBOT_PHONE: '918939853354',
  CALLMEBOT_APIKEY: 'TO_BE_FILLED',
  NOTIFY_EMAILS: ['info@diabliss.com', 'nithya@diabliss.com']
};

const SHEET_NAME = 'Diabliss Orders';
const HEADERS = [
  'Order ID', 'Timestamp', 'Name', 'WhatsApp', 'Email', 'Address', 'City', 'State', 'Pincode',
  'Products', 'MRP Total', 'Discount%', 'Discount Amount', 'Final Amount', 'Razorpay Payment ID', 'Status'
];

function doPost(e) {
  try {
    const order = JSON.parse(e.postData.contents);
    validateOrder_(order);

    const lock = LockService.getScriptLock();
    lock.waitLock(30000);

    let orderId;
    try {
      const sheet = getOrCreateSheet_();
      orderId = generateOrderId_(sheet);
      appendOrderRow_(sheet, orderId, order);
    } finally {
      lock.releaseLock();
    }

    try {
      sendConfirmationEmail_(orderId, order);
    } catch (emailErr) {
      Logger.log('Email send failed: ' + emailErr);
    }

    try {
      sendWhatsAppNotification_(orderId, order);
    } catch (waErr) {
      Logger.log('WhatsApp send failed: ' + waErr);
    }

    return jsonResponse_({ status: 'ok', orderId: orderId });
  } catch (err) {
    Logger.log('doPost error: ' + err);
    return jsonResponse_({ status: 'error', message: String(err) });
  }
}

function validateOrder_(order) {
  const required = ['name', 'whatsapp', 'email', 'address', 'city', 'state', 'pincode', 'products', 'finalAmount', 'razorpayPaymentId'];
  required.forEach(function (field) {
    if (order[field] === undefined || order[field] === null || order[field] === '') {
      throw new Error('Missing required field: ' + field);
    }
  });
  if (!Array.isArray(order.products) || order.products.length === 0) {
    throw new Error('Order must contain at least one product');
  }
}

function getOrCreateSheet_() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }
  return sheet;
}

function generateOrderId_(sheet) {
  const year = new Date().getFullYear();
  const lastRow = sheet.getLastRow();
  const dataRowCount = lastRow > 1 ? lastRow - 1 : 0;
  const sequence = dataRowCount + 1;
  const sequenceStr = ('0000' + sequence).slice(-4);
  return 'DIA-' + year + '-' + sequenceStr;
}

function formatProductsList_(products) {
  return products.map(function (item) {
    return item.name + ' x' + item.qty;
  }).join(', ');
}

function appendOrderRow_(sheet, orderId, order) {
  sheet.appendRow([
    orderId,
    new Date(),
    order.name,
    order.whatsapp,
    order.email,
    order.address,
    order.city,
    order.state,
    order.pincode,
    formatProductsList_(order.products),
    order.mrpTotal,
    order.discountPercent,
    order.discountAmount,
    order.finalAmount,
    order.razorpayPaymentId,
    'Paid'
  ]);
}

function sendConfirmationEmail_(orderId, order) {
  const productLines = order.products.map(function (item) {
    return '- ' + item.name + ' x' + item.qty + ' : Rs.' + item.lineTotal;
  }).join('\n');

  const discountLine = order.discountAmount > 0
    ? 'Discount (' + order.discountPercent + '%): -Rs.' + order.discountAmount + '\n'
    : '';

  const body =
    'Hi ' + order.name + ',\n\n' +
    'Thank you for your order from Diabliss Consumer Products!\n\n' +
    'Order ID: ' + orderId + '\n\n' +
    'Products:\n' + productLines + '\n\n' +
    'MRP Total: Rs.' + order.mrpTotal + '\n' +
    discountLine +
    'Shipping: FREE\n' +
    'Amount Paid: Rs.' + order.finalAmount + '\n\n' +
    'Delivery Address:\n' + order.address + ', ' + order.city + ', ' + order.state + ' - ' + order.pincode + '\n\n' +
    'Your order will be dispatched within 2-3 working days.\n\n' +
    'For queries, WhatsApp us: 8939853354\n\n' +
    'Thank you for choosing Diabliss!';

  MailApp.sendEmail({
    to: order.email,
    cc: CONFIG.NOTIFY_EMAILS.join(','),
    subject: 'Diabliss Order Confirmation - ' + orderId,
    body: body
  });
}

function sendWhatsAppNotification_(orderId, order) {
  const productLines = order.products.map(function (item) {
    return item.name + ': ' + item.qty;
  }).join(', ');

  const message =
    '🛒 New Diabliss Order!\n' +
    '📋 ' + orderId + '\n' +
    '👤 ' + order.name + ' | ' + order.whatsapp + '\n' +
    '📦 ' + productLines + '\n' +
    '💰 MRP: ₹' + order.mrpTotal + ' | Discount: ' + order.discountPercent + '% | Paid: ₹' + order.finalAmount + '\n' +
    '📍 ' + order.address + ', ' + order.city + ', ' + order.state + ' - ' + order.pincode + '\n' +
    '🔖 Razorpay: ' + order.razorpayPaymentId;

  const url = 'https://api.callmebot.com/whatsapp.php?phone=' + CONFIG.CALLMEBOT_PHONE +
    '&text=' + encodeURIComponent(message) + '&apikey=' + CONFIG.CALLMEBOT_APIKEY;

  UrlFetchApp.fetch(url, { muteHttpExceptions: true });
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
