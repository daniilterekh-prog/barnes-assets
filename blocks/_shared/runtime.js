/** Portable adapters for the extracted reference blocks. No Vue/Nuxt dependency.
 * initBlock(root, { onRequest, onSubmit, preview, modalBase }) returns cleanup().
 * onSubmit receives {data, form, variant, block}; it must return a message.
 */
let serial = 0;
const requestSelector = '.owner-sale-hero__button,.owner-sale-sticky__request,.owner-sale-services__cta,.owner-sale-exclusive__cta,.owner-sale-stages__cta,.owner-sale-stages__offer-btn,.owner-sale-strategy__button,.be-cta,.catalog-contact__card-button,.floating-expert__card,.site-footer__button';
export function initBlock(root, options = {}) {
  if (!root || root.dataset.initialised) return () => {};
  root.dataset.initialised = 'true';
  root.dataset.preview = String(!!options.preview);
  const variant = root.dataset.variant || 'sale';
  const abort = new AbortController();
  const cleanups = [];
  const listen = (el, type, fn) => el?.addEventListener(type, fn, {signal:abort.signal});
  const ids = new Map();
  root.querySelectorAll('[id]').forEach(el => {const old=el.id;el.id='bb-'+(++serial)+'-'+old;ids.set(old,el.id);});
  root.querySelectorAll('[aria-labelledby],[aria-describedby],[aria-controls],[for]').forEach(el => {
    for(const attr of ['aria-labelledby','aria-describedby','aria-controls','for']) if(el.hasAttribute(attr))el.setAttribute(attr,el.getAttribute(attr).split(/\s+/).map(id=>ids.get(id)||id).join(' '));
  });
  const modal=root.querySelector('.feedback-modal');
  if(modal){modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');const title=modal.querySelector('.feedback-modal__title');if(title){title.id=title.id||'bb-modal-title-'+(++serial);modal.setAttribute('aria-labelledby',title.id);}}
  root.querySelectorAll('input,textarea').forEach(el=>{
    const label=el.closest('label');
    if(!el.getAttribute('aria-label') && !label?.textContent.trim() && el.type!=='hidden' && el.type!=='checkbox')el.setAttribute('aria-label',el.placeholder||el.name||'Поле формы');
  });
  let modalHost=null;
  async function request(trigger) {
    const detail={variant,block:root.dataset.barnesBlock,trigger};
    const event=new CustomEvent('barnes:request',{detail,bubbles:true,cancelable:true});
    if(!root.dispatchEvent(event))return;
    if(options.onRequest)return options.onRequest(detail);
    if(modalHost)return;
    const base=options.modalBase||new URL('../request-modal/'+variant+'/',import.meta.url);
    const response=await fetch(new URL('fragment.html',base));
    if(!response.ok)throw Error('Не удалось загрузить форму');
    const holder=document.createElement('div');holder.innerHTML=await response.text();
    modalHost=holder.firstElementChild;modalHost.dataset.modalHost='true';
    // Fragment asset paths are relative to its source, not the target page.
    modalHost.querySelectorAll('[src],[srcset]').forEach(el=>{
      for(const attr of ['src','srcset'])if(el.hasAttribute(attr))el.setAttribute(attr,new URL(el.getAttribute(attr),base).href);
    });
    const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('styles.css',base).href;document.head.appendChild(css);
    document.body.appendChild(modalHost);
    const stop=initBlock(modalHost,{...options,preview:false});
    const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
    const close=()=>{stop();modalHost?.remove();modalHost=null;css.remove();document.body.style.overflow=previousOverflow;trigger?.focus({preventScroll:true});};
    listen(modalHost,'click',e=>{if(e.target.closest('.modal__close')||e.target.classList.contains('vfm__overlay'))close();});
    listen(modalHost,'keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();return;}if(e.key!=='Tab')return;const items=[...modalHost.querySelectorAll('button,a[href],input:not([type=hidden]),textarea')].filter(el=>!el.disabled&&el.getClientRects().length);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}});
    modalHost.querySelector('.feedback-modal__input')?.focus();
    cleanups.push(close);
  }
  listen(root,'click',e=>{
    const trigger=e.target.closest(requestSelector);
    if(trigger){e.preventDefault();request(trigger).catch(error=>{const status=document.createElement('p');status.dataset.blockStatus='';status.role='alert';status.textContent=error.message;trigger.after(status);});}
    const toggle=e.target.closest('.owner-sale-sticky__contact-toggle');
    if(toggle){const panel=root.querySelector('.owner-sale-sticky__contact-panel');if(panel){panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));}}
    if(e.target.closest('.floating-expert__close'))root.querySelector('.floating-expert')?.setAttribute('hidden','');
    if(e.target.closest('.site-header__icon-btn')){const nav=root.querySelector('.site-header__nav');if(nav){nav.classList.toggle('bb-menu-open');nav.style.display=nav.classList.contains('bb-menu-open')?'block':'';}}
  });
  // Reference slider, without copied page-wide Splide/Vue handlers.
  root.querySelectorAll('.owner-sale-services__slider').forEach(slider=>{
    const list=slider.querySelector('.splide__list'),track=slider.querySelector('.splide__track');let offset=0;
    const prev=root.querySelector('.owner-sale-services__nav-btn:first-child'),next=root.querySelector('.owner-sale-services__nav-btn:last-child');
    function render(){const max=Math.max(0,list.scrollWidth-track.clientWidth);offset=Math.min(Math.max(0,offset),max);list.style.transform='translateX('+(-offset)+'px)';if(prev)prev.disabled=offset===0;if(next)next.disabled=offset>=max-1;}
    const step=()=>list.querySelector('.splide__slide').getBoundingClientRect().width+(parseFloat(getComputedStyle(list).gap)||0);
    listen(prev,'click',()=>{offset-=step();render();});listen(next,'click',()=>{offset+=step();render();});
    let start=null;listen(track,'pointerdown',e=>{start=e.clientX;});listen(track,'pointerup',e=>{if(start!==null&&Math.abs(e.clientX-start)>40){offset+=(e.clientX<start?1:-1)*step();render();}start=null;});
    const resize=new ResizeObserver(render);resize.observe(track);cleanups.push(()=>resize.disconnect());render();
  });
  // Four complete panel contents are supplied with each panorama variant.
  const data=root.querySelector('[data-block-content]');
  if(data){const reasons=JSON.parse(data.textContent),tabs=[...root.querySelectorAll('.be-tabs [role=tab]')],panel=root.querySelector('.be-tab-panel');let active=0;
    function select(index){active=index;panel.querySelector('h3').textContent=reasons[index].headline;panel.querySelector('.be-body').textContent=reasons[index].text;panel.querySelector('.be-evidence').textContent=reasons[index].evidence;panel.setAttribute('aria-labelledby',tabs[index].id);tabs.forEach((t,i)=>{t.setAttribute('aria-selected',String(i===index));t.tabIndex=i===index?0:-1;});}
    tabs.forEach((tab,i)=>{listen(tab,'click',()=>select(i));listen(tab,'keydown',e=>{const keys={ArrowRight:(i+1)%tabs.length,ArrowLeft:(i+tabs.length-1)%tabs.length,Home:0,End:tabs.length-1};if(e.key in keys){e.preventDefault();select(keys[e.key]);tabs[active].focus();}});});
    function measure(){const probe=panel.cloneNode(true);probe.removeAttribute('id');probe.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));probe.setAttribute('aria-hidden','true');probe.inert=true;probe.style.cssText='position:absolute;visibility:hidden;pointer-events:none;min-height:0;width:'+panel.getBoundingClientRect().width+'px';panel.parentElement.appendChild(probe);let h=0;reasons.forEach(reason=>{probe.querySelector('h3').textContent=reason.headline;probe.querySelector('.be-body').textContent=reason.text;probe.querySelector('.be-evidence').textContent=reason.evidence;h=Math.max(h,probe.getBoundingClientRect().height);});probe.remove();root.querySelector('.be-panorama-root').style.setProperty('--be-panel-height',Math.ceil(h)+'px');}
    const resize=new ResizeObserver(measure);resize.observe(root);cleanups.push(()=>resize.disconnect());document.fonts.ready.then(measure);select(0);
  }
  const rows=[...root.querySelectorAll('.owner-sale-exclusive__item,.owner-sale-stages__item')];
  if(rows.length){function update(){const desktop=innerWidth>900;const anchor=Math.min(innerHeight*.45,400);let selected=0;rows.forEach((e,i)=>{if(e.getBoundingClientRect().top<anchor)selected=i;});rows.forEach((e,i)=>{e.classList.toggle('is-active',!desktop||i===selected);e.classList.toggle('is-past',desktop&&i<selected);});}listen(window,'scroll',update);listen(window,'resize',update);update();}
  root.querySelectorAll('.feedback-modal__channel,.catalog-consultation__method,.catalog-contact__method').forEach(button=>listen(button,'click',()=>{
    const siblings=[...button.parentElement.querySelectorAll('button')];siblings.forEach(other=>{const active=other===button;other.setAttribute('aria-selected',String(active));for(const prefix of ['feedback-modal__channel','catalog-consultation__method','catalog-contact__method'])if(other.classList.contains(prefix))other.classList.toggle(prefix+'--active',active);});
    const channel=root.querySelector('input[name=preferredChannel]');if(channel)channel.value=button.textContent.trim();
  }));
  const initialChannel=root.querySelector('input[name=preferredChannel]');
  if(initialChannel&&!initialChannel.value)initialChannel.value=root.querySelector('.feedback-modal__channel--active')?.textContent.trim()||'Telegram';
  root.querySelectorAll('form').forEach(form=>listen(form,'submit',async e=>{
    e.preventDefault();let status=form.querySelector('[data-block-status]');if(!status){status=document.createElement('p');status.dataset.blockStatus='';status.setAttribute('role','status');status.setAttribute('aria-live','polite');form.appendChild(status);}
    const inputs=[...form.querySelectorAll('input:not([type=hidden]),textarea')].filter(el=>el.tabIndex!==-1&&!el.closest('[aria-hidden=true]'));
    const phone=inputs.find(el=>el.inputMode==='tel'||el.autocomplete==='tel'||el.name==='phone'),email=inputs.find(el=>el.type==='email'),consent=inputs.find(el=>el.type==='checkbox');
    if(phone&&!phone.value.trim()){phone.setAttribute('aria-invalid','true');status.textContent='Укажите номер телефона.';phone.focus();return;}
    if(email&&(!email.value.trim()||!email.validity.valid)){email.setAttribute('aria-invalid','true');status.textContent='Укажите корректный email.';email.focus();return;}
    if(consent&&!consent.checked){status.textContent='Подтвердите согласие на обработку персональных данных.';consent.focus();return;}
    if(!options.onSubmit){status.textContent='Это превью шаблона. Отправка не подключена; данные никуда не отправлены.';return;}
    try{const result=await options.onSubmit({data:new FormData(form),form,variant,block:root.dataset.barnesBlock});status.textContent=typeof result==='string'?result:'Обработчик завершён. Проверьте статус отправки.';}catch{status.textContent='Не удалось отправить. Попробуйте ещё раз.';}
  }));
  if(root.dataset.barnesBlock==='request-modal'&&options.preview){listen(root.querySelector('.modal__close'),'click',()=>{root.querySelector('.feedback-modal').hidden=true;const open=document.createElement('button');open.textContent='Открыть форму снова';open.style.cssText='margin:40px;padding:18px 32px;background:#8b1d25;color:white;border:0';root.appendChild(open);listen(open,'click',()=>{root.querySelector('.feedback-modal').hidden=false;open.remove();});});}
  return ()=>{abort.abort();cleanups.forEach(fn=>fn());delete root.dataset.initialised;};
}
