/* Coordinate the static site header and hero without moving their authored DOM. */
(function () {
  if (window.BarnEstateHeaderLayout) return;
  var mounted = new WeakSet();
  function mount(root) {
    var header = root.querySelector('.layout__header .site-header');
    var hero = root.querySelector('.catalog-hero');
    if (!header || mounted.has(header)) return function () {};
    mounted.add(header);
    function update() {
      if (!hero) return;
      var overlap = Math.max(0, Math.ceil(header.getBoundingClientRect().bottom - hero.getBoundingClientRect().top));
      hero.style.setProperty('--catalog-hero-header-height', overlap + 'px');
      hero.classList.toggle('catalog-hero--with-header', overlap > 0);
    }
    var observer = new ResizeObserver(update);
    observer.observe(header); window.addEventListener('resize', update); update();
    return function () {
      observer.disconnect(); window.removeEventListener('resize', update); mounted.delete(header);
      if (hero) { hero.style.removeProperty('--catalog-hero-header-height'); hero.classList.remove('catalog-hero--with-header'); }
    };
  }
  window.BarnEstateHeaderLayout = { mount: mount };
}());
