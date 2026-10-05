export const VERSION = 1;
export const DURATION = 60 * 60 * 1000;
export function shuffle(items, random = Math.random) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// Every format present in the pool gets a share of the session proportional to its pool size
// (at least one each when the session is long enough), using largest remainders.
export function formatQuotas(pool, count) {
  const available = {};
  for (const q of pool) available[q.type] = (available[q.type] || 0) + 1;
  const types = Object.keys(available);
  const n = Math.min(count, pool.length);
  const quotas = Object.fromEntries(types.map(t => [t, 0]));
  if (!n) return quotas;
  const reserve = n >= types.length ? 1 : 0;
  types.forEach(t => { quotas[t] = reserve; });
  const exact = Object.fromEntries(types.map(t => [t, n * available[t] / pool.length]));
  let left = n - reserve * types.length;
  types.forEach(t => { const add = Math.min(available[t] - quotas[t], Math.max(0, Math.floor(exact[t]) - quotas[t]), left); quotas[t] += add; left -= add; });
  while (left > 0) {
    const t = types.filter(t => quotas[t] < available[t]).sort((a, b) => (exact[b] - quotas[b]) - (exact[a] - quotas[a]) || available[b] - available[a] || (a < b ? -1 : 1))[0];
    quotas[t]++; left--;
  }
  return quotas;
}
// Round-robin sampling keeps sessions balanced across selected lectures; within each turn the
// lecture contributes the format furthest below its quota, so sessions mix MCQ, FIB and matching.
export function selectQuestions(bank, lectures, count, random = Math.random) {
  const groups = shuffle(lectures, random).map(l => shuffle(bank.filter(q => q.lecture === l), random));
  const quotas = formatQuotas(groups.flat(), count);
  const used = Object.fromEntries(Object.keys(quotas).map(t => [t, 0]));
  const chosen = [];
  const take = (group, i) => { const [q] = group.splice(i, 1); used[q.type]++; chosen.push(q); };
  while (chosen.length < count && groups.some(g => g.length)) {
    let progressed = false;
    for (const group of groups) {
      if (!group.length || chosen.length >= count) continue;
      let best = -1;
      group.forEach((q, i) => { if (used[q.type] < quotas[q.type] && (best < 0 || quotas[q.type] - used[q.type] > quotas[group[best].type] - used[group[best].type])) best = i; });
      if (best >= 0) { take(group, best); progressed = true; }
    }
    if (!progressed) for (const group of groups) if (group.length && chosen.length < count) take(group, group.length - 1);
  }
  return shuffle(chosen, random);
}
export function normalize(value) {
  return String(value ?? '').normalize('NFKC').trim().toLowerCase().replace(/[−–]/g, '-').replace(/\s+/g, ' ');
}
export function grade(q, answer) {
  if (q.type === 'mcq') return Number.isInteger(answer) && answer === q.correct;
  if (q.type === 'fib') return q.answers.some(a => normalize(a) === normalize(answer) || (numeric(a) !== null && numeric(answer) !== null && numeric(a) === numeric(answer)));
  return Array.isArray(answer) && answer.length === q.pairs.length && q.pairs.every((_, i) => answer[i] === i);
}
function numeric(value) {
  const s=normalize(value).replace(/\s*\/\s*/g,'/');
  if (/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(s)) return Number.isFinite(Number(s)) ? Number(s) : null;
  if (/^[+-]?\d+\/\d+$/.test(s)) { const [a,b]=s.split('/').map(Number); return b !== 0 && Number.isFinite(a/b) ? a/b : null; }
  return null;
}
export function complete(q, answer) {
  if (q.type === 'mcq') return Number.isInteger(answer) && answer >= 0 && answer < q.options.length;
  if (q.type === 'fib') return normalize(answer).length > 0;
  return Array.isArray(answer) && answer.length === q.pairs.length && answer.every(a => Number.isInteger(a) && a >= 0 && a < q.pairs.length);
}
export function createSession(questions, mode, now = Date.now()) {
  return { version: VERSION, mode, ids: questions.map(q => q.id), index: 0, answers: {}, draft: null,
    order: Object.fromEntries(questions.map(q => [q.id, shuffle(q.type === 'mcq' ? q.options.map((_, i) => i) : q.type === 'match' ? q.pairs.map((_, i) => i) : [])])),
    hinted: [], start: now, deadline: mode === 'mock' ? now + DURATION : null, finished: false };
}
export function remaining(session, now = Date.now()) { return Math.max(0, Math.ceil((session.deadline - now) / 1000)); }
export function validSession(s, bank) {
  if (!s || s.version !== VERSION || !['practice','mock'].includes(s.mode) || !Array.isArray(s.ids) || !s.ids.length || new Set(s.ids).size !== s.ids.length) return false;
  if (!Number.isInteger(s.index) || s.index < 0 || s.index >= s.ids.length || !s.answers || !s.order || !Array.isArray(s.hinted) || typeof s.finished !== 'boolean' || !Number.isFinite(s.start)) return false;
  if (s.mode === 'mock' && !Number.isFinite(s.deadline)) return false;
  return s.ids.every(id => {
    const q = bank.find(q => q.id === id); if (!q) return false;
    const r=s.answers[id];
    if (s.finished && !r) return false;
    if (r && (typeof r.correct !== 'boolean' || typeof r.skipped !== 'boolean' || (r.skipped ? r.value !== null || r.correct : !complete(q,r.value) || grade(q,r.value)!==r.correct))) return false;
    if (s.ids.indexOf(id)<s.index && !r) return false;
    const n = q.type === 'mcq' ? q.options.length : q.type === 'match' ? q.pairs.length : 0;
    return Array.isArray(s.order[id]) && s.order[id].length === n && new Set(s.order[id]).size === n && s.order[id].every(i => Number.isInteger(i) && i >= 0 && i < n);
  });
}
