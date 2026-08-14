function newPersonId_(){
  const s=sheet_(SHEETS.PERSONNEL);
  const n=Math.max(1,s.getLastRow());
  return `PER-${new Date().getFullYear()}-${String(n).padStart(6,'0')}`;
}

function submitApplication_(p){
  ensureHeaders_();
  const personId = newPersonId_();
  const formData = p.formData || {};
  const files = p.files || {};
  const groupId = p.groupId || formData.group || 'GRP-FORMEN';
  const firstName = formData.first_name || (formData.full_name ? formData.full_name.split(' ')[0] : 'İsimsiz');
  const lastName = formData.last_name || (formData.full_name ? formData.full_name.split(' ').slice(1).join(' ') : 'Personel');
  const nationalId = formData.national_id || '';
  const passportNumber = formData.passport_number || formData.passport || '';
  const phone = formData.phone || '';

  const person = {
    personId: personId,
    groupId: groupId,
    formVersion: p.formVersion || '1.0',
    firstName: firstName,
    lastName: lastName,
    nationalId: nationalId,
    passportNumber: passportNumber,
    phone: phone,
    status: 'IN_PROGRESS'
  };

  let folderId = '';
  try {
    const folder = createPersonFolder_(person);
    folderId = folder.getId();
  } catch (err) {
    console.warn('Drive folder creation failed (using root or dummy):', err);
  }

  const manageToken = Utilities.getUuid().replace(/-/g,'').slice(0,32).toUpperCase();

  appendRow_(SHEETS.PERSONNEL, [
    personId,
    person.groupId,
    person.formVersion,
    person.firstName,
    person.lastName,
    person.nationalId,
    person.passportNumber,
    person.phone,
    folderId,
    person.status,
    manageToken,
    new Date(),
    new Date()
  ]);

  // Yüklenen dosyaları kaydet
  Object.keys(files).forEach(code => {
    const fObj = files[code];
    let fileId = '';
    const fName = (fObj && fObj.name) ? fObj.name : `${code}.pdf`;
    
    if (folderId && fObj && fObj.data) {
      try {
        const contentType = fObj.type || 'application/octet-stream';
        const base64Data = fObj.data.split(',')[1] || fObj.data;
        const decodedBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, fName);
        const savedFile = saveBlob_(folderId, decodedBlob, `${code}_${fName}`);
        fileId = savedFile.getId();
      } catch (err) {
        console.warn('File save failed:', err);
      }
    }

    appendRow_(SHEETS.DOCUMENTS, [
      personId,
      code,
      fileId,
      fName,
      1,
      'PENDING',
      new Date()
    ]);
  });

  appendRow_(SHEETS.DOCUMENT_LOG, [
    new Date(),
    personId,
    person.groupId,
    'SYSTEM',
    'APPLICATION_SUBMITTED',
    1,
    '',
    '',
    'CANDIDATE',
    'Başvuru başarıyla oluşturuldu.'
  ]);

  return {
    success: true,
    ok: true,
    personId: personId,
    regNo: personId,
    manageToken: manageToken,
    manageUrl: `?manage=${manageToken}`
  };
}

function getPersonnelList_() {
  ensureHeaders_();
  const rows = sheet_(SHEETS.PERSONNEL).getDataRange().getValues();
  if (rows.length <= 1) return { success: true, ok: true, personnel: [] };
  const list = rows.slice(1).map(r => ({
    personId: String(r[0]),
    groupId: String(r[1]),
    formVersion: String(r[2]),
    firstName: String(r[3]),
    lastName: String(r[4]),
    fullName: `${r[3]} ${r[4]}`,
    nationalId: String(r[5]),
    passportNumber: String(r[6]),
    phone: String(r[7]),
    folderId: String(r[8]),
    status: String(r[9]),
    manageToken: String(r[10]),
    createdAt: r[11],
    updatedAt: r[12]
  }));
  return { success: true, ok: true, personnel: list };
}

function getAuditLogs_() {
  ensureHeaders_();
  const rows = sheet_(SHEETS.DOCUMENT_LOG).getDataRange().getValues();
  if (rows.length <= 1) return { success: true, ok: true, logs: [] };
  const logs = rows.slice(1).map(r => ({
    timestamp: r[0],
    personId: String(r[1]),
    groupId: String(r[2]),
    documentCode: String(r[3]),
    action: String(r[4]),
    version: r[5],
    actor: String(r[8]),
    note: String(r[9] || '')
  }));
  return { success: true, ok: true, logs: logs };
}
