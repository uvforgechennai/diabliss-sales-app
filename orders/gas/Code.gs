/**
 * Diabliss B2C Order Portal — Google Apps Script backend.
 * Standalone Web App. Deploy as: Execute as "Me", Access "Anyone".
 */

const CONFIG = {
  SHEET_ID: '169hN2yoSKTUzwrf8-9XCFsbEXyyAE5ZbyUId2fS4nbk',
  CALLMEBOT_PHONE: '918939853354',
  NOTIFY_EMAILS: ['info@diabliss.com', 'nithya@diabliss.com'],
  RAZORPAY_KEY_ID: 'rzp_live_TcGmnDuZ6rGOWC'
};

// Real secrets never live in source (this repo is public). They're read from
// Script Properties instead — set once via the Apps Script editor's
// Project Settings → Script Properties, never committed to git.
function getSecret_(key) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) {
    throw new Error('Missing Script Property: ' + key + ' (set it under Project Settings → Script Properties)');
  }
  return value;
}

const SHEET_NAME = 'Diabliss Orders';
const HEADERS = [
  'Order ID', 'Timestamp', 'Name', 'WhatsApp', 'Email', 'Address', 'City', 'State', 'Pincode',
  'Products', 'MRP Total', 'Discount%', 'Discount Amount', 'Final Amount', 'Razorpay Payment ID', 'Status'
];

const PENDING_SHEET_NAME = 'Pending Orders';
const PENDING_HEADERS = ['Razorpay Order ID', 'Created At', 'Order JSON', 'Diabliss Order ID'];

const STOCK_SHEET_NAME = 'Stock Status';
const STOCK_HEADERS = ['Product ID', 'Product Name', 'In Stock'];

// Keep this list in sync with the product IDs/names in js/products.js.
// Used only to pre-fill the Stock Status sheet the first time it's created.
const PRODUCT_REFERENCE = [
  { id: 'sugar-40x5g', name: 'Sugar 40x5g Sachet Box' },
  { id: 'sugar-500g', name: 'Sugar 500g Standy Pouch' },
  { id: 'sugar-1kg', name: 'Sugar 1kg PET Jar' },
  { id: 'sugar-1.75kg', name: 'Sugar 1.75kg PET Jar' },
  { id: 'sugar-5kg', name: 'Sugar 5kg' },
  { id: 'sugar-10kg', name: 'Sugar 10kg' },
  { id: 'jaggery-500g', name: 'Jaggery 500g Standy Pouch' },
  { id: 'jaggery-750g', name: 'Jaggery 750g PET Jar' },
  { id: 'jaggery-1.25kg', name: 'Jaggery 1.25kg PET Jar' },
  { id: 'jaggery-5kg', name: 'Jaggery 5kg Bag' },
  { id: 'tea-lemon-10x10g', name: 'Lemon Tea 10x10g' },
  { id: 'tea-lemon-30x10g', name: 'Lemon Tea 30x10g' },
  { id: 'tea-lemon-500g', name: 'Lemon Tea 500g' },
  { id: 'tea-combo-30x10g', name: 'Combo Tea 30x10g' },
  { id: 'tea-ginger-10x10g', name: 'Ginger Tea 10x10g' },
  { id: 'tea-masala-10x10g', name: 'Masala Chai 10x10g' },
  { id: 'cookies-millets-120g', name: 'Millets Cookies 120g' },
  { id: 'cookies-moringa-120g', name: 'Millets with Moringa Leaves Cookies 120g' },
  { id: 'cookies-chia-120g', name: 'Millets with Chia Seeds Cookies 120g' },
  { id: 'jam-mixed-fruit-225g', name: 'Mixed Fruit Jam 225g' },
  { id: 'jam-guava-225g', name: 'Guava Jam 225g' },
  { id: 'jam-pineapple-ginger-225g', name: 'Pineapple Ginger Jam 225g' },
  { id: 'halwa-moong-dhal-225g', name: 'Moong Dhal Halwa 225g' },
  { id: 'halwa-whole-wheat-225g', name: 'Whole Wheat Halwa 225g' },
  { id: 'kheer-basmati-rice-225g', name: 'Basmati Rice Kheer 225g' },
  { id: 'kheer-vermicilli-225g', name: 'Vermicilli Kheer 225g' },
  { id: 'hw-glucose', name: 'Herbal Water - Blood Glucose Support' },
  { id: 'hw-bp', name: 'Herbal Water - BP Support' },
  { id: 'hw-hair', name: 'Herbal Water - Hair Care' },
  { id: 'hw-skin', name: 'Herbal Water - Skin Care' },
  { id: 'hw-immunity', name: 'Herbal Water - Immunity' }
];

function doGet(e) {
  try {
    return jsonResponse_({ status: 'ok', outOfStock: getOutOfStockIds_() });
  } catch (err) {
    Logger.log('doGet error: ' + err);
    return jsonResponse_({ status: 'error', message: String(err), outOfStock: [] });
  }
}

function getOutOfStockIds_() {
  const sheet = getOrCreateStockSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  const outOfStock = [];
  data.forEach(function (row) {
    const id = row[0];
    const inStock = row[2];
    if (id && inStock === false) {
      outOfStock.push(id);
    }
  });
  return outOfStock;
}

function getOrCreateStockSheet_() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = ss.getSheetByName(STOCK_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(STOCK_SHEET_NAME);
    sheet.appendRow(STOCK_HEADERS);
    const rows = PRODUCT_REFERENCE.map(function (p) { return [p.id, p.name, true]; });
    sheet.getRange(2, 1, rows.length, 3).setValues(rows);
    sheet.getRange(2, 3, rows.length, 1).insertCheckboxes();
    sheet.autoResizeColumns(1, 2);
  }
  return sheet;
}

/**
 * Three kinds of POST land here, told apart by payload shape:
 * 1. A Razorpay webhook event ({event, payload}).
 * 2. A "create order" call from the storefront, before checkout opens.
 * 3. A "finalize" call from the storefront, after checkout succeeds.
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (body.event && body.payload) {
      return handleRazorpayWebhook_(e, body);
    }
    if (body.action === 'createOrder') {
      return handleCreateOrder_(body);
    }
    return handleFinalizeOrder_(body);
  } catch (err) {
    Logger.log('doPost error: ' + err);
    return jsonResponse_({ status: 'error', message: String(err) });
  }
}

function handleCreateOrder_(body) {
  validateDraftOrder_(body);

  const amountPaise = Math.round(body.finalAmount * 100);
  const razorpayOrder = callRazorpayCreateOrder_(amountPaise);

  const pendingSheet = getOrCreatePendingSheet_();
  pendingSheet.appendRow([razorpayOrder.id, new Date(), JSON.stringify(body), '']);

  return jsonResponse_({ status: 'ok', razorpayOrderId: razorpayOrder.id });
}

function validateDraftOrder_(order) {
  const required = ['name', 'whatsapp', 'email', 'address', 'city', 'state', 'pincode', 'products', 'finalAmount'];
  required.forEach(function (field) {
    if (order[field] === undefined || order[field] === null || order[field] === '') {
      throw new Error('Missing required field: ' + field);
    }
  });
  if (!Array.isArray(order.products) || order.products.length === 0) {
    throw new Error('Order must contain at least one product');
  }
}

function callRazorpayCreateOrder_(amountPaise) {
  const auth = Utilities.base64Encode(CONFIG.RAZORPAY_KEY_ID + ':' + getSecret_('RAZORPAY_KEY_SECRET'));
  const response = UrlFetchApp.fetch('https://api.razorpay.com/v1/orders', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Basic ' + auth },
    payload: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt: 'diabliss-' + new Date().getTime()
    }),
    muteHttpExceptions: true
  });

  const result = JSON.parse(response.getContentText());
  if (!result.id) {
    throw new Error('Razorpay order creation failed: ' + response.getContentText());
  }
  return result;
}

function handleFinalizeOrder_(body) {
  ['razorpayOrderId', 'razorpayPaymentId', 'razorpaySignature'].forEach(function (field) {
    if (!body[field]) throw new Error('Missing required field: ' + field);
  });

  if (!verifyRazorpaySignature_(body.razorpayOrderId, body.razorpayPaymentId, body.razorpaySignature)) {
    throw new Error('Invalid payment signature');
  }

  const orderId = finalizeOrder_(body.razorpayOrderId, body.razorpayPaymentId);
  return jsonResponse_({ status: 'ok', orderId: orderId });
}

function verifyRazorpaySignature_(razorpayOrderId, razorpayPaymentId, signature) {
  const payload = razorpayOrderId + '|' + razorpayPaymentId;
  const bytes = Utilities.computeHmacSha256Signature(payload, getSecret_('RAZORPAY_KEY_SECRET'));
  const expected = bytes.map(function (b) {
    const hex = (b < 0 ? b + 256 : b).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
  return expected === signature;
}

/**
 * Server-to-server backstop: Razorpay calls this directly when a payment
 * captures, independent of whether the customer's browser ever finishes
 * the finalize call above. finalizeOrder_ is idempotent, so whichever of
 * the two paths (browser or webhook) arrives first wins, and the other
 * is a no-op.
 */
function handleRazorpayWebhook_(e, body) {
  const token = e.parameter && e.parameter.token;
  if (token !== getSecret_('RAZORPAY_WEBHOOK_TOKEN')) {
    Logger.log('Webhook token mismatch, ignoring');
    return jsonResponse_({ status: 'ignored' });
  }

  if (body.event !== 'payment.captured') {
    return jsonResponse_({ status: 'ignored' });
  }

  const payment = body.payload && body.payload.payment && body.payload.payment.entity;
  if (!payment || !payment.order_id) {
    return jsonResponse_({ status: 'ignored' });
  }

  try {
    finalizeOrder_(payment.order_id, payment.id);
  } catch (err) {
    Logger.log('Webhook finalize failed: ' + err);
  }

  return jsonResponse_({ status: 'ok' });
}

function finalizeOrder_(razorpayOrderId, razorpayPaymentId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const pendingSheet = getOrCreatePendingSheet_();
    const pending = findPendingRow_(pendingSheet, razorpayOrderId);
    if (!pending) {
      throw new Error('No pending order found for Razorpay order ' + razorpayOrderId);
    }
    if (pending.diablissOrderId) {
      return pending.diablissOrderId; // Already finalized by the other path.
    }

    const order = JSON.parse(pending.orderJson);
    order.razorpayPaymentId = razorpayPaymentId;

    const sheet = getOrCreateSheet_();
    const orderId = generateOrderId_(sheet);
    appendOrderRow_(sheet, orderId, order);
    pendingSheet.getRange(pending.rowIndex, 4).setValue(orderId);

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

    return orderId;
  } finally {
    lock.releaseLock();
  }
}

function getOrCreatePendingSheet_() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = ss.getSheetByName(PENDING_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(PENDING_SHEET_NAME);
    sheet.appendRow(PENDING_HEADERS);
  }
  return sheet;
}

function findPendingRow_(sheet, razorpayOrderId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === razorpayOrderId) {
      return { rowIndex: i + 2, orderJson: data[i][2], diablissOrderId: data[i][3] };
    }
  }
  return null;
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
    '&text=' + encodeURIComponent(message) + '&apikey=' + getSecret_('CALLMEBOT_APIKEY');

  UrlFetchApp.fetch(url, { muteHttpExceptions: true });
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
