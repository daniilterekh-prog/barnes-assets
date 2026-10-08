export function initCarousel(root,uid,signal){
  var advantages = root.querySelector('.ambassadors-advantages__slider');
  var previous = root.querySelector('.ambassadors-advantages__nav-btn[aria-label*="Предыдущее"]');
  var next = root.querySelector('.ambassadors-advantages__nav-btn[aria-label*="Следующее"]');
  var advantageIndex = 0;
  var advantagesList = advantages && advantages.querySelector('.splide__list');
  var advantagesTrack = advantages && advantages.querySelector('.splide__track');
  var advantageCards = advantagesList ? Array.prototype.slice.call(advantagesList.querySelectorAll('.splide__slide')) : [];
  var advantageDragStart = null;
  var advantageDragOffset = 0;

  function visibleAdvantageCount() {
    if (window.matchMedia('(max-width: 768px)').matches) return 1;
    if (window.matchMedia('(max-width: 1024px)').matches) return 2;
    return 3;
  }

  function advantageStep() {
    if (!advantageCards.length) return 0;
    var cardStyle = window.getComputedStyle(advantageCards[0]);
    return advantageCards[0].getBoundingClientRect().width + (parseFloat(cardStyle.marginRight) || 0);
  }

  function updateAdvantages(animate) {
    if (!advantagesList || !advantageCards.length) return;
    var visibleCount = visibleAdvantageCount();
    var maxIndex = Math.max(0, advantageCards.length - visibleCount);
    advantageIndex = Math.max(0, Math.min(advantageIndex, maxIndex));
    advantageDragOffset = -advantageIndex * advantageStep();

    advantagesList.style.transition = animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'transform 400ms cubic-bezier(.25, 1, .5, 1)'
      : 'none';
    advantagesList.style.transform = 'translateX(' + advantageDragOffset + 'px)';

    advantageCards.forEach(function (card, index) {
      var visible = index >= advantageIndex && index < advantageIndex + visibleCount;
      card.classList.toggle('is-active', index === advantageIndex);
      card.classList.toggle('is-next', index === advantageIndex + 1);
      card.classList.toggle('is-visible', visible);
      var reveal = card.querySelector('.ambassadors-advantages__reveal');
      if (reveal) reveal.tabIndex = visible ? 0 : -1;
      if (visible) card.removeAttribute('aria-hidden');
      else card.setAttribute('aria-hidden', 'true');
    });

    if (previous) previous.disabled = advantageIndex === 0;
    if (next) next.disabled = advantageIndex === maxIndex;
    var progress = root.querySelector('.ambassadors-advantages__progress');
    if (progress) progress.textContent = String(advantageIndex + 1).padStart(2, '0') +
      (visibleCount > 1 ? '–' + String(Math.min(advantageIndex + visibleCount, advantageCards.length)).padStart(2, '0') : '') +
      ' / ' + advantageCards.length;
  }

  function moveAdvantages(direction) {
    advantageIndex += direction;
    updateAdvantages(true);
  }

  if (previous) previous.addEventListener('click', function () { moveAdvantages(-1); });
  if (next) next.addEventListener('click', function () { moveAdvantages(1); });

  if (advantagesTrack && advantagesList && advantageCards.length) {
    advantageCards.forEach(function (slide, index) {
      var card = slide.querySelector('.ambassadors-advantages__card');
      var description = card.querySelector('.ambassadors-advantages__description');
      description.id = uid + '-advantage-description-' + index;
      var reveal = document.createElement('button');
      reveal.type = 'button';
      reveal.className = 'ambassadors-advantages__reveal';
      reveal.setAttribute('aria-label', 'Описание: ' + card.querySelector('h3').textContent);
      reveal.setAttribute('aria-controls', description.id);
      reveal.setAttribute('aria-expanded', 'false');
      reveal.textContent = '+';
      reveal.addEventListener('pointerdown', function (event) { event.stopPropagation(); });
      reveal.addEventListener('click', function () {
        var open = card.classList.toggle('is-revealed');
        reveal.setAttribute('aria-expanded', String(open));
        reveal.textContent = open ? '−' : '+';
      });
      card.appendChild(reveal);
    });
    advantagesTrack.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        moveAdvantages(event.key === 'ArrowRight' ? 1 : -1);
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        advantageIndex = event.key === 'Home' ? 0 : advantageCards.length;
        updateAdvantages(true);
      }
    });
    advantagesTrack.addEventListener('pointerdown', function (event) {
      if (event.button !== undefined && event.button !== 0) return;
      advantageDragStart = event.clientX;
      advantagesList.style.transition = 'none';
      advantagesTrack.classList.add('is-dragging');
      if (advantagesTrack.setPointerCapture) advantagesTrack.setPointerCapture(event.pointerId);
    });

    advantagesTrack.addEventListener('pointermove', function (event) {
      if (advantageDragStart === null) return;
      var delta = event.clientX - advantageDragStart;
      advantagesList.style.transform = 'translateX(' + (advantageDragOffset + delta) + 'px)';
    });

    function finishAdvantagesDrag(event) {
      if (advantageDragStart === null) return;
      var delta = event.clientX - advantageDragStart;
      var threshold = Math.min(72, Math.max(36, advantageStep() * .16));
      advantageDragStart = null;
      advantagesTrack.classList.remove('is-dragging');
      if (Math.abs(delta) >= threshold) advantageIndex += delta < 0 ? 1 : -1;
      updateAdvantages(true);
    }

    advantagesTrack.addEventListener('pointerup', finishAdvantagesDrag);
    advantagesTrack.addEventListener('pointercancel', finishAdvantagesDrag);
    window.addEventListener('resize', function () { updateAdvantages(false); }, { passive: true, signal });
  }

  updateAdvantages(false);

}
