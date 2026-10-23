# Steadily

A calm, mobile-first, private personal health journal. Built with vanilla JavaScript, CSS, IndexedDB, and a service worker. No runtime packages, account, paid API, external fonts, analytics, or health-data uploads. Designed for free static GitHub Pages hosting.

## Run locally

Install Node.js 20 or newer (22 LTS works). There are **no dependencies to install**.

```sh
cd "/Users/bhaskar/Documents/health tracker"
npm run dev
```

Open **http://localhost:5173**. Development serves the source and public assets without registering a service worker, so edits appear after refresh.

Check and build:

```sh
npm test
npm run check
npm run build
npm run preview
```

`npm run preview` serves the production `dist/` folder on port 5173; stop the development server with Ctrl+C first. The production preview registers the offline service worker. If that port is busy, use `PORT=5174 npm run preview`. Keep a development and production preview on different ports to avoid an old production service worker caching development files.

On the machine used to build this app, Node is bundled with Codex, but npm is not on the terminal PATH. These commands work now without installing anything:

```sh
cd "/Users/bhaskar/Documents/health tracker"
"/Users/bhaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" scripts/serve.mjs
```

Stop the server with Ctrl+C before starting another server on the same port. To test/build/preview using that bundled runtime:

```sh
"/Users/bhaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" --test tests/*.test.mjs
"/Users/bhaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" --check src/app.js
"/Users/bhaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" --check src/model.js
"/Users/bhaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" --check src/db.js
"/Users/bhaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" scripts/build.mjs
"/Users/bhaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" scripts/serve.mjs dist
```

## Deploy to GitHub Pages

1. Create an **empty public repository** on GitHub, for example `steadily-health`. Do not initialize it with a README or other files. Free GitHub Pages hosting works with a public repository. The app source is public; your health logs remain on your own device. Never commit backup files or personal photos.
2. From this project folder, run the commands below, replacing `YOUR_USERNAME` and `YOUR_REPOSITORY` with the repository you created:

```sh
cd "/Users/bhaskar/Documents/health tracker"
git init -b main
git add index.html package.json src public scripts tests README.md QA.md .github .gitignore
git commit -m "Build Steadily personal health PWA"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

3. In the repository, open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Open **Actions → Deploy Steadily to GitHub Pages → Run workflow → main → Run workflow**. This reruns deployment if the first push arrived before Pages was enabled. The included workflow runs tests, syntax checks, and the build, then publishes `dist/`.
5. Wait for both `build` and `deploy` to succeed. The final site URL appears in **Settings → Pages** and the workflow’s `github-pages` deployment. It will normally be `https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/`.
6. Open that HTTPS URL and let the first online load finish. Open **Settings** in Steadily and check **Offline shell ready**. Updates deploy automatically when you push to `main`.

All asset paths, service-worker cache URLs, and the manifest scope are relative, so repository subpaths work without configuration. Keep the published URL stable: browser storage belongs to that exact origin, not to your GitHub account. Changing domain or browser requires export/import.

Official reference: [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Install on iPhone

**On iPhone: open the published site in Safari → tap Share → Add to Home Screen → Add.**

Open the Home Screen icon and allow one online load to cache the shell. Normal logging and saved history work offline afterward. The app has an iPhone icon, standalone manifest, safe-area padding, and a bottom navigation bar. Actual installation and camera behavior should be checked on your iPhone; desktop viewport testing does not replace that device check.

Home Screen and Safari can have separate storage. If your logs do not appear in the installed app, export them in Safari, then import that backup in the Home Screen app. No notifications are promised while closed; prompts and timer completion messages appear only in the open app. Fasting and movement timers use saved timestamps, so elapsed time is accurate after reopening.

## What works

- Today prioritizes Movement, Food & Water, Fasting, and Sleep & Recovery, followed by the remaining habits, weight, and reviews. Movement shows saved steps against an editable daily goal with visual progress and quick timer access.
- Meals have dates/times, names, descriptions, portions, notes, estimated nutrition, favorites, recent-meal reuse, editable routine foods, and compressed photo attachments. On iPhone, the file picker offers camera or library choices supported by Safari.
- Post-meal prompts offer 10- or 15-minute timers, manual completion, skipping, and custom movement types. Timers can be cancelled. Recorded movement can be corrected in History.
- Water: +250/+500 ml, custom quantity, undo latest on the selected day, editable reference, history corrections.
- Added-sugar check-in, optional notes, cravings with intensity and unplanned-snack observations.
- Manual steps, exercise, strength-session flag, previous-night sleep duration/quality/notes. Optional REM, Core, Deep, and Awake minutes can be entered manually from Apple Health / Watch. A stage chart appears only with entered data; missing stages are never estimated. One sleep entry per waking date; edit it to correct.
- Weight and optional waist measurements, dated history and chart, weekly/monthly changes, monthly checkpoints and three-month aspiration.
- Fasting start/edit-start/end, manual history, dates/times, duration, seven-day record consistency. A live timer shows progress against the optional plan derived from the saved eating window. Edit the schedule on the card; end early or choose when to end after the plan is reached. Fasting duration never increases the daily score.
- Morning overview and intentions; evening missing-log prompts, energy/hunger ratings, reflection; weekly and 30-day reviews.
- Every record is editable and deletable from History. Delete, full reset, and replace-with-backup operations require in-app confirmation.
- JSON export includes photos, settings, favorites, logs, and active timers. Import validates the entire backup before offering a replace confirmation. It replaces, rather than merges, data.

## Privacy and limits

Logs are in IndexedDB under the current browser origin. There is no automatic backup or cross-device sync, and no app lock or database encryption. Protect your phone and exported JSON files. Clearing site/browser data or browser storage eviction can erase the journal. Settings can request persistent storage, but the browser decides whether to grant it; regularly export backups, especially before moving to another phone/browser.

Photos are **attachments**, not automatic calorie analysis. The app labels nutrition as manually entered estimates. Starter quick-food values are rough editable per-serving estimates, not a nutritional database. Photos are compressed to JPEG with a longest side of 1,000 pixels, usually saving substantial space; individual inputs are limited to 25 MB, compressed attachments to about 1.5 MB, and imports to 100 MB. Some HEIC files may need conversion if a browser cannot decode them.

Apple Health / Apple Watch steps, exercise, and sleep are **manual**. A website cannot directly read HealthKit. Records have a `source` and settings/daily data carry `activitySource: "manual"` to support a future native companion or shortcut importer. No such integration or AI analysis service is configured in v1.

The consistency score counts presence of logs in seven areas (meal, water, steps, exercise, sleep, sugar awareness, post-meal movement). A zero step count and an honest sugar-awareness note count. It does not reward low calories, weight loss, or longer fasts. Water/protein goals and weight checkpoints are personal editable references, not prescriptions or guarantees.

All displayed dates/times use Asia/Kolkata. Dated records store local `YYYY-MM-DD` keys; timer timestamps are absolute ISO instants and converted to Kolkata for display. Sleep is associated with its waking date. Weekly summaries use the last seven calendar days; monthly summaries use the last 30. Nutrition averages use days with meal logs, steps/sleep averages use logged days/nights, and gaps remain unknown. Weight changes compare the latest entry with the last entry on or before 7/30 days earlier. Checkpoint comparisons show the latest logged weight on or before the checkpoint date since your journey start; upcoming checkpoints show the latest available log, not a prediction.

For app updates, export a backup, close all open Steadily tabs/Home Screen windows, and reopen online. A new service worker downloads the complete shell before activation, preserves IndexedDB, and replaces only this app’s old cache. Do not clear site data to update.

## Project structure

- `src/app.js`: interface, dialogs, interaction handlers, reviews, charts.
- `src/model.js`: defaults, Kolkata date helpers, validation, summaries.
- `src/db.js`: transactional IndexedDB and photo compression.
- `src/styles.css`: desktop/mobile layouts and accessible interaction states.
- `public/`: PWA manifest, icons, production service worker.
- `scripts/`: dependency-free development server and production build.
- `tests/model.test.mjs`: date-boundary, calculation, timer, and import tests.
- `tests/priorities.test.mjs`: step goals, fasting plans, manual sleep stages, and legacy-backup compatibility tests.
- `.github/workflows/pages.yml`: tests/build/deploy through GitHub Actions.

See [QA.md](QA.md) for completed verification and device-specific follow-up checks.
