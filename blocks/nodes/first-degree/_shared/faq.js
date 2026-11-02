/* Shared FAQ disclosure; preserves the approved FAQ typography and CSS animation. */
(function () {
  if (window.BarnEstateFaq) return;
  var mounted = new WeakSet(), sequence = 0;
  function mount(root) {
    var sections = Array.from(root.querySelectorAll('.catalog-faq')), cleanups = [];
    if (root.matches && root.matches('.catalog-faq')) sections.unshift(root);
    sections.forEach(function (section) {
      if (mounted.has(section)) return;
      mounted.add(section);
      var prefix = 'resort-faq-' + (++sequence), listeners = [];
      section.querySelectorAll('.catalog-faq__item').forEach(function (item, index) {
        var question = item.querySelector('.catalog-faq__question');
        var answer = item.querySelector('.catalog-faq__answer');
        if (!question || !answer) return;
        question.id = prefix + '-question-' + index;
        answer.id = prefix + '-answer-' + index;
        question.setAttribute('aria-controls', answer.id);
        answer.setAttribute('aria-labelledby', question.id);
        function setOpen(open) {
          question.setAttribute('aria-expanded', String(open));
          answer.setAttribute('aria-hidden', String(!open));
          answer.inert = !open;
          item.classList.toggle('catalog-faq__item--open', open);
          answer.classList.toggle('catalog-faq__answer--open', open);
        }
        setOpen(question.getAttribute('aria-expanded') === 'true');
        var click = function () { setOpen(question.getAttribute('aria-expanded') !== 'true'); };
        question.addEventListener('click', click);
        listeners.push([question, click]);
      });
      cleanups.push(function () {
        listeners.forEach(function (entry) { entry[0].removeEventListener('click', entry[1]); });
        mounted.delete(section);
      });
    });
    return function () { cleanups.forEach(function (cleanup) { cleanup(); }); };
  }
  window.BarnEstateFaq = { mount: mount };
}());
