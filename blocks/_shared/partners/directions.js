export function initDirections(scope) {
  "use strict";
  const root = scope.querySelector('[data-source-id="barnes-directions"]');
  if (!root || root.dataset.initialized) return;
  const data = JSON.parse(scope.querySelector("[data-block-content]").textContent);
  if (!Array.isArray(data) || !data.length) throw new Error("BarnesDirectionsData is missing");
  root.dataset.initialized = "true";
  const assetBase = root.dataset.assetBase || "./assets/images/";
  const photos = data.map(d => d.image);
  function feature(i) {
    const d = data[i];
    const negotiated = d.last[0] !== 'Комиссия';
    const stats = d.metrics
      ? d.metrics.map(m => `<div><div class="bd-label">${m[1]}</div><div class="bd-num">${m[0]}</div></div>`).join('')
      : d.facts.map(f => `<div><div class="bd-label">${f[0]}</div><div class="bd-facttext">${f[1]}</div></div>`).join('');
    return `<div class="bd-feature">
      <div class="bd-imagewrap"><img class="bd-photo" src="${photos[i]}" alt="${d.imageAlt || d.name}" decoding="async"></div>
      <div class="bd-copy">
        <div class="bd-heading"><h3>${d.title}</h3><p class="bd-intro">${d.intro}</p></div>
        <div class="bd-budget"><div class="bd-price-label">${d.label}</div><div class="bd-price ${d.words ? 'bd-words' : ''}">${d.price}</div></div>
        <div class="${d.metrics ? 'bd-metrics' : 'bd-textfacts'}">${stats}</div>
        <div class="bd-commission ${negotiated ? 'bd-commission-negotiated' : 'bd-commission-primary'}"><span class="bd-label">Комиссия BARNES</span><strong>${negotiated ? 'Условия оговариваются' : d.last[1]}</strong>${negotiated ? `<span class="bd-commission-note">${d.last[0]}: ${d.last[1]}</span>` : ''}</div>
        <button type="button" class="bd-cta" data-request="${i}">Отправить заявку <span aria-hidden="true">↗</span></button>
      </div>
    </div>`;
  }

  const content = root.querySelector('.bd-content');
  let activeIndex = 0;
  content.innerHTML = `
    <nav class="bd-horizontal" role="tablist" aria-label="Направления BARNES">
      ${data.map((d, i) => `<button type="button" class="bd-navbtn" role="tab" id="direction-tab-${d.id}" aria-controls="direction-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-pick="${i}">${d.name}</button>`).join('')}
    </nav>
    <select class="bd-mobile-picker" aria-label="Выберите направление">
      ${data.map((d, i) => `<option value="${i}">${d.name}</option>`).join('')}
    </select>
    <div id="direction-panel" class="bd-fixed-panel" role="tabpanel" aria-labelledby="direction-tab-city" aria-live="polite"></div>`;
  const panel = content.querySelector('.bd-fixed-panel');
  const picker = content.querySelector('.bd-mobile-picker');
  const buttons = Array.from(content.querySelectorAll('[data-pick]'));

  function render(index) {
    if (!Number.isInteger(index) || !data[index]) return;
    activeIndex = index;
    buttons.forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === index));
      button.tabIndex = i === index ? 0 : -1;
    });
    picker.value = String(index);
    panel.setAttribute('aria-labelledby', buttons[index].id);
    panel.innerHTML = feature(index);
    const img = panel.querySelector('img');
    img.alt = data[index].imageAlt || 'Интерьер с видом на Москву';
  }

  root.addEventListener('click', event => {
    const tab = event.target.closest('[data-pick]');
    if (tab && root.contains(tab)) render(Number(tab.dataset.pick));
    const request = event.target.closest('[data-request]');
    if (request && root.contains(request)) {
      const selected = data[activeIndex];
      // Connect this event to the existing application form. No network request here.
      root.dispatchEvent(new CustomEvent('barnes:request', {
        bubbles: true,
        detail: { directionId: selected.id, directionName: selected.name }
      }));
    }
  });
  picker.addEventListener('change', () => render(Number(picker.value)));
  content.querySelector('[role="tablist"]').addEventListener('keydown', event => {
    const tab = event.target.closest('[data-pick]');
    if (!tab) return;
    const current = Number(tab.dataset.pick);
    const target = event.key === 'ArrowRight' ? (current + 1) % data.length
      : event.key === 'ArrowLeft' ? (current + data.length - 1) % data.length
      : event.key === 'Home' ? 0
      : event.key === 'End' ? data.length - 1 : null;
    if (target === null) return;
    event.preventDefault();
    render(target);
    buttons[target].focus();
  });
  render(0);
}
