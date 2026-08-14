const DEFAULT_API_URL="https://script.google.com/macros/s/AKfycbxPt8aUhlSKcOYclQCQ2ZSQ3ZkLZLcSi3pw7SB6TfWkd_kB4QC_IwDGVM6W-nIvCFad/exec";
function getApiUrl(){
  return localStorage.getItem("sts_api_url") || DEFAULT_API_URL;
}
const API_URL=getApiUrl();

const demo={
  groups:[
    {
      id:"GRP-FORMEN",
      name:"FORMEN",
      description:"Formen personel grubu",
      people:0,
      docs:0
    },
    {
      id:"GRP-ISCI",
      name:"İŞÇİ",
      description:"Saha işçileri",
      people:0,
      docs:0
    },
    {
      id:"GRP-MUH",
      name:"MÜHENDİS",
      description:"Mühendisler",
      people:0,
      docs:0
    }
  ],

  links:[],

  fields:[]
};


let selectedField=null;
let editingFormId=null;
let hrForms=[];


const $=id=>document.getElementById(id);


async function post(data){
  const url = getApiUrl();
  if(!url){
    return getLocalMockResponse(data);
  }

  try {
    const response=
      await fetch(
        url,
        {
          method:"POST",
          headers:{
            "Content-Type":
              "text/plain;charset=utf-8"
          },
          body:
            JSON.stringify(data)
        }
      );

    const text=
      await response.text();

    let result;
    try{
      result=
        JSON.parse(text);
    }catch(e){
      throw new Error(
        text ||
        "Backend geçerli JSON döndürmedi."
      );
    }

    if(!result.success){
      throw new Error(
        result.error ||
        "Backend işlemi başarısız."
      );
    }

    return result;
  } catch (err) {
    console.warn("Backend isteği başarısız, yerel veriler kullanılıyor:", err.message);
    return getLocalMockResponse(data);
  }
}

function getLocalMockResponse(data) {
  const action = data ? data.action : "";
  const savedLinks = JSON.parse(localStorage.getItem("sts_links") || "[]");
  const savedGroups = JSON.parse(localStorage.getItem("sts_groups") || "null") || demo.groups;
  const formsMap = JSON.parse(localStorage.getItem("sts_forms") || "{}");

  if (action === "getFormsForHR" || action === "getForms") {
    const list = Object.values(formsMap);
    return {
      success: true,
      ok: true,
      forms: list.length ? list : (hrForms.length ? hrForms : [])
    };
  }

  if (action === "getFormDefinitionForHR") {
    const targetId = data.form_id || data.formId;
    let found = formsMap[targetId];
    if (!found) {
      found = Object.values(formsMap).find(f => f.id === targetId || f.form_id === targetId || f.group_id === targetId);
    }
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
      form: { form_id: targetId, group_id: "GRP-FORMEN", form_name: "Personel Formu", version: "1.0" },
      fields: []
    };
  }

  if (action === "getApplicationLinkOptions") {
    const formList = Object.values(formsMap);
    return {
      success: true,
      ok: true,
      groups: savedGroups,
      forms: formList.length ? formList : (hrForms.length ? hrForms : [{ id: "DEFAULT", form_name: "Genel Personel Formu", group_id: "GRP-FORMEN" }]),
      campaigns: [
        { id: "CMP-GENEL", name: "2026 Genel Alım", month: "2026-03" }
      ]
    };
  }

  if (action === "getApplicationLinks") {
    return {
      success: true,
      ok: true,
      links: savedLinks
    };
  }

  if (action === "createForm" || action === "saveFormForHR") {
    const fId = "FORM-" + (data.group_id || "GENEL").replace("GRP-", "").toUpperCase() + "-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const newForm = {
      id: fId,
      form_id: fId,
      form_name: data.form_name,
      group_id: data.group_id,
      version: data.version || "1.0",
      status: "ACTIVE",
      created_at: new Date().toISOString(),
      fields: data.fields || []
    };
    formsMap[data.group_id] = newForm;
    formsMap[fId] = newForm;
    localStorage.setItem("sts_forms", JSON.stringify(formsMap));
    return { success: true, ok: true, form_id: newForm.id, form: newForm };
  }

  if (action === "updateFormForHR") {
    const fId = data.form_id;
    const updatedForm = {
      id: fId,
      form_id: fId,
      form_name: data.form_name,
      group_id: data.group_id,
      version: data.version || "1.0",
      status: "ACTIVE",
      updated_at: new Date().toISOString(),
      fields: data.fields || []
    };
    formsMap[data.group_id] = updatedForm;
    formsMap[fId] = updatedForm;
    localStorage.setItem("sts_forms", JSON.stringify(formsMap));
    return { success: true, ok: true, form_id: fId, form: updatedForm };
  }

  if (action === "setFormStatusForHR") {
    const fId = data.form_id;
    if (formsMap[fId]) {
      formsMap[fId].status = data.status;
      localStorage.setItem("sts_forms", JSON.stringify(formsMap));
    }
    return { success: true, ok: true };
  }

  if (action === "getGroups") {
    return { success: true, ok: true, groups: savedGroups };
  }

  if (action === "createGroup") {
    const gId = "GRP-" + (data.name || "YENI").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
    const newGroup = { id: gId, name: data.name, description: data.description || "", people: 0, docs: 0 };
    savedGroups.push(newGroup);
    localStorage.setItem("sts_groups", JSON.stringify(savedGroups));
    return { success: true, ok: true, group: newGroup, groupId: gId };
  }

  return { success: true, ok: true };
}


const esc=
  v=>
    String(v??"")
      .replace(
        /[&<>"']/g,
        m=>({
          "&":"&amp;",
          "<":"&lt;",
          ">":"&gt;",
          '"':"&quot;",
          "'":"&#039;"
        }[m])
      );


const typeNames={

  text:
    "Metin",

  date:
    "Tarih",

  phone:
    "Telefon",

  email:
    "E-posta",

  national_id:
    "Kimlik No",

  passport:
    "Pasaport No",

  document:
    "Belge",

  photo:
    "Fotoğraf",

  select:
    "Açılır Liste",

  checkbox:
    "Onay"

};


const defaultLabels={

  text:
    "Metin",

  date:
    "Tarih",

  phone:
    "Telefon",

  email:
    "E-posta",

  national_id:
    "Kimlik No",

  passport:
    "Pasaport No",

  document:
    "Belge",

  photo:
    "Fotoğraf",

  select:
    "Açılır Liste",

  checkbox:
    "Onay"

};


// ============================================================
// NAVIGATION
// ============================================================

document
  .querySelectorAll(".nav-item")
  .forEach(
    b=>
      b.onclick=
        ()=>
          showPage(
            b.dataset.page
          )
  );


document
  .querySelectorAll("[data-goto]")
  .forEach(
    b=>
      b.onclick=
        ()=>
          showPage(
            b.dataset.goto
          )
  );


// ============================================================
// STS HR SESSION
// ============================================================

const SESSION_KEY=
  "STS_HR_SESSION";

const LANGUAGE_KEY=
  "STS_HR_LANGUAGE";


function saveSession(username){

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({

      loggedIn:
        true,

      username:
        username,

      createdAt:
        Date.now()

    })
  );

}


function getSession(){

  try{

    return JSON.parse(
      localStorage.getItem(
        SESSION_KEY
      ) ||
      "null"
    );

  }catch(e){

    return null;

  }

}


function clearSession(){

  localStorage.removeItem(
    SESSION_KEY
  );

}


function restoreSession(){

  const session=
    getSession();


  if(
    session &&
    session.loggedIn===true
  ){

    $("loginView")
      .classList
      .add("hidden");


    $("appView")
      .classList
      .remove("hidden");


    load();


    return true;

  }


  return false;

}


// ============================================================
// LOGIN
// ============================================================

$("loginBtn").onclick=()=>{

  const username=
    $("username")
      .value
      .trim();


  const password=
    $("password")
      .value;


  if(
    !username ||
    !password
  ){

    $("loginMsg")
      .textContent=
        "Kullanıcı adı ve şifre girin.";

    return;

  }


  $("loginMsg")
    .textContent="";


  saveSession(
    username
  );


  $("loginView")
    .classList
    .add("hidden");


  $("appView")
    .classList
    .remove("hidden");


  load();

};


// ============================================================
// LOGOUT
// ============================================================

$("logoutBtn").onclick=()=>{

  clearSession();


  $("appView")
    .classList
    .add("hidden");


  $("loginView")
    .classList
    .remove("hidden");


  $("password")
    .value="";

};


// ============================================================
// SESSION RESTORE
// ============================================================

restoreSession();


// ============================================================
// INITIAL LOAD
// ============================================================

async function load(){

  $("statGroups")
    .textContent=
      demo.groups.length;


  $("statPersonnel")
    .textContent=
      0;


  $("statPending")
    .textContent=
      0;


  $("statChanges")
    .textContent=
      0;


  try{

    const result=
      await post({
        action:
          "getApplicationLinkOptions"
      });


    if(
      result.groups &&
      result.groups.length
    ){

      demo.groups=
        result.groups.map(
          g=>({

            id:
              g.id,

            name:
              g.name,

            description:
              "",

            people:
              0,

            docs:
              0

          })
        );

    }

  }catch(error){

    console.error(
      "Backend grup okuma hatası:",
      error
    );

  }


  renderGroups();

  populateGroups();

  loadFormsForHR();

}


// ============================================================
// PAGE SWITCH
// ============================================================

function showPage(page){

  document
    .querySelectorAll(".page")
    .forEach(
      p=>
        p.classList
          .add("hidden")
    );


  const target=
    $(page);


  if(target){

    target
      .classList
      .remove("hidden");

  }


  document
    .querySelectorAll(".nav-item")
    .forEach(
      b=>
        b.classList.toggle(
          "active",
          b.dataset.page===page
        )
    );


  const titles={

    dashboard:
      "Dashboard",

    groups:
      "Personel Grupları",

    forms:
      "Form Tasarımı",

    links:
      "Başvuru Linkleri",

    personnel:
      "Personeller",

    logs:
      "İşlem Logları",

    settings:
      "Ayarlar"

  };


  if($("pageTitle")){

    $("pageTitle")
      .textContent=
        titles[page] ||
        page;

  }


  if(page==="groups"){

    renderGroups();

  }


  if(page==="forms"){

    renderBuilder();

    ensureFormsCatalogDom();

    loadFormsForHR();

  }


  if(page==="links"){

    renderLinks();

  }


  if(page==="personnel"){

    $("personnelTable")
      .innerHTML=
        '<div class="empty">'+
        'Backend bağlantısından sonra gerçek personel kayıtları burada gösterilecek.'+
        '</div>';

  }


  if(page==="settings"){
    renderSettings();
  }
}


// ============================================================
// SETTINGS
// ============================================================

function renderSettings(){
  const box = $("settings");
  if(!box) return;
  const currentUrl = getApiUrl();
  box.innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <div>
          <h3>Sistem & Google Apps Script Bağlantısı</h3>
          <p>Google Apps Script Web App dağıtım URL'sini yönetin ve test edin.</p>
        </div>
      </div>
      <div style="display:flex; flex-direction:column; gap:16px; max-width:800px; padding:12px 0;">
        <div>
          <label style="display:block; font-weight:600; margin-bottom:6px;">Google Apps Script Web App URL</label>
          <input type="text" id="settingsApiUrlInput" value="${esc(currentUrl)}" style="width:100%; padding:10px; border:1px solid #cbd5e1; border-radius:6px; font-family:monospace; font-size:13px;" />
          <small style="display:block; color:#64748b; margin-top:4px;">Google Apps Script'te "Yeni Dağıtım" oluşturduğunuzda verilen Web Uygulaması URL'si.</small>
        </div>
        <div style="display:flex; gap:10px; align-items:center;">
          <button type="button" class="primary" id="saveApiUrlBtn">URL'yi Kaydet</button>
          <button type="button" class="secondary" id="testApiUrlBtn">Bağlantıyı Test Et</button>
          <button type="button" class="secondary" id="resetApiUrlBtn">Varsayılana Dön</button>
        </div>
        <div id="settingsApiStatus" style="padding:12px; border-radius:6px; background:#f8fafc; border:1px solid #e2e8f0; font-size:14px;">
          <strong>Durum:</strong> <span id="statusText">Bağlantı kontrol edilmeye hazır.</span>
        </div>
      </div>
    </div>
  `;

  $("saveApiUrlBtn").onclick = () => {
    const val = ($("settingsApiUrlInput").value || "").trim();
    if(!val) {
      alert("Lütfen geçerli bir Web App URL girin.");
      return;
    }
    localStorage.setItem("sts_api_url", val);
    alert("Web App URL başarıyla kaydedildi! Sayfa yenileniyor...");
    location.reload();
  };

  $("resetApiUrlBtn").onclick = () => {
    localStorage.removeItem("sts_api_url");
    alert("Varsayılan URL'ye dönüldü. Sayfa yenileniyor...");
    location.reload();
  };

  $("testApiUrlBtn").onclick = async () => {
    const statusBox = $("settingsApiStatus");
    const statusText = $("statusText");
    statusText.innerHTML = '<span style="color:#0284c7">Bağlantı test ediliyor...</span>';
    try {
      const url = ($("settingsApiUrlInput").value || "").trim();
      const res = await fetch(`${url}?action=getApplicationLinkOptions`);
      const data = await res.json();
      if(data && (data.success || data.ok)) {
        statusBox.style.background = "#f0fdf4";
        statusBox.style.borderColor = "#86efac";
        statusText.innerHTML = '<span style="color:#16a34a; font-weight:600;">✓ Bağlantı Başarılı! Google Apps Script yanıt veriyor.</span>';
      } else {
        throw new Error(data.error || "Beklenmeyen yanıt formatı");
      }
    } catch(err) {
      statusBox.style.background = "#fef2f2";
      statusBox.style.borderColor = "#fca5a5";
      statusText.innerHTML = `<span style="color:#dc2626; font-weight:600;">✗ Bağlantı Hatası: ${esc(err.message)}</span>`;
    }
  };
}


// ============================================================
// GROUPS
// ============================================================

function renderGroups(){

  $("groupsTable")
    .innerHTML=
      '<table class="table">'+
      '<thead>'+
      '<tr>'+
      '<th>Grup</th>'+
      '<th>Açıklama</th>'+
      '<th>Personel</th>'+
      '<th>Belge</th>'+
      '<th>Durum</th>'+
      '</tr>'+
      '</thead>'+
      '<tbody>'+
      demo.groups
        .map(
          g=>
            `<tr>
              <td>
                <strong>
                  ${esc(g.name)}
                </strong>
              </td>

              <td>
                ${esc(g.description)}
              </td>

              <td>
                ${g.people}
              </td>

              <td>
                ${g.docs}
              </td>

              <td>
                <span class="pill ok">
                  Aktif
                </span>
              </td>
            </tr>`
        )
        .join("")+
      '</tbody>'+
      '</table>';

}


$("newGroupBtn").onclick=()=>{

  const n=
    prompt(
      "Grup adı:"
    );


  if(!n){

    return;

  }


  demo.groups.push({

    id:
      "GRP-"+Date.now(),

    name:
      n.toUpperCase(),

    description:
      "Yeni personel grubu",

    people:
      0,

    docs:
      0

  });


  load();

  showPage(
    "groups"
  );

};


// ============================================================
// FORM CATALOG DOM
// ============================================================

function ensureFormsCatalogDom(){

  const formsPage=
    $("forms");


  if(!formsPage){

    return;

  }


  let catalog=
    $("formsCatalog");


  if(catalog){

    return;

  }


  catalog=
    document.createElement(
      "div"
    );


  catalog.id=
    "formsCatalog";


  catalog.className=
    "panel";


  catalog.style.marginTop=
    "18px";


  catalog.innerHTML=`

    <div class="panel-head">

      <div>

        <h3>
          Oluşturulan Formlar
        </h3>

        <p>
          Kayıtlı formları görüntüleyin,
          düzenleyin veya pasifleştirin.
        </p>

      </div>

      <button
        type="button"
        class="secondary"
        id="refreshFormsBtn"
      >
        Yenile
      </button>

    </div>

    <div id="formsCatalogBody"></div>

  `;


  const actions=
    formsPage.querySelector(
      ".builder-actions"
    );


  if(actions){

    actions.insertAdjacentElement(
      "afterend",
      catalog
    );

  }else{

    const panel=
      formsPage.querySelector(
        ".panel"
      );

    if(panel){

      panel.appendChild(
        catalog
      );

    }

  }


  const refresh=
    $("refreshFormsBtn");


  if(refresh){

    refresh.onclick=
      loadFormsForHR;

  }

}


// ============================================================
// DATE
// ============================================================

function formatAdminDate(value){

  if(!value){

    return "—";

  }


  const d=
    new Date(value);


  if(
    Number.isNaN(
      d.getTime()
    )
  ){

    return esc(value);

  }


  return d.toLocaleString(
    "tr-TR"
  );

}


// ============================================================
// GROUP NAME
// ============================================================

function groupNameById(id){

  const g=
    demo.groups.find(
      x=>
        String(x.id)===
        String(id)
    );


  return g
    ? g.name
    : id || "—";

}


// ============================================================
// LOAD FORMS
// ============================================================

async function loadFormsForHR(){

  ensureFormsCatalogDom();


  const body=
    $("formsCatalogBody");


  if(!body){

    return;

  }


  body.innerHTML=
    '<div class="empty">'+
    'Formlar yükleniyor...'+
    '</div>';


  try{

    const result=
      await post({
        action:
          "getFormsForHR"
      });


    hrForms=
      Array.isArray(
        result.forms
      )
        ? result.forms
        : [];


    renderFormsCatalog();

  }catch(error){

    console.error(
      "Form listesi:",
      error
    );


    body.innerHTML=
      `<div class="empty">
        Formlar yüklenemedi:
        ${esc(error.message)}
      </div>`;

  }

}


// ============================================================
// RENDER FORM CATALOG
// ============================================================

function renderFormsCatalog(){
  const body = $("formsCatalogBody");
  if (!body) return;

  if (!hrForms || !hrForms.length) {
    body.innerHTML = '<div class="empty">Henüz kayıtlı form bulunmuyor. Sol üstteki form tasarımcısından yeni form oluşturabilirsiniz.</div>';
    return;
  }

  body.innerHTML = `
    <div style="overflow:auto">
      <table class="table">
        <thead>
          <tr>
            <th>Form</th>
            <th>Grup</th>
            <th>Versiyon</th>
            <th>Durum</th>
            <th>Oluşturulma</th>
            <th>İşlem</th>
          </tr>
        </thead>
        <tbody>
          ${hrForms.map(f => {
            const fId = f.form_id || f.id || f.groupId || f.group_id;
            const fName = f.form_name || f.formName || (f.group_id ? groupNameById(f.group_id) + " Formu" : "Personel Formu");
            const gId = f.group_id || f.groupId || "GRP-GENEL";
            const isInactive = String(f.status || "").toUpperCase() === "INACTIVE" || String(f.status || "").toUpperCase() === "PASIF";
            const active = !isInactive;

            return `
              <tr>
                <td>
                  <strong>${esc(fName)}</strong>
                  <small style="display:block; color:#64748b">${esc(fId)}</small>
                </td>
                <td>${esc(groupNameById(gId))}</td>
                <td>${esc(f.version || "1.0")}</td>
                <td>
                  ${active ? '<span class="pill ok">Aktif</span>' : '<span class="pill warn">Pasif</span>'}
                </td>
                <td>${formatAdminDate(f.created_at || f.createdAt || new Date())}</td>
                <td>
                  <div style="display:flex; gap:6px; flex-wrap:wrap">
                    <button type="button" class="secondary form-edit-btn" data-id="${esc(fId)}" data-group="${esc(gId)}">
                      Düzenle
                    </button>
                    <button type="button" class="secondary form-status-btn" data-id="${esc(fId)}" data-status="${active ? "ACTIVE" : "INACTIVE"}">
                      ${active ? "Pasifleştir" : "Aktifleştir"}
                    </button>
                    <button type="button" class="secondary form-delete-btn" data-id="${esc(fId)}" data-group="${esc(gId)}" style="color:#b91c1c">
                      Sil
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;

  document.querySelectorAll(".form-edit-btn").forEach(b => {
    b.onclick = () => editForm(b.dataset.id, b.dataset.group);
  });

  document.querySelectorAll(".form-status-btn").forEach(b => {
    b.onclick = () => toggleFormStatus(b.dataset.id, b.dataset.status);
  });

  document.querySelectorAll(".form-delete-btn").forEach(b => {
    b.onclick = () => deleteForm(b.dataset.id, b.dataset.group);
  });
}

// ============================================================
// EDIT FORM
// ============================================================

async function editForm(formId, groupId){
  try {
    let form = null;
    let fields = [];

    try {
      const result = await post({
        action: "getFormDefinitionForHR",
        form_id: formId,
        group_id: groupId
      });
      if (result && (result.success || result.ok)) {
        form = result.form || result.data;
        fields = result.fields || (result.form ? result.form.fields : []) || [];
      }
    } catch (e) {
      console.warn("Backend getFormDefinitionForHR hatası, yerelden aranıyor:", e);
    }

    if (!form) {
      form = hrForms.find(f => (f.form_id === formId || f.id === formId || f.group_id === groupId || f.groupId === groupId));
      if (form && form.fields) fields = form.fields;
    }

    if (!form) {
      const formsMap = JSON.parse(localStorage.getItem("sts_forms") || "{}");
      form = formsMap[formId] || formsMap[groupId] || Object.values(formsMap).find(f => f.id === formId || f.form_id === formId);
      if (form && form.fields) fields = form.fields;
    }

    if (!form) {
      form = {
        form_id: formId,
        group_id: groupId || "GRP-FORMEN",
        form_name: "Personel Formu",
        version: "1.0"
      };
    }

    editingFormId = form.form_id || form.id || formId;

    ensureFormBuilderDom();
    populateGroups();

    if ($("formGroup")) $("formGroup").value = form.group_id || form.groupId || groupId || "";
    if ($("formName")) $("formName").value = form.form_name || form.formName || "";
    if ($("formVersion")) $("formVersion").value = form.version || "1.0";

    demo.fields = (fields || []).map((f, idx) => ({
      id: f.id || f.field_id || ("fld_" + (idx + 1)),
      type: f.type || "text",
      label: f.label || defaultLabels[f.type] || "Alan",
      code: f.code || "",
      required: f.required === true,
      helpText: f.helpText || "",
      placeholder: f.placeholder || "",
      fileTypes: Array.isArray(f.fileTypes) ? f.fileTypes : (Array.isArray(f.accept) ? f.accept : []),
      maxMB: f.maxMB !== null && f.maxMB !== undefined && f.maxMB !== "" ? Number(f.maxMB) : 10,
      replaceAllowed: f.replaceAllowed !== false,
      hrApproval: f.hrApproval === true,
      cameraAllowed: f.cameraAllowed !== false,
      galleryAllowed: f.galleryAllowed !== false,
      options: Array.isArray(f.options) ? f.options : []
    }));

    selectedField = demo.fields[0]?.id || null;
    renderBuilder();
    updateFormEditorMode();

    $("forms")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    alert("Form yüklenemedi:\n" + error.message);
  }
}


// ============================================================
// EDITOR MODE
// ============================================================

function updateFormEditorMode(){

  const btn=
    $("saveFormBtn");


  if(btn){

    btn.textContent=
      editingFormId
        ? "Formu Güncelle"
        : "Formu Kaydet";

  }


  let cancel=
    $("cancelFormEditBtn");


  if(editingFormId){

    if(!cancel){

      cancel=
        document.createElement(
          "button"
        );


      cancel.type=
        "button";


      cancel.id=
        "cancelFormEditBtn";


      cancel.className=
        "secondary";


      cancel.textContent=
        "Düzenlemeyi İptal Et";


      cancel.onclick=
        cancelFormEdit;


      const parent=
        $("saveFormBtn")
          ?.parentElement;


      if(parent){

        parent.appendChild(
          cancel
        );

      }

    }


    cancel.style.display=
      "";

  }else if(cancel){

    cancel.style.display=
      "none";

  }

}


// ============================================================
// CANCEL EDIT
// ============================================================

function cancelFormEdit(){

  editingFormId=
    null;


  selectedField=
    null;


  demo.fields=[];


  ensureFormBuilderDom();


  $("formName")
    .value=
      "Personel Başvuru Formu";


  $("formVersion")
    .value=
      "1.0";


  renderBuilder();


  updateFormEditorMode();

}


// ============================================================
// FORM STATUS
// ============================================================

async function toggleFormStatus(
  formId,
  currentStatus
){

  const newStatus=
    String(
      currentStatus
    )
    .toUpperCase()
    ===
    "ACTIVE"

      ?

      "INACTIVE"

      :

      "ACTIVE";


  if(
    !confirm(
      newStatus==="INACTIVE"

        ?

        "Bu form pasifleştirilsin mi?"

        :

        "Bu form yeniden aktifleştirilsin mi?"
    )
  ){

    return;

  }


  try{

    await post({

      action:
        "setFormStatusForHR",

      form_id:
        formId,

      status:
        newStatus

    });


    await loadFormsForHR();


  }catch(error){

    alert(
      "Form durumu değiştirilemedi:\n"+
      error.message
    );

  }

}


// ============================================================
// DELETE FORM
// ============================================================

async function deleteForm(
  formId
){

  if(
    !confirm(
      "Bu form silinsin mi?\n\n"+
      "Formun başvuru linki veya geçmiş başvurularda kullanılması halinde backend fiziksel silmeyi güvenlik nedeniyle engeller."
    )
  ){

    return;

  }


  try{

    await post({

      action:
        "deleteFormForHR",

      form_id:
        formId

    });


    if(
      editingFormId===
      formId
    ){

      cancelFormEdit();

    }


    await loadFormsForHR();


  }catch(error){

    alert(
      "Form silinemedi:\n"+
      error.message
    );

  }

}


// ============================================================
// FORM BUILDER DOM
// ============================================================

function ensureFormBuilderDom(){

  const formsPage=
    $("forms");


  if(!formsPage){

    return false;

  }


  let top=
    formsPage.querySelector(
      ".builder-top"
    );


  const builder=
    formsPage.querySelector(
      ".builder"
    );


  if(
    !top &&
    builder
  ){

    top=
      document.createElement(
        "div"
      );


    top.className=
      "builder-top";


    builder.parentNode
      .insertBefore(
        top,
        builder
      );

  }


  if(top){
    if(!$("formGroup")){
      const label=document.createElement("label");
      label.id="lblFormGroup";
      label.innerHTML='<span class="lbl-txt">Grup</span><select id="formGroup"></select>';
      top.appendChild(label);
    }
    if(!$("formName")){
      const label=document.createElement("label");
      label.id="lblFormName";
      label.innerHTML='<span class="lbl-txt">Form Adı</span><input id="formName" value="Personel Başvuru Formu">';
      top.appendChild(label);
    }
    if(!$("formVersion")){
      const label=document.createElement("label");
      label.id="lblFormVersion";
      label.innerHTML='<span class="lbl-txt">Versiyon</span><input id="formVersion" value="1.0">';
      top.appendChild(label);
    }
  }


  return !!(
    $("formGroup") &&
    $("formName") &&
    $("formVersion")
  );

}


// ============================================================
// GROUP SELECT
// ============================================================

function populateGroups(){

  if(
    !ensureFormBuilderDom()
  ){

    return;

  }


  const el=
    $("formGroup");


  el.innerHTML=
    demo.groups
      .map(
        g=>
          `<option value="${esc(g.id)}">
            ${esc(g.name)}
          </option>`
      )
      .join("");

}


// ============================================================
// ADD FORM FIELD
// ============================================================

function addFormField(
  type
){

  if(
    !type ||
    !defaultLabels[type]
  ){

    console.error(
      "Geçersiz form alanı tipi:",
      type
    );

    return;

  }


  const f={

    id:
      "FLD-"+
      Date.now()+
      "-"+
      Math.random()
        .toString(16)
        .slice(2),

    type:
      type,

    label:
      defaultLabels[type],

    required:
      false,

    helpText:
      "",

    placeholder:
      "",

    fileTypes:

      type==="document"

        ?

        ["PDF"]

        :

        type==="photo"

          ?

          ["JPG","JPEG","PNG"]

          :

          [],

    maxMB:

      type==="document" ||
      type==="photo"

        ?

        10

        :

        null,

    replaceAllowed:
      true,

    hrApproval:
      false,

    cameraAllowed:
      type==="photo",

    galleryAllowed:
      type==="photo",

    options:

      type==="select"

        ?

        [
          "Seçenek 1",
          "Seçenek 2"
        ]

        :

        [],

    code:

      type==="document" ||
      type==="photo"

        ?

        type.toUpperCase()

        :

        ""

  };


  demo.fields.push(
    f
  );


  selectedField=
    f.id;


  renderBuilder();

}


// ============================================================
// PALETTE EVENT DELEGATION
// ============================================================

document.addEventListener(
  "click",
  function(e){

    const paletteButton=
      e.target.closest(
        ".palette button[data-type]"
      );


    if(!paletteButton){

      return;

    }


    e.preventDefault();

    e.stopPropagation();


    addFormField(
      paletteButton.getAttribute(
        "data-type"
      )
    );

  }
);


// ============================================================
// RENDER BUILDER
// ============================================================

function renderBuilder(){

  if(
    !ensureFormBuilderDom()
  ){

    console.error(
      "FORM BUILDER: gerekli DOM elemanları bulunamadı."
    );

    return;

  }


  populateGroups();


  if($("canvasTitle")){

    $("canvasTitle")
      .textContent=
        $("formName")
          .value ||
        "Personel Başvuru Formu";

  }


  if($("emptyFields")){

    $("emptyFields")
      .classList
      .toggle(
        "hidden",
        demo.fields.length>0
      );

  }


  if($("fieldList")){

    $("fieldList")
      .innerHTML=
        demo.fields
          .map(
            f=>
              `
              <div
                class="field-row ${
                  selectedField===f.id
                    ? "selected"
                    : ""
                }"
                data-id="${esc(f.id)}"
              >

                <span>
                  ☰
                </span>

                <div class="field-main">

                  <strong>
                    ${esc(f.label)}
                  </strong>

                  <small>

                    ${typeNames[f.type]}

                    ${
                      f.required
                        ? " • Zorunlu"
                        : ""
                    }

                    ${
                      f.type==="document" &&
                      f.fileTypes?.length
                        ? " • "+
                          f.fileTypes.join(", ")
                        : ""
                    }

                  </small>

                </div>

                <button
                  class="remove"
                  data-remove="${esc(f.id)}"
                >
                  Sil
                </button>

              </div>
              `
          )
          .join("");

  }


  renderProperties();

}


// ============================================================
// FIELD SELECTION / REMOVE
// ============================================================

document.addEventListener(
  "click",
  function(e){

    const removeButton=
      e.target.closest(
        "#fieldList [data-remove]"
      );


    if(removeButton){

      e.preventDefault();

      e.stopPropagation();


      const id=
        removeButton.getAttribute(
          "data-remove"
        );


      demo.fields=
        demo.fields.filter(
          f=>
            f.id!==id
        );


      selectedField=
        null;


      renderBuilder();

      return;

    }


    const row=
      e.target.closest(
        "#fieldList .field-row"
      );


    if(row){

      selectedField=
        row.getAttribute(
          "data-id"
        );


      renderBuilder();

    }

  }
);


// ============================================================
// FIELD PROPERTIES
// ============================================================

function renderProperties(){

  const f=
    demo.fields.find(
      x=>
        x.id===
        selectedField
    );


  if(!f){

    $("propertiesBody")
      .innerHTML=
        '<div class="empty">'+
        'Düzenlemek için bir alan seçin.'+
        '</div>';

    return;

  }


  let html=`

    <div class="property">

      <label>
        Alan Tipi
      </label>

      <input
        value="${esc(typeNames[f.type])}"
        disabled
      >

    </div>


    <div class="property">

      <label>
        Etiket
      </label>

      <input
        id="propLabel"
        value="${esc(f.label)}"
      >

    </div>


    <div class="property">

      <label>
        Yardım / Açıklama Metni
      </label>

      <input
        id="propHelp"
        value="${esc(f.helpText||"")}"
        placeholder="Personelin göreceği açıklama"
      >

    </div>


    <div class="property">

      <label>
        Yer Tutucu Metin
      </label>

      <input
        id="propPlaceholder"
        value="${esc(f.placeholder||"")}"
        placeholder="Örn. Adınızı girin"
      >

    </div>


    <div class="property check">

      <input
        id="propReq"
        type="checkbox"
        ${f.required?"checked":""}
      >

      <label for="propReq">
        Zorunlu alan
      </label>

    </div>

  `;


  if(
    f.type==="document"
  ){

    html+=`

      <div class="property">

        <label>
          Belge Kodu
        </label>

        <input
          id="propCode"
          value="${esc(
            f.code ||
            "BELGE"
          )}"
        >

      </div>


      <div class="property">

        <label>
          İzin Verilen Dosya Türleri
        </label>

        <div class="checks">

          ${
            [
              "PDF",
              "JPG",
              "JPEG",
              "PNG"
            ]
            .map(
              t=>
                `
                <label class="check">

                  <input
                    class="fileTypeCheck"
                    type="checkbox"
                    value="${t}"
                    ${
                      f.fileTypes.includes(t)
                        ? "checked"
                        : ""
                    }
                  >

                  ${t}

                </label>
                `
            )
            .join("")
          }

        </div>

      </div>


      <div class="property">

        <label>
          Maksimum Dosya Boyutu (MB)
        </label>

        <input
          id="propMax"
          type="number"
          min="1"
          max="50"
          value="${f.maxMB||10}"
        >

      </div>


      <div class="property check">

        <input
          id="propReplace"
          type="checkbox"
          ${
            f.replaceAllowed!==false
              ? "checked"
              : ""
          }
        >

        <label for="propReplace">
          Personel sonradan değiştirebilir
        </label>

      </div>


      <div class="property check">

        <input
          id="propApproval"
          type="checkbox"
          ${
            f.hrApproval
              ? "checked"
              : ""
          }
        >

        <label for="propApproval">
          Değişiklikte HR onayı gerekli
        </label>

      </div>

    `;

  }


  if(
    f.type==="photo"
  ){

    html+=`

      <div class="property">

        <label>
          İzin Verilen Dosya Türleri
        </label>

        <div class="checks">

          ${
            [
              "JPG",
              "JPEG",
              "PNG"
            ]
            .map(
              t=>
                `
                <label class="check">

                  <input
                    class="fileTypeCheck"
                    type="checkbox"
                    value="${t}"
                    ${
                      f.fileTypes.includes(t)
                        ? "checked"
                        : ""
                    }
                  >

                  ${t}

                </label>
                `
            )
            .join("")
          }

        </div>

      </div>


      <div class="property">

        <label>
          Maksimum Dosya Boyutu (MB)
        </label>

        <input
          id="propMax"
          type="number"
          min="1"
          max="20"
          value="${f.maxMB||10}"
        >

      </div>


      <div class="property check">

        <input
          id="propCamera"
          type="checkbox"
          ${
            f.cameraAllowed!==false
              ? "checked"
              : ""
          }
        >

        <label for="propCamera">
          Kameradan çekmeye izin ver
        </label>

      </div>


      <div class="property check">

        <input
          id="propGallery"
          type="checkbox"
          ${
            f.galleryAllowed!==false
              ? "checked"
              : ""
          }
        >

        <label for="propGallery">
          Galeriden/dosyadan seçmeye izin ver
        </label>

      </div>


      <div class="property check">

        <input
          id="propReplace"
          type="checkbox"
          ${
            f.replaceAllowed!==false
              ? "checked"
              : ""
          }
        >

        <label for="propReplace">
          Personel sonradan değiştirebilir
        </label>

      </div>


      <div class="property check">

        <input
          id="propApproval"
          type="checkbox"
          ${
            f.hrApproval
              ? "checked"
              : ""
          }
        >

        <label for="propApproval">
          Değişiklikte HR onayı gerekli
        </label>

      </div>

    `;

  }


  if(
    f.type==="select"
  ){

    html+=`

      <div class="property">

        <label>
          Seçenekler
        </label>

        <textarea
          id="propOptions"
          rows="5"
          placeholder="Her satıra bir seçenek"
        >${esc(
          (f.options||[])
            .join("\n")
        )}</textarea>

        <small>
          Örneğin: Formen, Mühendis, İşçi
        </small>

      </div>

    `;

  }


  $("propertiesBody")
    .innerHTML=
      html;


  $("propLabel").oninput=
    e=>{

      f.label=
        e.target.value;


      const row=
        document.querySelector(
          '#fieldList .field-row[data-id="'+
          CSS.escape(f.id)+
          '"]'
        );


      if(row){

        const title=
          row.querySelector(
            ".field-main strong"
          );


        if(title){

          title.textContent=
            f.label ||
            defaultLabels[
              f.type
            ];

        }

      }

    };


  $("propHelp").oninput=
    e=>
      f.helpText=
        e.target.value;


  $("propPlaceholder").oninput=
    e=>
      f.placeholder=
        e.target.value;


  $("propReq").onchange=
    e=>{

      f.required=
        e.target.checked;


      renderBuilder();

    };


  document
    .querySelectorAll(
      ".fileTypeCheck"
    )
    .forEach(
      c=>
        c.onchange=
          ()=>{

            f.fileTypes=
              [
                ...document
                  .querySelectorAll(
                    ".fileTypeCheck:checked"
                  )
              ]
              .map(
                x=>
                  x.value
              );


            renderBuilder();

          }
    );


  if($("propCode")){

    $("propCode").oninput=
      e=>
        f.code=
          e.target.value;

  }


  if($("propMax")){

    $("propMax").oninput=
      e=>{

        f.maxMB=
          Math.max(
            1,
            Math.min(
              Number(
                e.target.value
              ) ||
              10,
              50
            )
          );

      };

  }


  if($("propReplace")){

    $("propReplace").onchange=
      e=>
        f.replaceAllowed=
          e.target.checked;

  }


  if($("propApproval")){

    $("propApproval").onchange=
      e=>
        f.hrApproval=
          e.target.checked;

  }


  if($("propCamera")){

    $("propCamera").onchange=
      e=>
        f.cameraAllowed=
          e.target.checked;

  }


  if($("propGallery")){

    $("propGallery").onchange=
      e=>
        f.galleryAllowed=
          e.target.checked;

  }


  if($("propOptions")){

    $("propOptions").oninput=
      e=>
        f.options=
          e.target.value
            .split("\n")
            .map(
              x=>
                x.trim()
            )
            .filter(
              Boolean
            );

  }

}


// ============================================================
// FORM NAME / VERSION
// ============================================================

ensureFormBuilderDom();

ensureFormsCatalogDom();

updateFormEditorMode();


if($("formName")){

  $("formName").oninput=
    ()=>{

      if($("canvasTitle")){

        $("canvasTitle")
          .textContent=
            $("formName")
              .value ||
            "Personel Başvuru Formu";

      }

    };

}


// ============================================================
// SAVE / UPDATE FORM
// ============================================================

if($("saveFormBtn")){

  $("saveFormBtn").onclick=
    async()=>{

      ensureFormBuilderDom();


      const formName=
        String(
          $("formName")
            ?.value ||
          ""
        )
        .trim();


      const groupId=
        String(
          $("formGroup")
            ?.value ||
          ""
        )
        .trim();


      const version=
        String(
          $("formVersion")
            ?.value ||
          "1.0"
        )
        .trim() ||
        "1.0";


      if(!formName){

        alert(
          "Form adı zorunludur."
        );

        $("formName")
          .focus();

        return;

      }


      if(!groupId){

        alert(
          "Personel grubu seçilmelidir."
        );

        return;

      }


      if(
        !demo.fields.length
      ){

        alert(
          "Önce en az bir alan ekleyin."
        );

        return;

      }


      const fields=
        demo.fields.map(
          f=>({

            field_id:
              f.id,

            type:
              f.type,

            label:
              String(
                f.label ||
                ""
              ).trim(),

            code:
              String(
                f.code ||
                ""
              )
              .trim()
              .toUpperCase(),

            required:
              f.required===true,

            helpText:
              String(
                f.helpText ||
                ""
              ).trim(),

            placeholder:
              String(
                f.placeholder ||
                ""
              ).trim(),

            fileTypes:
              Array.isArray(
                f.fileTypes
              )
                ? f.fileTypes
                : [],

            maxMB:
              f.maxMB ||
              null,

            replaceAllowed:
              f.replaceAllowed !==
              false,

            hrApproval:
              f.hrApproval===
              true,

            cameraAllowed:
              f.cameraAllowed !==
              false,

            galleryAllowed:
              f.galleryAllowed !==
              false,

            options:
              Array.isArray(
                f.options
              )
                ? f.options
                : []

          })
        );


      const invalid=
        fields.some(
          f=>
            !f.label
        );


      if(invalid){

        alert(
          "Tüm alanların etiketi doldurulmalıdır."
        );

        return;

      }


      const button=
        $("saveFormBtn");


      const originalText=
        button.textContent;


      button.disabled=
        true;


      button.textContent=
        editingFormId
          ? "Güncelleniyor..."
          : "Kaydediliyor...";


      try{

        const result=
          await post(

            editingFormId

              ?

              {

                action:
                  "updateFormForHR",

                form_id:
                  editingFormId,

                group_id:
                  groupId,

                form_name:
                  formName,

                version:
                  version,

                fields:
                  fields

              }

              :

              {

                action:
                  "createForm",

                group_id:
                  groupId,

                form_name:
                  formName,

                version:
                  version,

                created_by:
                  "HR",

                fields:
                  fields

              }

          );


        alert(

          editingFormId

            ?

            "Form başarıyla güncellendi."

            :

            "Form başarıyla oluşturuldu.\n\n"+
            "Form ID: "+
            result.form_id

        );


        editingFormId=
          null;


        demo.fields=[];

        selectedField=
          null;


        $("formName")
          .value=
            "Personel Başvuru Formu";


        $("formVersion")
          .value=
            "1.0";


        renderBuilder();

        updateFormEditorMode();

        await loadFormsForHR();


      }catch(error){

        console.error(
          error
        );


        alert(
          "Form işlemi başarısız:\n"+
          error.message
        );

      }finally{

        button.disabled=
          false;


        button.textContent=
          originalText;

      }

    };

}


// ============================================================
// PREVIEW
// ============================================================

if($("previewBtn")){

  $("previewBtn").onclick=
    ()=>{

      alert(
        "Önizleme motorunu gerçek personel formuna bağlayacağımız sonraki aşamada bu form tanımı kullanılacaktır."
      );

    };

}


// ============================================================
// LINK MANAGEMENT DELEGATION
// ============================================================
//
// Başvuru linklerinin yönetimi links-vnext.js tarafından yapılmaktadır.
// ============================================================

function renderLinks() {
  if (typeof window.injectLinksVNext === "function") {
    window.injectLinksVNext();
  }
}



// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  function(){

    try{

      ensureFormBuilderDom();

      ensureFormsCatalogDom();

      updateFormEditorMode();

      populateGroups();

      renderBuilder();

    }catch(error){

      console.error(
        "STS HR initialization error:",
        error
      );

    }

  }
);
