# CA Inter Planner

A premium, offline-first study operating system for CA Intermediate students —
built with plain HTML, CSS and vanilla JavaScript (no build step, no frameworks).

## Running it

Just open `index.html` in a modern browser (Chrome, Edge, Firefox, Safari — 2023+).
Everything, including the Google Fonts link, works from the file directly; all
app data is stored locally in your browser via `localStorage`, so nothing is
sent to a server and no build tools are required.

For the best experience (and to avoid any browser file:// restrictions),
serve the folder with any static server, e.g.:

```
npx serve .
# or
python3 -m http.server 8080
```

then visit `http://localhost:8080`.

## Project structure

```
index.html            Shell markup: sidebar, topbar, view containers, onboarding, drawer, timer modal
css/style.css          Full design system — tokens, components, responsive rules
js/data/chapters.js    Subject & chapter data with predefined study hours + difficulty
js/data/achievements.js Achievement catalogue and unlock conditions
js/storage.js          localStorage-backed state store (single source of truth)
js/planner.js          Smart Engine — remaining days, hour allocation, plan generation, adaptive engine
js/analytics.js        Canvas chart renderers (bar, donut, line, heatmap) — no external chart library
js/app.js              Boot sequence, router, theme, toasts, exam dial
js/onboarding.js       First-time setup wizard (attempt → subjects → chapters/confidence → hours)
js/views.js            Dashboard / Subjects / Chapters / Planner / Analytics / Vault / Achievements / Settings
js/drawer.js           Chapter detail drawer + Timed Question Engine
```

## How the Smart Engine works

1. **Remaining days** = exam date − today.
2. **Effective hours per chapter** = predefined base hours × (1 − progress already made)
   × a confidence multiplier (weaker confidence → more hours) × a difficulty multiplier,
   plus any adaptive boosts from mock-test underperformance.
3. Chapters are ranked by a **priority score** (weak confidence + high difficulty + low
   progress score higher) and broken into ~1.5h blocks.
4. Blocks are poured into each remaining day up to your daily study-hour budget,
   generating the **Daily Planner**, then rolled up into **Weekly** and **Monthly** views.
5. **Adaptive engine**: after you log a mock score for a subject, it's compared against
   the score your stated confidence implied. If you're overconfident by 15+ points, your
   confidence for that subject's chapters is nudged down, revision frequency is boosted,
   and the plan is regenerated automatically.

## Progress formula

Each chapter is worth 100%, split exactly as specified:

`Theory 20% + Questions 20% + PYQ 20% + Revision 20% (≈6.67% × 3 passes) + Mock 20%`

Progress never increases from a plain click — "Questions" specifically requires
passing the **Timed Question Engine**: a modal countdown (10/15/20 minutes based on
chapter difficulty) that only credits progress if you mark the question solved
before time runs out.

## Data & privacy

All data lives in `localStorage` on your device. Use **Settings → Export Data** to
download a JSON backup, or **Backup/Restore** for a quick local snapshot. **Reset
Progress** wipes everything and restarts onboarding.

## Where to plug in future features

The codebase is intentionally modular so the roadmap items from the brief — AI
Planner, Cloud Sync, Google Login, Offline Mode/PWA, Notifications, Community,
Premium — can be layered in without restructuring: swap `js/storage.js`'s
localStorage calls for a sync backend, add a `manifest.json` + service worker
for PWA/offline, and so on.
