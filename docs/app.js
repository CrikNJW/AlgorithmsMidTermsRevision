import { lectures, questions } from './questions.js';
import { selectQuestions, createSession, complete, grade, remaining, validSession } from './engine.js';

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
  if (validSession(saved, questions)) session = saved;
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
    <div class="page-heading"><div><p class="eyebrow">YOUR REVISION DESK</p><h1 tabindex="-1">Make the next answer count.</h1></div><span class="edition">LECTURES<br><strong>00—05</strong></span></div>
    <div class="home-grid"><section class="setup-panel" aria-label="Session setup">
      <div class="section-title"><h2>Choose your session</h2><span class="step">01 / MODE</span></div>
      <div class="mode-grid" role="group" aria-label="Session mode">
        <button class="mode-card ${mode==='practice'?'selected':''}" data-mode="practice" aria-pressed="${mode==='practice'}"><span class="mode-icon">✦</span><strong>Guided practice</strong><span>Practice questions without a time limit. Explanations and hints are available.</span>${badge('LEARN AS YOU GO')}</button>
        <button class="mode-card ${mode==='mock'?'selected':''}" data-mode="mock" aria-pressed="${mode==='mock'}"><span class="mode-icon">◷</span><strong>Exam rehearsal</strong><span>25 questions, 60 minutes. No explanations until the end.</span>${badge('EXAM CONDITIONS')}</button>
      </div>
      <div class="section-title topics-heading"><h2>Pick your lectures</h2><button class="text-button" id="toggle-all">${selected.length===6?'Clear all':'Select all'}</button></div>
      <div class="lecture-grid">${lectures.map(l=>`<label class="lecture-card ${selected.includes(l.id)?'checked':''}"><input type="checkbox" name="lecture" value="${l.id}" ${selected.includes(l.id)?'checked':''}><span class="lecture-number">${String(l.id).padStart(2,'0')}</span><span class="lecture-text"><strong>${l.title}</strong><span>${l.subtitle}</span></span><span class="question-count">${questions.filter(q=>q.lecture===l.id&&(questionSet==='all'||q.set===Number(questionSet))).length} Qs</span></label>`).join('')}</div>
      <p class="small-note">Lecture 00 applies the introductory learning objectives; it is mainly an orientation lecture.</p>
      <div class="session-controls"><label>Question set<select id="question-set"><option value="all" ${questionSet==='all'?'selected':''}>Both sets</option><option value="1" ${questionSet==='1'?'selected':''}>Set 1 · Original</option><option value="2" ${questionSet==='2'?'selected':''}>Set 2 · New</option></select></label><label ${mode==='mock'?'hidden':''}>Questions<select id="question-count"><option value="10" ${count==='10'?'selected':''}>10 questions</option><option value="20" ${count==='20'?'selected':''}>20 questions</option><option value="all" ${count==='all'?'selected':''}>All selected questions</option></select></label><div class="session-summary" id="session-summary"></div><button class="primary" id="start">${mode==='mock'?'Start mock test':'Start practice'}</button></div>
      <p id="setup-error" class="error-text" role="alert"></p>
      <div class="rules"><span aria-hidden="true">↳</span><p>Answers lock on submission. There is no back button.<br>One point per question; matching needs every pair correct.</p></div>
    </section>
    <aside class="desk-sidebar"><section class="exam-card"><p class="eyebrow">TEST 01 / THE REAL THING</p><h2>6 October 2026</h2><p class="exam-time">14:30–15:30 <span>SGT</span></p><div class="arrival"><span>Be there by</span><strong>14:15</strong></div><ul class="checklist"><li>Student card & attendance signature</li><li>Laptop & charger</li><li>Check school Wi-Fi and Examena</li><li>Closed book · No calculator needed</li><li>Devices in your bag, bag at the front</li></ul><p class="venue-note">Check your assigned venue in the venue file. That file is not in this repository.</p></section>
    <section class="study-note"><span class="note-mark">i</span><h3>A practice companion</h3><p>Original questions based on your lecture PDFs, with page references in every explanation. These are revision questions, not predictions of the test.</p><p>Mock questions are balanced across your selected lectures. This balance is for practice; the real test weighting is unknown.</p></section>
    ${session?.finished?`<button class="secondary full-width" id="last-result">View last session results</button>`:''}
    </aside></div>
    <details class="source-notes"><summary>Source notes & notation</summary><p>Lecture PDFs stay in your local repository and are not published with this site. Page references use PDF page numbers. Questions use a constant-cost arithmetic model unless stated otherwise. Complexity questions asking for a tight bound distinguish Θ from a merely valid O upper bound.</p><p>Corrections are explained where relevant: Θ is a tight bound, not synonymous with average case (L01 p.31; formal definitions in L02 pp.25–27). The 33-minute schedule in L05 p.48 omits a job. The Master theorem questions use the three-case version actually stated in L03.</p><p>For the formal interpretation of asymptotic notation, see <a href="https://ocw.mit.edu/courses/6-100l-introduction-to-cs-and-programming-using-python-fall-2022/resources/6100l-lecture-22-version-2_mp4/" target="_blank" rel="noopener">MIT’s Big Oh and Theta lecture</a>.</p><p>The announcement’s year is interpreted as 2026, consistent with its opening sentence and deadline. Check the official course announcement for any updates.</p></details>`;
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
  document.querySelector('#session-summary').innerHTML=`<strong>${n} questions</strong><span>${mode==='mock'?'60-minute timer · No hints':'Untimed · Hints available'}</span>`;
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
  const q=current(), record=session.answers[q.id], locked=Boolean(record), isMock=session.mode==='mock';
  const answer=locked?record.value:session.draft;
  const progress=Math.round(session.index/session.ids.length*100);
  main.innerHTML=`<div class="session-top"><div><p class="eyebrow">${isMock?'EXAM REHEARSAL':'GUIDED PRACTICE'}</p><span class="session-rule">One question at a time · Answers lock on submission</span></div><div class="session-top-actions">${isMock?`<div class="timer" aria-label="Time remaining"><span>TIME LEFT</span><strong id="timer"></strong></div>`:badge('UNTIMED')}<button id="end" class="text-button">End session</button></div></div>
    <div class="progress-track" role="progressbar" aria-label="Questions completed" aria-valuemin="0" aria-valuemax="${session.ids.length}" aria-valuenow="${session.index}"><span style="width:${progress}%"></span></div>
    <div class="quiz-layout"><aside class="quiz-sidebar"><span class="large-number">${String(session.index+1).padStart(2,'0')}<small> / ${session.ids.length}</small></span><p class="eyebrow">LECTURE ${String(q.lecture).padStart(2,'0')}</p><h2>${lectures[q.lecture].title}</h2><p>${esc(q.topic)}</p><div class="mini-rule"></div><p class="small-note">${isMock?'Treat this as closed book. Hints and explanations unlock after the test.':'Work it through, then lock your answer. Your explanation appears immediately.'}</p><p class="save-note">Progress saved in this browser</p></aside>
    <section class="question-card"><div class="question-meta">${badge(typeLabel[q.type])}${badge(q.difficulty,'muted')}<span>${q.id} · Set ${q.set}</span></div><h1 tabindex="-1" class="question-prompt">${esc(q.prompt)}</h1>
    <form id="answer-form"><fieldset ${locked?'disabled':''}><legend class="sr-only">Your answer</legend>${answerFields(q,answer)}</fieldset>
    ${!isMock&&!locked?`<button type="button" id="hint" class="hint-button" aria-expanded="${session.hinted.includes(q.id)}" aria-controls="hint-text">${session.hinted.includes(q.id)?'Hint shown':'Need a hint?'}</button><div id="hint-text" class="hint-box" ${session.hinted.includes(q.id)?'':'hidden'}>${esc(q.hint)}</div>`:''}
    ${locked?feedback(q,record):''}
    <div class="answer-actions">${locked?`<span class="locked-note">Answer locked</span><button type="button" id="next" class="primary">${session.index===session.ids.length-1?'See results':'Next question'}</button>`:`<button type="button" id="skip" class="text-button">Skip question</button><button type="submit" id="submit" class="primary" ${complete(q,answer)?'':'disabled'}>${isMock?(session.index===session.ids.length-1?'Submit & finish':'Submit & next'):'Check answer'}</button>`}</div>
    <p class="small-note">${q.type==='match'?'Choose one match for every row. Each option is used once; all pairs must be correct for the point.':q.type==='fib'?'Case and extra surrounding spaces are ignored. Use the form requested by the question.':'Choose one answer.'}</p></form><p id="time-warning" class="error-text" role="status"></p></section></div>`;
  document.querySelector('#end').onclick=()=>confirmAction('End this session?', 'Your complete current answer will be saved. Remaining unanswered questions score zero. You can review all explanations next.', 'End & review',()=>finish(false));
  document.querySelector('#answer-form').onsubmit=e=>{e.preventDefault();submit();};
  main.querySelectorAll('input, select').forEach(el=>{
    el.addEventListener('input',()=>{ session.draft=readAnswer(q); save(); document.querySelector('#submit').disabled=!complete(q,session.draft); });
    el.addEventListener('change',()=>{ session.draft=readAnswer(q); save(); document.querySelector('#submit').disabled=!complete(q,session.draft); });
  });
  document.querySelector('#hint')?.addEventListener('click',()=>{
    if(!session.hinted.includes(q.id))session.hinted.push(q.id);
    save(); document.querySelector('#hint-text').hidden=false;
    document.querySelector('#hint').setAttribute('aria-expanded','true');document.querySelector('#hint').textContent='Hint shown';
  });
  document.querySelector('#skip')?.addEventListener('click',()=>confirmAction('Skip this question?', 'This locks the question as unanswered. You cannot return to it during this session.', 'Skip & continue',()=>{
    if(expire())return;
    session.answers[q.id]={value:null,correct:false,skipped:true};
    if(isMock)next();else{save();quiz();document.querySelector('#feedback')?.focus();}
  }));
  document.querySelector('#next')?.addEventListener('click',next);
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
  const q=current(); if(session.answers[q.id])return;
  const value=readAnswer(q);if(!complete(q,value))return;
  session.answers[q.id]={value,correct:grade(q,value),skipped:false};session.draft=null;
  if(session.mode==='mock')next();else{save();quiz();document.querySelector('#feedback')?.focus();}
}
function next() {
  if(expire())return;
  if(!session.answers[current().id])return;
  if(session.index===session.ids.length-1){finish(false);return;}
  session.index++;session.draft=null;save();quiz();focusHeading();
}
function finish(timedOut) {
  if(session.finished)return;
  const q=current();
  if(!session.answers[q.id]&&complete(q,session.draft))session.answers[q.id]={value:session.draft,correct:grade(q,session.draft),skipped:false};
  session.ids.forEach(id=>{if(!session.answers[id])session.answers[id]={value:null,correct:false,skipped:true};});
  session.finished=true;session.ended=Date.now();session.timedOut=timedOut;session.draft=null;
  document.querySelector('dialog')?.close();document.querySelector('dialog')?.remove();
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
  main.innerHTML=`<div class="page-heading"><div><p class="eyebrow">${session.mode==='mock'?'EXAM REHEARSAL':'GUIDED PRACTICE'} / COMPLETE</p><h1 tabindex="-1">${session.timedOut?'Time’s up. Let’s review.':'Every answer is a way forward.'}</h1><p class="subheading">${session.timedOut?'Your complete current answer was saved and the test submitted automatically.':'Revisit the reasoning, then put it into practice.'}</p></div><button id="new-session" class="secondary">New session</button></div>
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
