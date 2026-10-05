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
// Round-robin sampling keeps short sessions balanced across selected lectures.
export function selectQuestions(bank, lectures, count, random = Math.random) {
  const groups = shuffle(lectures, random).map(l => shuffle(bank.filter(q => q.lecture === l), random));
  const chosen = [];
  while (chosen.length < count && groups.some(g => g.length)) {
    for (const group of groups) if (group.length && chosen.length < count) chosen.push(group.pop());
  }
  return shuffle(chosen, random);
}
export const focusRatios = { arithmetic: 0.75, balanced: 0.5, conceptual: 0.25 };
// Allocate lecture quotas first, then find the closest feasible focus mix within them.
// The same plan drives the setup preview and sampling, so advertised counts are exact.
export function planQuestionMix(bank, lectures, count, arithmeticPercent = 50) {
  const groups = [...new Set(lectures)].map(lecture => {
    const pool = bank.filter(q => q.lecture === lecture);
    return { lecture, pool, arithmeticPool: pool.filter(q => q.focus === 'arithmetic'), conceptualPool: pool.filter(q => q.focus !== 'arithmetic'), count: 0, arithmetic: 0 };
  }).filter(g => g.pool.length);
  const total = Math.min(Math.max(0, Math.floor(count)), groups.reduce((n,g) => n + g.pool.length, 0));
  let allocated = 0;
  while (allocated < total) {
    for (const g of groups) if (g.count < g.pool.length && allocated < total) { g.count++; allocated++; }
  }
  for (const g of groups) {
    g.arithmetic = Math.max(0, g.count - g.conceptualPool.length);
    g.maxArithmetic = Math.min(g.count, g.arithmeticPool.length);
  }
  const percent = Number.isFinite(arithmeticPercent) ? Math.max(0, Math.min(100, arithmeticPercent)) : 50;
  const requested = Math.round(total * percent / 100);
  const minimum = groups.reduce((n,g) => n + g.arithmetic, 0);
  const maximum = groups.reduce((n,g) => n + g.maxArithmetic, 0);
  const arithmetic = Math.min(maximum, Math.max(minimum, requested));
  for (let n = minimum; n < arithmetic; n++) {
    const candidates = groups.filter(g => g.arithmetic < g.maxArithmetic);
    candidates.sort((a,b) => a.arithmetic / a.count - b.arithmetic / b.count);
    candidates[0].arithmetic++;
  }
  return { total, arithmetic, conceptual: total - arithmetic, requested, groups };
}
export function selectFocusedQuestions(bank, lectures, count, arithmeticPercent = 50, random = Math.random) {
  const plan = planQuestionMix(bank, lectures, count, arithmeticPercent);
  return shuffle(plan.groups.flatMap(g => [
    ...shuffle(g.arithmeticPool, random).slice(0, g.arithmetic),
    ...shuffle(g.conceptualPool, random).slice(0, g.count - g.arithmetic),
  ]), random);
}
export function normalize(value) {
  return String(value ?? '').normalize('NFKC').trim().toLowerCase().replace(/[−–]/g, '-').replace(/\s+/g, ' ').replace(/ ?, ?/g, ',');
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
export function createSession(questions, mode, now = Date.now(), arithmeticPercent = 50) {
  return { version: VERSION, mode, arithmeticPercent, ids: questions.map(q => q.id), index: 0, answers: {}, draft: null, drafts: {},
    order: Object.fromEntries(questions.map(q => [q.id, shuffle(q.type === 'mcq' ? q.options.map((_, i) => i) : q.type === 'match' ? q.pairs.map((_, i) => i) : [])])),
    hinted: [], start: now, deadline: mode === 'mock' ? now + DURATION : null, finished: false };
}
export function remaining(session, now = Date.now()) { return Math.max(0, Math.ceil((session.deadline - now) / 1000)); }
export function upgradeSession(session) {
  session.drafts ??= {};
  if (session.draft !== null && session.draft !== undefined) {
    session.drafts[session.ids[session.index]] = session.draft;
  }
  session.draft = null;
  return session;
}
export function currentAnswer(session, id) {
  return Object.hasOwn(session.drafts, id) ? session.drafts[id] : session.answers[id]?.value ?? null;
}
export function recordAnswer(session, question, value) {
  session.drafts[question.id] = Array.isArray(value) ? [...value] : value;
  const answered = complete(question, value);
  session.answers[question.id] = { value: answered ? value : null, correct: answered && grade(question, value), skipped: !answered };
}
export function validSession(s, bank) {
  if (!s || s.version !== VERSION || !['practice','mock'].includes(s.mode) || !Array.isArray(s.ids) || !s.ids.length || new Set(s.ids).size !== s.ids.length) return false;
  if (!Number.isInteger(s.index) || s.index < 0 || s.index >= s.ids.length || !s.answers || !s.order || !Array.isArray(s.hinted) || typeof s.finished !== 'boolean' || !Number.isFinite(s.start)) return false;
  if (s.mode === 'mock' && !Number.isFinite(s.deadline)) return false;
  return s.ids.every(id => {
    const q = bank.find(q => q.id === id); if (!q) return false;
    const r=s.answers[id];
    if (s.finished && !r) return false;
    if (r && (typeof r.correct !== 'boolean' || typeof r.skipped !== 'boolean' || (r.skipped ? r.value !== null || r.correct : !complete(q,r.value) || grade(q,r.value)!==r.correct))) return false;
    const n = q.type === 'mcq' ? q.options.length : q.type === 'match' ? q.pairs.length : 0;
    return Array.isArray(s.order[id]) && s.order[id].length === n && new Set(s.order[id]).size === n && s.order[id].every(i => Number.isInteger(i) && i >= 0 && i < n);
  });
}
