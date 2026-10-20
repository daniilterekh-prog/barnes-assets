import {setupNotifications} from './notifications.js?v=20261020-notifications';
import {setupReviews} from './reviews.js?v=20261020-notifications';
import {setupAssignee} from './assignee.js?v=20261019-assignee';
import {setupTaskCard} from './task-card.js?v=20261019-progress-deadline';
import {createPersistence,normalizeView,SESSION_KEY} from './persistence.js?v=20261020-notifications';
import {setupGateway} from './gateway.js?v=20261019-gateway';
import {setupAttachments,imageFileError} from './attachments.js?v=20261019-upload-form';
import {setupDiscussion} from './discussion.js?v=20261020-notifications';
import {icon} from './icons.js?v=20261019-gateway';
import { API_URL } from './config.js';
import { STATUSES, selectTasks, summarize, safeSource, safeHttps, taskDateLabel, mainTaskBuckets, personalMainTasks, programmerMood, mergeTask, deadlineInfo, moscowDay, shiftDay, taskDestination, taskSourceCategory, SITE_TASKS_ID, SITE_TASKS_TITLE, PAGE_STAGES, normalizeReviewTask, mergeNotificationInbox } from './domain.js?v=20261020-notifications';

import {renderWiki} from './wiki.js?v=20261020-notifications';

const $ = id => document.getElementById(id);
const browserStorage=name=>{try{return window[name];}catch{return null;}};
const persistence=createPersistence(browserStorage('localStorage'),browserStorage('sessionStorage'));
let persistenceReady=false,restoringView=false,scrollTimer;
const state = { session: null, board: null, owner: 'all', status: 'open', urgent: false, query: '', busy: new Set(), signature: '', fetching: false, toastTimer: null };
const ownerIds = () => [...(state.board?.members.filter(m=>!['tatyana','team'].includes(m.id)).map(m=>m.id)||[]),'unassigned'];
let taskImage=null,taskImagePreview=null;
let createRequestId=null, creatingTask=false, editingTask=null, editingPage=null, savingPage=false;
state.screen='gateway';state.mineBrowse=null;state.mineOrigin=null;state.createFromGateway=false;
state.scope='mine'; state.creator='all'; state.questionsTo=null;state.deadline='all';
state.selectedTask=null;state.detailsExpanded=new Set();state.view='tasks'; state.expanded=new Set(); state.openPages=new Set(); state.pageQuery='';state.selectedPage=null;state.wikiScope='mine';state.wikiStatus='open';state.wikiSource='other';
const dateFormat = new Intl.DateTimeFormat('ru', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Moscow'});
const reviews=setupReviews({api,getSession:()=>state.session,getBoard:()=>state.board,acceptBoard,member,toast,onUnauthorized:showLogin,onChange:()=>render(),renderTask});
const attachments=setupAttachments({api,getSession:()=>state.session,getBoard:()=>state.board,acceptBoard,member,toast,onUnauthorized:showLogin});
const gateway=setupGateway(chooseDestination);
const discussion=setupDiscussion({api,getSession:()=>state.session,getBoard:()=>state.board,acceptBoard,member,toast,onUnauthorized:showLogin});
const taskCard=setupTaskCard({getTask:id=>state.board?.tasks.find(t=>t.id===id),isBusy:id=>state.busy.has(id)||reviews.busy(id),renderTask,onSelect:id=>{state.selectedTask=id;saveView();}});
const notifications=setupNotifications({api,getSession:()=>state.session,getBoard:()=>state.board,acceptBoard,member,displayDate,toast,onUnauthorized:showLogin,onOpenTask:id=>{showBoard();taskCard.open(id);}});
const assignee=setupAssignee({api,getBoard:()=>state.board,getSession:()=>state.session,acceptBoard,toast,onUnauthorized:showLogin,onSaved:()=>taskCard.focusAction('.assignee-open')});
[['task-create-dialog','.task-edit'],['assignee-dialog','.assignee-open'],['deadline-dialog','.deadline-chip'],['discussion-dialog','.discussion-open:not(.attachments-open)'],['attachments-dialog','.attachments-open']].forEach(([id,selector])=>$(id).addEventListener('close',()=>taskCard.focusAction(selector)));

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function member(id) { if(id==='unassigned')return {id,name:'Без исполнителя',initials:'—',color:'neutral'};return state.board?.members.find(m => m.id === id) || {name:'Участник',initials:'—',color:'neutral'}; }
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
async function api(action, body, binary=false) {
  const multipart=body instanceof FormData;
  const token = state.session?.token;
  let response;
  try {
    response = await fetch(API_URL + '?action=' + action, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { ...(body === undefined || multipart ? {} : {'Content-Type':'application/json'}), ...(token ? {Authorization:'Bearer ' + token} : {}) },
      ...(body === undefined ? {} : {body:multipart?body:JSON.stringify(body)}),
      cache:'no-store', signal:AbortSignal.timeout(multipart?30000:12000), credentials:'omit'
    });
  } catch {
    throw Object.assign(new Error('Нет связи с сервером. Изменения не сохранены. Проверьте интернет и повторите.'), {status:0});
  }
  if(binary&&response.ok)return response.blob();
  let data;
  try { data = await response.json(); }
  catch { throw new Error('Сервер вернул неожиданный ответ. Попробуйте обновить страницу.'); }
  if (!response.ok) throw Object.assign(new Error(data.error || 'Не удалось выполнить запрос.'), {status:response.status,data});
  return data;
}
function acceptBoard(data) {
  data.tasks=data.tasks.map(normalizeReviewTask);
  data.tasks=data.tasks.filter(t=>!['tatyana','team'].includes(t.owner));
  // An older poll response must never overwrite a newer status save.
  if (state.board) {
    const previous = new Map(state.board.tasks.map(t => [t.id,t]));
    data.tasks = data.tasks.map(t => mergeTask(previous.get(t.id),t));
    const incomingIds=new Set(data.tasks.map(t=>t.id));
    data.tasks.push(...state.board.tasks.filter(t=>!incomingIds.has(t.id)));
    const events = new Map([...state.board.history,...data.history].map(h => [Number(h.id),h]));
    data.history = [...events.values()].sort((a,b) => Number(b.id)-Number(a.id)).slice(0,50);
  }
  data.notifications=mergeNotificationInbox(state.board?.notifications,data.notifications);
  state.board = data;
  const signature = todayMoscow()+':'+data.tasks.map(t => t.id + ':' + t.revision + ':' + (t.discussion_revision||0) + ':' + (t.attachment_revision||0)).join(',') + ':' + (data.history[0]?.id || '')+':'+(data.pages||[]).map(p=>p.id+':'+p.revision).join(',')+':'+JSON.stringify(data.spec_sections||[])+':'+JSON.stringify(data.members.map(m=>[m.id,m.name]))+':'+JSON.stringify(data.notifications);
  if (signature !== state.signature) {
    state.signature = signature; render();
    if ($('history-dialog').open) renderHistory();
  }
  discussion.refresh();attachments.refresh();
  setConnection(true,'Сохранено');
}
function saveView(force=false){
  if(!persistenceReady||restoringView||!state.session||!state.board||state.screen==='login'||(document.hidden&&force!==true))return;
  const {screen,view,scope,owner,creator,query,pageQuery,status,deadline,urgent,mineOrigin,mineBrowse,selectedPage,wikiScope,wikiStatus,wikiSource,selectedTask}=state;
  persistence.writeView(state.session.member,{screen:state.createFromGateway?'gateway':screen,view,scope,owner,creator,query,pageQuery,status,deadline,urgent,mineOrigin,mineBrowse,selectedPage,wikiScope,wikiStatus,wikiSource,selectedTask,
    expanded:[...state.expanded],specExpanded:[...(state.specExpanded||[])],detailsExpanded:[...state.detailsExpanded],scrollY:screen==='board'?window.scrollY:0});
}
function restoreLastView(){
  const token=state.session.token,view=normalizeView(persistence.readView(state.session.member),state.board,state.session.member);
  restoringView=true;
  if(view){
    Object.assign(state,view,{expanded:new Set(view.expanded),specExpanded:new Set(view.specExpanded),detailsExpanded:new Set(view.detailsExpanded)});
    $('search').value=state.query;$('page-search').value=state.pageQuery;
    $('nav-mine').open=state.scope==='mine';$('nav-assigned').open=state.scope==='assigned';
  }
  if(view?.screen==='board'){showBoard();render();}else showGateway();
  persistenceReady=true;
  const finish=()=>{if(state.session?.token!==token)return;if(document.documentElement.classList.contains('task-loading')){requestAnimationFrame(finish);return;}window.scrollTo({top:view?.screen==='board'?view.scrollY:0,behavior:'instant'});restoringView=false;if(view?.screen==='board'&&state.selectedTask)taskCard.open(state.selectedTask);saveView();};
  requestAnimationFrame(finish);
}
function showBoard() {
  state.screen='board';$('gateway-view').hidden=true;$('skip-link').hidden=false;
  $('login-view').hidden = true; $('board-view').hidden = false;
  $('my-name').textContent = member(state.session.member).name;
  $('my-avatar').className = 'avatar ' + member(state.session.member).color;
  $('my-avatar').textContent = member(state.session.member).initials;
}
function showGateway(){
  if(!state.session||!state.board)return;
  state.screen='gateway';state.createFromGateway=false;
  $('login-view').hidden=true;$('board-view').hidden=true;$('skip-link').hidden=true;
  clearTimeout(state.toastTimer);$('toast').hidden=true;gateway.show();saveView();
}
function chooseDestination(route){
  if(!state.session||!state.board)return;
  state.mineBrowse=null;state.mineOrigin=null;state.query='';$('search').value='';state.owner='all';state.creator='all';state.questionsTo=null;state.deadline='all';state.status='open';state.urgent=false;
  state.pageQuery='';state.selectedPage=null;state.wikiScope='mine';state.wikiStatus='open';state.wikiSource='other';$('page-search').value='';state.expanded.clear();state.specExpanded?.clear();state.scope=route==='assigned'?'assigned':'mine';state.view=route==='site'?'pages':'tasks';
  $('nav-mine').open=state.scope==='mine';$('nav-assigned').open=state.scope==='assigned';
  showBoard();render();
  const board=$('board-view');board.classList.remove('arriving');void board.offsetWidth;board.classList.add('arriving');
  if(route==='create'){state.createFromGateway=true;openTask();}
  else $('board-title').focus({preventScroll:true});
  window.scrollTo({top:0,behavior:'instant'});saveView();
}
$('gateway-back').onclick=e=>{e.preventDefault();showGateway();};
function showLogin(message = '',clearStored=true) {
  persistenceReady=false;restoringView=false;clearTimeout(scrollTimer);if(clearStored)persistence.clearSession(state.session?.token);
  gateway.reset();$('gateway-view').hidden=true;$('skip-link').hidden=false;state.screen='login';state.mineBrowse=null;state.mineOrigin=null;state.createFromGateway=false;
  notifications.reset();reviews.reset();assignee.reset();taskCard.reset();attachments.reset();discussion.reset();$('deadline-dialog').close();deadlineTask=null;state.deadline='all';state.questionsTo=null;state.session = null; state.board = null; state.signature = ''; state.busy.clear();state.detailsExpanded.clear();state.expanded.clear();state.specExpanded?.clear();state.openPages.clear();state.selectedPage=null;state.wikiScope='mine';state.wikiStatus='open';state.wikiSource='other';state.pageQuery='';$('page-search').value='';state.view='tasks';state.owner='all';state.scope='mine';state.creator='all';
  state.status='open';state.urgent=false;state.query='';$('search').value='';
  $('nav-mine').open=true;$('nav-assigned').open=false;
  $('board-view').hidden = true; $('login-view').hidden = false;
  $('history-dialog').close(); $('task-create-dialog').close(); $('page-dialog').close();
  $('login-password').value='';$('login-error').textContent = message;
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
  const tasks=state.board.tasks,me=state.session?.member;
  $('nav-question-count').textContent=tasks.reduce((n,t)=>n+Number(t.open_questions_by_recipient?.[me]||0),0);
  $('scope-questions').classList.toggle('active',!!state.questionsTo);$('scope-questions').setAttribute('aria-pressed',String(!!state.questionsTo));
  $('nav-total').textContent=tasks.length;
  $('nav-mine-count').textContent=personalMainTasks(tasks,me).length;
  $('nav-assigned-count').textContent=personalMainTasks(tasks,me,'assigned').length;
  $('scope-all').classList.toggle('active',state.scope==='all'&&!state.questionsTo);
  $('scope-all').setAttribute('aria-pressed',String(state.scope==='all'&&!state.questionsTo));
  ['mine','assigned'].forEach(scope=>$('nav-'+scope).classList.toggle('active',state.scope===scope));
  [['all-owner','Все исполнители'],['from-member','Все авторы'],['to-member','Все исполнители']].forEach(([id,label])=>{
    const select=$(id);
    if(!select.options.length){
      const all=el('option','',label);all.value='all';select.append(all);
      ownerIds().filter(owner=>id!=='from-member'||owner!=='unassigned').forEach(id=>{const option=el('option','',member(id).name);option.value=id;select.append(option);});
      if(id==='from-member'){const unknown=el('option','','Автор не указан');unknown.value='unknown';select.append(unknown);}
    }
  });
  $('all-owner').closest('label').hidden=state.scope!=='all';
  $('all-owner').value=state.scope==='all'?state.owner:'all';
  $('from-member').value=state.creator;
  $('to-member').value=state.scope==='assigned'?state.owner:'all';
}
function setScope(scope) { if(scope!==state.scope){state.mineBrowse=null;state.mineOrigin=null;}state.questionsTo=null; state.scope=scope;state.owner='all';state.creator='all';if(scope!=='all')$('nav-'+scope).open=true;render(); }
function setOwner(id) { state.questionsTo=null; state.scope='all';state.creator='all';state.owner=id;render(); }
$('scope-questions').onclick=()=>{state.scope='all';state.owner='all';state.creator='all';state.status='all';state.urgent=false;state.query='';$('search').value='';state.questionsTo=state.session.member;render();};
$('scope-all').onclick=()=>setScope('all');
['mine','assigned'].forEach(scope=>{
  $('nav-'+scope).addEventListener('toggle',()=>{if($('nav-'+scope).open&&state.scope!==scope)setScope(scope);});
  // Clicking an already open summary still selects its task list.
  $('nav-'+scope).querySelector('summary').addEventListener('click',()=>{if(state.scope!==scope||state.questionsTo){state.questionsTo=null;state.scope=scope;state.owner='all';state.creator='all';render();}});
});
$('all-owner').onchange=e=>setOwner(e.target.value);
$('from-member').onchange=e=>{state.questionsTo=null;state.scope='mine';state.owner='all';state.creator=e.target.value;render();};
$('to-member').onchange=e=>{state.questionsTo=null;state.scope='assigned';state.creator='all';state.owner=e.target.value;render();};
function render() {
  if (!state.board) return;
  taskCard.refresh();saveView();
  renderNav();
  $('tasks-view').hidden=state.view!=='tasks'; $('pages-view').hidden=state.view!=='pages';$('review-view').hidden=state.view!=='review';
  $('owner-nav').hidden=true; $('board-title').textContent=state.view==='pages'?'СТРАНИЦЫ.':state.view==='review'?'ПРОВЕРКА.':'ЗАДАЧИ.';
  $('page-create-open').hidden=state.view!=='pages';
  ['tasks','pages','review'].forEach(view=>{$('view-'+view).classList.toggle('active',state.view===view);$('view-'+view).setAttribute('aria-pressed',String(state.view===view));});
  renderPages();reviews.render();notifications.render();
  const relevantTasks=personalMainTasks(state.board.tasks,state.session.member,state.scope);
  const counts=summarize(relevantTasks);
  $('progress-title').textContent=state.scope==='assigned'?'Прогресс моих поручений':'Мой прогресс';
  Object.keys(STATUSES).forEach(status => { if($('count-'+status))$('count-'+status).textContent=String(counts[status]); });
  $('progress').max=counts.total || 1; $('progress').value=counts.done;
  $('progress-label').textContent=counts.done+' / '+counts.total;
  $('progress-note').textContent=counts.done ? 'Готово '+Math.round(counts.done/Math.max(counts.total,1)*100)+'% · не актуально: '+counts.obsolete : 'Пока нет выполненных задач';
  const percent=Math.round(counts.done/Math.max(counts.total,1)*100),mood=programmerMood(percent);
  $('progress-scene').className='progress-summary mood-'+mood.id;
  $('progress-percent').textContent=percent+'%';$('progress-mood').textContent=mood.label;
  $('progress-label').textContent=counts.done+' из '+counts.total+' сделано';
  $('count-urgent').textContent=relevantTasks.filter(t=>Number(t.urgent)&&!['done','obsolete','review'].includes(t.status)).length;
  $('urgent-summary').setAttribute('aria-pressed',String(state.urgent));
  ['mine','assigned'].forEach(scope=>{$('tab-'+scope).classList.toggle('active',state.scope===scope);$('tab-'+scope).setAttribute('aria-pressed',String(state.scope===scope));});
  $('status-filter').value=state.status;$('deadline-filter').value=state.deadline;
  $('urgent-filter').setAttribute('aria-pressed',String(state.urgent));
  $('list-description').textContent=state.questionsTo?'Открытые вопросы мне':state.scope==='mine'?'Мои задачи · '+(state.creator==='all'?'от всех':state.creator==='unknown'?'автор не указан':'от '+member(state.creator).name):state.scope==='assigned'?'Я поставил · '+(state.owner==='all'?'всем':'для '+member(state.owner).name):state.owner==='all'?'Все задачи':'Задачи: '+member(state.owner).name;
  const visible=selectTasks(state.board.tasks,{...state,me:state.session?.member});
  $('visible-count').textContent='Показано '+visible.length+' из '+counts.total;
  const list=$('tasks'); list.replaceChildren();
  const buckets=mainTaskBuckets(visible,{questions:!!state.questionsTo});
  $('visible-count').textContent='Показано '+(buckets.urgent.length+buckets.ordinary.length)+(state.scope==='assigned'?' моих поручений':state.scope==='mine'?' моих задач':' задач');
  if(buckets.urgent.length){
    const urgent=el('section','urgent-block'),heading=el('h2','urgent-heading');
    const fire=icon('flame','fire');fire.setAttribute('aria-hidden','true');
    heading.append(fire,el('span','','Срочные'),el('span','group-counter',String(buckets.urgent.length)));
    urgent.append(heading);buckets.urgent.forEach(t=>urgent.append(renderTask(t,{level:3,showOwner:true})));list.append(urgent);
  }
  const ordinary=el('section','telegram-task-list');ordinary.setAttribute('aria-label',state.questionsTo?'Вопросы мне':'Задачи из Telegram');
  if(!buckets.ordinary.length)ordinary.append(el('p','muted',state.questionsTo?'Других задач с вопросами нет.':'Задач из Telegram по выбранным условиям нет.'));
  buckets.ordinary.forEach(t=>ordinary.append(renderTask(t,{level:3,showOwner:state.scope!=='mine'})));list.append(ordinary);
}
function renderPages(){
  if(!state.board)return;
  saveView();
  $('page-search').closest('label').hidden=!!state.selectedPage;
  const reading=state.view==='pages'&&!!state.selectedPage;
  $('task-create-open').hidden=reading||state.view==='review';$('page-create-open').hidden=state.view!=='pages'||reading;
  renderWiki($('wiki-cards'),{pages:state.board.pages||[],sections:state.board.spec_sections||[],tasks:state.board.tasks,query:state.pageQuery,selectedPage:state.selectedPage,taskScope:state.wikiScope,taskStatus:state.wikiStatus,source:state.wikiSource,me:state.session.member,
    onSelect:id=>{state.selectedPage=id;if(!id){state.pageQuery='';$('page-search').value='';}state.wikiScope='mine';state.wikiStatus='open';renderPages();(id?$('wiki-page-title'):$('board-title'))?.focus({preventScroll:true});$('pages-view').scrollIntoView({block:'start',behavior:'instant'});},
    onScope:scope=>{state.wikiScope=scope;renderPages();$('wiki-cards').querySelector('[data-wiki-scope="'+scope+'"]')?.focus({preventScroll:true});},
    onStatus:status=>{state.wikiStatus=status;renderPages();$('wiki-task-status')?.focus({preventScroll:true});},
    onSource:source=>{state.wikiSource=source;renderPages();$('wiki-cards').querySelector('[data-wiki-source="'+source+'"]')?.focus({preventScroll:true});},
    onEdit:openPage,onTask:id=>openTask(null,id),renderTask});
}
function switchView(view){state.view=view;render();}
$('view-tasks').onclick=()=>switchView('tasks');$('view-pages').onclick=()=>switchView('pages');$('view-review').onclick=()=>switchView('review');
$('page-search').oninput=e=>{state.pageQuery=e.target.value;renderPages();};
function renderTask(task,{level=3,showOwner=false,isCard=false}={}) {
  const row=el('article','task-row is-'+task.status+(isCard?' task-card-detail':'')), symbol=el('button','task-toggle');
  row.dataset.task=task.id;
  symbol.type='button'; symbol.setAttribute('role','checkbox');
  symbol.setAttribute('aria-checked',task.status==='review'?'mixed':String(task.status==='done'));
  symbol.setAttribute('aria-label','Готово: '+task.title);
  symbol.title=task.status==='review'?'Открыть проверку':task.status==='done'?'Снять отметку':'Готово — отправить на проверку';
  symbol.disabled=state.busy.has(task.id);
  const mark=el('span','task-check');
  if(task.status!=='unmarked')mark.append(icon({done:'check',review:'clock',progress:'clock',obsolete:'minus'}[task.status]));
  mark.setAttribute('aria-hidden','true'); symbol.append(mark);
  symbol.onclick=()=>task.status==='review'?taskCard.open(task.id):changeStatus(task.id,task.status==='done'?'unmarked':'done',true);
  const main=el('div','task-main'),title=el('h'+level,'task-title',task.title),meta=el('div','task-meta');
  if(!isCard){title.replaceChildren();const titleButton=el('button','task-title-open',task.title);titleButton.type='button';titleButton.onclick=()=>taskCard.open(task.id);title.append(titleButton);}
  if(task.status!=='review')meta.append(el('span','task-current-status',STATUSES[task.status].label));
  else{const banner=el('div','task-review-status','НА ПРОВЕРКЕ');banner.prepend(icon('clock'));main.append(banner);}
  if(showOwner)meta.append(el('span','task-assignee',(isCard?'Исполнитель: ':'')+member(task.owner).name));
  meta.append(el('span','task-date',taskDateLabel(task)));
  meta.append(el('span','task-author',task.created_by?'От: '+member(task.created_by).name:'Автор не указан'));
  if (Number(task.urgent)&&!['done','obsolete'].includes(task.status)) {const badge=el('span','priority');const fire=icon('flame','fire');fire.setAttribute('aria-hidden','true');badge.append(fire,document.createTextNode(' Срочно'));meta.append(badge);}
  if (isCard&&task.updated_at) meta.append(el('span','','Изменил: '+member(task.updated_by).name+' · '+displayDate(task.updated_at)));
  const deadline=deadlineInfo(task),dueButton=el('button','deadline-chip due-'+deadline.kind,deadline.label);dueButton.type='button';dueButton.prepend(icon('clock'));dueButton.setAttribute('aria-label','Дедлайн: '+task.title+' — '+deadline.label);dueButton.onclick=()=>openDeadline(task);meta.append(dueButton);
  const details=el('details','task-details'),summary=el('summary','','Подробнее');
  details.append(summary,el('p','task-description',task.detail||'Описание пока не добавлено.'));
  if(isCard)summary.after(el('h3','task-card-section-title','Описание'));
  details.open=isCard||state.detailsExpanded.has(task.id);if(!isCard)details.addEventListener('toggle',()=>{if(!details.isConnected)return;details.open?state.detailsExpanded.add(task.id):state.detailsExpanded.delete(task.id);saveView();});
  const source=safeHttps(task.source_url||task.source);
  if(source) { const link=el('a','',task.origin==='telegram'?'Поручение в Telegram ↗':'Открыть ТЗ ↗'); link.href=source; link.target='_blank'; link.rel='noopener noreferrer'; details.append(link); }
  const edit=el('button','text-button task-edit','Изменить задачу');edit.type='button';edit.disabled=task.status==='review';edit.onclick=()=>openTask(task);details.append(edit);
  const related=el('div','task-page-links');[taskDestination(task,state.board.pages||[],state.board.spec_sections||[])].forEach(id=>{const p=id===SITE_TASKS_ID?{id,title:SITE_TASKS_TITLE}:state.board.pages?.find(p=>p.id===id);if(!p)return;const button=el('button','page-chip',p.title);button.type='button';button.onclick=()=>{if(isCard)taskCard.close();state.selectedPage=id;state.wikiScope='mine';state.wikiStatus='open';switchView('pages');$('wiki-page-title')?.focus({preventScroll:true});};related.append(button);});
  const discuss=el('button','discussion-open','Обсуждение'+(task.comment_count?' · '+task.comment_count:''));discuss.type='button';discuss.prepend(icon('message-circle'));discuss.setAttribute('aria-label','Обсудить задачу: '+task.title);discuss.onclick=()=>discussion.open(task.id);
  if(task.open_question_count)discuss.append(el('span','question-counter','Вопросы: '+task.open_question_count));
  const images=el('button','discussion-open attachments-open',(task.attachment_count?'Скриншоты':'Прикрепить скриншот')+(task.attachment_count?' · '+task.attachment_count:''));images.type='button';images.prepend(icon('plus'));images.setAttribute('aria-label','Прикрепить скриншот к задаче: '+task.title);images.onclick=()=>attachments.open(task.id);
  const actions=el('div','task-extra-actions');actions.append(discuss,images);
  if(isCard){const assign=el('button','filter-button assignee-open','Ответственный: '+member(task.owner).name+' · Изменить');assign.type='button';assign.disabled=state.busy.has(task.id);assign.onclick=()=>assignee.open(task);main.append(title,meta,assign,details,related,actions);}
  else{const open=el('button','primary task-open','Открыть задачу');open.type='button';open.append(icon('arrow-up-right'));open.setAttribute('aria-label','Открыть задачу: '+task.title);open.onclick=()=>taskCard.open(task.id);main.append(title,meta,open);row.onclick=event=>{if(event.target.closest('button,a,input,select,textarea,summary')||window.getSelection()?.toString().trim())return;taskCard.open(task.id);};}
  const reviewInfo=reviews.block(task,{controls:isCard||state.view==='review'});if(reviewInfo)main.append(reviewInfo);
  const controls=el('div','status-controls'); controls.setAttribute('role','group'); controls.setAttribute('aria-label','Статус задачи «'+task.title+'»');
  ['progress','done','obsolete'].forEach(status=>{
    const button=el('button','status-option '+status,status==='done'?'Готово — на проверку':STATUSES[status].label);
    button.prepend(icon({progress:'clock',done:'check',obsolete:'minus'}[status]));
    button.type='button'; button.dataset.status=status; button.setAttribute('aria-pressed',String(task.status===status));
    button.setAttribute('aria-label',STATUSES[status].short+': '+task.title);
    button.disabled=state.busy.has(task.id)||task.status==='review';
    button.onclick=()=>changeStatus(task.id,status);
    controls.append(button);
  });
  if(task.status!=='unmarked') {
    const reset=el('button','reset-status','Сбросить'); reset.type='button'; reset.dataset.status='unmarked';
    reset.setAttribute('aria-label','Сбросить статус: '+task.title); reset.disabled=state.busy.has(task.id)||task.status==='review';
    reset.onclick=()=>changeStatus(task.id,'unmarked'); controls.append(reset);
  }
  row.append(symbol,main);if(isCard)row.append(controls);return row;
}
function taskAddButton(){return state.view==='pages'&&$('wiki-task-add')||$('task-create-open');}
async function changeStatus(id,status,fromCheckbox=false) {
  if (state.busy.has(id)) return;
  const task=state.board.tasks.find(t=>t.id===id);
  if(!task)return;
  if(task.status===status){if(status==='progress')openDeadline(task);return;}
  state.busy.add(id); render();
  const token=state.session?.token;let statusSaved=false;
  setConnection(true,'Сохраняем…');
  try {
    const data=await api('status',{id,status,revision:Number(task.revision)});
    if (state.session?.token!==token) return;
    acceptBoard(data);statusSaved=true; showError(''); toast(status==='done'?'Отправлено на проверку постановщику и Даниилу':'Сохранено');
  } catch(error) {
    if (state.session?.token!==token) return;
    if (error.status===401) { showLogin(error.message); return; }
    if (error.status===409 && error.data.board) acceptBoard(error.data.board);
    setConnection(error.status!==0,error.status===0?'Нет связи · статус не сохранён':'Проверьте изменение');
    showError(error.message); toast(error.message);
  } finally {
    state.busy.delete(id);
    if(state.session?.token===token&&state.board){
      render();
      const current=state.board.tasks.find(t=>t.id===id);
      if(statusSaved&&status==='progress'&&current?.status==='progress')openDeadline(current);
      else{
      const scope=taskCard.isOpenFor(id)?$('task-card-body'):state.view==='pages'?$('pages-view'):state.view==='review'?$('review-list'):$('tasks');
      const target=scope.querySelector('[data-task="'+id+'"] '+(fromCheckbox?'.task-toggle':'[data-status="'+status+'"]'));
      if(target?.getClientRects().length)target.focus({preventScroll:true});else taskAddButton().focus({preventScroll:true});
      }
    }
  }
}
let deadlineTask=null,savingDeadline=false;
function openDeadline(task){
  if(savingDeadline)return;deadlineTask={id:task.id,revision:Number(task.revision)};
  $('deadline-title').textContent=task.title;$('deadline-date').value=task.due_date||'';$('deadline-error').textContent='';$('deadline-dialog').showModal();$('deadline-date').focus();
}
$('deadline-close').onclick=()=>{if(!savingDeadline)$('deadline-dialog').close();};
$('deadline-dialog').addEventListener('cancel',e=>{if(savingDeadline)e.preventDefault();});
$('deadline-clear').onclick=()=>{$('deadline-date').value='';};
document.querySelectorAll('[data-due-offset]').forEach(button=>{button.onclick=()=>{$('deadline-date').value=shiftDay(todayMoscow(),Number(button.dataset.dueOffset));};});
$('deadline-form').addEventListener('submit',async e=>{
  e.preventDefault();if(savingDeadline||!deadlineTask)return;savingDeadline=true;
  $('deadline-form').querySelectorAll('button,input').forEach(el=>el.disabled=true);$('deadline-close').disabled=true;$('deadline-error').textContent='';const token=state.session?.token,id=deadlineTask.id;
  try{
    const data=await api('deadline',{...deadlineTask,due_date:$('deadline-date').value});if(state.session?.token!==token)return;acceptBoard(data);$('deadline-dialog').close();toast('Дедлайн сохранён');
    const row=$('tasks').querySelector('[data-task="'+id+'"] .deadline-chip');if(row?.checkVisibility())row.focus();else taskAddButton().focus();
  }catch(error){if(state.session?.token!==token)return;if(error.status===401)showLogin(error.message);else{if(error.status===409&&error.data.board){acceptBoard(error.data.board);const task=state.board.tasks.find(t=>t.id===id);if(task)deadlineTask.revision=Number(task.revision);}$('deadline-error').textContent=error.message;}}
  finally{savingDeadline=false;$('deadline-form').querySelectorAll('button,input').forEach(el=>el.disabled=false);$('deadline-close').disabled=false;}
});
function todayMoscow(){return moscowDay();}
function clearTaskImage(){
  taskImage=null;if(taskImagePreview)URL.revokeObjectURL(taskImagePreview);taskImagePreview=null;
  $('task-image').value='';$('task-image-name').textContent='';$('task-image-preview').hidden=true;$('task-image-preview').removeAttribute('src');$('task-image-remove').hidden=true;$('task-image-error').textContent='';
}
$('task-image').onchange=()=>{
  const file=$('task-image').files[0];clearTaskImage();if(!file)return;
  const error=imageFileError(file);if(error){$('task-image-error').textContent=error;return;}
  taskImage=file;taskImagePreview=URL.createObjectURL(file);$('task-image-preview').src=taskImagePreview;$('task-image-preview').alt='Выбранный скриншот: '+file.name;$('task-image-preview').hidden=false;$('task-image-name').textContent=file.name;$('task-image-remove').hidden=false;
};
$('task-image-remove').onclick=clearTaskImage;
function openTask(task=null,pageId=null) {
  clearTaskImage();editingTask=task; $('task-create-form').reset(); $('task-create-error').textContent='';
  $('task-create-title').textContent=task?'Изменить задачу':'Новая задача';
  $('task-create-submit').textContent=task?'Сохранить':'Добавить';
  const select=$('task-owner'); select.replaceChildren();
  [{id:'unassigned',name:'Без исполнителя'},...state.board.members.filter(m=>!['tatyana','team'].includes(m.id))].forEach(m=>{const option=el('option','',m.name);option.value=m.id;select.append(option);});
  select.value=task?.owner||(state.owner==='all'?state.session.member:state.owner);
  $('task-title').value=task?.title||'';$('task-detail').value=task?.detail||'';$('task-urgent').checked=Boolean(Number(task?.urgent));
  $('task-origin').value=task?.origin||'spec';$('task-source').value=task?.source_url||task?.source||'';
  $('task-due').value=task?.due_date||'';
  $('task-date').value=task?.created_at?.slice(0,10)||todayMoscow();
  const field=$('task-pages');field.replaceChildren(el('legend','','Страницы сайта'));
  (state.board.pages||[]).forEach(p=>{const label=el('label','page-choice'),input=document.createElement('input');input.type='checkbox';input.value=p.id;input.checked=(task?.page_ids||[pageId]).includes(p.id);label.append(input,document.createTextNode(p.title));field.append(label);});
  $('task-create-form').querySelector('.create-details').open=Boolean(task||pageId);
  createRequestId=crypto.randomUUID(); $('task-create-dialog').showModal(); $('task-title').focus();
}
$('task-create-open').onclick=()=>openTask();
$('task-create-close').onclick=()=>{if(!creatingTask)$('task-create-dialog').close();};
$('task-create-dialog').addEventListener('cancel',event=>{if(creatingTask)event.preventDefault();});
$('task-create-dialog').addEventListener('close',()=>{clearTaskImage();if(state.createFromGateway){state.createFromGateway=false;showGateway();}});
$('task-create-form').addEventListener('submit',async event=>{
  event.preventDefault();if(creatingTask)return;
  const title=$('task-title').value.trim();if(!title){$('task-create-error').textContent='Напиши, что нужно сделать.';$('task-title').focus();return;}
  const token=state.session?.token,chosenImage=taskImage;
  creatingTask=true;$('task-image').disabled=true;$('task-image-remove').disabled=true;$('task-create-submit').disabled=true;$('task-create-close').disabled=true;$('task-create-error').textContent='';
  try{
    const body={title,owner:$('task-owner').value,detail:$('task-detail').value.trim(),urgent:$('task-urgent').checked,due_date:$('task-due').value,origin:$('task-origin').value,created_at:$('task-date').value,source_url:$('task-source').value.trim(),page_ids:[...$('task-pages').querySelectorAll('input:checked')].map(e=>e.value)};
    const data=await api(editingTask?'task_save':'create',editingTask?{...body,id:editingTask.id,revision:Number(editingTask.revision)}:{...body,request_id:createRequestId});
    if(state.session?.token!==token)return;
    state.scope=body.owner===state.session.member?'mine':'assigned';state.creator='all';state.questionsTo=null;state.deadline='all';state.owner='all';state.status='open';state.urgent=false;state.query='';$('search').value='';state.expanded.add(body.origin);
    state.createFromGateway=false;
    if(state.view==='pages'){state.wikiScope=state.scope;state.wikiStatus='open';}
    const created=data.tasks.find(t=>t.id===data.created_task_id);
    {const task=created||body;state.mineOrigin=taskSourceCategory(task);state.mineBrowse=body.origin==='telegram'?null:{kind:'page',id:taskDestination(task,data.pages||[],data.spec_sections||[])};}
    if(body.origin!=='telegram'){
      state.view='pages';state.selectedPage=taskDestination(created||body,data.pages||[],data.spec_sections||[]);state.wikiSource=taskSourceCategory(created||body)==='spec'?'spec':'other';
      state.wikiScope=created?.owner===state.session.member?'mine':created?.created_by===state.session.member?'assigned':'all';state.wikiStatus='open';
    }else if(state.view==='pages')state.wikiSource='other';
    acceptBoard(data);render();$('task-create-dialog').close();toast(editingTask?'Задача сохранена':'Задача добавлена');
    if(chosenImage)await attachments.open(data.created_task_id,chosenImage,true);
    else if(state.view==='tasks')$('tasks').querySelector('[data-task="'+data.created_task_id+'"] .task-toggle')?.focus();
  }catch(error){
    if(state.session?.token!==token)return;
    if(error.status===401)showLogin(error.message);else{if(error.status===409&&error.data.board)acceptBoard(error.data.board);$('task-create-error').textContent=error.message;}
  }finally{creatingTask=false;$('task-image').disabled=false;$('task-image-remove').disabled=false;$('task-create-submit').disabled=false;$('task-create-close').disabled=false;}
});
Object.entries(PAGE_STAGES).forEach(([value,label])=>{const option=el('option','',label);option.value=value;$('page-stage').append(option);});
function openPage(page=null){
  editingPage=page||{id:'P-'+crypto.randomUUID(),revision:0};$('page-form').reset();$('page-error').textContent='';
  $('page-name').value=page?.title||'';$('page-stage').value=page?.workflow_status||'';
  ['front','live','preview'].forEach(key=>{$('page-'+key+'-url').value=page?.[key+'_url']||'';$('page-'+key+'-version').value=page?.[key+'_version']||'';});
  $('page-github-url').value=page?.github_url||'';$('page-file-url').value=page?.source_file_url||'';$('page-blocks-url').value=page?.blocks_url||'';
  $('page-dialog').showModal();$('page-name').focus();
}
$('page-create-open').onclick=()=>openPage();$('page-close').onclick=()=>{if(!savingPage)$('page-dialog').close();};
$('page-dialog').addEventListener('cancel',e=>{if(savingPage)e.preventDefault();});
$('page-form').addEventListener('submit',async e=>{
  e.preventDefault();if(savingPage)return;savingPage=true;$('page-submit').disabled=true;$('page-close').disabled=true;$('page-error').textContent='';
  const token=state.session?.token;
  try{
    const body={id:editingPage.id,revision:Number(editingPage.revision),title:$('page-name').value.trim(),workflow_status:$('page-stage').value,github_url:$('page-github-url').value.trim(),source_file_url:$('page-file-url').value.trim(),blocks_url:$('page-blocks-url').value.trim()};
    ['front','live','preview'].forEach(key=>{body[key+'_url']=$('page-'+key+'-url').value.trim();body[key+'_version']=$('page-'+key+'-version').value.trim();});
    const data=await api('page_save',body);if(state.session?.token!==token)return;
    acceptBoard(data);$('page-dialog').close();state.pageQuery='';state.selectedPage=null;state.wikiScope='mine';state.wikiStatus='open';state.selectedPage=body.id;$('page-search').value='';switchView('pages');toast('Страница сохранена');
  }catch(error){if(state.session?.token!==token)return;if(error.status===401)showLogin(error.message);else{if(error.status===409&&error.data.board)acceptBoard(error.data.board);$('page-error').textContent=error.message;}}
  finally{savingPage=false;$('page-submit').disabled=false;$('page-close').disabled=false;}
});
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
let passwordMembers=new Set();
function syncLoginPassword(clear=true){const required=passwordMembers.has($('member').value);$('login-password-field').hidden=!required;$('login-password').disabled=!required;$('login-password').required=required;if(clear)$('login-password').value='';}
$('member').onchange=()=>{syncLoginPassword();$('login-error').textContent='';};
async function loadMembers() {
  $('retry-meta').hidden=true; $('login-error').textContent='';
  try {
    const data=await api('meta'); const select=$('member'); select.replaceChildren(el('option','','Выбери имя'));
    select.options[0].value='';
    data.members.filter(m=>!['tatyana','team'].includes(m.id)).forEach(m=>{const option=el('option','',m.name);option.value=m.id;select.append(option);});
    passwordMembers=new Set(data.members.filter(m=>m.password_required).map(m=>m.id));syncLoginPassword();select.disabled=false; $('login-submit').disabled=false;
  } catch(error) {
    $('login-error').textContent='Не удалось подключиться к доске. Проверьте интернет и повторите.';
    $('retry-meta').hidden=false;
  }
}
$('login-form').addEventListener('submit',async event=>{
  event.preventDefault();const memberId=$('member').value,credentials={member:memberId};if(passwordMembers.has(memberId))credentials.password=$('login-password').value;$('login-error').textContent='';$('login-submit').disabled=true;$('member').disabled=true;$('login-password').disabled=true;
  try {
    state.session=await api('login',credentials);$('login-password').value='';
    persistenceReady=false;persistence.storeSession(state.session);
    acceptBoard(await api('board')); restoreLastView();
  } catch(error) {
    persistence.clearSession(state.session?.token);state.session=null; $('login-error').textContent=error.message;
  } finally { $('member').disabled=false;$('login-submit').disabled=false;syncLoginPassword(false);if($('login-error').textContent&&passwordMembers.has($('member').value)){$('login-password').value='';$('login-password').focus();} }
});
$('retry-meta').onclick=loadMembers;
$('logout').onclick=async()=>{persistenceReady=false;if(state.session){persistence.clearView(state.session.member);persistence.clearSession(state.session.token);}try{await api('logout',{});}catch{}showLogin();};
$('refresh').onclick=()=>refresh(true);
$('tab-mine').onclick=()=>setScope('mine');
$('tab-assigned').onclick=()=>setScope('assigned');
$('urgent-summary').onclick=()=>{state.urgent=!state.urgent;state.status='open';render();};
$('search').oninput=event=>{state.query=event.target.value;render();};
$('deadline-filter').onchange=e=>{state.deadline=e.target.value;render();};
$('status-filter').onchange=event=>{state.status=event.target.value;render();};
$('urgent-filter').onclick=()=>{state.urgent=!state.urgent;render();};
document.querySelectorAll('[data-stat]').forEach(button=>{button.onclick=()=>{state.status=state.status===button.dataset.stat?'open':button.dataset.stat;render();};});
$('history-open').onclick=openHistory; $('mobile-history').onclick=openHistory;
$('history-close').onclick=()=>$('history-dialog').close();
window.addEventListener('online',()=>refresh(true));
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveView(true);else refresh();});
setInterval(()=>refresh(),2000);
if('scrollRestoration' in history)history.scrollRestoration='manual';
window.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(saveView,150);},{passive:true});
window.addEventListener('pagehide',()=>saveView(true));
window.addEventListener('storage',event=>{if(event.key===SESSION_KEY&&!event.newValue&&state.session){persistence.clearView(state.session.member);showLogin('Сессия завершена в другом окне.');}});
await loadMembers();
const saved=persistence.readSession();
if(saved){
  state.session=saved;persistence.storeSession(saved);
  try {acceptBoard(await api('board'));restoreLastView();}
  catch(error){showLogin(error.status===401?error.message:'Нет связи с доской. Обнови страницу, когда интернет восстановится.',error.status===401);}
}else persistence.clearSession();
document.dispatchEvent(new Event('barn:ready'));
