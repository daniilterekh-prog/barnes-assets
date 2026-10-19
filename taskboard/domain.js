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
