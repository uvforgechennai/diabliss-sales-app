function checkAug18() {
  const ss = SpreadsheetApp.openById('1KUV-ypJjagfufmDfcaON1Kb0cqRqaN6OlQebD6xVQpE');
  const sheet = ss.getSheetByName('Orders'); // adjust sheet name if different
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const dateCol = headers.indexOf('order_date');
  const totalCol = headers.indexOf('grand_total');
  
  let count = 0, total = 0;
  data.slice(1).forEach(row => {
    const d = row[dateCol];
    const dateStr = d instanceof Date 
      ? Utilities.formatDate(d, 'Asia/Kolkata', 'yyyy-MM-dd') 
      : String(d).substring(0,10);
    if (dateStr === '2026-08-18') {
      count++;
      total += parseFloat(row[totalCol]) || 0;
    }
  });
  Logger.log(`Aug 18 in Sheets: ${count} orders, ₹${total}`);
}