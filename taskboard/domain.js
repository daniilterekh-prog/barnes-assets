export const STATUSES = {
  unmarked: { label: 'Не отмечено', short: 'Не отмечено', symbol: '○' },
  progress: { label: 'В работе', short: 'В работе', symbol: '◷' },
  done: { label: 'Сделано', short: 'Сделано', symbol: '✓' },
  obsolete: { label: 'Не актуально', short: 'Не актуально', symbol: '−' }
};
export function selectTasks(tasks, filters) {
  const query = filters.query.trim().toLocaleLowerCase('ru');
  return tasks.filter(t => (filters.owner === 'all' || t.owner === filters.owner)
    && (filters.status === 'all' || t.status === filters.status)
    && (!filters.urgent || Number(t.urgent) === 1)
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
