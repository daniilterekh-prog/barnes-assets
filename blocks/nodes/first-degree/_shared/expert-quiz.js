/* Small adaptation of the approved homepage 17-quiz; no framework or transport. */
(function () {
  if (window.BarnEstateExpertQuiz) return;
  // Resort-only questionnaire. It deliberately differs from the homepage's task/direction branches.
  var questions = {
    goal: { title:'Для чего вы выбираете недвижимость?', intro:'Несколько ответов помогут Денису подготовиться к разговору.', options:['Для отдыха и жизни','Для инвестиций','Для отдыха и дохода','Нужна консультация'] },
    location: { title:'Какой курорт вас интересует?', intro:'Выберите курорт. Если ещё не определились, поможем сравнить варианты.', options:['Сочи','Анапа','Алтай','Архыз','Шерегеш','Санкт-Петербург','Пока выбираю'] },
    budget: { title:'На какой бюджет вы ориентируетесь?', intro:'Осталось одно уточнение перед знакомством с экспертом.' },
    contact: { title:'Как с вами связаться?', intro:'Выберите удобный способ связи — продолжим общение лично.' }
  };
  var sequence = 0;
  function mount(modal) {
    if (modal.expertQuiz) return modal.expertQuiz;
    var form = modal.querySelector('.feedback-modal__form');
    var title = modal.querySelector('.feedback-modal__title');
    var intro = modal.querySelector('.feedback-modal__intro');
    var body = modal.querySelector('.feedback-modal__body');
    var content = modal.querySelector('.modal__content');
    var submit = form.querySelector('[type="submit"]');
    var comment = form.querySelector('[name=comment]');
    var commentField = comment && comment.closest('.feedback-modal__field');
    var initialComment = { disabled:comment && comment.disabled, hidden:commentField && commentField.hidden };
    var initial = { title: title.textContent, intro: intro.textContent, submit: submit.textContent, comment: comment ? comment.placeholder : '' };
    var id = 'resort-expert-quiz-' + (++sequence);
    title.id = id + '-title';
    title.tabIndex = -1;
    modal.setAttribute('aria-labelledby', title.id);
    var top = document.createElement('div');
    top.className = 'resort-quiz__top';
    top.hidden = true;
    top.innerHTML = '<button type="button" class="resort-quiz__back">← Назад</button><p class="resort-quiz__eyebrow">ВАША ЗАДАЧА · BARN ESTATE</p><p class="resort-quiz__progress" aria-live="polite"></p><div class="resort-quiz__track" aria-hidden="true"><span></span></div>';
    body.prepend(top);
    var panel = document.createElement('section');
    panel.className = 'resort-quiz__panel';
    panel.setAttribute('aria-labelledby', title.id);
    panel.hidden = true;
    var summary = document.createElement('div');
    summary.className = 'resort-quiz__summary';
    summary.hidden = true;
    form.before(panel, summary);
    var payload = document.createElement('input');
    payload.type = 'hidden'; payload.name = 'quizAnswers'; payload.disabled = true;
    form.append(payload);
    var active = false, step = 'goal', answers;
    var goals = questions.goal.options;
    var locations = questions.location.options;
    var back = top.querySelector('button');
    function focus() { if (active) title.focus({ preventScroll: true }); }
    function move(next) {
      step = next; render(); content.scrollTop = 0; body.scrollTop = 0; focus();
    }
    function options(values, key) {
      var group = document.createElement('div');
      group.className = 'resort-quiz__options';
      group.setAttribute('role', 'group'); group.setAttribute('aria-labelledby', title.id);
      values.forEach(function (value) {
        var button = document.createElement('button');
        button.type = 'button'; button.className = 'resort-quiz__option'; button.textContent = value;
        button.setAttribute('aria-pressed', String(answers[key] === value));
        button.addEventListener('click', function () {
          answers[key] = value;
          group.querySelectorAll('button').forEach(function (other) { other.setAttribute('aria-pressed', String(other === button)); });
          panel.querySelector('[data-quiz-next]').disabled = false;
          sync();
        });
        group.append(button);
      });
      panel.append(group);
    }
    function clearStatus() {
      var status = form.querySelector('.feedback-modal__status');
      if (status) { status.textContent = ''; status.setAttribute('role', 'status'); }
      form.querySelectorAll('[aria-invalid]').forEach(function (field) {
        field.removeAttribute('aria-invalid'); if (status) removeErrorReference(field, status);
      });
    }
    form.addEventListener('input', function (event) {
      if (event.target.getAttribute('aria-invalid') === 'true') {
        var status = form.querySelector('.feedback-modal__status');
        event.target.removeAttribute('aria-invalid');
        if (status) { removeErrorReference(event.target, status); status.textContent = ''; status.setAttribute('role', 'status'); }
      }
    });
    function sync() { payload.value = JSON.stringify(answers); }
    function next(callback, disabled) {
      var button = document.createElement('button');
      button.type = 'button'; button.className = 'resort-quiz__next'; button.dataset.quizNext = '';
      button.textContent = step === 'budget' ? 'К контактам →' : 'Далее →'; button.disabled = disabled;
      button.addEventListener('click', callback); panel.append(button);
      return button;
    }
    function skip() {
      answers = { goal: 'Нужна консультация', location: '', budget: '', currency: '₽' };
      move('contact');
    }
    function render() {
      panel.replaceChildren(); summary.replaceChildren();
      modal.dataset.quizStep = step;
      form.hidden = step !== 'contact'; panel.hidden = step === 'contact'; summary.hidden = step !== 'contact';
      back.hidden = step === 'goal';
      var index = { goal: 1, location: 2, budget: 3, contact: 4 }[step];
      top.querySelector('.resort-quiz__progress').textContent = step === 'contact' ? 'Контакт с экспертом' : 'Вопрос ' + index + ' из 3 · затем контакты';
      top.querySelector('.resort-quiz__track span').style.width = index * 25 + '%';
      title.textContent = questions[step].title;
      intro.textContent = questions[step].intro;
      if (step === 'goal') {
        options(goals, 'goal'); next(function () { move(answers.goal === 'Нужна консультация' ? 'contact' : 'location'); }, !answers.goal);
      }
      if (step === 'location') {
        options(locations, 'location'); next(function () { move('budget'); }, !answers.location);
      }
      if (step === 'budget') {
        var fields = document.createElement('div'); fields.className = 'resort-quiz__budget';
        fields.innerHTML = '<label>Бюджет или диапазон<input name="quizBudget" type="text" maxlength="60" autocomplete="off" placeholder="Например, 30–50 млн"></label><label>Валюта<select name="quizCurrency"><option>₽</option><option>$</option><option>€</option></select></label>';
        var input = fields.querySelector('input'), currency = fields.querySelector('select');
        input.value = answers.budget === 'Пока не определился' ? '' : answers.budget; currency.value = answers.currency;
        panel.append(fields);
        var unsure = document.createElement('button'); unsure.type = 'button'; unsure.className = 'resort-quiz__option'; unsure.textContent = 'Пока не определился'; unsure.setAttribute('aria-pressed', String(answers.budget === unsure.textContent)); panel.append(unsure);
        var advance = next(function () { move('contact'); }, !answers.budget);
        input.addEventListener('input', function () { answers.budget = input.value.trim(); unsure.setAttribute('aria-pressed', 'false'); advance.disabled = !answers.budget; sync(); });
        currency.addEventListener('change', function () { answers.currency = currency.value; sync(); });
        input.addEventListener('keydown', function (event) { if (event.key === 'Enter') { event.preventDefault(); if (!advance.disabled) move('contact'); } });
        unsure.addEventListener('click', function () { input.value = ''; answers.budget = unsure.textContent; unsure.setAttribute('aria-pressed', 'true'); advance.disabled = false; sync(); });
      }
      if (step === 'contact') {
        submit.textContent = 'Обсудить мою задачу';if(comment)comment.placeholder='Ваш вопрос или пожелания';
        var text = document.createElement('p');
        text.textContent = [answers.goal, answers.location, answers.budget && (answers.budget === 'Пока не определился' ? answers.budget : answers.budget + ' ' + answers.currency)].filter(Boolean).join(' · ');
        var edit = document.createElement('button'); edit.type = 'button'; edit.textContent = 'Изменить ответы'; edit.addEventListener('click', function () { move('goal'); });
        summary.append(text, edit);
      } else {
        var shortcut = document.createElement('button'); shortcut.type = 'button'; shortcut.className = 'resort-quiz__skip'; shortcut.textContent = 'Сразу задать вопрос эксперту'; shortcut.addEventListener('click', skip); panel.append(shortcut);
      }
      sync();
    }
    back.addEventListener('click', function () { move(step === 'contact' ? (answers.goal === 'Нужна консультация' ? 'goal' : 'budget') : step === 'budget' ? 'location' : 'goal'); });
    modal.expertQuiz = {
      start: function () {
        active = true; step = 'goal'; answers = { goal: '', location: '', budget: '', currency: '₽' };
        if (commentField) commentField.hidden = true;
        if (comment) comment.disabled = true;
        modal.classList.add('resort-quiz-active'); top.hidden = false; payload.disabled = false;
        clearStatus();
        render();
      },
      stop: function () {
        if (commentField) commentField.hidden = initialComment.hidden;
        if (comment) comment.disabled = initialComment.disabled;
        clearStatus();active = false; modal.classList.remove('resort-quiz-active'); delete modal.dataset.quizStep;
        top.hidden = panel.hidden = summary.hidden = true; form.hidden = false; payload.disabled = true; payload.value = '';
        title.textContent = initial.title; intro.textContent = initial.intro; submit.textContent = initial.submit;if(comment)comment.placeholder=initial.comment;
      },
      focus: focus,
      get active() { return active; }
    };
    return modal.expertQuiz;
  }
  function removeErrorReference(field, status) {
    var ids = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (id) { return id && id !== status.id; });
    if (ids.length) field.setAttribute('aria-describedby', ids.join(' ')); else field.removeAttribute('aria-describedby');
  }
  function validate(form, status) {
    if (!status.id) status.id = 'resort-contact-status-' + (++sequence);
    var name = form.elements.namedItem('name'), phone = form.elements.namedItem('phone'), consent = form.elements.namedItem('consent');
    [name, phone, consent].forEach(function (field) { if (field) { field.removeAttribute('aria-invalid'); removeErrorReference(field, status); } });
    function error(field, message) {
      field.setAttribute('aria-invalid', 'true'); field.setAttribute('aria-describedby', ((field.getAttribute('aria-describedby') || '') + ' ' + status.id).trim());
      status.setAttribute('role', 'alert'); status.textContent = message; field.focus(); return false;
    }
    if (name && !name.value.trim()) return error(name, 'Укажите ваше имя.');
    if (phone && phone.value.replace(/\D/g, '').length < 7) return error(phone, 'Укажите корректный номер телефона.');
    if (consent && !consent.checked) return error(consent, 'Подтвердите согласие на обработку персональных данных.');
    status.setAttribute('role', 'status'); return true;
  }
  window.BarnEstateExpertQuiz = { mount: mount, validate: validate, getQuestions:function () { return JSON.parse(JSON.stringify(questions)); } };
}());
