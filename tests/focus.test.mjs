import test from 'node:test';
import assert from 'node:assert/strict';
import { questions } from '../docs/questions.js';
import { selectFocusedQuestions, planQuestionMix, createSession, validSession } from '../docs/engine.js';

test('all questions are classified, and Set 4 adds 20 conceptual questions per lecture',()=>{
  assert.equal(questions.filter(q=>q.focus==='arithmetic').length,164);
  assert.equal(questions.filter(q=>q.focus==='conceptual').length,296);
  for(let lecture=0;lecture<6;lecture++){
    const added=questions.filter(q=>q.lecture===lecture&&q.set===4);
    assert.equal(added.length,20);
    assert.ok(added.every(q=>q.focus==='conceptual'&&!q.tutorial));
    assert.deepEqual(added.map(q=>q.id),Array.from({length:20},(_,i)=>`L${lecture}-${i+61}`));
  }
});

test('every slider percentage produces its rounded count when the pool supports it',()=>{
  for(const count of [10,20,25])for(let percent=0;percent<=100;percent++){
    const picked=selectFocusedQuestions(questions,[0,1,2,3,4,5],count,percent);
    assert.equal(picked.length,count);
    assert.equal(new Set(picked.map(q=>q.id)).size,count);
    assert.equal(picked.filter(q=>q.focus==='arithmetic').length,Math.round(count*percent/100));
    const counts=Array.from({length:6},(_,l)=>picked.filter(q=>q.lecture===l).length);
    assert.ok(Math.max(...counts)-Math.min(...counts)<=1,'lecture balance');
  }
});

test('restricted pools use the closest feasible counts and preview agrees with actual selection',()=>{
  for(const set of [1,2,3,4])for(const lectures of [[0],[1,3],[0,1,2,3,4,5]])for(const percent of [0,25,33,50,75,100]){
    const bank=questions.filter(q=>q.set===set);
    const plan=planQuestionMix(bank,lectures,25,percent);
    const picked=selectFocusedQuestions(bank,lectures,25,percent);
    assert.equal(picked.length,plan.total);
    assert.equal(picked.filter(q=>q.focus==='arithmetic').length,plan.arithmetic);
    assert.ok(picked.every(q=>q.set===set&&lectures.includes(q.lecture)));
    const low=plan.groups.reduce((n,g)=>n+Math.max(0,g.count-g.conceptualPool.length),0);
    const high=plan.groups.reduce((n,g)=>n+Math.min(g.count,g.arithmeticPool.length),0);
    const feasible=Array.from({length:high-low+1},(_,i)=>low+i);
    assert.equal(Math.abs(plan.arithmetic-plan.requested),Math.min(...feasible.map(n=>Math.abs(n-plan.requested))));
  }
  const scarce=selectFocusedQuestions(questions,[0],20,100);
  assert.equal(scarce.filter(q=>q.focus==='arithmetic').length,9);
});

test('all-selected, empty pools and saved sessions remain usable',()=>{
  for(const percent of [0,50,100]){
    const picked=selectFocusedQuestions(questions,[0,1,2,3,4,5],460,percent);
    assert.equal(picked.length,460);assert.equal(new Set(picked.map(q=>q.id)).size,460);
  }
  assert.deepEqual(selectFocusedQuestions(questions,[],25,50),[]);
  assert.deepEqual(selectFocusedQuestions([], [0],25,100),[]);
  const sample=selectFocusedQuestions(questions,[1,2],20,33);
  const session=createSession(sample,'mock',1000,33);
  assert.equal(session.arithmeticPercent,33);assert.equal(session.deadline,3601000);
  assert.ok(validSession(JSON.parse(JSON.stringify(session)),questions));
  delete session.arithmeticPercent;assert.ok(validSession(session,questions),'legacy saves have no focus property');
});
