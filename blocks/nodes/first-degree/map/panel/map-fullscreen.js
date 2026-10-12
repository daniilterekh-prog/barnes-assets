(function () {
  'use strict';
  var trigger = document.querySelector('.catalog-projects-map__fullscreen');
  var source = document.querySelector('.catalog-projects-map');
  if (!trigger || !source || document.querySelector('.map-browser')) return;
  var assetsBase = new URL('.', document.currentScript.src);
  var style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = new URL('map-fullscreen.css?v=1', assetsBase).href;
  document.head.appendChild(style);
  var icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">';
  var dialog = document.createElement('section');
  dialog.className = 'map-browser';
  dialog.hidden = true;
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', 'Объекты на карте');
  dialog.innerHTML = '<div class="map-browser__backdrop" aria-hidden="true"><img src="' + new URL('map-preview.png', assetsBase).href + '" alt=""></div>' +
    '<a class="map-browser__attribution" href="https://yandex.ru/maps/" target="_blank" rel="noopener">© Яндекс Карты</a>' +
    '<p class="map-browser__notice">Предпросмотр: карта статична, панель объектов работает.</p>' +
    '<button class="map-browser__close" aria-label="Закрыть полноэкранный режим карты">' + icon + '<path d="m6 6 12 12M18 6 6 18"/></svg></button>' +
    '<div class="map-browser__panel"><button class="map-browser__handle" aria-label="Развернуть список объектов" aria-expanded="false"></button>' +
    '<h2 class="map-browser__heading" aria-live="polite"></h2><div class="map-browser__search-row">' +
    '<label class="map-browser__search">' + icon + '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input type="search" aria-label="Поиск объектов на карте" placeholder="Начните вводить запрос"></label>' +
    '<button class="map-browser__filter-toggle" aria-label="Подробные фильтры" aria-expanded="false">' + icon + '<path d="M3 6h18M3 12h18M3 18h18"/><circle cx="8" cy="6" r="2" fill="white"/><circle cx="16" cy="12" r="2" fill="white"/><circle cx="9" cy="18" r="2" fill="white"/></svg></button></div>' +
    '<div class="map-browser__filters"><label>Тип объекта<select aria-label="Тип объекта" data-filter="type"><option value="">Все объекты</option><option value="rc">Жилые комплексы</option><option value="lot">Лоты</option></select></label>' +
    '<label>Цена до, ₽<input type="number" min="0" step="1000000" data-filter="price" placeholder="Любая"></label>' +
    '<label class="map-browser__extra" hidden>Сортировка<select aria-label="Сортировка" data-filter="sort"><option value="">По релевантности</option><option value="asc">Сначала дешевле</option><option value="desc">Сначала дороже</option></select></label>' +
    '<button class="map-browser__reset">Сбросить фильтры</button></div><div class="map-browser__list"></div></div>';
  document.body.appendChild(dialog);
  var panel = dialog.querySelector('.map-browser__panel');
  var handle = dialog.querySelector('.map-browser__handle');
  var query = dialog.querySelector('input[type=search]');
  var type = dialog.querySelector('[data-filter=type]');
  var price = dialog.querySelector('[data-filter=price]');
  var sort = dialog.querySelector('[data-filter=sort]');
  var list = dialog.querySelector('.map-browser__list');
  var items = window.BarnesMapProjects || [];
  var previousOverflow;
  var inertElements = [];
  function isolate(element) {
    if (element !== dialog && !['SCRIPT', 'LINK', 'STYLE'].includes(element.tagName) &&
        !inertElements.some(function (entry) { return entry.element === element; })) {
      inertElements.push({ element: element, value: element.inert });
      element.inert = true;
    }
  }
  var observer = new MutationObserver(function (records) {
    records.forEach(function (record) {
      record.addedNodes.forEach(function (node) { if (node.nodeType === 1) isolate(node); });
    });
  });
  function render() {
    var term = query.value.trim().toLocaleLowerCase('ru');
    var result = items.filter(function (item) {
      return (!term || item.name.toLocaleLowerCase('ru').includes(term)) &&
        (!type.value || item.type === type.value) &&
        (!price.value || (item.priceRub !== null && item.priceRub <= Number(price.value)));
    });
    if (sort.value) result.sort(function (a, b) {
      if (a.priceRub === null) return b.priceRub === null ? 0 : 1;
      if (b.priceRub === null) return -1;
      return sort.value === 'asc' ? a.priceRub - b.priceRub : b.priceRub - a.priceRub;
    });
    dialog.querySelector('.map-browser__heading').textContent = 'Найдено объектов: ' + result.length;
    list.replaceChildren();
    result.forEach(function (item) {
      var article = document.createElement('article');
      article.className = 'map-browser__card';
      var link = document.createElement('a');
      link.href = item.href;
      var image = document.createElement('img');
      image.src = item.image;
      image.alt = '';
      image.loading = 'lazy';
      var heading = document.createElement('h3');
      heading.textContent = item.name;
      var cost = document.createElement('p');
      cost.textContent = item.price || 'Цена по запросу';
      link.append(image, heading);
      article.append(link, cost);
      list.appendChild(article);
    });
    if (!result.length) {
      var empty = document.createElement('p');
      empty.className = 'map-browser__empty';
      empty.textContent = 'Ничего не найдено. Измени запрос или сбрось фильтры.';
      list.appendChild(empty);
    }
    list.scrollTop = 0;
  }
  function expand(value) {
    panel.classList.toggle('map-browser__panel--expanded', value);
    handle.setAttribute('aria-expanded', String(value));
    handle.setAttribute('aria-label', value ? 'Свернуть список объектов' : 'Развернуть список объектов');
  }
  function close() {
    if (dialog.hidden) return;
    dialog.hidden = true;
    observer.disconnect();
    document.body.style.overflow = previousOverflow;
    inertElements.forEach(function (entry) { entry.element.inert = entry.value; });
    inertElements = [];
    trigger.focus({ preventScroll: true });
  }
  trigger.addEventListener('click', function () {
    previousOverflow = document.body.style.overflow;
    Array.from(document.body.children).forEach(isolate);
    observer.observe(document.body, { childList: true });
    document.body.style.overflow = 'hidden';
    dialog.hidden = false;
    expand(false);
    render();
    dialog.querySelector('.map-browser__close').focus();
  });
  dialog.querySelector('.map-browser__close').addEventListener('click', close);
  handle.addEventListener('click', function () { expand(handle.getAttribute('aria-expanded') !== 'true'); });
  query.addEventListener('focus', function () { if (window.innerWidth <= 540) expand(true); });
  dialog.querySelector('.map-browser__filter-toggle').addEventListener('click', function (event) {
    var extra = dialog.querySelector('.map-browser__extra');
    extra.hidden = !extra.hidden;
    event.currentTarget.setAttribute('aria-expanded', String(!extra.hidden));
    expand(true);
  });
  [query, type, price, sort].forEach(function (input) { input.addEventListener('input', render); });
  dialog.querySelector('.map-browser__reset').addEventListener('click', function () {
    [query, type, price, sort].forEach(function (input) { input.value = ''; });
    render();
  });
  document.addEventListener('keydown', function (event) {
    if (dialog.hidden) return;
    if (event.key === 'Escape') close();
    if (event.key === 'Tab') {
      var focusable = Array.from(dialog.querySelectorAll('a, button, input, select')).filter(function (el) { return el.getClientRects().length; });
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
}());
