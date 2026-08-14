/* STS Personnel DMS - STEP 03
 * GITHUB -> admin/i18n-vnext.js
 * 3-language HR UI: Türkçe / Русский / English
 *
 * Google Apps Script'e dokunmaz.
 * links-vnext.js içindeki dil altyapısıyla birlikte çalışır.
 */
(function () {
  "use strict";

  const LANG_KEY = "sts_dms_lang";
  let lang = localStorage.getItem(LANG_KEY) || "tr";

  const D = {
    tr: {
      page: {
        dashboard: "Dashboard", groups: "Personel Grupları", forms: "Form Tasarımı",
        links: "Başvuru Linkleri", personnel: "Personeller", logs: "İşlem Logları", settings: "Ayarlar"
      },
      nav: { dashboard:"📊 Dashboard", groups:"👥 Gruplar", forms:"🧩 Form Tasarımı", links:"🔗 Başvuru Linkleri", personnel:"📄 Personeller", logs:"📋 İşlem Logları", settings:"⚙️ Ayarlar" },
      login: { title:"HR Yönetim Paneli", desc:"Personel Belge Yönetim Sistemi", user:"Kullanıcı Adı", userPh:"HR kullanıcı adı", pass:"Şifre", passPh:"HR şifre", login:"Giriş Yap", note:"Kimlik doğrulaması sonraki aşamada Google Apps Script backend'e bağlanacaktır." },
      dash: { total:"Toplam Personel", groups:"Aktif Gruplar", pending:"Bekleyen Belgeler", changes:"Değişiklik Talepleri", quick:"Hızlı İşlemler", quickDesc:"HR'ın günlük kullanacağı ana işlemler.", newGroup:"+ Yeni Grup", form:"+ Form Tasarla", link:"+ Başvuru Linki", people:"Personelleri Gör" },
      groups: { desc:"Her grubun kendi belge ve form seti olabilir.", new:"+ Yeni Grup", th:["Grup","Açıklama","Personel","Belge","Durum"], active:"Aktif", prompt:"Grup adı:", newDesc:"Yeni personel grubu" },
      forms: { desc:"Kod yazmadan alanları ve belgeleri tanımlayın.", group:"Grup", name:"Form Adı", version:"Versiyon", defaultName:"Personel Başvuru Formu", add:"Alan Ekle", fields:"Alanlar", empty:"Sol taraftan alan ekleyin.", properties:"Alan Özellikleri", selectField:"Düzenlemek için bir alan seçin.", preview:"Önizleme", save:"Formu Kaydet", type:"Alan Tipi", label:"Etiket", help:"Yardım / Açıklama Metni", placeholder:"Yer Tutucu Metin", required:"Zorunlu alan", remove:"Sil", replace:"Personel sonradan değiştirebilir", approval:"Değişiklikte HR onayı gerekli", camera:"Kameradan çekmeye izin ver", gallery:"Galeriden/dosyadan seçmeye izin ver", options:"Seçenekler", fileTypes:"İzin Verilen Dosya Türleri", max:"Maksimum Dosya Boyutu (MB)", code:"Belge Kodu" },
      links: { desc:"Ekiplere göndermek için grup bazlı bağlantılar oluşturun.", new:"+ Yeni Link" },
      personnel: { desc:"Başvuruları, belge durumlarını ve kayıt numaralarını görüntüleyin.", empty:"Backend bağlantısından sonra gerçek personel kayıtları burada gösterilecek." },
      logs: { desc:"Belge yükleme, değiştirme ve onay hareketleri.", empty:"Backend bağlantısından sonra gerçek DOCUMENT_LOG kayıtları burada listelenecek." },
      settings: { desc:"Backend bağlantısı ve genel sistem seçenekleri.", status:"Backend durumu", warn:" Henüz bağlanmadı ", note:"Bir sonraki aşamada Google Apps Script Web App URL'si bağlanacak." },
      alerts: { login:"Kullanıcı adı ve şifre girin.", addField:"Önce en az bir alan ekleyin." }
    },
    ru: {
      page: { dashboard:"Панель управления", groups:"Группы персонала", forms:"Конструктор форм", links:"Ссылки на заявки", personnel:"Персонал", logs:"Журнал операций", settings:"Настройки" },
      nav: { dashboard:"📊 Панель", groups:"👥 Группы", forms:"🧩 Конструктор форм", links:"🔗 Ссылки на заявки", personnel:"📄 Персонал", logs:"📋 Журнал операций", settings:"⚙️ Настройки" },
      login: { title:"Панель управления HR", desc:"Система управления документами персонала", user:"Имя пользователя", userPh:"Имя пользователя HR", pass:"Пароль", passPh:"Пароль HR", login:"Войти", note:"На следующем этапе аутентификация будет подключена к Google Apps Script." },
      dash: { total:"Всего персонала", groups:"Активные группы", pending:"Ожидающие документы", changes:"Запросы на изменения", quick:"Быстрые действия", quickDesc:"Основные ежедневные действия HR.", newGroup:"+ Новая группа", form:"+ Создать форму", link:"+ Ссылка на заявку", people:"Просмотреть персонал" },
      groups: { desc:"Каждая группа может иметь собственный набор документов и форм.", new:"+ Новая группа", th:["Группа","Описание","Персонал","Документы","Статус"], active:"Активна", prompt:"Название группы:", newDesc:"Новая группа персонала" },
      forms: { desc:"Определяйте поля и документы без написания кода.", group:"Группа", name:"Название формы", version:"Версия", defaultName:"Форма заявки персонала", add:"Добавить поле", fields:"Поля", empty:"Добавьте поле слева.", properties:"Свойства поля", selectField:"Выберите поле для редактирования.", preview:"Предпросмотр", save:"Сохранить форму", type:"Тип поля", label:"Метка", help:"Текст помощи / описания", placeholder:"Текст-подсказка", required:"Обязательное поле", remove:"Удалить", replace:"Персонал может изменить позже", approval:"Для изменения требуется одобрение HR", camera:"Разрешить съёмку камерой", gallery:"Разрешить выбор из галереи/файла", options:"Варианты", fileTypes:"Разрешённые типы файлов", max:"Максимальный размер файла (МБ)", code:"Код документа" },
      links: { desc:"Создавайте групповые ссылки для отправки командам.", new:"+ Новая ссылка" },
      personnel: { desc:"Просматривайте заявки, статусы документов и регистрационные номера.", empty:"Реальные записи персонала будут показаны после подключения backend." },
      logs: { desc:"Загрузка, замена и операции утверждения документов.", empty:"Реальные записи DOCUMENT_LOG будут показаны после подключения backend." },
      settings: { desc:"Подключение backend и общие настройки системы.", status:"Состояние backend", warn:" Ещё не подключён ", note:"На следующем этапе будет подключён URL Google Apps Script Web App." },
      alerts: { login:"Введите имя пользователя и пароль.", addField:"Сначала добавьте хотя бы одно поле." }
    },
    en: {
      page: { dashboard:"Dashboard", groups:"Personnel Groups", forms:"Form Designer", links:"Application Links", personnel:"Personnel", logs:"Activity Logs", settings:"Settings" },
      nav: { dashboard:"📊 Dashboard", groups:"👥 Groups", forms:"🧩 Form Designer", links:"🔗 Application Links", personnel:"📄 Personnel", logs:"📋 Activity Logs", settings:"⚙️ Settings" },
      login: { title:"HR Administration", desc:"Personnel Document Management System", user:"Username", userPh:"HR username", pass:"Password", passPh:"HR password", login:"Sign In", note:"Authentication will be connected to the Google Apps Script backend in a later stage." },
      dash: { total:"Total Personnel", groups:"Active Groups", pending:"Pending Documents", changes:"Change Requests", quick:"Quick Actions", quickDesc:"Main daily actions for HR.", newGroup:"+ New Group", form:"+ Design Form", link:"+ Application Link", people:"View Personnel" },
      groups: { desc:"Each group can have its own document and form set.", new:"+ New Group", th:["Group","Description","Personnel","Documents","Status"], active:"Active", prompt:"Group name:", newDesc:"New personnel group" },
      forms: { desc:"Define fields and documents without writing code.", group:"Group", name:"Form Name", version:"Version", defaultName:"Personnel Application Form", add:"Add Field", fields:"Fields", empty:"Add a field from the left.", properties:"Field Properties", selectField:"Select a field to edit.", preview:"Preview", save:"Save Form", type:"Field Type", label:"Label", help:"Help / Description Text", placeholder:"Placeholder Text", required:"Required field", remove:"Delete", replace:"Personnel can change later", approval:"HR approval required for changes", camera:"Allow camera capture", gallery:"Allow gallery/file selection", options:"Options", fileTypes:"Allowed File Types", max:"Maximum File Size (MB)", code:"Document Code" },
      links: { desc:"Create group-based links to send to teams.", new:"+ New Link" },
      personnel: { desc:"View applications, document statuses and registration numbers.", empty:"Real personnel records will appear here after the backend is connected." },
      logs: { desc:"Document uploads, replacements and approval actions.", empty:"Real DOCUMENT_LOG records will appear here after the backend is connected." },
      settings: { desc:"Backend connection and general system options.", status:"Backend status", warn:" Not connected yet ", note:"The Google Apps Script Web App URL will be connected in the next stage." },
      alerts: { login:"Enter a username and password.", addField:"Add at least one field first." }
    }
  };

  function T() { return D[lang] || D.tr; }
  function text(el, value) {
    if (!el || value === undefined || value === null) return;
    if (el.textContent !== value) el.textContent = value;
  }
  function setLabelText(labelEl, value) {
    if (!labelEl || value === undefined || value === null) return;
    const span = labelEl.querySelector(".lbl-txt");
    if (span) {
      if (span.textContent !== value) span.textContent = value;
      return;
    }
    for (let node of labelEl.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim().length > 0) {
        if (node.nodeValue !== value) node.nodeValue = value;
        return;
      }
    }
    // If only child elements exist, prepend text
    if (labelEl.firstChild) {
      labelEl.insertBefore(document.createTextNode(value), labelEl.firstChild);
    } else {
      labelEl.textContent = value;
    }
  }
  function attr(id, name, value) { const el=document.getElementById(id); if(el && el.getAttribute(name) !== value) el.setAttribute(name,value); }

  function installStyle() {
    if (document.getElementById("stsI18nStyle")) return;
    const s=document.createElement("style");
    s.id="stsI18nStyle";
    s.textContent=".sts-global-lang,.sts-login-lang{display:flex;gap:4px}.sts-global-lang button,.sts-login-lang button{border:1px solid #cbd5e1;background:#fff;color:#334155;border-radius:7px;padding:5px 8px;cursor:pointer;font-size:11px;font-weight:700}.sts-global-lang button.active,.sts-login-lang button.active{background:#2563eb;color:#fff;border-color:#2563eb}.sts-login-lang{justify-content:center;margin:12px 0 16px}";
    document.head.appendChild(s);
  }

  function translateStatic() {
    const t=T();

    document.documentElement.lang=lang;

    document.querySelectorAll(".nav-item").forEach(b => {
      const key=b.dataset.page;
      if (t.nav[key]) text(b,t.nav[key]);
    });

    text(document.querySelector("#loginView h1"),t.login.title);
    text(document.querySelector("#loginView p"),t.login.desc);
    const labels=document.querySelectorAll("#loginView label");
    if(labels[0]) text(labels[0],t.login.user);
    if(labels[1]) text(labels[1],t.login.pass);
    attr("username","placeholder",t.login.userPh);
    attr("password","placeholder",t.login.passPh);
    text(document.getElementById("loginBtn"),t.login.login);
    text(document.querySelector(".demo-note"),t.login.note);

    text(document.querySelector("#dashboard .stat:nth-child(1) span"),t.dash.total);
    text(document.querySelector("#dashboard .stat:nth-child(2) span"),t.dash.groups);
    text(document.querySelector("#dashboard .stat:nth-child(3) span"),t.dash.pending);
    text(document.querySelector("#dashboard .stat:nth-child(4) span"),t.dash.changes);
    text(document.querySelector("#dashboard .panel h3"),t.dash.quick);
    text(document.querySelector("#dashboard .panel p"),t.dash.quickDesc);
    const quick=document.querySelectorAll("#dashboard .quick");
    if(quick[0]) text(quick[0],t.dash.newGroup);
    if(quick[1]) text(quick[1],t.dash.form);
    if(quick[2]) text(quick[2],t.dash.link);
    if(quick[3]) text(quick[3],t.dash.people);

    const g=document.querySelector("#groups");
    if(g){ text(g.querySelector(".panel-head p"),t.groups.desc); text(g.querySelector("#newGroupBtn"),t.groups.new); translateGroupsTable(); }

    const f=document.querySelector("#forms");
    if(f){
      text(f.querySelector(".panel-head p"),t.forms.desc);
      setLabelText(f.querySelector("#lblFormGroup") || f.querySelector(".builder-top label:nth-child(1)"), t.forms.group);
      setLabelText(f.querySelector("#lblFormName") || f.querySelector(".builder-top label:nth-child(2)"), t.forms.name);
      setLabelText(f.querySelector("#lblFormVersion") || f.querySelector(".builder-top label:nth-child(3)"), t.forms.version);
      attr("formName","value",t.forms.defaultName);
      text(f.querySelector(".palette h4"),t.forms.add);
      text(f.querySelector(".canvas-head span"),t.forms.fields);
      text(f.querySelector("#emptyFields"),t.forms.empty);
      text(f.querySelector(".properties h4"),t.forms.properties);
      text(f.querySelector("#previewBtn"),t.forms.preview);
      text(f.querySelector("#saveFormBtn"),t.forms.save);
      translateFormDynamic();
    }

    const l=document.querySelector("#links");
    if(l){ text(l.querySelector(".panel-head p"),t.links.desc); text(l.querySelector("#newLinkBtn"),t.links.new); }

    const p=document.querySelector("#personnel");
    if(p){ text(p.querySelector(".panel-head p"),t.personnel.desc); if(p.querySelector("#personnelTable .empty")) text(p.querySelector("#personnelTable .empty"),t.personnel.empty); }

    const logs=document.querySelector("#logs");
    if(logs){ text(logs.querySelector(".panel-head p"),t.logs.desc); if(logs.querySelector("#logsTable .empty")) text(logs.querySelector("#logsTable .empty"),t.logs.empty); }

    const set=document.querySelector("#settings");
    if(set){ text(set.querySelector(".panel-head p"),t.settings.desc); text(set.querySelector(".settings-box strong"),t.settings.status); text(set.querySelector(".settings-box .pill"),t.settings.warn); text(set.querySelector(".settings-box p"),t.settings.note); }

    document.querySelectorAll(".sts-global-lang button,.sts-login-lang button").forEach(b=>b.classList.toggle("active",b.dataset.lang===lang));

    // Keep the existing links-vnext language selector synchronized.
    const localLinksButton=document.querySelector(".vnext-lang button[data-l='"+lang+"']");
    if(localLinksButton && !localLinksButton.classList.contains("active")) localLinksButton.click();
  }

  function translateGroupsTable(){
    const tr=document.querySelectorAll("#groupsTable thead th");
    if(tr.length===5) T().groups.th.forEach((x,i)=>text(tr[i],x));
    document.querySelectorAll("#groupsTable .pill.ok").forEach(x=>text(x,T().groups.active));
  }

  function translateFormDynamic(){
    const t=T();
    document.querySelectorAll("#fieldList .field-row .remove").forEach(x=>text(x,t.forms.remove));
    const body=document.getElementById("propertiesBody");
    if(!body) return;
    const empty=body.querySelector(".empty");
    if(empty) { text(empty,t.forms.selectField); return; }
    const labels=body.querySelectorAll(".property > label");
    const map=[t.forms.type,t.forms.label,t.forms.help,t.forms.placeholder,t.forms.code,t.forms.fileTypes,t.forms.max,t.forms.replace,t.forms.approval,t.forms.camera,t.forms.gallery,t.forms.options];
    labels.forEach((x,i)=>{ if(map[i]) text(x,map[i]); });
    body.querySelectorAll(".check label").forEach(x=>{
      const s=x.textContent.trim();
      if(s==="Zorunlu alan"||s==="Required field"||s==="Обязательное поле") text(x,t.forms.required);
      if(s.includes("sonradan değiştirebilir")||s.includes("can change later")||s.includes("может изменить")) text(x,t.forms.replace);
      if(s.includes("HR onayı")||s.includes("HR approval")||s.includes("одобрение HR")) text(x,t.forms.approval);
      if(s.includes("Kameradan")||s.includes("camera")||s.includes("камерой")) text(x,t.forms.camera);
      if(s.includes("Galeriden")||s.includes("gallery")||s.includes("галереи")) text(x,t.forms.gallery);
    });
  }

  function bind(){
    document.querySelectorAll(".sts-global-lang button,.sts-login-lang button").forEach(b=>{
      b.onclick=()=>{
        lang=b.dataset.lang;
        localStorage.setItem(LANG_KEY,lang);
        translateStatic();
      };
    });
  }

  installStyle();
  bind();

  let translateTimer = null;
  const observer=new MutationObserver(()=>{
    clearTimeout(translateTimer);
    translateTimer=setTimeout(translateStatic,30);
  });
  observer.observe(document.body,{childList:true,subtree:true});

  window.STSDMSLanguage={
    get:()=>lang,
    set:(v)=>{
      if(!D[v]) return;
      lang=v;
      localStorage.setItem(LANG_KEY,v);
      translateStatic();
    }
  };

  setTimeout(translateStatic,50);
})();
