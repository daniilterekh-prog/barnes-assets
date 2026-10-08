export function initMechanics(root,signal){
  var stagesScrollFrame = null;
  function updateStagesScrollState() {
    var section = root.querySelector('[data-source-id="how-it-works"]');
    var items = section ? Array.prototype.slice.call(section.querySelectorAll('.owner-sale-stages__item')) : [];
    var headerBlock = section && section.querySelector('.owner-sale-stages__header');
    var desktop = window.matchMedia('(min-width: 901px)').matches;
    if (!section || !items.length) return;

    if (!desktop) {
      section.classList.remove('owner-sale-stages--scroll-ready');
      items.forEach(function (item) {
        item.classList.remove('is-active', 'is-past');
        item.style.removeProperty('--partners-stages-last-offset');
      });
      return;
    }

    var alignmentLine = headerBlock ? parseFloat(window.getComputedStyle(headerBlock).top) : 120;
    if (!Number.isFinite(alignmentLine)) alignmentLine = 120;

    var lastItem = items[items.length - 1];
    var currentLastOffset = parseFloat(lastItem.style.getPropertyValue('--partners-stages-last-offset')) || 0;
    var naturalLastTop = lastItem.getBoundingClientRect().top - currentLastOffset;
    var headerTop = headerBlock ? headerBlock.getBoundingClientRect().top : alignmentLine;
    var lastOffset = Math.max(0, headerTop - naturalLastTop);
    lastItem.style.setProperty('--partners-stages-last-offset', lastOffset + 'px');

    var activeIndex = 0;
    var closestDistance = Infinity;
    items.forEach(function (item, index) {
      var distance = Math.abs(item.getBoundingClientRect().top - alignmentLine);
      if (distance < closestDistance) {
        closestDistance = distance;
        activeIndex = index;
      }
    });

    section.classList.add('owner-sale-stages--scroll-ready');
    items.forEach(function (item, index) {
      item.classList.toggle('is-active', index === activeIndex);
      item.classList.toggle('is-past', index < activeIndex);
    });
  }

  function requestStagesScrollUpdate() {
    if (stagesScrollFrame) return;
    stagesScrollFrame = window.requestAnimationFrame(function () {
      stagesScrollFrame = null;
      updateStagesScrollState();
    });
  }

  window.addEventListener('scroll', requestStagesScrollUpdate, { passive: true, signal });
  window.addEventListener('resize', requestStagesScrollUpdate, { passive: true });
  window.addEventListener('load', requestStagesScrollUpdate, { once: true, signal });
  requestStagesScrollUpdate();

}
