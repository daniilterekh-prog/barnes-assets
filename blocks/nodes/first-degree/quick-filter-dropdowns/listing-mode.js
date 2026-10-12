(function () {
  'use strict';

  const list = document.querySelector('.catalog-grid__list');
  const header = document.querySelector('.catalog-grid__header');
  const legacyFilters = document.querySelector('.catalog-quick-filters');
  const sort = document.querySelector('.catalog-grid__sort');
  if (!list || !header || !sort || list.dataset.modeReady === 'true' || list.dataset.modeInitializing === 'true') return;

  list.dataset.modeInitializing = 'true';
  const projectItems = [...list.querySelectorAll(':scope > .catalog-grid__item')];
  const projectItem = projectItems[0];
  if (!projectItem) {
    delete list.dataset.modeInitializing;
    list.dataset.modeReady = 'true';
    return;
  }

  projectItems.slice(1).forEach((item) => {
    item.hidden = true;
  });
  legacyFilters?.remove();

  const createFact = (label, value) => {
    const fact = document.createElement('div');
    fact.className = 'listing-card-fact';
    const term = document.createElement('dt');
    term.className = 'listing-card-fact__label';
    term.textContent = label;
    const description = document.createElement('dd');
    description.className = 'listing-card-fact__value';
    description.textContent = value;
    fact.append(term, description);
    return fact;
  };

  const createFacts = (items, modifier) => {
    const facts = document.createElement('dl');
    facts.className = `listing-card-facts listing-card-facts--${modifier}`;
    facts.setAttribute('aria-label', 'Основные характеристики');
    items.forEach(([label, value]) => facts.append(createFact(label, value)));
    return facts;
  };

  const projectCard = projectItem.querySelector('.apartment-card');
  const projectBody = projectCard?.querySelector('.apartment-card__body');
  const projectName = projectBody?.querySelector('.apartment-card__name');
  projectBody?.querySelector('.apartment-card__topline')?.remove();
  if (projectBody && projectName) {
    const address = projectBody.querySelector('.apartment-card__address') || document.createElement('p');
    address.className = 'apartment-card__address';
    address.setAttribute('data-v-80c326fb', '');
    if (!address.textContent.trim()) {
      // Project website: sales office on the property, https://grand.marine-garden-sochi.ru/.
      address.textContent = 'Сочи, ул. Шоссейная, 9Б';
    }
    projectName.before(address);
  }
  if (projectName && !projectBody.querySelector('.listing-card-facts')) {
    projectName.after(createFacts([
      ['Локация', 'Сочи · Хоста'],
      ['Срок сдачи', 'IV кв. 2026'],
      ['Спальни', '1–4+'],
    ], 'project'));
  }
  projectItem.dataset.listingMode = 'new-build';

  const lotItem = projectItem.cloneNode(true);
  lotItem.dataset.listingMode = 'secondary';
  lotItem.hidden = true;
  const lotCard = lotItem.querySelector('.apartment-card');
  const lotImage = lotCard.querySelector('.apartment-card__image');
  const lotMediaLink = lotCard.querySelector('.apartment-card__media-link');
  const lotBody = lotCard.querySelector('.apartment-card__body');
  const lotDetailLink = lotCard.querySelector('.apartment-card__detail-btn');
  if (lotImage) {
    lotImage.src = '../shared/assets/presentation-v3/interior.webp';
    lotImage.alt = 'Светлая гостиная квартиры';
  }
  if (lotMediaLink) lotMediaLink.href = '#secondary-lot';
  if (lotDetailLink) lotDetailLink.href = '#secondary-lot';
  if (lotBody) {
    lotBody.replaceChildren();

    const address = document.createElement('p');
    address.className = 'apartment-card__address';
    address.setAttribute('data-v-80c326fb', '');
    address.textContent = 'Сочи · Курортный проспект';

    const name = document.createElement('a');
    name.className = 'apartment-card__name apartment-card__name--link';
    name.href = '#secondary-lot';
    name.setAttribute('data-v-80c326fb', '');
    const nameText = document.createElement('span');
    nameText.className = 'apartment-card__name-text';
    nameText.setAttribute('data-v-80c326fb', '');
    nameText.textContent = 'АПАРТАМЕНТЫ С ВИДОМ НА МОРЕ';
    name.append(nameText);

    const priceRow = document.createElement('div');
    priceRow.className = 'apartment-card__price-row listing-card-price-row';
    priceRow.setAttribute('data-v-80c326fb', '');
    const price = document.createElement('p');
    price.className = 'apartment-card__price';
    price.setAttribute('data-v-80c326fb', '');
    price.textContent = '32 000 000 ₽';
    const lotId = document.createElement('p');
    lotId.className = 'apartment-card__lotid';
    lotId.setAttribute('data-v-80c326fb', '');
    lotId.setAttribute('aria-label', 'ID объекта 384721');
    lotId.textContent = 'ID 384721';
    priceRow.append(price, lotId);

    lotBody.append(
      address,
      name,
      createFacts([
        ['Комнаты', '2'],
        ['Площадь', '54 м²'],
        ['Этаж', '7 из 12'],
      ], 'lot'),
      priceRow,
    );
  }
  list.append(lotItem);

  const toolbar = document.createElement('section');
  toolbar.className = 'catalog-mode-toolbar';
  toolbar.setAttribute('aria-label', 'Фильтры каталога');
  const filterIcons = {
    property: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 21V8l8-5 8 5v13M2 21h20M9 21v-6h6v6M8 9h1m6 0h1M8 12h1m6 0h1" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    location: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z" stroke="currentColor" stroke-width="1.35"/><circle cx="12" cy="10" r="2.25" stroke="currentColor" stroke-width="1.35"/></svg>',
    price: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.35"/><path d="M9 16V7.5h3.4a2.75 2.75 0 1 1 0 5.5H9m0 0h5.6m-5.6 2h4.6" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    bedrooms: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 18v-7.5M21 18v-5.5a2 2 0 0 0-2-2h-7.5A2.5 2.5 0 0 0 9 13v2M3 15h18M5.5 10.5h2A1.5 1.5 0 0 1 9 12v3H4v-3a1.5 1.5 0 0 1 1.5-1.5Z" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  toolbar.innerHTML = `
    <div class="catalog-mode-switch" role="group" aria-label="Тип недвижимости">
      <button class="catalog-mode-switch__button is-active" type="button" data-listing-mode="new-build" aria-pressed="true">Новостройки</button>
      <button class="catalog-mode-switch__button" type="button" data-listing-mode="secondary" aria-pressed="false">Вторичная</button>
    </div>
    <div class="catalog-mode-filters catalog-quick-filters" data-v-6fd45cc6>
      <div class="catalog-quick-filters__item" data-v-6fd45cc6><button class="catalog-quick-filters__button" type="button" aria-expanded="false" aria-haspopup="true" aria-label="Локация: Все направления" data-v-6fd45cc6><span class="catalog-quick-filters__content"><span class="catalog-quick-filters__icon">${filterIcons.location}</span><span class="catalog-quick-filters__label" data-v-6fd45cc6><span class="catalog-quick-filters__caption">Локация</span></span></span><span class="catalog-quick-filters__chevron" aria-hidden="true" data-v-6fd45cc6></span></button></div>
      <div class="catalog-quick-filters__item" data-v-6fd45cc6><button class="catalog-quick-filters__button" type="button" aria-expanded="false" aria-haspopup="true" aria-label="Тип недвижимости: Любой тип" data-v-6fd45cc6><span class="catalog-quick-filters__content"><span class="catalog-quick-filters__icon">${filterIcons.property}</span><span class="catalog-quick-filters__label" data-v-6fd45cc6><span class="catalog-quick-filters__caption">Тип</span></span></span><span class="catalog-quick-filters__chevron" aria-hidden="true" data-v-6fd45cc6></span></button></div>
      <div class="catalog-quick-filters__item" data-v-6fd45cc6><button class="catalog-quick-filters__button" type="button" aria-expanded="false" aria-haspopup="true" aria-label="Стоимость: Любая" data-v-6fd45cc6><span class="catalog-quick-filters__content"><span class="catalog-quick-filters__icon">${filterIcons.price}</span><span class="catalog-quick-filters__label" data-v-6fd45cc6><span class="catalog-quick-filters__caption">Стоимость</span></span></span><span class="catalog-quick-filters__chevron" aria-hidden="true" data-v-6fd45cc6></span></button></div>
      <div class="catalog-quick-filters__item" data-v-6fd45cc6><button class="catalog-quick-filters__button" type="button" aria-expanded="false" aria-haspopup="true" aria-label="Спальни: Любые" data-v-6fd45cc6><span class="catalog-quick-filters__content"><span class="catalog-quick-filters__icon">${filterIcons.bedrooms}</span><span class="catalog-quick-filters__label" data-v-6fd45cc6><span class="catalog-quick-filters__caption">Спальни</span></span></span><span class="catalog-quick-filters__chevron" aria-hidden="true" data-v-6fd45cc6></span></button></div>
    </div>`;
  const detailedFiltersButton = document.createElement('button');
  detailedFiltersButton.className = 'catalog-mode-detailed-filters';
  detailedFiltersButton.type = 'button';
  detailedFiltersButton.dataset.detailedFiltersTrigger = '';
  detailedFiltersButton.setAttribute('aria-label', 'Подробные фильтры');
  detailedFiltersButton.title = 'Подробные фильтры';
  detailedFiltersButton.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 6h3m4 0h9M4 12h8m4 0h4M4 18h4m4 0h8" stroke="currentColor" stroke-width="1.15" stroke-linecap="round"></path>
      <circle cx="9" cy="6" r="2" stroke="currentColor" stroke-width="1.15"></circle>
      <circle cx="14" cy="12" r="2" stroke="currentColor" stroke-width="1.15"></circle>
      <circle cx="10" cy="18" r="2" stroke="currentColor" stroke-width="1.15"></circle>
    </svg>
    <span class="catalog-mode-detailed-filters__label catalog-mode-detailed-filters__label--desktop">Все фильтры</span>
    <span class="catalog-mode-detailed-filters__label catalog-mode-detailed-filters__label--mobile">Фильтры</span>`;
  toolbar.append(sort, detailedFiltersButton);
  header.after(toolbar);

  const modeButtons = toolbar.querySelectorAll('[data-listing-mode]');
  function setMode(mode) {
    if (mode !== 'new-build' && mode !== 'secondary') mode = 'new-build';
    modeButtons.forEach((item) => {
      const active = item.dataset.listingMode === mode;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    projectItem.hidden = mode !== 'new-build';
    lotItem.hidden = mode !== 'secondary';
  }
  modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.dataset.listingMode;
      setMode(mode);
      if (window.BarnesFilters) window.BarnesFilters.patch({ market: mode });
    });
  });
  document.addEventListener('barnes:filters-apply', () => {
    if (window.BarnesFilters) setMode(window.BarnesFilters.getState().market);
  });
  if (window.BarnesFilters) setMode(window.BarnesFilters.getState().market);

  delete list.dataset.modeInitializing;
  list.dataset.modeReady = 'true';
}());
