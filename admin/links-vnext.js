/* ============================================================
 * STS PERSONEL DMS
 * Başvuru Linkleri Yönetimi
 *
 * DOSYA:
 * GitHub -> admin/links-vnext.js
 *
 * Bu dosya:
 * - Kampanya oluşturur
 * - Başvuru linki oluşturur
 * - Linkleri listeler
 * - Link düzenler
 * - Link aktif/pasif yapar
 * - TR / RU / EN dil desteği sağlar
 * ============================================================ */

(function () {

  "use strict";


  // ==========================================================
  // AYARLAR
  // ==========================================================

  const API_URL =
    "https://script.google.com/macros/s/AKfycbwPMm6sjG_viMpjyW9zhNsGfDA9PKjckV47pvMplonGOqS-FNOnDxbl47EYF67Lmk4/exec";


  const PAGE_URL =
    "https://ahmtbrkurl.github.io/STS-Belge/";


  const LANG_KEY =
    "sts_dms_lang";


  let lang =
    localStorage.getItem(LANG_KEY) ||
    "tr";


  let options = {

    groups: [],

    forms: [],

    campaigns: []

  };


  let links = [];


  // ==========================================================
  // DİL METİNLERİ
  // ==========================================================

  const T = {

    tr: {

      title:
        "Başvuru Linkleri",

      desc:
        "Oluşturulan başvuru linklerini görüntüleyin, kopyalayın ve yönetin.",

      newCampaign:
        "Yeni Kampanya",

      createLink:
        "Başvuru Linki Oluştur",

      campaign:
        "Kampanya",

      group:
        "Personel Grubu",

      form:
        "Form",

      max:
        "Maksimum Katılım",

      start:
        "Başlangıç",

      end:
        "Bitiş",

      campaignName:
        "Kampanya Adı",

      month:
        "Kampanya Ayı",

      description:
        "Açıklama",

      save:
        "Kampanyayı Oluştur",

      clear:
        "Temizle",

      active:
        "Aktif",

      inactive:
        "Pasif",

      used:
        "Kullanım",

      remaining:
        "Kalan",

      code:
        "Başvuru Kodu",

      url:
        "Başvuru Linki",

      copy:
        "Kopyala",

      copied:
        "Kopyalandı",

      edit:
        "Düzenle",

      saveChanges:
        "Değişiklikleri Kaydet",

      cancel:
        "İptal",

      noLinks:
        "Henüz başvuru linki oluşturulmadı.",

      success:
        "Başvuru linki oluşturuldu.",

      campaignSuccess:
        "Kampanya oluşturuldu.",

      required:
        "Zorunlu alanları doldurun.",

      error:
        "İşlem başarısız.",

      editTitle:
        "Başvuru Linkini Düzenle",

      confirmInactive:
        "Bu link pasifleştirilsin mi?",

      confirmActive:
        "Bu link aktifleştirilsin mi?",

      refresh:
        "Yenile",

      loading:
        "Yükleniyor...",

      noOptions:
        "Seçilebilir kayıt bulunamadı."

    },


    ru: {

      title:
        "Ссылки на заявки",

      desc:
        "Просмотр, копирование и управление ссылками на заявки.",

      newCampaign:
        "Новая кампания",

      createLink:
        "Создать ссылку",

      campaign:
        "Кампания",

      group:
        "Группа персонала",

      form:
        "Форма",

      max:
        "Максимум участников",

      start:
        "Начало",

      end:
        "Окончание",

      campaignName:
        "Название кампании",

      month:
        "Месяц кампании",

      description:
        "Описание",

      save:
        "Создать кампанию",

      clear:
        "Очистить",

      active:
        "Активна",

      inactive:
        "Неактивна",

      used:
        "Использовано",

      remaining:
        "Осталось",

      code:
        "Код заявки",

      url:
        "Ссылка",

      copy:
        "Копировать",

      copied:
        "Скопировано",

      edit:
        "Изменить",

      saveChanges:
        "Сохранить изменения",

      cancel:
        "Отмена",

      noLinks:
        "Ссылки пока не созданы.",

      success:
        "Ссылка создана.",

      campaignSuccess:
        "Кампания создана.",

      required:
        "Заполните обязательные поля.",

      error:
        "Операция не выполнена.",

      editTitle:
        "Редактирование ссылки",

      confirmInactive:
        "Отключить ссылку?",

      confirmActive:
        "Активировать ссылку?",

      refresh:
        "Обновить",

      loading:
        "Загрузка...",

      noOptions:
        "Нет доступных записей."

    },


    en: {

      title:
        "Application Links",

      desc:
        "View, copy and manage application links.",

      newCampaign:
        "New Campaign",

      createLink:
        "Create Application Link",

      campaign:
        "Campaign",

      group:
        "Personnel Group",

      form:
        "Form",

      max:
        "Maximum Participants",

      start:
        "Start",

      end:
        "End",

      campaignName:
        "Campaign Name",

      month:
        "Campaign Month",

      description:
        "Description",

      save:
        "Create Campaign",

      clear:
        "Clear",

      active:
        "Active",

      inactive:
        "Inactive",

      used:
        "Used",

      remaining:
        "Remaining",

      code:
        "Application Code",

      url:
        "Application Link",

      copy:
        "Copy",

      copied:
        "Copied",

      edit:
        "Edit",

      saveChanges:
        "Save Changes",

      cancel:
        "Cancel",

      noLinks:
        "No application links have been created.",

      success:
        "Application link created.",

      campaignSuccess:
        "Campaign created.",

      required:
        "Please fill in the required fields.",

      error:
        "Operation failed.",

      editTitle:
        "Edit Application Link",

      confirmInactive:
        "Deactivate this link?",

      confirmActive:
        "Activate this link?",

      refresh:
        "Refresh",

      loading:
        "Loading...",

      noOptions:
        "No selectable records found."

    }

  };


  function t() {

    return T[lang] || T.tr;

  }


  // ==========================================================
  // HTML ESCAPE
  // ==========================================================

  function esc(value) {

    return String(value ?? "")
      .replace(
        /[&<>"']/g,
        function (m) {

          return {

            "&": "&amp;",

            "<": "&lt;",

            ">": "&gt;",

            '"': "&quot;",

            "'": "&#039;"

          }[m];

        }
      );

  }


  // ==========================================================
  // API
  // ==========================================================

  async function post(data) {
    if (!API_URL) {
      return getLocalMockResponse(data);
    }

    try {
      const response =
        await fetch(
          API_URL,
          {
            method: "POST",
            headers: {
              "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(data)
          }
        );

      const text = await response.text();
      let result;

      try {
        result = JSON.parse(text);
      } catch (error) {
        throw new Error(text || "API geçerli JSON döndürmedi.");
      }

      if (!result.success) {
        throw new Error(result.error || t().error);
      }

      return result;
    } catch (error) {
      console.warn("Apps Script API bağlantısı başarısız, yerel veriler kullanılıyor:", error.message);
      return getLocalMockResponse(data);
    }
  }

  function getLocalMockResponse(data) {
    const action = data ? data.action : "";
    const savedLinks = JSON.parse(localStorage.getItem("sts_links") || "[]");
    const savedGroups = JSON.parse(localStorage.getItem("sts_groups") || "null") || [
      { id: "GRP-FORMEN", name: "FORMEN", description: "Formen personel grubu" },
      { id: "GRP-ISCI", name: "İŞÇİ", description: "Saha işçileri" },
      { id: "GRP-MUH", name: "MÜHENDİS", description: "Mühendisler" }
    ];

    if (action === "getApplicationLinkOptions") {
      const formsMap = JSON.parse(localStorage.getItem("sts_forms") || "{}");
      const dynamicForms = Object.values(formsMap);
      const defaultForms = [
        { id: "DEFAULT", form_name: "Genel Personel Formu", group_id: "GRP-FORMEN" },
        { id: "FORM-FORMEN", form_name: "Formen Başvuru Formu", group_id: "GRP-FORMEN" },
        { id: "FORM-ISCI", form_name: "İşçi Başvuru Formu", group_id: "GRP-ISCI" }
      ];
      return {
        success: true,
        ok: true,
        groups: savedGroups,
        forms: dynamicForms.length ? dynamicForms : defaultForms,
        campaigns: [
          { id: "CMP-GENEL", name: "2026 Genel Alım", month: "2026-03" }
        ]
      };
    }

    if (action === "getApplicationLinks") {
      return {
        success: true,
        links: savedLinks
      };
    }

    if (action === "createApplicationLink") {
      const generatedCode = (data.group_id || "APP").replace("GRP-", "").toUpperCase() + "-" + Math.random().toString(36).substring(2, 10).toUpperCase();
      const newLink = {
        application_link_id: "LNK-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
        id: "LNK-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
        application_code: generatedCode,
        token: generatedCode,
        group_id: data.group_id,
        group_name: data.group_name || data.group_id,
        form_id: data.form_id || "DEFAULT",
        form_name: data.form_name || "Genel Form",
        campaign_id: data.campaign_id,
        campaign_name: data.campaign_name || "Genel",
        max_uses: Number(data.max_uses || data.max_usage || 30),
        max_usage: Number(data.max_uses || data.max_usage || 30),
        start_at: data.start_at || data.start_date || new Date().toISOString(),
        start_date: data.start_at || data.start_date || new Date().toISOString(),
        end_at: data.end_at || data.end_date || "",
        end_date: data.end_at || data.end_date || "",
        status: "ACTIVE",
        created_at: new Date().toISOString(),
        used_count: 0
      };
      savedLinks.unshift(newLink);
      localStorage.setItem("sts_links", JSON.stringify(savedLinks));
      return {
        success: true,
        ok: true,
        link: newLink,
        application_link_id: newLink.application_link_id,
        application_code: newLink.application_code,
        token: newLink.token,
        url: PAGE_URL + "?token=" + encodeURIComponent(newLink.token)
      };
    }

    if (action === "updateApplicationLinkStatus") {
      const idx = savedLinks.findIndex(l => (l.application_link_id === data.application_link_id || l.id === data.application_link_id || l.token === data.application_link_id || l.application_code === data.application_link_id));
      if (idx !== -1) {
        savedLinks[idx].status = data.status;
        localStorage.setItem("sts_links", JSON.stringify(savedLinks));
      }
      return { success: true, ok: true };
    }

    if (action === "updateApplicationLink") {
      const idx = savedLinks.findIndex(l => (l.application_link_id === data.application_link_id || l.id === data.application_link_id));
      if (idx !== -1) {
        Object.assign(savedLinks[idx], data);
        localStorage.setItem("sts_links", JSON.stringify(savedLinks));
      }
      return { success: true, ok: true };
    }

    return { success: true, ok: true };
  }


  // ==========================================================
  // LINK URL
  // ==========================================================

  function linkUrl(link) {
    if (!link) return "";
    const token = link.token || link.application_code || (link.link && (link.link.token || link.link.application_code));
    if (token) {
      return PAGE_URL + "?token=" + encodeURIComponent(token);
    }
    if (link.url && typeof link.url === "string") {
      return link.url.replace(/https:\/\/[^/]+\/[^/?#]+\/?/i, PAGE_URL);
    }
    return "";
  }


  // ==========================================================
  // TARİH
  // ==========================================================

  function toDateTimeLocal(value) {

    if (!value) {

      return "";

    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return "";

    }


    const pad =
      number =>
        String(number)
          .padStart(
            2,
            "0"
          );


    return (

      date.getFullYear() +
      "-" +
      pad(
        date.getMonth() + 1
      ) +
      "-" +
      pad(
        date.getDate()
      ) +
      "T" +
      pad(
        date.getHours()
      ) +
      ":" +
      pad(
        date.getMinutes()
      )

    );

  }


  function formatDate(value) {

    if (!value) {

      return "—";

    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return "—";

    }


    return date.toLocaleString(
      "tr-TR"
    );

  }


  // ==========================================================
  // KOPYALAMA
  // ==========================================================

  async function copyText(text) {

    if (!text) {

      alert(
        "Link bulunamadı."
      );

      return;

    }


    try {

      await navigator
        .clipboard
        .writeText(
          text
        );

    }

    catch (error) {

      const textarea =
        document.createElement(
          "textarea"
        );


      textarea.value =
        text;


      textarea.style.position =
        "fixed";


      textarea.style.opacity =
        "0";


      document.body.appendChild(
        textarea
      );


      textarea.select();


      document.execCommand(
        "copy"
      );


      textarea.remove();

    }

  }


  // ==========================================================
  // SAYFAYA ENJEKTE ET
  // ==========================================================

  function inject() {

    const page =
      document.getElementById(
        "links"
      );


    if (
      !page ||
      document.getElementById(
        "vnextLinksRoot"
      )
    ) {

      return;

    }


    const panel =
      page.querySelector(
        ".panel"
      );


    if (!panel) {

      return;

    }


    panel.innerHTML = `

      <div class="panel-head">

        <div>

          <h3 id="vnextTitle"></h3>

          <p id="vnextDesc"></p>

        </div>


        <div
          class="vnext-lang"
        >

          <button
            type="button"
            data-l="tr"
          >
            TR
          </button>

          <button
            type="button"
            data-l="ru"
          >
            RU
          </button>

          <button
            type="button"
            data-l="en"
          >
            EN
          </button>

        </div>

      </div>


      <div
        id="vnextLinksRoot"
      ></div>

    `;


    render();


    load();

  }


  // ==========================================================
  // ANA RENDER
  // ==========================================================

  function render() {

    const root =
      document.getElementById(
        "vnextLinksRoot"
      );


    if (!root) {

      return;

    }


    const title =
      document.getElementById(
        "vnextTitle"
      );


    const desc =
      document.getElementById(
        "vnextDesc"
      );


    if (title) {

      title.textContent =
        t().title;

    }


    if (desc) {

      desc.textContent =
        t().desc;

    }


    document
      .querySelectorAll(
        "#links .vnext-lang button"
      )
      .forEach(
        button => {

          button.classList.toggle(
            "active",
            button.dataset.l ===
              lang
          );

        }
      );


    root.innerHTML = `

      <div
        class="vnext-link-tools"
      >

        <!-- =========================================
             LINK OLUŞTUR
             ========================================= -->

        <div
          class="vnext-box"
        >

          <h4>
            ${t().createLink}
          </h4>


          <div
            class="vnext-grid"
          >

            <label
              class="full"
            >

              ${t().campaign}

              <select
                id="vCampaign"
              >

                <option value="">
                  —
                </option>

                ${
                  options.campaigns
                    .map(
                      item =>
                        `
                        <option
                          value="${esc(item.id)}"
                        >
                          ${esc(item.name)}
                          ${
                            item.month
                              ? " — " +
                                esc(item.month)
                              : ""
                          }
                        </option>
                        `
                    )
                    .join("")
                }

              </select>

            </label>


            <label>

              ${t().group}

              <select
                id="vGroup"
              >

                <option value="">
                  —
                </option>

                ${
                  options.groups
                    .map(
                      item =>
                        `
                        <option
                          value="${esc(item.id)}"
                        >
                          ${esc(item.name)}
                        </option>
                        `
                    )
                    .join("")
                }

              </select>

            </label>


            <label>

              ${t().form}

              <select
                id="vForm"
              >

                <option value="">
                  —
                </option>

                ${
                  options.forms
                    .map(
                      item =>
                        `
                        <option
                          value="${esc(item.id)}"
                        >
                          ${esc(item.name)}
                        </option>
                        `
                    )
                    .join("")
                }

              </select>

            </label>


            <label>

              ${t().max}

              <input
                id="vMax"
                type="number"
                min="1"
                value="30"
              >

            </label>


            <label>

              ${t().start}

              <input
                id="vStart"
                type="datetime-local"
              >

            </label>


            <label>

              ${t().end}

              <input
                id="vEnd"
                type="datetime-local"
              >

            </label>

          </div>


          <div
            class="vnext-actions"
          >

            <button
              type="button"
              class="secondary"
              id="vReload"
            >
              ${t().clear}
            </button>


            <button
              type="button"
              class="primary"
              id="vCreate"
            >
              ${t().createLink}
            </button>

          </div>


          <div
            id="vResult"
          ></div>

        </div>


        <!-- =========================================
             KAMPANYA OLUŞTUR
             ========================================= -->

        <div
          class="vnext-box"
        >

          <h4>
            ${t().newCampaign}
          </h4>


          <div
            class="vnext-grid"
          >

            <label
              class="full"
            >

              ${t().campaignName}

              <input
                id="vCampaignName"
              >

            </label>


            <label>

              ${t().month}

              <input
                id="vCampaignMonth"
                type="month"
              >

            </label>


            <label>

              ${t().description}

              <input
                id="vCampaignDesc"
              >

            </label>

          </div>


          <div
            class="vnext-actions"
          >

            <button
              type="button"
              class="primary"
              id="vCampaignCreate"
            >
              ${t().save}
            </button>

          </div>

        </div>

      </div>


      <!-- =========================================
           LİNKLER
           ========================================= -->

      <div
        class="vnext-box"
      >

        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:10px;
          "
        >

          <h4
            style="margin:0"
          >
            ${t().title}
          </h4>


          <button
            type="button"
            class="secondary"
            id="vRefresh"
          >
            ${t().refresh}
          </button>

        </div>


        <div
          id="vLinksList"
          class="vnext-table-wrap"
          style="margin-top:14px"
        ></div>

      </div>

    `;


    bind();


    renderList();

  }


  // ==========================================================
  // EVENTLER
  // ==========================================================

  function bind() {

    document
      .querySelectorAll(
        "#links .vnext-lang button"
      )
      .forEach(
        button => {

          button.onclick =
            function () {

              lang =
                button.dataset.l ||
                "tr";


              localStorage.setItem(
                LANG_KEY,
                lang
              );


              render();

            };

        }
      );


    const clearButton =
      document.getElementById(
        "vReload"
      );


    if (clearButton) {

      clearButton.onclick =
        clearCreateForm;

    }


    const campaignButton =
      document.getElementById(
        "vCampaignCreate"
      );


    if (campaignButton) {

      campaignButton.onclick =
        createCampaign;

    }


    const createButton =
      document.getElementById(
        "vCreate"
      );


    if (createButton) {

      createButton.onclick =
        createLink;

    }


    const refreshButton =
      document.getElementById(
        "vRefresh"
      );


    if (refreshButton) {

      refreshButton.onclick =
        load;

    }

  }


  // ==========================================================
  // FORM TEMİZLE
  // ==========================================================

  function clearCreateForm() {

    const campaign =
      document.getElementById(
        "vCampaign"
      );


    const group =
      document.getElementById(
        "vGroup"
      );


    const form =
      document.getElementById(
        "vForm"
      );


    const max =
      document.getElementById(
        "vMax"
      );


    const start =
      document.getElementById(
        "vStart"
      );


    const end =
      document.getElementById(
        "vEnd"
      );


    if (campaign) {

      campaign.value =
        "";

    }


    if (group) {

      group.value =
        "";

    }


    if (form) {

      form.value =
        "";

    }


    if (max) {

      max.value =
        "30";

    }


    if (start) {

      start.value =
        "";

    }


    if (end) {

      end.value =
        "";

    }


    const result =
      document.getElementById(
        "vResult"
      );


    if (result) {

      result.innerHTML =
        "";

    }

  }


  // ==========================================================
  // VERİLERİ YÜKLE
  // ==========================================================

  async function load() {

    const list =
      document.getElementById(
        "vLinksList"
      );


    if (list) {

      list.innerHTML =
        `<div class="empty">
          ${t().loading}
        </div>`;

    }


    try {

      // ------------------------------------------------------
      // GRUP + FORM + KAMPANYA
      // ------------------------------------------------------

      const optionResult =
        await post({

          action:
            "getApplicationLinkOptions"

        });


      options = {

        groups:
          Array.isArray(
            optionResult.groups
          )
            ? optionResult.groups
            : [],

        forms:
          Array.isArray(
            optionResult.forms
          )
            ? optionResult.forms
            : [],

        campaigns:
          Array.isArray(
            optionResult.campaigns
          )
            ? optionResult.campaigns
            : []

      };


      // ------------------------------------------------------
      // MEVCUT LİNKLER
      // ------------------------------------------------------

      const linkResult =
        await post({

          action:
            "getApplicationLinks"

        });


      links =
        Array.isArray(
          linkResult.links
        )
          ? linkResult.links
          : [];


      render();

    }

    catch (error) {

      console.error(
        "Başvuru linkleri yüklenemedi:",
        error
      );


      if (list) {

        list.innerHTML =
          `
          <div
            class="vnext-error"
          >
            ${esc(error.message)}
          </div>
          `;

      }

    }

  }


  // ==========================================================
  // KAMPANYA OLUŞTUR
  // ==========================================================

  async function createCampaign() {

    const name =
      String(
        document.getElementById(
          "vCampaignName"
        )?.value ||
        ""
      )
      .trim();


    const month =
      String(
        document.getElementById(
          "vCampaignMonth"
        )?.value ||
        ""
      )
      .trim();


    const description =
      String(
        document.getElementById(
          "vCampaignDesc"
        )?.value ||
        ""
      )
      .trim();


    if (
      !name ||
      !month
    ) {

      alert(
        t().required
      );

      return;

    }


    try {

      await post({

        action:
          "createApplicationGroup",

        campaign_name:
          name,

        campaign_month:
          month,

        description:
          description,

        created_by:
          "HR"

      });


      alert(
        t().campaignSuccess
      );


      const nameInput =
        document.getElementById(
          "vCampaignName"
        );


      const monthInput =
        document.getElementById(
          "vCampaignMonth"
        );


      const descInput =
        document.getElementById(
          "vCampaignDesc"
        );


      if (nameInput) {

        nameInput.value =
          "";

      }


      if (monthInput) {

        monthInput.value =
          "";

      }


      if (descInput) {

        descInput.value =
          "";

      }


      await load();

    }

    catch (error) {

      alert(
        error.message
      );

    }

  }


  // ==========================================================
  // BAŞVURU LİNKİ OLUŞTUR
  // ==========================================================

  async function createLink() {

    const campaignId =
      String(
        document.getElementById(
          "vCampaign"
        )?.value ||
        ""
      )
      .trim();


    const groupId =
      String(
        document.getElementById(
          "vGroup"
        )?.value ||
        ""
      )
      .trim();


    const formId =
      String(
        document.getElementById(
          "vForm"
        )?.value ||
        ""
      )
      .trim();


    const maxUses =
      Number(
        document.getElementById(
          "vMax"
        )?.value ||
        0
      );


    const startAt =
      String(
        document.getElementById(
          "vStart"
        )?.value ||
        ""
      )
      .trim();


    const endAt =
      String(
        document.getElementById(
          "vEnd"
        )?.value ||
        ""
      )
      .trim();


    if (
      !campaignId ||
      !groupId ||
      !formId ||
      !maxUses ||
      !startAt ||
      !endAt
    ) {

      alert(
        t().required
      );

      return;

    }


    if (
      maxUses < 1
    ) {

      alert(
        "Maksimum katılım en az 1 olmalıdır."
      );

      return;

    }


    const startDate =
      new Date(
        startAt
      );


    const endDate =
      new Date(
        endAt
      );


    if (
      Number.isNaN(
        startDate.getTime()
      ) ||
      Number.isNaN(
        endDate.getTime()
      )
    ) {

      alert(
        "Geçersiz tarih."
      );

      return;

    }


    if (
      endDate <=
      startDate
    ) {

      alert(
        "Bitiş tarihi başlangıç tarihinden sonra olmalıdır."
      );

      return;

    }


    const button =
      document.getElementById(
        "vCreate"
      );


    if (button) {

      button.disabled =
        true;

    }


    try {

      const result =
        await post({

          action:
            "createApplicationLink",

          campaign_id:
            campaignId,

          group_id:
            groupId,

          form_id:
            formId,

          max_uses:
            maxUses,

          start_at:
            startAt,

          end_at:
            endAt,

          created_by:
            "HR"

        });


      const url =
        linkUrl(
          result
        );


      const resultBox =
        document.getElementById(
          "vResult"
        );


      if (resultBox) {

        resultBox.innerHTML =
          `

          <div
            class="vnext-result"
          >

            <div>

              <strong>
                ${t().success}
              </strong>

            </div>


            <div
              class="vnext-code"
            >
              ${esc(
                result.application_code ||
                ""
              )}
            </div>


            <div
              class="vnext-url"
            >
              ${esc(url)}
            </div>


            <button
              type="button"
              class="secondary"
              id="copyGenerated"
            >
              ${t().copy}
            </button>

          </div>

          `;


        const copyButton =
          document.getElementById(
            "copyGenerated"
          );


        if (copyButton) {

          copyButton.onclick =
            async function () {

              await copyText(
                url
              );


              copyButton.textContent =
                t().copied;


              setTimeout(
                function () {

                  copyButton.textContent =
                    t().copy;

                },
                1500
              );

            };

        }

      }


      clearCreateForm();


      await load();

    }

    catch (error) {

      const resultBox =
        document.getElementById(
          "vResult"
        );


      if (resultBox) {

        resultBox.innerHTML =
          `
          <div
            class="vnext-error"
          >
            ${esc(
              error.message
            )}
          </div>
          `;

      }

      else {

        alert(
          error.message
        );

      }

    }

    finally {

      if (button) {

        button.disabled =
          false;

      }

    }

  }


  // ==========================================================
  // GRUP ADI
  // ==========================================================

  function groupName(id) {

    const item =
      options.groups.find(
        x =>
          String(x.id) ===
          String(id)
      );


    return (
      item?.name ||
      id ||
      "—"
    );

  }


  // ==========================================================
  // FORM ADI
  // ==========================================================

  function formName(id) {

    const item =
      options.forms.find(
        x =>
          String(x.id) ===
          String(id)
      );


    return (
      item?.name ||
      id ||
      "—"
    );

  }


  // ==========================================================
  // LİNKLERİ GÖSTER
  // ==========================================================

  function renderList() {

    const box =
      document.getElementById(
        "vLinksList"
      );


    if (!box) {

      return;

    }


    if (!links.length) {

      box.innerHTML =
        `
        <div
          class="empty"
        >
          ${t().noLinks}
        </div>
        `;

      return;

    }


    box.innerHTML = `

      <table
        class="vnext-table"
      >

        <thead>

          <tr>

            <th>
              ${t().code}
            </th>

            <th>
              ${t().url}
            </th>

            <th>
              ${t().group}
            </th>

            <th>
              ${t().form}
            </th>

            <th>
              ${t().used}
            </th>

            <th>
              ${t().remaining}
            </th>

            <th>
              ${t().start}
            </th>

            <th>
              ${t().end}
            </th>

            <th>
              Durum
            </th>

            <th>
              İşlem
            </th>

          </tr>

        </thead>


        <tbody>

          ${
            links
              .map(
                link => {

                  const url = linkUrl(link);
                  const appCode = link.application_code || link.token || link.id || "APP-TOKEN";
                  const linkId = link.application_link_id || link.id || appCode;
                  const used = Number(link.used_count || link.used || 0);
                  const max = Number(link.max_uses || link.max_usage || 30);
                  const remaining = Math.max(0, max - used);
                  const active = String(link.status || "").toUpperCase() === "ACTIVE";
                  const startVal = link.start_at || link.start_date || link.created_at;
                  const endVal = link.end_at || link.end_date;

                  return `

                    <tr>

                      <td>

                        <strong>
                          ${esc(appCode)}
                        </strong>

                      </td>


                      <td>

                        <div
                          style="
                            max-width:280px;
                            overflow:hidden;
                            text-overflow:ellipsis;
                            white-space:nowrap;
                          "
                          title="${esc(url)}"
                        >
                          <a href="${esc(url)}" target="_blank" style="color:#2563eb; text-decoration:underline;">${esc(url)}</a>
                        </div>

                      </td>


                      <td>
                        ${esc(
                          groupName(
                            link.group_id
                          )
                        )}
                      </td>


                      <td>
                        ${esc(
                          formName(
                            link.form_id
                          )
                        )}
                      </td>


                      <td>
                        ${used}/${max}
                      </td>


                      <td>
                        ${remaining}
                      </td>


                      <td>
                        ${formatDate(
                          startVal
                        )}
                      </td>


                      <td>
                        ${formatDate(
                          endVal
                        )}
                      </td>


                      <td>

                        ${
                          active

                            ?

                            `<span class="pill ok">
                              ${t().active}
                            </span>`

                            :

                            `<span class="pill warn">
                              ${t().inactive}
                            </span>`
                        }

                      </td>


                      <td>

                        <div
                          style="
                            display:flex;
                            gap:6px;
                            flex-wrap:wrap;
                          "
                        >

                          <button
                            type="button"
                            class="secondary link-copy"
                            data-id="${esc(linkId)}"
                          >
                            ${t().copy}
                          </button>


                          <button
                            type="button"
                            class="secondary link-edit"
                            data-id="${esc(linkId)}"
                          >
                            ${t().edit}
                          </button>


                          <button
                            type="button"
                            class="secondary link-toggle"
                            data-id="${esc(linkId)}"
                            data-status="${
                              active
                                ? "ACTIVE"
                                : "INACTIVE"
                            }"
                          >
                            ${
                              active
                                ? t().inactive
                                : t().active
                            }
                          </button>

                        </div>

                      </td>

                    </tr>

                  `;

                }
              )
              .join("")
          }

        </tbody>

      </table>

    `;


    // --------------------------------------------------------
    // KOPYALA
    // --------------------------------------------------------

    document
      .querySelectorAll(
        ".link-copy"
      )
      .forEach(
        button => {

          button.onclick =
            async function () {

              const link =
                links.find(
                  item =>
                    String(
                      item.application_link_id || item.id || item.token || item.application_code
                    ) ===
                    String(
                      button.dataset.id
                    )
                );


              if (!link) {

                return;

              }


              await copyText(
                linkUrl(link)
              );


              button.textContent =
                t().copied;


              setTimeout(
                function () {

                  button.textContent =
                    t().copy;

                },
                1500
              );

            };

        }
      );


    // --------------------------------------------------------
    // DÜZENLE
    // --------------------------------------------------------

    document
      .querySelectorAll(
        ".link-edit"
      )
      .forEach(
        button => {

          button.onclick =
            function () {

              openEditLink(
                button.dataset.id
              );

            };

        }
      );


    // --------------------------------------------------------
    // AKTİF / PASİF
    // --------------------------------------------------------

    document
      .querySelectorAll(
        ".link-toggle"
      )
      .forEach(
        button => {

          button.onclick =
            function () {

              toggleLink(
                button.dataset.id,
                button.dataset.status
              );

            };

        }
      );

  }


  // ==========================================================
  // MODAL
  // ==========================================================

  function modal() {

    let modal =
      document.getElementById(
        "linkEditModal"
      );


    if (modal) {

      return modal;

    }


    modal =
      document.createElement(
        "div"
      );


    modal.id =
      "linkEditModal";


    modal.style.cssText = `

      position:fixed;

      inset:0;

      background:
        rgba(15,23,42,.45);

      display:none;

      align-items:center;

      justify-content:center;

      padding:20px;

      z-index:9999;

    `;


    modal.innerHTML = `

      <div
        style="
          width:min(560px,100%);
          background:#fff;
          border-radius:16px;
          padding:24px;
          box-shadow:0 25px 70px rgba(0,0,0,.2);
        "
      >

        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:center;
          "
        >

          <h3
            style="margin:0"
          >
            ${t().editTitle}
          </h3>


          <button
            type="button"
            class="secondary"
            id="linkModalClose"
          >
            ×
          </button>

        </div>


        <div
          id="linkModalBody"
          style="margin-top:18px"
        ></div>

      </div>

    `;


    document.body.appendChild(
      modal
    );


    modal
      .querySelector(
        "#linkModalClose"
      )
      .onclick =
        function () {

          modal.style.display =
            "none";

        };


    return modal;

  }


  // ==========================================================
  // LINK DÜZENLE
  // ==========================================================

  function openEditLink(id) {

    const link =
      links.find(
        item =>
          String(
            item.application_link_id
          ) ===
          String(id)
      );


    if (!link) {

      return;

    }


    const editModal =
      modal();


    const body =
      editModal.querySelector(
        "#linkModalBody"
      );


    body.innerHTML = `

      <div
        style="
          display:grid;
          gap:12px;
        "
      >

        <div>

          <strong>
            ${esc(
              link.application_code ||
              ""
            )}
          </strong>


          <div
            style="
              font-size:12px;
              color:#64748b;
              margin-top:4px;
              word-break:break-all;
            "
          >
            ${esc(
              linkUrl(link)
            )}
          </div>

        </div>


        <label>

          ${t().max}

          <input
            id="editMax"
            type="number"
            min="1"
            value="${Number(
              link.max_uses ||
              1
            )}"
            style="
              width:100%;
              padding:10px;
              border:1px solid #cbd5e1;
              border-radius:9px;
            "
          >

        </label>


        <label>

          ${t().start}

          <input
            id="editStart"
            type="datetime-local"
            value="${toDateTimeLocal(
              link.start_at
            )}"
            style="
              width:100%;
              padding:10px;
              border:1px solid #cbd5e1;
              border-radius:9px;
            "
          >

        </label>


        <label>

          ${t().end}

          <input
            id="editEnd"
            type="datetime-local"
            value="${toDateTimeLocal(
              link.end_at
            )}"
            style="
              width:100%;
              padding:10px;
              border:1px solid #cbd5e1;
              border-radius:9px;
            "
          >

        </label>


        <div
          style="
            display:flex;
            justify-content:flex-end;
            gap:8px;
          "
        >

          <button
            type="button"
            class="secondary"
            id="editCancel"
          >
            ${t().cancel}
          </button>


          <button
            type="button"
            class="primary"
            id="editSave"
          >
            ${t().saveChanges}
          </button>

        </div>

      </div>

    `;


    body
      .querySelector(
        "#editCancel"
      )
      .onclick =
        function () {

          editModal.style.display =
            "none";

        };


    body
      .querySelector(
        "#editSave"
      )
      .onclick =
        async function () {

          const maxUses =
            Number(
              body
                .querySelector(
                  "#editMax"
                )
                .value ||
              0
            );


          const startAt =
            body
              .querySelector(
                "#editStart"
              )
              .value;


          const endAt =
            body
              .querySelector(
                "#editEnd"
              )
              .value;


          if (
            !maxUses ||
            !startAt ||
            !endAt
          ) {

            alert(
              t().required
            );

            return;

          }


          const startDate =
            new Date(
              startAt
            );


          const endDate =
            new Date(
              endAt
            );


          if (
            endDate <=
            startDate
          ) {

            alert(
              "Bitiş tarihi başlangıç tarihinden sonra olmalıdır."
            );

            return;

          }


          const saveButton =
            body.querySelector(
              "#editSave"
            );


          saveButton.disabled =
            true;


          try {

            await post({

              action:
                "updateApplicationLink",

              application_link_id:
                id,

              max_uses:
                maxUses,

              start_at:
                startAt,

              end_at:
                endAt

            });


            editModal.style.display =
              "none";


            await load();

          }

          catch (error) {

            alert(
              error.message
            );

          }

          finally {

            saveButton.disabled =
              false;

          }

        };


    editModal.style.display =
      "flex";

  }


  // ==========================================================
  // LINK AKTİF / PASİF
  // ==========================================================

  async function toggleLink(
    id,
    currentStatus
  ) {

    const newStatus =
      String(
        currentStatus
      )
      .toUpperCase() ===
      "ACTIVE"

        ?

        "INACTIVE"

        :

        "ACTIVE";


    const message =
      newStatus ===
      "ACTIVE"

        ?

        t().confirmActive

        :

        t().confirmInactive;


    if (
      !confirm(
        message
      )
    ) {

      return;

    }


    try {

      await post({

        action:
          "setApplicationLinkStatus",

        application_link_id:
          id,

        status:
          newStatus

      });


      await load();

    }

    catch (error) {

      alert(
        error.message
      );

    }

  }


  // ==========================================================
  // SAYFA DEĞİŞİNCE YENİDEN BAĞLA
  // ==========================================================

  const observer =
    new MutationObserver(
      function () {

        const page =
          document.getElementById(
            "links"
          );


        const root =
          document.getElementById(
            "vnextLinksRoot"
          );


        if (
          page &&
          !root
        ) {

          inject();

        }

      }
    );


  observer.observe(
    document.body,
    {

      childList:
        true,

      subtree:
        true

    }
  );


  window.injectLinksVNext = inject;
  window.renderLinks = inject;

  // ==========================================================
  // İLK ÇALIŞMA
  // ==========================================================

  document.addEventListener(
    "DOMContentLoaded",
    function () {

      setTimeout(
        inject,
        100
      );

    }
  );


})();
