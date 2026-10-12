/** Reusable interactions. Production data arrives through options or bubbling events. */
export async function mountNode(host, folder, options = {}) {
  const base = new URL(folder, location.href);
  const view = matchMedia('(max-width:540px)').matches ? 'mobile.html' : 'fragment.html';
  const response = await fetch(new URL(view, base));
  if (!response.ok) throw new Error(`Block load failed: ${response.status}`);
  host.innerHTML = await response.text();
  host.querySelectorAll('[src]').forEach(el => el.src = new URL(el.getAttribute('src'), base).href);
  const manifest = await fetch(new URL('block.json', base)).then(r => r.json());
  host.dataset.nodeId = manifest.id;
  return initNode(host, options);
}

export function initNode(root, options = {}) {
  const controller = new AbortController();
  const listen = (target, type, callback) => target?.addEventListener(type, callback, {signal:controller.signal});
  const emit = (type, detail) => root.dispatchEvent(new CustomEvent(`barnes:${type}`, {bubbles:true, detail}));
  let modal = null, previousFocus = null, modalCleanup = null;
  const closeModal = () => { modalCleanup?.(); modalCleanup = null; modal?.remove(); modal = null; document.body.classList.remove('catalog-modal-open'); previousFocus?.focus(); };
  async function request(trigger) {
    if (options.onRequest) return options.onRequest({trigger,root});
    if (modal) return;
    previousFocus = trigger;
    modal = document.createElement('div');
    modalCleanup = await mountNode(modal,new URL('../request-modal/',import.meta.url),options);
    document.body.appendChild(modal);
    const dialog = modal.querySelector('.catalog-feedback-modal');
    dialog.hidden = false;
    dialog.style.position = 'fixed';
    document.body.classList.add('catalog-modal-open');
    if(trigger.matches('.catalog-sticky__callback'))dialog.querySelector('[data-channel="call"]')?.click();
    listen(modal,'click',e=>{if(e.target===dialog||e.target.closest('[data-catalog-modal-close]'))closeModal();});
    listen(modal,'keydown',e=>{
      if(e.key==='Escape'){closeModal();return;}
      if(e.key!=='Tab')return;
      const items=[...modal.querySelectorAll('button,input:not([type=hidden]),textarea,a[href]')].filter(el=>!el.disabled&&el.getClientRects().length);
      const first=items[0],last=items.at(-1);
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    });
    dialog.querySelector('input:not([type=hidden])')?.focus();
  }
  root.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(el=>{
    if(!el.getAttribute('aria-label')&&!el.labels?.length)el.setAttribute('aria-label',el.placeholder);
  });
  function filter(trigger) {
    const key = trigger.getAttribute('aria-label')?.split(':')[0] || trigger.textContent.trim();
    if(options.onFilter)return options.onFilter({key,trigger,root});
    const dialog=document.createElement('dialog');dialog.className='node-filter-dialog';
    const title=document.createElement('h3');title.textContent=key;dialog.append(title);
    const form=document.createElement('form');form.method='dialog';
    const input=document.createElement('input');input.name='value';input.setAttribute('aria-label',key);input.placeholder='Значение фильтра';
    const apply=document.createElement('button');apply.textContent='Применить';
    form.append(input,apply);dialog.append(form);root.append(dialog);
    trigger.setAttribute('aria-expanded','true');
    dialog.addEventListener('close',()=>{trigger.setAttribute('aria-expanded','false');if(dialog.returnValue!==''){emit('filter',{key,value:input.value});}dialog.remove();trigger.focus();},{once:true});
    form.addEventListener('submit',()=>{dialog.returnValue='apply';});dialog.showModal();
  }
  listen(root,'click',async e=>{
    const trigger=e.target.closest('button,a');if(!trigger)return;
    if(trigger.matches('.catalog-sticky__contact-toggle')){
      const panel=root.querySelector('.catalog-sticky__contact-panel');panel.hidden=!panel.hidden;
      trigger.setAttribute('aria-expanded',String(!panel.hidden));return;
    }
    if(trigger.matches('.catalog-mode-switch__button')){
      const mode=trigger.dataset.listingMode;
      root.querySelectorAll('.catalog-mode-switch__button').forEach(el=>{el.classList.toggle('is-active',el===trigger);el.setAttribute('aria-pressed',String(el===trigger));});
      root.querySelectorAll('.catalog-grid__item[data-listing-mode]').forEach(el=>el.hidden=el.dataset.listingMode!==mode);
      if(options.referenceFilters && window.BarnesFilters)window.BarnesFilters.patch({market:mode});
      emit('mode',{mode});return;
    }
    if(trigger.matches('.catalog-quick-filters__button,.catalog-mode-detailed-filters,.catalog-hero-filters__filter-icon')){if(!options.referenceFilters)filter(trigger);return;}
    if(trigger.matches('.catalog-hero-filters__toggle')){
      const panel=root.querySelector('.catalog-hero-filters__panel');if(panel){panel.hidden=!panel.hidden;trigger.setAttribute('aria-expanded',String(!panel.hidden));}return;
    }
    if(trigger.matches('.catalog-faq__question')){
      const item=trigger.closest('.catalog-faq__item'),answer=item.querySelector('.catalog-faq__answer'),open=trigger.getAttribute('aria-expanded')!=='true';
      trigger.setAttribute('aria-expanded',String(open));item.classList.toggle('catalog-faq__item--open',open);answer.classList.toggle('catalog-faq__answer--open',open);return;
    }
    if(trigger.matches('.catalog-intro__toggle')){
      const details=root.querySelector('.catalog-intro__details'),open=trigger.getAttribute('aria-expanded')!=='true';
      trigger.setAttribute('aria-expanded',String(open));details.setAttribute('aria-hidden',String(!open));details.style.maxHeight=open?`${details.scrollHeight}px`:'0px';return;
    }
    if(trigger.matches('.launch-card__favorite,.apartment-card__favorite')){
      trigger.setAttribute('aria-pressed',String(trigger.getAttribute('aria-pressed')!=='true'));emit('favorite',{trigger});return;
    }
    if(trigger.matches('.floating-expert__close')){trigger.closest('.floating-expert').hidden=true;return;}
    if(trigger.matches('.catalog-consultation__method,.catalog-contact__method,[data-channel]')){
      trigger.parentElement.querySelectorAll('button').forEach(el=>{const active=el===trigger;el.setAttribute(el.hasAttribute('data-channel')?'aria-pressed':'aria-selected',String(active));el.classList.toggle('catalog-consultation__method--active',active&&el.classList.contains('catalog-consultation__method'));el.classList.toggle('catalog-contact__method--active',active&&el.classList.contains('catalog-contact__method'));});
      const value=root.querySelector('[name=preferredChannel]');if(value)value.value=trigger.textContent.trim();return;
    }
    if(trigger.matches('.catalog-projects-map__fullscreen')){if(options.referenceFilters)return;const map=trigger.closest('.catalog-projects-map');if(document.fullscreenElement)await document.exitFullscreen();else await map.requestFullscreen();return;}
    if(trigger.matches('.site-header__search-btn')){e.preventDefault();options.onSearch?.({trigger,root});emit('search',{trigger});return;}
    if(trigger.matches('.site-header__menu-btn,.site-header__icon-btn')){options.onMenu?.({trigger,root});emit('menu',{trigger});return;}
    if(trigger.matches('.catalog-sticky__request,.catalog-contact__card-submit,.floating-expert__card,.apartment-card__call-btn,.site-header__callback-btn,.site-footer__callback-btn')){e.preventDefault();await request(trigger);}
  });
  listen(root,'change',e=>{if(e.target.matches('.catalog-grid__sort-select')){options.onSort?.({value:e.target.value,root});emit('sort',{value:e.target.value});}});
  if(options.referenceFilters)listen(document,'barnes:filters-apply',()=>{
    const mode=window.BarnesFilters.getState().market;
    root.querySelectorAll('.catalog-mode-switch__button').forEach(el=>{const active=el.dataset.listingMode===mode;el.classList.toggle('is-active',active);el.setAttribute('aria-pressed',String(active));});
    root.querySelectorAll('.catalog-grid__item[data-listing-mode]').forEach(el=>el.hidden=el.dataset.listingMode!==mode);
  });
  root.querySelectorAll('form').forEach(form=>listen(form,'submit',async e=>{
    e.preventDefault();
    if(form.closest('.catalog-hero')){options.onSearch?.({form,root});emit('search',{form});return;}
    let status=form.querySelector('[role=status]');if(!status){status=document.createElement('p');status.className='node-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');form.append(status);}
    const inputs=[...form.querySelectorAll('input,textarea')].filter(el=>el.type!=='hidden'&&el.tabIndex!==-1&&!el.closest('[aria-hidden=true]'));
    const phone=inputs.find(el=>el.type==='tel'),consent=inputs.find(el=>el.type==='checkbox');
    if(phone&&!phone.value.trim()){status.textContent='Укажи номер телефона.';phone.focus();return;}
    if(consent&&!consent.checked){status.textContent='Подтверди согласие на обработку данных.';consent.focus();return;}
    if(!form.checkValidity()){form.reportValidity();return;}
    if(!options.onSubmit){status.textContent='Превью: отправка не подключена, данные не отправлены.';emit('submit',{form});return;}
    const data=new FormData(form);inputs.forEach((el,i)=>{if(!el.name)data.append(el.type==='checkbox'?'consent':`field${i}`,el.type==='checkbox'?String(el.checked):el.value);});
    try{status.textContent=await options.onSubmit({data,form,root})||'Заявка обработана.';}catch{status.textContent='Не удалось отправить заявку.';}
  }));
  root.querySelectorAll('.catalog-projects-map').forEach(el=>options.onMap?.({element:el,root}));
  return ()=>{controller.abort();closeModal();};
}
