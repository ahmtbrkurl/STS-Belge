function createGroup_(p) {
  ensureHeaders_();
  const id = p.groupId || p.id || ('GRP-' + Utilities.getUuid().slice(0, 8).toUpperCase());
  const name = p.name || p.groupName || 'Yeni Grup';
  const desc = p.description || '';
  appendRow_(SHEETS.GROUPS, [id, name, desc, true, new Date()]);
  return { success: true, ok: true, groupId: id, id: id };
}

function getGroups_() {
  ensureHeaders_();
  const rows = sheet_(SHEETS.GROUPS).getDataRange().getValues();
  if (rows.length <= 1) return { success: true, ok: true, groups: [] };
  const groups = rows.slice(1).map(r => ({
    id: String(r[0]),
    name: String(r[1]),
    description: String(r[2] || ''),
    active: r[3] !== false,
    createdAt: r[4]
  }));
  return { success: true, ok: true, groups: groups };
}

function saveFormField_(p) {
  ensureHeaders_();
  const id = p.fieldId || ('FLD-' + Utilities.getUuid().slice(0, 8).toUpperCase());
  appendRow_(SHEETS.FORM_FIELDS, [
    id, p.groupId, p.page || 1, p.sortOrder || 1, p.type, p.code || '', p.label,
    !!p.required, (p.accept || []).join(','), p.maxMB || 10,
    p.replaceAllowed !== false, !!p.hrApproval, p.active !== false
  ]);
  return { success: true, ok: true, fieldId: id };
}

function saveFormForHR_(p) {
  ensureHeaders_();
  const s = sheet_(SHEETS.FORM_FIELDS);
  const rows = s.getDataRange().getValues();
  const groupId = String(p.group_id || p.groupId || 'GRP-GENEL').trim();
  const formName = p.form_name || p.formName || (groupId.replace('GRP-', '') + ' Başvuru Formu');
  const version = p.version || '1.0';
  const fields = p.fields || [];
  const formId = p.form_id || ('FORM-' + groupId.replace('GRP-', '').toUpperCase() + '-' + Utilities.getUuid().slice(0, 6).toUpperCase());

  // Eski alanları temizle (bu gruba ait)
  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][1]).toUpperCase() === groupId.toUpperCase() || String(rows[i][1]).toUpperCase() === groupId.replace('GRP-', '').toUpperCase()) {
      s.deleteRow(i + 1);
    }
  }

  // Yeni alanları ekle
  fields.forEach((f, idx) => {
    const fId = f.id || f.field_id || ('FLD-' + Utilities.getUuid().slice(0, 8).toUpperCase());
    let fileTypesStr = '';
    if (Array.isArray(f.fileTypes)) fileTypesStr = f.fileTypes.join(',');
    else if (Array.isArray(f.accept)) fileTypesStr = f.accept.join(',');

    s.appendRow([
      fId,
      groupId,
      f.step || f.page || 1,
      idx + 1,
      f.type || 'text',
      f.code || f.id || ('FLD_' + (idx + 1)),
      f.label || ('Alan ' + (idx + 1)),
      f.required === true,
      fileTypesStr,
      f.maxMB || 10,
      f.replaceAllowed !== false,
      f.hrApproval === true,
      true
    ]);
  });

  return {
    success: true,
    ok: true,
    form_id: formId,
    formId: formId,
    group_id: groupId,
    groupId: groupId,
    form_name: formName,
    formName: formName,
    version: version,
    status: 'ACTIVE',
    fieldsCount: fields.length
  };
}

function getForms_() {
  ensureHeaders_();
  const groupsRes = getGroups_();
  const fieldsRows = sheet_(SHEETS.FORM_FIELDS).getDataRange().getValues().slice(1);
  const groupsList = groupsRes.groups || [];

  // Mevcut kayıtlı form alanlarından grupları topla
  const knownGroupIds = new Set(groupsList.map(g => String(g.id).toUpperCase()));
  fieldsRows.forEach(r => {
    const gid = String(r[1] || '').toUpperCase();
    if (gid && !knownGroupIds.has(gid)) {
      knownGroupIds.add(gid);
      groupsList.push({
        id: gid,
        name: gid.replace('GRP-', '') + ' Grubu',
        description: '',
        active: true
      });
    }
  });

  if (groupsList.length === 0) {
    groupsList.push(
      { id: 'GRP-FORMEN', name: 'Formen', description: 'Formen pozisyonları', active: true },
      { id: 'GRP-ISCI', name: 'İşçi', description: 'Saha işçileri', active: true }
    );
  }

  const forms = groupsList.map(g => {
    const gFields = fieldsRows
      .filter(r => (String(r[1]).toUpperCase() === String(g.id).toUpperCase() || String(r[1]).toUpperCase() === String(g.id).replace('GRP-', '').toUpperCase()) && r[12] !== false)
      .map(r => ({
        id: String(r[0]),
        field_id: String(r[0]),
        groupId: String(r[1]),
        group_id: String(r[1]),
        step: Number(r[2] || 1),
        type: String(r[4] || 'text'),
        code: String(r[5] || ''),
        label: String(r[6] || ''),
        required: r[7] === true || String(r[7]).toUpperCase() === 'TRUE',
        accept: r[8] ? String(r[8]).split(',') : [],
        fileTypes: r[8] ? String(r[8]).split(',') : [],
        maxMB: Number(r[9] || 10),
        replaceAllowed: r[10] !== false,
        hrApproval: r[11] === true
      }));

    const formId = 'FORM-' + String(g.id).replace('GRP-', '').toUpperCase();
    const formName = (g.name || g.id) + ' Başvuru Formu';

    return {
      id: formId,
      form_id: formId,
      group_id: g.id,
      groupId: g.id,
      group_name: g.name,
      groupName: g.name,
      form_name: formName,
      formName: formName,
      version: '1.0',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      fields: gFields
    };
  });

  return { success: true, ok: true, forms: forms };
}

function getFormDefinitionForHR_(p) {
  ensureHeaders_();
  const formsRes = getForms_();
  const forms = formsRes.forms || [];
  const targetId = String(p.form_id || p.formId || p.group_id || p.groupId || '').toUpperCase();

  const found = forms.find(f => 
    String(f.form_id || '').toUpperCase() === targetId ||
    String(f.id || '').toUpperCase() === targetId ||
    String(f.group_id || '').toUpperCase() === targetId ||
    String(f.group_id || '').toUpperCase() === ('GRP-' + targetId)
  );

  if (found) {
    return {
      success: true,
      ok: true,
      form: found,
      fields: found.fields || []
    };
  }

  return {
    success: true,
    ok: true,
    form: {
      id: targetId || 'FORM-DEFAULT',
      form_id: targetId || 'FORM-DEFAULT',
      group_id: p.group_id || 'GRP-FORMEN',
      form_name: 'Personel Formu',
      version: '1.0',
      status: 'ACTIVE'
    },
    fields: []
  };
}

function setFormStatusForHR_(p) {
  return { success: true, ok: true, status: p.status || 'ACTIVE' };
}

function deleteFormForHR_(p) {
  ensureHeaders_();
  const s = sheet_(SHEETS.FORM_FIELDS);
  const rows = s.getDataRange().getValues();
  const target = String(p.form_id || p.group_id || '').replace('FORM-', '').replace('GRP-', '').toUpperCase();

  for (let i = rows.length - 1; i >= 1; i--) {
    const gid = String(rows[i][1]).replace('GRP-', '').toUpperCase();
    if (gid === target) {
      s.deleteRow(i + 1);
    }
  }

  return { success: true, ok: true };
}

function createApplicationLink_(p) {
  ensureHeaders_();
  const cleanPrefix = (p.group_id || p.groupId || 'APP').replace('GRP-', '').toUpperCase();
  const token = cleanPrefix + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 10).toUpperCase();
  const days = Number(p.expire_days || p.days || 30);
  const expires = days > 0 ? new Date(Date.now() + (days * 86400000)) : new Date(Date.now() + (3650 * 86400000));
  const linkId = 'LNK-' + Utilities.getUuid().slice(0, 8).toUpperCase();
  const linkObj = {
    id: linkId,
    token: token,
    group_id: p.group_id || p.groupId,
    group_name: p.group_name || p.groupName || p.group_id,
    form_id: p.form_id || 'DEFAULT',
    form_name: p.form_name || 'Personel Başvuru Formu',
    campaign_name: p.campaign_name || p.note || 'Genel Alım',
    max_usage: Number(p.max_usage || p.limit || 0),
    used_count: 0,
    start_date: new Date().toISOString(),
    end_date: expires.toISOString(),
    status: 'ACTIVE',
    created_at: new Date().toISOString()
  };

  appendRow_(SHEETS.LINKS, [
    token,
    linkObj.group_id,
    linkObj.campaign_name,
    expires,
    true,
    new Date(),
    linkId,
    linkObj.form_id,
    linkObj.max_usage,
    0
  ]);

  return { success: true, ok: true, link: linkObj, token: token, expiresAt: expires.toISOString() };
}

function updateApplicationLinkStatus_(p) {
  ensureHeaders_();
  const s = sheet_(SHEETS.LINKS);
  const rows = s.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(p.link_id) || String(rows[i][6]) === String(p.link_id)) {
      s.getRange(i + 1, 5).setValue(p.status === 'ACTIVE');
      return { success: true, ok: true };
    }
  }
  return { success: true, ok: true };
}

function updateApplicationLink_(p) {
  return updateApplicationLinkStatus_(p);
}

function getApplicationLinkOptions_() {
  ensureHeaders_();
  const groupsRes = getGroups_();
  const formsRes = getForms_();
  return {
    success: true,
    ok: true,
    groups: groupsRes.groups || [],
    forms: formsRes.forms || [],
    campaigns: [
      { id: 'CMP-GENEL', name: 'Genel Personel Alımı', month: new Date().toISOString().slice(0, 7) }
    ]
  };
}

function getApplicationLinksForHR_() {
  ensureHeaders_();
  const rows = sheet_(SHEETS.LINKS).getDataRange().getValues();
  if (rows.length <= 1) return { success: true, ok: true, links: [] };
  const links = rows.slice(1).map(r => ({
    id: r[6] || ('LNK-' + String(r[0]).slice(0, 6)),
    token: String(r[0]),
    group_id: String(r[1]),
    campaign_name: String(r[2] || ''),
    end_date: r[3] ? new Date(r[3]).toISOString() : '',
    status: r[4] === true ? 'ACTIVE' : 'PASSIVE',
    created_at: r[5] ? new Date(r[5]).toISOString() : '',
    max_usage: Number(r[8] || 0),
    used_count: Number(r[9] || 0)
  }));
  return { success: true, ok: true, links: links };
}

function getFormSchema_(token, lang) {
  ensureHeaders_();
  const rows = sheet_(SHEETS.LINKS).getDataRange().getValues();
  const cleanToken = String(token || '').trim().toUpperCase();
  const link = rows.slice(1).find(r => String(r[0]).toUpperCase() === cleanToken && r[4] !== false);

  let targetGroupId = link ? String(link[1]) : 'GRP-FORMEN';
  if (!link && cleanToken.indexOf('-') !== -1) {
    const prefix = cleanToken.split('-')[0];
    if (prefix) targetGroupId = 'GRP-' + prefix;
  }

  const fieldsRows = sheet_(SHEETS.FORM_FIELDS).getDataRange().getValues().slice(1);
  let matchedFields = fieldsRows.filter(r => {
    const gid = String(r[1] || '').toUpperCase();
    const target = targetGroupId.toUpperCase();
    return (gid === target || gid === target.replace('GRP-', '')) && r[12] !== false;
  });

  if (matchedFields.length === 0 && fieldsRows.length > 0) {
    matchedFields = fieldsRows.filter(r => r[12] !== false);
  }

  let fields = matchedFields
    .sort((a, b) => (Number(a[2]) - Number(b[2])) || (Number(a[3]) - Number(b[3])))
    .map((r, idx) => ({
      id: String(r[5] || r[0] || ('field_' + (idx + 1))),
      field_id: String(r[5] || r[0] || ('field_' + (idx + 1))),
      fieldId: String(r[0]),
      groupId: String(r[1]),
      step: Number(r[2] || 1),
      sortOrder: Number(r[3] || 1),
      type: String(r[4] || 'text'),
      code: String(r[5] || ('CODE_' + (idx + 1))).toUpperCase(),
      label: String(r[6] || ('Alan ' + (idx + 1))),
      required: r[7] === true || String(r[7]).toUpperCase() === 'TRUE',
      accept: r[8] ? String(r[8]).split(',').map(s => s.trim()) : ['image/*', 'application/pdf'],
      fileTypes: r[8] ? String(r[8]).split(',').map(s => s.trim()) : ['image/*', 'application/pdf'],
      maxMB: Number(r[9] || 10)
    }));

  if (fields.length === 0) {
    fields = [
      { id: 'firstName', field_id: 'firstName', type: 'text', label: 'Ad', required: true, step: 1 },
      { id: 'lastName', field_id: 'lastName', type: 'text', label: 'Soyad', required: true, step: 1 },
      { id: 'nationalId', field_id: 'nationalId', type: 'national_id', label: 'T.C. Kimlik Numarası', required: true, step: 1 },
      { id: 'phone', field_id: 'phone', type: 'phone', label: 'Telefon Numarası', required: true, step: 1 },
      { id: 'identityDoc', field_id: 'identityDoc', type: 'document', code: 'KIMLIK', label: 'Kimlik Belgesi', required: true, accept: ['image/*', 'application/pdf'], maxMB: 10, step: 2 },
      { id: 'photo', field_id: 'photo', type: 'photo', code: 'FOTOGRAF', label: 'Vesikalık Fotoğraf', required: true, accept: ['image/*'], maxMB: 5, step: 2 }
    ];
  }

  return {
    success: true,
    ok: true,
    data: {
      group: targetGroupId,
      groupName: targetGroupId.replace('GRP-', ''),
      title: targetGroupId.replace('GRP-', '') + ' Başvuru Formu',
      version: '1.0',
      fields: fields
    }
  };
}
