// js/api.js
// API layer — talks to the Cloudflare Worker, falls back to localStorage if offline

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
  try { return await apiFetch("/expenses", "POST", expense); } catch(e) { console.warn("expense save failed", e); }
}
async function apiDeleteExpense(id) {
  deleteExpense(id);
  try { await apiFetch(`/expenses?id=${id}`, "DELETE"); } catch(e) { console.warn("expense delete failed", e); }
}

// ---------- Income ----------
async function apiGetIncome() {
  try { return await apiFetch("/income"); } catch { return getIncome(); }
}
async function apiAddIncome(entry) {
  addIncome(entry);
  try { return await apiFetch("/income", "POST", entry); } catch(e) { console.warn("income save failed", e); }
}
async function apiDeleteIncome(id) {
  deleteIncome(id);
  try { await apiFetch(`/income?id=${id}`, "DELETE"); } catch(e) { console.warn("income delete failed", e); }
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
  try { return await apiFetch("/bible", "POST", entry); } catch(e) { console.warn("bible save failed", e); }
}
async function apiDeleteBible(id) {
  try {
    const entries = JSON.parse(localStorage.getItem("ftrack_bible_entries") || "[]").filter(e => e.id !== id);
    localStorage.setItem("ftrack_bible_entries", JSON.stringify(entries));
  } catch {}
  try { await apiFetch(`/bible?id=${id}`, "DELETE"); } catch(e) { console.warn("bible delete failed", e); }
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
  try { return await apiFetch("/trading", "POST", session); } catch(e) { console.warn("trading save failed", e); }
}
async function apiDeleteTrading(id) {
  try {
    const sessions = JSON.parse(localStorage.getItem("ftrack_trading_sessions") || "[]").filter(s => s.id !== id);
    localStorage.setItem("ftrack_trading_sessions", JSON.stringify(sessions));
  } catch {}
  try { await apiFetch(`/trading?id=${id}`, "DELETE"); } catch(e) { console.warn("trading delete failed", e); }
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
  } catch(e) { console.warn("savings goal save failed", e); }
}
async function apiAddSavingsContribution(amount, note) {
  addSavingsContribution(amount, note);
  try { await apiFetch("/savings", "POST", { date: todayKey(), amount, note: note || "", type: "savings" }); }
  catch(e) { console.warn("savings contribution save failed", e); }
}
async function apiDeleteSavingsContribution(id) {
  deleteSavingsContribution(id);
  try { await apiFetch(`/savings?id=${id}`, "DELETE"); } catch(e) { console.warn("savings delete failed", e); }
}
