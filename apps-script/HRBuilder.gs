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
  const groupId = p.group_id || p.groupId;
  const formName = p.form_name || p.formName || 'Personel Başvuru Formu';
  const version = p.version || '1.0';
  const fields = p.fields || [];

  // Eski alanları deaktif et veya sil
  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][1]) === String(groupId)) {
      s.deleteRow(i + 1);
    }
  }

  // Yeni alanları ekle
  fields.forEach((f, idx) => {
    const fId = f.id || ('FLD-' + Utilities.getUuid().slice(0, 8).toUpperCase());
    s.appendRow([
      fId,
      groupId,
      f.step || f.page || 1,
      idx + 1,
      f.type,
      f.code || f.id || '',
      f.label || '',
      !!f.required,
      (f.accept || []).join(','),
      f.maxMB || 10,
      f.replaceAllowed !== false,
      !!f.hrApproval,
      true
    ]);
  });

  return { success: true, ok: true, groupId: groupId, formName: formName, version: version, fieldsCount: fields.length };
}

function getForms_() {
  ensureHeaders_();
  const groupsRes = getGroups_();
  const fieldsRows = sheet_(SHEETS.FORM_FIELDS).getDataRange().getValues().slice(1);
  const forms = (groupsRes.groups || []).map(g => {
    const gFields = fieldsRows
      .filter(r => String(r[1]) === String(g.id) && r[12] !== false)
      .map(r => ({
        id: r[0],
        groupId: r[1],
        step: r[2],
        type: r[4],
        code: r[5],
        label: r[6],
        required: r[7]
      }));
    return {
      id: 'FORM-' + g.id,
      groupId: g.id,
      groupName: g.name,
      formName: g.name + ' Başvuru Formu',
      fields: gFields
    };
  });
  return { success: true, ok: true, forms: forms };
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
  const now = new Date();
  const cleanToken = String(token || '').trim().toUpperCase();
  const link = rows.slice(1).find(r => String(r[0]).toUpperCase() === cleanToken && r[4] !== false && new Date(r[3]) > now);

  let targetGroupId = link ? String(link[1]) : 'GRP-FORMEN';
  if (!link) {
    const prefix = cleanToken.split('-')[0];
    if (prefix) targetGroupId = 'GRP-' + prefix;
  }

  const fieldsRows = sheet_(SHEETS.FORM_FIELDS).getDataRange().getValues().slice(1);
  let matchedFields = fieldsRows.filter(r => String(r[1]).toUpperCase() === targetGroupId.toUpperCase() && r[12] !== false);

  if (matchedFields.length === 0) {
    matchedFields = fieldsRows.filter(r => r[12] !== false);
  }

  let fields = matchedFields
    .sort((a, b) => (Number(a[2]) - Number(b[2])) || (Number(a[3]) - Number(b[3])))
    .map(r => ({
      id: String(r[5] || r[0]),
      fieldId: String(r[0]),
      groupId: String(r[1]),
      step: Number(r[2] || 1),
      sortOrder: Number(r[3] || 1),
      type: String(r[4] || 'text'),
      code: String(r[5] || ''),
      label: String(r[6] || ''),
      required: !!r[7],
      accept: r[8] ? String(r[8]).split(',') : [],
      maxMB: Number(r[9] || 10)
    }));

  if (fields.length === 0) {
    fields = [
      { id: 'full_name', type: 'text', label: 'Ad Soyad', required: true, step: 1 },
      { id: 'national_id', type: 'national_id', label: 'T.C. Kimlik No', required: true, step: 1 },
      { id: 'birth_date', type: 'date', label: 'Doğum Tarihi', required: true, step: 1 },
      { id: 'phone', type: 'phone', label: 'Telefon Numarası', required: true, step: 1 },
      { id: 'email', type: 'email', label: 'E-posta Adresi', required: false, step: 1 },
      { id: 'position', type: 'text', label: 'Görev / Pozisyon', required: true, step: 1 },
      { id: 'photo', type: 'photo', label: 'Vesikalık Fotoğraf', required: true, step: 2 },
      { id: 'id_card_doc', type: 'document', label: 'Kimlik / Pasaport Fotokopisi', required: true, step: 2 },
      { id: 'criminal_record', type: 'document', label: 'Adli Sicil Kaydı', required: true, step: 2 },
      { id: 'consent', type: 'checkbox', label: 'Aydınlatma metnini onaylıyorum.', required: true, step: 3 }
    ];
  }

  return {
    success: true,
    ok: true,
    data: {
      group: targetGroupId,
      groupName: targetGroupId.replace('GRP-', ''),
      fields: fields
    }
  };
}
