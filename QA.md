# Verification — 12 October 2026

Verified with the bundled Node.js v24 runtime and the Codex browser on this machine. Browser tests used synthetic records; all preview databases were reset afterward. No real user health logs were entered.

## Automated checks

**14 tests passed, 0 failures.**

- Asia/Kolkata midnight boundary, local timestamp conversion, day arithmetic, leap years.
- Default editable aspirations and truly empty log collections.
- Calorie/protein/fiber aggregation, including missing fiber, edits, and deletions.
- Water totals across dates and removal of the last entry.
- Consistency based on logs: zero steps and sugar awareness count; calories and fasting duration do not affect the score.
- Seven- and 30-day summaries, averages only over logged days, strength sessions, movement, sleep, and fasting days.
- Weight changes against a correctly dated baseline, with unknown states when no baseline exists.
- Serialized timer timestamps preserve elapsed duration.
- JSON round trip preserves photo attachments, favorites, optional values, and notes.
- Invalid numbers/dates, duplicate IDs, unsafe image strings/IDs, future active fasts, reversed fasting intervals, unsupported fields, and prototype replacement attempts are rejected.
- Month-end checkpoints clamp to the last valid day rather than spilling into the next month.
- PWA manifest, icons, and every offline-shell asset resolve under a GitHub repository subpath; navigation falls back to cached HTML; cache cleanup does not delete another app’s cache.

`src/app.js`, `src/model.js`, and `src/db.js` passed Node syntax checks. The production build succeeded and generated `dist/` with `.nojekyll`, icons, manifest, source assets, and a versioned service worker.

## Browser checks

| Area | Evidence |
| --- | --- |
| Meal create/photo/favorite | Saved test lunch with 600 kcal, 30 g protein, 8 g fiber, favorite flag, and a PNG input compressed to a JPEG attachment. Preview and exported backup included the photo. |
| Meal correction | Changed calories to 550; Today immediately showed 550 kcal, 30 g protein, 8 g fiber, one meal. |
| Movement | Meal save opened the requested friendly prompt. Started the 10-minute timer (10:00), marked completed, and observed one post-meal movement log. |
| Water | +250 and +500 yielded 750 ml; undo returned 250 ml. Custom 375 ml saved. With the server stopped, another +250 saved and displayed 500 ml in the restored journal. |
| Sugar/cravings | Checked no added sugar; saved intensity 4 with unplanned-snack awareness. Dashboard reflected both. |
| Activity | Saved 6,500 manual steps and 30-minute exercise flagged as strength; weekly summary showed one strength session. |
| Sleep | Saved 7 h 30 min with good quality; dashboard and weekly average reflected 450 minutes. |
| Fasting | Started 11 October 21:00, ended 12 October 13:00; History showed 16 h and the weekly view one fasting-record day. Separately verified correction of an active fast’s start time. |
| Weight/waist | Saved 110 kg on 1 October and 108.5 kg on 12 October with 115 cm waist; chart, history, and weekly change showed the correct values (−1.5 kg). |
| Reviews | Saved morning intention and evening energy 4, hunger 3, reflection. Favorite-meal picker displayed the saved meal. Weekly averages and 30-day summary matched the synthetic data. |
| References | Changed water reference to 2,250 ml and verified custom-water progress against it. Disabled optional eating-window display and saw the change on Today. |
| Edits | Corrected notes for water, exercise, sleep, weight, fasting, cravings, and movement from History; each saved and rendered. Meal correction checked separately. |
| Deletes | Confirmed deletion for meals, water, exercise, sleep, weight, fasting, cravings, movement, and daily check-in; each filtered list decreased by one. |
| Backup/restore | Exported JSON to a downloaded file; parsed it with the same validation used on import. Imported into a fresh preview origin with a replace confirmation. Meal photo, nutrition, water, exercise, sleep, weight, fasting, craving, and movement records restored. |
| Persistence | Refreshed after restoring; meal totals and water survived. |
| Offline | Stopped the production preview server entirely. Reload still showed the complete dashboard and restored data; a water entry saved successfully, and Trends remained usable. |
| Responsive | All four views checked at widths 320, 390, 430, and 1280 px. Document scroll width equaled viewport width in all 16 checks. Visual inspection at desktop and 390×844 confirmed layout and navigation. |
| Runtime | No browser error/warning logs during final checks. |
| Reset | Typed RESET in the confirmation for each synthetic preview; all returned to zero meals/nutrition and the default references. |

## Honest verification limits

A physical iPhone was not available. Safari camera/HEIC decoding, Add to Home Screen, iOS storage retention, safe-area behavior on an actual device, and background/foreground transitions should be checked on your phone after publishing. No real Apple Health integration or photo nutrition analysis exists.

GitHub deployment has not been run because no destination repository was supplied. The deployment workflow is included, relative paths were verified, and README.md gives exact publishing steps. Node’s native test runner and static build have no package dependencies.

The browser checks above were performed interactively, not by a committed Playwright suite. `npm test` reruns the automated model and PWA tests; the browser verification is documented here for transparency.
