export const STATUSES = {
  unmarked: { label: 'Не отмечено', short: 'Не отмечено', symbol: '○' },
  progress: { label: 'В работе', short: 'В работе', symbol: '◷' },
  done: { label: 'Сделано', short: 'Сделано', symbol: '✓' },
  obsolete: { label: 'Не актуально', short: 'Не актуально', symbol: '−' }
};
export function selectTasks(tasks, filters) {
  const query = filters.query.trim().toLocaleLowerCase('ru');
  const today=filters.today||moscowDay();
  return tasks.filter(t => deadlineMatches(t,filters.deadline||'all',today)
    && (!filters.questionsTo || (t.open_question_recipients||[]).includes(filters.questionsTo))
    && (!filters.scope || filters.scope==='all' || (filters.scope==='mine' ? t.owner===filters.me : t.created_by===filters.me))
    && (!filters.creator || filters.creator==='all' || (filters.creator==='unknown' ? !t.created_by : t.created_by===filters.creator))
    && (filters.owner === 'all' || t.owner === filters.owner)
    && (filters.status === 'all' || (filters.status === 'open' ? !['done','obsolete'].includes(t.status) : t.status === filters.status))
    && (!filters.urgent || (Number(t.urgent) === 1 && !['done','obsolete'].includes(t.status)))
    && (!query || (t.title + ' ' + t.detail + ' ' + t.id).toLocaleLowerCase('ru').includes(query))).sort((a,b)=>deadlineSortKey(a).localeCompare(deadlineSortKey(b)));
}
export function summarize(tasks) {
  const counts = { unmarked: 0, progress: 0, done: 0, obsolete: 0 };
  tasks.forEach(t => { if (Object.hasOwn(counts, t.status)) counts[t.status]++; });
  return { ...counts, total: tasks.length, closed: counts.done + counts.obsolete };
}
export function safeSource(source) {
  return /^https:\/\/t\.me\/c\/2492526614\/[0-9]+$/.test(source || '') ? source : '';
}
export function safeHttps(value) {
  try { const url=new URL(value); return url.protocol==='https:'&&!url.username&&!url.password ? url.href : ''; } catch { return ''; }
}
export function taskDateLabel(task) {
  if(!task.created_at)return 'Дата постановки не указана';
  const date=new Date(task.created_at);
  if(Number.isNaN(date.getTime()))return 'Дата постановки не указана';
  const label=new Intl.DateTimeFormat('ru',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Europe/Moscow'}).format(date);
  return (task.created_basis==='imported'?'В доске с ':'От ')+label;
}
export function splitTaskBuckets(tasks) {
  const urgent=tasks.filter(t=>Number(t.urgent)&&!['done','obsolete'].includes(t.status));
  const ids=new Set(urgent.map(t=>t.id)),rest=tasks.filter(t=>!ids.has(t.id));
  return {urgent,telegram:rest.filter(t=>t.origin==='telegram'),spec:rest.filter(t=>t.origin!=='telegram')};
}

// The main list is urgent work first, then Telegram. Site requirements live in wiki.
export function mainTaskBuckets(tasks,{questions=false}={}){
  const {urgent}=splitTaskBuckets(tasks),ids=new Set(urgent.map(t=>t.id));
  return {urgent,ordinary:tasks.filter(t=>!ids.has(t.id)&&(questions||t.origin==='telegram'))};
}

export function programmerMood(percent) {
  if(percent>=100)return {id:'party',label:'Всё готово. Можно выдохнуть!'};
  if(percent>=85)return {id:'finish',label:'Финишная прямая!'};
  if(percent>=60)return {id:'flow',label:'Поймал поток. Работа летит.'};
  if(percent>=35)return {id:'focus',label:'Вошёл в ритм.'};
  if(percent>=15)return {id:'typing',label:'Уже разогнался!'};
  if(percent>0)return {id:'coffee',label:'Первый шаг есть. Ещё глоток кофе.'};
  return {id:'fire',label:'Всё горит. Жду первую галочку.'};
}

// Status/metadata and discussion counters have independent optimistic versions.
export function mergeTask(previous,incoming){
  if(!previous)return incoming;
  const task=Number(previous.revision)>Number(incoming.revision)?{...previous}:{...incoming};
  const discussion=Number(previous.discussion_revision||0)>Number(incoming.discussion_revision||0)?previous:incoming;
  for(const key of ['discussion_revision','comment_count','open_question_count','open_question_recipients','open_questions_by_recipient'])task[key]=discussion[key];
  const files=Number(previous.attachment_revision||0)>Number(incoming.attachment_revision||0)?previous:incoming;
  for(const key of ['attachment_revision','attachment_count'])task[key]=files[key];
  return task;
}

export function moscowDay(now=new Date()){
  return new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Europe/Moscow'}).format(now);
}
export function shiftDay(day,offset){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10);}
export function deadlineInfo(task,today=moscowDay()){
  const due=task.due_date;if(!due)return {kind:'none',label:'Поставить срок'};
  const date=due.slice(8,10)+'.'+due.slice(5,7)+(due.slice(0,4)!==today.slice(0,4)?'.'+due.slice(0,4):'');
  if(['done','obsolete'].includes(task.status))return {kind:'closed',label:'До '+date};
  if(due<today)return {kind:'overdue',label:'Просрочено · '+date};
  if(due===today)return {kind:'today',label:'Сегодня · '+date};
  if(due===shiftDay(today,1))return {kind:'soon',label:'Завтра · '+date};
  return {kind:'future',label:'До '+date};
}
export function deadlineMatches(task,filter,today){
  if(filter==='none')return !task.due_date;
  if(filter==='overdue')return deadlineInfo(task,today).kind==='overdue';
  if(filter==='today')return task.due_date===today&&!['done','obsolete'].includes(task.status);
  if(filter==='week')return !!task.due_date&&task.due_date>=today&&task.due_date<=shiftDay(today,7)&&!['done','obsolete'].includes(task.status);
  return true;
}
function deadlineSortKey(task){return ['done','obsolete'].includes(task.status)?'9999-99-99':task.due_date||'9999-99-99';}

// Imported source sections retain the document's tab order. Each task appears once.
export function groupSpecTasks(tasks,pages=[],sections=[]){
  const sourceKey=value=>{try{const u=new URL(value);return u.origin+u.pathname.replace(/\/edit$/,'')+'?tab='+(u.searchParams.get('tab')||'');}catch{return '';}};
  const bySource=new Map(sections.map(s=>[sourceKey(s.source_url),s]));
  const groups=new Map();
  for(const task of tasks){
    const section=bySource.get(sourceKey(task.source_url));
    const page=pages.find(p=>(task.page_ids||[]).includes(p.id));
    const id=section?'source:'+section.tab_id:page?'page:'+page.id:'general';
    if(!groups.has(id))groups.set(id,{id,title:section?.title||page?.title||'Общие задачи',order:section?Number(section.order):1000+(page?pages.indexOf(page):pages.length),tasks:[]});
    groups.get(id).tasks.push(task);
  }
  return [...groups.values()].sort((a,b)=>a.order-b.order);
}

export const SITE_TASKS_ID='site-wide';
export const SITE_TASKS_TITLE='Задачи по сайту';
const sourceKey=value=>{try{const u=new URL(value);return u.origin+u.pathname.replace(/\/edit$/,'')+'?tab='+(u.searchParams.get('tab')||'');}catch{return '';}};
const titleKey=value=>(value||'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[^а-яa-z0-9]/g,'');
const sectionAliases={узелгородская:'city',узелгородскаянедвижимость:'city',узелзагородная:'country',узелзагороднаянедвижимость:'country',узелзарубежная:'international',узелзарубежнаянедвижимость:'international',узелкурортная:'resort',узелкурортнаянедвижимость:'resort',узелкоммерческая:'commercial',узелкоммерческаянедвижимость:'commercial',узелвторичная:'secondary',узелновостройки:'newbuilds',собственникпродажа:'owner-sale',собственникаренда:'owner-rent',амбассадоры:'partners',узловаясобственикам:'owners',узловаясобственникам:'owners'};
function sectionPage(section,pages){return pages.find(p=>p.id===section.page_id)||pages.find(p=>titleKey(p.title)===titleKey(section.title))||pages.find(p=>p.id===sectionAliases[titleKey(section.title)]);}
// Shared requirements have one destination; original page links remain intact in storage.
export function taskDestination(task,pages=[],sections=[]){
  const linked=[...new Set(task.page_ids||[])];
  if(linked.length>1)return SITE_TASKS_ID;
  if(linked.length===1)return linked[0];
  const section=task.origin==='spec'&&sections.find(s=>sourceKey(s.source_url)===sourceKey(task.source_url));
  return section&&sectionPage(section,pages)?.id||SITE_TASKS_ID;
}
export function taskSourceCategory(task){
  if(task.origin==='telegram')return 'telegram';
  try{const u=new URL(task.source_url);if(u.origin==='https://docs.google.com'&&/^\/document\/d\/10h2UBtZCoKiUJGEKvC43um7Xax_V-sTJ3soDRDN-2iY(?:\/|$)/.test(u.pathname))return 'spec';}catch{}
  return 'other';
}
export function personalBrowseModel(tasks,pages,sections,choice=null,explicit=false){
  const {urgent,...rest}=splitTaskBuckets(tasks),ordinary=[...rest.telegram,...rest.spec];
  const groups=[{kind:'page',id:SITE_TASKS_ID,title:SITE_TASKS_TITLE},...pages.map(p=>({kind:'page',id:p.id,title:p.title}))];
  let currentChoice=choice;
  if(choice?.kind==='section'){
    const section=sections.find(s=>s.tab_id===choice.id);
    currentChoice={kind:'page',id:section&&sectionPage(section,pages)?.id||SITE_TASKS_ID};
  }else if(choice?.kind==='page'&&choice.id==='none')currentChoice={kind:'page',id:SITE_TASKS_ID};
  const current=groups.find(g=>g.kind===currentChoice?.kind&&g.id===currentChoice?.id);
  currentChoice=current?{kind:current.kind,id:current.id}:null;
  const matches=(task,group)=>taskDestination(task,pages,sections)===group.id;
  const browseOptions=groups.map(g=>({...g,count:ordinary.filter(t=>matches(t,g)).length})).filter(g=>g.count||g.id===current?.id);
  const selected=current?ordinary.filter(t=>matches(t,current)):!choice&&explicit?ordinary:[];
  return {urgent,selected,browseOptions,currentChoice,pageOptions:browseOptions,sectionOptions:[],ready:!!choice||explicit,totalOrdinary:ordinary.length};
}

// A page card never includes tasks linked only to another page.
export function pageTaskModel(tasks,pageId,me,scope='mine',status='open',pages=[],sections=[]){
  const linked=tasks.filter(t=>taskDestination(t,pages,sections)===pageId);
  const filters={owner:'all',creator:'all',query:'',urgent:false,me};
  const scoped=selectTasks(linked,{...filters,scope,status:'all'});
  const modes=['mine','assigned','all'].map(id=>({id,count:selectTasks(linked,{...filters,scope:id,status}).length}));
  return {rows:selectTasks(scoped,{...filters,scope:'all',status}),counts:summarize(scoped),modes};
}
