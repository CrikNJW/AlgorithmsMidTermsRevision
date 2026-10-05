import { lectures, questions } from './questions.js';
import { selectQuestions, createSession, complete, remaining, validSession, upgradeSession, currentAnswer, recordAnswer } from './engine.js';

import { showSlides } from './slide-viewer.js';

const main = document.querySelector('main');
const key = 'algorithm-lab-session-v1';
const byId = Object.fromEntries(questions.map(q => [q.id, q]));
const typeLabel = { mcq: 'Multiple choice', fib: 'Fill in the blank', match: 'Matching' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let session = null;
let view = 'home';
let mode = 'practice';
let selected = [0,1,2,3,4,5];
let count = '20';
let questionSet = 'all';
let onlyMissed = false;
let timerWarning = false;
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (validSession(saved, questions)) session = upgradeSession(saved);
} catch { /* An old or damaged save never prevents a new session. */ }
function save() {
  try { localStorage.setItem(key, JSON.stringify(session)); }
  catch { document.querySelector('#storage-warning').hidden = false; }
}
try { localStorage.setItem('algorithm-lab-probe', '1'); localStorage.removeItem('algorithm-lab-probe'); }
catch { document.querySelector('#storage-warning').hidden = false; }
function focusHeading() { main.querySelector('h1, h2')?.focus({ preventScroll: true }); window.scrollTo({ top: 0 }); }
function badge(text, cls = '') { return `<span class="badge ${cls}">${esc(text)}</span>`; }
function source(q) { return `<p class="source">Source: Lecture ${String(q.lecture).padStart(2,'0')} · PDF page(s) ${esc(q.pages)}${q.lecture === 0 ? ' · Learning-objective application' : ''}</p>`; }

function home() {
  view = 'home';
  main.innerHTML = `
    <div class="page-heading"><div><p class="eyebrow">YOUR REVISION DESK</p><h1 tabindex="-1">Make the next answer count.</h1><p class="subheading">${questions.length} questions. Two sets of 20 per lecture.</p></div><span class="edition">LECTURES<br><strong>00—05</strong></span></div>
    <div class="home-grid"><section class="setup-panel" aria-label="Session setup">
      <div class="section-title"><h2>Choose your session</h2><span class="step">01 / MODE</span></div>
      <div class="mode-grid" role="group" aria-label="Session mode">
        <button class="mode-card ${mode==='practice'?'selected':''}" data-mode="practice" aria-pressed="${mode==='practice'}"><span class="mode-icon">✦</span><strong>Guided practice</strong><span>Take your time. Use hints.<br>Learn after every answer.</span>${badge('LEARN AS YOU GO')}</button>
        <button class="mode-card ${mode==='mock'?'selected':''}" data-mode="mock" aria-pressed="${mode==='mock'}"><span class="mode-icon">◷</span><strong>Exam rehearsal</strong><span>25 questions. 60 minutes.<br>Review answers at the end.</span>${badge('TIMED PRACTICE')}</button>
      </div>
      <div class="section-title topics-heading"><h2>Pick your lectures</h2><button class="text-button" id="toggle-all">${selected.length===6?'Clear all':'Select all'}</button></div>
      <div class="lecture-grid">${lectures.map(l=>`<label class="lecture-card ${selected.includes(l.id)?'checked':''}"><input type="checkbox" name="lecture" value="${l.id}" ${selected.includes(l.id)?'checked':''}><span class="lecture-number">${String(l.id).padStart(2,'0')}</span><span class="lecture-text"><strong>${l.title}</strong><span>${l.subtitle}</span></span><span class="question-count">${questions.filter(q=>q.lecture===l.id&&(questionSet==='all'||q.set===Number(questionSet))).length} Qs</span></label>`).join('')}</div>
      <p class="small-note">Lecture 00 applies the introductory learning objectives; it is mainly an orientation lecture.</p>
      <div class="session-controls"><label>Question set<select id="question-set"><option value="all" ${questionSet==='all'?'selected':''}>Both sets</option><option value="1" ${questionSet==='1'?'selected':''}>Set 1 · Original</option><option value="2" ${questionSet==='2'?'selected':''}>Set 2 · New</option></select></label><label ${mode==='mock'?'hidden':''}>Questions<select id="question-count"><option value="10" ${count==='10'?'selected':''}>10 questions</option><option value="20" ${count==='20'?'selected':''}>20 questions</option><option value="all" ${count==='all'?'selected':''}>All selected questions</option></select></label><div class="session-summary" id="session-summary"></div><button class="primary" id="start">${mode==='mock'?'Start mock test':'Start practice'}</button></div>
      <p id="setup-error" class="error-text" role="alert"></p>
      <div class="rules"><span aria-hidden="true">↳</span><p>Use Back and Next to revisit questions and revise answers.<br>One point per question; matching needs every pair correct.</p></div>
    </section>
    <aside class="desk-sidebar"><section class="exam-card"><p class="eyebrow">TEST 01 / THE REAL THING</p><h2>6 October 2026</h2><p class="exam-time">14:30–15:30 <span>SGT</span></p><div class="arrival"><span>Be there by</span><strong>14:15</strong></div><ul class="checklist"><li>Student card & attendance signature</li><li>Laptop & charger</li><li>Check school Wi-Fi and Examena</li><li>Closed book · No calculator needed</li><li>Devices in your bag, bag at the front</li></ul><p class="venue-note">Check your assigned venue in the venue file. That file is not in this repository.</p></section>
    <section class="study-note"><span class="note-mark">i</span><h3>A practice companion</h3><p>Original questions based on your lecture PDFs, with page references in every explanation. These are revision questions, not predictions of the test.</p><p>Mock questions are balanced across your selected lectures. This balance is for practice; the real test weighting is unknown.</p></section>
    ${session?.finished?`<button class="secondary full-width" id="last-result">View last session results</button>`:''}
    </aside></div>
    <details class="source-notes"><summary>Source notes & notation</summary><p>Referenced pages from your lecture PDFs are available in the slide viewer. Page references use PDF page numbers. Questions use a constant-cost arithmetic model unless stated otherwise. Complexity questions asking for a tight bound distinguish Θ from a merely valid O upper bound.</p><p>Corrections are explained where relevant: Θ is a tight bound, not synonymous with average case (L01 p.31; formal definitions in L02 pp.25–27). The 33-minute schedule in L05 p.48 omits a job. The Master theorem questions use the three-case version actually stated in L03.</p><p>For the formal interpretation of asymptotic notation, see <a href="https://ocw.mit.edu/courses/6-100l-introduction-to-cs-and-programming-using-python-fall-2022/resources/6100l-lecture-22-version-2_mp4/" target="_blank" rel="noopener">MIT’s Big Oh and Theta lecture</a>.</p><p>The announcement’s year is interpreted as 2026, consistent with its opening sentence and deadline. Check the official course announcement for any updates.</p></details>`;
  main.querySelectorAll('[data-mode]').forEach(b => b.onclick=()=>{ mode=b.dataset.mode; home(); });
  main.querySelectorAll('[name=lecture]').forEach(c => c.onchange=()=>{
    selected=[...main.querySelectorAll('[name=lecture]:checked')].map(c=>Number(c.value));
    c.closest('label').classList.toggle('checked',c.checked);
    document.querySelector('#toggle-all').textContent=selected.length===6?'Clear all':'Select all';
    updateSetup();
  });
  document.querySelector('#toggle-all').onclick=()=>{selected=selected.length===6?[]:[0,1,2,3,4,5];home();};
  document.querySelector('#question-set').onchange=e=>{questionSet=e.target.value;home();document.querySelector('#question-set').focus();};
  document.querySelector('#question-count').onchange=e=>{count=e.target.value;updateSetup();};
  document.querySelector('#start').onclick=start;
  document.querySelector('#last-result')?.addEventListener('click',()=>{results();focusHeading();});
  updateSetup();
}
function selectedBank() { return questions.filter(q=>selected.includes(q.lecture)&&(questionSet==='all'||q.set===Number(questionSet))); }
function updateSetup() {
  const pool=selectedBank().length;
  const n=mode==='mock'?25:Math.min(pool,count==='all'?pool:Number(count));
  document.querySelector('#session-summary').innerHTML=`<strong>${n} questions</strong><span>${mode==='mock'?'60-minute timer · Hints & slides':'Untimed · Hints & slides'}</span>`;
  const message=!pool?'Choose at least one lecture.':mode==='mock'&&pool<25?'Choose both sets or more lectures to provide 25 mock-test questions.':'';
  document.querySelector('#setup-error').textContent=message;
  document.querySelector('#start').disabled=Boolean(message);
}
function start() {
  const pool=selectedBank();
  if(!pool.length || (mode==='mock'&&pool.length<25))return;
  const n=mode==='mock'?25:count==='all'?pool.length:Math.min(Number(count),pool.length);
  session=createSession(selectQuestions(pool,selected,n),mode);
  timerWarning=false;
  save(); quiz(); focusHeading();
}
function current() { return byId[session.ids[session.index]]; }
function quiz() {
  view='quiz';
  if(expire()) return;
  const q=current(), record=session.answers[q.id], isMock=session.mode==='mock';
  const answer=currentAnswer(session,q.id);
  const answered=Object.values(session.answers).filter(r=>!r.skipped).length;
  const progress=Math.round(answered/session.ids.length*100);
  main.innerHTML=`<div class="session-top"><div><p class="eyebrow">${isMock?'TIMED PRACTICE':'GUIDED PRACTICE'}</p><span class="session-rule">Move back and forth · Revise your answers any time before finishing</span></div><div class="session-top-actions">${isMock?`<div class="timer" aria-label="Time remaining"><span>TIME LEFT</span><strong id="timer"></strong></div>`:badge('UNTIMED')}<button id="end" class="text-button">End session</button></div></div>
    <div class="progress-track" role="progressbar" aria-label="Questions answered" aria-valuemin="0" aria-valuemax="${session.ids.length}" aria-valuenow="${answered}"><span style="width:${progress}%"></span></div>
    <div class="quiz-layout"><aside class="quiz-sidebar"><span class="large-number">${String(session.index+1).padStart(2,'0')}<small> / ${session.ids.length}</small></span><p class="eyebrow">LECTURE ${String(q.lecture).padStart(2,'0')}</p><h2>${lectures[q.lecture].title}</h2><p>${esc(q.topic)}</p><div class="mini-rule"></div><p class="small-note">${isMock?'The timer keeps running while you read slides. Full answer explanations appear when the session ends.':'Use the hints or lecture slides when you need them. Check an answer, then revise it or move on.'}</p><p class="save-note">Progress saved in this browser</p></aside>
    <section class="question-card"><div class="question-meta">${badge(typeLabel[q.type])}${badge(q.difficulty,'muted')}<span>${q.id} · Set ${q.set}</span></div><h1 tabindex="-1" class="question-prompt">${esc(q.prompt)}</h1>
    <form id="answer-form"><fieldset><legend class="sr-only">Your answer</legend>${answerFields(q,answer)}</fieldset>
    <div class="question-help"><button type="button" id="hint" class="secondary hint-button" aria-expanded="${session.hinted.includes(q.id)}" aria-controls="hint-text">Need a hint?</button><button type="button" id="show-slides" class="secondary" aria-haspopup="dialog">Show relevant slides</button></div><div id="hint-text" class="hint-box" ${session.hinted.includes(q.id)?'':'hidden'}>${esc(q.hint)}</div>
    ${!isMock&&record&&!record.skipped?feedback(q,record):''}
    <div class="answer-actions"><button type="button" id="previous" class="secondary" ${session.index===0?'disabled':''}>Back</button><div class="answer-forward">${!isMock?`<button type="submit" id="submit" class="primary" ${complete(q,answer)?'':'disabled'}>Check answer</button>`:''}<button type="button" id="next" class="${isMock?'primary':'secondary'}">${session.index===session.ids.length-1?'Finish session':'Next question'}</button></div></div>
    <p class="small-note">${q.type==='match'?'Choose one match for every row. Each option is used once; all pairs must be correct for the point.':q.type==='fib'?'Case and extra surrounding spaces are ignored. Use the form requested by the question.':'Choose one answer.'} Answers are saved when you move between questions.</p></form><p id="time-warning" class="error-text" role="status"></p></section></div>`;
  document.querySelector('#end').onclick=requestFinish;
  document.querySelector('#answer-form').onsubmit=e=>{e.preventDefault();if(isMock)next();else submit();};
  function editAnswer(){
    session.drafts[q.id]=readAnswer(q);
    delete session.answers[q.id];
    document.querySelector('#feedback')?.remove();
    const button=document.querySelector('#submit');if(button)button.disabled=!complete(q,session.drafts[q.id]);
    save();
  }
  main.querySelectorAll('input, select').forEach(el=>{
    el.addEventListener('input',editAnswer);
    el.addEventListener('change',editAnswer);
  });
  document.querySelector('#hint').onclick=()=>{
    const hint=document.querySelector('#hint-text'),open=hint.hidden;
    if(open&&!session.hinted.includes(q.id))session.hinted.push(q.id);
    hint.hidden=!open;document.querySelector('#hint').setAttribute('aria-expanded',String(open));save();
  };
  document.querySelector('#show-slides').onclick=()=>showSlides(q);
  document.querySelector('#previous').onclick=()=>move(-1);
  document.querySelector('#next').onclick=next;
  tick();
}
function answerFields(q,a) {
  if(q.type==='mcq')return `<div class="options">${session.order[q.id].map((index,i)=>`<label class="option"><input type="radio" name="answer" value="${index}" ${a===index?'checked':''}><span class="option-letter">${String.fromCharCode(65+i)}</span><span>${esc(q.options[index])}</span></label>`).join('')}</div>`;
  if(q.type==='fib')return `<label class="fill-label" for="fill-answer">Your answer</label><input id="fill-answer" class="fill-input" type="text" autocomplete="off" spellcheck="false" maxlength="300" placeholder="Type your answer…" value="${esc(a??'')}">`;
  return `<div class="match-bank" aria-label="Answer options"><p class="eyebrow">ANSWER OPTIONS</p>${session.order[q.id].map((index,j)=>`<div><strong>${String.fromCharCode(65+j)}</strong><span>${esc(q.pairs[index][1])}</span></div>`).join('')}</div><div class="matching">${q.pairs.map((pair,i)=>`<div class="match-row"><label for="match-${i}"><span class="match-number">${i+1}</span>${esc(pair[0])}</label><select id="match-${i}" data-match="${i}"><option value="">Choose a match…</option>${session.order[q.id].map((index,j)=>`<option value="${index}" ${a?.[i]===index?'selected':''}>Option ${String.fromCharCode(65+j)}</option>`).join('')}</select></div>`).join('')}</div>`;
}
function readAnswer(q) {
  if(q.type==='mcq'){const el=main.querySelector('[name=answer]:checked');return el?Number(el.value):null;}
  if(q.type==='fib')return document.querySelector('#fill-answer').value;
  return [...main.querySelectorAll('[data-match]')].map(el=>el.value===''?null:Number(el.value));
}
function answerText(q,value) {
  if(value===null||value===undefined)return 'No answer';
  if(q.type==='mcq')return q.options[value]??'No answer';
  if(q.type==='fib')return value||'No answer';
  return q.pairs.map((pair,i)=>`${pair[0]} → ${q.pairs[value[i]]?.[1]??'No answer'}`).join('\n');
}
function correctText(q) { return q.type==='mcq'?q.options[q.correct]:q.type==='fib'?q.answers[0]:q.pairs.map(p=>p.join(' → ')).join('\n'); }
function feedback(q,r) {
  return `<div id="feedback" tabindex="-1" class="feedback ${r.correct?'correct':'incorrect'}"><h2>${r.skipped?'Question skipped':r.correct?'That’s correct.':'Not quite. Let’s work it through.'}${session.hinted.includes(q.id)?'<span class="assisted">Hint used</span>':''}</h2><p class="correct-answer"><strong>Correct answer</strong><br>${esc(correctText(q))}</p><p>${esc(q.explanation)}</p>${source(q)}</div>`;
}
function submit() {
  if(expire())return;
  const q=current(),value=readAnswer(q);if(!complete(q,value))return;
  recordAnswer(session,q,value);
  save();quiz();document.querySelector('#feedback')?.focus();
}
function move(direction) {
  if(expire())return;
  const destination=session.index+direction;
  if(destination<0||destination>=session.ids.length)return;
  recordAnswer(session,current(),readAnswer(current()));
  session.index=destination;save();quiz();focusHeading();
}
function next() {
  if(expire())return;
  if(session.index===session.ids.length-1){requestFinish();return;}
  move(1);
}
function requestFinish() {
  if(expire())return;
  confirmAction('Finish this session?', 'Your latest answers will be scored. Unanswered or incomplete questions score zero. Choose Keep working to return and revise them.', 'Finish & review',()=>finish(false));
}
function finish(timedOut) {
  if(session.finished)return;
  session.ids.forEach(id=>recordAnswer(session,byId[id],currentAnswer(session,id)));
  session.finished=true;session.ended=Date.now();session.timedOut=timedOut;session.draft=null;
  document.querySelectorAll('dialog').forEach(dialog=>{dialog.close();dialog.remove();});
  save();onlyMissed=false;results();focusHeading();
}
function expire() {
  if(session&&!session.finished&&session.mode==='mock'&&remaining(session)===0){finish(true);return true;}
  return false;
}
function tick() {
  if(view!=='quiz'||session.mode!=='mock'||session.finished)return;
  if(expire())return;
  const secs=remaining(session),timer=document.querySelector('#timer');
  if(timer){timer.textContent=`${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`;timer.parentElement.classList.toggle('urgent',secs<=300);}
  if(secs<=300&&!timerWarning){timerWarning=true;document.querySelector('#time-warning').textContent='Five minutes or less remain. The test submits automatically when time is up.';}
}
setInterval(tick,1000);
document.addEventListener('visibilitychange',tick);
function results() {
  view='results';
  const rows=session.ids.map(id=>({q:byId[id],r:session.answers[id]}));
  const correct=rows.filter(({r})=>r.correct).length;
  const skipped=rows.filter(({r})=>r.skipped).length;
  const missed=rows.filter(({r})=>!r.correct);
  const percent=Math.round(correct/rows.length*100);
  const seconds=Math.max(0,Math.floor(((session.mode==='mock'?Math.min(session.ended,session.deadline):session.ended)-session.start)/1000));
  main.innerHTML=`<div class="page-heading"><div><p class="eyebrow">${session.mode==='mock'?'TIMED PRACTICE':'GUIDED PRACTICE'} / COMPLETE</p><h1 tabindex="-1">${session.timedOut?'Time’s up. Let’s review.':'Every answer is a way forward.'}</h1><p class="subheading">${session.timedOut?'Your complete current answer was saved and the test submitted automatically.':'Revisit the reasoning, then put it into practice.'}</p></div><button id="new-session" class="secondary">New session</button></div>
    <div class="results-grid"><section class="score-card"><div class="score-ring" style="--score:${percent}%"><strong>${percent}<span>%</span></strong></div><div><h2>${correct} / ${rows.length} correct</h2><p>${skipped} unanswered · ${Math.floor(seconds/60)}m ${seconds%60}s</p><p>${session.hinted.length} question${session.hinted.length===1?'':'s'} with hints</p></div></section>
    <section class="breakdown"><h2>By lecture</h2>${lectures.filter(l=>rows.some(({q})=>q.lecture===l.id)).map(l=>{const entries=rows.filter(({q})=>q.lecture===l.id),n=entries.filter(({r})=>r.correct).length;return `<div class="breakdown-row"><span>${String(l.id).padStart(2,'0')} · ${l.title}</span><div class="mini-track"><span style="width:${n/entries.length*100}%"></span></div><strong>${n}/${entries.length}</strong></div>`;}).join('')}</section></div>
    <div class="review-heading"><div><h2>Answer review</h2><p>One point per question. Matching is scored only when all pairs are correct.</p></div><div class="review-controls"><label class="filter-label"><input id="only-missed" type="checkbox" ${onlyMissed?'checked':''}> Missed only (${missed.length})</label>${missed.length?'<button id="retry" class="primary">Practise missed questions</button>':''}</div></div>
    <div class="review-list">${rows.filter(({r})=>!onlyMissed||!r.correct).map(({q,r})=>`<details class="review-item"><summary><span class="result-indicator ${r.correct?'yes':'no'}">${r.correct?'✓':r.skipped?'—':'×'}</span><span><span class="review-meta">${q.id} · Set ${q.set} · ${typeLabel[q.type]} · ${r.skipped?'Unanswered':r.correct?'Correct':'Incorrect'}${session.hinted.includes(q.id)?' · Hint used':''}</span><strong>${esc(q.prompt)}</strong></span><span class="expand-icon" aria-hidden="true">+</span></summary><div class="review-content"><div class="answer-comparison"><p><strong>Your answer</strong><br>${esc(answerText(q,r.value))}</p><p><strong>Correct answer</strong><br>${esc(correctText(q))}</p></div><h3>Why this answer</h3><p>${esc(q.explanation)}</p><p class="review-hint"><strong>Hint:</strong> ${esc(q.hint)}</p>${source(q)}</div></details>`).join('')||'<p class="empty-state">No missed questions. Nicely done.</p>'}</div>`;
  document.querySelector('#new-session').onclick=()=>{home();focusHeading();};
  document.querySelector('#only-missed').onchange=e=>{onlyMissed=e.target.checked;results();document.querySelector('#only-missed').focus();};
  document.querySelector('#retry')?.addEventListener('click',()=>{session=createSession(missed.map(({q})=>q),'practice');onlyMissed=false;save();quiz();focusHeading();});
}
function confirmAction(title,description,label,action) {
  const dialog=document.createElement('dialog');
  dialog.setAttribute('aria-labelledby','dialog-title');dialog.setAttribute('aria-describedby','dialog-description');
  dialog.innerHTML=`<h2 id="dialog-title">${esc(title)}</h2><p id="dialog-description">${esc(description)}</p><div class="dialog-actions"><button class="secondary" id="cancel" autofocus>Keep working</button><button class="primary" id="confirm">${esc(label)}</button></div>`;
  document.body.append(dialog);dialog.showModal();
  const close=()=>{dialog.close();dialog.remove();};
  dialog.querySelector('#cancel').onclick=close;
  dialog.querySelector('#confirm').onclick=()=>{close();action();};
  dialog.oncancel=e=>{e.preventDefault();close();};
}
if(session) { if(session.finished)results();else quiz(); } else home();
