// AfyaSafe app.js – calendar, profile, and learn logic

const CAL_LS_KEY = { START: "afy_cal_period_start", LOGS: "afy_cal_logs" };
const PROFILE_KEY = "afyaUserProfile";
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

// =============================
// 🩸 Calendar UI
// =============================
export function renderCalendarGrid() {
  const $grid = document.getElementById('calendar-grid');
  const $month = document.getElementById('calendar-month');
  const $streak = document.getElementById('streak-count');
  const $summary = document.getElementById('calendar-summary');
  const $tip = document.getElementById('cycle-tip');
  const $logBtn = document.getElementById('log-today-btn');

  // Only render if calendar grid exists (index.html)
  if (!$grid) return;

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
  if ($tip) {
    $tip.textContent = calPeriodStart
      ? "Tap any past day to log your period, or 'Log Today' if you menstruated today!"
      : "Tap any past day to start your period cycle.";
  }
  if ($summary) $summary.textContent = calPeriodStart
    ? "Cycle started: " + niceDate(calPeriodStart)
    : "Tap the first day of your period to start, even from past dates.";
}

// =============================
// 🔁 Calendar Interactions
// =============================

// Calendar grid click (start period)
const $calendarGrid = document.getElementById('calendar-grid');
if ($calendarGrid) {
  $calendarGrid.addEventListener('click', e => {
    if (e.target.classList.contains('calcell') && e.target.dataset.iso) {
      let iso = e.target.getAttribute('data-iso');
      const todayStr = todayISO();

      // If no period started, set start date
      if (!calPeriodStart) {
        calPeriodStart = iso;
        localStorage.setItem(CAL_LS_KEY.START, calPeriodStart);
        // Save first log timestamp
        if (!localStorage.getItem('firstLogTime')) {
          localStorage.setItem('firstLogTime', Date.now().toString());
        }
        const pickedDate = new Date(iso);
        calViewYear = pickedDate.getFullYear();
        calViewMonth = pickedDate.getMonth();
        renderCalendarGrid();
      } else {
        // If period already started, allow logging any day up to today
        if (!calLogs.includes(iso) && iso <= todayStr) {
          calLogs.push(iso);
          localStorage.setItem(CAL_LS_KEY.LOGS, JSON.stringify(calLogs));
          // Save first log timestamp if not already set
          if (!localStorage.getItem('firstLogTime')) {
            localStorage.setItem('firstLogTime', Date.now().toString());
          }
          renderCalendarGrid();
        }
      }
    }
  });
}

// Log today button
const $logTodayBtn = document.getElementById('log-today-btn');
if ($logTodayBtn) {
  $logTodayBtn.addEventListener('click', () => {
    let todayStr = todayISO();
    if (!calLogs.includes(todayStr)) {
      calLogs.push(todayStr);
      localStorage.setItem(CAL_LS_KEY.LOGS, JSON.stringify(calLogs));
      // Save first log timestamp if not already set
      if (!localStorage.getItem('firstLogTime')) {
        localStorage.setItem('firstLogTime', Date.now().toString());
      }
      renderCalendarGrid();
    }
  });
}

// Prev/next month buttons
const $prevMonth = document.getElementById('prev-month');
if ($prevMonth) {
  $prevMonth.addEventListener('click', () => {
    calViewMonth--;
    if (calViewMonth < 0) { calViewMonth = 11; calViewYear--; }
    renderCalendarGrid();
  });
}
const $nextMonth = document.getElementById('next-month');
if ($nextMonth) {
  $nextMonth.addEventListener('click', () => {
    calViewMonth++;
    if (calViewMonth > 11) { calViewMonth = 0; calViewYear++; }
    renderCalendarGrid();
  });
}

// Reset cycle button
const $resetBtn = document.getElementById('reset-cycle-btn');
if ($resetBtn) {
  $resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset your cycle and clear logs?')) {
      localStorage.removeItem(CAL_LS_KEY.START);
      localStorage.removeItem(CAL_LS_KEY.LOGS);
      calPeriodStart = null;
      calLogs = [];
      renderCalendarGrid();
    }
  });
}

// Render calendar on load (only if calendar exists)
window.addEventListener('load', () => {
  if (document.getElementById('calendar-grid')) {
    calViewYear = calNow.getFullYear();
    calViewMonth = calNow.getMonth();
    renderCalendarGrid();
  }
  // Only show prompt 24 hours after first log
  const firstLogTime = parseInt(localStorage.getItem('firstLogTime') || "0", 10);
  const prompted = localStorage.getItem('cycleLogPrompted');
  if (firstLogTime && !prompted) {
    const now = Date.now();
    if (now - firstLogTime >= 24 * 60 * 60 * 1000) {
      setTimeout(() => {
        alert('Don’t forget to log your cycle today!');
        localStorage.setItem('cycleLogPrompted', 'yes');
      }, 1000); // Show after 1 second
    }
  }
});

// =============================
// 👩🏾 Profile & Learn Logic
// =============================

export function getAfyaUser() {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return { nickname: 'Sister', age: 0 };
  try {
    return JSON.parse(raw);
  } catch {
    return { nickname: 'Sister', age: 0 };
  }
}

export function getUserLearnBlock(age) {
  if (age <= 13) return { key: 'teen', count: 8 };           // t1.png–t8.png
  if (age <= 18) return { key: 'adolescent', count: 6 };     // ad1.png–ad6.png
  if (age <= 30) return { key: 'youngadult', count: 6 };     // ya1.png–ya6.png
  return { key: 'mother', count: 6 };                        // m1.png–m6.png
}

// Profile modal logic (settings)
const nickInput = document.getElementById('set-nickname');
const ageInput = document.getElementById('set-age');

// Pre-fill current profile if form exists
const user = getAfyaUser();
if (nickInput && ageInput && user.nickname) {
  nickInput.value = user.nickname;
  ageInput.value = user.age;
}

// Save profile on submit
const $settingsForm = document.getElementById('settingsForm');
if ($settingsForm) {
  $settingsForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const nickname = nickInput.value.trim();
    const age = parseInt(ageInput.value.trim());
    if (!nickname || isNaN(age) || age < 8 || age > 70) {
      alert("Please enter a valid age between 8 and 70.");
      return;
    }
    const profile = { nickname, age };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    // Hide modal and reload to update all personalized content
    if (window.bootstrap && bootstrap.Modal.getInstance) {
      const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
      if (modal) modal.hide();
    }
    location.reload();
  });
}

// Show install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Show your custom install button
  const installBtn = document.getElementById('installAppBtn');
  if (installBtn) installBtn.style.display = 'block';
});

// Handle install button click
document.getElementById('installAppBtn')?.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    document.getElementById('installAppBtn').style.display = 'none';
  }
});

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(reg => {
    reg.onupdatefound = () => {
      const installingWorker = reg.installing;
      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // Show update prompt
            alert('AfyaSafe has been updated! Please refresh for the latest version.');
          }
        }
      };
    };
  });
}
