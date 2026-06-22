// js/api.js
const WORKER_URL = "https://tracker-worker.daniel-mouldd.workers.dev";

async function apiFetch(path, method = "GET", body = null) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(WORKER_URL + path, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ---------- Journal ----------
async function apiGetJournal(weekKey) {
  try {
    const results = await apiFetch(`/journal?weekKey=${weekKey}`);
    return results[0] || { weekKey, wins: "", struggles: "", adjustments: "" };
  } catch { return getReview(weekKey); }
}
async function apiSaveJournal(weekKey, data) {
  setReview(weekKey, data);
  try { await apiFetch("/journal", "POST", { weekKey, ...data }); } catch(e) { console.warn("journal save failed", e); }
}

// ---------- Expenses ----------
async function apiGetExpenses() {
  try { return await apiFetch("/expenses"); } catch { return getExpenses(); }
}
async function apiAddExpense(expense) {
  addExpense(expense);
  try { return await apiFetch("/expenses", "POST", expense); } catch(e) { console.warn(e); }
}
async function apiDeleteExpense(id) {
  deleteExpense(id);
  try { await apiFetch(`/expenses?id=${id}`, "DELETE"); } catch(e) { console.warn(e); }
}

// ---------- Income ----------
async function apiGetIncome() {
  try { return await apiFetch("/income"); } catch { return getIncome(); }
}
async function apiAddIncome(entry) {
  addIncome(entry);
  try { return await apiFetch("/income", "POST", entry); } catch(e) { console.warn(e); }
}
async function apiDeleteIncome(id) {
  deleteIncome(id);
  try { await apiFetch(`/income?id=${id}`, "DELETE"); } catch(e) { console.warn(e); }
}

// ---------- Bible ----------
async function apiGetBible() {
  try { return await apiFetch("/bible"); }
  catch { try { return JSON.parse(localStorage.getItem("ftrack_bible_entries") || "[]"); } catch { return []; } }
}
async function apiAddBible(entry) {
  try {
    const entries = JSON.parse(localStorage.getItem("ftrack_bible_entries") || "[]");
    entries.unshift({ ...entry, id: Date.now().toString(36) });
    localStorage.setItem("ftrack_bible_entries", JSON.stringify(entries));
  } catch {}
  try { return await apiFetch("/bible", "POST", entry); } catch(e) { console.warn(e); }
}
async function apiDeleteBible(id) {
  try {
    const entries = JSON.parse(localStorage.getItem("ftrack_bible_entries") || "[]").filter(e => e.id !== id);
    localStorage.setItem("ftrack_bible_entries", JSON.stringify(entries));
  } catch {}
  try { await apiFetch(`/bible?id=${id}`, "DELETE"); } catch(e) { console.warn(e); }
}

// ---------- Trading ----------
async function apiGetTrading() {
  try { return await apiFetch("/trading"); }
  catch { try { return JSON.parse(localStorage.getItem("ftrack_trading_sessions") || "[]"); } catch { return []; } }
}
async function apiAddTrading(session) {
  try {
    const sessions = JSON.parse(localStorage.getItem("ftrack_trading_sessions") || "[]");
    sessions.unshift({ ...session, id: Date.now().toString(36) });
    localStorage.setItem("ftrack_trading_sessions", JSON.stringify(sessions));
  } catch {}
  try { return await apiFetch("/trading", "POST", session); } catch(e) { console.warn(e); }
}
async function apiDeleteTrading(id) {
  try {
    const sessions = JSON.parse(localStorage.getItem("ftrack_trading_sessions") || "[]").filter(s => s.id !== id);
    localStorage.setItem("ftrack_trading_sessions", JSON.stringify(sessions));
  } catch {}
  try { await apiFetch(`/trading?id=${id}`, "DELETE"); } catch(e) { console.warn(e); }
}

// ---------- Savings ----------
async function apiGetSavings() {
  try {
    const items = await apiFetch("/savings");
    const goalEntry = items.find(c => c.type === "savings-goal");
    return {
      goal: goalEntry ? goalEntry.amount : (getSavings().goal || 0),
      contributions: items.filter(c => c.type === "savings")
    };
  } catch { return getSavings(); }
}
async function apiSetSavingsGoal(goal) {
  setSavingsGoal(goal);
  try {
    const all = await apiFetch("/savings");
    const existing = all.find(c => c.type === "savings-goal");
    if (existing) await apiFetch(`/savings?id=${existing.id}`, "DELETE");
    await apiFetch("/savings", "POST", { date: todayKey(), amount: goal, note: "Savings goal", type: "savings-goal" });
  } catch(e) { console.warn(e); }
}
async function apiAddSavingsContribution(amount, note) {
  addSavingsContribution(amount, note);
  try { await apiFetch("/savings", "POST", { date: todayKey(), amount, note: note || "", type: "savings" }); }
  catch(e) { console.warn(e); }
}
async function apiDeleteSavingsContribution(id) {
  deleteSavingsContribution(id);
  try { await apiFetch(`/savings?id=${id}`, "DELETE"); } catch(e) { console.warn(e); }
}

// ---------- Gym ----------
async function apiGetGym(date) {
  try {
    const results = await apiFetch(`/gym${date ? "?date=" + date : ""}`);
    return date ? (results[0] || null) : results;
  } catch {
    try {
      const log = JSON.parse(localStorage.getItem("ftrack_gym_log") || "{}");
      return date ? (log[date] || null) : Object.values(log);
    } catch { return date ? null : []; }
  }
}
async function apiSaveGym(session) {
  try {
    const log = JSON.parse(localStorage.getItem("ftrack_gym_log") || "{}");
    log[session.date] = session;
    localStorage.setItem("ftrack_gym_log", JSON.stringify(log));
  } catch {}
  try { return await apiFetch("/gym", "POST", session); } catch(e) { console.warn(e); }
}

// ---------- Food ----------
async function apiGetFood(date) {
  try {
    const results = await apiFetch(`/food${date ? "?date=" + date : ""}`);
    return date ? (results[0]?.log || {}) : results;
  } catch {
    try {
      const log = JSON.parse(localStorage.getItem("ftrack_food") || "{}");
      return date ? (log[date] || {}) : log;
    } catch { return date ? {} : {}; }
  }
}
async function apiSaveFood(date, log) {
  try {
    const stored = JSON.parse(localStorage.getItem("ftrack_food") || "{}");
    stored[date] = log;
    localStorage.setItem("ftrack_food", JSON.stringify(stored));
  } catch {}
  try { return await apiFetch("/food", "POST", { date, log }); } catch(e) { console.warn(e); }
}

// ---------- Habits ----------
async function apiGetHabits(date) {
  try {
    const results = await apiFetch(`/habits?date=${date}`);
    return results[0]?.habits || {};
  } catch {
    const day = getDay(date);
    return day.habits || {};
  }
}

// Fetch ALL habit days from Notion (for streaks/percentages across devices)
async function apiGetHabitsAll() {
  try {
    return await apiFetch("/habits");
  } catch {
    return [];
  }
}
async function apiSaveHabits(date, habits) {
  setHabit && HABIT_KEYS.forEach(k => setHabit(date, k, habits[k] || false));
  try { return await apiFetch("/habits", "POST", { date, habits }); } catch(e) { console.warn(e); }
}

// ---------- Schedule ----------
async function apiGetSchedule(date) {
  try {
    const results = await apiFetch(`/schedule?date=${date}`);
    return results[0]?.items || null;
  } catch { return null; }
}
async function apiSaveSchedule(date, items) {
  setSchedule(date, items);
  try { return await apiFetch("/schedule", "POST", { date, items }); } catch(e) { console.warn(e); }
}

// ---------- Todos ----------
async function apiGetTodos(date) {
  try {
    const results = await apiFetch(`/todos?date=${date}`);
    return results[0]?.items || [];
  } catch { return getTodos(date); }
}
async function apiSaveTodos(date, items) {
  setTodos(date, items);
  try { return await apiFetch("/todos", "POST", { date, items }); } catch(e) { console.warn(e); }
}

// ---------- Settings ----------
async function apiGetSettings() {
  try { return await apiFetch("/settings"); }
  catch { try { return JSON.parse(localStorage.getItem("ftrack_settings") || "{}"); } catch { return {}; } }
}
async function apiSaveSettings(data) {
  localStorage.setItem("ftrack_settings", JSON.stringify(data));
  try { return await apiFetch("/settings", "POST", data); } catch(e) { console.warn(e); }
}

// ---------- Gamify ----------
async function apiGetGamify() {
  try { return await apiFetch("/gamify"); }
  catch { try { return JSON.parse(localStorage.getItem("ftrack_gamify") || "{}"); } catch { return {}; } }
}
async function apiSaveGamify(data) {
  localStorage.setItem("ftrack_gamify", JSON.stringify(data));
  try { return await apiFetch("/gamify", "POST", data); } catch(e) { console.warn(e); }
}
