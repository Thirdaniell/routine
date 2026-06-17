// js/app.js — Today dashboard logic
(function () {
  const today = new Date();
  const key = todayKey();

  // ---------- Masthead ----------
  const dateOptions = { weekday: "long", month: "long", day: "numeric" };
  document.getElementById("today-date").textContent = today.toLocaleDateString("en-US", dateOptions);
  document.getElementById("today-year").textContent = today.getFullYear();

  // ---------- Streak strip ----------
  function renderStreaks() {
    document.getElementById("streak-overall").textContent = getOverallStreak();
    document.getElementById("streak-bible").textContent = getHabitWeeklyRate("bible") + "%";
    document.getElementById("streak-gym").textContent = getHabitWeeklyRate("gym") + "%";
    document.getElementById("streak-trading").textContent = getHabitWeeklyRate("trading") + "%";
  }

  // ---------- Schedule timeline ----------
  function renderSchedule() {
    const items = getSchedule(key);
    const rail = document.getElementById("timeline-rail");
    rail.innerHTML = "";
    items
      .slice()
      .sort((a, b) => a.time.localeCompare(b.time))
      .forEach((item) => {
        const el = document.createElement("div");
        el.className = "timeline-item" + (item.done ? " done" : "");
        el.innerHTML = `
          <div class="time">${item.time}</div>
          <div class="label-text">${item.label}</div>
        `;
        el.style.cursor = "pointer";
        el.title = "Click to toggle done";
        el.addEventListener("click", () => {
          item.done = !item.done;
          setSchedule(key, items);
          renderSchedule();
        });
        rail.appendChild(el);
      });
  }

  // ---------- Schedule editor modal ----------
  const scheduleModal = document.getElementById("schedule-modal");
  const scheduleListEl = document.getElementById("schedule-edit-list");

  function openScheduleEditor() {
    const items = getSchedule(key);
    scheduleListEl.innerHTML = "";
    items.forEach((item, idx) => {
      scheduleListEl.appendChild(buildScheduleRow(item, idx));
    });
    scheduleModal.classList.add("open");
  }

  function buildScheduleRow(item, idx) {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "8px";
    row.style.alignItems = "center";
    row.innerHTML = `
      <input type="time" class="time-input" value="${item.time}" style="width:110px" data-field="time" data-idx="${idx}">
      <input type="text" class="text-input" value="${item.label}" data-field="label" data-idx="${idx}" style="flex:1">
      <button class="btn btn-rust btn-small" data-remove="${idx}">✕</button>
    `;
    return row;
  }

  document.getElementById("edit-schedule-btn").addEventListener("click", openScheduleEditor);

  document.getElementById("add-schedule-row").addEventListener("click", () => {
    const idx = scheduleListEl.children.length;
    scheduleListEl.appendChild(buildScheduleRow({ time: "12:00", label: "New item", done: false }, idx));
  });

  scheduleListEl.addEventListener("click", (e) => {
    if (e.target.dataset.remove !== undefined) {
      e.target.closest("div").remove();
    }
  });

  document.getElementById("schedule-cancel").addEventListener("click", () => {
    scheduleModal.classList.remove("open");
  });

  document.getElementById("schedule-save").addEventListener("click", () => {
    const rows = Array.from(scheduleListEl.children);
    const items = rows.map(row => {
      const time = row.querySelector('[data-field="time"]').value || "00:00";
      const label = row.querySelector('[data-field="label"]').value || "Untitled";
      return { time, label, done: false };
    });
    setSchedule(key, items);
    scheduleModal.classList.remove("open");
    renderSchedule();
  });

  // ---------- Habit checkboxes ----------
  // Always read fresh from localStorage so logging a habit on another page
  // (e.g. Bible Study) is reflected correctly when returning to Today.

  function checkIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  }

  function refreshAllChecks() {
    const day = getDay(key); // always read fresh
    ["bible", "gym", "trading", "food", "sleep"].forEach(habitKey => {
      const controlEl = document.getElementById(`check-${habitKey}`);
      const stampEl = document.getElementById(`stamp-${habitKey}`);
      if (!controlEl) return;
      const val = !!(day.habits && day.habits[habitKey]);
      controlEl.classList.toggle("checked", val);
      if (stampEl) stampEl.classList.toggle("show", val);
    });
    renderStreaks();
  }

  function bindCheck(controlEl, stampEl, habitKey) {
    controlEl.addEventListener("click", () => {
      const day = getDay(key); // read fresh on every click
      const newVal = !(day.habits && day.habits[habitKey]);
      setHabit(key, habitKey, newVal);
      refreshAllChecks();
    });
  }

  // ---------- Gym card ----------
  function renderGymCard() {
    const split = getSplitDayForDate(today);
    const focusEl = document.getElementById("gym-focus");
    const linkEl = document.getElementById("gym-link");
    if (split) {
      focusEl.innerHTML = `<strong>Day ${split.day} — ${split.name}</strong><br>${split.focus}`;
      linkEl.href = `pages/workout-routines.html#day-${split.day}`;
      linkEl.textContent = "View today's routine →";
    } else {
      focusEl.innerHTML = `<strong>Rest day</strong><br>Recovery — light stretching or walk optional.`;
      linkEl.href = "pages/workout-routines.html";
      linkEl.textContent = "View full split →";
    }
  }

  // ---------- Money card ----------
  function renderMoneyCard() {
    const expenses = getExpenses();
    const todaysSpend = expenses
      .filter(e => e.date === key && e.method !== "payment")
      .reduce((sum, e) => sum + e.amount, 0);
    document.getElementById("money-today").textContent = `$${todaysSpend.toFixed(2)}`;

    const creditExpenses = expenses.filter(e => e.method === "credit").reduce((s, e) => s + e.amount, 0);
    const creditPayments = expenses.filter(e => e.method === "payment").reduce((s, e) => s + e.amount, 0);
    const balance = Math.max(0, creditExpenses - creditPayments);
    const pct = Math.min(100, Math.round((balance / 500) * 100));
    document.getElementById("credit-balance").textContent = `$${balance.toFixed(2)} / $500`;
    const barFill = document.getElementById("credit-bar-fill");
    barFill.style.width = pct + "%";
    barFill.style.background = pct >= 70 ? "var(--rust)" : pct >= 40 ? "var(--ochre)" : "var(--sage-deep)";
  }

  // ---------- To-Do card ----------
  function renderTodos() {
    const list = document.getElementById("todo-today-list");
    const todos = getTodos(key);
    if (todos.length === 0) {
      list.innerHTML = `<div style="font-size:0.82rem;color:var(--text-dark-dim);font-style:italic;">Nothing on the list yet.</div>`;
      return;
    }
    list.innerHTML = todos.map(t => `
      <div style="display:flex;align-items:center;gap:8px;">
        <input type="checkbox" ${t.done ? "checked" : ""} data-toggle="${t.id}" style="width:16px;height:16px;accent-color:var(--sage-deep);">
        <span style="flex:1;font-size:0.85rem;${t.done ? "text-decoration:line-through;color:var(--text-dark-dim);" : ""}">${t.text}</span>
        <button data-del="${t.id}" style="background:none;border:none;color:var(--text-dark-dim);cursor:pointer;">✕</button>
      </div>
    `).join("");

    list.querySelectorAll("[data-toggle]").forEach(cb => {
      cb.addEventListener("change", () => {
        toggleTodo(key, cb.dataset.toggle);
        renderTodos();
      });
    });
    list.querySelectorAll("[data-del]").forEach(btn => {
      btn.addEventListener("click", () => {
        deleteTodo(key, btn.dataset.del);
        renderTodos();
      });
    });
  }

  document.getElementById("todo-today-add").addEventListener("click", () => {
    const input = document.getElementById("todo-today-input");
    const text = input.value.trim();
    if (!text) return;
    addTodo(key, text);
    input.value = "";
    renderTodos();
  });

  document.getElementById("todo-today-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("todo-today-add").click();
  });

  // ---------- Refresh habits when tab becomes visible again ----------
  // This handles the case where you log a habit on another page/tab
  // and come back to Today — it re-reads localStorage immediately.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      refreshAllChecks();
      renderMoneyCard();
    }
  });

  // ---------- Init ----------
  renderStreaks();
  renderSchedule();
  renderGymCard();
  renderMoneyCard();
  renderTodos();

  // Bind checkbox click handlers
  ["bible", "gym", "trading", "food", "sleep"].forEach(habitKey => {
    const controlEl = document.getElementById(`check-${habitKey}`);
    const stampEl = document.getElementById(`stamp-${habitKey}`);
    if (controlEl) bindCheck(controlEl, stampEl, habitKey);
  });

  // Insert check icons and set initial state
  document.querySelectorAll(".check-control").forEach(el => {
    el.innerHTML = checkIcon();
  });
  refreshAllChecks();

})();
