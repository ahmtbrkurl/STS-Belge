function doGet(e) {
  try {
    const p = e && e.parameter ? e.parameter : {};
    const action = p.action || '';

    if (action === 'getFormSchema' || action === 'getForm') {
      return json_(getFormSchema_(p.token || '', p.lang || 'tr'));
    }
    if (action === 'getManage') {
      return json_(getManage_(p.token || p.manageToken || ''));
    }
    if (action === 'getApplicationLinkOptions') {
      return json_(getApplicationLinkOptions_());
    }
    if (action === 'getApplicationLinks') {
      return json_(getApplicationLinksForHR_());
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        ok: true,
        service: 'STS Personnel Document System',
        version: '2.0',
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return json_({ success: false, ok: false, error: String(err), stack: err.stack });
  }
}

function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (ex) {
        payload = {};
      }
    }
    const action = payload.action || (e && e.parameter ? e.parameter.action : '');

    // Form ve Başvuru Portalı İşlemleri
    if (action === 'getForm' || action === 'getFormSchema') return json_(getFormSchema_(payload.token, payload.lang));
    if (action === 'submitApplication' || action === 'createPersonnel') return json_(submitApplication_(payload));
    if (action === 'getManage') return json_(getManage_(payload.token || payload.manageToken));
    if (action === 'updatePersonnelDocument' || action === 'replaceDocument') return json_(updatePersonnelDocument_(payload));

    // HR Yönetim Paneli İşlemleri
    if (action === 'getApplicationLinkOptions') return json_(getApplicationLinkOptions_());
    if (action === 'getApplicationLinks') return json_(getApplicationLinksForHR_());
    if (action === 'createApplicationLink' || action === 'createLink') return json_(createApplicationLink_(payload));
    if (action === 'updateApplicationLink') return json_(updateApplicationLink_(payload));
    if (action === 'updateApplicationLinkStatus') return json_(updateApplicationLinkStatus_(payload));

    if (action === 'createGroup' || action === 'createApplicationGroup') return json_(createGroup_(payload));
    if (action === 'getGroups') return json_(getGroups_());

    if (action === 'createForm' || action === 'saveForm' || action === 'saveFormForHR' || action === 'updateFormForHR') return json_(saveFormForHR_(payload));
    if (action === 'getForms' || action === 'getFormsForHR') return json_(getForms_());
    if (action === 'getFormDefinitionForHR' || action === 'getFormDefinition') return json_(getFormDefinitionForHR_(payload));
    if (action === 'setFormStatusForHR' || action === 'setFormStatus') return json_(setFormStatusForHR_(payload));
    if (action === 'deleteFormForHR' || action === 'deleteForm') return json_(deleteFormForHR_(payload));
    if (action === 'saveField') return json_(saveFormField_(payload));

    if (action === 'getPersonnelList') return json_(getPersonnelList_());
    if (action === 'getAuditLogs') return json_(getAuditLogs_());

    return json_({ success: false, ok: false, error: 'UNKNOWN_ACTION: ' + action });
  } catch (err) {
    return json_({ success: false, ok: false, error: String(err), stack: err.stack });
  }
}

function json_(obj) {
  // Hem success hem ok bayraklarını garantiye al
  if (typeof obj === 'object' && obj !== null) {
    if (obj.success === undefined && obj.ok !== undefined) obj.success = obj.ok;
    if (obj.ok === undefined && obj.success !== undefined) obj.ok = obj.success;
  }
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
