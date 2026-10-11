import { mountNode } from './runtime.js';
const host = document.querySelector('.node-preview');
const base = new URL('../',import.meta.url);
if(host.dataset.node)await mountNode(host,new URL(`${host.dataset.node}/`,base));
else {
  const manifest=await fetch(new URL('manifest.json',base)).then(r=>r.json());
  for(const block of manifest.blocks){
    if(!block.assembly)continue;
    const slot=document.createElement('div');host.append(slot);
    await mountNode(slot,new URL(`${block.id.replace('first-degree-','')}/`,base));
  }
  const sticky=host.querySelector('.catalog-sticky'),hero=host.querySelector('.catalog-hero');
  function update(){const visible=scrollY>hero.getBoundingClientRect().bottom+scrollY-120;sticky.classList.toggle('catalog-sticky--visible',visible);sticky.toggleAttribute('inert',!visible);sticky.setAttribute('aria-hidden',String(!visible));}
  addEventListener('scroll',update,{passive:true});update();
}
if(host.querySelector('.catalog-best-offers')){
  const script=document.createElement('script');script.src=new URL('./start-sales.js',import.meta.url);document.body.append(script);
}
