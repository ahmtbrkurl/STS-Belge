function sheet_(name){
  var ss = null;
  try {
    if (typeof CONFIG !== 'undefined' && CONFIG.SHEET_ID && CONFIG.SHEET_ID !== 'PUT_GOOGLE_SHEET_ID_HERE') {
      ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    }
  } catch (e) {
    ss = null;
  }
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function appendRow_(sheetName, row){
  sheet_(sheetName).appendRow(row);
}

function ensureHeaders_(){
  var headers = {
    [SHEETS.GROUPS]: ['groupId','name','description','active','createdAt'],
    [SHEETS.FORM_FIELDS]: ['fieldId','groupId','page','sortOrder','type','code','label','required','accept','maxMB','replaceAllowed','hrApproval','active'],
    [SHEETS.PERSONNEL]: ['personId','groupId','formVersion','firstName','lastName','nationalId','passportNumber','phone','folderId','status','manageToken','createdAt','updatedAt'],
    [SHEETS.DOCUMENT_LOG]: ['timestamp','personId','groupId','documentCode','action','version','oldFileId','newFileId','actor','note'],
    [SHEETS.LINKS]: ['token','groupId','name','expiresAt','active','createdAt'],
    [SHEETS.DOCUMENTS]: ['personId','documentCode','fileId','fileName','version','status','updatedAt']
  };
  Object.keys(headers).forEach(function(k){
    var s = sheet_(k);
    if(s.getLastRow() === 0) s.appendRow(headers[k]);
  });
}
