import test from 'node:test';
import assert from 'node:assert/strict';
import { questions, lectures } from '../docs/questions.js';
import { grade, complete, createSession, remaining, selectQuestions, validSession } from '../docs/engine.js';

test('460 complete questions: original sets plus 20 new conceptual questions per lecture',()=>{
  assert.equal(questions.length,460);
  assert.equal(new Set(questions.map(q=>q.id)).size,460);
  assert.equal(new Set(questions.map(q=>q.prompt)).size,460);
  for(const l of lectures){
    const bank=questions.filter(q=>q.lecture===l.id);
    const sets=l.id===0?[1,2,4]:[1,2,3,4];
    assert.equal(bank.length,20*sets.length);
    assert.deepEqual([...new Set(bank.map(q=>q.set))].sort(),sets);
    for(const set of sets) {
      const section=bank.filter(q=>q.set===set);
      assert.equal(section.length,20);
      assert.deepEqual([...new Set(section.map(q=>q.type))].sort(),['fib','match','mcq']);
      section.forEach(q=>assert.equal(q.set,Math.ceil(Number(q.id.split('-')[1])/20)));
      section.forEach(q=>assert.equal(Boolean(q.tutorial),set===3,`${q.id}: tutorial reference only on set 3`));
    }
  }
  for(const q of questions.filter(q=>q.tutorial))assert.match(q.tutorial,/^T0[1-5](\.1)? Q[1-5]$/);
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
  assert.equal(selectQuestions(questions,[1],460).length,80);
  assert.equal(selectQuestions(questions,[],25).length,0);
  assert.equal(selectQuestions(questions,[0,1,2,3,4,5],460).length,460);
});
test('fill-in grading accepts equivalent decimals/fractions but not partial text or arithmetic',()=>{
  const q={type:'fib',answers:['14.6']};
  for(const a of ['14.60',' 14.6 ','73/5'])assert.ok(grade(q,a));
  for(const a of ['14.6abc','14.6 coins','14.61','NaN','1/0','13+1.6',''])assert.equal(grade(q,a),false);
  assert.ok(grade({type:'fib',answers:['3/2']},'3 / 2'));
  for(const a of ['0,1,3,4','0 , 1, 3 ,4',' 0, 1, 3, 4 '])assert.ok(grade({type:'fib',answers:['0, 1, 3, 4']},a));
  assert.equal(grade({type:'fib',answers:['0, 1, 3, 4']},'0, 1, 4, 3'),false);
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
  for(const set of [1,2,3,4]){
    const bank=questions.filter(q=>q.set===set);
    assert.equal(bank.length,set===3?100:120);
    const sample=selectQuestions(bank,[0,1,2,3,4,5],25);
    assert.equal(sample.length,25);assert.ok(sample.every(q=>q.set===set));
    for(const lecture of lectures)assert.equal(selectQuestions(bank,[lecture.id],20).length,set===3&&lecture.id===0?0:20);
  }
  const oldQuestions=questions.filter(q=>q.set===1).slice(0,20).map(({set,...q})=>q);
  const restored=JSON.parse(JSON.stringify(createSession(oldQuestions,'practice')));
  assert.ok(validSession(restored,questions));
});

test('set 3 tutorial answers agree with independent traces',()=>{
  const find=(ref,text)=>{const hits=questions.filter(q=>q.tutorial===ref&&q.prompt.includes(text));assert.equal(hits.length,1,`${ref}: ${text}`);return hits[0];};
  const fill=(ref,text,value)=>assert.ok(grade(find(ref,text),String(value)),`${ref}: ${text}`);
  const choice=(ref,text,value)=>{const q=find(ref,text);assert.equal(q.options[q.correct],value,`${ref}: ${text}`);};
  const pairs=(ref,text,expected)=>assert.deepEqual(find(ref,text).pairs,expected,`${ref}: ${text}`);
  const perms=a=>a.length?a.flatMap((v,i)=>perms(a.filter((_,j)=>i!==j)).map(p=>[v,...p])):[[]];
  const show=m=>Object.entries(m).sort().map(([a,b])=>`${a}–${b}`).join(', ');

  // Tutorial 1: stable matching and growth order.
  const M={m1:['w3','w2','w1'],m2:['w2','w3','w1'],m3:['w2','w3','w1']},W={w1:['m3','m1','m2'],w2:['m1','m3','m2'],w3:['m3','m1','m2']};
  const blocking=match=>{const partner=Object.fromEntries(Object.entries(match).map(([m,w])=>[w,m]));
    return Object.keys(M).flatMap(m=>Object.keys(W).filter(w=>match[m]!==w&&M[m].indexOf(w)<M[m].indexOf(match[m])&&W[w].indexOf(m)<W[w].indexOf(partner[w])).map(w=>`${m}–${w}`));};
  const matchings=perms(['w1','w2','w3']).map(p=>({m1:p[0],m2:p[1],m3:p[2]}));
  const stable=matchings.filter(m=>!blocking(m).length);
  fill('T01 Q2','are stable',stable.length);
  const galeShapley=(P,R)=>{const free=Object.keys(P),next=Object.fromEntries(free.map(p=>[p,0])),held={};let proposals=0;
    while(free.length){const p=free.shift(),r=P[p][next[p]++];proposals++;
      if(!held[r])held[r]=p;else if(R[r].indexOf(p)<R[r].indexOf(held[r])){free.push(held[r]);held[r]=p;}else free.unshift(p);}
    return {held,proposals};};
  const men=galeShapley(M,W),women=galeShapley(W,M);
  const menResult=Object.fromEntries(Object.entries(men.held).map(([w,m])=>[m,w])),womenResult=women.held;
  choice('T01 Q2','men proposing. What is the final matching',show(menResult));
  fill('T01 Q2','proposals in total',men.proposals);
  fill('T01 Q2','m1 ends up matched',womenResult.m1);
  choice('T01 Q2','who is w3 matched',Object.entries(womenResult).find(([,w])=>w==='w3')[0]);
  choice('T01 Q2','Which perfect matching is stable',show(Object.fromEntries(Object.entries(womenResult))));
  assert.ok(blocking({m1:'w1',m2:'w2',m3:'w3'}).includes(find('T01 Q2','m3–w3 is unstable').options[find('T01 Q2','m3–w3 is unstable').correct]));
  const best=(person,side)=>side==='m'?M[person].find(w=>stable.some(s=>s[person]===w)):W[person].find(m=>stable.some(s=>s[m]===person));
  pairs('T01 Q2','each man to his best',['m1','m2','m3'].map(m=>[m,best(m,'m')]));
  pairs('T01 Q2','each woman to her best',['w1','w2','w3'].map(w=>[w,best(w,'w')]));
  fill('T01 Q2','m1’s best valid',best('m1','m'));
  assert.ok(find('T01 Q2','m2’s best valid').options[find('T01 Q2','m2’s best valid').correct].startsWith(best('m2','m')));
  for(const [text,status] of find('T01 Q2','its status').pairs){
    const m=Object.fromEntries(text.split(', ').map(p=>p.split('–')));
    const blocks=blocking(m);
    assert.equal(status.startsWith('Stable'),!blocks.length,text);
    if(blocks.length)assert.equal(status,`Unstable: blocked by ${blocks.join(' and ')}`);
  }
  const logGrowth={'f1':n=>2.5*Math.log(n),'f2':n=>0.5*Math.log(2*n),'f3':n=>Math.log(n+10),'f4':n=>n*Math.log(10),'f5':n=>n*Math.log(100),'f6':n=>2*Math.log(n)+Math.log(Math.log(n))};
  const order=Object.keys(logGrowth).sort((a,b)=>logGrowth[a](1e6)-logGrowth[b](1e6));
  choice('T01 Q3','from slowest to fastest',order.join(', '));
  fill('T01 Q3','At n = 2¹⁶',2**40/(2**32*16));

  // Tutorial 2 and Tutorial 3 Q1: scaling, dominant terms, crossover and loop counts.
  const scale=(t,N,n)=>t*n*Math.log10(n)/(N*Math.log10(N));
  fill('T02 Q1','1,000,000 items, in milliseconds',scale(1,1e3,1e6));
  fill('T02 Q1','10,000 items, in milliseconds',scale(2,100,1e4));
  assert.deepEqual([100,1e4,1e6,1e9].map(n=>+scale(1,1e3,n).toFixed(3)),[0.067,13.333,2000,3000000]);
  const ops=n=>[8*n*Math.log2(n),2*n*n];
  const ties=Array.from({length:99},(_,i)=>i+2).filter(n=>ops(n)[0]===ops(n)[1]);
  fill('T02 Q3','same number of operations',ties[0]);
  const n0=Array.from({length:200},(_,i)=>i+1).find(n=>Array.from({length:1000},(_,k)=>n+k).every(m=>ops(m)[0]<ops(m)[1]));
  fill('T02 Q3','strictly fewer',n0);
  fill('T02 Q3','32n lg n',Array.from({length:999},(_,i)=>i+2).find(n=>32*n*Math.log2(n)===n*n));
  let body=0;for(let i=1;i<16;i*=2)for(let j=16;j>0;j=Math.floor(j/2))for(let k=j;k<16;k+=2)body++;
  fill('T03.1 Q1','how many times does sum',body);
  const runs=(init,cond,step)=>{let c=0;for(let v=init;cond(v);v=step(v))c++;return c;};
  const loopRuns=[runs(1,i=>i<16,i=>i*2),runs(16,j=>j>0,j=>Math.floor(j/2)),runs(4,k=>k<16,k=>k+2),runs(1,k=>k<16,k=>k+2)];
  fill('T03.1 Q1','i *= 2) runs',loopRuns[0]);fill('T03.1 Q1','integer division runs',loopRuns[1]);
  assert.deepEqual(find('T03.1 Q1','loop header').pairs.map(p=>Number(p[1])),loopRuns);

  // Tutorial 3 Q2–Q4: recursive GCD and the merge-sort recurrence.
  const gcd=(n,m,calls=[])=>{calls.push(`GCD(${n}, ${m})`);if(m<=n&&n%m===0)return {value:m,calls};return n<m?gcd(m,n,calls):gcd(m,n%m,calls);};
  for(const [a,b] of [[48,18],[1071,462],[17,5],[100,75]])fill('T03.1 Q2',`GCD(${a}, ${b}) returns`,gcd(a,b).value);
  fill('T03.1 Q2','calls in total',gcd(48,18).calls.length);
  choice('T03.1 Q2','first recursive call made by GCD(24, 54)',gcd(24,54).calls[1]);
  for(const [call,next] of find('T03.1 Q2','what it does next').pairs){
    const [a,b]=call.match(/\d+/g).map(Number),trace=gcd(a,b);
    assert.equal(next,trace.calls.length>1?`Call ${trace.calls[1]}`:`Return ${trace.value}`);
  }
  const T=n=>n===1?1:2*T(n/2)+n;
  fill('T03.1 Q4','T(16)',T(16));
  fill('T03.1 Q3','a·f(n/b) = c·f(n)',4*(1/2)**3);

  // Tutorial 4: E A S Y Q U E S T I O N traces.
  const keys='EASYQUESTION'.split(''),str=a=>a.join(' ');
  const sel=keys.map((k,i)=>({k,i})),selRows=[],skipped=[],involved=new Array(keys.length).fill(0);
  for(let step=0;step<sel.length-1;step++){let min=step;for(let i=step+1;i<sel.length;i++)if(sel[i].k<sel[min].k)min=i;
    if(min!==step){involved[sel[min].i]++;involved[sel[step].i]++;[sel[min],sel[step]]=[sel[step],sel[min]];}else skipped.push(step);
    selRows.push(str(sel.map(x=>x.k)));}
  choice('T04 Q1','after iteration 2',selRows[2]);
  choice('T04 Q1','perform no swap',skipped.join(', ').replace(/, (\d+)$/,' and $1'));
  pairs('T04 Q1','iteration of selection sort',[0,3,5,8].map(i=>[`Iteration ${i}`,selRows[i]]));
  fill('T04 Q2','swaps in total',keys.length-1-skipped.length);
  fill('T04 Q2','starts at index 2',involved[2]);
  const worst=[5,1,2,3,4],moves={count:0};
  for(let step=0;step<worst.length-1;step++){let min=step;for(let i=step+1;i<worst.length;i++)if(worst[i]<worst[min])min=i;
    if(min!==step){if(worst[min]===5||worst[step]===5)moves.count++;[worst[min],worst[step]]=[worst[step],worst[min]];}}
  assert.equal(moves.count,4);
  const ins=[...keys],insRows=[],shifts=[];
  for(let step=1;step<ins.length;step++){const key=ins[step];let j=step-1;while(j>=0&&key<ins[j]){ins[j+1]=ins[j];j--;}ins[j+1]=key;shifts.push(step-1-j);insRows.push(str(ins));}
  choice('T04 Q3','index 6 (the second E)',insRows[5]);
  fill('T04 Q3','(index 9) is inserted',shifts[8]);
  fill('T04 Q3','times in total',shifts.reduce((a,b)=>a+b));
  assert.match(find('T04 Q3','times in total').explanation,new RegExp(shifts.join(', ')));
  pairs('T04 Q3','insertion step',[4,7,10,11].map(i=>[`Insert ${keys[i]} (index ${i})`,insRows[i-1]]));
  const merged=[],runsSorted={};let lastCompares=0;
  const mergeSort=(a,l,r)=>{if(l>=r)return;const m=l+Math.floor((r-l)/2);mergeSort(a,l,m);mergeSort(a,m+1,r);
    const L=a.slice(l,m+1),R=a.slice(m+1,r+1);let i=0,j=0,k=l,c=0;
    while(i<L.length&&j<R.length){c++;a[k++]=L[i]<=R[j]?L[i++]:R[j++];}while(i<L.length)a[k++]=L[i++];while(j<R.length)a[k++]=R[j++];
    merged.push([l,r]);runsSorted[`${l}..${r}`]=str(a.slice(l,r+1));lastCompares=c;};
  mergeSort([...keys],0,keys.length-1);
  choice('T04 Q4','left half a[0..5]',runsSorted['0..5']);
  fill('T04 Q4','merge operations',merged.length);
  fill('T04 Q4','final merge',lastCompares);
  pairs('T04 Q4','3-key subarray',['0..2','3..5','6..8','9..11'].map(r=>{const [l,h]=r.split('..').map(Number);return [`a[${r}] = ${str(keys.slice(l,h+1))}`,runsSorted[r]];}));
  const qa=[...keys],parts=[];
  const partition=(a,low,high)=>{let i=low,j=high;const p=a[low];
    while(i<j){while(i<=high&&a[i]<=p)i++;while(a[j]>p)j--;if(i<j)[a[i],a[j]]=[a[j],a[i]];}
    [a[low],a[j]]=[a[j],a[low]];return j;};
  const quick=(a,lo,hi)=>{if(lo<hi){const pivot=a[lo],p=partition(a,lo,hi);parts.push({lo,hi,pivot,p,out:str(a)});quick(a,lo,p-1);quick(a,p+1,hi);}};
  quick(qa,0,qa.length-1);
  assert.equal(str(qa),str([...keys].sort()));
  choice('T04 Q5','output of the first partition',parts[0].out);
  fill('T04 Q5','calls partition',parts.length);
  for(const [label,out] of find('T04 Q5','whole array after').pairs){
    const [lo,hi]=label.match(/\d+/g).map(Number),part=parts.find(x=>x.lo===lo&&x.hi===hi);
    assert.equal(label,`a[${lo}..${hi}], pivot ${part.pivot}`);assert.equal(out,part.out);
  }
  assert.equal(parts.find(x=>x.lo===3&&x.hi===11).p,11);

  // Tutorial 5: 6-Queens, rod cutting and meeting scheduling.
  const safeCol=(cols,c)=>cols.every((qc,qr)=>qc!==c&&Math.abs(qc-c)!==cols.length-qr);
  const solutions=[];const solve=cols=>{if(cols.length===6){solutions.push([...cols]);return;}for(let c=0;c<6;c++)if(safeCol(cols,c))solve([...cols,c]);};solve([]);
  fill('T05 Q1','distinct solutions',solutions.length);
  choice('T05 Q1','Which solution does it find first',`[${solutions[0].join(', ')}]`);
  assert.ok(solutions.every(s=>s[0]!==0));
  assert.ok(solutions.some(s=>s.join()===[1,3,5,0,2,4].map(c=>5-c).join()));
  assert.equal([0,1,2,3,4,5].filter(c=>!safeCol([0,2,4,1,3],c)).length,6);
  const nextAfter=(cols,from)=>{for(let c=from;c<6;c++)if(safeCol(cols,c))return c;return null;};
  assert.equal(nextAfter([0,2,4,1],4),null);assert.equal(nextAfter([0,2,4],2),null);
  fill('T05 Q1','row 2, column',nextAfter([0,2],5));
  fill('T05 Q1','safe columns are left',[0,1,2,3,4,5].filter(c=>safeCol([1,3],c)).length);
  assert.equal([0,1,2,3,4,5].filter(c=>safeCol([0,2,5,1],c)).length,0);
  const price=[0,1,5,8,9,10];let calls=0;const callsTo=new Array(6).fill(0);
  const rc=n=>{calls++;callsTo[n]++;if(n===0)return 0;let max=0;for(let i=1;i<=n;i++)max=Math.max(max,price[i]+rc(n-i));return max;};
  const r5=rc(5);
  fill('T05 Q2','calls in total',calls);fill('T05 Q2','rc(2) is solved',callsTo[2]);
  const memo=[0,-1,-1,-1,-1,-1];let tries=0;
  const rm=n=>{if(memo[n]<0){for(let i=1;i<=n;i++)memo[n]=Math.max(memo[n],price[i]+rm(n-i));tries++;}return memo[n];};
  assert.equal(rm(5),r5);fill('T05 Q2','prints _____ lines',tries);
  choice('T05 Q2','optimal revenue for a 5 m rod',`${r5}: pieces 2 and 3`);
  for(const [,text] of find('T05 Q2','candidate revenue').pairs){const [,p,rest,total]=text.match(/(\d+) \+ r(.) = (\d+)/);assert.equal(Number(p)+memo['₀₁₂₃₄'.indexOf(rest)],Number(total));}
  const schedule=(st,et)=>{const order=st.map((_,i)=>i).sort((a,b)=>et[a]-et[b]||a-b),out=[];let end=-Infinity;for(const i of order)if(st[i]>=end){out.push(i);end=et[i];}return out;};
  assert.deepEqual(schedule([1,2,4,3,7,3],[3,4,6,8,8,4]),[0,5,2,4]);
  fill('T05 Q3','start_times = [1,3,0,5,8,5]',schedule([1,3,0,5,8,5],[2,4,6,7,9,9]).join(','));
  const best0=(st,et)=>Math.max(...Array.from({length:2**st.length},(_,mask)=>{const pick=st.map((_,i)=>i).filter(i=>mask>>i&1).sort((a,b)=>st[a]-st[b]);return pick.every((i,k)=>k===0||st[i]>=et[pick[k-1]])?pick.length:0;}));
  const byRule=(st,et,key)=>{const order=st.map((_,i)=>i).sort((a,b)=>key(a)-key(b)),out=[];for(const i of order)if(out.every(j=>st[i]>=et[j]||et[i]<=st[j]))out.push(i);return out.length;};
  const parse=s=>[...s.matchAll(/\((\d+),(\d+)\)/g)].map(m=>[Number(m[1]),Number(m[2])]);
  for(const [text,rule] of [['earliest start time first',(st)=>i=>st[i]],['shortest meeting first',(st,et)=>i=>et[i]-st[i]]]){
    const q=find('T05 Q3',text);
    q.options.forEach((option,index)=>{const m=parse(option),st=m.map(x=>x[0]),et=m.map(x=>x[1]);
      assert.equal(byRule(st,et,rule(st,et))<best0(st,et),index===q.correct,`${text}: ${option}`);});
  }
});
