(function () {
  window.BX_METRIKA_ID = window.BX_METRIKA_ID || 88281896;
  window.BX_USE_TILDA_FORM = window.BX_USE_TILDA_FORM !== false;
  window.BX_TILDA_FORM_POPUP_HREF = window.BX_TILDA_FORM_POPUP_HREF || "#bx-tilda-form";
  window.BX_TILDA_FORM_ANCHOR = window.BX_TILDA_FORM_ANCHOR || "#bx-tilda-form";

  (function guardTildaMobileMutationObservers() {
    if (!window.MutationObserver || window.__BX_SPB_MUTATION_GUARD__) return;
    var NativeMutationObserver = window.MutationObserver;
    window.__BX_SPB_MUTATION_GUARD__ = true;
    window.__BX_NATIVE_MUTATION_OBSERVER__ = NativeMutationObserver;

    function SafeMutationObserver(callback) {
      var nativeObserver = new NativeMutationObserver(callback);
      var nativeObserve = nativeObserver.observe;
      nativeObserver.observe = function (target, options) {
        var watchesWholePage = target === document.documentElement && options && options.subtree;
        var watchesHeavyChanges = watchesWholePage && (options.childList || options.attributes);
        if (watchesHeavyChanges) return;
        return nativeObserve.call(nativeObserver, target, options);
      };
      return nativeObserver;
    }

    SafeMutationObserver.prototype = NativeMutationObserver.prototype;
    window.MutationObserver = SafeMutationObserver;
  })();

  (function emergencyPreloaderKill() {
    var css = [
      "html body .bx-preloader,html body [data-bx-preloader]{",
      "animation:bx-spb-force-preloader-off .01s 2.2s steps(1,end) forwards!important",
      "}",
      "@keyframes bx-spb-force-preloader-off{to{opacity:0;visibility:hidden;pointer-events:none;transform:translate3d(0,-120vh,0);z-index:-1}}",
      "html.bx-preloader-done body .bx-preloader,body.bx-preloader-done .bx-preloader,html.bx-preloader-done body [data-bx-preloader],body.bx-preloader-done [data-bx-preloader],.bx-preloader.is-hidden,[data-bx-preloader].is-hidden{opacity:0!important;visibility:hidden!important;pointer-events:none!important;display:none!important}"
    ].join("");
    var styleId = "bx-spb-js-emergency-preloader-css-20260615";
    var tries = 0;

    function addStyle() {
      if (document.getElementById(styleId)) return;
      var style = document.createElement("style");
      style.id = styleId;
      style.textContent = css;
      (document.head || document.documentElement).appendChild(style);
    }

    function mark() {
      document.documentElement.classList.add("bx-preloader-done");
      if (document.body) document.body.classList.add("bx-preloader-done");
    }

    function kill(force) {
      addStyle();
      mark();
      Array.prototype.slice.call(document.querySelectorAll("[data-bx-preloader], .bx-preloader")).forEach(function (node) {
        node.classList.add("is-hidden");
        node.setAttribute("aria-hidden", "true");
        node.style.setProperty("opacity", "0", "important");
        node.style.setProperty("visibility", "hidden", "important");
        node.style.setProperty("pointer-events", "none", "important");
        node.style.setProperty("display", "none", "important");
        if (force && node.parentNode) node.parentNode.removeChild(node);
      });
    }

    addStyle();
    [900, 1700, 2600, 3600, 5200, 7500, 10000].forEach(function (ms, index) {
      window.setTimeout(function () {
        kill(index > 2);
      }, ms);
    });
    var timer = window.setInterval(function () {
      tries += 1;
      kill(tries > 10);
      if (tries >= 28) window.clearInterval(timer);
    }, 350);
    window.addEventListener("pageshow", function () {
      kill(true);
    });
  })();

  const BX = {
    metrikaId: window.BX_METRIKA_ID || null,
    webhookUrl: "https://barnes-moscow.com/api/app/form/tilda/lead/callback/",
    popupHref: "#bx-tilda-form",
    state: {
      scenario: null,
      budget: null,
      district: null,
      format: null,
      project: null,
      sourceBlock: null,
      preferredContactMethod: "phone_call",
      name: "",
      phone: "",
      contactLogin: ""
    },
    contactMethods: {
      phone_call: {
        label: "Позвонить",
        parameter: "PHONE_CALL",
        field: "phone",
        inputLabel: "Телефон",
        placeholder: "+7"
      },
      whatsapp: {
        label: "WhatsApp",
        parameter: "WHATSAPP_PHONE",
        field: "phone",
        inputLabel: "Телефон для WhatsApp",
        placeholder: "+7"
      },
      telegram: {
        label: "Telegram",
        parameter: "TELEGRAM_LOGIN",
        field: "login",
        inputLabel: "Логин Telegram",
        placeholder: "@username",
        loginLabel: "Ник в Telegram"
      },
      max: {
        label: "MAX",
        parameter: "MAX_LOGIN",
        field: "login",
        inputLabel: "Логин MAX",
        placeholder: "логин или ссылка",
        loginLabel: "Ник в MAX"
      }
    },
    onboarding: {
      step: 0,
      steps: []
    },
    data: {},

    init() {
      this.initPreloader();
      this.injectColorFix();
      this.prepareData();
      this.cache();
      this.applyUxCopyUpdates();
      this.applyImageConfig();
      this.setupMotionPreferences();
      this.initHeader();
      this.initSmoothAnchors();
      this.initGuidedSectionScroll();
      this.initScrollReveal();
      this.initOnboarding();
      this.initAtlas();
      this.initIndexContentsScroll();
      this.initResidences();
      this.initMatrix();
      this.initScenarios();
      this.initFAQ();
      this.initForms();
      this.initCustomRequestPopup();
      this.initProcess();
      this.initUTM();
      this.initClientIds();
      this.initTildaFormBridge();
      this.initScrollDepth();
      this.initMobileCTA();
      this.initFloatingLeadPopup();
      this.bindTrackingLinks();
      this.initTildaPopupMode();
      this.initLuxuryAtlasLayer();
      window.addEventListener("load", () => this.injectColorFix(true));
      window.addEventListener("load", () => this.initTildaFormBridge());
      window.addEventListener("load", () => this.initTildaPopupMode());
      window.setTimeout(() => this.injectColorFix(true), 600);
      window.setTimeout(() => this.injectColorFix(true), 1800);
      window.setTimeout(() => this.initTildaFormBridge(), 600);
      window.setTimeout(() => this.initTildaFormBridge(), 1800);
      window.setTimeout(() => this.initTildaPopupMode(), 600);
      window.setTimeout(() => this.initTildaPopupMode(), 1800);
    },

    initPreloader() {
      const preloader = document.querySelector("[data-bx-preloader]");
      if (!preloader) return;
      const startedAt = window.performance?.now ? window.performance.now() : Date.now();
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        const now = window.performance?.now ? window.performance.now() : Date.now();
        const delay = Math.max(0, 1700 - (now - startedAt));
        window.setTimeout(() => {
          preloader.classList.add("is-hidden");
          window.setTimeout(() => preloader.remove(), 950);
        }, delay);
      };
      if (document.readyState === "complete") {
        close();
      } else {
        window.addEventListener("load", close, { once: true });
      }
      window.setTimeout(close, 3500);
    },

    setupMotionPreferences() {
      this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.documentElement.classList.toggle("bx-reduced-motion", this.reducedMotion);
    },

    injectColorFix(force = false) {
      const existing = document.getElementById("bx-color-fix");
      if (existing && !force) return;
      if (existing) existing.remove();

      const style = document.createElement("style");
      style.id = "bx-color-fix";
      style.textContent = `
        html body .bx-page,
        html body .bx-page * {
          --c-burgundy: #8a1232 !important;
          --c-burgundy-dark: #6f0e28 !important;
        }

        html body .bx-page a:not(.bx-btn):not(.bx-mobile-cta__icon),
        html body .bx-page button:not(.bx-btn):not(.bx-mobile-cta__icon):not(.bx-scenario__tab):not(.bx-atlas__item):not(.bx-atlas__district),
        html body .bx-page .bx-header__nav a,
        html body .bx-page .bx-header__phone,
        html body .bx-page .bx-faq__question,
        html body .bx-page .bx-scenario__tab:not([aria-selected="true"]),
        html body .bx-page .bx-atlas__item:not(.is-active),
        html body .bx-page .bx-atlas__item:not(.is-active) strong,
        html body .bx-page .bx-residence-card__cta,
        html body .bx-page [data-project-request],
        html body .bx-page [data-source] {
          color: #111111 !important;
          -webkit-text-fill-color: #111111 !important;
        }

        html body .bx-page .bx-faq__question *,
        html body .bx-page .bx-scenario__tab:not([aria-selected="true"]) {
          color: #111111 !important;
          -webkit-text-fill-color: #111111 !important;
        }

        html body .bx-page .bx-atlas__item:not(.is-active) span {
          color: #5f6368 !important;
          -webkit-text-fill-color: #5f6368 !important;
        }

        html body .bx-page .bx-mobile-cta__icon,
        html body .bx-page .bx-residence-card__cta {
          color: #111111 !important;
          -webkit-text-fill-color: #111111 !important;
        }

        html body .bx-page .bx-btn,
        html body .bx-page a.bx-btn,
        html body .bx-page button.bx-btn {
          text-decoration: none !important;
        }

        html body .bx-page .bx-btn--dark,
        html body .bx-page a.bx-btn--dark,
        html body .bx-page button.bx-btn--dark {
          background: #111111 !important;
          border-color: #111111 !important;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }

        html body .bx-page .bx-hero__cta a.bx-btn--light,
        html body .bx-page .bx-hero__cta a.bx-btn--outline-soft {
          background: transparent !important;
          border-color: rgba(138, 18, 50, .44) !important;
          color: #8a1232 !important;
          -webkit-text-fill-color: #8a1232 !important;
          box-shadow: none !important;
        }

        html body .bx-page .bx-btn--light,
        html body .bx-page a.bx-btn--light,
        html body .bx-page button.bx-btn--light {
          background: transparent !important;
          border-color: #111111 !important;
          color: #111111 !important;
          -webkit-text-fill-color: #111111 !important;
        }

        html body .bx-page .bx-hero .bx-btn,
        html body .bx-page .bx-onboarding .bx-btn,
        html body .bx-page .bx-atlas .bx-btn,
        html body .bx-page .bx-index .bx-btn,
        html body .bx-page .bx-matrix .bx-btn,
        html body .bx-page .bx-scenario .bx-btn,
        html body .bx-page .bx-advisor .bx-btn,
        html body .bx-page .bx-expert .bx-btn,
        html body .bx-page .bx-process .bx-btn,
        html body .bx-page .bx-faq .bx-btn,
        html body .bx-page .bx-postfaq-cta .bx-btn,
        html body .bx-page .bx-mobile-cta .bx-btn {
          background: #8a1232 !important;
          border-color: #8a1232 !important;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }

        html body .bx-page .bx-hero .bx-btn:hover,
        html body .bx-page .bx-onboarding .bx-btn:hover,
        html body .bx-page .bx-atlas .bx-btn:hover,
        html body .bx-page .bx-index .bx-btn:hover,
        html body .bx-page .bx-matrix .bx-btn:hover,
        html body .bx-page .bx-scenario .bx-btn:hover,
        html body .bx-page .bx-advisor .bx-btn:hover,
        html body .bx-page .bx-expert .bx-btn:hover,
        html body .bx-page .bx-process .bx-btn:hover,
        html body .bx-page .bx-faq .bx-btn:hover,
        html body .bx-page .bx-postfaq-cta .bx-btn:hover,
        html body .bx-page .bx-mobile-cta .bx-btn:hover {
          background: #6f0e28 !important;
          border-color: #6f0e28 !important;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }

        html body .bx-page .bx-header .bx-btn,
        html body .bx-page .bx-header .bx-btn:hover {
          background: #111111 !important;
          border-color: #111111 !important;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }

        html body .bx-page button.bx-scenario__tab[aria-selected="true"]:not(.bx-btn):not(.bx-mobile-cta__icon),
        html body .bx-page button.bx-atlas__item.is-active:not(.bx-btn):not(.bx-mobile-cta__icon),
        html body .bx-page button.bx-atlas__district.is-active:not(.bx-btn):not(.bx-mobile-cta__icon),
        html body .bx-page .bx-scenario__tab[aria-selected="true"],
        html body .bx-page .bx-scenario__tab[aria-selected="true"] *,
        html body .bx-page .bx-atlas__item.is-active,
        html body .bx-page .bx-atlas__item.is-active *,
        html body .bx-page .bx-atlas__district.is-active {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }

        html body .bx-page .bx-btn--dark:hover,
        html body .bx-page a.bx-btn--dark:hover,
        html body .bx-page button.bx-btn--dark:hover,
        html body .bx-page .bx-btn--light:hover,
        html body .bx-page a.bx-btn--light:hover,
        html body .bx-page button.bx-btn--light:hover {
          background: #2a2a2a !important;
          border-color: #2a2a2a !important;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }

        html body .bx-page .bx-request,
        html body .bx-page .bx-request h2,
        html body .bx-page .bx-request li,
        html body .bx-page .bx-request__proof span,
        html body .bx-page .bx-residence-card__content,
        html body .bx-page .bx-residence-card__content *,
        html body .bx-page .bx-residence-card__overlay,
        html body .bx-page .bx-residence-card__overlay * {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }

        html body .bx-page .bx-request .bx-label,
        html body .bx-page .bx-request .bx-text,
        html body .bx-page .bx-request__proof span,
        html body .bx-page .bx-checklist li {
          color: #d0d0d0 !important;
          -webkit-text-fill-color: #d0d0d0 !important;
        }

        html body .bx-page .bx-form__privacy,
        html body .bx-page .bx-form__message {
          color: #5f6368 !important;
          -webkit-text-fill-color: #5f6368 !important;
        }

        html body .bx-page .bx-footer,
        html body .bx-page .bx-footer *,
        html body .bx-page .bx-footer a,
        html body .bx-page .bx-footer a:hover {
          color: rgba(255, 255, 255, 0.78) !important;
          -webkit-text-fill-color: rgba(255, 255, 255, 0.78) !important;
        }

        html body .bx-page .bx-footer a:hover {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }

        html body .bx-page button.bx-scenario__tab[aria-selected="true"]:not(.bx-btn):not(.bx-mobile-cta__icon),
        html body .bx-page .bx-scenario__tab[aria-selected="true"],
        html body .bx-page .bx-scenario__tab[aria-selected="true"] * {
          background: #1e1e1e !important;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }

        html body .bx-page button.bx-scenario__tab:hover:not(.bx-btn):not(.bx-mobile-cta__icon),
        html body .bx-page button.bx-scenario__tab[aria-selected="true"]:not(.bx-btn):not(.bx-mobile-cta__icon),
        html body .bx-page button.bx-atlas__item:hover:not(.bx-btn):not(.bx-mobile-cta__icon),
        html body .bx-page button.bx-atlas__item.is-active:not(.bx-btn):not(.bx-mobile-cta__icon) {
          background: #1e1e1e !important;
          border-color: #1e1e1e !important;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }

        html body .bx-page .bx-scenario__tab:hover *,
        html body .bx-page .bx-scenario__tab[aria-selected="true"] *,
        html body .bx-page .bx-atlas__item:hover *,
        html body .bx-page .bx-atlas__item.is-active * {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }

        html body .bx-page button.bx-atlas__district:hover:not(.bx-btn):not(.bx-mobile-cta__icon),
        html body .bx-page button.bx-atlas__district.is-active:not(.bx-btn):not(.bx-mobile-cta__icon) {
          background: #111111 !important;
          border-color: #111111 !important;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }

        html body .bx-page .bx-atlas__shape.is-active {
          fill: rgba(123, 31, 43, 0.18) !important;
          stroke: rgba(123, 31, 43, 0.72) !important;
        }

        html body .bx-page .bx-form,
        html body .bx-page .bx-form * {
          -webkit-text-fill-color: currentColor !important;
        }
      `;
      document.head.appendChild(style);
    },

    cache() {
      this.nodes = {
        header: document.querySelector(".bx-header"),
        burger: document.querySelector(".bx-header__burger"),
        nav: document.querySelector(".bx-header__nav"),
        forms: document.querySelectorAll(".bx-form"),
        mobileCTA: document.querySelector("[data-mobile-cta]")
      };
    },

    getImage(key) {
      return (window.BX_IMAGES && window.BX_IMAGES[key]) || "";
    },

    applyImageConfig() {
      document.querySelectorAll("[data-image-key]").forEach((image) => {
        const src = this.getImage(image.dataset.imageKey);
        if (src) image.src = src;
      });
    },

    applyUxCopyUpdates() {
      const navCopy = [
        ["#hero", "Обзор 2026", "Кратко о каталоге"],
        ["#atlas", "Районы", "Ключевые локации Петербурга"],
        ["#projects", "Проекты", "Отобранные резиденции"],
        ["#methodology", "Методология", "Как BARNES оценивает проекты"],
        ["#expert", "Эксперт", "Кто получит ваш запрос"],
        ["#contacts", "Контакты", "Связаться с BARNES"]
      ];
      navCopy.forEach(([href, title, note]) => {
        const link = document.querySelector(`.bx-header__nav a[href="${href}"]`);
        if (link && !link.querySelector("small")) {
          link.innerHTML = `<span>${this.escape(title)}</span><small>${this.escape(note)}</small>`;
        }
      });

      const title = document.querySelector(".bx-hero__title");
      if (title && !title.dataset.uxCompact) {
        title.dataset.uxCompact = "true";
        title.innerHTML = `
          <span class="bx-title-line">Премиальные новостройки</span>
          <span class="bx-title-line">Петербурга 2026</span>
        `;
      }
      const lead = document.querySelector(".bx-hero__lead");
      if (lead) lead.textContent = "Каталог BARNES: районы, проекты, ликвидность и приватные предложения.";
      const heroButton = document.querySelector(".bx-hero__cta .bx-btn--dark");
      if (heroButton) heroButton.textContent = "Получить каталог 2026";
      const heroSecondary = document.querySelector(".bx-hero__cta .bx-btn--light");
      if (heroSecondary) {
        heroSecondary.textContent = "Получить подборку";
        heroSecondary.classList.add("bx-btn--outline-soft");
      }
      const heroMeta = document.querySelector(".bx-hero__meta");
      if (heroMeta && !heroMeta.dataset.uxCompact) {
        heroMeta.dataset.uxCompact = "true";
        heroMeta.innerHTML = `
          <span>Обновлено: май 2026</span>
          <span>Ответ эксперта за 1 рабочий день</span>
          <span>Без массовой рассылки</span>
        `;
      }
      const heroImage = document.querySelector(".bx-hero__image img");
      if (heroImage) {
        heroImage.loading = "eager";
        heroImage.fetchPriority = "high";
        heroImage.decoding = "async";
        heroImage.width = heroImage.width || 768;
        heroImage.height = heroImage.height || 960;
        heroImage.sizes = "(max-width: 600px) 100vw, 50vw";
        if (!document.querySelector('link[data-bx-hero-preload]')) {
          const preload = document.createElement("link");
          preload.rel = "preload";
          preload.as = "image";
          preload.href = heroImage.currentSrc || heroImage.src;
          preload.setAttribute("data-bx-hero-preload", "");
          document.head.appendChild(preload);
        }
      }

      const onboardingIntro = document.querySelector(".bx-onboarding__intro p");
      if (onboardingIntro) {
        onboardingIntro.textContent = "Экономьте время: 5 вопросов помогут эксперту BARNES отобрать только подходящие проекты под ваш бюджет, район и цель покупки.";
      }
      const onboardingFooter = document.querySelector(".bx-onboarding__footer");
      if (onboardingFooter && !onboardingFooter.querySelector("[data-onboarding-sheet-trigger]")) {
        onboardingFooter.insertAdjacentHTML("beforeend", '<button class="bx-onboarding__compact-summary" type="button" data-onboarding-sheet-trigger aria-expanded="false">Ваш запрос: 0 из 5 выбрано</button>');
      }

      const matrixHead = document.querySelector("#methodology .bx-section-head");
      if (matrixHead && !matrixHead.querySelector("[data-methodology-scale-copy]")) {
        matrixHead.insertAdjacentHTML("beforeend", '<p class="bx-text" data-methodology-scale-copy data-reveal>Оценка BARNES строится по открытой шкале: 1 — параметр выражен слабо, 2 — уверенный уровень премиального сегмента, 3 — редкое преимущество для рынка Санкт-Петербурга.</p>');
      }
      const matrixShell = document.querySelector("#methodology .bx-matrix__shell");
      if (matrixShell && !document.querySelector(".bx-methodology-scale")) {
        matrixShell.insertAdjacentHTML("beforebegin", `
          <div class="bx-methodology-scale" data-reveal aria-label="Шкала оценки BARNES">
            <span><strong>1</strong> базовый уровень</span>
            <span><strong>2</strong> сильный параметр</span>
            <span><strong>3</strong> редкое преимущество</span>
          </div>
        `);
      }

      const popupLead = document.querySelector(".bx-popup-form__lead");
      if (popupLead) {
        popupLead.textContent = "Сначала оставьте удобный контакт. Детали по бюджету, району и проекту можно уточнить сразу или в диалоге с экспертом.";
      }
      const popupStepLabel = document.querySelector('[data-popup-step="1"] .bx-popup-form__section-title span');
      if (popupStepLabel) popupStepLabel.textContent = "Куда отправить каталог";
      document.querySelectorAll('.bx-popup-form select[name="budget"], .bx-popup-form select[name="scenario"]').forEach((field) => {
        field.required = false;
        const label = field.closest(".bx-popup-form__field")?.querySelector("label");
        if (label && !/необязательно/i.test(label.textContent)) label.append(" · необязательно");
        const first = field.querySelector("option");
        if (first && !first.value) first.textContent = "Уточню с экспертом";
      });
      this.normalizePopupContactFirst();

      const postFaqTitle = document.querySelector("#postfaq-title");
      if (postFaqTitle) postFaqTitle.textContent = "Получите каталог BARNES и подборку по параметрам";
      const postFaqText = document.querySelector(".bx-postfaq-cta__content .bx-text");
      if (postFaqText) {
        postFaqText.textContent = "Тот же оффер, что и в начале страницы: каталог премиальных новостроек Петербурга 2026 и персональный shortlist под район, бюджет, формат и сценарий покупки.";
      }
      const postFaqFacts = document.querySelector(".bx-postfaq-cta__facts");
      if (postFaqFacts) {
        postFaqFacts.innerHTML = `
          <span>16 проектов в каталоге BARNES SPB</span>
          <span>5-7 объектов в персональном shortlist</span>
          <span>Планировки, бюджеты, сроки и ликвидность</span>
        `;
      }
      const postFaqButton = document.querySelector(".bx-postfaq-cta .bx-btn");
      if (postFaqButton) postFaqButton.textContent = "Получить каталог BARNES";
      document.querySelectorAll(".bx-residences .bx-swipe-hint, .bm-projects .bx-swipe-hint").forEach((hint) => {
        if (hint.dataset.bxLuxuryHint === "true") return;
        hint.innerHTML = '<span class="bx-swipe-hint__count">1 / 8</span><span class="bx-swipe-hint__text">Листайте проекты</span><span class="bx-swipe-hint__line"></span>';
        hint.dataset.bxLuxuryHint = "true";
      });
      this.enhanceMobilePulseCopy();
      this.syncTildaPopupCopy();
    },

    enhanceMobilePulseCopy() {
      const updates = [
        ["01 Адрес", "Адрес стал главным фильтром.", "В Петербурге важны не только район и цена, но и характер локации: историческая среда, вода, окружение и репутация."],
        ["02 Приватность", "Приватность важнее количества вариантов.", "Камерность, закрытые дворы, сервис и спокойный сценарий жизни становятся ключевыми критериями премиального сегмента."],
        ["03 Ликвидность", "Ликвидность строится на дефиците.", "Её формируют локация, архитектура, девелопер, планировки, видовые характеристики и ограниченность предложения."]
      ];
      document.querySelectorAll(".bx-pulse-card").forEach((card, index) => {
        const item = updates[index];
        if (!item || card.dataset.bxPulseEnhanced === "true") return;
        const label = card.querySelector("span");
        const text = card.querySelector("p");
        if (label) label.textContent = item[0];
        if (text) text.innerHTML = `<strong>${this.escape(item[1])}</strong> ${this.escape(item[2])}`;
        card.dataset.bxPulseEnhanced = "true";
      });
    },

    syncTildaPopupCopy() {
      const titles = Array.from(document.querySelectorAll(".t-popup .t-title, .t-popup [id^='popuptitle_'], .t702__title"));
      titles.forEach((node) => {
        if (/презентац|заявк/i.test(node.textContent || "")) node.textContent = "Получить каталог BARNES";
      });
      document.querySelectorAll(".t702__descr, .t-popup .t-descr").forEach((node) => {
        if (/Введите данные|презентац|заявк/i.test(node.textContent || "")) {
          node.textContent = "Оставьте контакт, и эксперт BARNES подготовит каталог и подборку по параметрам.";
        }
      });
      document.querySelectorAll(".t-popup .t-submit, .t-popup button[type='submit'], .t-popup .t-btnflex__text").forEach((node) => {
        if (/презентац|заявк|отправить/i.test(node.textContent || "")) node.textContent = "Получить каталог BARNES";
      });
    },

    normalizePopupContactFirst() {
      const form = document.querySelector("[data-bx-custom-form]");
      const step1 = form?.querySelector('[data-popup-step="1"]');
      const step2 = form?.querySelector('[data-popup-step="2"]');
      if (!form || !step1 || !step2 || form.dataset.uxContactFirst === "true") return;
      form.dataset.uxContactFirst = "true";

      const methodField = step1.querySelector(".bx-contact-methods")?.closest(".bx-popup-form__field");
      const budgetField = step1.querySelector('[name="budget"]')?.closest(".bx-popup-form__field");
      const scenarioField = step1.querySelector('[name="scenario"]')?.closest(".bx-popup-form__field");
      const nextButton = step1.querySelector("[data-popup-next]");
      const nameField = step2.querySelector('[name="name"]')?.closest(".bx-popup-form__field");
      const contactField = step2.querySelector("[data-popup-contact-input]")?.closest(".bx-popup-form__field");
      const loginField = step2.querySelector("[data-popup-login-field]");
      const actions = step2.querySelector(".bx-popup-form__actions");

      step1.querySelector(".bx-popup-form__label")?.replaceChildren(document.createTextNode("Куда отправить каталог"));
      if (methodField && nameField) methodField.after(nameField);
      if (nameField && contactField) nameField.after(contactField);
      if (contactField && loginField) contactField.after(loginField);
      if (nextButton) nextButton.textContent = "Продолжить";

      if (!step2.querySelector("[data-popup-preferences-title]")) {
        step2.insertAdjacentHTML("afterbegin", `
          <div class="bx-popup-form__field bx-popup-form__field--full" data-popup-preferences-title>
            <span class="bx-popup-form__label">Что важно при покупке</span>
            <p class="bx-popup-form__micro">Можно выбрать сейчас или оставить для разговора с экспертом.</p>
          </div>
        `);
      }
      const anchor = step2.querySelector("[data-popup-preferences-title]");
      if (anchor && scenarioField) anchor.after(scenarioField);
      if (anchor && budgetField) anchor.after(budgetField);

      if (!step2.querySelector('[data-popup-district-select]')) {
        const districts = ["", "Центральный", "Петроградский", "Василеостровский", "Адмиралтейский", "Московский", "Пока не знаю"];
        const projects = ["", "Фонтанка 130", "Манхэттен", "ЛДМ", "Коллекционер", "Аристократ", "Остров Первых", "Визионер", "17/33", "Уточню с экспертом"];
        const fieldHtml = `
          <div class="bx-popup-form__field" data-popup-district-select>
            <label for="popup-district">Район <span>необязательно</span></label>
            <select id="popup-district" name="district">
              ${districts.map((item) => `<option value="${this.escape(item)}">${this.escape(item || "Уточню с экспертом")}</option>`).join("")}
            </select>
          </div>
          <div class="bx-popup-form__field" data-popup-project-select>
            <label for="popup-project">Проект <span>необязательно</span></label>
            <select id="popup-project" name="project">
              ${projects.map((item) => `<option value="${this.escape(item)}">${this.escape(item || "Уточню с экспертом")}</option>`).join("")}
            </select>
          </div>
        `;
        (scenarioField || budgetField || anchor)?.insertAdjacentHTML("afterend", fieldHtml);
      }
      if (actions) step2.append(actions);
      actions?.querySelector('[type="submit"]')?.replaceChildren(document.createTextNode("Получить каталог и подборку"));
    },

    prepareData() {
      this.data.districts = [
        {
          id: "central",
          title: "Центральный",
          visual: "residenceFontanka",
          scenario: "статус · история · редкие адреса",
          character: "Для статуса, исторического контекста и редких адресов в центре города.",
          suitable: "Подходит для покупки с фокусом на культурный контекст, приватность и долгосрочную ценность адреса.",
          projects: ["Фонтанка 130", "Миръ", "Моисеенко 10"],
          cta: "Скачать каталог"
        },
        {
          id: "petrogradsky",
          title: "Петроградский",
          visual: "residenceLdm",
          scenario: "город · сервис · ликвидность",
          character: "Для насыщенной городской жизни, сильной инфраструктуры и устойчивого интереса к району.",
          suitable: "Сценарий для клиентов, которым важны статус района, культура, рестораны и удобная повседневная логистика.",
          projects: ["Коллекционер", "Визионер", "ЛДМ", "17/33"],
          cta: "Скачать каталог"
        },
        {
          id: "vasileostrovsky",
          title: "Василеостровский",
          visual: "residenceManhattan",
          scenario: "вода · новые кластеры · семья",
          character: "Для жизни у воды, новых премиальных кластеров и семейных сценариев.",
          suitable: "Сильный выбор для семейной покупки, видовых квартир и нового формата премиальной среды.",
          projects: ["Аристократ", "Легенда Васильевского", "Манхэттен"],
          cta: "Скачать каталог"
        },
        {
          id: "admiralteysky",
          title: "Адмиралтейский",
          visual: "residenceOstrov",
          scenario: "центр · вода · архитектура",
          character: "Для тех, кто ценит центр, воду, архитектуру и близость культурных маршрутов.",
          suitable: "Сценарий для жизни рядом с историческими маршрутами Петербурга и сильными видовыми параметрами.",
          projects: ["Остров Первых"],
          cta: "Скачать каталог"
        },
        {
          id: "moskovsky",
          title: "Московский",
          visual: "heroBuilding",
          scenario: "логистика · сервис · спокойствие",
          character: "Для покупателей, которым важны транспортная логика, инфраструктура и спокойный городской сценарий.",
          suitable: "Подходит для клиентов, которым нужен понятный маршрут, практичность и комфортная городская среда.",
          projects: ["Шепилевский", "19/19"],
          cta: "Скачать каталог"
        }
      ];

      this.data.residences = [
        {
          id: "fontanka-130",
          title: "Фонтанка 130",
          district: "Исторический центр / набережная",
          className: "Клубный дом",
          deadline: "I квартал 2029",
          price: "от 30 млн ₽",
          priceFrom: "от 30 млн ₽",
          meterage: "39–152 м²",
          terms: "индивидуальные условия",
          accent: "набережная Фонтанки, 130А",
          area: "клубный дом",
          imageKey: "residenceFontanka",
          thesis: "Клубный формат для тех, кто выбирает редкий петербургский адрес, приватность и статусную городскую среду.",
          why: ["клубный дом", "центр", "редкий адрес", "видовой потенциал"],
          facts: ["110 резиденций", "39–152 м²", "95 мест паркинга"],
          suitable: "статус · приватность · центр",
          cta: "Получить подборку по Фонтанке 130",
          backText: "Клубный формат для тех, кто выбирает редкий петербургский адрес, приватность и статусную городскую среду."
        },
        {
          id: "manhattan",
          title: "Манхэттен",
          district: "Василеостровский",
          className: "Премиум",
          deadline: "сдан",
          price: "цена по запросу",
          priceFrom: "по запросу",
          meterage: "квартиры и пентхаусы",
          terms: "индивидуальные условия",
          accent: "13-я линия В.О., 50",
          area: "квартиры",
          imageKey: "residenceManhattan",
          thesis: "Современный городской проект для покупателей, которым важны инфраструктура, архитектура и удобный ежедневный сценарий.",
          why: ["городская жизнь", "инфраструктура", "современная архитектура"],
          facts: ["55 резиденций", "Васильевский остров", "пентхаусы"],
          suitable: "жизнь · инфраструктура · архитектура",
          cta: "Получить подборку по Манхэттену",
          backText: "Современный городской проект для покупателей, которым важны инфраструктура, архитектура и удобный ежедневный сценарий."
        },
        {
          id: "ldm",
          title: "ЛДМ",
          district: "Петроградская сторона",
          className: "Премиум",
          deadline: "IV квартал 2027",
          price: "цена по запросу",
          priceFrom: "по запросу",
          meterage: "41,9–428,5 м²",
          terms: "индивидуальные условия",
          accent: "Профессора Попова, 47",
          area: "городские резиденции",
          imageKey: "residenceLdm",
          thesis: "Проект с сильным городским контекстом для тех, кто ценит статус района, культуру и насыщенную среду.",
          why: ["Петроградская сторона", "статус района", "культурный контекст"],
          facts: ["7 корпусов", "463 квартиры", "Аптекарский остров"],
          suitable: "город · культура · район",
          cta: "Получить подборку по ЛДМ",
          backText: "Проект с сильным городским контекстом для тех, кто ценит статус района, культуру и насыщенную среду."
        },
        {
          id: "kollektsioner",
          title: "Коллекционер",
          district: "Петроградский",
          className: "Камерный проект",
          deadline: "IV квартал 2028",
          price: "от 35,23 млн ₽",
          priceFrom: "от 35,23 млн ₽",
          meterage: "42,8–222 м²",
          terms: "индивидуальные условия",
          accent: "ул. Чапыгина, 4",
          area: "редкие форматы",
          imageKey: "residenceKollektsioner",
          thesis: "Камерный проект для покупателей, которым важны адресность, приватность и ощущение коллекционной ценности.",
          why: ["камерный формат", "приватность", "редкость"],
          facts: ["69 резиденций", "8 этажей", "потолки 3–3,2 м"],
          suitable: "камерность · адрес · редкость",
          cta: "Получить подборку по Коллекционеру",
          backText: "Камерный проект для покупателей, которым важны адресность, приватность и ощущение коллекционной ценности."
        },
        {
          id: "aristocrat",
          title: "Аристократ",
          district: "Василеостровский",
          className: "Премиум",
          deadline: "II кв. 2029 — IV кв. 2030",
          price: "от 14,9 млн ₽",
          priceFrom: "от 14,9 млн ₽",
          meterage: "от 24 м²",
          terms: "индивидуальные условия",
          accent: "26-я линия В.О., 1",
          area: "семейные форматы",
          imageKey: "residenceAristocrat",
          thesis: "Сдержанный премиальный проект для спокойного сценария жизни, приватности и семейной покупки.",
          why: ["статус", "семья", "приватность"],
          facts: ["94 квартиры", "Васильевский остров", "метро Горный институт"],
          suitable: "семья · приватность · спокойствие",
          cta: "Получить подборку по Аристократу",
          backText: "Сдержанный премиальный проект для спокойного сценария жизни, приватности и семейной покупки."
        },
        {
          id: "ostrov-pervyh",
          title: "Остров Первых",
          district: "Адмиралтейский",
          className: "Премиум",
          deadline: "2028–2029",
          price: "от 15,24 млн ₽",
          priceFrom: "от 15,24 млн ₽",
          meterage: "форматы квартир по запросу",
          terms: "рассрочка до 6 лет",
          accent: "Матисов остров",
          area: "видовые форматы",
          imageKey: "residenceOstrov",
          thesis: "Проект для покупателей, которым важны вода, воздух, приватность и новый сценарий премиальной жизни в Петербурге.",
          why: ["у воды", "приватность", "семейный сценарий", "видовые форматы"],
          facts: ["1 348 квартир", "3 жилых корпуса", "Матисов остров"],
          suitable: "вода · семья · приватность",
          cta: "Получить подборку по Острову Первых",
          backText: "Проект для покупателей, которым важны вода, воздух, приватность и новый сценарий премиальной жизни в Петербурге."
        },
        {
          id: "visioner",
          title: "Визионер",
          district: "Петроградский",
          className: "Современный проект",
          deadline: "III квартал 2028",
          price: "от 31,74 млн ₽",
          priceFrom: "от 31,74 млн ₽",
          meterage: "32–147 м²",
          terms: "индивидуальные условия",
          accent: "Средняя Колтовская, 9–11",
          area: "квартиры",
          imageKey: "residenceVisioner",
          thesis: "Современный проект для тех, кто оценивает архитектуру, технологичность и долгосрочную ликвидность.",
          why: ["современный проект", "архитектура", "инвестиционный интерес"],
          facts: ["225 квартир", "62 квартиры в продаже", "метро Чкаловская"],
          suitable: "архитектура · технологии · ликвидность",
          cta: "Получить подборку по Визионеру",
          backText: "Современный проект для тех, кто оценивает архитектуру, технологичность и долгосрочную ликвидность."
        },
        {
          id: "17-33",
          title: "17/33",
          district: "Петроградский",
          className: "Камерный формат",
          deadline: "IV кв. 2026 — III кв. 2027",
          price: "от 15,92 млн ₽",
          priceFrom: "от 15,92 млн ₽",
          meterage: "от 20,72 м²",
          terms: "индивидуальные условия",
          accent: "Ремесленная, 17",
          area: "редкий формат",
          imageKey: "residence1733",
          thesis: "Редкий формат для тех, кто выбирает камерность, адресность и сдержанную премиальную эстетику.",
          why: ["редкий формат", "камерность", "премиальный адрес"],
          facts: ["5–8 этажей", "Петровский остров", "рядом с Малой Невой"],
          suitable: "камерность · адресность · эстетика",
          cta: "Получить подборку по 17/33",
          backText: "Редкий формат для тех, кто выбирает камерность, адресность и сдержанную премиальную эстетику."
        }
      ];

      this.data.matrix = [
        { criterion: "Адрес", description: "Оцениваем статус локации, окружение, транспортную доступность, дефицит предложения и долгосрочную привлекательность адреса.", values: { life: 3, family: 2, investment: 3, status: 3 } },
        { criterion: "Архитектура", description: "Оцениваем выразительность проекта, качество концепции, материалы и соответствие ожиданиям премиального сегмента.", values: { life: 2, family: 2, investment: 2, status: 3 } },
        { criterion: "Приватность", description: "Учитываем камерность, плотность, закрытые пространства, сценарии входа и ощущение защищённой среды.", values: { life: 3, family: 3, investment: 2, status: 3 } },
        { criterion: "Исторический и культурный контекст", description: "Для Петербурга важно, как проект встроен в городскую ткань, архитектурное окружение и культурный маршрут района.", values: { life: 2, family: 2, investment: 2, status: 3 } },
        { criterion: "Видовые характеристики", description: "Оцениваем виды на воду, историческую застройку, зелёные зоны и редкость таких параметров на рынке.", values: { life: 2, family: 2, investment: 3, status: 3 } },
        { criterion: "Инфраструктура", description: "Смотрим на ежедневную логистику, школы, рестораны, сервисы, прогулочные маршруты и транспорт.", values: { life: 3, family: 3, investment: 2, status: 2 } },
        { criterion: "Ликвидность", description: "Оцениваем сочетание адреса, формата, архитектуры, редкости предложения и понятного спроса в будущем.", values: { life: 2, family: 2, investment: 3, status: 3 } },
        { criterion: "Редкость предложения", description: "Учитываем ограниченность предложения, малое количество аналогов и ценность формата для конкретного сценария покупки.", values: { life: 2, family: 2, investment: 3, status: 3 } }
      ];

      this.data.scenarios = {
        live: {
          label: "Для жизни",
          title: "Для жизни",
          text: "Подборка для тех, кто выбирает квартиру как основное городское пространство: ежедневный комфорт, транспортная логика, инфраструктура, приватность и качество среды.",
          districts: ["Петроградский", "Центральный", "Василеостровский", "Адмиралтейский"],
          projects: ["ЛДМ", "Аристократ", "Остров Первых"],
          cta: "Получить подборку для жизни",
          imageKey: "scenarioLive"
        },
        family: {
          label: "Для семьи",
          title: "Для семьи",
          text: "Подборка для покупателей, которым важны спокойная среда, прогулочные пространства, близость воды, школы, безопасность и удобный ежедневный маршрут.",
          districts: ["Василеостровский", "Адмиралтейский"],
          projects: ["Остров Первых", "Аристократ", "Манхэттен"],
          cta: "Получить семейную подборку",
          imageKey: "scenarioFamily"
        },
        invest: {
          label: "Для инвестиций",
          title: "Для инвестиций",
          text: "Подборка для тех, кто оценивает проект с точки зрения ликвидности, ограниченности предложения, архитектуры, перспективы района и потенциала сохранения капитала.",
          districts: ["Центральные локации", "Водные локации", "Новые премиальные кластеры Санкт-Петербурга"],
          projects: ["Фонтанка 130", "Визионер", "17/33", "Коллекционер"],
          cta: "Сравнить проекты как инвестицию",
          imageKey: "scenarioInvest"
        },
        capital: {
          label: "Для капитала / статуса",
          title: "Для капитала / статуса",
          text: "Подборка для покупателей, которым важны редкий адрес, приватность, архитектурная ценность, исторический или культурный контекст и долгосрочная репутация объекта.",
          districts: ["Исторический центр", "Петроградская сторона", "Камерные адреса у воды"],
          projects: ["Фонтанка 130", "Коллекционер", "ЛДМ", "17/33"],
          cta: "Получить статусную подборку",
          imageKey: "scenarioCapital"
        }
      };

      this.data.faq = [
        { q: "Каталог бесплатный?", a: "Да. Каталог можно получить после заявки. Эксперт также может подготовить индивидуальную подборку под ваш запрос." },
        { q: "Можно ли получить подборку без звонка?", a: "Да. Укажите удобный формат связи в заявке. Мы можем начать с сообщения и уточнить детали письменно." },
        { q: "Есть ли закрытые предложения?", a: "В отдельных проектах могут быть лоты или условия, которые уточняются индивидуально. Эксперт проверит доступность после запроса." },
        { q: "Можно ли сравнить проекты из каталога?", a: "Да. Мы можем сравнить Фонтанку 130, Манхэттен, ЛДМ, Коллекционер, Аристократ, Остров Первых, Визионер и 17/33 по ключевым критериям." },
        { q: "Можно ли подобрать проекты для семьи?", a: "Да. Для семейного сценария в приоритете Василеостровский и Адмиралтейский районы, а также проекты с подходящей средой, инфраструктурой и форматом планировок." },
        { q: "Можно ли оценить проекты как инвестицию?", a: "Да. Мы смотрим на ликвидность, редкость предложения, архитектуру, локацию, формат лота и перспективу района." },
        { q: "Как сохраняется конфиденциальность?", a: "Заявка передаётся напрямую команде BARNES. Мы не используем массовую рассылку и не передаём запрос в общий поток." }
      ];

      this.data.process = [
        { title: "Запрос", text: "Вы оставляете заявку и указываете базовые параметры: бюджет, район, проект и сценарий покупки." },
        { title: "Уточнение задачи", text: "Эксперт связывается с вами, чтобы понять приоритеты, ограничения и формат коммуникации." },
        { title: "Подборка", text: "Команда формирует короткий список проектов и лотов, которые соответствуют вашему запросу." },
        { title: "Сравнение", text: "Проекты сравниваются по адресу, архитектуре, приватности, ликвидности и сценарию жизни." },
        { title: "Приватный просмотр", text: "Организуем просмотр, уточняем условия и сопровождаем дальнейшие переговоры." }
      ];

      this.onboarding.steps = [
        {
          key: "scenario",
          label: "Цель",
          title: "С какой целью вы покупаете?",
          hint: "Выберите наиболее близкий вариант. Эксперт BARNES поможет уточнить детали позже.",
          options: [
            { id: "life", title: "Для жизни", description: "Подойдёт, если ваша цель — ежедневный комфорт и качество среды." },
            { id: "family", title: "Для семьи", description: "Подойдёт, если важны школы, безопасность и спокойный маршрут." },
            { id: "investment", title: "Для инвестиций", description: "Подойдёт, если вы оцениваете ликвидность и сохранение капитала." },
            { id: "status", title: "Для статуса", description: "Подойдёт, если важны редкий адрес, приватность и архитектура." }
          ]
        },
        { key: "budget", label: "Бюджет", title: "Какой бюджет рассматриваете?", hint: "Это поможет убрать нерелевантные проекты и оставить точный диапазон.", options: ["до 50 млн ₽", "50–100 млн ₽", "100–250 млн ₽", "250+ млн ₽", "Уточню с экспертом"] },
        { key: "district", label: "Район", title: "Какие районы интересны?", hint: "Можно выбрать район или оставить пространство для рекомендации.", options: ["Центральный", "Петроградский", "Василеостровский", "Адмиралтейский", "Московский", "Пока не знаю"] },
        { key: "project", label: "Проект", title: "Есть ли конкретный проект?", hint: "Выберите проект из каталога или оставьте пространство для рекомендации.", options: ["Фонтанка 130", "Манхэттен", "ЛДМ", "Коллекционер", "Аристократ", "Остров Первых", "Визионер", "17/33", "Уточню с экспертом"] },
        { key: "format", label: "Тип объекта", title: "Какой формат нужен?", hint: "Клубный дом, пентхаус, квартира с террасой или другой формат — можно уточнить позже.", options: ["Клубный дом", "Пентхаус", "Квартира с террасой", "Резиденция у воды", "Семейная квартира", "Инвестиционный лот", "Уточню с экспертом"] }
      ];
    },

    initHeader() {
      const header = this.nodes.header;
      if (!header) return;
      if (this.nodes.nav && !this.nodes.nav.querySelector("[data-header-close]")) {
        this.nodes.nav.insertAdjacentHTML("afterbegin", '<button class="bx-header__close" type="button" data-header-close aria-label="Закрыть меню"><span></span><span></span></button>');
      }
      const headerClose = this.nodes.nav?.querySelector("[data-header-close]");
      const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 20);
      const closeMenu = () => {
        header.classList.remove("is-open");
        document.body.classList.remove("bx-menu-lock");
        this.nodes.burger?.setAttribute("aria-expanded", "false");
      };
      const openMenu = () => {
        header.classList.add("is-open");
        document.body.classList.add("bx-menu-lock");
        this.nodes.burger?.setAttribute("aria-expanded", "true");
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });

      if (this.nodes.burger) {
        this.nodes.burger.addEventListener("click", (event) => {
          event.stopPropagation();
          if (header.classList.contains("is-open")) {
            closeMenu();
          } else {
            openMenu();
          }
        });
      }

      headerClose?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        closeMenu();
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMenu();
      });

      document.addEventListener("click", (event) => {
        if (!header.classList.contains("is-open")) return;
        if (!header.contains(event.target)) closeMenu();
      });

      header.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          closeMenu();
        });
      });
    },

    initScrollReveal() {
      const items = document.querySelectorAll("[data-reveal], [data-mask]");
      if (!items.length) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.18 });

      items.forEach((item) => {
        if (item.dataset.delay) item.style.transitionDelay = `${Number(item.dataset.delay) || 0}ms`;
        observer.observe(item);
      });
    },

    initLuxuryAtlasLayer() {
      this.enhanceSections();
      this.initHeroLuxuryReveal();
      this.initChapterTransitions();
      this.initScoreCounters();
      this.initActiveNavigation();
      this.initMethodologyFunnel();
      this.initFormStates();
    },

    enhanceSections() {
      const chapterMap = [
        ["hero", "Chapter 01 / Обложка", "bm-hero"],
        ["atlas", "Chapter 02 / Районы", "bm-districts"],
        ["inside", "Chapter 03 / Что внутри", "bm-overview-includes"],
        ["projects", "Chapter 04 / Проекты", "bm-projects"],
        ["methodology", "Chapter 05 / Методология", "bm-methodology"],
        ["pulse-title", "Chapter 06 / Пульс рынка", "bm-pulse"],
        ["scenario-title", "Chapter 07 / Сценарии покупки", "bm-scenarios"],
        ["advisor-title", "Chapter 08 / Private Advisory", "bm-advisor"],
        ["request", "Chapter 09 / Запрос каталога", "bm-request"],
        ["expert", "Chapter 10 / Эксперт", "bm-expert"],
        ["process-title", "Chapter 11 / Процесс", "bm-process"],
        ["faq-title", "Chapter 12 / FAQ", "bm-faq"],
        ["postfaq-title", "Chapter 13 / Финальный шаг", "bm-final-cta"]
      ];

      chapterMap.forEach(([target, chapter, className]) => {
        const section = target.endsWith("-title")
          ? document.getElementById(target)?.closest("section")
          : document.getElementById(target);
        if (!section) return;
        section.classList.add(className, "bm-chapter-section");
        section.dataset.chapter = chapter;
        if (section.querySelector(".bm-chapter-label")) return;
        const head = section.querySelector(".bx-section-head, .bx-hero__content, .bx-index__content, .bx-request__content, .bx-expert__content, .bx-postfaq-cta__content, .bx-footer__grid");
        if (!head) return;
        const label = document.createElement("div");
        label.className = "bm-chapter-label";
        label.innerHTML = `<span>${this.escape(chapter)}</span><i aria-hidden="true"></i>`;
        head.prepend(label);
      });
    },

    initHeroLuxuryReveal() {
      const hero = document.querySelector(".bx-hero");
      if (!hero) return;
      hero.classList.add("bm-hero-ready");
      if (this.reducedMotion) {
        hero.classList.add("bm-hero-visible");
        return;
      }
      requestAnimationFrame(() => {
        window.setTimeout(() => hero.classList.add("bm-hero-visible"), 80);
      });
    },

    initChapterTransitions() {
      const sections = document.querySelectorAll(".bm-chapter-section");
      if (!sections.length) return;
      if (this.reducedMotion) {
        sections.forEach((section) => section.classList.add("is-active"));
        return;
      }
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-active");
        });
      }, { threshold: 0.18, rootMargin: "0px 0px -12% 0px" });
      sections.forEach((section) => observer.observe(section));
    },

    initScoreCounters() {
      const score = document.querySelector(".bx-hero__score");
      if (!score) return;
      const hints = {
        "Адрес": "Статус адреса, окружение, транспорт и дефицит предложения.",
        "Архитектура": "Архитектурная ценность, качество проекта и долговечность визуального языка.",
        "Приватность": "Камерность, закрытые дворы, приватность входных групп и плотность среды.",
        "Ликвидность": "Сочетание адреса, девелопера, планировок, сроков и ограниченности предложения.",
        "Среда": "Инфраструктура, культурный контекст, сервисы и повседневный сценарий жизни."
      };
      score.querySelectorAll("dl div").forEach((item) => {
        const label = item.querySelector("dt")?.textContent.trim() || "";
        const value = item.querySelector("dd");
        if (!value) return;
        const target = parseFloat(value.textContent.replace(",", "."));
        item.tabIndex = 0;
        item.setAttribute("role", "button");
        item.setAttribute("aria-label", `${label}: ${target}. ${hints[label] || ""}`);
        item.dataset.scoreTarget = String(target);
        if (!item.querySelector(".bx-score-tip")) {
          const tip = document.createElement("span");
          tip.className = "bx-score-tip";
          tip.textContent = hints[label] || "";
          item.appendChild(tip);
        }
      });

      const run = () => {
        if (score.dataset.counted === "true") return;
        score.dataset.counted = "true";
        score.querySelectorAll("[data-score-target]").forEach((item) => {
          const value = item.querySelector("dd");
          const target = parseFloat(item.dataset.scoreTarget || "0");
          if (!value || !Number.isFinite(target)) return;
          if (this.reducedMotion) {
            value.textContent = target.toFixed(1);
            return;
          }
          const start = performance.now();
          const duration = 900;
          const tick = (now) => {
            const progress = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            value.textContent = (target * eased).toFixed(1);
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      };

      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          run();
          observer.disconnect();
        }
      }, { threshold: 0.35 });
      observer.observe(score);
    },

    initActiveNavigation() {
      const links = Array.from(document.querySelectorAll(".bx-header__nav a[href^='#']"));
      if (!links.length) return;
      const navItems = links
        .map((link) => {
          const hash = link.getAttribute("href") || "";
          const section = hash.startsWith("#") ? document.querySelector(hash) : null;
          return section ? { link, hash, section } : null;
        })
        .filter(Boolean);
      const sections = navItems.map((item) => item.section);
      if (!sections.length) return;
      const setActive = (id) => {
        links.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`));
      };
      const updateActive = () => {
        const headerHeight = this.nodes?.header?.offsetHeight || 76;
        const marker = window.scrollY + headerHeight + Math.min(window.innerHeight * 0.28, 260);
        const current = navItems.reduce((best, item) => {
          const top = item.section.getBoundingClientRect().top + window.scrollY;
          if (top <= marker && top >= best.top) return { id: item.section.id, top };
          return best;
        }, { id: navItems[0].section.id, top: -Infinity });
        setActive(current.id);
      };
      let ticking = false;
      const requestUpdate = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          updateActive();
        });
      };
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) requestUpdate();
      }, { threshold: [0.18, 0.32, 0.52], rootMargin: "-22% 0px -55% 0px" });
      sections.forEach((section) => observer.observe(section));
      links.forEach((link) => {
        link.addEventListener("click", () => {
          const hash = link.getAttribute("href") || "";
          if (hash.startsWith("#")) setActive(hash.slice(1));
        });
      });
      window.addEventListener("scroll", requestUpdate, { passive: true });
      window.addEventListener("resize", requestUpdate);
      window.setTimeout(updateActive, 80);
    },

    initSmoothAnchors() {
      let isHandlingAnchor = false;
      const anchorDuration = 1180;
      let lastAnchorHash = "";
      const getHash = (link) => {
        const raw = link.getAttribute("href") || "";
        if (raw.startsWith("#")) return raw;
        try {
          const url = new URL(raw, window.location.href);
          if (url.pathname === window.location.pathname && url.hash) return url.hash;
        } catch (_) {
          return "";
        }
        return "";
      };

      const getAnchor = (event) => {
        const target = event.target;
        if (target?.closest) return target.closest('a[href*="#"]');
        const path = typeof event.composedPath === "function" ? event.composedPath() : [];
        return path.find((node) => node?.matches?.('a[href*="#"]')) || null;
      };

      const handleAnchorClick = (event) => {
        if (isHandlingAnchor) return;
        const anchor = getAnchor(event);
        if (!anchor) return;
        if (anchor.closest?.("[data-bx-tilda-external-trigger]")) return;
        const hash = getHash(anchor);
        if (!hash || hash === "#") return;
        const isTildaFormHash = ["#bx-tilda-form", "#bx-request-popup", "#popup:catalog2026", "#popup:barnes-request"].includes(hash);
        const isConversionCta = Boolean(anchor.closest?.([
          "[data-source]:not([data-mobile-scroll])",
          "[data-project-request]",
          "[data-district-cta]",
          "[data-scenario-cta]",
          "[data-floating-lead-cta]"
        ].join(",")));
        if (this.shouldUseTildaNativeForm() && (isTildaFormHash || isConversionCta)) {
          const sourceBlock = anchor.dataset.source || anchor.dataset.projectRequest || anchor.dataset.districtCta || anchor.dataset.scenarioCta || "cta";
          const extra = {};
          if (anchor.dataset.projectRequest) {
            const projectId = anchor.dataset.projectRequest;
            extra.project = this.data.residences?.find((item) => item.id === projectId)?.title || projectId;
          }
          if (anchor.dataset.districtCta) {
            const districtId = anchor.dataset.districtCta;
            extra.district = this.data.districts?.find((item) => item.id === districtId)?.title || districtId;
          }
          if (anchor.dataset.scenarioCta) {
            const scenarioId = anchor.dataset.scenarioCta;
            extra.scenario = this.data.scenarios?.[scenarioId]?.title || scenarioId;
          }
          const preferredContactMethod = anchor.dataset.contactMethod || this.getContactMethodFromSource(sourceBlock);
          if (preferredContactMethod) extra.preferredContactMethod = preferredContactMethod;
          event.preventDefault();
          event.stopImmediatePropagation?.();
          event.stopPropagation();
          this.openRequestPopup(sourceBlock, extra);
          return;
        }
        const target = document.querySelector(hash);
        if (!target) return;
        event.preventDefault();
        event.stopImmediatePropagation?.();
        event.stopPropagation();
        isHandlingAnchor = true;
        const headerHeight = this.nodes?.header?.offsetHeight || 76;
        const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 32;
        this.nodes?.header?.classList.remove("is-open");
        document.body.classList.remove("bx-menu-lock");
        this.nodes?.burger?.setAttribute("aria-expanded", "false");
        lastAnchorHash = hash;
        document.querySelectorAll(".bx-header__nav a[href^='#']").forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === hash);
        });
        this.scrollToY(Math.max(0, top), anchorDuration);
        history.pushState(null, "", hash);
        window.setTimeout(() => {
          isHandlingAnchor = false;
        }, anchorDuration + 120);
      };

      window.addEventListener("click", handleAnchorClick, { capture: true });
      document.addEventListener("click", handleAnchorClick, true);
      window.addEventListener("hashchange", () => {
        const hash = window.location.hash;
        if (!hash || hash === lastAnchorHash) return;
        const target = document.querySelector(hash);
        if (!target) return;
        const headerHeight = this.nodes?.header?.offsetHeight || 76;
        const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 32;
        lastAnchorHash = hash;
        this.scrollToY(Math.max(0, top), anchorDuration);
      });
    },

    initGuidedSectionScroll() {
      return;
      if (this.reducedMotion) return;
      const sections = () => Array.from(document.querySelectorAll("main section[id], .bm-chapter-section, .bx-postfaq-cta, .bx-footer"))
        .filter((section) => section.offsetHeight > 80);
      let locked = false;
      let lastAt = 0;
      const isInteractiveScroll = (target) => Boolean(target.closest?.(".bx-option-grid, .bx-residences__grid, .bx-matrix__table, .bx-process__track, .bx-scenario__tabs, .bx-atlas__list, [data-bx-request-popup]"));
      window.addEventListener("wheel", (event) => {
        if (window.innerWidth < 768) return;
        if (Math.abs(event.deltaY) < 18 || locked) return;
        if (isInteractiveScroll(event.target)) return;
        if (document.body.classList.contains("bx-menu-lock") || document.body.classList.contains("bx-popup-lock")) return;
        const now = performance.now();
        if (now - lastAt < 850) return;
        const items = sections();
        if (!items.length) return;
        const headerHeight = this.nodes?.header?.offsetHeight || 76;
        const currentY = window.scrollY + headerHeight + 24;
        const currentIndex = items.reduce((best, section, index) => {
          const distance = Math.abs(section.offsetTop - currentY);
          return distance < best.distance ? { index, distance } : best;
        }, { index: 0, distance: Infinity }).index;
        const nextIndex = Math.max(0, Math.min(items.length - 1, currentIndex + (event.deltaY > 0 ? 1 : -1)));
        if (nextIndex === currentIndex) return;
        event.preventDefault();
        locked = true;
        lastAt = now;
        const targetTop = Math.max(0, items[nextIndex].offsetTop - headerHeight - 14);
        this.scrollToY(targetTop, 1350);
        window.setTimeout(() => {
          locked = false;
        }, 1420);
      }, { passive: false });
    },

    scrollToY(targetY, duration = 900) {
      if (this.scrollAnimationFrame) {
        cancelAnimationFrame(this.scrollAnimationFrame);
        this.scrollAnimationFrame = null;
      }
      if (!duration) {
        window.scrollTo(0, targetY);
        return;
      }
      const startY = window.scrollY;
      const distance = targetY - startY;
      const startedAt = performance.now();
      const ease = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
      const tick = (now) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        window.scrollTo(0, startY + distance * ease(progress));
        if (progress < 1) {
          this.scrollAnimationFrame = requestAnimationFrame(tick);
          return;
        }
        this.scrollAnimationFrame = null;
      };
      this.scrollAnimationFrame = requestAnimationFrame(tick);
    },

    initMethodologyFunnel() {
      const section = document.querySelector(".bx-matrix");
      const shell = section?.querySelector(".bx-matrix__shell");
      if (!section || !shell || section.querySelector(".bm-funnel")) return;
      const data = [
        ["40+", "проектов рынка"],
        ["20+", "проверены по критериям"],
        ["8", "проектов в каталоге"],
        ["Short-list", "под задачу клиента"]
      ];
      const funnel = document.createElement("div");
      funnel.className = "bm-funnel";
      funnel.setAttribute("aria-label", "Воронка отбора проектов BARNES");
      funnel.innerHTML = data.map(([value, label], index) => `
        <div class="bm-funnel__step" style="--i:${index}">
          <strong>${this.escape(value)}</strong>
          <span>${this.escape(label)}</span>
        </div>
      `).join("");
      shell.before(funnel);

      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          funnel.classList.add("is-visible");
          observer.disconnect();
        }
      }, { threshold: 0.35 });
      observer.observe(funnel);
    },

    initFormStates() {
      document.querySelectorAll(".bx-form input, .bx-form select").forEach((field) => {
        const update = () => field.classList.toggle("has-value", Boolean(field.value));
        field.addEventListener("input", update);
        field.addEventListener("change", update);
        update();
      });
    },

    initOnboarding() {
      this.onboarding.viewport = document.querySelector("[data-onboarding-viewport]");
      this.onboarding.counter = document.querySelector("[data-onboarding-counter]");
      this.onboarding.label = document.querySelector("[data-onboarding-label]");
      this.onboarding.progress = document.querySelector("[data-onboarding-progress]");
      this.onboarding.summary = document.querySelector("[data-onboarding-summary]");
      this.onboarding.prev = document.querySelector("[data-onboarding-prev]");
      this.onboarding.next = document.querySelector("[data-onboarding-next]");
      this.onboarding.sheetTrigger = document.querySelector("[data-onboarding-sheet-trigger]");
      this.onboarding.shell = document.querySelector(".bx-onboarding__shell");
      if (!this.onboarding.viewport) return;

      this.onboarding.prev?.addEventListener("click", () => this.goToStep(this.onboarding.step - 1));
      this.onboarding.next?.addEventListener("click", () => {
        if (!this.validateCurrentStep()) return;
        if (this.onboarding.step === this.onboarding.steps.length - 1) {
          this.submitOnboarding();
          return;
        }
        this.goToStep(this.onboarding.step + 1);
      });
      this.onboarding.sheetTrigger?.addEventListener("click", () => {
        const open = !this.onboarding.shell?.classList.contains("is-summary-open");
        this.onboarding.shell?.classList.toggle("is-summary-open", open);
        this.onboarding.sheetTrigger?.setAttribute("aria-expanded", String(open));
      });

      this.goToStep(0);
      this.updateSummary();
      this.track("onboarding_start");
      this.trackBarnesEvent({ interaction_type: "quiz_start" });
    },

    goToStep(index) {
      const max = this.onboarding.steps.length - 1;
      this.onboarding.step = Math.max(0, Math.min(index, max));
      const step = this.onboarding.steps[this.onboarding.step];
      this.onboarding.shell?.classList.remove("is-complete", "is-summary-open");
      this.onboarding.sheetTrigger?.setAttribute("aria-expanded", "false");
      this.renderOnboardingStep(step);
      this.updateProgress();
      this.updateSummary();
      this.track(`onboarding_step_${this.onboarding.step + 1}`);
    },

    renderOnboardingStep(step) {
      const isКонтакт = step.key === "contact";
      const options = step.options.map((option) => {
        const value = typeof option === "string" ? option : option.id;
        const title = typeof option === "string" ? option : option.title;
        const description = typeof option === "string" ? "" : option.description;
        const selected = this.state[step.key] === value;
        return `
          <button class="bx-option${selected ? " is-selected" : ""}" type="button" data-option-key="${step.key}" data-option-value="${this.escape(value)}" aria-pressed="${selected}">
            <i class="bx-option__check" aria-hidden="true"></i>
            <strong>${this.escape(title)}</strong>
            ${description ? `<span>${this.escape(description)}</span>` : ""}
          </button>
        `;
      }).join("");

      this.onboarding.viewport.innerHTML = `
        <div class="bx-step bx-step--motion">
          <div>
            <h3 class="bx-step__title">${this.escape(step.title)}</h3>
            <p class="bx-step__hint">${this.escape(step.hint)}</p>
          </div>
          ${isКонтакт ? this.renderКонтактStep() : `<div class="bx-option-grid">${options}</div>`}
        </div>
      `;

      this.onboarding.viewport.querySelectorAll("[data-option-key]").forEach((button) => {
        button.addEventListener("click", () => {
          this.selectOption(button.dataset.optionKey, button.dataset.optionValue);
        });
      });

      this.onboarding.viewport.querySelectorAll("input, select").forEach((field) => {
        field.addEventListener("input", () => {
          this.state[field.name] = field.value;
          this.updateSummary();
        });
      });

      const isLastStep = this.onboarding.step === this.onboarding.steps.length - 1;
      const hasStepValue = step.key === "contact" || Boolean(this.state[step.key]);
      if (this.onboarding.prev) this.onboarding.prev.disabled = this.onboarding.step === 0;
      if (this.onboarding.prev) this.onboarding.prev.textContent = "Назад";
      if (this.onboarding.next) {
        this.onboarding.next.textContent = isLastStep ? "Получить персональную подборку" : "Далее";
        this.onboarding.next.hidden = false;
        this.onboarding.next.disabled = !hasStepValue;
        this.onboarding.next.classList.toggle("is-disabled", !hasStepValue);
      }
      window.dispatchEvent(new CustomEvent("bx:onboarding:update"));
    },

    renderКонтактStep() {
      return `
        <div class="bx-contact-grid">
          <div class="bx-form__field">
            <label for="onboarding-name">Имя</label>
            <input id="onboarding-name" name="name" type="text" autocomplete="name" required value="${this.escape(this.state.name || "")}" />
          </div>
          <div class="bx-form__field">
            <label for="onboarding-phone">Контакт для связи</label>
            <input id="onboarding-phone" name="phone" type="tel" autocomplete="tel" required value="${this.escape(this.state.phone || "")}" />
          </div>
        </div>
      `;
    },

    selectOption(key, value) {
      this.state[key] = value;
      const label = this.getStateLabel(key, value) || value;
      this.syncHiddenField(`selected_${key}`, label);
      this.renderOnboardingStep(this.onboarding.steps[this.onboarding.step]);
      this.updateSummary();
      this.trackBarnesEvent({ interaction_type: "quiz_step_complete", step: key, value });
    },

    updateProgress() {
      const step = this.onboarding.step + 1;
      const total = this.onboarding.steps.length;
      const current = this.onboarding.steps[this.onboarding.step];
      if (this.onboarding.counter) this.onboarding.counter.textContent = `${String(step).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
      if (this.onboarding.label) this.onboarding.label.textContent = current.label;
      if (this.onboarding.progress) this.onboarding.progress.style.width = `${(step / total) * 100}%`;
    },

    updateSummary() {
      if (!this.onboarding.summary) return;
      const labels = [
        ["scenario", "Цель"],
        ["budget", "Бюджет"],
        ["district", "Район"],
        ["project", "Проект"],
        ["format", "Тип объекта"]
      ];
      this.onboarding.summary.innerHTML = labels.map(([key, label]) => `
        <div>
          <dt>${label}</dt>
          <dd>${this.escape(this.getStateLabel(key, this.state[key]) || "Не выбрано")}</dd>
        </div>
      `).join("");
      const selectedCount = labels.filter(([key]) => Boolean(this.state[key])).length;
      if (this.onboarding.sheetTrigger) {
        this.onboarding.sheetTrigger.textContent = `Ваш запрос: ${selectedCount} из ${labels.length} выбрано`;
      }
    },

    validateCurrentStep() {
      const step = this.onboarding.steps[this.onboarding.step];
      if (step.key !== "contact") {
        return Boolean(this.state[step.key]);
      }

      const fields = Array.from(this.onboarding.viewport.querySelectorAll("input[required]"));
      let valid = true;
      fields.forEach((field) => {
        const fieldValid = field.value.trim().length > 1;
        field.closest(".bx-form__field")?.classList.toggle("has-error", !fieldValid);
        field.setAttribute("aria-invalid", String(!fieldValid));
        valid = valid && fieldValid;
      });
      return valid;
    },

    submitOnboarding() {
      this.prepareRequestForm("onboarding");
      this.track("onboarding_complete", { ...this.state });
      this.track("lead_shortlist", { ...this.state });
      this.trackBarnesEvent({ interaction_type: "quiz_complete", ...this.state });
      this.renderOnboardingResult();
    },

    renderOnboardingResult() {
      const labels = [
        ["scenario", "Цель"],
        ["budget", "Бюджет"],
        ["district", "Район"],
        ["project", "Проект"],
        ["format", "Тип объекта"]
      ];
      const summary = labels.map(([key, label]) => `
        <div>
          <span>${this.escape(label)}</span>
          <strong>${this.escape(this.getStateLabel(key, this.state[key]) || "Не выбрано")}</strong>
        </div>
      `).join("");
      this.onboarding.shell?.classList.add("is-complete");
      this.onboarding.viewport.innerHTML = `
        <div class="bx-onboarding-result" role="status" aria-live="polite">
          <span>Ваш shortlist почти готов</span>
          <h3>Эксперт BARNES подготовит каталог и персональную подборку</h3>
          <p>Вы получите 16 проверенных проектов с планировками, бюджетами, сроками и комментариями по ликвидности. Эксперт отберёт только подходящие варианты под ваш запрос.</p>
          <div class="bx-onboarding-result__summary">${summary}</div>
          <div class="bx-onboarding-result__actions">
            <button class="bx-btn bx-btn--dark" type="button" data-onboarding-result-cta="catalog">Получить PDF-каталог</button>
            <button class="bx-btn bx-btn--light" type="button" data-onboarding-result-cta="expert">Передать запрос эксперту</button>
          </div>
        </div>
      `;
      this.onboarding.viewport.querySelectorAll("[data-onboarding-result-cta]").forEach((button) => {
        button.addEventListener("click", () => this.openCatalogPopup("onboarding_result"));
      });
      if (this.onboarding.prev) {
        this.onboarding.prev.disabled = false;
        this.onboarding.prev.textContent = "Изменить ответы";
      }
      if (this.onboarding.next) this.onboarding.next.hidden = true;
    },

    initAtlas() {
      const list = document.querySelector("[data-atlas-list]");
      if (!list) return;

      list.innerHTML = this.data.districts.map((district) => `
        <button class="bx-atlas__item" type="button" data-district="${district.id}">
          <span class="bx-atlas__thumb" aria-hidden="true">
            <img src="${this.escape(this.getImage(district.visual))}" alt="" loading="lazy" decoding="async">
          </span>
          <span class="bx-atlas__copy">
            <strong>${this.escape(district.title)}</strong>
            <span>${this.escape(district.scenario)}</span>
          </span>
        </button>
      `).join("");

      list.querySelectorAll("[data-district]").forEach((item) => {
        item.addEventListener("mouseenter", () => {
          this.setActiveРайон(item.dataset.district, false);
          this.track("atlas_hover", { district: item.dataset.district });
        });
        item.addEventListener("focus", () => this.setActiveРайон(item.dataset.district, false));
        item.addEventListener("click", () => this.setActiveРайон(item.dataset.district));
      });

      this.renderDistrictAccordion(list);
      this.setActiveРайон("central", false);
    },

    renderDistrictAccordion(list) {
      const grid = list.closest(".bx-atlas__grid");
      if (!grid) return;
      grid.querySelector("[data-atlas-mobile]")?.remove();

      const mobile = document.createElement("div");
      mobile.className = "bx-atlas-mobile";
      mobile.setAttribute("data-atlas-mobile", "");
      mobile.setAttribute("aria-label", "Районы Санкт-Петербурга");
      mobile.innerHTML = this.data.districts.map((district) => `
        <div class="bx-atlas-mobile__item" data-atlas-mobile-item="${district.id}">
          <button class="bx-atlas-mobile__trigger" type="button" data-district="${district.id}" aria-expanded="false" aria-controls="atlas-mobile-panel-${district.id}">
            <span class="bx-atlas-mobile__thumb" aria-hidden="true">
              <img src="${this.escape(this.getImage(district.visual))}" alt="" loading="lazy" decoding="async">
            </span>
            <span class="bx-atlas-mobile__copy">
              <strong>${this.escape(district.title)}</strong>
              <span>${this.escape(district.scenario)}</span>
            </span>
            <span class="bx-atlas-mobile__indicator" aria-hidden="true">+</span>
          </button>
          <div class="bx-atlas-mobile__panel" id="atlas-mobile-panel-${district.id}">
            <p class="bx-atlas-mobile__description">${this.escape(district.character)}</p>
            <div class="bx-atlas-mobile__projects">
              <span>Проекты</span>
              ${district.projects.map((project) => `<a href="#projects" data-district-project="${this.escape(project)}">${this.escape(project)}</a>`).join("")}
            </div>
            <a class="bx-btn bx-btn--dark bx-atlas-mobile__cta" href="${this.popupHref}" data-district-cta="${district.id}">${this.escape(district.cta)}</a>
            <button class="bx-atlas-mobile__map-toggle" type="button" data-district-map-toggle="${district.id}">Смотреть район на карте</button>
            <div class="bx-atlas-mobile__map" aria-hidden="true">
              <img src="${this.escape(this.getImage("atlasMap"))}" alt="Карта районов Санкт-Петербурга" loading="lazy" decoding="async">
              <span>${this.escape(district.title)}</span>
            </div>
          </div>
        </div>
      `).join("");

      list.after(mobile);
      mobile.querySelectorAll("[data-district]").forEach((trigger) => {
        trigger.addEventListener("click", () => {
          this.setActiveРайон(trigger.dataset.district);
          trigger.closest(".bx-atlas-mobile__item")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
      });
      mobile.querySelectorAll("[data-district-cta]").forEach((cta) => {
        cta.addEventListener("click", () => {
          const district = this.data.districts.find((item) => item.id === cta.dataset.districtCta);
          if (!district) return;
          this.prepareRequestForm("atlas", { district: district.title });
          this.track("lead_district", { district: district.id });
          this.trackBarnesEvent({ interaction_type: "district_cta_click", district: district.title });
        });
      });
      mobile.querySelectorAll("[data-district-project]").forEach((link) => {
        link.addEventListener("click", () => {
          this.trackBarnesEvent({ interaction_type: "district_project_click", project: link.dataset.districtProject });
        });
      });
      mobile.querySelectorAll("[data-district-map-toggle]").forEach((button) => {
        button.addEventListener("click", () => {
          const item = button.closest(".bx-atlas-mobile__item");
          const isOpen = item?.classList.toggle("is-map-open");
          button.textContent = isOpen ? "Скрыть карту" : "Смотреть район на карте";
          this.trackBarnesEvent({ interaction_type: "district_map_toggle", district: button.dataset.districtMapToggle, map_open: Boolean(isOpen) });
        });
      });
    },

    setActiveРайон(id, shouldTrack = true) {
      const district = this.data.districts.find((item) => item.id === id);
      if (!district) return;
      this.state.district = district.title;
      this.syncHiddenField("selected_district", district.title);

      document.querySelectorAll("[data-district]").forEach((item) => {
        const isActive = item.dataset.district === id;
        item.classList.toggle("is-active", isActive);
        if (item.tagName === "BUTTON") item.setAttribute("aria-pressed", String(isActive));
        if (item.classList.contains("bx-atlas-mobile__trigger")) {
          item.setAttribute("aria-expanded", String(isActive));
          item.querySelector(".bx-atlas-mobile__indicator").textContent = isActive ? "−" : "+";
          const mobileItem = item.closest(".bx-atlas-mobile__item");
          mobileItem?.classList.toggle("is-active", isActive);
          if (!isActive) {
            mobileItem?.classList.remove("is-map-open");
            const mapToggle = mobileItem?.querySelector("[data-district-map-toggle]");
            if (mapToggle) mapToggle.textContent = "Смотреть район на карте";
          }
        }
      });

      const activeListItem = document.querySelector(`.bx-atlas__list [data-district="${id}"]`);
      if (activeListItem && getComputedStyle(activeListItem).display !== "none") {
        activeListItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }

      this.renderРайонCard(district);
      if (shouldTrack) this.track("atlas_click", { district: id });
      if (shouldTrack) this.trackBarnesEvent({ interaction_type: "district_select", district: district.title });
    },

    renderРайонCard(district) {
      const card = document.querySelector("[data-atlas-card]");
      if (!card) return;
      card.scrollTop = 0;
      card.innerHTML = `
        <p class="bx-label">${this.escape(district.scenario)}</p>
        <h3>${this.escape(district.title)}</h3>
        <p>${this.escape(district.character)}</p>
        <p>${this.escape(district.suitable)}</p>
        <ul>${district.projects.map((project) => `<li>${this.escape(project)}</li>`).join("")}</ul>
        <a class="bx-btn bx-btn--dark" href="${this.popupHref}" data-district-cta="${district.id}">${this.escape(district.cta)}</a>
      `;
      card.querySelector("[data-district-cta]")?.addEventListener("click", () => {
        this.prepareRequestForm("atlas", { district: district.title });
        this.track("lead_district", { district: district.id });
        this.trackBarnesEvent({ interaction_type: "district_cta_click", district: district.title });
      });
    },

    initIndexContentsScroll() {
      const items = document.querySelectorAll("[data-index-item]");
      if (!items.length) return;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-active");
        });
      }, { threshold: 0.72 });
      items.forEach((item) => observer.observe(item));
    },

    initResidences() {
      const grid = document.querySelector("[data-residences-grid]");
      if (!grid) return;
      grid.innerHTML = this.data.residences.map((item) => `
        <article class="bx-residence-card" data-reveal data-project="${this.escape(item.id)}" tabindex="0" aria-expanded="false" aria-label="${this.escape(item.title)}. Нажмите, чтобы открыть детали проекта.">
          <div class="bx-residence-card__inner">
            <div class="bx-residence-card__face bx-residence-card__front">
              <figure class="bx-residence-card__image">
                <img src="${this.escape(this.getImage(item.imageKey))}" data-image-key="${this.escape(item.imageKey)}" alt="Премиальный жилой проект ${this.escape(item.title)} в Санкт-Петербурге" loading="lazy" decoding="async" />
              </figure>
              <div class="bx-residence-card__content">
                <h3>${this.escape(item.title)}</h3>
                <div class="bx-residence-card__meta">
                  <span>${this.escape(item.district)}</span>
                  <span>${this.escape(item.className)}</span>
                  <span>${this.escape(item.deadline)}</span>
                </div>
                <p>${this.escape(item.thesis)}</p>
                <div class="bx-residence-card__price">
                  <span>${this.escape(item.priceFrom || item.price)}</span>
                  <span>${this.escape(item.meterage || item.area)}</span>
                </div>
                <span class="bx-residence-card__hint">Подробнее</span>
              </div>
            </div>
            <div class="bx-residence-card__face bx-residence-card__back">
              <div class="bx-residence-card__overlay">
                <div class="bx-residence-card__back-top">
                  <p class="bx-label">Почему в обзоре</p>
                  <span class="bx-residence-card__badge">${this.escape(item.terms || "индивидуальные условия")}</span>
                </div>
                <h3>${this.escape(item.title)}</h3>
                <div class="bx-residence-card__stats">
                  <div><span>Цена от</span><strong>${this.escape(item.priceFrom || item.price || "по запросу")}</strong></div>
                  <div><span>Метраж</span><strong>${this.escape(item.meterage || "по запросу")}</strong></div>
                  <div><span>Срок</span><strong>${this.escape(item.deadline || "по запросу")}</strong></div>
                </div>
                <dl class="bx-residence-card__params">
                  <div><dt>Район</dt><dd>${this.escape(item.district)}</dd></div>
                  <div><dt>Класс</dt><dd>${this.escape(item.className)}</dd></div>
                  <div><dt>Адрес</dt><dd>${this.escape(item.accent || item.district)}</dd></div>
                  <div><dt>Формат</dt><dd>${this.escape(item.area)}</dd></div>
                </dl>
                <ul>${(item.facts || item.why).map((tag) => `<li>${this.escape(tag)}</li>`).join("")}</ul>
                <a class="bx-btn bx-btn--light bx-residence-card__cta" href="${this.popupHref}" data-project-request="${this.escape(item.id)}">${this.escape(item.cta || "Получить подборку по проекту")}</a>
              </div>
            </div>
          </div>
        </article>
      `).join("");

      grid.querySelectorAll("[data-project]").forEach((card) => {
        card.addEventListener("mouseenter", () => this.track("project_hover", { project: card.dataset.project }));
        card.addEventListener("click", (event) => {
          if (!window.matchMedia("(hover: none), (pointer: coarse), (max-width: 768px)").matches) return;
          if (event.target.closest("a, button")) return;
          const isFlipped = card.classList.toggle("is-flipped");
          card.setAttribute("aria-expanded", String(isFlipped));
        });
        card.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          if (event.target.closest("a, button")) return;
          event.preventDefault();
          const isFlipped = card.classList.toggle("is-flipped");
          card.setAttribute("aria-expanded", String(isFlipped));
        });
      });

      grid.querySelectorAll("[data-project-request]").forEach((link) => {
        link.addEventListener("click", () => {
          const projectId = link.dataset.projectRequest;
          const project = this.data.residences.find((item) => item.id === projectId)?.title || projectId;
          this.prepareRequestForm("project_card", { project });
          this.track("project_request", { project });
          this.track("lead_project_plan", { project });
          this.trackBarnesEvent({ interaction_type: "project_details_click", project });
        });
      });

      this.initScrollReveal();
    },

    initMatrix() {
      const table = document.querySelector("[data-matrix-table]");
      if (!table) return;
      const columns = [
        ["life", "Жизнь"],
        ["family", "Семья"],
        ["investment", "Инвестиции"],
        ["status", "Статус"]
      ];

      table.innerHTML = `
        <div class="bx-matrix__row">
          <div class="bx-matrix__cell bx-matrix__cell--head">Критерий</div>
          ${columns.map(([, label]) => `<div class="bx-matrix__cell bx-matrix__cell--head">${label}</div>`).join("")}
        </div>
        ${this.data.matrix.map((row, index) => `
          <button class="bx-matrix__row" type="button" data-matrix-row="${index}">
            <span class="bx-matrix__cell">${this.escape(row.criterion)}</span>
            <span class="bx-matrix__description">${this.escape(row.description)}</span>
            ${columns.map(([key, label]) => `
              <span class="bx-matrix__cell" data-matrix-column="${key}">
                <span class="bx-matrix-mobile-label">${label}</span>
                ${this.renderBars(row.values[key])}
              </span>
            `).join("")}
          </button>
        `).join("")}
      `;

      table.querySelectorAll("[data-matrix-row]").forEach((row) => {
        row.addEventListener("mouseenter", () => this.showCriterionInfo(Number(row.dataset.matrixRow)));
        row.addEventListener("focus", () => this.showCriterionInfo(Number(row.dataset.matrixRow)));
        row.addEventListener("click", () => this.showCriterionInfo(Number(row.dataset.matrixRow)));
      });

      this.renderMobileMethodology();
      this.showCriterionInfo(0);
    },

    renderMobileMethodology() {
      const shell = document.querySelector("#methodology .bx-matrix__shell");
      if (!shell || document.querySelector("[data-methodology-mobile]")) return;
      const priority = [
        {
          number: "01",
          title: "Адрес и среда",
          text: "Сначала смотрим локацию: статус, вода, исторический контекст, маршруты и окружение."
        },
        {
          number: "02",
          title: "Формат и приватность",
          text: "Проверяем камерность, входные сценарии, архитектуру, планировки и ощущение защищённой среды."
        },
        {
          number: "03",
          title: "Ликвидность",
          text: "Сравниваем редкость предложения, понятный спрос, дефицит и долгосрочную ценность адреса."
        }
      ];
      const details = this.data.matrix.map((item, index) => `
        <details class="bx-methodology-mobile__detail"${index === 0 ? " open" : ""}>
          <summary><span>${String(index + 1).padStart(2, "0")}</span>${this.escape(item.criterion)}</summary>
          <p>${this.escape(item.description)}</p>
        </details>
      `).join("");
      shell.insertAdjacentHTML("beforebegin", `
        <div class="bx-methodology-mobile" data-methodology-mobile>
          <div class="bx-methodology-mobile__intro">
            <span>Оценка BARNES</span>
            <h3>Методология в 3 шага</h3>
            <p>Мы не считаем баллы ради таблицы. Сначала отсеиваем слабые варианты, затем сравниваем адрес, формат и ликвидность под вашу задачу покупки.</p>
          </div>
          <div class="bx-methodology-mobile__cards">
            ${priority.map((item) => `
              <article>
                <span>${item.number}</span>
                <strong>${this.escape(item.title)}</strong>
                <p>${this.escape(item.text)}</p>
              </article>
            `).join("")}
          </div>
          <div class="bx-methodology-mobile__details">
            ${details}
          </div>
        </div>
      `);
    },

    renderBars(value) {
      return `<span class="bx-bars" aria-label="${value} из 3">${[1, 2, 3].map((item) => `<i class="${item <= value ? "is-filled" : ""}"></i>`).join("")}</span>`;
    },

    showCriterionInfo(index) {
      const row = this.data.matrix[index];
      const info = document.querySelector("[data-matrix-info]");
      if (!row || !info) return;
      document.querySelectorAll("[data-matrix-row]").forEach((item, itemIndex) => {
        item.classList.toggle("is-active", itemIndex === index);
      });
      info.innerHTML = `
        <p class="bx-label">Критерий</p>
        <h3>${this.escape(row.criterion)}</h3>
        <p>${this.escape(row.description)}</p>
      `;
    },

    initScenarios() {
      const tabs = document.querySelector("[data-scenario-tabs]");
      if (!tabs) return;
      tabs.innerHTML = Object.entries(this.data.scenarios).map(([key, scenario]) => `
        <button class="bx-scenario__tab" type="button" role="tab" aria-selected="false" aria-controls="scenario-panel" id="scenario-tab-${key}" data-scenario="${key}">
          ${this.escape(scenario.label)}
        </button>
      `).join("");
      this.renderScenarioAccordion(tabs);

      tabs.querySelectorAll("[data-scenario]").forEach((tab) => {
        tab.addEventListener("click", () => this.setActiveScenario(tab.dataset.scenario));
        tab.addEventListener("keydown", (event) => {
          if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
          event.preventDefault();
          const all = Array.from(tabs.querySelectorAll("[data-scenario]"));
          const current = all.indexOf(tab);
          const next = event.key === "ArrowRight" ? all[current + 1] || all[0] : all[current - 1] || all[all.length - 1];
          next.focus();
          this.setActiveScenario(next.dataset.scenario);
        });
      });

      this.setActiveScenario("live", false);
    },

    renderScenarioAccordion(tabs) {
      const grid = tabs.closest(".bx-scenario__grid");
      if (!grid) return;
      grid.querySelector("[data-scenario-mobile]")?.remove();

      const mobile = document.createElement("div");
      mobile.className = "bx-scenario-mobile";
      mobile.setAttribute("data-scenario-mobile", "");
      mobile.setAttribute("aria-label", "Сценарии покупки");
      mobile.innerHTML = Object.entries(this.data.scenarios).map(([key, scenario]) => `
        <div class="bx-scenario-mobile__item" data-scenario-item="${key}">
          <button class="bx-scenario-mobile__trigger" type="button" data-scenario="${key}" aria-expanded="false" aria-controls="scenario-mobile-panel-${key}">
            <span>${this.escape(scenario.label)}</span>
            <span class="bx-scenario-mobile__indicator" aria-hidden="true">+</span>
          </button>
          <div class="bx-scenario-mobile__panel" id="scenario-mobile-panel-${key}">
            <p class="bx-scenario-mobile__description">${this.escape(scenario.text)}</p>
            <div class="bx-scenario-mobile__meta">
              <span>Районы</span>
              <p>${scenario.districts.map(this.escape).join(" · ")}</p>
            </div>
            <div class="bx-scenario-mobile__meta">
              <span>Проекты</span>
              <p>${scenario.projects.map(this.escape).join(" · ")}</p>
            </div>
            <a class="bx-btn bx-btn--dark bx-scenario-mobile__cta" href="${this.popupHref}" data-scenario-cta="${key}">${this.escape(scenario.cta)}</a>
          </div>
        </div>
      `).join("");

      tabs.after(mobile);
      mobile.querySelectorAll("[data-scenario]").forEach((trigger) => {
        trigger.addEventListener("click", () => {
          this.setActiveScenario(trigger.dataset.scenario);
          trigger.closest(".bx-scenario-mobile__item")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
      });
      mobile.querySelectorAll("[data-scenario-cta]").forEach((cta) => {
        cta.addEventListener("click", () => {
          const scenario = this.data.scenarios[cta.dataset.scenarioCta];
          if (!scenario) return;
          this.prepareRequestForm("scenario", { scenario: scenario.title });
          this.trackBarnesEvent({ interaction_type: "scenario_cta_click", scenario: scenario.title });
        });
      });
    },

    setActiveScenario(key, shouldTrack = true) {
      const scenario = this.data.scenarios[key];
      const panel = document.querySelector("[data-scenario-panel]");
      const image = document.querySelector("[data-scenario-image]");
      if (!scenario || !panel) return;
      this.state.scenario = scenario.title;
      this.syncHiddenField("selected_scenario", scenario.title);

      document.querySelectorAll("[data-scenario]").forEach((tab) => {
        const active = tab.dataset.scenario === key;
        if (tab.getAttribute("role") === "tab") {
          tab.setAttribute("aria-selected", String(active));
          tab.tabIndex = active ? 0 : -1;
        }
        if (tab.classList.contains("bx-scenario-mobile__trigger")) {
          tab.setAttribute("aria-expanded", String(active));
          tab.querySelector(".bx-scenario-mobile__indicator").textContent = active ? "−" : "+";
          tab.closest(".bx-scenario-mobile__item")?.classList.toggle("is-active", active);
        }
      });

      panel.classList.remove("is-visible");
      panel.innerHTML = `
        <h3>${this.escape(scenario.title)}</h3>
        <p>${this.escape(scenario.text)}</p>
        <dl>
          <div><dt>Районы</dt><dd>${scenario.districts.map(this.escape).join(" · ")}</dd></div>
          <div><dt>Проекты</dt><dd>${scenario.projects.map(this.escape).join(" · ")}</dd></div>
        </dl>
        <a class="bx-btn bx-btn--dark" href="${this.popupHref}" data-scenario-cta="${key}">${this.escape(scenario.cta)}</a>
      `;
      panel.id = "scenario-panel";
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", `scenario-tab-${key}`);
      requestAnimationFrame(() => panel.classList.add("is-visible"));

      if (image) {
        image.src = this.getImage(scenario.imageKey) || image.src;
        image.dataset.imageKey = scenario.imageKey;
        image.alt = `Сценарий покупки: ${scenario.title}`;
      }

      panel.querySelector("[data-scenario-cta]")?.addEventListener("click", () => {
        this.prepareRequestForm("scenario", { scenario: scenario.title });
        this.trackBarnesEvent({ interaction_type: "scenario_cta_click", scenario: scenario.title });
      });

      if (shouldTrack) {
        this.track("scenario_click", { scenario: key });
        this.trackBarnesEvent({ interaction_type: "scenario_select", scenario: scenario.title });
      }
    },

    initFAQ() {
      const list = document.querySelector("[data-faq-list]");
      if (!list) return;
      list.innerHTML = this.data.faq.map((item, index) => `
        <article class="bx-faq__item">
          <button class="bx-faq__question" type="button" aria-expanded="false" aria-controls="faq-${index}">
            <span>${this.escape(item.q)}</span>
            <span aria-hidden="true"></span>
          </button>
          <div class="bx-faq__answer" id="faq-${index}">
            <p>${this.escape(item.a)}</p>
          </div>
        </article>
      `).join("");

      list.querySelectorAll(".bx-faq__question").forEach((button) => {
        button.addEventListener("click", () => {
          const expanded = button.getAttribute("aria-expanded") === "true";
          button.setAttribute("aria-expanded", String(!expanded));
          const answer = document.getElementById(button.getAttribute("aria-controls"));
          if (answer) answer.style.maxHeight = expanded ? "0px" : `${answer.scrollHeight}px`;
        });
      });
    },

    initForms() {
      this.nodes.forms.forEach((form) => {
        form.addEventListener("focusin", () => this.track("form_start", { form: form.dataset.form || "request" }), { once: true });
        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          this.captureFormSelections(form);
          this.prepareRequestForm(form.dataset.form || "request");
          this.trackBarnesEvent({ interaction_type: "form_submit_attempt", form: form.dataset.form || "request" });
          if (!this.validateForm(form)) return;
          const message = form.querySelector(".bx-form__message");
          const submit = form.querySelector('[type="submit"]');
          if (submit) submit.disabled = true;
          const sent = await this.sendLead(form);
          if (message) {
            message.textContent = sent
              ? "Запрос принят. Эксперт BARNES свяжется с вами и подготовит персональную подборку по вашему сценарию покупки."
              : "Не удалось отправить заявку автоматически. Попробуйте ещё раз или выберите другой способ связи.";
            message.classList.toggle("is-success", sent);
          }
          if (submit) submit.disabled = false;
          if (!sent) return;
          this.showInlineSuccess(form);
          this.track("form_submit", { form: form.dataset.form || "request", ...this.state });
          this.track("lead_index", { scenario: this.state.scenario, budget: this.state.budget, district: this.state.district });
          this.trackBarnesEvent({ interaction_type: "form_submit_success", form: form.dataset.form || "request" });
        });
      });
    },

    initCustomRequestPopup() {
      const popup = document.querySelector("[data-bx-request-popup]");
      if (!popup) return;
      const form = popup.querySelector("[data-bx-custom-form]");
      if (!form) return;

      popup.querySelectorAll("[data-bx-popup-close]").forEach((item) => {
        item.addEventListener("click", () => this.closeRequestPopup());
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !popup.hidden) this.closeRequestPopup();
      });

      form.querySelectorAll('[name="preferred_contact_method"]').forEach((field) => {
        field.addEventListener("change", () => {
          this.state.preferredContactMethod = field.value;
          this.updatePopupContactField(form);
        });
      });

      form.querySelector("[data-popup-next]")?.addEventListener("click", () => {
        if (!this.validatePopupStep(form, 1)) return;
        this.trackBarnesEvent({ interaction_type: "quiz_step_complete", form: "request_popup", step: 1 });
        this.setPopupStep(form, 2);
        form.querySelector('[name="scenario"], [name="budget"], [name="district"]')?.focus();
      });

      form.querySelector("[data-popup-back]")?.addEventListener("click", () => {
        this.setPopupStep(form, 1);
      });

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!this.validatePopupStep(form, 2)) return;

        const submit = form.querySelector('[type="submit"]');
        if (submit) submit.disabled = true;
        const data = new FormData(form);
        const methodRaw = data.get("preferred_contact_method") || this.state.preferredContactMethod || "phone_call";
        const method = this.contactMethods[methodRaw] ? methodRaw : "phone_call";
        data.set("preferred_contact_method", method);
        const meta = this.getContactMeta(method);
        const contactValue = String(data.get("preferred_contact_value") || "").trim();
        const contactLogin = meta.field === "login" ? String(data.get("contact_login") || "").trim() : "";
        data.set("preferred_contact_parameter", meta.parameter);
        data.set("phone", contactValue);
        data.set("preferred_contact_value", contactValue);
        data.set("contact_login", contactLogin);
        data.set("district", data.get("district") || this.state.district || "");
        data.set("format", this.state.format || data.get("format") || "");
        data.set("project", data.get("project") || this.state.project || "");
        data.set("source_block", this.state.sourceBlock || data.get("source_block") || "request_popup");
        data.set("form_source", "request_popup");
        data.set("lead_type", this.state.sourceBlock === "onboarding" ? "quiz" : "request");

        const message = form.querySelector(".bx-popup-form__message");
        if (message) {
          message.textContent = "";
          message.classList.remove("is-success");
        }
        const sent = await this.sendLeadData(data, { form: "request_popup" });
        if (message) {
          message.textContent = sent
            ? ""
            : "Не удалось отправить заявку автоматически. Попробуйте ещё раз или выберите другой способ связи.";
          message.classList.toggle("is-success", sent);
        }
        if (submit) submit.disabled = false;
        if (sent) {
          this.showPopupSuccess(form);
          this.trackBarnesEvent({ interaction_type: "quiz_complete", form: "request_popup" });
        }
      });

      this.updatePopupContactField(form);
      this.handlePopupHash();
      window.addEventListener("hashchange", () => this.handlePopupHash());
    },

    openRequestPopup(sourceBlock = "cta", extra = {}) {
      const popup = document.querySelector("[data-bx-request-popup]");
      const form = popup?.querySelector("[data-bx-custom-form]");
      this.prepareRequestForm(sourceBlock, extra);
      if (this.openTildaNativeForm(sourceBlock, extra)) return true;
      if (!popup || !form) return false;
      if (extra.preferredContactMethod) this.state.preferredContactMethod = extra.preferredContactMethod;
      this.syncPopupForm(form);
      this.resetPopupSuccess(form);
      this.setPopupStep(form, 1);
      popup.hidden = false;
      popup.setAttribute("aria-hidden", "false");
      document.body.classList.add("bx-popup-lock");
      window.setTimeout(() => popup.classList.add("is-open"), 20);
      window.setTimeout(() => form.querySelector('[name="preferred_contact_method"]:checked')?.focus(), 80);
      this.track("popup_open", { source_block: sourceBlock });
      this.trackBarnesEvent({ interaction_type: "popup_open", form: "request_popup", source_block: sourceBlock });
      return true;
    },

    closeRequestPopup() {
      const popup = document.querySelector("[data-bx-request-popup]");
      if (!popup) return;
      popup.classList.remove("is-open");
      popup.setAttribute("aria-hidden", "true");
      document.body.classList.remove("bx-popup-lock");
      window.setTimeout(() => {
        popup.hidden = true;
      }, 220);
      if (["#bx-request-popup", "#popup:barnes-request", "#popup:catalog2026"].includes(window.location.hash)) {
        history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`);
      }
    },

    handlePopupHash() {
      if (["#bx-request-popup", "#popup:barnes-request", "#popup:catalog2026"].includes(window.location.hash)) {
        this.openRequestPopup("hash");
      }
    },

    syncPopupForm(form) {
      const method = this.contactMethods[this.state.preferredContactMethod] ? this.state.preferredContactMethod : "phone_call";
      this.state.preferredContactMethod = method;
      const methodField = form.querySelector(`[name="preferred_contact_method"][value="${method}"]`);
      if (methodField) methodField.checked = true;
      this.syncPopupControl(form, "budget", this.state.budget);
      this.syncPopupControl(form, "scenario", this.getStateLabel("scenario", this.state.scenario) || this.state.scenario);
      this.setTildaRelayField(form, ["district"], this.state.district || "");
      this.setTildaRelayField(form, ["format"], this.state.format || "");
      this.setTildaRelayField(form, ["project"], this.state.project || "");
      this.setTildaRelayField(form, ["selected_district"], this.state.district || "");
      this.setTildaRelayField(form, ["selected_format"], this.state.format || "");
      this.setTildaRelayField(form, ["selected_project"], this.state.project || "");
      this.setTildaRelayField(form, ["selected_project_id"], this.getProjectId(this.state.project || ""));
      this.setTildaRelayField(form, ["quiz_summary"], this.buildLeadComment({
        scenario: this.state.scenario || "",
        budget: this.state.budget || "",
        district: this.state.district || "",
        format: this.state.format || "",
        project: this.state.project || "",
        source_block: this.state.sourceBlock || "request_popup",
        preferred_contact_method: method
      }));
      this.setTildaRelayField(form, ["source_block"], this.state.sourceBlock || "request_popup");
      this.setTildaRelayField(form, ["form_source"], "request_popup");
      this.setTildaRelayField(form, ["page_url"], window.location.href);
      this.setTildaRelayField(form, ["page_title"], document.title || "");
      this.setTildaRelayField(form, ["client_id"], this.getClientId());
      if (this.ymClientId) this.setTildaRelayField(form, ["ym_client_id"], this.ymClientId);
      this.updatePopupContactField(form);
    },

    syncPopupControl(form, name, value) {
      if (!value) return;
      const field = form.querySelector(`[name="${name}"]`);
      if (!field) return;
      if (field.tagName === "SELECT") {
        const match = Array.from(field.options).find((option) => option.value === value || option.textContent.trim() === value);
        if (!match) return;
        field.value = match.value || match.textContent.trim();
      } else {
        field.value = value;
      }
    },

    updatePopupContactField(form) {
      const methodRaw = form.querySelector('[name="preferred_contact_method"]:checked')?.value || this.state.preferredContactMethod || "phone_call";
      const method = this.contactMethods[methodRaw] ? methodRaw : "phone_call";
      const meta = this.getContactMeta(method);
      const label = form.querySelector("[data-popup-contact-label]");
      const input = form.querySelector("[data-popup-contact-input]");
      const loginField = form.querySelector("[data-popup-login-field]");
      const loginLabel = form.querySelector("[data-popup-login-label]");
      const loginInput = form.querySelector("[data-popup-login-input]");
      const needsLogin = meta.field === "login";
      this.state.preferredContactMethod = method;
      if (label) label.textContent = method === "whatsapp" ? "Телефон для WhatsApp" : "Телефон";
      if (input) {
        input.type = "tel";
        input.autocomplete = "tel";
        input.inputMode = "tel";
        input.placeholder = "+7";
      }
      if (loginField) loginField.hidden = !needsLogin;
      if (loginLabel) loginLabel.textContent = meta.loginLabel || meta.inputLabel || "Ник в мессенджере";
      if (loginInput) {
        loginInput.required = needsLogin;
        loginInput.placeholder = needsLogin ? meta.placeholder : "";
        if (!needsLogin) loginInput.value = "";
      }
      this.setTildaRelayField(form, ["preferred_contact_parameter"], meta.parameter);
    },

    setPopupStep(form, step) {
      form.querySelectorAll("[data-popup-step]").forEach((item) => {
        const active = item.dataset.popupStep === String(step);
        item.hidden = !active;
        item.classList.toggle("is-active", active);
      });
      const message = form.querySelector(".bx-popup-form__message");
      if (message) message.textContent = "";
    },

    resetPopupSuccess(form) {
      if (!form) return;
      form.hidden = false;
      form.classList.remove("is-success");
      form.querySelector(".bx-popup-form__message")?.classList.remove("is-success");
      const success = form.closest(".bx-request-popup__panel")?.querySelector("[data-bx-popup-success]");
      if (success) success.hidden = true;
    },

    showPopupSuccess(form) {
      const panel = form?.closest(".bx-request-popup__panel");
      if (!form || !panel) return;
      let success = panel.querySelector("[data-bx-popup-success]");
      if (!success) {
        success = document.createElement("div");
        success.className = "bx-popup-success";
        success.setAttribute("data-bx-popup-success", "");
        success.setAttribute("role", "status");
        success.setAttribute("aria-live", "polite");
        panel.appendChild(success);
      }
      success.innerHTML = `
        <span>Запрос принят</span>
        <h3>Эксперт BARNES получил ваш запрос</h3>
        <p>Мы сверим бюджет, сценарий покупки, интересующий проект и удобный способ связи. Следующий шаг — короткое уточнение деталей и персональная подборка.</p>
        <button class="bx-btn bx-btn--dark" type="button" data-bx-popup-close>Хорошо</button>
      `;
      form.hidden = true;
      form.classList.add("is-success");
      success.hidden = false;
      success.querySelector("[data-bx-popup-close]")?.addEventListener("click", () => this.closeRequestPopup(), { once: true });
      success.querySelector("button")?.focus();
    },

    showInlineSuccess(form) {
      if (!form) return;
      let success = form.querySelector("[data-bx-form-success]");
      if (!success) {
        success = document.createElement("div");
        success.className = "bx-form-success";
        success.setAttribute("data-bx-form-success", "");
        success.setAttribute("role", "status");
        success.setAttribute("aria-live", "polite");
        form.appendChild(success);
      }
      success.innerHTML = `
        <span>Запрос принят</span>
        <strong>Эксперт BARNES свяжется с вами и подготовит персональную подборку.</strong>
        <p>Данные переданы напрямую команде BARNES Saint Petersburg. Мы уточним детали индивидуально, без массовой рассылки.</p>
      `;
      form.classList.add("is-success");
    },

    validatePopupStep(form, step) {
      const message = form.querySelector(".bx-popup-form__message");
      const setError = (field, hasError) => {
        field?.closest(".bx-popup-form__field, .bx-contact-methods")?.classList.toggle("has-error", hasError);
        field?.setAttribute("aria-invalid", String(hasError));
      };
      let valid = true;

      if (step === 1) {
        const method = form.querySelector('[name="preferred_contact_method"]:checked');
        const name = form.querySelector('[name="name"]');
        const contact = form.querySelector("[data-popup-contact-input]");
        const login = form.querySelector("[data-popup-login-input]");
        const methodRaw = method?.value || "phone_call";
        const meta = this.getContactMeta(this.contactMethods[methodRaw] ? methodRaw : "phone_call");
        const contactValue = contact?.value.trim() || "";
        const loginValue = login?.value.trim() || "";
        const nameOk = Boolean(name?.value.trim());
        const phoneOk = contactValue.replace(/\D/g, "").length >= 7 && !this.isFakePhone(contactValue);
        const loginOk = meta.field !== "login" || loginValue.length > 1;
        valid = Boolean(method) && nameOk && phoneOk && loginOk;
        setError(name, !nameOk);
        setError(contact, !phoneOk);
        setError(login, !loginOk);
        form.querySelector(".bx-contact-methods")?.classList.toggle("has-error", !method);
      } else {
        valid = true;
      }

      if (!valid && message) {
        message.textContent = "Проверьте имя и контакт — кажется, не хватает данных.";
        message.classList.remove("is-success");
      }
      return valid;
    },

    captureFormSelections(form) {
      const budget = form.querySelector('[name="budget"]')?.value;
      const scenario = form.querySelector('[name="scenario"]')?.value;
      const district = form.querySelector('[name="district"]')?.value;
      const project = form.querySelector('[name="project"]')?.value;
      const format = form.querySelector('[name="format"]')?.value;
      if (budget) this.state.budget = budget;
      if (scenario) this.state.scenario = scenario;
      if (district) this.state.district = district;
      if (project) this.state.project = project;
      if (format) this.state.format = format;
    },

    async sendLead(form) {
      const data = new FormData(form);
      const scenario = this.getStateLabel("scenario", this.state.scenario) || this.state.scenario || data.get("scenario") || "";
      data.set("scenario", scenario);
      data.set("budget", this.state.budget || data.get("budget") || "");
      data.set("district", this.state.district || data.get("district") || "");
      data.set("project", this.state.project || data.get("project") || "");
      data.set("format", this.state.format || data.get("format") || "");
      data.set("page_url", window.location.href);
      data.set("selected_scenario", scenario);
      data.set("selected_budget", this.state.budget || data.get("budget") || "");
      data.set("selected_district", this.state.district || data.get("district") || "");
      data.set("selected_format", this.state.format || data.get("format") || "");
      data.set("selected_project", this.state.project || data.get("project") || "");
      data.set("source_block", this.state.sourceBlock || form.dataset.form || "request");
      data.set("lead_type", data.get("lead_type") || "request");
      return this.sendLeadData(data, { form: form.dataset.form || "request" });
    },

    sendOnboardingLead() {
      const data = new FormData();
      data.set("name", this.state.name || "");
      data.set("phone", this.state.phone || "");
      data.set("scenario", this.getStateLabel("scenario", this.state.scenario) || this.state.scenario || "");
      data.set("budget", this.state.budget || "");
      data.set("district", this.getStateLabel("district", this.state.district) || this.state.district || "");
      data.set("project", this.state.project || "");
      data.set("format", this.state.format || "");
      data.set("page_url", window.location.href);
      data.set("selected_scenario", this.getStateLabel("scenario", this.state.scenario) || this.state.scenario || "");
      data.set("selected_budget", this.state.budget || "");
      data.set("selected_district", this.getStateLabel("district", this.state.district) || this.state.district || "");
      data.set("selected_format", this.state.format || "");
      data.set("selected_project", this.state.project || "");
      data.set("source_block", "onboarding");
      data.set("lead_type", "quiz");
      this.sendLeadData(data, { form: "onboarding", leadType: "quiz" });
    },

    async sendLeadData(data, options = {}) {
      const payload = this.prepareLeadPayload(data, options);
      this.preparePopupPayload(Object.fromEntries(payload.entries()));
      if (this.shouldUseTildaNativeForm()) {
        this.prepareTildaNativeForm(payload, options.sourceBlock || payload.get("source_block") || options.form || "request");
        this.track("form_submit", { form: "tilda_native", source_block: payload.get("source_block") });
        this.trackBarnesEvent({
          interaction_type: "tilda_form_payload_ready",
          form: "tilda_native",
          source_block: payload.get("source_block")
        });
        return true;
      }
      this.trackBarnesEvent({
        interaction_type: "form_submit_attempt",
        form: options.form || payload.get("form_source") || "request_popup"
      });
      const sent = await this.postLeadPayload(payload);
      if (sent) {
        const formName = options.form || payload.get("form_source") || "request_popup";
        this.track("form_submit", { form: formName, source_block: payload.get("source_block") });
        this.track("form_submit_success", { form: formName, source_block: payload.get("source_block") });
        this.trackBarnesEvent({ interaction_type: "form_submit_success", form: formName });
        if (payload.get("lead_type") === "quiz") {
          this.trackBarnesEvent({ interaction_type: "quiz_complete", form: formName });
        }
      }
      return sent;
    },

    prepareLeadPayload(data, options = {}) {
      const incoming = data instanceof FormData || data instanceof URLSearchParams ? data : new FormData();
      if (!(data instanceof FormData) && !(data instanceof URLSearchParams) && data && typeof data === "object") {
        Object.entries(data).forEach(([key, value]) => incoming.set(key, value ?? ""));
      }
      const get = (key) => String(incoming.get(key) || "").trim();
      const payload = new URLSearchParams();
      const set = (key, value) => payload.set(key, String(value ?? ""));
      const params = new URLSearchParams(window.location.search);

      const sourceBlock = options.sourceBlock || get("source_block") || this.state.sourceBlock || "request_popup";
      const formSource = options.form || get("form_source") || sourceBlock || "request_popup";
      const methodRaw = get("preferred_contact_method") || this.state.preferredContactMethod || "phone_call";
      const method = this.contactMethods[methodRaw] ? methodRaw : "phone_call";
      const contactMeta = this.getContactMeta(method);
      const scenario = get("scenario") || this.getStateLabel("scenario", this.state.scenario) || this.state.scenario || "";
      const budget = get("budget") || this.state.budget || "";
      const district = get("district") || this.state.district || "";
      const format = get("format") || this.state.format || "";
      const project = get("project") || this.state.project || "";
      const preferredValue = get("preferred_contact_value") || get("phone") || "";
      const phone = preferredValue;
      const contactLogin = contactMeta.field === "login" ? get("contact_login") : "";
      const leadType = options.leadType || get("lead_type") || (sourceBlock === "onboarding" ? "quiz" : "request");

      set("name", get("name") || this.state.name || "");
      set("phone", phone);
      set("contact_login", contactLogin);
      set("preferred_contact_method", method);
      set("preferred_contact_value", preferredValue);
      set("preferred_contact_parameter", contactMeta.parameter);
      set("scenario", scenario);
      set("budget", budget);
      set("district", district);
      set("format", format);
      set("project", project);
      set("selected_scenario", get("selected_scenario") || scenario);
      set("selected_budget", get("selected_budget") || budget);
      set("selected_district", get("selected_district") || district);
      set("selected_format", get("selected_format") || format);
      set("selected_project", get("selected_project") || project);
      set("selected_project_id", get("selected_project_id") || this.getProjectId(project));
      set("lead_type", leadType);
      set("source_block", sourceBlock);
      set("form_source", formSource);
      set("page_url", get("page_url") || window.location.href);
      set("page_title", get("page_title") || document.title || "");
      set("submitted_at", new Date().toISOString());
      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "yclid", "rsya_placement", "rsya_source_type", "rsya_position_type"].forEach((key) => {
        set(key, get(key) || params.get(key) || "");
      });
      set("ym_client_id", get("ym_client_id") || this.ymClientId || "");
      set("client_id", get("client_id") || this.getClientId());

      const values = Object.fromEntries(payload.entries());
      const comment = this.buildLeadComment(values);
      set("quiz_summary", get("quiz_summary") || comment);
      set("comment", comment);
      set("COMMENTS", comment);
      return payload;
    },

    async postLeadPayload(payload) {
      const body = payload.toString();
      try {
        const response = await fetch(this.webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
          },
          body,
          mode: "cors",
          keepalive: true
        });
        if (!response.ok && response.type !== "opaque") {
          throw new Error(`Webhook status ${response.status}`);
        }
        return true;
      } catch (error) {
        this.debugRelay("webhook_fetch_error", { message: error?.message || String(error) });
        return this.submitWebhookIframe(payload);
      }
    },

    submitWebhookIframe(payload) {
      try {
        const iframeName = "bx-webhook-frame";
        let iframe = document.querySelector(`iframe[name="${iframeName}"]`);
        if (!iframe) {
          iframe = document.createElement("iframe");
          iframe.name = iframeName;
          iframe.hidden = true;
          iframe.style.display = "none";
          iframe.setAttribute("aria-hidden", "true");
          document.body.appendChild(iframe);
        }

        const form = document.createElement("form");
        form.method = "POST";
        form.action = this.webhookUrl;
        form.target = iframeName;
        form.enctype = "application/x-www-form-urlencoded";
        form.style.display = "none";
        payload.forEach((value, key) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        window.setTimeout(() => form.remove(), 1800);
        this.debugRelay("webhook_iframe_submit", { fields: Array.from(payload.keys()) });
        return true;
      } catch (error) {
        this.debugRelay("webhook_iframe_error", { message: error?.message || String(error) });
        return false;
      }
    },

    submitTildaRelayForm(data) {
      const form = this.findTildaRelayForm();
      this.debugRelay("found_form", {
        found: Boolean(form),
        forms: document.querySelectorAll("form.t-form, form.js-form-proccess").length
      });
      if (!form) return false;

      const values = Object.fromEntries(data.entries());
      const fieldMap = {
        name: ["name", "Name", "NAME", "Имя"],
        phone: ["phone", "Phone", "PHONE", "Телефон", "Контакт для связи", "tel"],
        budget: ["budget", "Budget", "Бюджет"],
        scenario: ["scenario", "Scenario", "Сценарий"],
        district: ["district", "District", "Район"],
        project: ["project", "Project", "Проект"],
        format: ["format", "Format", "Формат"],
        page_url: ["page_url", "Page URL", "URL"],
        utm_source: ["utm_source"],
        utm_medium: ["utm_medium"],
        utm_campaign: ["utm_campaign"],
        utm_content: ["utm_content"],
        utm_term: ["utm_term"],
        selected_scenario: ["selected_scenario"],
        selected_budget: ["selected_budget"],
        selected_district: ["selected_district"],
        selected_format: ["selected_format"],
        selected_project: ["selected_project"],
        selected_project_id: ["selected_project_id"],
        source_block: ["source_block"],
        lead_type: ["lead_type"],
        preferred_contact_method: ["preferred_contact_method"],
        preferred_contact_value: ["preferred_contact_value"],
        preferred_contact_parameter: ["preferred_contact_parameter"],
        contact_login: ["contact_login"],
        comment: ["comment"],
        COMMENTS: ["COMMENTS"]
      };

      Object.entries(values).forEach(([key, value]) => {
        this.setTildaRelayField(form, fieldMap[key] || [key], value);
      });
      const comment = this.buildLeadComment(values);
      this.setTildaRelayField(form, ["comment"], comment);
      this.setTildaRelayField(form, ["COMMENTS"], comment);
      this.setTildaRelayField(form, ["comments", "Comments", "Комментарий"], comment);

      form.dataset.bxRelaySubmitting = "true";
      this.debugRelay("prepared_form", {
        action: form.getAttribute("action") || "https://forms.tildacdn.com/procces/",
        method: form.getAttribute("method") || "POST",
        fields: Array.from(new FormData(form).keys()),
        hasFormservices: Array.from(new FormData(form).keys()).some((key) => key.indexOf("formservices") !== -1)
      });

      const nativeSubmitted = this.submitTildaNative(form);
      window.setTimeout(() => this.submitTildaRelayIframe(form), nativeSubmitted ? 900 : 0);
      window.setTimeout(() => delete form.dataset.bxRelaySubmitting, 1800);
      return true;

      const submit = form.querySelector('button[type="submit"], input[type="submit"], .t-submit');
      if (submit) {
        submit.click();
      } else if (typeof form.requestSubmit === "function") {
        form.requestSubmit();
      } else {
        form.submit();
      }
      window.setTimeout(() => delete form.dataset.bxRelaySubmitting, 1200);
      return true;
    },

    initTildaFormBridge() {
      if (!window.BX_USE_TILDA_FORM) return;
      const form = this.findTildaRelayForm();
      document.body.classList.toggle("bx-use-tilda-form", Boolean(form));
      if (!this.tildaBridgeClickBound) {
        this.tildaBridgeClickBound = true;
        window.addEventListener("click", (event) => {
          if (!this.shouldUseTildaNativeForm()) return;
          const eventTarget = event.target?.nodeType === 1 ? event.target : event.target?.parentElement;
          if (eventTarget?.closest?.("[data-bx-tilda-external-trigger]")) return;
          const trigger = eventTarget?.closest?.([
            "[data-source]:not([data-mobile-scroll])",
            "[data-project-request]",
            "[data-district-cta]",
            "[data-scenario-cta]",
            "[data-floating-lead-cta]",
            'a[href="#bx-tilda-form"]',
            'a[href="#bx-request-popup"]',
            'a[href="#popup:catalog2026"]',
            'a[href="#popup:barnes-request"]'
          ].join(","));
          if (!trigger || trigger.closest?.("[data-bx-request-popup]")) return;
          const sourceBlock = trigger.dataset.source || trigger.dataset.projectRequest || trigger.dataset.districtCta || trigger.dataset.scenarioCta || "cta";
          const extra = {};
          if (trigger.dataset.projectRequest) {
            const projectId = trigger.dataset.projectRequest;
            extra.project = this.data.residences?.find((item) => item.id === projectId)?.title || projectId;
          }
          if (trigger.dataset.districtCta) {
            const districtId = trigger.dataset.districtCta;
            extra.district = this.data.districts?.find((item) => item.id === districtId)?.title || districtId;
          }
          if (trigger.dataset.scenarioCta) {
            const scenarioId = trigger.dataset.scenarioCta;
            extra.scenario = this.data.scenarios?.[scenarioId]?.title || scenarioId;
          }
          const preferredContactMethod = trigger.dataset.contactMethod || this.getContactMethodFromSource(sourceBlock);
          if (preferredContactMethod) extra.preferredContactMethod = preferredContactMethod;
          event.preventDefault();
          event.stopImmediatePropagation();
          this.openRequestPopup(sourceBlock, extra);
        }, true);
      }
      if (!form || form.dataset.bxTildaBridge === "true") return;
      form.dataset.bxTildaBridge = "true";
      form.setAttribute("data-bx-tilda-form", "true");
      form.addEventListener("focusin", () => {
        this.prepareTildaNativeForm(null, this.state.sourceBlock || "tilda_form_focus");
        this.track("form_start", { form: "tilda_native" });
      }, { once: true });
      form.addEventListener("submit", () => {
        this.prepareTildaNativeForm(null, this.state.sourceBlock || "tilda_native_submit");
        this.track("form_submit", { form: "tilda_native", source_block: this.state.sourceBlock || "tilda_native_submit" });
        this.trackBarnesEvent({
          interaction_type: "tilda_native_submit",
          form: "tilda_native",
          source_block: this.state.sourceBlock || "tilda_native_submit"
        });
      }, true);
    },

    shouldUseTildaNativeForm() {
      if (!window.BX_USE_TILDA_FORM) return false;
      return Boolean(this.findTildaRelayForm() || this.findTildaFormTarget() || this.findTildaFormTrigger());
    },

    openTildaNativeForm(sourceBlock = "cta", extra = {}) {
      if (!this.shouldUseTildaNativeForm()) return false;
      if (extra.preferredContactMethod) this.state.preferredContactMethod = extra.preferredContactMethod;
      const payload = this.prepareTildaNativeForm(null, sourceBlock);
      if (!this.openTildaPopupOrScroll()) return false;
      window.setTimeout(() => this.syncTildaPopupCopy(), 80);
      window.setTimeout(() => this.syncTildaPopupCopy(), 420);
      this.track("tilda_form_open", { source_block: sourceBlock });
      this.trackBarnesEvent({
        interaction_type: "tilda_form_open",
        form: "tilda_native",
        source_block: sourceBlock,
        project: payload?.get?.("project") || this.state.project || "",
        district: payload?.get?.("district") || this.state.district || "",
        scenario: payload?.get?.("scenario") || this.state.scenario || ""
      });
      return true;
    },

    prepareTildaNativeForm(payload = null, sourceBlock = "cta") {
      const form = this.findTildaRelayForm();
      if (!form) return null;
      const data = payload || this.prepareLeadPayload(new FormData(form), { form: "tilda_native", sourceBlock });
      const values = Object.fromEntries(data.entries());
      const fieldMap = {
        name: ["name", "Name", "NAME", "Имя"],
        phone: ["phone", "Phone", "PHONE", "Телефон", "Контакт для связи", "tel"],
        budget: ["budget", "Budget", "Бюджет"],
        scenario: ["scenario", "Scenario", "Сценарий", "Сценарий покупки"],
        district: ["district", "District", "Район"],
        project: ["project", "Project", "Проект", "Интересующий проект"],
        format: ["format", "Format", "Формат", "Тип объекта"],
        page_url: ["page_url", "Page URL", "URL"],
        page_title: ["page_title"],
        selected_scenario: ["selected_scenario"],
        selected_budget: ["selected_budget"],
        selected_district: ["selected_district"],
        selected_format: ["selected_format"],
        selected_project: ["selected_project"],
        selected_project_id: ["selected_project_id"],
        source_block: ["source_block"],
        form_source: ["form_source"],
        lead_type: ["lead_type"],
        preferred_contact_method: ["preferred_contact_method"],
        preferred_contact_value: ["preferred_contact_value"],
        preferred_contact_parameter: ["preferred_contact_parameter"],
        contact_login: ["contact_login"],
        client_id: ["client_id"],
        ym_client_id: ["ym_client_id"],
        yclid: ["yclid"],
        rsya_placement: ["rsya_placement"],
        rsya_source_type: ["rsya_source_type"],
        rsya_position_type: ["rsya_position_type"],
        utm_source: ["utm_source"],
        utm_medium: ["utm_medium"],
        utm_campaign: ["utm_campaign"],
        utm_content: ["utm_content"],
        utm_term: ["utm_term"],
        quiz_summary: ["quiz_summary"],
        comment: ["comment", "comments", "Comments", "Комментарий"],
        COMMENTS: ["COMMENTS"]
      };

      Object.entries(values).forEach(([key, value]) => {
        this.setTildaRelayField(form, fieldMap[key] || [key], value);
      });
      const comment = this.buildLeadComment(values);
      this.setTildaRelayField(form, ["quiz_summary"], values.quiz_summary || comment);
      this.setTildaRelayField(form, ["comment", "comments", "Comments", "Комментарий"], comment);
      this.setTildaRelayField(form, ["COMMENTS"], comment);
      window.BX_TILDA_FORM_PAYLOAD = values;
      window.BX_POPUP_PAYLOAD = values;
      this.fillTildaPopupForms();
      document.body.classList.add("bx-use-tilda-form");
      return data;
    },

    openTildaPopupOrScroll() {
      const form = this.findTildaRelayForm();
      const popupHref = window.BX_TILDA_FORM_POPUP_HREF || "";
      const explicitTrigger = document.querySelector("[data-bx-tilda-form-trigger]");
      if (explicitTrigger) {
        explicitTrigger.click();
        window.setTimeout(() => this.syncTildaPopupCopy(), 80);
        return true;
      }
      const trigger = this.findTildaFormTrigger();
      if (trigger) {
        trigger.click();
        window.setTimeout(() => this.syncTildaPopupCopy(), 80);
        return true;
      }
      if (this.openTildaHookPopup(form)) return true;
      const target = this.findTildaFormTarget(form);
      if (!target) return false;
      target.removeAttribute("aria-hidden");
      target.classList.remove("bx-tilda-relay--auto");
      form?.classList?.remove("bx-tilda-relay--auto");
      if (target.id) {
        history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}#${target.id}`);
      }
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      return true;
    },

    submitTildaNative(form) {
      try {
        const block = form.closest(".t-rec, .r, section, .t-container") || form.parentElement || form;
        const wasAutoHidden = block.classList.contains("bx-tilda-relay--auto");
        block.classList.add("bx-tilda-relay-active-submit");
        block.classList.remove("bx-tilda-relay--auto");
        form.classList.remove("bx-tilda-relay--auto");

        if (window.jQuery) {
          window.jQuery(form).trigger("submit");
          window.setTimeout(() => this.hideTildaRelayBlocks(), 300);
          this.trackBarnesEvent({ interaction_type: "tilda_native_jquery_submit" });
          this.debugRelay("native_jquery_submit");
          return true;
        }

        if (typeof window.t_submitForm === "function") {
          window.t_submitForm(form);
          window.setTimeout(() => this.hideTildaRelayBlocks(), 300);
          this.trackBarnesEvent({ interaction_type: "tilda_native_submit" });
          this.debugRelay("native_t_submitForm");
          return true;
        }

        const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
        if (submitEvent.defaultPrevented) {
          window.setTimeout(() => this.hideTildaRelayBlocks(), 300);
          this.trackBarnesEvent({ interaction_type: "tilda_native_dispatch_submit" });
          this.debugRelay("native_dispatch_submit");
          return true;
        }

        const submit = form.querySelector('button[type="submit"], input[type="submit"], .t-submit');
        if (submit) {
          submit.click();
          window.setTimeout(() => this.hideTildaRelayBlocks(), 300);
          this.trackBarnesEvent({ interaction_type: "tilda_native_click" });
          this.debugRelay("native_button_click");
          return true;
        }

        if (wasAutoHidden) this.hideTildaRelayBlocks();
        return false;
      } catch (error) {
        this.trackBarnesEvent({ interaction_type: "tilda_native_error" });
        return false;
      }
    },

    submitTildaRelayIframe(form) {
      const action = form.getAttribute("action") || "https://forms.tildacdn.com/procces/";
      const method = form.getAttribute("method") || "POST";
      if (!action) return false;

      try {
        const iframeName = "bx-tilda-relay-frame";
        let iframe = document.querySelector(`iframe[name="${iframeName}"]`);
        if (!iframe) {
          iframe = document.createElement("iframe");
          iframe.name = iframeName;
          iframe.style.display = "none";
          iframe.setAttribute("aria-hidden", "true");
          document.body.appendChild(iframe);
        }

        const relay = document.createElement("form");
        relay.method = method;
        relay.action = action;
        relay.target = iframeName;
        relay.style.display = "none";

        new FormData(form).forEach((value, key) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(value ?? "");
          relay.appendChild(input);
        });

        document.body.appendChild(relay);
        relay.submit();
        window.setTimeout(() => relay.remove(), 1500);
        this.trackBarnesEvent({ interaction_type: "tilda_relay_iframe_submit" });
        this.debugRelay("iframe_submit", {
          action,
          fields: Array.from(new FormData(relay).keys())
        });
        return true;
      } catch (error) {
        this.trackBarnesEvent({ interaction_type: "tilda_relay_error" });
        this.debugRelay("iframe_error", { message: error?.message || String(error) });
        return false;
      }
    },

    debugRelay(stage, payload = {}) {
      window.BX_RELAY_DEBUG = window.BX_RELAY_DEBUG || [];
      window.BX_RELAY_DEBUG.push({ stage, payload, time: new Date().toISOString() });
      if (window.BX_DEBUG_RELAY || window.location.search.includes("bx_debug=1")) {
        console.log("[BARNES relay]", stage, payload);
      }
    },

    getContactMeta(method) {
      return this.contactMethods[method] || this.contactMethods.phone_call;
    },

    getContactMethodFromSource(sourceBlock = "") {
      if (sourceBlock.includes("whatsapp")) return "whatsapp";
      if (sourceBlock.includes("telegram")) return "telegram";
      if (sourceBlock.includes("max")) return "max";
      if (sourceBlock.includes("call") || sourceBlock.includes("phone")) return "phone_call";
      return "";
    },

    isFakePhone(value) {
      const digits = String(value || "").replace(/\D/g, "");
      if (digits.length < 7) return true;
      const normalized = digits.replace(/^7|^8/, "");
      return /^(\d)\1{6,}$/.test(normalized);
    },

    initClientIds() {
      const clientId = this.getClientId();
      this.syncHiddenField("client_id", clientId);
      if (window.ym && this.metrikaId) {
        try {
          window.ym(this.metrikaId, "getClientID", (id) => {
            this.ymClientId = id || "";
            this.syncHiddenField("ym_client_id", this.ymClientId);
          });
        } catch (error) {
          this.ymClientId = "";
        }
      }
    },

    getClientId() {
      const key = "bx_client_id";
      try {
        let id = window.localStorage?.getItem(key);
        if (!id) {
          id = `bx_${Date.now()}_${Math.random().toString(16).slice(2)}`;
          window.localStorage?.setItem(key, id);
        }
        return id || "";
      } catch (error) {
        return `bx_${Date.now()}`;
      }
    },

    getProjectId(project) {
      const map = {
        "Фонтанка 130": "fontanka-130",
        "Манхэттен": "manhattan",
        "ЛДМ": "ldm",
        "Коллекционер": "kollektsioner",
        "Аристократ": "aristokrat",
        "Остров Первых": "ostrov-pervyh",
        "Визионер": "vizioner",
        "17/33": "17-33",
        "Репин": "repin"
      };
      if (map[project]) return map[project];
      return String(project || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-zа-я0-9-]/gi, "");
    },

    buildLeadComment(values) {
      const methodMeta = this.getContactMeta(values.preferred_contact_method || "phone_call");
      const leadTitle = values.lead_type === "quiz" ? "Квиз: персональная подборка" : "Запрос каталога";
      return [
        `Тип заявки: ${leadTitle}`,
        `Сценарий: ${values.scenario || values.selected_scenario || ""}`,
        `Бюджет: ${values.budget || values.selected_budget || ""}`,
        `Район: ${values.district || values.selected_district || ""}`,
        `Формат: ${values.format || values.selected_format || ""}`,
        `Проект: ${values.project || values.selected_project || ""}`,
        `Способ связи: ${methodMeta.label}`,
        `Телефон: ${values.phone || values.preferred_contact_value || ""}`,
        `Ник в мессенджере: ${values.contact_login || ""}`,
        `Технический параметр связи: ${values.preferred_contact_parameter || methodMeta.parameter}`,
        `Источник блока: ${values.source_block || ""}`,
        `Страница: ${values.page_url || window.location.href || ""}`,
        `UTM source: ${values.utm_source || ""}`,
        `UTM medium: ${values.utm_medium || ""}`,
        `UTM campaign: ${values.utm_campaign || ""}`,
        `UTM content: ${values.utm_content || ""}`,
        `UTM term: ${values.utm_term || ""}`,
        `YCLID: ${values.yclid || ""}`,
        `YM Client ID: ${values.ym_client_id || ""}`,
        `Client ID: ${values.client_id || ""}`
      ].filter((line) => !line.endsWith(": ")).join("\n");
    },

    findTildaRelayForm() {
      const candidates = Array.from(document.querySelectorAll([
        "form[data-bx-tilda-relay]",
        "[data-bx-tilda-relay] form",
        "form[data-bx-tilda-form]",
        "[data-bx-tilda-form] form",
        "#bx-tilda-form form",
        ".bx-tilda-form form",
        "#bx-tilda-relay form",
        ".bx-tilda-relay form",
        ".uc-bx-tilda-relay form",
        "form.t-form",
        "form.js-form-proccess"
      ].join(",")));

      return candidates.find((form) => {
        if (form.classList.contains("bx-form")) return false;
        if (form.dataset.bxRelaySubmitting === "true") return false;
        return true;
      }) || null;
    },

    findTildaFormTarget(form = null) {
      const explicitAnchor = window.BX_TILDA_FORM_ANCHOR || "#bx-tilda-form";
      const popupHref = window.BX_TILDA_FORM_POPUP_HREF || "";
      const selectors = [
        explicitAnchor,
        popupHref && !popupHref.startsWith("#popup:") ? popupHref : "",
        "[data-bx-tilda-form]",
        ".bx-tilda-form",
        ".uc-bx-tilda-form",
        "#bx-tilda-relay",
        ".bx-tilda-relay",
        ".uc-bx-tilda-relay"
      ].filter(Boolean);
      const targets = [];
      if (form) targets.push(form.closest(".t-rec, .r, section, .t-container, .t-popup") || form);
      selectors.forEach((selector) => {
        try {
          const node = document.querySelector(selector);
          if (node) targets.push(node);
        } catch (_) {
          // Ignore invalid custom selectors from external Tilda settings.
        }
      });
      return targets.find((node) => {
        if (!node) return false;
        if (node.matches?.("[data-bx-tilda-form-slot]") && !node.querySelector("form")) return false;
        return true;
      }) || null;
    },

    findTildaFormTrigger() {
      const hrefs = [
        window.BX_TILDA_FORM_POPUP_HREF || "",
        window.BX_TILDA_FORM_ANCHOR || "#bx-tilda-form"
      ].filter(Boolean);
      for (const href of hrefs) {
        try {
          const trigger = Array.from(document.querySelectorAll(`a[href="${href}"]`)).find((link) => !link.closest(".bx-page"));
          if (trigger) {
            trigger.setAttribute("data-bx-tilda-external-trigger", "true");
            return trigger;
          }
        } catch (_) {
          // Ignore invalid custom hrefs from external Tilda settings.
        }
      }
      return null;
    },

    openTildaHookPopup(form = null) {
      const hook = window.BX_TILDA_FORM_ANCHOR || window.BX_TILDA_FORM_POPUP_HREF || "#bx-tilda-form";
      if (!hook || !hook.startsWith("#")) return false;
      const popup = form?.closest?.(".t-popup") || document.querySelector(`.t-popup[data-tooltip-hook="${hook}"]`);
      if (!popup) return false;
      const tempTrigger = document.createElement("a");
      tempTrigger.href = hook;
      tempTrigger.setAttribute("data-bx-tilda-external-trigger", "true");
      tempTrigger.style.cssText = "position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;";
      document.body.appendChild(tempTrigger);
      tempTrigger.click();
      window.setTimeout(() => tempTrigger.remove(), 120);
      window.setTimeout(() => this.syncTildaPopupCopy(), 80);
      return true;
    },

    setTildaRelayField(form, names, value) {
      const escapedNames = names.map((name) => {
        if (window.CSS?.escape) return `[name="${CSS.escape(name)}"]`;
        return `[name="${String(name).replace(/"/g, '\\"')}"]`;
      });
      let field = form.querySelector(escapedNames.join(","));

      if (!field) {
        field = document.createElement("input");
        field.type = "hidden";
        field.name = names[0];
        form.appendChild(field);
      }

      field.value = String(value ?? "");
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    },

    hideTildaRelayBlocks() {
      document.querySelectorAll([
        "form[data-bx-tilda-relay]",
        "[data-bx-tilda-relay] form",
        "#bx-tilda-relay form",
        ".bx-tilda-relay form",
        ".uc-bx-tilda-relay form",
        "form.t-form",
        "form.js-form-proccess"
      ].join(",")).forEach((form) => {
        if (form.classList.contains("bx-form")) return;
        if (form.closest(".bx-page")) return;
        const block = form.closest(".t-rec, .r, section, .t-container") || form.parentElement || form;
        block.classList.remove("bx-tilda-relay-active-submit");
        form.classList.add("bx-tilda-relay--auto");
        block.classList.add("bx-tilda-relay--auto");
        block.setAttribute("aria-hidden", "true");
      });
    },

    validateForm(form) {
      let valid = true;
      form.querySelectorAll("[required]").forEach((field) => {
        const ok = field.value.trim().length > 1;
        field.closest(".bx-form__field")?.classList.toggle("has-error", !ok);
        field.setAttribute("aria-invalid", String(!ok));
        valid = valid && ok;
      });
      const message = form.querySelector(".bx-form__message");
      if (!valid && message) {
        message.textContent = "Проверьте имя и контакт — кажется, не хватает данных.";
        message.classList.remove("is-success");
      }
      return valid;
    },

    initProcess() {
      const track = document.querySelector("[data-process-track]");
      if (!track) return;
      track.innerHTML = this.data.process.map((item, index) => `
        <article class="bx-process-step" data-reveal>
          <span>${String(index + 1).padStart(2, "0")}</span>
          <h3>${this.escape(item.title)}</h3>
          <p>${this.escape(item.text)}</p>
        </article>
      `).join("");
      this.initScrollReveal();
    },

    initUTM() {
      const params = new URLSearchParams(window.location.search);
      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "yclid", "rsya_placement", "rsya_source_type", "rsya_position_type"].forEach((key) => {
        this.syncHiddenField(key, params.get(key) || "");
      });
      this.syncHiddenField("page_url", window.location.href);
      this.syncHiddenField("page_title", document.title || "");
    },

    initScrollDepth() {
      const marks = [50, 75, 90];
      const reached = new Set();
      window.addEventListener("scroll", () => {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight <= 0) return;
        const progress = Math.round((window.scrollY / docHeight) * 100);
        marks.forEach((mark) => {
          if (progress >= mark && !reached.has(mark)) {
            reached.add(mark);
            this.track(`scroll_${mark}`);
          }
        });
      }, { passive: true });
    },

    initMobileCTA() {
      const cta = this.nodes.mobileCTA;
      if (!cta) return;
      const defaultHtml = cta.innerHTML;
      const render = (mode) => {
        if (cta.dataset.mode === mode) return;
        cta.dataset.mode = mode;
        if (mode === "project") {
          cta.innerHTML = '<a class="bx-btn bx-btn--dark bx-mobile-cta__wide" href="#bx-tilda-form" data-source="mobile_project">Получить подборку по проекту</a>';
          return;
        }
        if (mode === "bottom") {
          cta.innerHTML = '<a class="bx-btn bx-btn--dark bx-mobile-cta__wide" href="#bx-tilda-form" data-source="mobile_bottom">Отправить запрос</a>';
          return;
        }
        cta.innerHTML = defaultHtml;
      };
      cta.addEventListener("click", (event) => {
        const popupLink = event.target.closest?.("a[data-source]:not([data-mobile-scroll])");
        if (popupLink) {
          event.preventDefault();
          event.stopPropagation();
          this.openRequestPopup(popupLink.dataset.source || "mobile_sticky");
        }
      });
      const onScroll = () => {
        const inputFocused = Boolean(document.activeElement?.matches?.("input, textarea, select"));
        const menuOpen = document.body.classList.contains("bx-menu-lock");
        const isMobile = window.innerWidth <= 767;
        const hero = document.querySelector(".bx-hero");
        const heroBottom = hero ? hero.offsetTop + hero.offsetHeight : window.innerHeight;
        const firstScreenThreshold = Math.round(window.innerHeight * 0.38);
        const heroPassed = window.scrollY > Math.max(firstScreenThreshold, heroBottom - window.innerHeight * 0.45);
        const show = isMobile && !inputFocused && !menuOpen && heroPassed;
        const midpoint = window.scrollY + window.innerHeight * 0.52;
        const inSection = (selector) => {
          const section = document.querySelector(selector);
          if (!section) return false;
          return midpoint >= section.offsetTop && midpoint <= section.offsetTop + section.offsetHeight;
        };
        if (show) {
          if (inSection("#projects")) render("project");
          else if (window.scrollY > document.documentElement.scrollHeight - window.innerHeight * 1.55) render("bottom");
          else render("default");
        }
        cta.classList.toggle("is-visible", show);
        document.body.classList.toggle("bx-mobile-cta-visible", show);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      document.addEventListener("focusin", onScroll);
      document.addEventListener("focusout", () => window.setTimeout(onScroll, 120));
    },

    initFloatingLeadPopup() {
      let popup = document.querySelector("[data-floating-lead]");
      if (!popup) {
        const root = document.querySelector(".bx-page") || document.body;
        root.insertAdjacentHTML("beforeend", `
          <aside class="bx-floating-lead" data-floating-lead aria-label="Эксперт BARNES Saint Petersburg">
            <a class="bx-floating-lead__card" href="${this.popupHref}" data-floating-lead-cta data-source="expert_popup">
              <span class="bx-floating-lead__avatar">
                <img src="https://daniilterekh-prog.github.io/barnes-assets/spb-catalog/expert-spb.webp" alt="Людмила, эксперт BARNES Saint Petersburg" loading="lazy" decoding="async" />
              </span>
              <span class="bx-floating-lead__content">
                <span class="bx-floating-lead__eyebrow">Эксперт BARNES Saint Petersburg</span>
                <strong>Задать вопрос эксперту</strong>
                <span>Людмила</span>
              </span>
            </a>
            <button class="bx-floating-lead__close" type="button" data-floating-lead-close aria-label="Скрыть подсказку эксперта"></button>
          </aside>
        `);
        popup = root.querySelector("[data-floating-lead]");
      }
      if (!popup) return;
      const close = popup.querySelector("[data-floating-lead-close]");
      const cta = popup.querySelector("[data-floating-lead-cta]");
      const storageKey = "bx_spb_floating_lead_closed_v2";
      if (window.sessionStorage?.getItem(storageKey) === "1") {
        popup.hidden = true;
        return;
      }
      popup.style.display = "none";
      const updateVisibility = () => {
        if (popup.hidden || window.sessionStorage?.getItem(storageKey) === "1") return;
        const hero = document.querySelector(".bx-hero");
        const heroBottom = hero ? hero.offsetTop + hero.offsetHeight : window.innerHeight;
        const showAfterHero = window.scrollY > Math.max(280, heroBottom - 120);
        popup.style.display = showAfterHero ? "" : "none";
        popup.classList.toggle("is-visible", showAfterHero);
      };
      window.setTimeout(updateVisibility, 900);
      window.addEventListener("scroll", updateVisibility, { passive: true });
      window.addEventListener("resize", updateVisibility);
      close?.addEventListener("click", () => {
        popup.classList.remove("is-visible");
        window.sessionStorage?.setItem(storageKey, "1");
        this.track("floating_expert_close", { source: "expert_popup" });
        this.trackBarnesEvent({ interaction_type: "floating_expert_close", source_block: "expert_popup" });
        window.setTimeout(() => {
          popup.hidden = true;
        }, 280);
      });
      cta?.addEventListener("click", () => {
        this.prepareRequestForm("expert_popup", {});
        this.track("floating_expert_cta_click", { source: "expert_popup" });
        this.trackBarnesEvent({ interaction_type: "floating_expert_cta_click", source_block: "expert_popup" });
      });
    },

    bindTrackingLinks() {
      document.querySelectorAll("[data-track]").forEach((item) => {
        item.addEventListener("click", () => this.track(item.dataset.track));
      });

      document.querySelectorAll("[data-source]").forEach((item) => {
        item.addEventListener("click", () => {
          this.prepareRequestForm(item.dataset.source);
          if (item.dataset.source === "hero") {
            this.trackBarnesEvent({ interaction_type: "hero_cta_click" });
          }
          if (item.dataset.source === "expert") {
            this.trackBarnesEvent({ interaction_type: "expert_cta_click" });
          }
        });
      });
    },

    initTildaPopupMode() {
      document.querySelectorAll('a[href="#request"], a[href="/#request"], a[href="#popup:catalog2026"], a[href="#popup:barnes-request"]').forEach((link) => {
        link.setAttribute("href", this.popupHref);
      });

      document.querySelectorAll([
        `[href="${this.popupHref}"]`,
        '[href="#popup:catalog2026"]',
        '[href="#popup:barnes-request"]',
        "[data-source]",
        "[data-project-request]",
        "[data-district-cta]",
        "[data-scenario-cta]"
      ].join(",")).forEach((item) => {
        if (item.dataset.bxPopupBound === "true") return;
        item.dataset.bxPopupBound = "true";
        if (item.tagName === "A") item.setAttribute("href", this.popupHref);
        item.addEventListener("click", (event) => {
          if (event.target.closest?.("[data-mobile-scroll]")) return;
          const sourceBlock = item.dataset.source || item.dataset.projectRequest || item.dataset.districtCta || item.dataset.scenarioCta || "cta";
          const preferredContactMethod = item.dataset.contactMethod || this.getContactMethodFromSource(sourceBlock);
          const extra = preferredContactMethod ? { preferredContactMethod } : {};
          if (item.tagName === "A" || item.closest?.("a")) event.preventDefault();
          this.openRequestPopup(sourceBlock, extra);
        });
      });
    },

    openCatalogPopup(sourceBlock = "cta") {
      this.openRequestPopup(sourceBlock);
    },

    preparePopupPayload(extra = {}) {
      const scenario = this.getStateLabel("scenario", this.state.scenario) || this.state.scenario || "";
      window.BX_POPUP_PAYLOAD = {
        name: this.state.name || "",
        phone: this.state.phone || "",
        budget: this.state.budget || "",
        scenario,
        district: this.state.district || "",
        project: this.state.project || "",
        format: this.state.format || "",
        page_url: window.location.href,
        selected_scenario: scenario,
        selected_budget: this.state.budget || "",
        selected_district: this.state.district || "",
        selected_format: this.state.format || "",
        selected_project: this.state.project || "",
        source_block: this.state.sourceBlock || extra.source_block || "",
        ...extra
      };
    },

    fillTildaPopupForms() {
      const payload = window.BX_POPUP_PAYLOAD || {};
      const forms = document.querySelectorAll("form.t-form, form.js-form-proccess");
      forms.forEach((form) => {
        if (form.classList.contains("bx-form")) return;
        Object.entries(payload).forEach(([key, value]) => {
          this.setTildaRelayField(form, [key, key.toUpperCase()], value);
        });
        const comment = this.buildLeadComment(payload);
        this.setTildaRelayField(form, ["comment"], comment);
        this.setTildaRelayField(form, ["COMMENTS"], comment);
        this.setTildaRelayField(form, ["comments", "Comments", "Комментарий"], comment);
      });
    },

    prepareRequestForm(sourceBlock, extra = {}) {
      this.state.sourceBlock = sourceBlock;
      Object.entries(extra).forEach(([key, value]) => {
        this.state[key] = value;
      });
      const scenario = this.getStateLabel("scenario", this.state.scenario) || this.state.scenario || "";
      this.syncHiddenField("source_block", sourceBlock);
      this.syncHiddenField("selected_scenario", scenario);
      this.syncHiddenField("selected_budget", this.state.budget);
      this.syncHiddenField("selected_district", this.state.district);
      this.syncHiddenField("selected_format", this.state.format);
      this.syncHiddenField("selected_project", this.state.project);
      this.syncHiddenField("selected_project_id", this.getProjectId(this.state.project));
      this.syncHiddenField("format", this.state.format);
      this.syncHiddenField("page_url", window.location.href);
      this.syncHiddenField("page_title", document.title || "");
      this.syncHiddenField("form_source", sourceBlock);
      this.syncHiddenField("client_id", this.getClientId());
      if (this.ymClientId) this.syncHiddenField("ym_client_id", this.ymClientId);
      this.syncFormControl("scenario", scenario);
      this.syncFormControl("budget", this.state.budget);
      this.syncFormControl("district", this.state.district);
      this.syncFormControl("project", this.state.project);
      if (this.shouldUseTildaNativeForm()) this.prepareTildaNativeForm(null, sourceBlock);
    },

    syncHiddenField(name, value) {
      document.querySelectorAll(`input[name="${name}"]`).forEach((field) => {
        field.value = value || "";
      });
    },

    syncFormControl(name, value) {
      if (!value) return;
      document.querySelectorAll(`select[name="${name}"], input[name="${name}"]:not([type="hidden"])`).forEach((field) => {
        if (field.tagName === "SELECT") {
          const hasOption = Array.from(field.options).some((option) => option.value === value || option.textContent === value);
          if (!hasOption) return;
        }
        field.value = value;
        field.classList.add("has-value");
      });
    },

    track(goal, params = {}) {
      if (window.ym && window.BX_METRIKA_ID) {
        window.ym(window.BX_METRIKA_ID, "reachGoal", goal, params);
      }
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: goal, ...params });
    },

    trackBarnesEvent(payload = {}) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "barnes_spb_interaction",
        ...payload
      });
    },

    getStateLabel(key, value) {
      if (!value) return "";
      if (key === "scenario") {
        const option = this.onboarding.steps[0].options.find((item) => item.id === value);
        return option ? option.title : value;
      }
      return value;
    },

    escape(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
  };

  window.BX = BX;
  document.addEventListener("DOMContentLoaded", () => BX.init());
  window.addEventListener("load", () => document.body.classList.add("is-loaded"));
})();
