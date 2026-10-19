export const STATUSES = {
  unmarked: { label: 'Не отмечено', short: 'Не отмечено', symbol: '○' },
  progress: { label: 'В работе', short: 'В работе', symbol: '◷' },
  done: { label: 'Сделано', short: 'Сделано', symbol: '✓' },
  obsolete: { label: 'Не актуально', short: 'Не актуально', symbol: '−' }
};
export function selectTasks(tasks, filters) {
  const query = filters.query.trim().toLocaleLowerCase('ru');
  return tasks.filter(t => (!filters.questionsTo || (t.open_question_recipients||[]).includes(filters.questionsTo))
    && (!filters.scope || filters.scope==='all' || (filters.scope==='mine' ? t.owner===filters.me : t.created_by===filters.me))
    && (!filters.creator || filters.creator==='all' || (filters.creator==='unknown' ? !t.created_by : t.created_by===filters.creator))
    && (filters.owner === 'all' || t.owner === filters.owner)
    && (filters.status === 'all' || t.status === filters.status)
    && (!filters.urgent || (Number(t.urgent) === 1 && !['done','obsolete'].includes(t.status)))
    && (!query || (t.title + ' ' + t.detail + ' ' + t.id).toLocaleLowerCase('ru').includes(query)));
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
  return task;
}
