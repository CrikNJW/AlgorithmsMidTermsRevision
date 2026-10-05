# Algorithm Lab

A static CSD3130 Test 1 revision website, based on the local Lecture 0–5 PDFs.

- 240 original questions: **two sets of 20 per lecture**, with MCQ, fill-in and matching formats.
- Choose **Set 1** (the original questions), **Set 2** (the new questions), or **Both sets**. For a complete lecture set, select one lecture, the desired set, and 20 questions. Each set has fixed membership; presentation order is randomized.
- Guided practice: optional hints and explanations after each answer.
- Exam rehearsal: 25 balanced, random questions, 60 minutes, no hints or answers until the end.
- One question per page, locked submissions and no backward navigation within a session.
- Results include every explanation, lecture page references, per-lecture scores and missed-question practice.
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

Only the website and development files are committed. The lecture PDFs and extracted text are not published with the site. Reference the PDFs locally by the filenames in `docs/questions.js`.

## Question conventions

The bank lives in `docs/questions.js`. Every question includes its lecture, set number, topic, difficulty, hint, explanation, answer key and PDF page reference. MCQ options and matching targets are shuffled without changing their answer identities. Fill-in grading ignores case and surrounding whitespace and accepts equivalent numeric decimals/fractions. It does not evaluate arbitrary expressions. Matching earns one point only if every pair is right; skipped questions earn zero. This is a practice rubric, not a claim about the real test's marking scheme.

Lecture 0 is a six-page orientation deck. Its 40 questions apply the learning objectives on page 2 and are explicitly labeled as applications, rather than pretending there are 40 distinct technical facts in that deck. Mock sessions are evenly distributed over the selected lectures; the official test's lecture weighting and question-type ratio are unknown.

The site is not an official exam or an Examena integration. Its client-side answer bank is available to anyone inspecting the source, so it is intended for self-study rather than secure assessment.

## Source clarifications

- L01 p.31: Θ means a tight asymptotic bound, not average case. Formal definitions in L02 pp.25–27 and [MIT's Big Oh and Theta lecture](https://ocw.mit.edu/courses/6-100l-introduction-to-cs-and-programming-using-python-fall-2022/resources/6100l-lecture-22-version-2_mp4/) support the distinction.
- L03 pp.55–64: questions use the basic three-case Master theorem in the slides; extended versions may handle more recurrences.
- L04 pp.5–6: do not generalize the swap remark into “an arbitrary item is swapped at most once.” The questions use the unambiguous comparison count and the actual first-pass behavior.
- L05 p.48: the shown 33-minute expression omits the 5-minute job. All nine jobs sum to 102, and three loads of 34 are feasible, proving an optimum of 34.
- Exam date: 6 October **2026**, 14:30–15:30 SGT, arrival 14:15, per the user's announcement. The isolated “25” year is treated as a typo. No venue allocation file was supplied.
