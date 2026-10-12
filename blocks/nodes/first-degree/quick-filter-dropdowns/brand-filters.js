(function () {
  'use strict';
  if (document.querySelector('link[data-barnes-brand-filters]')) return;
  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.dataset.barnesBrandFilters = '';
  css.href = new URL('brand-filters.css?v=3', document.currentScript.src).href;
  document.head.appendChild(css);
  var choices = [['selection', 'Выбор BARNES'], ['exclusive', 'Эксклюзив BARNES']];
  function flags() { return window.BarnesFilters.getState().brandFlags || []; }
  function group(context) {
    var fieldset = document.createElement('fieldset');
    fieldset.className = 'barnes-brand-filters';
    fieldset.dataset.brandContext = context;
    var legend = document.createElement('legend');
    legend.className = 'barnes-brand-filters__legend';
    legend.textContent = 'Подборки BARNES';
    fieldset.appendChild(legend);
    choices.forEach(function (choice) {
      var label = document.createElement('label');
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'brandFlags';
      input.value = choice[0];
      input.addEventListener('change', function () {
        var selected = flags().filter(function (value) { return value !== input.value; });
        if (input.checked) selected.push(input.value);
        window.BarnesFilters.patch({ brandFlags: selected });
      });
      var box = document.createElement('span');
      box.className = 'barnes-brand-filters__box';
      box.setAttribute('aria-hidden', 'true');
      var text = document.createElement('span');
      text.textContent = choice[1];
      label.append(input, box, text);
      fieldset.appendChild(label);
    });
    return fieldset;
  }
  function update() {
    var selected = flags();
    document.querySelectorAll('.barnes-brand-filters input').forEach(function (input) {
      input.checked = selected.includes(input.value);
    });
  }
  function mount() {
    var toolbar = document.querySelector('.catalog-mode-toolbar');
    if (toolbar && !document.querySelector('[data-brand-context=listing]')) {
      var row = group('listing');
      toolbar.appendChild(row);
    }
    var reset = document.querySelector('.map-browser__reset');
    if (reset && !document.querySelector('[data-brand-context=map]')) reset.before(group('map'));
    update();
    if (document.querySelector('[data-brand-context=listing]') && document.querySelector('[data-brand-context=map]')) observer.disconnect();
  }
  var observer = new MutationObserver(mount);
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('barnes:filters-apply', update);
  mount();
}());
