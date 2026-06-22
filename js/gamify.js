// js/gamify.js — Gamification engine for The Log

const GAMIFY_KEY = "ftrack_gamify";

// ---------- XP values ----------
const XP_VALUES = {
  bible:   20,
  gym:     25,
  trading: 20,
  food:    15,
  sleep:   15,
  all_habits: 30  // bonus for completing ALL habits in one day
};

// ---------- Levels ----------
const LEVELS = [
  { level: 1,  title: "Retail",     xpRequired: 0    },
  { level: 2,  title: "Trader",     xpRequired: 300  },
  { level: 3,  title: "Analyst",    xpRequired: 800  },
  { level: 4,  title: "Strategist", xpRequired: 1800 },
  { level: 5,  title: "Specialist", xpRequired: 3500 },
  { level: 6,  title: "Master",     xpRequired: 6000 }
];

// ---------- Achievements ----------
const ACHIEVEMENTS = [
  { id: "first_log",       label: "First Entry",         desc: "Log your first habit",                       icon: "📋" },
  { id: "streak_3",        label: "3-Day Run",            desc: "Complete all habits 3 days in a row",        icon: "🔥" },
  { id: "streak_7",        label: "Week Locked In",       desc: "Complete all habits 7 days in a row",        icon: "📈" },
  { id: "streak_14",       label: "Two Weeks Solid",      desc: "Complete all habits 14 days in a row",       icon: "💎" },
  { id: "streak_30",       label: "Monthly Operator",     desc: "Complete all habits 30 days in a row",       icon: "🏆" },
  { id: "gym_10",          label: "10 Sessions",          desc: "Log 10 gym sessions",                        icon: "💪" },
  { id: "gym_30",          label: "30 Sessions",          desc: "Log 30 gym sessions",                        icon: "🏋️" },
  { id: "bible_7",         label: "Word Daily",           desc: "Log Bible study 7 days in a row",            icon: "📖" },
  { id: "bible_30",        label: "30 Days in the Word",  desc: "Log 30 Bible study sessions total",          icon: "✝️"  },
  { id: "trading_10",      label: "10 Sessions Logged",   desc: "Log 10 trading sessions",                    icon: "📊" },
  { id: "trading_disciplined", label: "Full Checklist",   desc: "Complete all pre-session checks in one session", icon: "✅" },
  { id: "no_debt",         label: "Debt Free",            desc: "Pay off your credit card balance completely", icon: "💳" },
  { id: "saved_100",       label: "First $100 Saved",     desc: "Save $100 total",                            icon: "💰" },
  { id: "saved_500",       label: "Half Stack",           desc: "Save $500 total",                            icon: "💵" },
  { id: "level_2",         label: "Promoted: Trader",     desc: "Reach level 2",                              icon: "⬆️" },
  { id: "level_3",         label: "Promoted: Analyst",    desc: "Reach level 3",                              icon: "⬆️" },
  { id: "level_4",         label: "Promoted: Strategist", desc: "Reach level 4",                              icon: "⬆️" },
  { id: "level_5",         label: "Promoted: Specialist", desc: "Reach level 5",                              icon: "⬆️" },
  { id: "level_6",         label: "Master",               desc: "Reach the top rank",                         icon: "👑" },
  { id: "perfect_week",    label: "Perfect Week",         desc: "Complete all habits every day for a full week", icon: "🌟" }
];

// ---------- Storage ----------
// In-memory cache so we don't hit the API on every single XP tick
let _gamifyCache = null;

function getGamifyData() {
  if (_gamifyCache) return _gamifyCache;
  try {
    const raw = localStorage.getItem(GAMIFY_KEY);
    _gamifyCache = raw ? JSON.parse(raw) : {};
    return _gamifyCache;
  } catch { return {}; }
}

function saveGamifyData(data) {
  // Trim to stay under Notion's 2000 char rich_text limit
  if (data.xpLog && data.xpLog.length > 20) data.xpLog = data.xpLog.slice(0, 20);
  if (data.dailyXP) {
    const keys = Object.keys(data.dailyXP).sort().reverse();
    if (keys.length > 60) {
      const trimmed = {};
      keys.slice(0, 60).forEach(k => { trimmed[k] = data.dailyXP[k]; });
      data.dailyXP = trimmed;
    }
  }
  _gamifyCache = data;
  localStorage.setItem(GAMIFY_KEY, JSON.stringify(data));
  // Async save to Notion — don't block UI
  if (typeof apiSaveGamify === "function") {
    apiSaveGamify(data).catch(e => console.warn("gamify sync failed", e));
  }
}

// Call this on page load to pull latest from Notion into cache
async function syncGamifyFromNotion() {
  if (typeof apiGetGamify !== "function") return;
  try {
    const remote = await apiGetGamify();
    if (remote && typeof remote.xp === "number" && remote.xp > 0) {
      // Always trust Notion data — it's the source of truth across devices
      _gamifyCache = remote;
      localStorage.setItem(GAMIFY_KEY, JSON.stringify(remote));
      console.log("gamify synced from Notion:", remote.xp, "XP, level:", getLevelForXP(remote.xp).title);
    } else {
      console.log("gamify sync: no valid Notion data found, remote was:", JSON.stringify(remote));
    }
  } catch(e) { console.warn("gamify sync from Notion failed", e); }
}

function initGamifyData() {
  const data = getGamifyData();
  if (!data.xp) data.xp = 0;
  if (!data.unlockedAchievements) data.unlockedAchievements = [];
  if (!data.xpLog) data.xpLog = []; // [{date, reason, amount}]
  if (!data.dailyXP) data.dailyXP = {}; // {dateKey: {bible:true, gym:true...}}
  return data;
}

// ---------- XP helpers ----------
function getStreakMultiplier(streak) {
  if (streak >= 30) return 2.0;
  if (streak >= 14) return 1.75;
  if (streak >= 7)  return 1.5;
  if (streak >= 3)  return 1.25;
  return 1.0;
}

function getLevelForXP(xp) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.xpRequired) current = lvl;
    else break;
  }
  return current;
}

function getNextLevel(xp) {
  for (const lvl of LEVELS) {
    if (xp < lvl.xpRequired) return lvl;
  }
  return null; // max level
}

function getTotalXP() {
  return initGamifyData().xp;
}

// ---------- Award XP ----------
// Called when a habit is checked. Won't double-award XP for the same habit on the same day.
function awardHabitXP(habitKey, dateKey) {
  const data = initGamifyData();
  if (!data.dailyXP[dateKey]) data.dailyXP[dateKey] = {};
  if (data.dailyXP[dateKey][habitKey]) return 0; // already awarded today

  const streak = getOverallStreak();
  const multiplier = getStreakMultiplier(streak);
  const base = XP_VALUES[habitKey] || 10;
  const earned = Math.round(base * multiplier);

  data.dailyXP[dateKey][habitKey] = true;
  data.xp += earned;
  data.xpLog.unshift({ date: dateKey, reason: habitKey, amount: earned, multiplier });

  // Check if ALL habits done today → bonus XP
  const allDone = HABIT_KEYS.every(h => data.dailyXP[dateKey][h]);
  if (allDone && !data.dailyXP[dateKey]["all_habits_bonus"]) {
    const bonus = Math.round(XP_VALUES.all_habits * multiplier);
    data.dailyXP[dateKey]["all_habits_bonus"] = true;
    data.xp += bonus;
    data.xpLog.unshift({ date: dateKey, reason: "All habits complete!", amount: bonus, multiplier });
  }

  saveGamifyData(data);
  checkAchievements();
  return earned;
}

// Remove XP when habit is unchecked
function removeHabitXP(habitKey, dateKey) {
  const data = initGamifyData();
  if (!data.dailyXP[dateKey] || !data.dailyXP[dateKey][habitKey]) return;

  const streak = getOverallStreak();
  const multiplier = getStreakMultiplier(streak);
  const base = XP_VALUES[habitKey] || 10;
  const earned = Math.round(base * multiplier);

  delete data.dailyXP[dateKey][habitKey];
  data.xp = Math.max(0, data.xp - earned);

  // Remove all_habits bonus if it was awarded
  if (data.dailyXP[dateKey]["all_habits_bonus"]) {
    const bonus = Math.round(XP_VALUES.all_habits * multiplier);
    delete data.dailyXP[dateKey]["all_habits_bonus"];
    data.xp = Math.max(0, data.xp - bonus);
  }

  saveGamifyData(data);
}

// ---------- Achievements ----------
function checkAchievements() {
  const data = initGamifyData();
  const unlocked = new Set(data.unlockedAchievements);
  const newlyUnlocked = [];

  function unlock(id) {
    if (!unlocked.has(id)) {
      unlocked.add(id);
      newlyUnlocked.push(id);
    }
  }

  const xp = data.xp;
  const streak = getOverallStreak();
  const level = getLevelForXP(xp);
  const days = getAllDays();
  const allDayKeys = Object.keys(days);

  // First log
  if (allDayKeys.some(k => {
    const d = days[k];
    return d.habits && HABIT_KEYS.some(h => d.habits[h]);
  })) unlock("first_log");

  // Streaks
  if (streak >= 3)  unlock("streak_3");
  if (streak >= 7)  unlock("streak_7");
  if (streak >= 14) unlock("streak_14");
  if (streak >= 30) unlock("streak_30");

  // Gym sessions
  const gymDays = allDayKeys.filter(k => days[k].habits && days[k].habits.gym).length;
  if (gymDays >= 10) unlock("gym_10");
  if (gymDays >= 30) unlock("gym_30");

  // Bible sessions
  const bibleDays = allDayKeys.filter(k => days[k].habits && days[k].habits.bible).length;
  if (bibleDays >= 30) unlock("bible_30");

  // Bible streak
  let bibleStreak = 0;
  let cursor = new Date();
  while (true) {
    const k = dateKey(cursor);
    if (!days[k] || !days[k].habits || !days[k].habits.bible) break;
    bibleStreak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  if (bibleStreak >= 7) unlock("bible_7");

  // Trading
  try {
    const sessions = JSON.parse(localStorage.getItem("ftrack_trading_sessions") || "[]");
    if (sessions.length >= 10) unlock("trading_10");
    if (sessions.some(s => s.checksCompleted === 8)) unlock("trading_disciplined");
  } catch {}

  // Perfect week
  const weekDates = getWeekDates(weekKeyFor(new Date()));
  const perfectWeek = weekDates.every(k => {
    const d = days[k];
    return d && d.habits && HABIT_KEYS.every(h => d.habits[h]);
  });
  if (perfectWeek) unlock("perfect_week");

  // Levels
  if (level.level >= 2) unlock("level_2");
  if (level.level >= 3) unlock("level_3");
  if (level.level >= 4) unlock("level_4");
  if (level.level >= 5) unlock("level_5");
  if (level.level >= 6) unlock("level_6");

  // Savings
  const savedTotal = getSavingsTotal();
  if (savedTotal >= 100) unlock("saved_100");
  if (savedTotal >= 500) unlock("saved_500");

  data.unlockedAchievements = Array.from(unlocked);
  saveGamifyData(data);
  return newlyUnlocked;
}

// ---------- Daily missions ----------
function getDailyMissions(dateKey) {
  const day = getDay(dateKey);
  const habits = day.habits || {};
  const streak = getOverallStreak();

  const missions = [
    {
      id: "complete_all",
      label: "Complete all 5 habits today",
      xp: 50,
      done: HABIT_KEYS.every(h => habits[h])
    },
    {
      id: "bible_gym",
      label: "Log Bible study & gym",
      xp: 25,
      done: habits.bible && habits.gym
    },
    {
      id: "trading_discipline",
      label: "Log a trading session",
      xp: 20,
      done: habits.trading
    }
  ];

  // Streak bonus mission
  if (streak >= 2) {
    missions.push({
      id: "keep_streak",
      label: `Keep your ${streak}-day streak alive`,
      xp: Math.round(streak * 3),
      done: HABIT_KEYS.every(h => habits[h])
    });
  }

  return missions;
}

// ---------- Render XP bar (call this from any page) ----------
function renderXPBar(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const xp = getTotalXP();
  const level = getLevelForXP(xp);
  const next = getNextLevel(xp);
  const streak = getOverallStreak();
  const multiplier = getStreakMultiplier(streak);

  const pct = next
    ? Math.round(((xp - level.xpRequired) / (next.xpRequired - level.xpRequired)) * 100)
    : 100;

  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;flex-wrap:wrap;gap:8px;">
      <div>
        <span style="font-family:var(--font-mono);font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-light-dim);">Rank</span>
        <span style="font-family:var(--font-display);font-size:1.3rem;font-weight:600;color:var(--ochre);margin-left:10px;">${level.title}</span>
        <span style="font-family:var(--font-mono);font-size:0.72rem;color:var(--text-light-dim);margin-left:6px;">Lv.${level.level}</span>
      </div>
      <div style="font-family:var(--font-mono);font-size:0.78rem;color:var(--text-light-dim);">
        ${xp.toLocaleString()} XP
        ${multiplier > 1 ? `<span style="color:var(--ochre);margin-left:8px;">×${multiplier} streak bonus</span>` : ""}
      </div>
    </div>
    <div style="height:8px;background:rgba(244,241,232,0.1);border-radius:4px;overflow:hidden;">
      <div style="height:100%;width:${pct}%;background:var(--ochre);border-radius:4px;transition:width 0.4s ease;"></div>
    </div>
    <div style="font-family:var(--font-mono);font-size:0.68rem;color:var(--text-light-dim);margin-top:4px;text-align:right;">
      ${next ? `${(next.xpRequired - xp).toLocaleString()} XP to ${next.title}` : "Max rank achieved"}
    </div>
  `;
}

// ---------- Toast notification for XP gain ----------
function showXPToast(amount, reason) {
  const existing = document.getElementById("xp-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "xp-toast";
  toast.style.cssText = `
    position:fixed;bottom:24px;right:24px;
    background:var(--ink-soft);border:1px solid var(--ochre);
    border-radius:var(--radius);padding:12px 18px;
    font-family:var(--font-mono);font-size:0.78rem;
    color:var(--text-light);z-index:999;
    animation:slideUp 0.3s ease;
  `;
  toast.innerHTML = `<span style="color:var(--ochre);font-weight:700;">+${amount} XP</span> — ${reason}`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ---------- Achievement toast ----------
function showAchievementToast(achievementId) {
  const ach = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!ach) return;

  const existing = document.getElementById("ach-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "ach-toast";
  toast.style.cssText = `
    position:fixed;bottom:72px;right:24px;
    background:var(--bone);color:var(--text-dark);
    border:1px solid var(--sage);
    border-radius:var(--radius);padding:14px 18px;
    font-family:var(--font-mono);font-size:0.78rem;
    z-index:999;max-width:280px;
    animation:slideUp 0.3s ease;
  `;
  toast.innerHTML = `
    <div style="font-size:1.1rem;margin-bottom:4px;">${ach.icon} Achievement unlocked!</div>
    <div style="font-weight:700;color:var(--sage-deep);">${ach.label}</div>
    <div style="color:var(--text-dark-dim);font-size:0.72rem;margin-top:2px;">${ach.desc}</div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Add toast animation to page
const style = document.createElement("style");
style.textContent = `@keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`;
document.head.appendChild(style);
