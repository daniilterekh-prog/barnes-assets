/* BARN Estate events carousel. Plain JavaScript, no dependencies.
 * HTML must already be in the document. For SPA use BarnEstateEvents.initAll()
 * after mounting the section. Repeated calls keep existing instances intact.
 */
(() => {
  'use strict';
  function init(section){
    if(section.dataset.eventsCarouselReady)return;
    const track=section.querySelector('.home-events__grid');
    const cards=[...track.children];
    const nav=section.querySelector('.home-events__nav');
    const previous=nav.querySelector('[data-events-prev]');
    const next=nav.querySelector('[data-events-next]');
    const status=section.querySelector('.home-events__status');
    let index=0,frame=0,settle;
    const metrics=()=>{
      const gap=parseFloat(getComputedStyle(track).gap)||0;
      const step=cards[0].getBoundingClientRect().width+gap;
      const visible=Math.max(1,Math.round((track.clientWidth+gap)/step));
      return {step,visible,last:Math.max(0,cards.length-visible)};
    };
    function sync(announce){
      const {step,visible,last}=metrics();
      if(!step)return;
      index=Math.min(last,Math.max(0,Math.round(track.scrollLeft/step)));
      previous.disabled=track.scrollLeft<2;
      next.disabled=track.scrollWidth-track.clientWidth-track.scrollLeft<2;
      const viewport=track.getBoundingClientRect();
      for(const card of cards){
        const rect=card.getBoundingClientRect();
        const hidden=rect.right<=viewport.left+2||rect.left>=viewport.right-2;
        card.inert=hidden;
        if(hidden)card.setAttribute('aria-hidden','true');else card.removeAttribute('aria-hidden');
      }
      const text=`Мероприятия ${index+1}–${Math.min(cards.length,index+visible)} из ${cards.length}`;
      if(announce&&status.textContent!==text)status.textContent=text;
    }
    function go(target){
      const {step,last}=metrics();
      index=Math.min(last,Math.max(0,target));
      track.scrollTo({left:index*step,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    }
    previous.addEventListener('click',()=>go(index-metrics().visible));
    next.addEventListener('click',()=>go(index+metrics().visible));
    track.addEventListener('scroll',()=>{
      if(!frame)frame=requestAnimationFrame(()=>{frame=0;sync(false)});
      clearTimeout(settle);settle=setTimeout(()=>sync(true),140);
    },{passive:true});
    track.addEventListener('keydown',event=>{
      if(event.target!==track)return;
      const {visible,last}=metrics();
      const targets={ArrowLeft:index-visible,ArrowRight:index+visible,Home:0,End:last};
      if(!(event.key in targets))return;
      event.preventDefault();go(targets[event.key]);
    });
    new ResizeObserver(()=>{
      const {step,last}=metrics();
      track.scrollLeft=Math.min(index,last)*step;
      sync(true);
    }).observe(track);
    section.dataset.eventsCarouselReady='true';nav.hidden=false;sync(true);
  }

  function initAll() {
    document.querySelectorAll('.home-events').forEach(init);
  }
  window.BarnEstateEvents = { init, initAll };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll, { once: true });
  } else {
    initAll();
  }
})();
