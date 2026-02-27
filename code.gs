// ==========================================
// CONFIGURATION — Replace with your own values
// ==========================================
var WEBHOOK_URL = "YOUR_WEBHOOK_URL_HERE"; // Make.com, Zapier, or any webhook endpoint
var SHEET_URL = "YOUR_GOOGLE_SHEET_URL_HERE"; // Google Sheets URL for data storage

/**
 * Serves the HTML form as a web app.
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('MUX Internet')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Processes form submission:
 * 1. Saves data to Google Sheets
 * 2. Sends instant notification via webhook (Make.com / Zapier / Telegram)
 * 
 * @param {Object} formObject - Form data from the client
 * @returns {string} "Success" on completion
 */
function processForm(formObject) {
  var ss = SpreadsheetApp.openByUrl(SHEET_URL);
  var sheet = ss.getSheets()[0]; 

  // Combine mobile numbers
  var combinedMobile = formObject.mobile;
  if (formObject.secMobile) {
    combinedMobile += " / " + formObject.secMobile;
  }

  // Append Public IP add-on to package if selected
  if (formObject.realIp == "on") {
    formObject.package = formObject.package + " + Public IP 200tk/mo";
  }

  // Build Google Maps link from coordinates
  var mapLink = "https://maps.google.com/maps?q=" + formObject.lat + "," + formObject.lng;

  // Format GPS data with accuracy
  var gpsData = formObject.lat + "," + formObject.lng;
  if (formObject.acc) {
    gpsData += " (Acc: " + Math.round(formObject.acc) + "m)";
  }

  // 1. Save to Google Sheet
  sheet.appendRow([
    new Date(), 
    formObject.name, 
    "'" + combinedMobile, 
    formObject.manualAddress, 
    formObject.workingDate, 
    mapLink, 
    gpsData,
    formObject.package
  ]);

  // 2. Send webhook notification (won't break submission if webhook fails)
  try {
    var payload = {
      "name": formObject.name,
      "mobile": combinedMobile,
      "package": formObject.package,
      "address": formObject.manualAddress,
      "date": formObject.workingDate,
      "map": mapLink,
      "accuracy": formObject.acc + " meters"
    };
    
    var options = {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify(payload)
    };
    
    UrlFetchApp.fetch(WEBHOOK_URL, options);
  } catch (e) {
    console.error("Webhook failed: " + e.message);
  }

  return "Success";
}