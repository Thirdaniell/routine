# The Log — Personal Routine Tracker
A personal field-log style dashboard to organize your day: Bible study, gym training,
trading discipline, food, sleep, schedule, and money/credit management.
Hosting on GitHub Pages
Create a new repository on GitHub (e.g. `the-log` or `routine-tracker`).
Upload all the files/folders from this project, keeping the folder structure:
```
   index.html
   css/styles.css
   js/data.js
   js/app.js
   data/routines.js
   pages/*.html
   ```
In your repo, go to Settings → Pages.
Under Build and deployment, set Source to Deploy from a branch, pick `main`
(or `master`) and `/ (root)`, then save.
After a minute or two, your site will be live at:
`https://<your-username>.github.io/<repo-name>/`
How data is stored
All your data (habits, schedule, expenses, income, savings, etc.) is currently saved
in your browser's localStorage. This means:
Your data stays on whichever device/browser you use it on.
Since you'll be switching between laptop and phone, this is a known limitation —
a future upgrade will move this to a small cloud database (Supabase) so everything
syncs across devices automatically. The data layer (`js/data.js`) is already written
so this swap won't require rebuilding the pages.
In the meantime, you can clear your browser data accidentally and lose progress —
consider this a "v1" to get the habit loop going.
Current pages
Today (`index.html`) — daily dashboard: schedule timeline, habit checklist
(Bible, Gym, Trading, Food, Sleep), and a Money & Credit snapshot.
Workout Routines (`pages/workout-routines.html`) — your full 5-day split.
Money & Credit (`pages/money.html`) — log expenses (debit/credit), income,
BMO credit card utilization, and a savings goal tracker.
Bible Study / Trading / Food / Weekly Review — placeholder pages, coming next.
What's next
Build out Bible Study, Trading, and Food pages
Build the Weekly Review page (pulls habit % stats + journaling prompts)
Optional: move data storage to Supabase for cross-device sync
