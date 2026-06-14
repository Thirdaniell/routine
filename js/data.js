// js/data.js
// Data layer for the routine tracker.
// Currently backed by localStorage. All reads/writes go through this module
// so the storage backend (e.g. Supabase) can be swapped later without
// touching page logic.

const STORAGE_KEYS = {
  DAYS: "ftrack_days",          // per-day habit + notes data
  SCHEDULES: "ftrack_schedules", // per-day schedule items
  EXPENSES: "ftrack_expenses",   // expense ledger
  CREDIT: "ftrack_credit",       // credit card config
  REVIEWS: "ftrack_reviews",     // weekly review entries
  INCOME: "ftrack_income",       // job income entries
  SAVINGS: "ftrack_savings",     // savings goal + contributions
  TODOS: "ftrack_todos"          // per-day to-do items
};

const HABIT_KEYS = ["bible", "gym", "trading", "food", "sleep"];

const DEFAULT_SCHEDULE = [
  { time: "06:00", label: "Wake up", done: false },
  { time: "06:15", label: "Bible study", done: false },
  { time: "07:00", label: "Breakfast", done: false },
  { time: "08:30", label: "NY AM session - trading watch", done: false },
  { time: "12:30", label: "Lunch", done: false },
  { time: "17:00", label: "Gym", done: false },
  { time: "19:00", label: "Dinner", done: false },
  { time: "22:30", label: "Wind down / sleep", done: false }
];

const DEFAULT_CREDIT = {
  name: "BMO Student Mastercard",
  limit: 500,
  dueDay: 1 // day of month payment is due
};

// ---------- helpers ----------

function _read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error("ftrack: failed to read", key, e);
    return fallback;
  }
}

function _write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("ftrack: failed to write", key, e);
  }
}

function dateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayKey() {
  return dateKey(new Date());
}

// ---------- day state (habits + notes) ----------

function getAllDays() {
  return _read(STORAGE_KEYS.DAYS, {});
}

function getDay(key) {
  const days = getAllDays();
  if (!days[key]) {
    const habits = {};
    HABIT_KEYS.forEach(h => (habits[h] = false));
    days[key] = { habits, notes: {} };
  }
  return days[key];
}

function setHabit(key, habitKey, value) {
  const days = getAllDays();
  if (!days[key]) days[key] = { habits: {}, notes: {} };
  if (!days[key].habits) days[key].habits = {};
  days[key].habits[habitKey] = value;
  _write(STORAGE_KEYS.DAYS, days);
}

function setNote(key, noteKey, value) {
  const days = getAllDays();
  if (!days[key]) days[key] = { habits: {}, notes: {} };
  if (!days[key].notes) days[key].notes = {};
  days[key].notes[noteKey] = value;
  _write(STORAGE_KEYS.DAYS, days);
}

// ---------- schedule ----------

function getAllSchedules() {
  return _read(STORAGE_KEYS.SCHEDULES, {});
}

function getSchedule(key) {
  const all = getAllSchedules();
  if (!all[key]) {
    // clone default
    return DEFAULT_SCHEDULE.map(item => ({ ...item }));
  }
  return all[key];
}

function setSchedule(key, items) {
  const all = getAllSchedules();
  all[key] = items;
  _write(STORAGE_KEYS.SCHEDULES, all);
}

// Convert "HH:MM" to minutes since midnight
function timeToMinutes(t) {
  const [h, m] = (t || "00:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Check whether `candidate` (with optional .duration in minutes, default 1)
// overlaps any item in `items` (excluding the item at excludeIndex).
// Returns the overlapping item, or null if no overlap.
function findOverlap(items, candidate, excludeIndex = -1) {
  const cStart = timeToMinutes(candidate.time);
  const cEnd = cStart + (Number(candidate.duration) || 1);
  for (let i = 0; i < items.length; i++) {
    if (i === excludeIndex) continue;
    const item = items[i];
    const iStart = timeToMinutes(item.time);
    const iEnd = iStart + (Number(item.duration) || 1);
    if (cStart < iEnd && iStart < cEnd) {
      return item;
    }
  }
  return null;
}

// ---------- to-do list (per day, untimed tasks) ----------

function getAllTodos() {
  return _read(STORAGE_KEYS.TODOS, {});
}

function getTodos(key) {
  const all = getAllTodos();
  return all[key] || [];
}

function setTodos(key, items) {
  const all = getAllTodos();
  all[key] = items;
  _write(STORAGE_KEYS.TODOS, all);
}

function addTodo(key, text) {
  const items = getTodos(key);
  items.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    text,
    done: false
  });
  setTodos(key, items);
  return items;
}

function toggleTodo(key, id) {
  const items = getTodos(key);
  const item = items.find(t => t.id === id);
  if (item) item.done = !item.done;
  setTodos(key, items);
}

function deleteTodo(key, id) {
  const items = getTodos(key).filter(t => t.id !== id);
  setTodos(key, items);
}

// Move a to-do to a different date (for "push to later day")
function moveTodo(fromKey, toKey, id) {
  const fromItems = getTodos(fromKey);
  const item = fromItems.find(t => t.id === id);
  if (!item) return;
  setTodos(fromKey, fromItems.filter(t => t.id !== id));
  const toItems = getTodos(toKey);
  toItems.push(item);
  setTodos(toKey, toItems);
}

// ---------- expenses ----------

function getExpenses() {
  return _read(STORAGE_KEYS.EXPENSES, []);
}

function addExpense(expense) {
  const expenses = getExpenses();
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    date: expense.date || todayKey(),
    description: expense.description || "",
    amount: Number(expense.amount) || 0,
    category: expense.category || "Other",
    method: expense.method === "credit" ? "credit" : "debit"
  };
  expenses.unshift(entry);
  _write(STORAGE_KEYS.EXPENSES, expenses);
  return entry;
}

function deleteExpense(id) {
  const expenses = getExpenses().filter(e => e.id !== id);
  _write(STORAGE_KEYS.EXPENSES, expenses);
}

// ---------- credit card ----------

function getCreditConfig() {
  return _read(STORAGE_KEYS.CREDIT, { ...DEFAULT_CREDIT });
}

function setCreditConfig(config) {
  _write(STORAGE_KEYS.CREDIT, config);
}

function getCreditBalance() {
  const expenses = getExpenses();
  return expenses
    .filter(e => e.method === "credit")
    .reduce((sum, e) => sum + e.amount, 0);
}

// ---------- income (job income, not trading) ----------

function getIncome() {
  return _read(STORAGE_KEYS.INCOME, []);
}

function addIncome(entry) {
  const income = getIncome();
  const item = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    date: entry.date || todayKey(),
    source: entry.source || "Job",
    amount: Number(entry.amount) || 0
  };
  income.unshift(item);
  _write(STORAGE_KEYS.INCOME, income);
  return item;
}

function deleteIncome(id) {
  const income = getIncome().filter(e => e.id !== id);
  _write(STORAGE_KEYS.INCOME, income);
}

function getTotalIncome() {
  return getIncome().reduce((sum, e) => sum + e.amount, 0);
}

// ---------- savings ----------

function getSavings() {
  return _read(STORAGE_KEYS.SAVINGS, { goal: 0, contributions: [] });
}

function setSavingsGoal(goal) {
  const savings = getSavings();
  savings.goal = Number(goal) || 0;
  _write(STORAGE_KEYS.SAVINGS, savings);
}

function addSavingsContribution(amount, note) {
  const savings = getSavings();
  if (!savings.contributions) savings.contributions = [];
  savings.contributions.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    date: todayKey(),
    amount: Number(amount) || 0,
    note: note || ""
  });
  _write(STORAGE_KEYS.SAVINGS, savings);
}

function deleteSavingsContribution(id) {
  const savings = getSavings();
  savings.contributions = (savings.contributions || []).filter(c => c.id !== id);
  _write(STORAGE_KEYS.SAVINGS, savings);
}

function getSavingsTotal() {
  const savings = getSavings();
  return (savings.contributions || []).reduce((sum, c) => sum + c.amount, 0);
}

// Returns array of 7 dateKeys (Mon-Sun) for the week identified by weekKey
// (weekKey is the Monday's dateKey, as produced by weekKeyFor)
function getWeekDates(weekKey) {
  const start = new Date(weekKey + "T00:00:00");
  const keys = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    keys.push(dateKey(d));
  }
  return keys;
}

// Habit completion rate (%) for a given habit across a specific set of date keys
function getHabitRateForDates(habitKey, dateKeys) {
  const days = getAllDays();
  let done = 0;
  dateKeys.forEach(k => {
    if (days[k] && days[k].habits && days[k].habits[habitKey]) done++;
  });
  return Math.round((done / dateKeys.length) * 100);
}

// Sum of expenses within a set of date keys, optionally grouped by category
function getExpensesForDates(dateKeys) {
  const set = new Set(dateKeys);
  return getExpenses().filter(e => set.has(e.date));
}

function getIncomeForDates(dateKeys) {
  const set = new Set(dateKeys);
  return getIncome().filter(e => set.has(e.date));
}

function getSavingsContributionsForDates(dateKeys) {
  const set = new Set(dateKeys);
  const savings = getSavings();
  return (savings.contributions || []).filter(c => set.has(c.date));
}

// ---------- weekly review ----------

function weekKeyFor(date) {
  // ISO week key: YYYY-Www, using Monday as start of week
  const d = date instanceof Date ? new Date(date) : new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - day);
  return dateKey(d); // use the Monday's date as the week key
}

function getAllReviews() {
  return _read(STORAGE_KEYS.REVIEWS, {});
}

function getReview(weekKey) {
  const all = getAllReviews();
  return all[weekKey] || { wins: "", struggles: "", adjustments: "" };
}

function setReview(weekKey, review) {
  const all = getAllReviews();
  all[weekKey] = review;
  _write(STORAGE_KEYS.REVIEWS, all);
}

// ---------- streaks / weekly stats ----------

// Returns array of last n dateKeys ending today, oldest first
function lastNDays(n, endDate = new Date()) {
  const keys = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    keys.push(dateKey(d));
  }
  return keys;
}

// Current streak of consecutive days (ending today) where ALL habits are done
function getOverallStreak() {
  const days = getAllDays();
  let streak = 0;
  let cursor = new Date();
  while (true) {
    const key = dateKey(cursor);
    const day = days[key];
    if (!day || !day.habits) break;
    const allDone = HABIT_KEYS.every(h => day.habits[h]);
    if (!allDone) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Percentage completion for a habit over the last n days
function getHabitWeeklyRate(habitKey, n = 7) {
  const days = getAllDays();
  const keys = lastNDays(n);
  let done = 0;
  keys.forEach(k => {
    if (days[k] && days[k].habits && days[k].habits[habitKey]) done++;
  });
  return Math.round((done / n) * 100);
}
