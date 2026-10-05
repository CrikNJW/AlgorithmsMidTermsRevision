import test from 'node:test';
import assert from 'node:assert/strict';
import { questions, lectures } from '../docs/questions.js';
import { grade, complete, createSession, formatQuotas, remaining, selectQuestions, validSession } from '../docs/engine.js';

test('240 complete questions, two sets of 20 per lecture, every format represented',()=>{
  assert.equal(questions.length,240);
  assert.equal(new Set(questions.map(q=>q.id)).size,240);
  assert.equal(new Set(questions.map(q=>q.prompt)).size,240);
  for(const l of lectures){
    const bank=questions.filter(q=>q.lecture===l.id);
    assert.equal(bank.length,40);
    assert.deepEqual([...new Set(bank.map(q=>q.type))].sort(),['fib','match','mcq']);
    for(const set of [1,2]) {
      const section=bank.filter(q=>q.set===set);
      assert.equal(section.length,20);
      assert.deepEqual([...new Set(section.map(q=>q.type))].sort(),['fib','match','mcq']);
      section.forEach(q=>assert.equal(q.set,Number(q.id.split('-')[1])<=20?1:2));
    }
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
  assert.equal(selectQuestions(questions,[1],240).length,40);
  assert.equal(selectQuestions(questions,[],25).length,0);
  assert.equal(selectQuestions(questions,[0,1,2,3,4,5],240).length,240);
});
test('every session mixes MCQ, fill-in and matching in proportion to the bank',()=>{
  const counts=qs=>qs.reduce((c,q)=>(c[q.type]++,c),{mcq:0,fib:0,match:0});
  assert.deepEqual(formatQuotas([],25),{});
  assert.deepEqual(formatQuotas(questions,25),{mcq:13,fib:7,match:5});
  for(let i=0;i<200;i++){
    for(const set of ['all',1,2]){
      const bank=set==='all'?questions:questions.filter(q=>q.set===set);
      assert.deepEqual(counts(selectQuestions(bank,[0,1,2,3,4,5],25)),formatQuotas(bank,25));
      for(const l of lectures){
        const c=counts(selectQuestions(bank,[l.id],10));
        assert.deepEqual(c,{mcq:5,fib:3,match:2});
      }
    }
  }
  assert.deepEqual(counts(selectQuestions(questions,[2],3)),{mcq:1,fib:1,match:1});
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

test('set 2 numeric and trace answers agree with independent calculations',()=>{
  const answer=(id,value)=>assert.ok(grade(questions.find(q=>q.id===id),String(value)),id);
  answer('L0-31',24/(6-2));answer('L0-32',Math.floor(24/(6-2))+1);
  answer('L0-33',25*8);answer('L0-34',8*9-(9+7));
  let iterations=0;for(let i=1;i<81;i*=3)iterations++;
  answer('L2-31',iterations);
  let work=0;for(let i=1;i<=16;i*=2)work+=i;
  answer('L2-32',work);
  work=0;for(let i=0;i<=4;i++)for(let j=i+1;j<=4;j++)work++;
  answer('L2-33',work);answer('L2-34',Math.max(...[1,2,3,4,5].map(n=>(3*n+9)/n)));
  answer('L2-35',9);answer('L2-36',[1,2,3,4,5].reduce((a,b)=>a+b)/5);
  const factorialCalls=n=>n===0?1:1+factorialCalls(n-1);
  const fibCalls=n=>n<2?1:1+fibCalls(n-1)+fibCalls(n-2);
  const halving=n=>n===1?2:halving(n/2)+3;
  answer('L3-31',factorialCalls(4));answer('L3-32',fibCalls(3));answer('L3-33',halving(16));
  answer('L3-34',Math.log2(8));answer('L3-35',4**2*(16/2**2));
  const triangle=n=>n===0?0:triangle(n-1)+n;
  answer('L3-36',triangle(5));answer('L4-31',triangle(6));answer('L4-32',7-1);
  answer('L4-33',9-4+1);answer('L4-34',4+5-1);answer('L4-35',2**5*5);
  const costs=[[9,2,7,8],[6,4,3,7],[5,8,1,8],[7,6,9,4]];
  const used=new Set();let greedyCost=0;
  for(const row of costs){const j=row.reduce((best,_,i)=>!used.has(i)&&(best===-1||row[i]<row[best])?i:best,-1);used.add(j);greedyCost+=row[j];}
  answer('L4-36',greedyCost);
  const safe=(r,c,queens)=>queens.every(([qr,qc])=>r!==qr&&c!==qc&&Math.abs(r-qr)!==Math.abs(c-qc));
  answer('L5-31',[0,1,2,3].find(c=>safe(1,c,[[0,1]])));
  const coins=[1,3,4], coinDP=[0];
  for(let target=1;target<=6;target++)coinDP[target]=1+Math.min(...coins.filter(c=>c<=target).map(c=>coinDP[target-c]));
  answer('L5-32',coinDP[6]);
  let capacity=6,value=0;for(const [v,w] of [[4,5],[3,3],[10,5]].sort((a,b)=>b[0]/b[1]-a[0]/a[1])){const take=Math.min(w,capacity);value+=take*v/w;capacity-=take;}
  answer('L5-33',value);
  const rod=prices=>{const dp=[0];for(let n=1;n<prices.length;n++)dp[n]=Math.max(...Array.from({length:n},(_,i)=>prices[i+1]+dp[n-i-1]));return dp.at(-1);};
  answer('L5-34',rod([0,1,5,8,9,10]));answer('L5-35',triangle(6));answer('L5-36',rod([0,1,3,10]));
  const queens=[1,3,0,2].map((c,r)=>[r,c]);
  assert.ok(queens.every(([r,c],i)=>safe(r,c,queens.filter((_,j)=>j!==i))));
});

test('set sampling remains disjoint and old saved sessions are still valid',()=>{
  for(const set of [1,2]){
    const bank=questions.filter(q=>q.set===set);
    assert.equal(bank.length,120);
    const sample=selectQuestions(bank,[0,1,2,3,4,5],25);
    assert.equal(sample.length,25);assert.ok(sample.every(q=>q.set===set));
    for(const lecture of lectures)assert.equal(selectQuestions(bank,[lecture.id],20).length,20);
  }
  const oldQuestions=questions.filter(q=>q.set===1).slice(0,20).map(({set,...q})=>q);
  const restored=JSON.parse(JSON.stringify(createSession(oldQuestions,'practice')));
  assert.ok(validSession(restored,questions));
});
