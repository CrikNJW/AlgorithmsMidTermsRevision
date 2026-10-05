# Algorithm Lab

A static CSD3130 Test 1 revision website, based on the local Lecture 0–5 PDFs.

- 240 original questions: **two sets of 20 per lecture**, with MCQ, fill-in and matching formats.
- Choose **Set 1** (the original questions), **Set 2** (the new questions), or **Both sets**. For a complete lecture set, select one lecture, the desired set, and 20 questions. Each set has fixed membership; presentation order is randomized.
- Guided practice: optional hints and explanations after each answer.
- Timed practice: 25 balanced, random questions and 60 minutes. Hints and slides are available; answer explanations appear at the end.
- One question per page, with Back and Next navigation. Answers remain editable until you finish; the latest answers determine the score. Partially completed answers are saved per question.
- Results include every explanation, lecture page references, per-lecture scores and missed-question practice.
- “Need a hint?” and “Show relevant slides” buttons appear together in both modes. The slide viewer displays the original referenced PDF pages with page navigation, zoom, full-size links and extracted text.
- Browser-local session recovery. Mock time keeps running when the tab is hidden or closed.
- No account, backend, API key, tracking or paid service. Google Fonts is optional; system fonts are the fallback.

## Run locally

Node.js 18 or newer; no package installation required:

```sh
npm start
```

Open http://127.0.0.1:4173. Run `npm test` for question-bank integrity, grading, sampling, deadline and worked-example checks.

## GitHub Pages

Publish the **`docs` directory on `main`** using GitHub Settings → Pages → Deploy from a branch. The entry page and all asset URLs are relative, so the repository subpath is supported. `.nojekyll` keeps these files static.

Expected URL: https://criknjw.github.io/AlgorithmsMidTermsRevision/

The site publishes WebP images and extracted text of the 197 referenced lecture pages. Original lecture PDFs remain local. The question’s PDF-page references determine the viewer’s slide list, including cross-lecture references. Lecture 0 questions apply the objectives on its page 2, so that slide outlines concepts rather than solving every generated example.

To regenerate slide assets after changing page references, run `python scripts/build-slides.py` from the repository root with Node, Poppler (`pdftoppm`), Pillow and pypdf available. This creates `docs/slides/` and `docs/slides-manifest.js`; only requested pages are rendered, and images load when the viewer is opened.

## Question conventions

The bank lives in `docs/questions.js`. Every question includes its lecture, set number, topic, difficulty, hint, explanation, answer key and PDF page reference. MCQ options and matching targets are shuffled without changing their answer identities. Fill-in grading ignores case and surrounding whitespace and accepts equivalent numeric decimals/fractions. It does not evaluate arbitrary expressions. Matching earns one point only if every pair is right; skipped questions earn zero. This is a practice rubric, not a claim about the real test's marking scheme.

Lecture 0 is a six-page orientation deck. Its 40 questions apply the learning objectives on page 2 and are explicitly labeled as applications, rather than pretending there are 40 distinct technical facts in that deck. Mock sessions are evenly distributed over the selected lectures; the official test's lecture weighting and question-type ratio are unknown.

The real test is forward-only and closed-book; this revision site deliberately permits navigation, hints and slides. The site is not an official exam or an Examena integration. Its client-side answer bank is available to anyone inspecting the source, so it is intended for self-study rather than secure assessment.

## Source clarifications

- L01 p.31: Θ means a tight asymptotic bound, not average case. Formal definitions in L02 pp.25–27 and [MIT's Big Oh and Theta lecture](https://ocw.mit.edu/courses/6-100l-introduction-to-cs-and-programming-using-python-fall-2022/resources/6100l-lecture-22-version-2_mp4/) support the distinction.
- L03 pp.55–64: questions use the basic three-case Master theorem in the slides; extended versions may handle more recurrences.
- L04 pp.5–6: do not generalize the swap remark into “an arbitrary item is swapped at most once.” The questions use the unambiguous comparison count and the actual first-pass behavior.
- L05 p.48: the shown 33-minute expression omits the 5-minute job. All nine jobs sum to 102, and three loads of 34 are feasible, proving an optimum of 34.
- Exam date: 6 October **2026**, 14:30–15:30 SGT, arrival 14:15, per the user's announcement. The isolated “25” year is treated as a typo. No venue allocation file was supplied.
