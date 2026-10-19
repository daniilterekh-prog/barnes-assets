import { API_URL } from './config.js';
import { STATUSES, selectTasks, summarize, safeSource } from './domain.js';

const $ = id => document.getElementById(id);
const SESSION_KEY = 'barn-taskboard-session-v1';
const state = { session: null, board: null, owner: 'all', status: 'all', urgent: false, query: '', busy: new Set(), signature: '', fetching: false, toastTimer: null };
const owners = ['vova','andrey','irina','victoria','jenya','daniil','team'];
const dateFormat = new Intl.DateTimeFormat('ru', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Moscow'});

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function member(id) { return state.board?.members.find(m => m.id === id) || {name:'Команда',initials:'К',color:'neutral'}; }
function avatar(m) { return el('span', 'avatar ' + m.color, m.initials); }
function displayDate(date) { return date ? dateFormat.format(new Date(date)) + ' мск' : ''; }
function toast(message) {
  clearTimeout(state.toastTimer);
  $('toast').textContent = message; $('toast').hidden = false;
  state.toastTimer = setTimeout(() => { $('toast').hidden = true; }, 5000);
}
function setConnection(ok, text) {
  $('connection-dot').classList.toggle('offline', !ok);
  $('sync-label').textContent = text;
}
function showError(message) { $('board-error').textContent = message; $('board-error').hidden = !message; }
async function api(action, body) {
  const token = state.session?.token;
  let response;
  try {
    response = await fetch(API_URL + '?action=' + action, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { ...(body === undefined ? {} : {'Content-Type':'application/json'}), ...(token ? {Authorization:'Bearer ' + token} : {}) },
      ...(body === undefined ? {} : {body:JSON.stringify(body)}),
      cache:'no-store', signal:AbortSignal.timeout(12000), credentials:'omit'
    });
  } catch {
    throw Object.assign(new Error('Нет связи с сервером. Изменения не сохранены. Проверьте интернет и повторите.'), {status:0});
  }
  let data;
  try { data = await response.json(); }
  catch { throw new Error('Сервер вернул неожиданный ответ. Попробуйте обновить страницу.'); }
  if (!response.ok) throw Object.assign(new Error(data.error || 'Не удалось выполнить запрос.'), {status:response.status,data});
  return data;
}
function acceptBoard(data) {
  // An older poll response must never overwrite a newer status save.
  if (state.board) {
    const previous = new Map(state.board.tasks.map(t => [t.id,t]));
    data.tasks = data.tasks.map(t => Number(previous.get(t.id)?.revision) > Number(t.revision) ? previous.get(t.id) : t);
    const events = new Map([...state.board.history,...data.history].map(h => [Number(h.id),h]));
    data.history = [...events.values()].sort((a,b) => Number(b.id)-Number(a.id)).slice(0,50);
  }
  state.board = data;
  const signature = data.tasks.map(t => t.id + ':' + t.revision).join(',') + ':' + (data.history[0]?.id || '');
  if (signature !== state.signature) {
    state.signature = signature; render();
    if ($('history-dialog').open) renderHistory();
  }
  setConnection(true,'Сохранено · общая доска');
}
function showBoard() {
  $('login-view').hidden = true; $('board-view').hidden = false;
  $('my-name').textContent = member(state.session.member).name;
  $('my-avatar').className = 'avatar ' + member(state.session.member).color;
  $('my-avatar').textContent = member(state.session.member).initials;
}
function showLogin(message = '') {
  state.session = null; state.board = null; state.signature = ''; state.busy.clear();
  sessionStorage.removeItem(SESSION_KEY);
  $('board-view').hidden = true; $('login-view').hidden = false;
  $('history-dialog').close();
  $('login-error').textContent = message;
}
async function refresh(manual = false) {
  if (!state.session || state.fetching || state.busy.size || (document.hidden && !manual)) return;
  state.fetching = true;
  const token = state.session.token;
  $('refresh').disabled = true;
  try {
    const data = await api('board');
    if (state.session?.token !== token) return;
    acceptBoard(data); showError('');
    if (manual) toast('Задачи обновлены');
  } catch (error) {
    if (state.session?.token !== token) return;
    if (error.status === 401) showLogin(error.message);
    else { setConnection(false,'Нет связи · данные не обновлены'); showError(error.message); }
  } finally { state.fetching = false; $('refresh').disabled = false; }
}
function renderNav() {
  const nav = $('owner-nav'), scrollPosition = nav.scrollLeft; nav.replaceChildren();
  const all = el('button','owner-button' + (state.owner === 'all' ? ' active' : ''));
  all.type='button'; all.setAttribute('aria-pressed',String(state.owner === 'all'));
  all.append(el('span','nav-symbol','▦'),el('span','','Все исполнители'),el('span','',String(state.board.tasks.length)));
  all.onclick=()=>setOwner('all'); nav.append(all);
  owners.forEach(id => {
    const tasks=state.board.tasks.filter(t=>t.owner===id);
    if (!tasks.length) return;
    const m=member(id), button=el('button','owner-button' + (state.owner === id ? ' active' : ''));
    button.type='button'; button.setAttribute('aria-pressed',String(state.owner === id));
    button.append(avatar(m),el('span','',m.name),el('span','',String(tasks.length)));
    button.onclick=()=>setOwner(id); nav.append(button);
  });
  nav.scrollLeft = scrollPosition;
}
function setOwner(id) { state.owner=id; render(); }
function render() {
  if (!state.board) return;
  renderNav();
  const counts=summarize(state.board.tasks);
  Object.keys(STATUSES).forEach(status => { $('count-'+status).textContent=String(counts[status]); });
  $('total-count').textContent=String(counts.total);
  $('progress').max=counts.total || 1; $('progress').value=counts.done;
  $('progress-label').textContent=counts.done+' / '+counts.total;
  $('progress-note').textContent=counts.done ? 'Готово '+Math.round(counts.done/Math.max(counts.total,1)*100)+'% · не актуально: '+counts.obsolete : 'Всё начинается с первого шага';
  $('tab-all').classList.toggle('active',state.owner==='all');
  $('tab-mine').classList.toggle('active',state.owner===state.session?.member);
  $('tab-all').setAttribute('aria-pressed',String(state.owner==='all'));
  $('tab-mine').setAttribute('aria-pressed',String(state.owner===state.session?.member));
  $('status-filter').value=state.status;
  $('urgent-filter').setAttribute('aria-pressed',String(state.urgent));
  $('list-description').textContent=state.owner==='all' ? 'Все исполнители' : 'Задачи: '+member(state.owner).name;
  const visible=selectTasks(state.board.tasks,state);
  $('visible-count').textContent='Показано '+visible.length+' из '+counts.total;
  const list=$('tasks'); list.replaceChildren();
  if (!visible.length) {
    const empty=el('div','empty');
    empty.append(el('strong','','Здесь пока нет задач'),el('p','','Измени фильтры или поисковый запрос.'));
    list.append(empty); return;
  }
  owners.forEach(id => {
    const tasks=visible.filter(t=>t.owner===id).sort((a,b)=>Number(b.urgent)-Number(a.urgent));
    if (!tasks.length) return;
    const m=member(id),group=el('section','task-group'),heading=el('div','group-heading'),h=el('h2','',m.name);
    h.id='owner-'+id; group.setAttribute('aria-labelledby',h.id);
    const totals=summarize(state.board.tasks.filter(t=>t.owner===id));
    heading.append(avatar(m),h,el('span','group-counter',String(tasks.length)),el('span','group-rule'),el('span','group-progress',totals.closed+' из '+totals.total+' закрыто'));
    group.append(heading); tasks.forEach(task=>group.append(renderTask(task))); list.append(group);
  });
}
function renderTask(task) {
  const row=el('article','task-row is-'+task.status), symbol=el('span','task-check',task.status==='unmarked'?'':STATUSES[task.status].symbol);
  row.dataset.task=task.id; symbol.setAttribute('aria-hidden','true');
  const main=el('div','task-main'),title=el('h3','task-title',task.title),meta=el('div','task-meta');
  meta.append(el('span','task-id',task.id));
  if (Number(task.urgent)) meta.append(el('span','priority','⚑ Срочно'));
  if (task.status==='unmarked') meta.append(el('span','','Не отмечено'));
  if (task.updated_at) meta.append(el('span','',member(task.updated_by).name+' · '+displayDate(task.updated_at)));
  const details=el('details','task-details'),summary=el('summary','','Подробнее');
  details.append(summary,el('p','',task.detail));
  const source=safeSource(task.source);
  if(source) { const link=el('a','','Поручение в Telegram ↗'); link.href=source; link.target='_blank'; link.rel='noopener noreferrer'; details.append(link); }
  main.append(title,meta,details);
  const controls=el('div','status-controls'); controls.setAttribute('role','group'); controls.setAttribute('aria-label','Статус задачи «'+task.title+'»');
  ['progress','done','obsolete'].forEach(status=>{
    const button=el('button','status-option '+status,STATUSES[status].label);
    button.type='button'; button.dataset.status=status; button.setAttribute('aria-pressed',String(task.status===status));
    button.setAttribute('aria-label',STATUSES[status].short+': '+task.title);
    button.disabled=state.busy.has(task.id);
    button.onclick=()=>changeStatus(task.id,status);
    controls.append(button);
  });
  if(task.status!=='unmarked') {
    const reset=el('button','reset-status','Сбросить'); reset.type='button'; reset.dataset.status='unmarked';
    reset.setAttribute('aria-label','Сбросить статус: '+task.title); reset.disabled=state.busy.has(task.id);
    reset.onclick=()=>changeStatus(task.id,'unmarked'); controls.append(reset);
  }
  row.append(symbol,main,controls); return row;
}
async function changeStatus(id,status) {
  if (state.busy.has(id)) return;
  const task=state.board.tasks.find(t=>t.id===id);
  if (!task || task.status===status) return;
  state.busy.add(id); render();
  const token=state.session?.token;
  setConnection(true,'Сохраняем…');
  try {
    const data=await api('status',{id,status,revision:Number(task.revision)});
    if (state.session?.token!==token) return;
    acceptBoard(data); showError(''); toast('Статус сохранён для всей команды');
  } catch(error) {
    if (state.session?.token!==token) return;
    if (error.status===401) { showLogin(error.message); return; }
    if (error.status===409 && error.data.board) acceptBoard(error.data.board);
    setConnection(error.status!==0,error.status===0?'Нет связи · статус не сохранён':'Проверьте изменение');
    showError(error.message); toast(error.message);
  } finally {
    state.busy.delete(id);
    if (state.session && state.board) {
      render();
      $('tasks').querySelector('[data-task="'+id+'"] [data-status="'+status+'"]')?.focus({preventScroll:true});
    }
  }
}
function renderHistory() {
  const list=$('history-list'); list.replaceChildren();
  if (!state.board?.history.length) { list.append(el('p','lead','Здесь появятся изменения статусов. Пока всё впереди.')); return; }
  state.board.history.forEach(event=>{
    const item=el('div','history-item');
    item.append(el('p','',event.title),el('small','',member(event.actor).name+' · '+displayDate(event.created_at)),el('span','history-status',STATUSES[event.previous_status].short+' → '+STATUSES[event.status].short));
    list.append(item);
  });
}
function openHistory() { renderHistory(); $('history-dialog').showModal(); }
async function loadMembers() {
  $('retry-meta').hidden=true; $('login-error').textContent='';
  try {
    const data=await api('meta'); const select=$('member'); select.replaceChildren(el('option','','Выбери имя'));
    select.options[0].value='';
    data.members.forEach(m=>{const option=el('option','',m.name);option.value=m.id;select.append(option);});
    select.disabled=false; $('login-submit').disabled=false;
  } catch(error) {
    $('login-error').textContent='Не удалось подключиться к доске. Проверьте интернет и повторите.';
    $('retry-meta').hidden=false;
  }
}
$('login-form').addEventListener('submit',async event=>{
  event.preventDefault(); $('login-error').textContent=''; $('login-submit').disabled=true;
  try {
    state.session=await api('login',{member:$('member').value,code:$('access-code').value});
    sessionStorage.setItem(SESSION_KEY,JSON.stringify(state.session));
    $('access-code').value='';
    acceptBoard(await api('board')); showBoard();
    $('tasks').focus({preventScroll:true});
  } catch(error) {
    state.session=null; sessionStorage.removeItem(SESSION_KEY); $('login-error').textContent=error.message;
  } finally { $('login-submit').disabled=false; }
});
$('show-code').onclick=()=>{
  const show=$('access-code').type==='password';
  $('access-code').type=show?'text':'password'; $('show-code').textContent=show?'Скрыть':'Показать';
  $('show-code').setAttribute('aria-label',show?'Скрыть код':'Показать код'); $('show-code').setAttribute('aria-pressed',String(show));
};
$('retry-meta').onclick=loadMembers;
$('logout').onclick=async()=>{try{await api('logout',{});}catch{}showLogin();};
$('refresh').onclick=()=>refresh(true);
$('tab-all').onclick=()=>setOwner('all');
$('tab-mine').onclick=()=>setOwner(state.session.member);
$('search').oninput=event=>{state.query=event.target.value;render();};
$('status-filter').onchange=event=>{state.status=event.target.value;render();};
$('urgent-filter').onclick=()=>{state.urgent=!state.urgent;render();};
document.querySelectorAll('[data-stat]').forEach(button=>{button.onclick=()=>{state.status=state.status===button.dataset.stat?'all':button.dataset.stat;render();};});
$('history-open').onclick=openHistory; $('mobile-history').onclick=openHistory;
$('history-close').onclick=()=>$('history-dialog').close();
window.addEventListener('online',()=>refresh(true));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
setInterval(()=>refresh(),15000);
await loadMembers();
try {
  const saved=JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');
  if (saved?.token && saved.expires_at>Date.now()/1000) {
    state.session=saved;
    try { acceptBoard(await api('board')); showBoard(); }
    catch(error) { showLogin(error.status===401?error.message:'Нет связи с доской. Войдите ещё раз, когда интернет восстановится.'); }
  } else sessionStorage.removeItem(SESSION_KEY);
} catch { sessionStorage.removeItem(SESSION_KEY); }
