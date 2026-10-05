import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { questions } from '../docs/questions.js';
import { createSession } from '../docs/engine.js';
const { chromium }=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const url=process.env.TEST_URL||'http://127.0.0.1:4173';
const key='algorithm-lab-session-v1',errors=[];
page.on('pageerror',e=>errors.push(e.message));
const state=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
async function seed(ids,mode='practice'){
  await page.goto(url);
  await page.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key,s:createSession(ids.map(id=>questions.find(q=>q.id===id)),mode)});
  await page.reload();await page.locator('#next').waitFor();
}
try{
  await seed(['L3-05','L3-11','L1-17']);
  const q=questions.find(q=>q.id==='L3-05');
  await page.locator(`input[value="${q.correct}"]`).check();await page.locator('#submit').click();
  assert.ok(await page.locator('input').first().isEnabled());
  await page.locator('#next').click();await page.locator('#fill-answer').fill('120');
  await page.locator('#previous').click();assert.ok(await page.locator(`input[value="${q.correct}"]`).isChecked());
  await page.locator(`input[value="${(q.correct+1)%4}"]`).check();assert.equal(await page.locator('#feedback').count(),0);
  await page.locator('#next').click();assert.equal(await page.locator('#fill-answer').inputValue(),'120');
  await page.locator('#next').click();await page.locator('#match-0').selectOption('0');
  await page.locator('#previous').click();await page.reload();await page.locator('#next').click();
  assert.equal(await page.locator('#match-0').inputValue(),'0');assert.equal(await page.locator('#match-1').inputValue(),'');
  // This source spans Lecture 1 and Lecture 2; the last slide must use the latter.
  await page.locator('#show-slides').click();
  await page.locator('#slide-image').waitFor({state:'visible'});
  assert.ok((await page.locator('#slide-caption').innerText()).includes('Lecture 01'));
  assert.equal(await page.locator('#slide-count').innerText(),'1 of 7');
  assert.ok(await page.locator('#previous-slide').isDisabled());
  for(let i=0;i<6;i++)await page.locator('#next-slide').click();
  await page.locator('#slide-image').waitFor({state:'visible'});
  assert.ok((await page.locator('#slide-caption').innerText()).includes('Lecture 02'));
  assert.ok((await page.locator('#slide-image').getAttribute('src')).includes('l2/p027.webp'));
  assert.ok(await page.locator('#next-slide').isDisabled());
  await page.screenshot({path:'tmp/slides-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:'tmp/slides-mobile.png',fullPage:true});
  await page.locator('#slide-zoom').click();assert.equal(await page.locator('#slide-zoom').getAttribute('aria-pressed'),'true');
  assert.ok(await page.locator('.slide-frame').evaluate(el=>el.scrollWidth>el.clientWidth));
  await page.locator('#slide-zoom').click();await page.keyboard.press('Escape');
  await page.locator('dialog').waitFor({state:'detached'});
  assert.equal(await page.locator('dialog').count(),0);
  assert.equal(await page.locator('#match-0').inputValue(),'0');
  await page.locator('#hint').click();assert.ok(await page.locator('#hint-text').isVisible());
  await page.screenshot({path:'tmp/help-buttons-mobile.png',fullPage:true});
  await page.locator('#hint').click();assert.ok(await page.locator('#hint-text').isHidden());
  await page.locator('#match-1').selectOption('1');await page.locator('#match-2').selectOption('2');
  await page.locator('#next').click();await page.locator('#cancel').click();assert.equal((await state()).finished,false);
  await page.locator('#previous').click();await page.locator('#previous').click();
  await page.locator(`input[value="${q.correct}"]`).check();
  await page.locator('#end').click();await page.locator('#confirm').click();
  assert.ok((await page.locator('.score-card').innerText()).includes('3 / 3 correct'));
  // The same navigation and aid buttons remain available in timed sessions.
  await seed(['L3-05','L3-11'],'mock');const deadline=(await state()).deadline;
  await page.locator('input[value="2"]').check();await page.locator('#next').click();
  await page.locator('#previous').click();assert.ok(await page.locator('input[value="2"]').isChecked());
  await page.locator('#hint').click();await page.locator('#show-slides').click();
  assert.equal((await state()).deadline,deadline);assert.equal(await page.locator('#feedback').count(),0);
  await page.locator('#close-slides').click();
  // A failed slide request shows a retry instead of a blank viewer.
  await page.route('**/slides/l3/p055.webp',r=>r.abort());
  await page.locator('#show-slides').click();await page.locator('#slide-error').waitFor({state:'visible'});
  await page.unroute('**/slides/l3/p055.webp');await page.locator('#retry-slide').click();
  await page.locator('#slide-image').waitFor({state:'visible'});
  assert.ok(await page.locator('#slide-error').isHidden());
  await page.locator('#close-slides').click();
  await seed(['L0-01']);await page.locator('#show-slides').click();
  await page.locator('#slide-image').waitFor({state:'visible'});
  assert.equal(await page.locator('#slide-count').innerText(),'1 of 1');
  assert.ok(await page.locator('#previous-slide').isDisabled());assert.ok(await page.locator('#next-slide').isDisabled());
  // Set 3 retains its tutorial source and loads the relevant lecture concepts too.
  await page.locator('#close-slides').click();
  const tutorialQuestion=questions.find(q=>q.id==='L4-56');
  assert.ok(tutorialQuestion);
  await seed([tutorialQuestion.id]);await page.locator('#show-slides').click();
  await page.locator('#next-slide').click();await page.locator('#next-slide').click();
  await page.locator('#slide-image').waitFor({state:'visible'});
  assert.ok((await page.locator('#slide-caption').innerText()).includes('Lecture 04'));
  assert.ok((await page.locator('#slide-image').getAttribute('src')).includes('l4/p036.webp'));
  assert.deepEqual(errors,[]);
  console.log('PASS: back/next, answer revisions, partial matching recovery, final rescoring, timed navigation, all aid buttons, multi-lecture slides, image loading, zoom, mobile layout, Escape and load-error retry.');
}finally{await browser.close();}
