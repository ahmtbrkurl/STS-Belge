function getManage_(token){
  ensureHeaders_();
  const cleanToken = String(token || '').trim().toUpperCase();
  const rows=sheet_(SHEETS.PERSONNEL).getDataRange().getValues();
  const r=rows.slice(1).find(x=>String(x[10]).toUpperCase()===cleanToken);
  if(!r) return {success: false, ok:false, error:'INVALID_MANAGE_TOKEN'};
  
  const docs=sheet_(SHEETS.DOCUMENTS).getDataRange().getValues().slice(1)
    .filter(x=>String(x[0])===String(r[0]))
    .map(x=>({code:x[1],fileId:x[2],fileName:x[3],version:x[4],status:x[5],updatedAt:x[6]}));

  return {
    success: true,
    ok: true,
    person: {
      personId: r[0],
      firstName: r[3],
      lastName: r[4],
      fullName: `${r[3]} ${r[4]}`,
      groupId: r[1],
      folderId: r[8],
      status: r[9]
    },
    documents: docs
  };
}

function updatePersonnelDocument_(p){
  ensureHeaders_();
  const manageToken = String(p.manageToken || p.token || '').trim().toUpperCase();
  const rows = sheet_(SHEETS.PERSONNEL).getDataRange().getValues();
  const personRow = rows.slice(1).find(x => String(x[10]).toUpperCase() === manageToken);
  
  if (!personRow) {
    return { success: false, ok: false, error: 'INVALID_MANAGE_TOKEN' };
  }

  const personId = personRow[0];
  const folderId = personRow[8];
  const docCode = p.documentCode || p.code;
  const fileObj = p.file || {};
  let newFileId = '';
  const fileName = fileObj.name || `${docCode}_updated.pdf`;

  if (folderId && fileObj.data) {
    try {
      const contentType = fileObj.type || 'application/octet-stream';
      const base64Data = fileObj.data.split(',')[1] || fileObj.data;
      const decodedBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, fileName);
      archiveExisting_(folderId, `${docCode}_${fileName}`);
      const savedFile = saveBlob_(folderId, decodedBlob, `${docCode}_${fileName}`);
      newFileId = savedFile.getId();
    } catch (err) {
      console.warn('Drive update failed:', err);
    }
  }

  // DOCUMENTS tablosunu güncelle
  const docSheet = sheet_(SHEETS.DOCUMENTS);
  const docRows = docSheet.getDataRange().getValues();
  let found = false;

  for (let i = 1; i < docRows.length; i++) {
    if (String(docRows[i][0]) === String(personId) && String(docRows[i][1]) === String(docCode)) {
      const curVer = Number(docRows[i][4] || 1);
      docSheet.getRange(i + 1, 3).setValue(newFileId);
      docSheet.getRange(i + 1, 4).setValue(fileName);
      docSheet.getRange(i + 1, 5).setValue(curVer + 1);
      docSheet.getRange(i + 1, 6).setValue('PENDING');
      docSheet.getRange(i + 1, 7).setValue(new Date());
      found = true;
      break;
    }
  }

  if (!found) {
    docSheet.appendRow([personId, docCode, newFileId, fileName, 1, 'PENDING', new Date()]);
  }

  // Log kaydı ekle
  appendRow_(SHEETS.DOCUMENT_LOG, [
    new Date(),
    personId,
    personRow[1],
    docCode,
    'DOCUMENT_UPDATED',
    2,
    '',
    newFileId,
    'PERSONNEL',
    'Personel belgeyi güncelledi.'
  ]);

  return { success: true, ok: true, documentCode: docCode, fileName: fileName };
}

function replaceDocument_(p){
  return updatePersonnelDocument_(p);
}
