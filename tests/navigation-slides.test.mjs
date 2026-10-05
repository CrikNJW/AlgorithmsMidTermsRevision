import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { questions } from '../docs/questions.js';
import { getSlideRefs } from '../docs/slide-refs.js';
import { slideManifest } from '../docs/slides-manifest.js';
import { createSession, upgradeSession, currentAnswer, recordAnswer, validSession } from '../docs/engine.js';

test('all 240 questions resolve to actual rendered lecture pages, including cross-lecture sources',()=>{
  const pageCounts=[6,34,38,65,88,66],seen=new Set();
  for(const q of questions){
    const refs=getSlideRefs(q);assert.ok(refs.length,q.id);
    for(const ref of refs){
      assert.ok(ref.page>=1&&ref.page<=pageCounts[ref.lecture],`${q.id}: ${ref.id}`);
      assert.ok(slideManifest[ref.id]?.width>0,ref.id);
      assert.ok(slideManifest[ref.id]?.height>0,ref.id);
      if(!seen.has(ref.id)){
        const data=readFileSync(new URL('../docs/'+ref.src,import.meta.url));
        assert.equal(data.subarray(0,4).toString(),'RIFF');
        assert.equal(data.subarray(8,12).toString(),'WEBP');
        seen.add(ref.id);
      }
    }
  }
  assert.equal(seen.size,197);
  assert.equal(Object.keys(slideManifest).length,197);
  assert.deepEqual(getSlideRefs(questions.find(q=>q.id==='L1-17')).map(r=>[r.lecture,r.page]),[[1,28],[1,29],[1,30],[1,31],[2,25],[2,26],[2,27]]);
});

test('revising an earlier answer changes its score and preserves other question drafts',()=>{
  const mcq=questions.find(q=>q.type==='mcq'),match=questions.find(q=>q.type==='match');
  const s=createSession([mcq,match],'practice');
  recordAnswer(s,mcq,mcq.correct);assert.ok(s.answers[mcq.id].correct);
  s.index=1;recordAnswer(s,match,[0,null,null,null]);
  s.index=0;recordAnswer(s,mcq,(mcq.correct+1)%4);
  assert.equal(s.answers[mcq.id].correct,false);
  assert.deepEqual(currentAnswer(s,match.id),[0,null,null,null]);
  assert.ok(s.answers[match.id].skipped);
  recordAnswer(s,match,match.pairs.map((_,i)=>i));assert.ok(s.answers[match.id].correct);
  s.index=1;delete s.answers[mcq.id];s.drafts[mcq.id]=mcq.correct;
  assert.ok(validSession(s,questions),'editing an earlier question must not invalidate the save');
});

test('legacy active saves migrate their current draft without changing prior answers or deadlines',()=>{
  const bank=questions.slice(0,3),s=createSession(bank,'mock',1000);
  delete s.drafts;s.index=1;s.draft=2;
  s.answers[bank[0].id]={value:bank[0].correct,correct:true,skipped:false};
  const deadline=s.deadline;upgradeSession(s);
  assert.equal(currentAnswer(s,bank[1].id),2);
  assert.equal(currentAnswer(s,bank[0].id),bank[0].correct);
  assert.equal(s.deadline,deadline);assert.equal(s.draft,null);
  assert.ok(validSession(s,questions));
});
