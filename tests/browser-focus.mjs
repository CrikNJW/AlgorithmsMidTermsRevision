import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { questions } from '../docs/questions.js';
import { createSession } from '../docs/engine.js';
const { chromium }=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const url=process.env.TEST_URL||'http://127.0.0.1:4173';
const key='algorithm-lab-session-v1',errors=[];
const state=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
const arithmetic=s=>s.ids.filter(id=>questions.find(q=>q.id===id).focus==='arithmetic').length;
page.on('pageerror',e=>errors.push(e.message));
await mkdir('tmp',{recursive:true});
async function finish(){await page.locator('#end').click();await page.locator('#confirm').click();await page.locator('#new-session').click();}
try{
  await page.goto(url);await page.locator('#arithmetic-percent').waitFor();
  assert.equal(await page.locator('#arithmetic-percent').inputValue(),'50');
  for(const [preset,percent,expected] of [['arithmetic',75,15],['balanced',50,10],['conceptual',25,5]]){
    await page.locator(`[data-focus=${preset}]`).click();
    assert.equal(await page.locator('#arithmetic-percent').inputValue(),String(percent));
    assert.equal(await page.locator(`[data-focus=${preset}]`).getAttribute('aria-pressed'),'true');
    assert.ok((await page.locator('#actual-mix').innerText()).includes(`${expected} arithmetic`));
    await page.locator('#start').click();assert.equal(arithmetic(await state()),expected);
    assert.equal((await state()).arithmeticPercent,percent);
    await finish();
  }
  for(const percent of [0,33,100]){
    await page.locator('#arithmetic-percent').fill(String(percent));
    assert.ok((await page.locator('#focus-ratio').innerText()).startsWith(`${percent}% arithmetic`));
    assert.equal(await page.locator('[data-focus][aria-pressed=true]').count(),0);
    const expected=Math.round(20*percent/100);
    assert.ok((await page.locator('#actual-mix').innerText()).includes(`${expected} arithmetic`));
    await page.locator('#start').click();assert.equal(arithmetic(await state()),expected);
    const before=await state();await page.reload();await page.locator('#next').waitFor();
    assert.deepEqual((await state()).ids,before.ids);assert.equal((await state()).arithmeticPercent,percent);
    await finish();assert.equal(await page.locator('#arithmetic-percent').inputValue(),String(percent));
  }
  // The range is keyboard-accessible, and a custom percentage survives mode/set changes.
  await page.locator('#arithmetic-percent').fill('33');await page.locator('#arithmetic-percent').focus();
  await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#arithmetic-percent').inputValue(),'34');
  await page.locator('[data-mode=mock]').click();
  assert.equal(await page.locator('#arithmetic-percent').inputValue(),'34');
  assert.ok((await page.locator('#actual-mix').innerText()).includes('9 arithmetic'));
  await page.locator('#start').click();const timed=await state();
  assert.equal(timed.ids.length,25);assert.equal(arithmetic(timed),9);assert.equal(timed.deadline-timed.start,3600000);
  await finish();await page.locator('[data-mode=practice]').click();
  await page.locator('#question-set').selectOption('4');await page.locator('[data-focus=arithmetic]').click();
  assert.ok((await page.locator('#focus-availability').innerText()).includes('Closest available'));
  assert.ok((await page.locator('#actual-mix').innerText()).includes('0 arithmetic · 20 conceptual'));
  await page.locator('#start').click();assert.ok((await state()).ids.every(id=>questions.find(q=>q.id===id).set===4));await finish();
  await page.locator('#question-set').selectOption('all');await page.locator('#toggle-all').click();
  await page.locator('[name=lecture][value="0"]').check();await page.locator('#arithmetic-percent').fill('100');
  assert.ok((await page.locator('#actual-mix').innerText()).includes('9 arithmetic · 11 conceptual'));
  await page.locator('#start').click();assert.equal(arithmetic(await state()),9);await finish();
  await page.locator('#toggle-all').click();await page.locator('#question-count').selectOption('all');
  assert.ok((await page.locator('#focus-availability').innerText()).includes('entire pool'));
  assert.ok((await page.locator('#actual-mix').innerText()).includes('164 arithmetic · 296 conceptual'));
  await page.locator('#question-count').selectOption('20');await page.locator('#arithmetic-percent').fill('33');
  await page.locator('#focus-heading').scrollIntoViewIfNeeded();
  await page.screenshot({path:'tmp/focus-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:'tmp/focus-mobile.png',fullPage:true});
  // A legacy active save without the new percentage field still resumes unchanged.
  const legacy=createSession(questions.filter(q=>q.set===1).slice(0,3),'practice');
  delete legacy.arithmeticPercent;
  await page.evaluate(({key,legacy})=>localStorage.setItem(key,JSON.stringify(legacy)),{key,legacy});
  await page.reload();await page.locator('#next').waitFor();assert.deepEqual((await state()).ids,legacy.ids);
  assert.deepEqual(errors,[]);
  console.log('PASS: focus presets, slider 0/33/100, keyboard adjustment, preview/actual counts, timed rounding, shortages, all-selected, reload, legacy saves and mobile layout.');
}finally{await browser.close();}
