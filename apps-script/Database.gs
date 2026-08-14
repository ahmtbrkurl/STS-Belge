function sheet_(name){
  const ss=SpreadsheetApp.openById(CONFIG.SHEET_ID);
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function appendRow_(sheetName, row){
  sheet_(sheetName).appendRow(row);
}

function ensureHeaders_(){
  const headers = {
    [SHEETS.GROUPS]: ['groupId','name','description','active','createdAt'],
    [SHEETS.FORM_FIELDS]: ['fieldId','groupId','page','sortOrder','type','code','label','required','accept','maxMB','replaceAllowed','hrApproval','active'],
    [SHEETS.PERSONNEL]: ['personId','groupId','formVersion','firstName','lastName','nationalId','passportNumber','phone','folderId','status','manageToken','createdAt','updatedAt'],
    [SHEETS.DOCUMENT_LOG]: ['timestamp','personId','groupId','documentCode','action','version','oldFileId','newFileId','actor','note'],
    [SHEETS.LINKS]: ['token','groupId','name','expiresAt','active','createdAt'],
    [SHEETS.DOCUMENTS]: ['personId','documentCode','fileId','fileName','version','status','updatedAt']
  };
  Object.keys(headers).forEach(k=>{
    const s=sheet_(k);
    if(s.getLastRow()===0) s.appendRow(headers[k]);
  });
}
