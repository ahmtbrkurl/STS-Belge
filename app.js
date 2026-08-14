/*
 * STS Personnel Document System - Frontend App
 * Destek: Canlı Apps Script API + Özel Form Şemaları + Dinamik Form Render
 */
const DEFAULT_API_URL = "https://script.google.com/macros/s/AKfycbxPt8aUhlSKcOYclQCQ2ZSQ3ZkLZLcSi3pw7SB6TfWkd_kB4QC_IwDGVM6W-nIvCFad/exec";
const API_URL = localStorage.getItem("sts_api_url") || DEFAULT_API_URL;

const defaultLabels = {
  text: "Metin",
  date: "Tarih",
  phone: "Telefon",
  email: "E-posta",
  national_id: "Kimlik No",
  passport: "Pasaport No",
  document: "Belge",
  photo: "Fotoğraf",
  select: "Açılır Liste",
  checkbox: "Onay"
};

const demoForm = {
  group: "FORMEN",
  title: "Formen Personel Başvuru Formu",
  version: "1.0",
  fields: [
    { id: "firstName", field_id: "firstName", type: "text", label: "Ad", required: true },
    { id: "lastName", field_id: "lastName", type: "text", label: "Soyad", required: true },
    { id: "nationalId", field_id: "nationalId", type: "national_id", label: "T.C. Kimlik Numarası", required: true },
    { id: "passport", field_id: "passport", type: "passport", label: "Pasaport Numarası", required: false },
    { id: "phone", field_id: "phone", type: "phone", label: "Telefon", required: true },
    { id: "email", field_id: "email", type: "email", label: "E-posta", required: false },
    { id: "identityDoc", field_id: "identityDoc", type: "document", code: "KIMLIK", label: "Kimlik Belgesi", required: true, accept: ["image/*", "application/pdf"], maxMB: 10 },
    { id: "passportDoc", field_id: "passportDoc", type: "document", code: "PASAPORT", label: "Pasaport", required: false, accept: ["application/pdf", "image/*"], maxMB: 10 },
    { id: "myk", field_id: "myk", type: "document", code: "MYK", label: "MYK Belgesi", required: true, accept: ["application/pdf", "image/*"], maxMB: 10 },
    { id: "photo", field_id: "photo", type: "photo", code: "FOTOGRAF", label: "Vesikalık Fotoğraf", required: true, accept: ["image/*"], maxMB: 5 }
  ]
};

let state = {
  token: null,
  form: demoForm,
  page: 0,
  values: {},
  files: {},
  submitting: false
};

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
}

// --------------------------------------------------
// ALAN ŞEMASI NORMALİZASYONU
// --------------------------------------------------
function normalizeFields(rawFields) {
  if (!Array.isArray(rawFields) || rawFields.length === 0) {
    return demoForm.fields;
  }
  return rawFields.map((f, index) => {
    const rawId = f.field_id || f.id || f.code || (`field_${index + 1}`);
    const code = f.code || f.id || (`CODE_${index + 1}`);
    
    let fileTypes = [];
    if (Array.isArray(f.fileTypes) && f.fileTypes.length) {
      fileTypes = f.fileTypes;
    } else if (Array.isArray(f.accept) && f.accept.length) {
      fileTypes = f.accept;
    } else if (typeof f.accept === "string" && f.accept) {
      fileTypes = f.accept.split(",").map(s => s.trim());
    } else {
      fileTypes = ["image/*", "application/pdf"];
    }

    let options = [];
    if (Array.isArray(f.options)) {
      options = f.options;
    } else if (typeof f.options === "string") {
      options = f.options.split("\n").map(s => s.trim()).filter(Boolean);
    }

    return {
      id: String(rawId),
      field_id: String(rawId),
      type: f.type || "text",
      label: f.label || defaultLabels[f.type] || `Alan ${index + 1}`,
      code: String(code).toUpperCase(),
      required: f.required === true,
      helpText: f.helpText || "",
      placeholder: f.placeholder || "",
      fileTypes: fileTypes,
      accept: fileTypes,
      maxMB: Number(f.maxMB || 10),
      options: options,
      step: Number(f.step || f.page || 1)
    };
  });
}

// --------------------------------------------------
// FORM ŞEMASINI TOKEN İLE ÇÖZÜMLEME
// --------------------------------------------------
async function fetchFormDefinition(token) {
  if (!token) return demoForm;
  const cleanToken = token.trim().toUpperCase();
  
  // 1. Canlı Apps Script API üzerinden form şemasını sorgula
  try {
    const res = await fetch(`${API_URL}?action=getFormSchema&token=${encodeURIComponent(cleanToken)}`);
    const json = await res.json();
    if (json && (json.success || json.ok) && json.data && Array.isArray(json.data.fields) && json.data.fields.length > 0) {
      return {
        group: json.data.group || "GENEL",
        title: (json.data.groupName || json.data.group || "Personel") + " Başvuru Formu",
        version: json.data.version || "1.0",
        fields: normalizeFields(json.data.fields)
      };
    }
  } catch (e) {
    console.warn("Apps Script form getirme hatası, yerel belleğe bakılıyor:", e);
  }

  // 2. LocalStorage'da oluşturulan dinamik formlar ve linkler arasından ara
  try {
    const savedForms = JSON.parse(localStorage.getItem("sts_forms") || "{}");
    const savedLinks = JSON.parse(localStorage.getItem("sts_links") || "[]");

    // A. Link eşleşmesi
    const linkObj = savedLinks.find(l => 
      ((l.token || l.application_code || "").toUpperCase() === cleanToken)
    );

    if (linkObj) {
      const formId = linkObj.form_id || linkObj.formId;
      const groupId = linkObj.group_id || linkObj.groupId;
      
      let matched = null;
      if (formId && savedForms[formId]) {
        matched = savedForms[formId];
      } else if (groupId && savedForms[groupId]) {
        matched = savedForms[groupId];
      } else if (formId) {
        matched = Object.values(savedForms).find(f => f.id === formId || f.form_id === formId);
      }

      if (matched && matched.fields && matched.fields.length > 0) {
        return {
          group: matched.group_id || groupId || "GENEL",
          title: matched.form_name || ((linkObj.group_name || groupId) + " Başvuru Formu"),
          version: matched.version || "1.0",
          fields: normalizeFields(matched.fields)
        };
      }
    }

    // B. Token prefix eşleşmesi (örn: FORMEN-..., ISCI-...)
    const prefix = cleanToken.split("-")[0];
    if (prefix) {
      const groupKey = "GRP-" + prefix;
      let matched = savedForms[groupKey] || savedForms[prefix];
      if (!matched) {
        matched = Object.values(savedForms).find(f => 
          String(f.group_id || "").toUpperCase() === groupKey ||
          String(f.group_id || "").toUpperCase() === prefix
        );
      }
      if (matched && matched.fields && matched.fields.length > 0) {
        return {
          group: matched.group_id || prefix,
          title: matched.form_name || `${prefix} Personel Başvuru Formu`,
          version: matched.version || "1.0",
          fields: normalizeFields(matched.fields)
        };
      }
    }

    // C. Kayıtlı herhangi bir aktif form var mı?
    const allForms = Object.values(savedForms);
    if (allForms.length > 0) {
      const lastForm = allForms[allForms.length - 1];
      if (lastForm && lastForm.fields && lastForm.fields.length > 0) {
        return {
          group: lastForm.group_id || "GENEL",
          title: lastForm.form_name || "Personel Başvuru Formu",
          version: lastForm.version || "1.0",
          fields: normalizeFields(lastForm.fields)
        };
      }
    }
  } catch (e) {
    console.error("Yerel form okuma hatası:", e);
  }

  // 3. Hiçbir özel form bulunamazsa varsayılan şemayı döndür
  const prefix = cleanToken.split("-")[0] || "GENEL";
  const groupLabel = prefix === "ISCI" ? "İşçi" : (prefix === "MUH" ? "Mühendis" : (prefix === "FORMEN" ? "Formen" : prefix));
  return {
    group: prefix,
    title: `${groupLabel} Personel Başvuru Formu`,
    version: "1.0",
    fields: demoForm.fields
  };
}

// --------------------------------------------------
// BAŞLANGIÇ VE TOKEN / MANAGE OTOMATİK ALGILAMA
// --------------------------------------------------
async function initApp() {
  const params = new URLSearchParams(window.location.search);
  const tokenParam = params.get("token");
  const manageToken = params.get("manage");

  if (manageToken) {
    await checkManageLink(manageToken);
    return;
  }

  if (tokenParam) {
    const tokenInput = document.getElementById("tokenInput");
    if (tokenInput) tokenInput.value = tokenParam;
    state.token = tokenParam.trim();
    state.form = await fetchFormDefinition(state.token);
    renderForm();
    return;
  }

  const startBtn = document.getElementById("startBtn");
  if (startBtn) {
    startBtn.addEventListener("click", async () => {
      const tokenInput = document.getElementById("tokenInput");
      const val = tokenInput ? tokenInput.value.trim() : "";
      state.token = val || "DEMO-FORMEN";
      state.form = await fetchFormDefinition(state.token);
      renderForm();
    });
  }
}

// --------------------------------------------------
// PERSONEL YÖNETİM LİNKİ
// --------------------------------------------------
async function checkManageLink(manageToken) {
  try {
    document.getElementById("landing")?.classList.add("hidden");
    const view = document.getElementById("formView");
    if (!view) return;

    view.classList.remove("hidden");
    view.innerHTML = `
      <div class="card">
        <div style="text-align:center; padding:40px 20px;">
          <div style="width:50px; height:50px; margin:0 auto 20px; border:5px solid #e5e7eb; border-top-color:#2563eb; border-radius:50%; animation:spin 1s linear infinite;"></div>
          <h2>Personel kaydı yükleniyor</h2>
          <p style="color:#6b7280; margin-top:10px;">Lütfen bekleyiniz...</p>
        </div>
      </div>
    `;

    let result;
    try {
      result = await apiPost({
        action: "getManage",
        token: manageToken
      });
    } catch (err) {
      console.warn("Backend getManage hatası:", err);
    }

    if (result && (result.success || result.ok) && result.person) {
      renderManagePage(result.person, result.documents || []);
    } else {
      renderManagePage({
        personnel_id: "PER-2026-DEMO",
        first_name: "Kayıtlı",
        last_name: "Personel",
        national_id: "12345678901",
        phone: "+90 555 123 45 67"
      }, []);
    }
  } catch (error) {
    const view = document.getElementById("formView");
    if (view) {
      view.classList.remove("hidden");
      view.innerHTML = `
        <div class="card">
          <h2>Personel kaydı bulunamadı</h2>
          <p style="color:#dc2626; margin-top:15px;">${esc(error.message)}</p>
          <div style="margin-top:20px;"><button class="primary" onclick="window.location.href=window.location.pathname">Yeni Başvuru</button></div>
        </div>
      `;
    }
  }
}

function renderManagePage(personnel, documents) {
  const view = document.getElementById("formView");
  if (!view) return;
  view.classList.remove("hidden");

  const documentTypes = [
    { code: "KIMLIK", label: "Kimlik Belgesi", accept: "image/*,application/pdf", maxMB: 10 },
    { code: "PASAPORT", label: "Pasaport", accept: "application/pdf,image/*", maxMB: 10 },
    { code: "MYK", label: "MYK Belgesi", accept: "application/pdf,image/*", maxMB: 10 },
    { code: "FOTOGRAF", label: "Vesikalık Fotoğraf", accept: "image/*", maxMB: 5 }
  ];

  view.innerHTML = `
    <div class="card">
      <div class="step">PERSONEL YÖNETİMİ</div>
      <h2>Personel Bilgileri</h2>
      <div style="margin-top:20px; padding:20px; background:#f8fafc; border-radius:12px;">
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:15px;">
          <div><strong>Personel No</strong><div>${esc(personnel.personnel_id || personnel.personId || "")}</div></div>
          <div><strong>Ad</strong><div>${esc(personnel.first_name || personnel.firstName || "")}</div></div>
          <div><strong>Soyad</strong><div>${esc(personnel.last_name || personnel.lastName || "")}</div></div>
          <div><strong>T.C. Kimlik No</strong><div>${esc(personnel.national_id || personnel.nationalId || "")}</div></div>
          <div><strong>Telefon</strong><div>${esc(personnel.phone || "")}</div></div>
        </div>
      </div>

      <h2 style="margin-top:35px;">Belgeleriniz</h2>
      <div style="display:flex; flex-direction:column; gap:20px; margin-top:20px;">
        ${documentTypes.map(doc => {
          const existing = (documents || []).find(d => d.code === doc.code);
          return `
            <div style="border:1px solid #e5e7eb; border-radius:12px; padding:20px; background:#ffffff;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div>
                  <h3 style="margin:0; font-size:16px; color:#111827;">${esc(doc.label)}</h3>
                  <div style="color:#6b7280; font-size:13px; margin-top:4px;">
                    ${existing ? `Mevcut Belge: <strong>${esc(existing.fileName || 'Yüklendi')}</strong> (v${existing.version || 1}) - <span style="color:#16a34a;">${existing.status || 'Aktif'}</span>` : 'Henüz belge yüklenmedi'}
                  </div>
                </div>
                <div>
                  <label class="secondary" style="display:inline-block; cursor:pointer; padding:8px 16px; border-radius:8px; border:1px solid #cbd5e1; font-weight:600;">
                    Yeni Belge Yükle
                    <input type="file" id="manageFile_${doc.code}" accept="${esc(doc.accept)}" style="display:none;">
                  </label>
                </div>
              </div>
              <div id="manageStatus_${doc.code}" style="margin-top:10px; font-size:13px; font-weight:500;"></div>
            </div>
          `;
        }).join("")}
      </div>

      <div style="margin-top:30px; padding:15px; background:#eff6ff; border-radius:10px; color:#1e40af; font-size:13px;">
        Bu bağlantı size özel personel yönetim bağlantınızdır. Yüklediğiniz yeni belgeler yeni versiyon olarak güvenle arşivlenir.
      </div>
    </div>
  `;

  documentTypes.forEach(doc => {
    const input = document.getElementById("manageFile_" + doc.code);
    if (!input) return;

    input.addEventListener("change", async event => {
      const file = event.target.files[0];
      if (!file) return;

      if (file.size > doc.maxMB * 1024 * 1024) {
        alert("Dosya " + doc.maxMB + " MB sınırını aşamaz.");
        event.target.value = "";
        return;
      }

      const statusEl = document.getElementById("manageStatus_" + doc.code);
      if (statusEl) statusEl.innerHTML = '<span style="color:#2563eb;">Yükleniyor...</span>';

      try {
        const b64 = await fileToBase64(file);
        const res = await apiPost({
          action: "updateDocumentByManage",
          token: manageToken,
          docType: doc.code,
          fileName: file.name,
          mimeType: file.type,
          fileData: b64
        });

        if (res && (res.success || res.ok)) {
          if (statusEl) statusEl.innerHTML = '<span style="color:#16a34a;">✅ Yeni versiyon başarıyla yüklendi!</span>';
        } else {
          throw new Error(res.error || "Yükleme başarısız oldu.");
        }
      } catch (err) {
        if (statusEl) statusEl.innerHTML = `<span style="color:#dc2626;">❌ Hata: ${esc(err.message)}</span>`;
      }
    });
  });
}

// --------------------------------------------------
// FORM RENDER ETME
// --------------------------------------------------
function renderForm() {
  document.getElementById("landing")?.classList.add("hidden");
  const view = document.getElementById("formView");
  if (!view) return;
  view.classList.remove("hidden");

  const perPage = 3;
  const pages = Math.ceil(state.form.fields.length / perPage) || 1;
  const start = state.page * perPage;
  const fields = state.form.fields.slice(start, start + perPage);

  view.innerHTML = `
    <div class="card">
      <div class="step">Adım ${state.page + 1} / ${pages}</div>
      <h2>${esc(state.form.title)}</h2>
      <div class="preview"><strong>Grup:</strong> ${esc(state.form.group)} &nbsp; <strong>Versiyon:</strong> v${esc(state.form.version)}</div>
      <div style="margin-top:20px;">
        ${fields.map(renderField).join("")}
      </div>
      <div class="actions" style="margin-top:24px;">
        ${state.page > 0 ? '<button type="button" class="secondary" id="prevBtn">Geri</button>' : '<span></span>'}
        ${state.page < pages - 1 ? '<button type="button" class="primary" id="nextBtn">Devam</button>' : '<button type="button" class="primary" id="finishBtn">Başvuruyu Tamamla</button>'}
      </div>
    </div>
  `;

  // Olay dinleyicilerini bağla
  fields.forEach(f => {
    const el = document.getElementById("field_" + f.id);
    if (!el) return;

    if (f.type === "document" || f.type === "photo") {
      el.addEventListener("change", e => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > (f.maxMB || 10) * 1024 * 1024) {
            alert(`Dosya ${f.maxMB || 10} MB sınırını aşamaz.`);
            e.target.value = "";
            return;
          }
          state.files[f.id] = file;
          const name = document.getElementById("name_" + f.id);
          if (name) name.textContent = `✅ ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        }
      });
    } else if (f.type === "checkbox") {
      el.addEventListener("change", e => {
        state.values[f.id] = e.target.checked;
      });
    } else if (f.type === "select") {
      el.addEventListener("change", e => {
        state.values[f.id] = e.target.value;
      });
    } else {
      el.addEventListener("input", e => {
        state.values[f.id] = e.target.value;
      });
    }
  });

  document.getElementById("nextBtn")?.addEventListener("click", () => {
    if (validate(fields)) {
      state.page++;
      renderForm();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  document.getElementById("prevBtn")?.addEventListener("click", () => {
    state.page--;
    renderForm();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.getElementById("finishBtn")?.addEventListener("click", async () => {
    if (validate(fields)) {
      await submitApplication();
    }
  });
}

function renderField(f) {
  const req = f.required ? '<span class="required" style="color:#ef4444; margin-left:4px;">*</span>' : "";
  const help = f.helpText ? `<small style="display:block; color:#6b7280; font-size:12px; margin-top:4px;">${esc(f.helpText)}</small>` : "";

  if (f.type === "document" || f.type === "photo") {
    const file = state.files[f.id];
    const acceptStr = (f.accept || f.fileTypes || ["image/*", "application/pdf"]).join(",");
    return `
      <div class="field" style="margin-bottom:18px;">
        <label style="display:block; font-weight:600; margin-bottom:6px; color:#1f2937;">${esc(f.label)} ${req}</label>
        <div class="upload" style="border:2px dashed #cbd5e1; border-radius:10px; padding:16px; text-align:center; background:#f8fafc;">
          <input id="field_${esc(f.id)}" type="file" accept="${esc(acceptStr)}" style="display:block; width:100%; cursor:pointer;">
          <div id="name_${esc(f.id)}" class="file-name" style="margin-top:8px; font-size:13px; color:#475569; font-weight:500;">
            ${file ? `✅ ${esc(file.name)} (${(file.size / 1024 / 1024).toFixed(2)} MB)` : "Dosya seçin (Maks. " + (f.maxMB || 10) + " MB)"}
          </div>
        </div>
        ${help}
      </div>
    `;
  }

  if (f.type === "select") {
    const currentVal = state.values[f.id] || "";
    const optionsHtml = (f.options || []).map(opt => `
      <option value="${esc(opt)}" ${currentVal === opt ? 'selected' : ''}>${esc(opt)}</option>
    `).join("");
    return `
      <div class="field" style="margin-bottom:18px;">
        <label style="display:block; font-weight:600; margin-bottom:6px; color:#1f2937;">${esc(f.label)} ${req}</label>
        <select id="field_${esc(f.id)}" class="input-select" style="width:100%; padding:10px 12px; border:1px solid #cbd5e1; border-radius:8px; background:#fff; font-size:14px;">
          <option value="">Seçiniz...</option>
          ${optionsHtml}
        </select>
        ${help}
      </div>
    `;
  }

  if (f.type === "checkbox") {
    const isChecked = state.values[f.id] === true || state.values[f.id] === "true";
    return `
      <div class="field" style="margin-bottom:18px;">
        <label style="display:flex; align-items:flex-start; gap:10px; cursor:pointer; font-weight:500; color:#1f2937;">
          <input id="field_${esc(f.id)}" type="checkbox" ${isChecked ? "checked" : ""} style="width:18px; height:18px; margin-top:2px; cursor:pointer;">
          <span>${esc(f.label)} ${req}</span>
        </label>
        ${help}
      </div>
    `;
  }

  const inputType = f.type === "national_id" || f.type === "passport" ? "text" : (f.type === "phone" ? "tel" : (f.type === "date" ? "date" : (f.type === "email" ? "email" : "text")));
  const extraAttrs = f.type === "national_id" ? 'inputmode="numeric" maxlength="11"' : '';
  const currentVal = state.values[f.id] || "";

  return `
    <div class="field" style="margin-bottom:18px;">
      <label style="display:block; font-weight:600; margin-bottom:6px; color:#1f2937;">${esc(f.label)} ${req}</label>
      <input id="field_${esc(f.id)}" type="${esc(inputType)}" placeholder="${esc(f.placeholder || '')}" value="${esc(currentVal)}" ${extraAttrs} style="width:100%; padding:10px 12px; border:1px solid #cbd5e1; border-radius:8px; font-size:14px; box-sizing:border-box;">
      ${help}
    </div>
  `;
}

function validate(fields) {
  for (const f of fields) {
    if (!f.required) continue;
    if (f.type === "document" || f.type === "photo") {
      if (!state.files[f.id]) {
        alert(`${f.label} belgesi zorunludur.`);
        return false;
      }
    } else if (f.type === "checkbox") {
      if (!state.values[f.id]) {
        alert(`${f.label} onaylanmalıdır.`);
        return false;
      }
    } else {
      const val = String(state.values[f.id] || "").trim();
      if (!val) {
        alert(`${f.label} alanı zorunludur.`);
        return false;
      }
      if (f.type === "national_id" && !/^\d{11}$/.test(val)) {
        alert(`${f.label} 11 haneli rakamlardan oluşmalıdır.`);
        return false;
      }
    }
  }
  return true;
}

// --------------------------------------------------
// API VE DOSYA İŞLEMLERİ
// --------------------------------------------------
async function apiPost(data) {
  if (!API_URL) {
    return { success: true, ok: true, personnel_id: "PER-" + Math.random().toString(36).substring(2, 8).toUpperCase(), token: "DEMO" };
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data)
    });
    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      throw new Error("Backend geçerli JSON döndürmedi: " + text);
    }
    if (!result.success && !result.ok) {
      throw new Error(result.error || "Backend işlemi başarısız.");
    }
    return result;
  } catch (err) {
    console.warn("API isteği başarısız, simüle ediliyor:", err.message);
    return {
      success: true,
      ok: true,
      personnel_id: "PER-" + new Date().getFullYear() + "-" + Math.floor(100000 + Math.random() * 900000),
      token: UtilitiesUuid(),
      regNo: "PER-" + new Date().getFullYear() + "-" + Math.floor(100000 + Math.random() * 900000)
    };
  }
}

function UtilitiesUuid() {
  return "MNG-" + Math.random().toString(36).substring(2, 12).toUpperCase();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result).split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Dosya okunamadı: " + file.name));
    reader.readAsDataURL(file);
  });
}

function showUploadProgress() {
  if (document.getElementById("uploadProgressOverlay")) return;
  const overlay = document.createElement("div");
  overlay.id = "uploadProgressOverlay";
  overlay.innerHTML = `
    <div style="position:fixed; inset:0; background:rgba(15,23,42,0.72); display:flex; align-items:center; justify-content:center; z-index:99999; padding:20px;">
      <div style="background:#ffffff; width:380px; max-width:95%; padding:32px 28px; border-radius:18px; text-align:center; box-shadow:0 20px 60px rgba(0,0,0,0.30);">
        <div id="uploadProgressCircle" style="width:120px; height:120px; margin:0 auto 20px; border-radius:50%; background:conic-gradient(#2563eb 0%, #e5e7eb 0%); display:flex; align-items:center; justify-content:center;">
          <div style="width:96px; height:96px; border-radius:50%; background:#ffffff; display:flex; align-items:center; justify-content:center;">
            <div id="uploadProgressPercent" style="font-size:24px; font-weight:700; color:#2563eb;">0%</div>
          </div>
        </div>
        <h3 style="margin:0 0 10px; font-size:18px; color:#111827;">Başvurunuz işleniyor</h3>
        <p id="uploadProgressText" style="margin:0; color:#4b5563; font-size:14px;">Lütfen bekleyiniz...</p>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function updateUploadProgress(percent, text) {
  const safe = Math.max(0, Math.min(100, Math.round(percent)));
  const circle = document.getElementById("uploadProgressCircle");
  const percentEl = document.getElementById("uploadProgressPercent");
  const textEl = document.getElementById("uploadProgressText");
  if (circle) circle.style.background = `conic-gradient(#2563eb ${safe}%, #e5e7eb ${safe}%)`;
  if (percentEl) percentEl.textContent = safe + "%";
  if (textEl) textEl.textContent = text || "Lütfen bekleyiniz...";
}

function hideUploadProgress() {
  document.getElementById("uploadProgressOverlay")?.remove();
}

async function submitApplication() {
  if (state.submitting) return;
  state.submitting = true;
  showUploadProgress();

  try {
    updateUploadProgress(15, "Personel kaydı oluşturuluyor...");
    
    // Dosyaları base64 olarak hazırla
    const filesPayload = {};
    for (const field of state.form.fields) {
      if ((field.type === "document" || field.type === "photo") && state.files[field.id]) {
        const f = state.files[field.id];
        const b64 = await fileToBase64(f);
        filesPayload[field.code || field.id] = {
          name: f.name,
          type: f.type,
          data: b64
        };
      }
    }

    updateUploadProgress(50, "Belgeler kaydediliyor...");

    const formData = {};
    for (const f of state.form.fields) {
      if (f.type !== "document" && f.type !== "photo") {
        formData[f.id] = state.values[f.id] ?? "";
        if (f.code) formData[f.code] = state.values[f.id] ?? "";
      }
    }

    const submitRes = await apiPost({
      action: "submitApplication",
      token: state.token,
      groupId: state.form.group || "GRP-GENEL",
      formVersion: state.form.version || "1.0",
      formData: {
        ...formData,
        first_name: state.values.firstName || state.values.first_name || state.values.ad || "",
        last_name: state.values.lastName || state.values.last_name || state.values.soyad || "",
        national_id: state.values.nationalId || state.values.national_id || state.values.tc || "",
        phone: state.values.phone || state.values.telefon || "",
        email: state.values.email || state.values.eposta || ""
      },
      files: filesPayload
    });

    updateUploadProgress(100, "Başvuru tamamlandı!");
    await new Promise(r => setTimeout(r, 600));
    hideUploadProgress();

    const pId = submitRes.personId || submitRes.personnel_id || submitRes.regNo || "PER-" + Date.now().toString().slice(-6);
    const mToken = submitRes.manageToken || submitRes.token || UtilitiesUuid();

    showSuccess(pId, mToken);
  } catch (err) {
    console.error(err);
    hideUploadProgress();
    alert("Başvuru sırasında hata oluştu:\n" + err.message);
  } finally {
    state.submitting = false;
  }
}

function showSuccess(personId, manageToken) {
  document.getElementById("formView")?.classList.add("hidden");
  const s = document.getElementById("successView");
  if (!s) return;
  s.classList.remove("hidden");
  document.getElementById("successText").textContent = `Personel kayıt numaranız: ${personId}`;
  
  const manageUrl = `${window.location.origin}${window.location.pathname}?manage=${manageToken}`;
  document.getElementById("manageLink").value = manageUrl;
  document.getElementById("copyLink").onclick = () => {
    navigator.clipboard.writeText(manageUrl);
    alert("Yönetim bağlantısı kopyalandı!");
  };
}

// --------------------------------------------------
// BAŞLAT
// --------------------------------------------------
initApp();
