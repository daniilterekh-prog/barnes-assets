import { mountNode } from './runtime.js';
import { bootReferenceFilters } from './reference-filters.js';
const host = document.querySelector('.node-preview');
const base = new URL('../',import.meta.url);
if(host.dataset.node)await mountNode(host,new URL(`${host.dataset.node}/`,base),{referenceFilters:true});
else {
  const manifest=await fetch(new URL('manifest.json',base)).then(r=>r.json());
  for(const block of manifest.blocks){
    if(!block.assembly)continue;
    const slot=document.createElement('div');host.append(slot);
    await mountNode(slot,new URL(`${block.id.replace('first-degree-','')}/`,base),{referenceFilters:true});
  }
  const sticky=host.querySelector('.catalog-sticky'),hero=host.querySelector('.catalog-hero');
  function update(){const visible=scrollY>hero.getBoundingClientRect().bottom+scrollY-120;sticky.classList.toggle('catalog-sticky--visible',visible);sticky.toggleAttribute('inert',!visible);sticky.setAttribute('aria-hidden',String(!visible));}
  addEventListener('scroll',update,{passive:true});update();
}
if(host.dataset.node==='request-modal')host.querySelector('.catalog-feedback-modal').hidden=false;
if(host.dataset.node==='sticky-nav'){
  const sticky=host.querySelector('.catalog-sticky');sticky.classList.add('catalog-sticky--visible');sticky.inert=false;sticky.setAttribute('aria-hidden','false');
}
if(host.querySelector('.catalog-quick-filters__button,.catalog-projects-map__fullscreen,.catalog-hero-filters__filter-icon'))await bootReferenceFilters();
if(host.querySelector('.catalog-best-offers')){
  const script=document.createElement('script');script.src=new URL('./start-sales.js',import.meta.url);document.body.append(script);
}
