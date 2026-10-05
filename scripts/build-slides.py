"""Render the referenced pages of local lecture PDFs for the static slide viewer.
Requires Node, Poppler's pdftoppm, pypdf and Pillow. Original PDFs are unchanged.
Run from the repository root: python scripts/build-slides.py
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json
import subprocess
from pypdf import PdfReader
from PIL import Image

root = Path(__file__).resolve().parent.parent
inputs = json.loads(subprocess.check_output(['node', str(root / 'scripts/slide-inputs.mjs')], cwd=root, text=True, encoding='utf-8'))
readers = {lecture['id']: PdfReader(root / lecture['file']) for lecture in inputs['lectures']}
manifest = {}
for slide in inputs['slides']:
    page = readers[slide['lecture']].pages[slide['page'] - 1]
    manifest[slide['id']] = {'text': (page.extract_text() or '').strip()}

def render(slide):
    lecture = inputs['lectures'][slide['lecture']]
    output = root / 'docs' / slide['src'].removeprefix('./')
    output.parent.mkdir(parents=True, exist_ok=True)
    scratch = root / 'tmp/slides-render'
    scratch.mkdir(parents=True, exist_ok=True)
    prefix = scratch / slide['id']
    subprocess.run(['pdftoppm', '-f', str(slide['page']), '-l', str(slide['page']),
                    '-scale-to', '2000', '-png', '-singlefile', str(root / lecture['file']), str(prefix)],
                   check=True, capture_output=True)
    with Image.open(str(prefix) + '.png') as image:
        image.convert('RGB').save(output, 'WEBP', quality=88, method=6)
        result = slide['id'], image.width, image.height, output.stat().st_size
    Path(str(prefix) + '.png').unlink()
    return result

with ThreadPoolExecutor(max_workers=4) as pool:
    total = 0
    for i, (key, width, height, size) in enumerate(pool.map(render, inputs['slides']), 1):
        manifest[key].update(width=width, height=height)
        total += size
        if i % 40 == 0:
            print(f'Rendered {i}/{len(inputs["slides"])} pages', flush=True)
(root / 'docs/slides-manifest.js').write_text('export const slideManifest = ' + json.dumps(manifest, ensure_ascii=False) + ';\n', encoding='utf-8')
print(f'Rendered {len(manifest)} referenced pages, {total / 1024 / 1024:.1f} MB of WebP images.', flush=True)
