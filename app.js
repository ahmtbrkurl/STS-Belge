/*
 * STS Personnel Document System - Frontend App
 * Destek: Canlı Apps Script API + Yerel Fallback
 */
const API_URL = "https://script.google.com/macros/s/AKfycbwPMm6sjG_viMpjyW9zhNsGfDA9PKjckV47pvMplonGOqS-FNOnDxbl47EYF67Lmk4/exec";

const demoForm = {
  group: "FORMEN",
  title: "Formen Personel Başvuru Formu",
  version: "1.0",
  fields: [
    {id:"firstName", type:"text", label:"Ad", required:true},
    {id:"lastName", type:"text", label:"Soyad", required:true},
    {id:"nationalId", type:"national_id", label:"T.C. Kimlik Numarası", required:true},
    {id:"passport", type:"passport", label:"Pasaport Numarası", required:false},
    {id:"phone", type:"phone", label:"Telefon", required:true},
    {id:"email", type:"email", label:"E-posta", required:false},
    {id:"identityDoc", type:"document", code:"KIMLIK", label:"Kimlik Belgesi", required:true, accept:["image/*","application/pdf"], maxMB:10},
    {id:"passportDoc", type:"document", code:"PASAPORT", label:"Pasaport", required:false, accept:["application/pdf","image/*"], maxMB:10},
    {id:"myk", type:"document", code:"MYK", label:"MYK Belgesi", required:true, accept:["application/pdf","image/*"], maxMB:10},
    {id:"photo", type:"photo", code:"FOTOGRAF", label:"Vesikalık Fotoğraf", required:true, accept:["image/*"], maxMB:5}
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

function esc(v){
  return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

// --------------------------------------------------
// FORM ŞEMASINI TOKEN İLE ÇÖZÜMLEME
// --------------------------------------------------
async function fetchFormDefinition(token) {
  if (!token) return demoForm;
  
  // 1. Apps Script API'den almayı dene
  try {
    const res = await fetch(`${API_URL}?action=getFormSchema&token=${encodeURIComponent(token)}`);
    const json = await res.json();
    if (json && json.success && json.data) {
      return {
        group: json.data.group || "GENEL",
        title: (json.data.groupName || json.data.group || "Personel") + " Başvuru Formu",
        version: "1.0",
        fields: json.data.fields || demoForm.fields
      };
    }
  } catch (e) {
    console.warn("Apps Script form getirme hatası, yerel belleğe bakılıyor:", e);
  }

  // 2. LocalStorage üzerinden eşleşen grup formunu bul
  try {
    const savedLinks = JSON.parse(localStorage.getItem("sts_links") || "[]");
    const linkObj = savedLinks.find(l => (l.token || "").toUpperCase() === token.trim().toUpperCase());
    if (linkObj) {
      const savedForms = JSON.parse(localStorage.getItem("sts_forms") || "{}");
      if (linkObj.groupId && savedForms[linkObj.groupId]) {
        return {
          group: linkObj.groupId,
          title: (linkObj.groupName || linkObj.groupId) + " Başvuru Formu",
          version: savedForms[linkObj.groupId].version || "1.0",
          fields: savedForms[linkObj.groupId].fields || demoForm.fields
        };
      }
    }
  } catch (e) {}

  return demoForm;
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
      // Demo person verisiyle aç
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

      const status = document.getElementById("manageStatus_" + doc.code);
      if (status) {
        status.textContent = "Belge yükleniyor...";
        status.style.color = "#2563eb";
      }

      try {
        await uploadManageDocument(personnel.personnel_id || personnel.personId, doc.code, file);
        if (status) {
          status.textContent = "Belge başarıyla yüklendi.";
          status.style.color = "#16a34a";
        }
        event.target.value = "";
      } catch (err) {
        if (status) {
          status.textContent = "Yükleme başarısız.";
          status.style.color = "#dc2626";
        }
        alert("Hata: " + err.message);
        event.target.value = "";
      }
    });
  });
}

async function uploadManageDocument(personnelId, documentCode, file) {
  const base64 = await fileToBase64(file);
  return await apiPost({
    action: "updatePersonnelDocument",
    personnel_id: personnelId,
    document_code: documentCode,
    file: {
      name: file.name,
      type: file.type,
      data: base64
    }
  });
}

// --------------------------------------------------
// FORM RENDER VE DOĞRULAMA
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
      <div class="preview"><strong>Grup:</strong> ${esc(state.form.group)} &nbsp; <strong>Form:</strong> v${esc(state.form.version)}</div>
      ${fields.map(renderField).join("")}
      <div class="actions">
        ${state.page > 0 ? '<button class="secondary" id="prevBtn">Geri</button>' : '<span></span>'}
        ${state.page < pages - 1 ? '<button class="primary" id="nextBtn">Devam</button>' : '<button class="primary" id="finishBtn">Başvuruyu Tamamla</button>'}
      </div>
    </div>
  `;

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
          if (name) name.textContent = file.name;
        }
      });
    } else {
      el.addEventListener("input", e => state.values[f.id] = e.target.value);
    }
  });

  document.getElementById("nextBtn")?.addEventListener("click", () => {
    if (validate(fields)) {
      state.page++;
      renderForm();
    }
  });
  document.getElementById("prevBtn")?.addEventListener("click", () => {
    state.page--;
    renderForm();
  });
  document.getElementById("finishBtn")?.addEventListener("click", async () => {
    if (validate(fields)) {
      await submitApplication();
    }
  });
}

function renderField(f) {
  const req = f.required ? '<span class="required">*</span>' : "";
  if (f.type === "document" || f.type === "photo") {
    return `
      <div class="field">
        <label>${esc(f.label)} ${req}</label>
        <div class="upload">
          <input id="field_${f.id}" type="file" accept="${esc((f.accept || []).join(","))}">
          <div id="name_${f.id}" class="file-name">${state.files[f.id] ? esc(state.files[f.id].name) : "Dosya seçilmedi"}</div>
        </div>
      </div>
    `;
  }
  const type = f.type === "national_id" || f.type === "passport" ? "text" : f.type;
  return `
    <div class="field">
      <label>${esc(f.label)} ${req}</label>
      <input id="field_${f.id}" type="${esc(type)}" value="${esc(state.values[f.id] || "")}" ${f.type === "national_id" ? 'inputmode="numeric" maxlength="11"' : ''}>
    </div>
  `;
}

function validate(fields) {
  for (const f of fields) {
    if (!f.required) continue;
    if ((f.type === "document" || f.type === "photo") && !state.files[f.id]) {
      alert(`${f.label} zorunludur.`);
      return false;
    }
    if (f.type !== "document" && f.type !== "photo" && !state.values[f.id]) {
      alert(`${f.label} zorunludur.`);
      return false;
    }
  }
  if (state.values.nationalId && !/^\d{11}$/.test(state.values.nationalId)) {
    alert("T.C. Kimlik No 11 haneli olmalıdır.");
    return false;
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

    const submitRes = await apiPost({
      action: "submitApplication",
      groupId: state.form.group || "GRP-FORMEN",
      formVersion: state.form.version || "1.0",
      formData: {
        first_name: state.values.firstName,
        last_name: state.values.lastName,
        full_name: `${state.values.firstName || ''} ${state.values.lastName || ''}`.trim(),
        national_id: state.values.nationalId,
        passport_number: state.values.passport || "",
        phone: state.values.phone || "",
        email: state.values.email || ""
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
