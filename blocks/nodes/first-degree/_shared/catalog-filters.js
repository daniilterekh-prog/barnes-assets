/* Catalogue toolbar adapter. Reference: katalog-nedvizhimosti/?direction=international. */
(function () {
  if (window.BarnEstateCatalogFilters) return;
  var mounted = new WeakMap();
  var ranges = {'50m':[0,50000000],'50-100m':[50000000,100000000],'100-200m':[100000000,200000000],'200m+':[200000000,Infinity]};
  var types = {apartment:'Апартаменты',flat:'Квартира',new_build:'Квартира в новостройке',penthouse:'Пентхаус'};
  function mount(root) {
    var toolbar = root.querySelector('.catalog-mode-toolbar');
    if (!toolbar || mounted.has(toolbar)) return function () {};
    var grid = toolbar.closest('.catalog-grid'), list = grid.querySelector('.catalog-grid__list');
    var controller = new AbortController(), signal = controller.signal;
    function listen(el,type,fn) { el.addEventListener(type,fn,{signal:signal}); }
    var primary=toolbar.querySelector('.catalog-toolbar__primary'),secondary=toolbar.querySelector('.catalog-toolbar__secondary');
    var search=toolbar.querySelector('.catalog-search-row'),input=search.querySelector('input');
    var details=toolbar.querySelector('.catalog-mode-detailed-filters'),sort=grid.querySelector('.catalog-grid__sort select');
    var collections=grid.querySelector('.catalog-collections-row'),summary=grid.querySelector('.catalog-result-summary');
    if(!sort.parentElement.querySelector('.catalog-sort-chevron'))sort.parentElement.insertAdjacentHTML('beforeend','<svg class="catalog-sort-chevron" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 6 5 5 5-5" stroke="currentColor" stroke-width="1.2"/></svg>');
    var marketSelect=toolbar.querySelector('.catalog-market select');
    var small=matchMedia('(max-width:767px)');
    function layout() {
      if(small.matches){secondary.insertBefore(search,details);summary.after(collections);}else{primary.append(search);toolbar.after(collections);}
      input.placeholder=small.matches?'Название или ID':'Название ЖК, адрес или ID';
    }
    function state(){return window.BarnesFilters?window.BarnesFilters.getState():{market:'new-build'};}
    function patch(fields){if(window.BarnesFilters)window.BarnesFilters.patch(fields);}
    function reset(){if(window.BarnesFilters&&window.BarnesFilters.reset){window.BarnesFilters.reset();return;}var fields={};Object.keys(state()).forEach(function(key){if(key!=='market')fields[key]=Array.isArray(state()[key])?[]:'';});patch(fields);}
    function sync() {
      var value=state(),chips=collections.querySelector('.catalog-active-filters'),groups=[];
      input.value=value.query||'';
      if(marketSelect.value!==(value.market||'new-build')){marketSelect.value=value.market||'new-build';marketSelect.dispatchEvent(new Event('change'));}
      if(sort&&sort.value!==(value.sort||'relevance')){sort.value=value.sort||'relevance';sort.dispatchEvent(new Event('change'));}
      function add(key,label,fields){groups.push({key:key,label:label,fields:fields});}
      [['directions','Локация'],['propertyTypes','Тип'],['priceRanges','Стоимость'],['brandFlags','Подборка']].forEach(function(pair){(value[pair[0]]||[]).forEach(function(v){var labels=pair[0]==='propertyTypes'?types:pair[0]==='brandFlags'?{selection:'Выбор BARN Estate',exclusive:'exclusive'}:{};var text=labels[v]||v;if(pair[0]==='priceRanges')text={'50m':'до 50 млн ₽','50-100m':'50 – 100 млн ₽','100-200m':'100 – 200 млн ₽','200m+':'от 200 млн ₽'}[v]||v;var fields={};fields[pair[0]]=(value[pair[0]]||[]).filter(function(x){return x!==v;});add(pair[0],text,fields);});});
      if(value.bedrooms)add('bedrooms','Спальни: '+value.bedrooms,{bedrooms:''});
      [['price','Цена'],['area','Площадь'],['rooms','Комнаты']].forEach(function(pair){if(value[pair[0]+'Min']||value[pair[0]+'Max']){var fields={};fields[pair[0]+'Min']='';fields[pair[0]+'Max']='';add(pair[0],pair[1]+': '+(value[pair[0]+'Min']||'от')+'–'+(value[pair[0]+'Max']||'до'),fields);}});
      ['finishing','lift','trophy'].forEach(function(k){if((value[k]||[]).length){var fields={};fields[k]=[];add(k,{finishing:'Отделка',lift:'Лифт',trophy:'Трофейная недвижимость'}[k],fields);}});
      if(value.query)add('query','Поиск: '+value.query,{query:''});
      chips.replaceChildren();groups.forEach(function(group){var b=document.createElement('button');b.type='button';b.className='catalog-active-filter';b.setAttribute('aria-label','Убрать фильтр: '+group.label);var text=document.createElement('span');text.textContent=group.label;var close=document.createElement('span');close.textContent='×';close.setAttribute('aria-hidden','true');b.append(text,close);b.onclick=function(){patch(group.fields);};chips.append(b);});
      collections.querySelector('[data-catalog-reset]').hidden=false;
      var badge=details.querySelector('[data-filter-count]'),n=new Set(groups.map(function(g){return g.key;})).size;badge.textContent=String(n);badge.hidden=!n;details.setAttribute('aria-label',n?'Все фильтры: выбрано '+n:'Все фильтры');
      var term=(value.query||'').trim().toLocaleLowerCase('ru'),visible=0;
      list.querySelectorAll(':scope > .catalog-grid__item[data-listing-mode]').forEach(function(item){var show=item.dataset.listingMode===value.market;var text=item.textContent.toLocaleLowerCase('ru');show=show&&(!term||text.includes(term));
        var raw=item.querySelector('.apartment-card__price')?.textContent||'',price=Number(raw.replace(/\D/g,''));
        if(price){if(value.priceMin)show=show&&price>=Number(value.priceMin);if(value.priceMax)show=show&&price<=Number(value.priceMax);if((value.priceRanges||[]).length)show=show&&value.priceRanges.some(function(r){return ranges[r]&&price>=ranges[r][0]&&price<=ranges[r][1];});}
        item.hidden=!show;if(show)visible++;
      });
      var forms=value.market==='secondary'?['объект','объекта','объектов']:['проект','проекта','проектов'];var plural=visible%100>=11&&visible%100<=14?2:visible%10===1?0:visible%10>=2&&visible%10<=4?1:2;summary.querySelector('.catalog-result-count').textContent=visible+' '+forms[plural];
      grid.querySelector('.catalog-filter-empty').hidden=!!visible;var footer=grid.querySelector('.catalog-grid__footer');if(footer)footer.hidden=!visible;
    }
    listen(marketSelect,'change',function(){if(state().market!==marketSelect.value){patch({market:marketSelect.value});toolbar.dispatchEvent(new CustomEvent('barnes:mode',{bubbles:true,detail:{mode:marketSelect.value}}));}});
    listen(input,'input',function(){patch({query:input.value});});
    listen(grid,'click',function(event){if(event.target.closest('[data-catalog-reset]'))reset();var map=event.target.closest('[data-open-resort-map]');if(map&&window.BarnesMapBrowser)window.BarnesMapBrowser.open(map);});
    var department=toolbar.querySelector('.catalog-department select');
    listen(department,'change',function(){if(department.value==='resort')return;var url=new URL('https://daniilterekh-prog.github.io/barn-estate-homepage-clone/katalog-nedvizhimosti/');url.searchParams.set('direction',department.value);url.searchParams.set('deal','buy');var event=new CustomEvent('barnes:department',{bubbles:true,cancelable:true,detail:{direction:department.value,url:url.href}});if(toolbar.dispatchEvent(event))location.href=url.href;});
    if(sort)listen(sort,'change',function(){if(state().sort!==sort.value)patch({sort:sort.value});});
    listen(document,'barnes:filters-apply',sync);listen(small,'change',layout);
    layout();sync();var cleanup=function(){controller.abort();mounted.delete(toolbar);};mounted.set(toolbar,cleanup);return cleanup;
  }
  window.BarnEstateCatalogFilters={mount:mount};
}());
