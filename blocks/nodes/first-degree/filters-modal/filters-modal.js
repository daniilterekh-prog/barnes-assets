(function () {
  'use strict';
  if (window.BarnesFilters || !window.BarnesFilterTemplate) return;
  var base = new URL('.', document.currentScript.src);
  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = new URL('filters-modal.css?v=2', base).href;
  document.head.appendChild(css);
  var template = document.createElement('template');
  template.innerHTML = window.BarnesFilterTemplate;
  var modal = template.content.firstElementChild;
  modal.style.display = 'none'; // Prevent a flash before the override stylesheet loads.
  document.body.appendChild(modal);
  var triggerSelector = '.catalog-hero-filters__filter-icon, .catalog-mode-detailed-filters, .map-browser__filter-toggle';
  var state = {};
  var resetPending = false;
  var opener;
  var savedOverflow;
  var savedRootOverflow;
  var savedGutter;
  var savedModalInert;
  var isolated = [];
  var inputs = Array.from(modal.querySelectorAll('input'));
  var chips = Array.from(modal.querySelectorAll('.ui-checkbox--chip'));
  chips.forEach(function (label) {
    var box = modal.querySelector('.ui-checkbox__box').cloneNode(true);
    box.setAttribute('aria-hidden','true');
    label.querySelector('input').after(box);
  });
  var chipGroups = Array.from(modal.querySelectorAll('.hero-filter-panel-content__checkboxes--chips'));
  // Share one form/state, switching only the map entry to the source's white drawer.
  var darkClasses = ['hero-filter-modal--dark','hero-filter-panel--dark','hero-filter-panel-content--dark','ui-checkbox--dark','ui-switch--dark'];
  var themedNodes = [modal].concat(Array.from(modal.querySelectorAll('[class]'))).map(function (el) {
    return { el:el, classes:darkClasses.filter(function (name) { return el.classList.contains(name); }) };
  }).filter(function (entry) { return entry.classes.length; });
  var error = document.createElement('p');
  error.className = 'resort-filters__error';
  error.hidden = true;
  error.setAttribute('role', 'alert');
  modal.querySelector('.hero-filter-modal__body').prepend(error);
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function restore(value) {
    inputs.forEach(function (input) {
      if (input.type === 'checkbox') input.checked = (value[input.name] || []).includes(input.value);
      else input.value = value[input.name] || '';
      input.removeAttribute('aria-invalid');
    });
    error.hidden = true;
  }
  function isolate(el) {
    if (el !== modal && !['SCRIPT','LINK','STYLE'].includes(el.tagName) &&
        !isolated.some(function (entry) { return entry.el === el; })) {
      isolated.push({ el: el, inert: el.inert });
      el.inert = true;
    }
  }
  var observer = new MutationObserver(function (records) {
    records.forEach(function (record) {
      record.addedNodes.forEach(function (node) { if (node.nodeType === 1) isolate(node); });
    });
  });
  function close() {
    if (modal.hidden) return;
    modal.hidden = true;
    modal.style.display = 'none';
    modal.inert = savedModalInert;
    observer.disconnect();
    isolated.forEach(function (entry) { entry.el.inert = entry.inert; });
    isolated = [];
    document.body.style.overflow = savedOverflow;
    document.documentElement.style.overflow = savedRootOverflow;
    document.documentElement.style.scrollbarGutter = savedGutter;
    if (opener) { opener.setAttribute('aria-expanded','false'); opener.focus({ preventScroll:true }); }
  }
  function open(trigger) {
    if (!modal.hidden) return;
    opener = trigger;
    var drawer = trigger.matches('.map-browser__filter-toggle');
    modal.classList.toggle('hero-filter-modal--drawer',drawer);
    themedNodes.forEach(function (entry) {
      entry.classes.forEach(function (name) { entry.el.classList.toggle(name,!drawer); });
    });
    chips.forEach(function (label) {
      label.classList.toggle('ui-checkbox--chip',!drawer);
      label.classList.toggle('ui-checkbox--default',drawer);
    });
    chipGroups.forEach(function (group) {
      group.classList.toggle('hero-filter-panel-content__checkboxes--chips',!drawer);
      if (group.querySelector('[name=propertyTypes]')) group.classList.toggle('hero-filter-panel-content__checkboxes--columns',drawer);
    });
    document.dispatchEvent(new CustomEvent('barnes:filters-open'));
    resetPending = false;
    savedModalInert = modal.inert;
    modal.inert = false;
    restore(state);
    savedOverflow = document.body.style.overflow;
    savedRootOverflow = document.documentElement.style.overflow;
    savedGutter = document.documentElement.style.scrollbarGutter;
    Array.from(document.body.children).forEach(isolate);
    observer.observe(document.body, { childList:true });
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    if (window.innerWidth <= 540) document.documentElement.style.scrollbarGutter = 'auto';
    modal.hidden = false;
    modal.style.display = '';
    trigger.setAttribute('aria-controls',modal.id);
    trigger.setAttribute('aria-haspopup','dialog');
    trigger.setAttribute('aria-expanded','true');
    modal.querySelector('.hero-filter-modal__body').scrollTop = 0;
    modal.querySelector('.hero-filter-modal__close').focus();
  }
  modal.querySelector('.hero-filter-modal__close').addEventListener('click', close);
  modal.querySelector('.hero-filter-modal__backdrop').addEventListener('click', close);
  modal.querySelector('.hero-filter-modal__reset').addEventListener('click', function () { restore({}); resetPending = true; });
  modal.querySelector('.hero-filter-modal__apply').addEventListener('click', function () {
    var draft = {};
    var invalid = null;
    inputs.forEach(function (input) {
      input.removeAttribute('aria-invalid');
      if (input.type === 'checkbox') {
        if (!draft[input.name]) draft[input.name] = [];
        if (input.checked) draft[input.name].push(input.value);
      } else {
        var raw = input.value.trim().replace(/[\s\u00a0]/g,'');
        if (raw && !/^\d+$/.test(raw)) invalid = invalid || input;
        draft[input.name] = raw;
      }
    });
    ['price','area','rooms'].forEach(function (key) {
      if (draft[key+'Min'] && draft[key+'Max'] && Number(draft[key+'Min']) > Number(draft[key+'Max'])) {
        invalid = invalid || modal.querySelector('[name="'+key+'Min"]');
      }
    });
    if (invalid) {
      error.textContent = 'Проверь диапазон: вводи целые неотрицательные числа, значение «от» не должно превышать «до».';
      error.hidden = false;
      invalid.setAttribute('aria-invalid','true');
      invalid.focus();
      return;
    }
    state = Object.assign({}, resetPending ? {} : state, draft);
    close();
    document.dispatchEvent(new CustomEvent('barnes:filters-apply', { detail:copy(state) }));
  });
  // Capture prevents old local map-button listeners from opening a second panel.
  document.addEventListener('click', function (event) {
    var trigger = event.target.closest(triggerSelector);
    if (!trigger) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    open(trigger);
  }, true);
  document.addEventListener('keydown', function (event) {
    if (modal.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault(); event.stopImmediatePropagation(); close();
    } else if (event.key === 'Tab') {
      event.stopImmediatePropagation();
      var controls = Array.from(modal.querySelectorAll('button,input')).filter(function (el) {
        return !el.disabled && el.getClientRects().length && !el.classList.contains('hero-filter-modal__backdrop');
      });
      var first = controls[0], last = controls[controls.length-1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }, true);
  window.BarnesFilters = {
    open:open,
    getState:function () { return copy(state); },
    patch:function (fields) {
      if (!modal.hidden) return;
      state = Object.assign({}, state, copy(fields));
      document.dispatchEvent(new CustomEvent('barnes:filters-apply', { detail:copy(state) }));
    }
  };
}());
