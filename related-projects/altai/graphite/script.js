/* Progressive enhancement: all cards and text links are present in the HTML. */
(() => {
  function init(){
  document.querySelectorAll('[data-barnes-altai-related]').forEach(section => {
    const root = document.getElementById('root');
    if(root){
      const place = () => {const footer=root.querySelector('footer');if(footer && section.nextElementSibling!==footer)footer.before(section);};
      place();new MutationObserver(place).observe(root,{childList:true,subtree:true});
    }
    const track = section.querySelector('.barnes-altai-related__track');
    const items = [...track.children];
    const controls = section.querySelector('.barnes-altai-related__controls');
    const previous = section.querySelector('[data-altai-related-prev]');
    const next = section.querySelector('[data-altai-related-next]');
    const count = section.querySelector('.barnes-altai-related__count');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    function update() {
      const start = track.getBoundingClientRect().left;
      const nearest = items.reduce((best, item, index) => Math.abs(item.getBoundingClientRect().left - start) < Math.abs(items[best].getBoundingClientRect().left - start) ? index : best, 0);
      count.textContent = `${String(nearest + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
      previous.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
    }
    function move(direction) {
      const step = items[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap);
      track.scrollBy({left: direction * step, behavior: reducedMotion.matches ? 'instant' : 'smooth'});
    }
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    track.addEventListener('scroll', update, {passive: true});
    track.addEventListener('keydown', event => {
      if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    });
    // Tabbing to a card must also reveal it without moving the whole page.
    track.addEventListener('focusin', event => {
      const item = event.target.closest('.barnes-altai-related__item');
      if (!item) return;
      const outer = track.getBoundingClientRect();
      const inner = item.getBoundingClientRect();
      if (inner.left < outer.left || inner.right > outer.right) {
        track.scrollBy({left: inner.left - outer.left, behavior: 'instant'});
      }
    });
    controls.hidden = false;
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(track);
    else window.addEventListener('resize', update);
    update();
  });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
