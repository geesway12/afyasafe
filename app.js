// AfyaSafe app.js – fully updated with month fix and backdate navigation

const CAL_LS_KEY = { START: "afy_cal_period_start", LOGS: "afy_cal_logs" };
const COLOURS = {
  red: "#c62828", brown: "#b87333", darkbrown: "#4b2e2b",
  white: "#ffffff", gray: "#e0e0e0"
};
const BEAD_LABELS = [
  { type: "red", len: 1 }, { type: "brown", len: 5 }, { type: "darkbrown", len: 1 },
  { type: "brown", len: 7 }, { type: "white", len: 12 }, { type: "brown", len: 6 }
];

let calNow = new Date(), calViewYear = calNow.getFullYear(), calViewMonth = calNow.getMonth();
let calPeriodStart = localStorage.getItem(CAL_LS_KEY.START);
let calLogs = JSON.parse(localStorage.getItem(CAL_LS_KEY.LOGS) || "[]");

const todayISO = () => new Date().toISOString().split("T")[0];

function pad(n) { return n < 10 ? "0" + n : n; }
function toISO(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function ordinal(n) {
  if (n % 100 >= 11 && n % 100 <= 13) return n + 'th';
  switch (n % 10) {
    case 1: return n + 'st'; case 2: return n + 'nd'; case 3: return n + 'rd';
    default: return n + 'th';
  }
}
function niceDate(iso) {
  const d = new Date(iso);
  return `${ordinal(d.getDate())} ${d.toLocaleString('en', { month: 'short' })} ${d.getFullYear()}`;
}
function beadPattern() {
  let arr = [];
  for (let seg of BEAD_LABELS)
    for (let i = 0; i < seg.len; ++i) arr.push(seg.type);
  return arr;
}

function renderCalendarGrid() {
  const $grid = document.getElementById('calendar-grid');
  const $month = document.getElementById('calendar-month');
  const $streak = document.getElementById('streak-count');
  const $summary = document.getElementById('calendar-summary');
  const $tip = document.getElementById('cycle-tip');
  const $logBtn = document.getElementById('log-today-btn');

  const year = calViewYear, month = calViewMonth;
  const days = daysInMonth(year, month);
  const startDay = new Date(year, month, 1).getDay();
  let html = '<div class="d-flex mb-1" style="font-weight:600">';
  ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].forEach(d =>
    html += `<div class="calcell-head">${d}</div>`);
  html += '</div><div class="d-flex flex-wrap">';

  let dayOfWeek = (startDay + 6) % 7;
  for (let i = 0; i < dayOfWeek; ++i)
    html += '<div class="calcell calcell-empty"></div>';

  let colorByDay = {};
  if (calPeriodStart) {
    const first = new Date(calPeriodStart);
    const pattern = beadPattern();
    for (let i = 0; i < 32; ++i) {
      const dt = new Date(first);
      dt.setDate(dt.getDate() + i);
      colorByDay[dt.toISOString().slice(0, 10)] = pattern[i];
    }
  }

  let streak = 0, todayStr = todayISO();
  let loggedToday = calLogs.includes(todayStr);
  for (let d = 1; d <= days; ++d) {
    const iso = toISO(year, month, d);
    let color = colorByDay[iso] || "gray";
    let classes = "calcell";
    let style = `background:${COLOURS[color] || "#e0e0e0"};`;
    if (color === "white") style += "border:2px solid #4b2e2b;";
    if (iso === calPeriodStart) classes += " periodstart";
    if (calLogs.includes(iso)) {
      classes += " logged";
      if (iso <= todayStr) streak++;
    }
    html += `<div class="${classes}" style="${style}" data-iso="${iso}">${d}</div>`;
  }
  html += "</div>";

  $grid.innerHTML = html;
  if ($month) $month.textContent = new Date(year, month).toLocaleString('en', { month: 'long' }) + " " + year;
  if ($streak) $streak.textContent = streak;
  if ($logBtn) $logBtn.style.display = loggedToday ? "none" : "";
  if ($tip) $tip.textContent = calPeriodStart ? "Tap 'Log Today' if you menstruated today!" : "Tap any past day to start your period cycle.";
  if ($summary) $summary.textContent = calPeriodStart
    ? "Cycle started: " + niceDate(calPeriodStart)
    : "Tap the first day of your period to start, even from past dates.";
}

document.getElementById('calendar-grid')?.addEventListener('click', e => {
  if (e.target.classList.contains('calcell') && e.target.dataset.iso) {
    let iso = e.target.getAttribute('data-iso');
    if (!calPeriodStart) {
      calPeriodStart = iso;
      localStorage.setItem(CAL_LS_KEY.START, calPeriodStart);
      const pickedDate = new Date(iso);
      calViewYear = pickedDate.getFullYear();
      calViewMonth = pickedDate.getMonth();
      renderCalendarGrid();
    }
  }
});

document.getElementById('log-today-btn')?.addEventListener('click', () => {
  let todayStr = todayISO();
  if (!calLogs.includes(todayStr)) {
    calLogs.push(todayStr);
    localStorage.setItem(CAL_LS_KEY.LOGS, JSON.stringify(calLogs));
    renderCalendarGrid();
  }
});

document.getElementById('prev-month')?.addEventListener('click', () => {
  calViewMonth--;
  if (calViewMonth < 0) { calViewMonth = 11; calViewYear--; }
  renderCalendarGrid();
});

document.getElementById('next-month')?.addEventListener('click', () => {
  calViewMonth++;
  if (calViewMonth > 11) { calViewMonth = 0; calViewYear++; }
  renderCalendarGrid();
});

window.addEventListener('load', () => {
  calViewYear = calNow.getFullYear();
  calViewMonth = calNow.getMonth();
  renderCalendarGrid();
});

document.getElementById('reset-cycle-btn')?.addEventListener('click', () => {
  if (confirm('Are you sure you want to reset your cycle and clear logs?')) {
    localStorage.removeItem(CAL_LS_KEY.START);
    localStorage.removeItem(CAL_LS_KEY.LOGS);
    calPeriodStart = null;
    calLogs = [];
    renderCalendarGrid();
  }
});
