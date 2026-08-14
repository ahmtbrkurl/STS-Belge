/*
 * Demo frontend.
 * For production, set API_URL to the deployed Google Apps Script Web App URL.
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
    {id:"identityDoc", type:"document", code:"KIMLIK", label:"Kimlik Belgesi", required:true, accept:["image/*","application/pdf"], maxMB:10},
    {id:"passportDoc", type:"document", code:"PASAPORT", label:"Pasaport", required:false, accept:["application/pdf","image/*"], maxMB:10},
    {id:"myk", type:"document", code:"MYK", label:"MYK Belgesi", required:true, accept:["application/pdf","image/*"], maxMB:10},
    {id:"photo", type:"photo", code:"FOTOGRAF", label:"Vesikalık Fotoğraf", required:true, accept:["image/*"], maxMB:5}
  ]
};

let state = {token:null, form:demoForm, page:0, values:{}, files:{}, submitting:false};

function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}

document.getElementById("startBtn").addEventListener("click", async ()=>{
  state.token = document.getElementById("tokenInput").value.trim() || "DEMO-FORMEN";
  // In production: fetchFormDefinition(state.token)
  renderForm();
});
// --------------------------------------------------
// PERSONEL YÖNETİM LİNKİNİ OTOMATİK ALGILA
// --------------------------------------------------

async function checkManageLink(){

  const params = new URLSearchParams(
    window.location.search
  );

  const manageToken =
    params.get("manage");

  // manage parametresi yoksa normal başvuru ekranı devam eder
  if(!manageToken){
    return;
  }

  try {

    // Normal giriş ekranını gizle
    document.getElementById("landing")
      ?.classList.add("hidden");

    // Yükleniyor ekranı
    const view =
      document.getElementById("formView");

    view.classList.remove("hidden");

    view.innerHTML = `
      <div class="card">
        <div style="
          text-align:center;
          padding:40px 20px;
        ">

          <div style="
            width:60px;
            height:60px;
            margin:0 auto 20px;
            border:6px solid #e5e7eb;
            border-top-color:#2563eb;
            border-radius:50%;
            animation:spin 1s linear infinite;
          "></div>

          <h2>Personel kaydı yükleniyor</h2>

          <p style="
            color:#6b7280;
            margin-top:10px;
          ">
            Lütfen bekleyiniz...
          </p>

        </div>
      </div>
    `;

    const result =
      await apiPost({

        action:
          "getPersonnelByManageToken",

        manage_token:
          manageToken

      });


    if(!result.success){

      throw new Error(
        result.error ||
        "Personel kaydı bulunamadı."
      );

    }


    renderManagePage(
      result.personnel,
      result.documents || []
    );


  }
  catch(error){

    console.error(
      "Manage link hatası:",
      error
    );

    const view =
      document.getElementById("formView");

    view.classList.remove("hidden");

    view.innerHTML = `
      <div class="card">

        <h2>Personel kaydı bulunamadı</h2>

        <p style="
          color:#dc2626;
          margin-top:15px;
        ">
          ${esc(error.message)}
        </p>

        <div style="
          margin-top:25px;
        ">
          <button
            class="primary"
            onclick="window.location.href=window.location.pathname"
          >
            Yeni Başvuru
          </button>
        </div>

      </div>
    `;

  }

}


// --------------------------------------------------
// PERSONEL YÖNETİM EKRANI
// Eski belgeler kullanıcıya gösterilmez.
// Yeni belge yüklenirse backend V1/V2/V3... olarak saklar.
// --------------------------------------------------

function renderManagePage(personnel, documents){

  const view = document.getElementById("formView");

  view.classList.remove("hidden");

  const documentTypes = [
    {
      code: "KIMLIK",
      label: "Kimlik Belgesi",
      accept: "image/*,application/pdf",
      maxMB: 10
    },
    {
      code: "PASAPORT",
      label: "Pasaport",
      accept: "application/pdf,image/*",
      maxMB: 10
    },
    {
      code: "MYK",
      label: "MYK Belgesi",
      accept: "application/pdf,image/*",
      maxMB: 10
    },
    {
      code: "FOTOGRAF",
      label: "Vesikalık Fotoğraf",
      accept: "image/*",
      maxMB: 5
    }
  ];

  view.innerHTML = `

    <div class="card">

      <div class="step">
        PERSONEL YÖNETİMİ
      </div>

      <h2>
        Personel Bilgileri
      </h2>

      <div style="
        margin-top:20px;
        padding:20px;
        background:#f8fafc;
        border-radius:12px;
      ">

        <div style="
          display:grid;
          grid-template-columns:
            repeat(auto-fit,minmax(220px,1fr));
          gap:15px;
        ">

          <div>
            <strong>Personel No</strong>
            <div>
              ${esc(personnel.personnel_id || "")}
            </div>
          </div>

          <div>
            <strong>Ad</strong>
            <div>
              ${esc(personnel.first_name || "")}
            </div>
          </div>

          <div>
            <strong>Soyad</strong>
            <div>
              ${esc(personnel.last_name || "")}
            </div>
          </div>

          <div>
            <strong>T.C. Kimlik No</strong>
            <div>
              ${esc(personnel.national_id || "")}
            </div>
          </div>

          <div>
            <strong>Telefon</strong>
            <div>
              ${esc(personnel.phone || "")}
            </div>
          </div>

          <div>
            <strong>Durum</strong>

            <div style="
              color:#16a34a;
              font-weight:600;
            ">
              ${esc(personnel.status || "ACTIVE")}
            </div>

          </div>

        </div>

      </div>


      <h3 style="
        margin-top:30px;
        margin-bottom:15px;
      ">
        Belge Güncelleme
      </h3>


      <div style="
        color:#6b7280;
        font-size:14px;
        margin-bottom:20px;
      ">
        Yeni belge yüklediğinizde mevcut belge silinmez.
        Sistem yeni belgeyi otomatik olarak yeni bir versiyon
        olarak kaydeder.
      </div>


      <div id="manageDocumentList">

        ${documentTypes.map(doc => `

          <div style="
            padding:18px;
            margin-bottom:12px;
            border:1px solid #e5e7eb;
            border-radius:12px;
            background:#f9fafb;
          ">

            <div style="
              display:flex;
              justify-content:space-between;
              align-items:center;
              gap:15px;
              flex-wrap:wrap;
            ">

              <div>

                <strong style="
                  display:block;
                  font-size:16px;
                ">
                  ${esc(doc.label)}
                </strong>

                <div style="
                  margin-top:5px;
                  color:#6b7280;
                  font-size:13px;
                ">
                  Yeni belge yüklemek için dosyayı seçiniz.
                </div>

              </div>


              <label
                for="manageFile_${esc(doc.code)}"
                class="primary"
                style="
                  display:inline-block;
                  cursor:pointer;
                  padding:10px 16px;
                  border-radius:8px;
                  color:#ffffff;
                  background:#2563eb;
                  text-decoration:none;
                "
              >
                Yeni Belge Yükle
              </label>

              <input
                id="manageFile_${esc(doc.code)}"
                type="file"
                accept="${esc(doc.accept)}"
                style="display:none;"
              >

            </div>


            <div
              id="manageStatus_${esc(doc.code)}"
              style="
                margin-top:10px;
                font-size:13px;
                color:#6b7280;
              "
            >
              Henüz yeni belge seçilmedi.
            </div>

          </div>

        `).join("")}

      </div>


      <div style="
        margin-top:30px;
        padding:16px;
        background:#eff6ff;
        border-radius:10px;
        color:#1e40af;
      ">

        <strong>
          Bilgi
        </strong>

        <div style="
          margin-top:6px;
          line-height:1.5;
        ">
          Bu bağlantı size özel personel yönetim
          bağlantınızdır.
          Eski belgeler sistemde saklanır ve silinmez.
          Yeni yüklenen belgeler yeni versiyon olarak kaydedilir.
        </div>

      </div>


    </div>

  `;


  // --------------------------------------------------
  // DOSYA SEÇİMİ
  // --------------------------------------------------

  documentTypes.forEach(doc => {

    const input =
      document.getElementById(
        "manageFile_" + doc.code
      );

    if(!input){
      return;
    }


    input.addEventListener("change", async event => {

      const file =
        event.target.files[0];

      if(!file){
        return;
      }


      // Dosya boyutu
      if(
        file.size >
        doc.maxMB * 1024 * 1024
      ){

        alert(
          "Dosya " +
          doc.maxMB +
          " MB sınırını aşamaz."
        );

        event.target.value = "";

        return;
      }


      const status =
        document.getElementById(
          "manageStatus_" + doc.code
        );


      if(status){

        status.textContent =
          "Belge yükleniyor...";

        status.style.color =
          "#2563eb";

      }


      try{

        await uploadManageDocument(
          personnel.personnel_id,
          doc.code,
          file
        );


        if(status){

          status.textContent =
            "Belge başarıyla yüklendi. Eski belge korunmuştur.";

          status.style.color =
            "#16a34a";

        }


        // Aynı dosyayı tekrar seçebilmek için
        event.target.value = "";

      }
      catch(error){

        console.error(
          "Belge yükleme hatası:",
          error
        );


        if(status){

          status.textContent =
            "Yükleme başarısız.";

          status.style.color =
            "#dc2626";

        }


        alert(
          "Belge yüklenirken hata oluştu:\n\n" +
          error.message
        );

        event.target.value = "";

      }

    });

  });

}
// --------------------------------------------------
// YÖNETİM EKRANINDAN BELGE YÜKLE
// --------------------------------------------------

async function uploadManageDocument(
  personnelId,
  documentCode,
  file
){

  if(!personnelId){
    throw new Error(
      "Personel numarası bulunamadı."
    );
  }


  if(!documentCode){
    throw new Error(
      "Belge kodu bulunamadı."
    );
  }


  if(!file){
    throw new Error(
      "Dosya seçilmedi."
    );
  }


  // ------------------------------------------------
  // DOSYAYI BASE64'E ÇEVİR
  // ------------------------------------------------

  const base64 =
    await fileToBase64(file);


  // ------------------------------------------------
  // GOOGLE APPS SCRIPT'E GÖNDER
  // ------------------------------------------------

  const result =
    await apiPost({

      action:
        "uploadDocument",

      personnel_id:
        personnelId,

      document_code:
        documentCode,

      file_name:
        file.name,

      mime_type:
        file.type,

      file_base64:
        base64

    });


  if(!result || !result.success){

    throw new Error(
      result?.error ||
      "Belge yüklenemedi."
    );

  }


  return result;

}
function renderForm(){
  document.getElementById("landing").classList.add("hidden");
  const view=document.getElementById("formView");
  view.classList.remove("hidden");
  const perPage=3;
  const pages=Math.ceil(state.form.fields.length/perPage);
  const start=state.page*perPage;
  const fields=state.form.fields.slice(start,start+perPage);

  view.innerHTML=`<div class="card">
    <div class="step">Adım ${state.page+1} / ${pages}</div>
    <h2>${esc(state.form.title)}</h2>
    <div class="preview"><strong>Grup:</strong> ${esc(state.form.group)} &nbsp; <strong>Form:</strong> v${esc(state.form.version)}</div>
    ${fields.map(renderField).join("")}
    <div class="actions">
      ${state.page>0?'<button class="secondary" id="prevBtn">Geri</button>':'<span></span>'}
      ${state.page<pages-1?'<button class="primary" id="nextBtn">Devam</button>':'<button class="primary" id="finishBtn">Başvuruyu Tamamla</button>'}
    </div>
  </div>`;

  fields.forEach(f=>{
    const el=document.getElementById("field_"+f.id);
    if(!el) return;
    if(f.type==="document"||f.type==="photo"){
      el.addEventListener("change",e=>{
        const file=e.target.files[0];
        if(file){
          if(file.size>f.maxMB*1024*1024){alert(`Dosya ${f.maxMB} MB sınırını aşamaz.`); e.target.value=""; return;}
          state.files[f.id]=file;
          const name=document.getElementById("name_"+f.id);
          if(name) name.textContent=file.name;
        }
      });
    }else{
      el.addEventListener("input",e=>state.values[f.id]=e.target.value);
    }
  });
  document.getElementById("nextBtn")?.addEventListener("click",()=>{if(validate(fields)){state.page++;renderForm();}});
  document.getElementById("prevBtn")?.addEventListener("click",()=>{state.page--;renderForm();});
  document.getElementById("finishBtn")?.addEventListener("click",async()=>{if(validate(fields)) await submitApplication();});
}

function renderField(f){
  const req=f.required?'<span class="required">*</span>':"";
  if(f.type==="document"||f.type==="photo"){
    return `<div class="field">
      <label>${esc(f.label)} ${req}</label>
      <div class="upload">
        <input id="field_${f.id}" type="file" accept="${esc((f.accept||[]).join(","))}">
        <div id="name_${f.id}" class="file-name">${state.files[f.id]?esc(state.files[f.id].name):"Dosya seçilmedi"}</div>
      </div>
    </div>`;
  }
  const type=f.type==="national_id"||f.type==="passport"?"text":f.type;
  return `<div class="field"><label>${esc(f.label)} ${req}</label><input id="field_${f.id}" type="${esc(type)}" value="${esc(state.values[f.id]||"")}" ${f.type==="national_id"?'inputmode="numeric" maxlength="11"':''}></div>`;
}

function validate(fields){
  for(const f of fields){
    if(!f.required) continue;
    if((f.type==="document"||f.type==="photo") && !state.files[f.id]){alert(`${f.label} zorunludur.`);return false;}
    if(f.type!=="document"&&f.type!=="photo"&&!state.values[f.id]){alert(`${f.label} zorunludur.`);return false;}
  }
  if(state.values.nationalId && !/^\d{11}$/.test(state.values.nationalId)){alert("T.C. Kimlik No 11 haneli olmalıdır.");return false;}
  return true;
}

async function apiPost(data){

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(data)
  });

  const text = await response.text();

  let result;

  try {
    result = JSON.parse(text);
  } catch(e) {
    throw new Error("Backend geçerli JSON döndürmedi: " + text);
  }

  if(!result.success){
    throw new Error(result.error || "Backend işlemi başarısız.");
  }

  return result;
}


function fileToBase64(file){

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = () => {

      const result = reader.result;

      // data:application/pdf;base64,XXXX
      // kısmından sadece XXXX bölümünü alıyoruz.

      const base64 = String(result).split(",")[1];

      resolve(base64);
    };

    reader.onerror = () => {
      reject(new Error("Dosya okunamadı: " + file.name));
    };

    reader.readAsDataURL(file);
   
  });
}



function showUploadProgress(){

  if(document.getElementById("uploadProgressOverlay")){
    return;
  }

  const overlay = document.createElement("div");

  overlay.id = "uploadProgressOverlay";

  overlay.innerHTML = `
    <div style="
      position:fixed;
      inset:0;
      background:rgba(15,23,42,0.72);
      display:flex;
      align-items:center;
      justify-content:center;
      z-index:99999;
      padding:20px;
    ">

      <div style="
        background:#ffffff;
        width:380px;
        max-width:95%;
        padding:32px 28px;
        border-radius:18px;
        text-align:center;
        box-shadow:0 20px 60px rgba(0,0,0,0.30);
      ">

        <div
          id="uploadProgressCircle"
          style="
            width:150px;
            height:150px;
            margin:0 auto 22px;
            border-radius:50%;
            background:conic-gradient(#2563eb 0%, #e5e7eb 0%);
            display:flex;
            align-items:center;
            justify-content:center;
            transition:background 0.35s ease;
          "
        >
          <div style="
            width:122px;
            height:122px;
            border-radius:50%;
            background:#ffffff;
            display:flex;
            align-items:center;
            justify-content:center;
          ">
            <div
              id="uploadProgressPercent"
              style="
                font-size:30px;
                font-weight:700;
                color:#2563eb;
              "
            >
              0%
            </div>
          </div>
        </div>

        <h3 style="
          margin:0 0 10px;
          font-size:20px;
          color:#111827;
        ">
          Başvurunuz işleniyor
        </h3>

        <p
          id="uploadProgressText"
          style="
            margin:0;
            color:#4b5563;
            font-size:14px;
            line-height:1.5;
            min-height:42px;
          "
        >
          Lütfen bekleyiniz...
        </p>

        <div style="
          margin-top:20px;
          padding-top:16px;
          border-top:1px solid #e5e7eb;
          color:#6b7280;
          font-size:13px;
        ">
          Lütfen sayfayı kapatmayın ve işlem tamamlanana kadar bekleyin.
        </div>

      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  updateUploadProgress(0, "Başvuru hazırlanıyor...");
}


function updateUploadProgress(percent, text){

  const safePercent = Math.max(
    0,
    Math.min(100, Math.round(percent))
  );

  const circle =
    document.getElementById(
      "uploadProgressCircle"
    );

  const percentEl =
    document.getElementById(
      "uploadProgressPercent"
    );

  const textEl =
    document.getElementById(
      "uploadProgressText"
    );

  if(circle){
    circle.style.background =
      `conic-gradient(
        #2563eb ${safePercent}%,
        #e5e7eb ${safePercent}%
      )`;
  }

  if(percentEl){
    percentEl.textContent =
      safePercent + "%";
  }

  if(textEl){
    textEl.textContent =
      text || "Lütfen bekleyiniz...";
  }
}


function hideUploadProgress(){

  const overlay =
    document.getElementById(
      "uploadProgressOverlay"
    );

  if(overlay){
    overlay.remove();
  }

}


async function submitApplication(){

  // --------------------------------------------------
  // ÇİFT TIKLAMA KORUMASI
  // --------------------------------------------------

  if (state.submitting) {
    return;
  }

  state.submitting = true;


  // --------------------------------------------------
  // İŞLEM EKRANINI AÇ
  // --------------------------------------------------

  showUploadProgress();


  try {

    // --------------------------------------------------
    // GÖNDERİLECEK BELGELER
    // --------------------------------------------------

    const documentFields =
      state.form.fields.filter(
        f =>
          f.type === "document" ||
          f.type === "photo"
      );


    const uploadedDocuments =
      documentFields.filter(
        f => state.files[f.id]
      );


    const totalSteps =
      1 + uploadedDocuments.length;

    let completedSteps = 0;


    // --------------------------------------------------
    // 0%
    // --------------------------------------------------

    updateUploadProgress(
      2,
      "Başvuru hazırlanıyor..."
    );


    // --------------------------------------------------
    // 1. PERSONEL OLUŞTUR
    // --------------------------------------------------

    updateUploadProgress(
      8,
      "Personel kaydı oluşturuluyor..."
    );


    const personnelResult =
      await apiPost({

        action:
          "createPersonnel",

        first_name:
          state.values.firstName,

        last_name:
          state.values.lastName,

        national_id:
          state.values.nationalId,

        passport_no:
          state.values.passport || "",

        group_id:
          "GRP-FORMEN",

        phone:
          state.values.phone || "",

        email:
          state.values.email || ""

      });


    if (
      !personnelResult.personnel_id
    ) {

      throw new Error(
        "Personel oluşturuldu ancak personnel_id alınamadı."
      );

    }


    const personnelId =
      personnelResult.personnel_id;


    completedSteps++;


    updateUploadProgress(
      Math.round(
        (completedSteps /
          totalSteps) * 100
      ),
      "Personel kaydı oluşturuldu."
    );


    // --------------------------------------------------
    // 2. BELGELER
    // --------------------------------------------------

    for (
      let i = 0;
      i < uploadedDocuments.length;
      i++
    ) {

      const field =
        uploadedDocuments[i];

      const file =
        state.files[field.id];


      const progressBefore =
        Math.round(
          (completedSteps /
            totalSteps) * 100
        );


      updateUploadProgress(
        Math.max(
          progressBefore,
          10
        ),
        field.label +
        " hazırlanıyor..."
      );


      // ------------------------------------------------
      // DOSYAYI BASE64'E ÇEVİR
      // ------------------------------------------------

      updateUploadProgress(
        Math.max(
          progressBefore,
          10
        ),
        field.label +
        " okunuyor..."
      );


      const base64 =
        await fileToBase64(
          file
        );


      // ------------------------------------------------
      // DOSYA YÜKLE
      // ------------------------------------------------

      updateUploadProgress(
        Math.max(
          progressBefore,
          10
        ),
        field.label +
        " Google Drive'a yükleniyor..."
      );


      const documentResult =
        await apiPost({

          action:
            "uploadDocument",

          personnel_id:
            personnelId,

          document_code:
            field.code,

          file_name:
            file.name,

          mime_type:
            file.type,

          file_base64:
            base64

        });


      if (
        !documentResult.success
      ) {

        throw new Error(
          field.label +
          " yüklenirken hata oluştu."
        );

      }


      completedSteps++;


      const currentProgress =
        Math.round(
          (completedSteps /
            totalSteps) * 100
        );


      updateUploadProgress(
        currentProgress,
        field.label +
        " başarıyla yüklendi."
      );

    }


    // --------------------------------------------------
    // %100
    // --------------------------------------------------

    updateUploadProgress(
      100,
      "Başvurunuz başarıyla tamamlandı."
    );


    // Küçük bir bekleme:
    // kullanıcı %100'ü görebilsin.

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          800
        )
    );


    // --------------------------------------------------
    // BAŞARI EKRANI
    // --------------------------------------------------

    hideUploadProgress();


    showSuccess(
      personnelId,
      personnelResult.token || ""
    );


  }

  catch(error) {

    console.error(error);


    hideUploadProgress();


    alert(
      "Başvuru sırasında hata oluştu:\n\n" +
      error.message
    );

  }

  finally {

    state.submitting =
      false;

  }

}

function showSuccess(personId,manageToken){
  document.getElementById("formView").classList.add("hidden");
  const s=document.getElementById("successView");
  s.classList.remove("hidden");
  document.getElementById("successText").textContent=`Personel kayıt numaranız: ${personId}`;
  document.getElementById("manageLink").value=`${location.origin}${location.pathname}?manage=${manageToken}`;
  document.getElementById("copyLink").onclick=()=>navigator.clipboard.writeText(document.getElementById("manageLink").value);
}
// --------------------------------------------------
// SAYFA AÇILDIĞINDA MANAGE LINK KONTROLÜ
// --------------------------------------------------

checkManageLink();
const manageStyle =
  document.createElement("style");

manageStyle.textContent = `
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }
`;

document.head.appendChild(manageStyle);
