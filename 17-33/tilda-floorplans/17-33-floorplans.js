(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const track = window.trackBarnesEvent || function () {};

  function setupPlanFilters() {
    const section = document.querySelector(".t1733-floorplans");
    if (!section) return;

    const buttons = [...section.querySelectorAll("[data-plan-filter]")];
    const cards = [...section.querySelectorAll("[data-plan-card]")];
    const list = section.querySelector(".floorplans-list");
    const showMoreButton = section.querySelector("[data-plan-show-more]");
    const mobileQuery = window.matchMedia("(max-width: 900px)");
    if (!buttons.length || !cards.length) return;

    const collapsedLimit = 3;
    let currentFilter = "all";
    let showAllInAllFilter = false;

    const setFilter = (filter) => {
      currentFilter = filter;

      buttons.forEach((button) => {
        const isActive = button.dataset.planFilter === filter;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });

      const matchingCards = cards.filter((card) => filter === "all" || card.dataset.planFilterGroup === filter);

      cards.forEach((card) => {
        const shouldShow = matchingCards.includes(card) && (
          filter !== "all" ||
          mobileQuery.matches ||
          showAllInAllFilter ||
          matchingCards.indexOf(card) < collapsedLimit
        );
        card.hidden = !shouldShow;
      });

      if (showMoreButton) {
        const canExpand = !mobileQuery.matches && filter === "all" && matchingCards.length > collapsedLimit;
        showMoreButton.hidden = !canExpand;
        showMoreButton.textContent = showAllInAllFilter ? "Свернуть" : "Смотреть все планировки";
      }

      list?.scrollTo({ left: 0, behavior: reduceMotion ? "auto" : "smooth" });
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.planFilter || "all";
        if (filter !== "all") showAllInAllFilter = false;
        setFilter(filter);
        track("plans_filter_click", { filter, source_block: "floorplans" });
      });
    });

    showMoreButton?.addEventListener("click", () => {
      showAllInAllFilter = !showAllInAllFilter;
      setFilter(currentFilter);
      track("plans_show_more_click", { state: showAllInAllFilter ? "expanded" : "collapsed", source_block: "floorplans" });
    });

    const handleViewportChange = () => setFilter(currentFilter);
    if (typeof mobileQuery.addEventListener === "function") {
      mobileQuery.addEventListener("change", handleViewportChange);
    } else if (typeof mobileQuery.addListener === "function") {
      mobileQuery.addListener(handleViewportChange);
    }

    setFilter("all");
  }

  function setupPlanAccordion() {
    const items = [...document.querySelectorAll(".t1733-floorplans .plan-item")];
    if (!items.length) return;

    items.forEach((item) => {
      const button = item.querySelector(".plan-item__button");
      const panel = item.querySelector(".plan-item__panel");
      const summary = item.querySelector(".plan-item__summary");
      if (!button || !panel) return;

      if (summary) {
        const area = item.dataset.planArea || "";
        const type = item.dataset.planType || "";
        const floor = item.dataset.planFloor || "";
        summary.innerHTML = `
          <span class="plan-item__meta-row plan-item__meta-row--area">${area}</span>
          <span class="plan-item__meta-row plan-item__meta-row--type">${type}</span>
          <span class="plan-item__meta-row plan-item__meta-row--floor">${floor}</span>
        `;
      }

      const imageButton = item.querySelector(".plan-item__image-button");
      if (imageButton && !imageButton.querySelector(".plan-item__variant")) {
        const variant = document.createElement("span");
        variant.className = "plan-item__variant";
        variant.innerHTML = `
          <span class="plan-item__variant-label">Планировка</span>
          <span class="plan-item__variant-value">Вариант 1</span>
        `;
        imageButton.append(variant);
      }

      item.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
      panel.hidden = false;

      button.addEventListener("click", () => {
        item.querySelector("[data-plan-open]")?.click();
      });
    });
  }

  function setupPlanLightbox() {
    const lightbox = document.querySelector("[data-plan-lightbox]");
    const openControls = [...document.querySelectorAll(".t1733-floorplans [data-plan-open]")];
    if (!lightbox || !openControls.length) return;

    const image = lightbox.querySelector("[data-plan-lightbox-image]");
    const section = lightbox.querySelector("[data-plan-lightbox-section]");
    const area = lightbox.querySelector("[data-plan-lightbox-area]");
    const details = lightbox.querySelector("[data-plan-lightbox-details]");
    const closeControls = [...lightbox.querySelectorAll("[data-plan-lightbox-close]")];

    const close = () => {
      lightbox.hidden = true;
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("plan-lightbox-open");
    };

    const open = (card) => {
      if (!image || !section || !area || !details) return;
      image.src = card.dataset.planImage || "";
      image.alt = card.querySelector("img")?.alt || "";
      section.textContent = [card.dataset.planTitle || "", card.dataset.planUnit ? `Лот №${card.dataset.planUnit}` : ""].filter(Boolean).join(" · " );
      area.textContent = card.dataset.planArea || "";
      details.textContent = `${card.dataset.planType || ""} · ${card.dataset.planFloor || ""}`.replace(/^ · | · $/g, "");
      lightbox.hidden = false;
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("plan-lightbox-open");
    };

    openControls.forEach((control) => {
      control.addEventListener("click", (event) => {
        event.preventDefault();
        const card = control.closest("[data-plan-card]");
        if (card) open(card);
      });
    });

    closeControls.forEach((control) => control.addEventListener("click", close));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !lightbox.hidden) close();
    });
  }

  function setupMobileActiveSliderCards() {
    const grid = document.querySelector(".t1733-floorplans .floorplans-list");
    if (!grid) return;
    const cards = [...grid.querySelectorAll(".plan-item")];
    if (!cards.length) return;

    const mobileQuery = window.matchMedia("(max-width: 760px)");
    let frame = 0;
    let hasInteracted = false;

    const setActive = (activeCard) => {
      cards.forEach((card) => card.classList.toggle("is-active", card === activeCard));
    };

    const clearActive = () => cards.forEach((card) => card.classList.remove("is-active"));

    const updateActiveCard = () => {
      frame = 0;
      if (!mobileQuery.matches) {
        hasInteracted = false;
        clearActive();
        return;
      }
      if (!hasInteracted) {
        clearActive();
        return;
      }
      const gridRect = grid.getBoundingClientRect();
      const gridCenter = gridRect.left + gridRect.width / 2;
      let closestCard = cards[0];
      let closestDistance = Infinity;
      cards.forEach((card) => {
        if (card.hidden) return;
        const rect = card.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        const distance = Math.abs(center - gridCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestCard = card;
        }
      });
      setActive(closestCard);
    };

    const requestUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateActiveCard);
    };

    const markInteracted = () => { hasInteracted = true; };
    grid.addEventListener("scroll", requestUpdate, { passive: true });
    grid.addEventListener("touchstart", markInteracted, { passive: true });
    grid.addEventListener("pointerdown", markInteracted, { passive: true });
    grid.addEventListener("wheel", markInteracted, { passive: true });
    window.addEventListener("resize", requestUpdate);
    updateActiveCard();
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupMobileActiveSliderCards();
    setupPlanFilters();
    setupPlanAccordion();
    setupPlanLightbox();
  });
})();
