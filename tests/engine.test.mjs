import test from 'node:test';
import assert from 'node:assert/strict';
import { questions, lectures } from '../docs/questions.js';
import { grade, complete, createSession, remaining, selectQuestions, validSession } from '../docs/engine.js';

test('120 original, complete questions, 20 per lecture, every format represented',()=>{
  assert.equal(questions.length,120);
  assert.equal(new Set(questions.map(q=>q.id)).size,120);
  assert.equal(new Set(questions.map(q=>q.prompt)).size,120);
  for(const l of lectures){
    const bank=questions.filter(q=>q.lecture===l.id);
    assert.equal(bank.length,20);
    assert.deepEqual([...new Set(bank.map(q=>q.type))].sort(),['fib','match','mcq']);
  }
  for(const q of questions){
    for(const field of ['hint','explanation','pages','topic','prompt'])assert.ok(q[field]?.trim(),`${q.id}: missing ${field}`);
    if(q.type==='mcq'){
      assert.equal(q.options.length,4);
      assert.equal(new Set(q.options).size,4);
      q.options.forEach((_,i)=>assert.equal(grade(q,i),i===q.correct));
    }else if(q.type==='fib'){
      assert.ok(q.answers.length);
      q.answers.forEach(a=>assert.ok(grade(q,`  ${a.toUpperCase()}  `)));
      assert.equal(grade(q,''),false);
      assert.equal(grade(q,'definitely wrong'),false);
    }else{
      assert.equal(new Set(q.pairs.map(p=>p[1])).size,q.pairs.length);
      assert.ok(grade(q,q.pairs.map((_,i)=>i)));
      assert.equal(grade(q,q.pairs.map(()=>0)),false);
      assert.equal(grade(q,[]),false);
    }
  }
});
test('mock sampling is unique and balanced; a full practice set covers every question',()=>{
  for(let i=0;i<25;i++){
    const picked=selectQuestions(questions,[0,1,2,3,4,5],25);
    assert.equal(picked.length,25);assert.equal(new Set(picked.map(q=>q.id)).size,25);
    for(const l of lectures){const n=picked.filter(q=>q.lecture===l.id).length;assert.ok(n===4||n===5);}
  }
  assert.equal(selectQuestions(questions,[1],120).length,20);
  assert.equal(selectQuestions(questions,[],25).length,0);
  assert.equal(selectQuestions(questions,[0,1,2,3,4,5],120).length,120);
});
test('fill-in grading accepts equivalent decimals/fractions but not partial text or arithmetic',()=>{
  const q={type:'fib',answers:['14.6']};
  for(const a of ['14.60',' 14.6 ','73/5'])assert.ok(grade(q,a));
  for(const a of ['14.6abc','14.6 coins','14.61','NaN','1/0','13+1.6',''])assert.equal(grade(q,a),false);
  assert.ok(grade({type:'fib',answers:['3/2']},'3 / 2'));
});
test('blank selections cannot submit, and matching awards a point only for the full mapping',()=>{
  const m=questions.find(q=>q.type==='match');
  assert.equal(complete(m,[0,null,2,3]),false);
  assert.equal(complete(questions[0],null),false);
  assert.equal(complete(questions.find(q=>q.type==='fib'),'  '),false);
  assert.equal(grade(m,m.pairs.map((_,i)=>i===0?1:i)),false);
});
test('absolute deadline persists through reload and cannot gain time from a delayed tick',()=>{
  const s=createSession(questions.slice(0,25),'mock',1000);
  assert.equal(remaining(s,1000),3600);
  const restored=JSON.parse(JSON.stringify(s));
  assert.ok(validSession(restored,questions));
  assert.equal(remaining(restored,31000),3570);
  assert.equal(remaining(restored,3601000),0);
  assert.equal(remaining(restored,5000000),0);
  assert.equal(validSession({...s,ids:['missing']},questions),false);
  assert.equal(validSession({...s,finished:true},questions),false);
});
test('computed lecture examples agree with answer keys',()=>{
  const cost=[[9,2,7,8],[6,4,3,7],[5,8,1,8],[7,6,9,4]];
  const perms=a=>a.length?a.flatMap((v,i)=>perms(a.filter((_,j)=>i!==j)).map(p=>[v,...p])):[[]];
  const best=Math.min(...perms([0,1,2,3]).map(p=>p.reduce((sum,j,i)=>sum+cost[i][j],0)));
  assert.ok(grade(questions.find(q=>q.id==='L4-16'),String(best)));
  const prices=[0,1,5,8,9],dp=[0];
  for(let n=1;n<=4;n++)dp[n]=Math.max(...Array.from({length:n},(_,j)=>prices[j+1]+dp[n-j-1]));
  assert.ok(grade(questions.find(q=>q.id==='L5-13'),String(dp[4])));
  const jobs=[3,5,6,10,11,14,15,18,20];
  assert.equal(jobs.reduce((a,b)=>a+b,0),102);
  assert.deepEqual([20+11+3,18+10+6,15+14+5],[34,34,34]);
  assert.ok(grade(questions.find(q=>q.id==='L5-15'),'34'));
});
