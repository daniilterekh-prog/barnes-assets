(function () {
  'use strict';
  function hasStylesheet(url, sheets) {
    return Array.from(sheets || document.styleSheets).some(function (sheet) {
      if (sheet.href === url) return true;
      try { return Array.from(sheet.cssRules).some(function (rule) { return rule.styleSheet && hasStylesheet(url, [rule.styleSheet]); }); }
      catch (_) { return false; }
    });
  }
  if (window.BarnEstateBrandFilters) return;
  window.BarnEstateBrandFilters = true;
  var cssURL = new URL('../_shared/brand-filters.css?v=20261103-home-quiz-21', document.currentScript.src).href;
  if (!hasStylesheet(cssURL)) {
    var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = cssURL; document.head.appendChild(css);
  }
  var boundInputs = new WeakSet();
  function bindInputs() {
    document.querySelectorAll('.barnes-brand-filters input').forEach(function (input) {
      if (boundInputs.has(input)) return;
      boundInputs.add(input);
      input.addEventListener('change', function () {
        var selected = flags().filter(function (value) { return value !== input.value; });
        if (input.checked) selected.push(input.value);
        window.BarnesFilters.patch({ brandFlags: selected });
      });
    });
  }
  var choices = [['selection', 'Выбор BARN Estate'], ['exclusive', 'Эксклюзив BARN Estate']];
  function flags() { return window.BarnesFilters.getState().brandFlags || []; }
  function group(context) {
    var fieldset = document.createElement('fieldset');
    fieldset.className = 'barnes-brand-filters';
    fieldset.dataset.brandContext = context;
    var legend = document.createElement('legend');
    legend.className = 'barnes-brand-filters__legend';
    legend.textContent = 'Подборки BARN Estate';
    fieldset.appendChild(legend);
    choices.forEach(function (choice) {
      var label = document.createElement('label');
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'brandFlags';
      input.value = choice[0];
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
      (toolbar.closest('.catalog-grid').querySelector('.catalog-collections-row') || toolbar).prepend(row);
    }
    var reset = document.querySelector('.map-browser__reset');
    if (reset && !document.querySelector('[data-brand-context=map]')) {
      var refinements = reset.parentElement.querySelector('.map-browser__refinements');
      if (refinements) refinements.append(group('map'));
      else reset.before(group('map'));
    }
    bindInputs();
    update();
    if (document.querySelector('[data-brand-context=listing]') && document.querySelector('[data-brand-context=map]')) observer.disconnect();
  }
  var observer = new MutationObserver(mount);
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('barnes:filters-apply', update);
  mount();
}());
