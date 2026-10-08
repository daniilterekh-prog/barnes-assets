import {initCarousel} from './carousel.js';
import {initMechanics} from './mechanics.js';
import {initDirections} from './directions.js';

let nextId=0;
const instances=new WeakMap();

function uniqueIds(root,uid){
 const ids=new Map();
 root.querySelectorAll('[id]').forEach(el=>{const old=el.id;el.dataset.sourceId ||= old;el.id=uid+'-'+old;ids.set(old,el.id);});
 root.querySelectorAll('*').forEach(el=>{
  for(const name of ['aria-controls','aria-labelledby','aria-describedby','for']){
   const value=el.getAttribute(name);if(value)el.setAttribute(name,value.split(/\s+/).map(id=>ids.get(id)||id).join(' '));
  }
  const href=el.getAttribute('href');if(href?.startsWith('#')&&ids.has(href.slice(1)))el.setAttribute('href','#'+ids.get(href.slice(1)));
 });
}

async function previewModal(detail){
 const response=await fetch(new URL('../../request-modal/partners/fragment.html',import.meta.url));
 if(!response.ok)throw Error('Preview modal unavailable');
 const host=document.createElement('div');host.innerHTML=await response.text();document.body.append(host);
 const root=host.querySelector('[data-barnes-block]');
 const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('../../request-modal/partners/styles.css',import.meta.url);document.head.append(css);
 // Resolve fragment assets relative to its own folder, not the current page.
 root.querySelectorAll('img[src]').forEach(img=>{img.src=new URL(img.getAttribute('src'),new URL('../../request-modal/partners/',import.meta.url));});
 const api=initBlock(root,{preview:true,onClose:()=>{api.destroy();host.remove();css.remove();}});api.open(detail);
}

export function initBlock(root,options={}){
 if(!root)throw Error('initBlock requires a root element');
 if(instances.has(root))return instances.get(root);
 root.classList.toggle('is-preview',Boolean(options.preview));
 const uid='barnes-partners-'+(++nextId),controller=new AbortController(),signal=controller.signal;
 const listen=(target,event,handler,settings={})=>target?.addEventListener(event,handler,{...settings,signal});
 if(root.dataset.barnesBlock==='directions'){root.querySelector('[data-source-id="barnes-directions"]')?.removeAttribute('data-initialized');initDirections(root);}
 uniqueIds(root,uid);
 const api={destroy:()=>{controller.abort();api.close?.();instances.delete(root);},open:null,close:null};
 instances.set(root,api);
 function request(detail={}){root.dispatchEvent(new CustomEvent('barnes:request',{bubbles:true,detail}));}
 listen(root,'barnes:request',event=>{
  if(options.preview)previewModal(event.detail).catch(()=>note('Превью формы недоступно. Подключите обработчик заявки.'));
  else options.onRequest?.(event.detail,event);
 });
 function note(text){let status=root.querySelector('.barnes-preview-note');if(!status){status=document.createElement('p');status.className='barnes-preview-note';status.setAttribute('role','status');root.append(status);}status.textContent=text;}

 root.querySelectorAll('.ambassadors-conditions__reveal,.ambassadors-advantages__reveal').forEach(button=>{
  // Carousel binds its own reveal buttons after this pass.
  if(button.matches('.ambassadors-advantages__reveal')){button.remove();return;}
  const card=button.closest('.ambassadors-conditions__card');button.setAttribute('aria-expanded','false');button.textContent='+';
  listen(button,'click',()=>{const open=card.classList.toggle('is-revealed');button.setAttribute('aria-expanded',String(open));button.textContent=open?'−':'+';});
  listen(button,'keydown',event=>{if(event.key==='Escape'){card.classList.remove('is-revealed');button.setAttribute('aria-expanded','false');button.textContent='+';}});
 });
 if(root.dataset.barnesBlock==='advantages')initCarousel(root,uid,signal);
 if(root.dataset.barnesBlock==='mechanics')initMechanics(root,signal);
 root.querySelectorAll('.catalog-faq__question').forEach(button=>{
  const item=button.closest('.catalog-faq__item'),answer=item?.querySelector('.catalog-faq__answer');
  if(answer){answer.id ||= uid+'-faq-'+Math.random().toString(36).slice(2);button.setAttribute('aria-controls',answer.id);}
  listen(button,'click',()=>{const open=item.classList.toggle('catalog-faq__item--open');button.setAttribute('aria-expanded',String(open));answer?.classList.toggle('catalog-faq__answer--open',open);});
 });
 const methods=[...root.querySelectorAll('.catalog-contact__method')];
 methods.forEach(button=>listen(button,'click',()=>{
  methods.forEach(b=>{const active=b===button;b.classList.toggle('catalog-contact__method--active',active);b.setAttribute('aria-pressed',String(active));});
  const field=root.querySelector('input[name="preferredChannel"]');if(field)field.value=button.textContent.trim();
 }));
 root.querySelectorAll('form').forEach(form=>{
  if(form.classList.contains('catalog-contact__form')){
   let field=form.querySelector('input[name="preferredChannel"]');if(!field){field=document.createElement('input');field.type='hidden';field.name='preferredChannel';form.append(field);}field.value=methods.find(b=>b.getAttribute('aria-pressed')==='true')?.textContent.trim()||'WhatsApp';
  }
  // Snapshot forms can lack name/required because original app supplied them.
  form.querySelectorAll('input:not([type=hidden]):not([type=checkbox]),textarea').forEach((input,i)=>{
   if(input.closest('[aria-hidden=true]'))return;
   input.name ||= input.type==='email'?'email':input.type==='tel'?'phone':input.tagName==='TEXTAREA'?'message':i===0?'name':'contact';
   if(input.tagName!=='TEXTAREA')input.required=true;
  });
  listen(form,'submit',async event=>{
   event.preventDefault();if(!form.reportValidity())return;
   if(options.preview||!options.onSubmit){note('Демонстрация: отправка не подключена. Данные никуда не переданы.');return;}
   const button=form.querySelector('[type=submit]');if(button?.disabled)return;if(button)button.disabled=true;
   try{const result=await options.onSubmit(new FormData(form),{block:root.dataset.barnesBlock,form});note(result?.message||'Заявка отправлена.');}catch{note('Не удалось отправить заявку. Попробуйте ещё раз.');}finally{if(button)button.disabled=false;}
  });
 });
 const triggers='.ambassadors-hero__button--primary,.owner-sale-stages__offer-btn,.catalog-contact__card-submit,.site-footer__callback-btn,.floating-expert__card,.owner-sale-sticky__request';
 listen(root,'click',event=>{const target=event.target.closest(triggers);if(target&&root.contains(target))request({intent:target.matches('.catalog-contact__card-submit,.floating-expert__card')?'partnership':'recommendation'});});
 const closeFloating=root.querySelector('.floating-expert__close');listen(closeFloating,'click',()=>{const card=root.querySelector('.floating-expert__card');if(card)card.hidden=true;closeFloating.hidden=true;});
 const menu=root.querySelector('.site-menu'),menuButton=root.querySelector('.site-header__icon-btn'),header=root.querySelector('.site-header');
 if(menu&&menuButton){
  menu.hidden=true;menuButton.setAttribute('aria-controls',menu.id);menuButton.setAttribute('aria-expanded','false');
  const setMenu=open=>{menu.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));header?.classList.toggle('site-header--menu-open',open);if(open)(menu.querySelector('a,button')||menuButton).focus();else menuButton.focus();};
  listen(menuButton,'click',()=>setMenu(menu.hidden));listen(root,'keydown',e=>{if(menu.hidden)return;if(e.key==='Escape')setMenu(false);if(e.key==='Tab'){const list=[...menu.querySelectorAll('a[href],button')].filter(el=>el.getClientRects().length);if(e.shiftKey&&document.activeElement===list[0]){e.preventDefault();list.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===list.at(-1)){e.preventDefault();list[0]?.focus();}}});
 }
 const sticky=root.querySelector('.owner-sale-sticky'),toggle=root.querySelector('.owner-sale-sticky__contact-toggle'),contactPanel=root.querySelector('.owner-sale-sticky__contact-panel');
 if(toggle&&contactPanel){contactPanel.hidden=true;listen(toggle,'click',()=>{contactPanel.hidden=!contactPanel.hidden;toggle.setAttribute('aria-expanded',String(!contactPanel.hidden));});}
 if(sticky&&options.hero&&!options.preview){const sync=()=>{const visible=options.hero.getBoundingClientRect().bottom<=0;sticky.classList.toggle('owner-sale-sticky--visible',visible);sticky.toggleAttribute('inert',!visible);sticky.setAttribute('aria-hidden',String(!visible));};listen(window,'scroll',sync,{passive:true});listen(window,'resize',sync,{passive:true});sync();}
 const modal=root.querySelector('.feedback-modal');
 if(modal){
  let previousFocus,previousOverflow,opened=false;
  const focusables=()=>[...modal.querySelectorAll('button,input,textarea,a[href],[tabindex]')].filter(e=>!e.disabled&&e.tabIndex>=0&&e.getClientRects().length);
  const direction=modal.querySelector('.feedback-modal__direction')||document.createElement('p');direction.className='feedback-modal__direction';if(!direction.parentElement)modal.querySelector('.feedback-modal__intro')?.after(direction);
  const hidden=modal.querySelector('input[name="directionId"]')||document.createElement('input');hidden.type='hidden';hidden.name='directionId';if(!hidden.parentElement)modal.querySelector('form')?.append(hidden);
  api.open=(detail={})=>{previousFocus=document.activeElement;previousOverflow=document.body.style.overflow;opened=true;modal.hidden=false;modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');document.body.style.overflow='hidden';direction.hidden=!detail.directionName;direction.textContent=detail.directionName?'Направление: '+detail.directionName:'';hidden.value=detail.directionId||'';const name=modal.querySelector('input[name="directionName"]');if(name)name.value=detail.directionName||'';const title=modal.querySelector('.feedback-modal__title');if(title)title.textContent=detail.intent==='partnership'?'Обсудить партнёрство':'Рекомендовать клиента';(modal.querySelector('input:not([type=hidden])')||focusables()[0])?.focus();};
  api.close=()=>{if(!opened)return;opened=false;modal.hidden=true;modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');document.body.style.overflow=previousOverflow;previousFocus?.focus();options.onClose?.();};
  listen(modal.querySelector('.feedback-modal__close'),'click',api.close);listen(modal.querySelector('.feedback-modal__overlay'),'click',api.close);
  listen(modal,'keydown',e=>{if(e.key==='Escape'){e.preventDefault();api.close();}else if(e.key==='Tab'){const list=focusables(),first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
  modal.querySelectorAll('[data-channel]').forEach(b=>listen(b,'click',()=>{modal.querySelectorAll('[data-channel]').forEach(other=>other.setAttribute('aria-pressed',String(other===b)));const field=modal.querySelector('input[name="preferredChannel"]');if(field)field.value=b.dataset.channel;const phone=modal.querySelector('input[name="phone"]'),label=b.dataset.channel==='Звонок'?'Номер телефона':'Номер телефона в '+b.dataset.channel;if(phone){phone.placeholder=label;phone.setAttribute('aria-label',label);if(phone.previousElementSibling)phone.previousElementSibling.textContent=label;}}));
 }
 return api;
}
