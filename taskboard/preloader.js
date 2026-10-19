const loader = document.getElementById('preloader');
const content = [document.getElementById('login-view'),document.getElementById('board-view')];
const status = document.getElementById('loader-status');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let fallback, leaveTimer, minimumTimer, finished = false, ready = false, minimumElapsed = false;
function finish() {
  if (finished) return;
  finished = true;
  clearTimeout(fallback); clearTimeout(leaveTimer); clearTimeout(minimumTimer);
  loader.hidden = true;
  content.forEach(node => { node.inert = false; });
  document.documentElement.classList.remove('task-loading');
  status.textContent = '';
  document.removeEventListener('barn:ready',onReady);
}
function maybeLeave() {
  if (finished || !ready || !minimumElapsed) return;
  loader.classList.add('is-leaving');
  leaveTimer = setTimeout(finish,800);
}
function onReady() { ready = true; maybeLeave(); }
if (reduced.matches) finish();
else {
  loader.classList.add('js-controlled');
  document.documentElement.classList.add('task-loading');
  content.forEach(node => { node.inert = true; });
  status.textContent = 'Открываем рабочую доску';
  document.addEventListener('barn:ready',onReady,{once:true});
  minimumTimer = setTimeout(() => { minimumElapsed = true; maybeLeave(); },2450);
  fallback = setTimeout(finish,6000);
  loader.addEventListener('animationend',event => {
    if (event.target === loader && event.animationName === 'task-curtain') finish();
  });
  reduced.addEventListener('change',() => { if(reduced.matches)finish(); });
}
