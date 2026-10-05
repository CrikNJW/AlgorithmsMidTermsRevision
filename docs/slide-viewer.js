import { lectures } from './questions.js?v=2026-10-05.3';
import { getSlideRefs } from './slide-refs.js?v=2026-10-05.3';
import { slideManifest } from './slides-manifest.js?v=2026-10-05.3';

export function showSlides(question) {
  const refs = getSlideRefs(question);
  let index = 0;
  const dialog = document.createElement('dialog');
  dialog.className = 'slide-dialog';
  dialog.setAttribute('aria-labelledby', 'slide-heading');
  dialog.innerHTML = `<div class="slide-heading-row"><div><h2 id="slide-heading">Relevant lecture slides</h2><p id="slide-caption" aria-live="polite"></p></div><button type="button" class="secondary" id="close-slides" autofocus>Close slides</button></div>
    <p class="slide-context"></p><div class="slide-toolbar"><button type="button" class="secondary" id="previous-slide">Previous slide</button><span id="slide-count"></span><button type="button" class="secondary" id="next-slide">Next slide</button></div>
    <div class="slide-frame" aria-busy="true"><p id="slide-loading" role="status">Loading slide…</p><img id="slide-image"><p id="slide-error" role="alert" hidden>Unable to load this slide. <button type="button" class="text-button" id="retry-slide">Try again</button></p></div>
    <div class="slide-size-controls"><button type="button" class="secondary" id="slide-zoom" aria-pressed="false">Zoom in</button><a id="slide-full-size" target="_blank" rel="noopener">Open full-size slide in a new tab</a></div><p id="slide-pan-help" hidden>Scroll the enlarged slide horizontally and vertically to read it.</p><details class="slide-transcript"><summary>Extracted slide text</summary><p>Text extraction may omit diagram labels or alter mathematical layout. Refer to the image for the original formatting.</p><pre id="slide-text"></pre></details>`;
  document.body.append(dialog);
  const find = selector => dialog.querySelector(selector);
  find('.slide-context').textContent = question.lecture === 0
    ? 'This question applies Lecture 0’s learning objectives. The introductory slide outlines the concepts rather than working through this specific example.'
    : 'Original PDF pages referenced by this question. Use the arrows to browse multiple slides.';
  function render() {
    const ref = refs[index], meta = slideManifest[ref.id], img = find('#slide-image');
    find('#slide-caption').textContent = `Lecture ${String(ref.lecture).padStart(2, '0')} · ${lectures[ref.lecture].title} · PDF page ${ref.page}`;
    find('#slide-count').textContent = `${index + 1} of ${refs.length}`;
    find('#previous-slide').disabled = index === 0;
    find('#next-slide').disabled = index === refs.length - 1;
    find('#slide-full-size').href = ref.src;
    find('#slide-text').textContent = meta.text || 'No extractable text on this page. Refer to the slide image.';
    find('#slide-loading').hidden = false;
    find('#slide-error').hidden = true;
    find('.slide-frame').setAttribute('aria-busy', 'true');
    img.hidden = true;
    img.alt = `Lecture ${ref.lecture}, ${lectures[ref.lecture].title}, PDF page ${ref.page}. An extracted text transcript is available below.`;
    img.width = meta.width; img.height = meta.height;
    img.onload = () => { img.hidden = false; find('#slide-loading').hidden = true; find('.slide-frame').setAttribute('aria-busy', 'false'); };
    img.onerror = () => { find('#slide-loading').hidden = true; find('#slide-error').hidden = false; find('.slide-frame').setAttribute('aria-busy', 'false'); };
    img.src = ref.src;
  }
  find('#previous-slide').onclick = () => { if (index > 0) { index--; render(); } };
  find('#next-slide').onclick = () => { if (index < refs.length - 1) { index++; render(); } };
  find('#retry-slide').onclick = render;
  find('#slide-zoom').onclick = () => {
    const zoomed = find('.slide-frame').classList.toggle('zoomed');
    find('#slide-zoom').textContent = zoomed ? 'Fit slide' : 'Zoom in';
    find('#slide-zoom').setAttribute('aria-pressed', String(zoomed));
    find('#slide-pan-help').hidden = !zoomed;
  };
  find('#close-slides').onclick = () => dialog.close();
  dialog.onclose = () => dialog.remove();
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' && index > 0) { event.preventDefault(); index--; render(); }
    if (event.key === 'ArrowRight' && index < refs.length - 1) { event.preventDefault(); index++; render(); }
  });
  dialog.showModal(); render();
}
