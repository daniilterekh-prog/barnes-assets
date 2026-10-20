import {safeHttps} from './domain.js?v=20261020-private';
const folders={nastya:'От Насти',outlook:'Аутлук'},statuses={unmarked:'Не проверено',progress:'В работе',done:'Готово',obsolete:'Не актуально'};
const node=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text!==undefined)e.textContent=text;return e;};
export function setupPersonal({api,getSession,getBoard,acceptBoard,toast,onUnauthorized}){
  const list=document.getElementById('personal-list'),folderButtons=document.getElementById('personal-folders'),filter=document.getElementById('personal-status'),search=document.getElementById('personal-search'),dialog=document.getElementById('personal-dialog'),body=document.getElementById('personal-body'),title=document.getElementById('personal-title');
  let folder='nastya',active=null,cardSignature='',busy=new Set();
  try{const saved=localStorage.getItem('barn-personal-folder-v1:daniil');if(Object.hasOwn(folders,saved))folder=saved;}catch{}
  const tasks=()=>getSession()?.member==='daniil'?(getBoard()?.private_tasks||[]):[];
  const find=id=>tasks().find(t=>t.id===id);
  const date=value=>{const d=new Date(value+'T12:00:00Z');return Number.isNaN(d.getTime())?'Дата не указана':new Intl.DateTimeFormat('ru',{day:'2-digit',month:'2-digit',year:'numeric'}).format(d);};
  async function change(id,status){
    const t=find(id),token=getSession()?.token;if(!t||busy.has(id))return;busy.add(id);render();
    try{const data=await api('private_task_status',{id,status,revision:Number(t.revision)});if(getSession()?.token!==token)return;acceptBoard(data);toast('Личная отметка сохранена');}
    catch(e){if(getSession()?.token!==token)return;if(e.status===401){onUnauthorized(e.message);return;}if(e.data?.board)acceptBoard(e.data.board);toast(e.message);}
    finally{busy.delete(id);if(getSession()?.token===token)render();}
  }
  function refreshCard(){
    if(!active)return;const task=find(active);if(!task){dialog.close();return;}const signature=JSON.stringify(task)+':'+busy.has(task.id);if(signature===cardSignature)return;cardSignature=signature;const top=dialog.scrollTop;title.textContent=task.title;body.replaceChildren();
    body.append(node('strong','personal-status-label',statuses[task.status]),node('p','muted',folders[task.folder]+' · От '+date(task.created_at)+(task.source_author?' · '+task.source_author:'')));
    if(task.due_date)body.append(node('p','', 'Срок из источника: '+date(task.due_date)));
    body.append(node('p','personal-detail',task.detail||'Подробности не указаны.'));
    const url=safeHttps(task.source_url);if(url){const a=node('a','filter-button','Открыть источник ↗');a.href=url;a.target='_blank';a.rel='noopener noreferrer';body.append(a);}
    const controls=node('div','personal-status-controls');Object.entries(statuses).forEach(([status,label])=>{const button=node('button',status==='done'?'primary':'filter-button',label);button.type='button';button.disabled=busy.has(task.id);button.setAttribute('aria-pressed',String(task.status===status));button.onclick=()=>change(task.id,status);controls.append(button);});body.append(controls);dialog.scrollTop=top;
  }
  function open(id){if(!find(id))return;active=id;cardSignature='';refreshCard();if(!dialog.open)dialog.showModal();title.focus({preventScroll:true});}
  document.getElementById('personal-close').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{const id=active;active=null;cardSignature='';body.replaceChildren();(list.querySelector('[data-personal="'+CSS.escape(id||'')+'"]')||document.getElementById('board-title'))?.focus({preventScroll:true});});
  filter.onchange=render;search.oninput=render;
  function render(){
    if(getSession()?.member!=='daniil'){list.replaceChildren();folderButtons.replaceChildren();dialog.close();body.replaceChildren();return;}
    refreshCard();folderButtons.replaceChildren();
    Object.entries(folders).forEach(([id,label])=>{const rows=tasks().filter(t=>t.folder===id),done=rows.filter(t=>t.status==='done').length,button=node('button','filter-button'+(id===folder?' active':''),label+' · '+done+'/'+rows.length);button.type='button';button.setAttribute('aria-pressed',String(id===folder));button.onclick=()=>{folder=id;try{localStorage.setItem('barn-personal-folder-v1:daniil',id);}catch{}render();};folderButtons.append(button);});
    const query=search.value.trim().toLocaleLowerCase('ru');
    const visible=tasks().filter(t=>t.folder===folder&&(filter.value==='all'||(filter.value==='open'?!['done','obsolete'].includes(t.status):t.status===filter.value))&&(!query||(t.title+' '+t.detail).toLocaleLowerCase('ru').includes(query)));
    list.replaceChildren();if(!visible.length)list.append(node('p','muted',tasks().some(t=>t.folder===folder)?'Нет задач по выбранным условиям.':'В этой папке пока нет задач.'));
    visible.forEach(task=>{const row=node('article','personal-task');const toggle=node('button','task-toggle');toggle.type='button';toggle.setAttribute('role','checkbox');toggle.setAttribute('aria-checked',String(task.status==='done'));toggle.setAttribute('aria-label','Проверено и готово: '+task.title);toggle.disabled=busy.has(task.id);toggle.textContent=task.status==='done'?'✓':'';toggle.onclick=()=>change(task.id,task.status==='done'?'unmarked':'done');
      const main=node('div','');main.append(node('h2','',task.title),node('p','muted',statuses[task.status]+' · '+date(task.created_at)));const button=node('button','filter-button','Открыть задачу ↗');button.type='button';button.dataset.personal=task.id;button.onclick=()=>open(task.id);main.append(button);row.append(toggle,main);list.append(row);});
  }
  return {render,reset(){busy.clear();active=null;cardSignature='';dialog.close();body.replaceChildren();list.replaceChildren();folderButtons.replaceChildren();search.value='';filter.value='open';}};
}
