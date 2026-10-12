(function () {
  'use strict';
  if (document.querySelector('.resort-quick-dropdown')) return;
  var base = new URL('.', document.currentScript.src);
  var stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = new URL('quick-filters.css?v=1', base).href;
  document.head.appendChild(stylesheet);
  var configs = [
    { title:'Локация', key:'directions', reset:'Все направления', choices:['Сочи','Анапа','Алтай','Архыз'] },
    { title:'Стоимость', key:'priceRanges', reset:'Любая', choices:['до 50 млн ₽','50 – 100 млн ₽','100 – 200 млн ₽','от 200 млн ₽'], values:['50m','50-100m','100-200m','200m+'] },
    { title:'Спальни', key:'bedrooms', reset:'Любые', choices:['1','2','3','Более 3'], values:['1','2','3','4+'] }
  ];
  var popup = document.createElement('div');
  popup.className = 'catalog-quick-filters__dropdown resort-quick-dropdown';
  popup.id = 'resort-quick-dropdown';
  popup.setAttribute('role','dialog');
  popup.hidden = true;
  popup.style.display = 'none';
  popup.innerHTML = '<div class="catalog-quick-filters__dropdown-header"><span></span><button type="button" class="catalog-quick-filters__dropdown-close" aria-label="Закрыть">×</button></div><div class="catalog-quick-filters__options" role="listbox"></div>';
  document.body.appendChild(popup);
  var list = popup.querySelector('.catalog-quick-filters__options');
  var activeButton = null;
  function buttons() { return Array.from(document.querySelectorAll('.catalog-mode-filters .catalog-quick-filters__button')); }
  function state() { return window.BarnesFilters ? window.BarnesFilters.getState() : {}; }
  function selection(config, value) {
    var current = value[config.key];
    return config.key === 'bedrooms' ? (current ? [current] : []) : current || [];
  }
  function update() {
    var value = state();
    buttons().forEach(function (button, index) {
      var config = configs[index];
      if (!config) return;
      var selected = selection(config,value);
      var labels = selected.map(function (v) {
        var i = (config.values || config.choices).indexOf(v);
        return i >= 0 ? config.choices[i] : v;
      });
      var caption = button.querySelector('.catalog-quick-filters__caption');
      caption.dataset.quickCaption = '';
      caption.textContent = labels.length === 1 ? labels[0] : labels.length > 1 ? config.title + ': ' + labels.length : config.title;
      button.classList.toggle('is-active',!!selected.length);
      button.title = config.title + ': ' + (labels.join(', ') || config.reset);
      button.setAttribute('aria-label',button.title);
      button.setAttribute('aria-haspopup','dialog');
      button.setAttribute('aria-controls',popup.id);
    });
  }
  function close(focus) {
    if (!activeButton) return;
    var previous = activeButton;
    previous.classList.remove('is-open');
    previous.setAttribute('aria-expanded','false');
    activeButton = null;
    popup.hidden = true;
    popup.style.display = 'none';
    if (focus) previous.focus({preventScroll:true});
  }
  function place() {
    if (!activeButton) return;
    var rect = activeButton.getBoundingClientRect();
    var vw = document.documentElement.clientWidth;
    var width = Math.min(Math.max(rect.width,220),vw-32);
    popup.style.width = width + 'px';
    popup.style.left = Math.max(16,Math.min(rect.left,vw-width-16)) + 'px';
    list.style.maxHeight = '240px';
    var height = popup.getBoundingClientRect().height;
    var availableBelow = window.innerHeight-rect.bottom-16;
    var above = rect.top-16;
    var top = rect.bottom+6;
    if (height > availableBelow && above > availableBelow) top = rect.top-6-height;
    top = Math.max(16,Math.min(top,window.innerHeight-height-16));
    popup.style.top = top + 'px';
    list.style.maxHeight = Math.max(48,Math.min(240,window.innerHeight-top-80)) + 'px';
  }
  function open(button,index) {
    if (!window.BarnesFilters) return;
    if (button === activeButton) { close(true); return; }
    close(false);
    var config = configs[index];
    if (!config) return;
    activeButton = button;
    button.classList.add('is-open');
    button.setAttribute('aria-expanded','true');
    popup.setAttribute('aria-label',config.title);
    popup.querySelector('.catalog-quick-filters__dropdown-header > span').textContent = config.title;
    list.setAttribute('aria-label',config.title);
    list.replaceChildren();
    var selected = selection(config,state());
    [config.reset].concat(config.choices).forEach(function (label,index) {
      var value = index ? (config.values || config.choices)[index-1] : '';
      var option = document.createElement('button');
      option.type = 'button';
      option.className = 'catalog-quick-filters__option';
      option.setAttribute('role','option');
      var checked = value ? selected.includes(value) : !selected.length;
      option.setAttribute('aria-selected',String(checked));
      option.classList.toggle('is-selected',checked);
      option.textContent = label;
      option.addEventListener('click',function () {
        var fields = {};
        fields[config.key] = config.key === 'bedrooms' ? value : value ? [value] : [];
        if (config.key === 'priceRanges') { fields.priceMin = ''; fields.priceMax = ''; }
        window.BarnesFilters.patch(fields);
        close(true);
      });
      list.appendChild(option);
    });
    popup.hidden = false;
    popup.style.display = 'block';
    place();
    (list.querySelector('[aria-selected=true]') || list.firstElementChild).focus({preventScroll:true});
  }
  popup.querySelector('.catalog-quick-filters__dropdown-close').addEventListener('click',function () { close(true); });
  document.addEventListener('click',function (event) {
    var button = event.target.closest('.catalog-mode-filters .catalog-quick-filters__button');
    if (button) { event.preventDefault(); update(); open(button,buttons().indexOf(button)); }
    else if (!popup.contains(event.target)) close(false);
  });
  popup.addEventListener('keydown',function (event) {
    var options = Array.from(list.children);
    var index = options.indexOf(document.activeElement);
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
    if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
      event.preventDefault();
      var next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length-1 : (index+(event.key==='ArrowDown'?1:-1)+options.length)%options.length;
      options[next].focus();
    }
  });
  document.addEventListener('focusin',function (event) {
    if (activeButton && !popup.contains(event.target) && event.target!==activeButton) close(false);
  });
  document.addEventListener('scroll',function (event) {
    if (!activeButton || popup.contains(event.target)) return;
    var rect = activeButton.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) close(false);
    else place();
  },true);
  window.addEventListener('resize',function () { close(false); });
  document.addEventListener('barnes:filters-apply',update);
  document.addEventListener('barnes:filters-open',function () { close(false); });
  update();
}());
