// Optional browser verification: install Playwright or set PLAYWRIGHT_MODULE to an existing installation.
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { questions } from '../docs/questions.js';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL || 'msedge'});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const url=process.env.TEST_URL || 'http://127.0.0.1:4173';
const key='algorithm-lab-session-v1';
const state=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
const overflow=()=>page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
await mkdir('tmp',{recursive:true});
async function respond(q,right=true){
  if(q.type==='mcq')await page.locator(`input[value="${right?q.correct:(q.correct+1)%q.options.length}"]`).check();
  else if(q.type==='fib')await page.locator('#fill-answer').fill(right?q.answers[0]:'incorrect');
  else for(let i=0;i<q.pairs.length;i++)await page.locator(`#match-${i}`).selectOption(String(right?i:(i+1)%q.pairs.length));
}
try{
  await page.goto(url);
  await page.locator('#start').waitFor();
  assert.equal(await page.locator('[name=lecture]').count(),6);
  await page.screenshot({path:'tmp/home-desktop.png',fullPage:true});
  await page.locator('#toggle-all').click();assert.ok(await page.locator('#start').isDisabled());
  await page.locator('[data-mode=mock]').click();
  await page.locator('[name=lecture][value="3"]').check();assert.ok(await page.locator('#start').isDisabled());
  await page.locator('#toggle-all').click();assert.ok(await page.locator('#start').isEnabled());
  await page.locator('[data-mode=practice]').click();await page.locator('#question-count').selectOption('all');
  await page.setViewportSize({width:390,height:844});assert.equal(await overflow(),false);
  await page.screenshot({path:'tmp/home-mobile.png',fullPage:true});
  await page.locator('#start').click();
  const initial=await state();assert.equal(initial.ids.length,120);
  const captured=new Set();
  for(let i=0;i<120;i++){
    const s=await state(),q=questions.find(q=>q.id===s.ids[s.index]);
    assert.equal(s.index,i);assert.equal(await page.locator('#feedback').count(),0);
    assert.ok(await page.locator('#submit').isDisabled());
    const right=i%2===0;
    if(i===0){await page.locator('#hint').click();assert.ok(await page.locator('#hint-text').isVisible());}
    await respond(q,right);
    if(!captured.has(q.type)){
      assert.equal(await overflow(),false,`mobile overflow: ${q.type}`);
      await page.screenshot({path:`tmp/quiz-${q.type}-mobile.png`,fullPage:true});
      captured.add(q.type);
    }
    if(i===1){
      const before=await state();await page.reload();await page.locator('#submit').waitFor();
      const after=await state();assert.deepEqual(before.order,after.order);assert.deepEqual(before.draft,after.draft);assert.equal(before.index,after.index);
    }
    await page.locator('#submit').click();
    const after=await state();assert.equal(after.answers[q.id].correct,right,q.id);
    assert.notEqual(await page.locator('fieldset').getAttribute('disabled'),null);
    assert.ok((await page.locator('#feedback').innerText()).includes(q.explanation));
    if(i===1){await page.reload();assert.notEqual(await page.locator('fieldset').getAttribute('disabled'),null);assert.equal((await state()).index,1);}
    await page.locator('#next').click();
  }
  assert.ok((await page.locator('.score-card').innerText()).includes('60 / 120 correct'));
  assert.equal(await page.locator('.review-item').count(),120);
  await page.locator('#only-missed').check();assert.equal(await page.locator('.review-item').count(),60);
  await page.locator('.review-item summary').first().click();assert.equal(await overflow(),false);
  await page.screenshot({path:'tmp/results-mobile.png',fullPage:true});
  await page.locator('#retry').click();assert.equal((await state()).ids.length,60);assert.equal((await state()).mode,'practice');
  await page.locator('#skip').click();await page.locator('#cancel').click();assert.equal((await state()).index,0);
  await page.locator('#skip').click();await page.locator('#confirm').click();assert.ok((await state()).answers[(await state()).ids[0]].skipped);
  await page.locator('#next').click();await page.locator('#end').click();await page.locator('#confirm').click();
  assert.ok((await state()).finished);await page.locator('#new-session').click();
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('[data-mode=mock]').click();await page.locator('#start').click();
  const mock=await state();assert.equal(mock.ids.length,25);assert.equal(mock.deadline-mock.start,3600000);
  for(let i=0;i<25;i++){
    const s=await state(),q=questions.find(q=>q.id===s.ids[s.index]);
    assert.equal(await page.locator('#hint').count(),0);assert.equal(await page.locator('#feedback').count(),0);
    await respond(q,true);
    if(i===0){await page.screenshot({path:'tmp/mock-desktop.png',fullPage:true});await page.reload();assert.equal((await state()).deadline,mock.deadline);}
    await page.locator('#submit').click();
  }
  assert.ok((await page.locator('.score-card').innerText()).includes('25 / 25 correct'));
  await page.screenshot({path:'tmp/results-desktop.png',fullPage:true});
  await page.locator('#new-session').click();await page.locator('[data-mode=mock]').click();await page.locator('#start').click();
  // Simulate returning after the one-hour deadline; recovery must submit, not reset the timer.
  await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.deadline=Date.now()-1000;localStorage.setItem(k,JSON.stringify(s));},key);
  await page.reload();assert.ok((await state()).timedOut);assert.ok((await state()).finished);
  await page.locator('#new-session').click();await page.locator('[data-mode=mock]').click();await page.locator('#start').click();
  await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.deadline=Date.now()+3000;localStorage.setItem(k,JSON.stringify(s));},key);
  await page.reload();
  const exp=await state(),q=questions.find(q=>q.id===exp.ids[0]);await respond(q,true);
  await page.locator('#end').click(); // Timeout must also work while a confirmation dialog is open.
  await page.getByRole('heading',{name:'Time’s up. Let’s review.'}).waitFor({timeout:7000});
  assert.ok((await state()).timedOut);assert.equal(await page.locator('dialog').count(),0);
  assert.ok((await state()).answers[q.id].correct);
  await page.locator('#new-session').click();
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');assert.equal(await overflow(),false);
  assert.deepEqual(errors,[]);
  console.log('PASS: all 120 guided questions; all formats; right/wrong feedback; hints; reload and lock; scoring; missed retry; skip confirmation; 25-question mock; automatic and restored timeout; mobile layout; no JS errors.');
  // Storage refusal must leave the site usable with a visible recovery limitation.
  const isolated=await browser.newContext();const blocked=await isolated.newPage();
  await blocked.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Blocked','SecurityError');};});
  await blocked.goto(url);await blocked.locator('#start').click();assert.ok(await blocked.locator('#storage-warning').isVisible());
  console.log('PASS: blocked localStorage gracefully falls back to an in-memory session.');
  await isolated.close();
}finally{await browser.close();}
