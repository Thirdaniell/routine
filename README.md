# The Log — Personal Field Record

A personal daily routine tracker hosted on GitHub Pages. Covers Bible study,
gym training, trading discipline, food, sleep, money management, and more.
Built with a field-log aesthetic — dark ink background, bone paper cards,
ochre accents.

## Live site
https://thirdaniell.github.io/routine/

## Stack
- **Frontend** — plain HTML/CSS/JS, hosted on GitHub Pages
- **Backend** — Cloudflare Worker (`tracker-worker.daniel-mouldd.workers.dev`)
- **Database** — Notion (Tracker — Life Log database)
- **Local cache** — localStorage (habits, schedule, to-dos, gym log, settings)

## Pages

| Page | Path | Description |
|---|---|---|
| Today | `index.html` | Daily dashboard — habits, schedule, XP bar, to-do list |
| Planner | `pages/planner.html` | Month calendar with per-day schedule and to-dos |
| Workout Routines | `pages/workout-routines.html` | 5-day split reference |
| Gym Log | `pages/gym-log.html` | Log sets/reps per session, track personal bests |
| Bible Study | `pages/bible.html` | Log sessions, streaks, notes → syncs to Notion |
| Trading | `pages/trading.html` | Pre-session checklist, session log → syncs to Notion |
| Money & Credit | `pages/money.html` | Expenses, income, BMO credit card, savings → syncs to Notion |
| Food | `pages/food.html` | Daily meal checklist and eating guidelines |
| Weekly Review | `pages/weekly-review.html` | Habit grid, gym table, money analytics, journal → syncs to Notion |
| Achievements | `pages/achievements.html` | XP, levels (Retail → Master), badges, daily missions |
| Settings | `pages/settings.html` | Profile, sleep/wake times, credit card, workout days |
| Migration | `migrate.html` | One-time tool to push localStorage data to Notion |

## Data storage

### Syncs to Notion (persistent, cross-device)
- Bible study sessions
- Trading sessions
- Expenses, income, credit card payments
- Savings contributions and goal
- Weekly journal entries

### localStorage only (device-specific, resets are fine)
- Daily habit checkboxes
- Schedule items
- To-do lists
- Gym session logs (sets/reps)
- Food meal logs
- Settings and preferences
- XP and achievements

## Gamification
- **XP** earned for each habit checked off
- **Streak multipliers** — 3 days ×1.25, 7 days ×1.5, 14 days ×1.75, 30 days ×2.0
- **Levels** — Retail → Trader → Analyst → Strategist → Specialist → Master
- **Achievements** — 20 unlockable badges
- **Daily missions** — auto-generated challenges each day

## PWA (installable app)
The site is installable on iPhone and Android via "Add to Home Screen".
Icons live in `icons/icon-192.png` and `icons/icon-512.png`.
Service worker handles offline caching — HTML and JS are network-first
so updates from GitHub deploy automatically.

## Updating the site
1. Edit files and push to GitHub — HTML/JS pages update automatically
2. If you change CSS or images, bump the version in `sw.js`:
   `const CACHE = "thelog-v2";` (increment each time)

## Cloudflare Worker
Worker code lives in `tracker-worker/src/index.js`.
Secrets set in Cloudflare dashboard:
- `NOTION_TOKEN` — Notion integration token
- `NOTION_DB` — `009a83b9067f4575b75ab9e4efcf6862`

To redeploy after changes:
```bash
cd tracker-worker
npx wrangler deploy
```

## Notion database
Single database: **Tracker — Life Log**
ID: `009a83b9067f4575b75ab9e4efcf6862`

Views: Journal, Expenses, Income, Bible Study, Trading, Savings

All entries have a `Type` property that filters them into the correct view.
