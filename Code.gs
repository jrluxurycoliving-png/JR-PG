function doGet(e) {
  var data = {
    pgs: getSheetData('PGs'),
    tenants: getSheetData('Tenants'),
    transactions: getSheetData('Transactions'),
    settings: getSheetData('Settings'),
    users: getSheetData('Users')
  };
  
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  // Parse contents. React fetches via text/plain to bypass CORS preflights
  var params = JSON.parse(e.postData.contents);
  var sheetName = params.sheet;
  var action = params.action; // 'upsert', 'delete'
  var record = params.data; 

  if (action === 'upsert') {
    upsertRow(sheetName, record);
  } else if (action === 'delete') {
    deleteRow(sheetName, params.id);
  } else if (action === 'upsertSettings') {
    upsertRow('Settings', record);
  }
  
  return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
}

function getSheetData(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Only headers or empty
  
  var headers = data[0];
  var result = [];
  
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
       var val = data[i][j];
       // Attempt to parse JSON strictly if it looks like an array or object
       try {
         if (typeof val === 'string' && (val.trim().startsWith('{') || val.trim().startsWith('['))) {
            val = JSON.parse(val);
         }
       } catch(e) {
         // Keep raw if parse fails
       }
       obj[headers[j]] = val;
    }
    result.push(obj);
  }
  return result;
}

function upsertRow(sheetName, record) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  
  var data = sheet.getDataRange().getValues();
  if (data.length === 0) return; // Need headers
  
  var headers = data[0];
  var rowToUpdate = -1;
  var idColIndex = headers.indexOf('id');
  
  if (idColIndex !== -1) {
    for (var i = 1; i < data.length; i++) {
      if (data[i][idColIndex] === record.id) {
        rowToUpdate = i + 1; // 1-indexed for Sheets
        break;
      }
    }
  }
  
  var newRow = [];
  for (var j = 0; j < headers.length; j++) {
    var val = record[headers[j]];
    if (typeof val === 'object') {
      val = JSON.stringify(val);
    }
    if (val === undefined || val === null) {
      val = '';
    }
    newRow.push(val);
  }
  
  if (rowToUpdate !== -1) {
    sheet.getRange(rowToUpdate, 1, 1, headers.length).setValues([newRow]);
  } else {
    sheet.appendRow(newRow);
  }
}

function deleteRow(sheetName, id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  
  var data = sheet.getDataRange().getValues();
  if (data.length === 0) return;
  
  var headers = data[0];
  var idColIndex = headers.indexOf('id');
  
  if (idColIndex !== -1) {
    for (var i = 1; i < data.length; i++) {
      if (data[i][idColIndex] === id) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
  }
}
