/* ═══════════════════════════════════════════════════════════
   Zomato Bangalore Analytics — app.js
   Design: warm, editorial, handcrafted
   Data: 51,717 restaurants, fully intact
═══════════════════════════════════════════════════════════ */

'use strict';

/* ── Theme-aware palette ─────────────────────────────────────
   Colours are defined once, in style.css (custom properties).
   - <canvas> charts can't use var(), so we read the resolved values
     with getComputedStyle() and refresh them on every theme change.
   - DOM elements built below use var(--name) / color-mix() directly,
     so the browser re-themes them with no JS at all.              */
const PALETTE_KEYS = ['terracotta', 'ochre', 'sage', 'slate', 'rose',
                      'gold', 'olive', 'plum', 'umber', 'teal'];
const PALETTE = {};   // resolved hex values (for canvas)
const THEME   = {};   // chart "chrome": grid, ticks, tooltip …

const rootEl = document.documentElement;
const cssVar = name => getComputedStyle(rootEl).getPropertyValue(name).trim();

function readThemeTokens() {
  PALETTE_KEYS.forEach(k => { PALETTE[k] = cssVar('--' + k); });
  THEME.boost         = parseFloat(cssVar('--fill-boost')) || 0;   // dark mode lifts fills
  THEME.grid          = cssVar('--chart-grid');
  THEME.tick          = cssVar('--chart-tick');
  THEME.text          = cssVar('--chart-text');
  THEME.border        = cssVar('--border');
  THEME.tooltipBg     = cssVar('--tooltip-bg');
  THEME.tooltipTitle  = cssVar('--tooltip-title');
  THEME.tooltipBody   = cssVar('--tooltip-body');
  THEME.tooltipBorder = cssVar('--tooltip-border');
}
readThemeTokens();

/* Translucent fill from a 6-digit hex (canvas) */
function warmFill(hex, a = 0.22) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

function keyAt(i)   { return PALETTE_KEYS[i % PALETTE_KEYS.length]; }
function colorAt(i) { return PALETTE[keyAt(i)]; }

/* Scriptable dataset colours: Chart.js re-evaluates these on every
   update(), which is how charts pick up the new theme.              */
const boosted = a => Math.min(1, a + THEME.boost);   // keeps fills vivid on dark cards
const barFill = (a = 0.55) => ctx => warmFill(colorAt(ctx.dataIndex), boosted(a));
const barEdge = ctx => colorAt(ctx.dataIndex);

/* DOM colour helpers (resolved by CSS, so they follow the theme) */
const tone = key => `var(--${key})`;
const tint = (key, a) =>
  `color-mix(in srgb, var(--${key}) ${Math.round(a * 100)}%, transparent)`;

/* ── Dataset: 51,717 Bangalore restaurants ──────────────── */
const DATA = {
  totalRestaurants: 51717,
  totalRated:       41665,
  avgRating:        3.7,
  avgVotes:         284,
  avgCost:          555,
  minCost:          40,
  maxCost:          6000,

  onlineOrder: { Yes: 30444, No: 21273 },
  bookTable:   { Yes: 6449,  No: 45268 },

  listingType: {
    'Delivery':           25942,
    'Dine-out':           17779,
    'Desserts':            3593,
    'Cafes':               1723,
    'Drinks & Nightlife':  1101,
    'Buffet':               882,
    'Pubs and Bars':        697,
  },

  ratingDist: {
    '1.5':   5,
    '2.0':   182,
    '2.5':   2070,
    '3.0':   9243,
    '3.5':   17766,
    '4.0':   11155,
    '4.5':   1244,
  },

  restTypes: [
    ['Quick Bites',    20639],
    ['Casual Dining',  13057],
    ['Cafe',            5074],
    ['Delivery',        4641],
    ['Dessert Parlor',  3211],
    ['Bar',             2457],
    ['Takeaway',        2157],
    ['Bakery',          1998],
    ['Beverage Shop',   1471],
    ['Pub',              950],
    ['Food Court',       765],
    ['Sweet Shop',       745],
    ['Lounge',           555],
    ['Fine Dining',      405],
    ['Microbrewery',     390],
  ],

  cuisines: [
    ['North Indian',  21085],
    ['Chinese',       15547],
    ['South Indian',   8644],
    ['Fast Food',      8096],
    ['Biryani',        6492],
    ['Continental',    5765],
    ['Desserts',       5633],
    ['Cafe',           5303],
    ['Beverages',      4747],
    ['Italian',        3389],
    ['Bakery',         2840],
    ['Street Food',    2595],
    ['Pizza',          2073],
    ['Burger',         2009],
    ['Seafood',        1810],
    ['Ice Cream',      1774],
    ['Andhra',         1760],
    ['Mughlai',        1570],
    ['Rolls',          1470],
    ['American',       1461],
  ],

  locations: [
    ['BTM',                    5124],
    ['HSR',                    2523],
    ['Koramangala 5th Block',  2504],
    ['JP Nagar',               2235],
    ['Whitefield',             2144],
    ['Indiranagar',            2083],
    ['Jayanagar',              1926],
    ['Marathahalli',           1846],
    ['Bannerghatta Road',      1630],
    ['Bellandur',              1286],
    ['Electronic City',        1258],
    ['Koramangala 1st Block',  1238],
    ['Brigade Road',           1218],
    ['Koramangala 7th Block',  1181],
    ['Koramangala 6th Block',  1156],
    ['Sarjapur Road',          1065],
    ['Ulsoor',                 1023],
    ['Koramangala 4th Block',  1017],
    ['MG Road',                 918],
    ['Banashankari',            906],
  ],

  costByType: [
    ['Fine Dining',    1800],
    ['Microbrewery',   1200],
    ['Lounge',         1100],
    ['Pub',             900],
    ['Bar',             800],
    ['Casual Dining',   700],
    ['Cafe',            500],
    ['Food Court',      380],
    ['Dessert Parlor',  350],
    ['Bakery',          300],
    ['Beverage Shop',   250],
    ['Takeaway',        230],
    ['Quick Bites',     220],
    ['Delivery',        200],
    ['Sweet Shop',      150],
  ],

  costRanges: [
    { label: 'Under \u20b9200',   count: 9200,  emoji: '\uD83E\uDD11' },
    { label: '\u20b9200\u2013400', count: 14800, emoji: '\uD83D\uDC4D' },
    { label: '\u20b9400\u2013600', count: 12100, emoji: '\uD83C\uDF7D\uFE0F' },
    { label: '\u20b9600\u2013800', count: 5300,  emoji: '\u2728' },
    { label: '\u20b9800\u20131000',count: 3100,  emoji: '\uD83C\uDFA9' },
    { label: 'Over \u20b91000',    count: 2900,  emoji: '\uD83D\uDC8E' },
  ],
};

/* ── Chart.js global defaults: warm, editorial ──────────── */
Chart.defaults.font.family = "'DM Sans', system-ui, sans-serif";
Chart.defaults.font.size   = 12;

/* Custom update mode: colours cross-fade in ~0.4s when the theme flips */
Chart.defaults.transitions.theme = { animation: { duration: 420, easing: 'easeOutCubic' } };

/* Colour-related defaults, re-applied whenever the theme changes.
   (Object.assign keeps Chart.js's own tooltip defaults intact.)      */
function applyChartTheme() {
  readThemeTokens();
  Chart.defaults.color       = THEME.text;
  Chart.defaults.borderColor = THEME.grid;
  Object.assign(Chart.defaults.plugins.tooltip, {
    enabled:         true,
    backgroundColor: THEME.tooltipBg,
    titleColor:      THEME.tooltipTitle,
    bodyColor:       THEME.tooltipBody,
    borderColor:     THEME.tooltipBorder,
    borderWidth:     1.5,
    padding:         14,
    cornerRadius:    10,
    displayColors:   true,
    boxWidth:        10,
    boxHeight:       10,
  });
}
applyChartTheme();

/* Shared grid / tick style. Functions = scriptable options, so these
   are re-read on each update() and follow the theme automatically.   */
const WARM_GRID = { color: () => THEME.grid, lineWidth: 1 };
const WARM_TICK = { color: () => THEME.tick };

/* ═══════════════════════════════════════════════════════════
   THEME MANAGER  (light / dark)
   Priority: saved choice → OS preference → light.
   The inline <head> script sets data-theme before first paint;
   this keeps the toggle, charts, storage and OS changes in sync.
═══════════════════════════════════════════════════════════ */
const THEME_KEY    = 'zomato-analytics-theme';
const themeToggle  = document.getElementById('themeToggle');
const metaTheme    = document.getElementById('metaThemeColor');
const prefersDark  = window.matchMedia('(prefers-color-scheme: dark)');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let   themeTimer;

function savedTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return (t === 'light' || t === 'dark') ? t : null;
  } catch (e) { return null; }
}

const activeTheme = () => rootEl.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

function syncThemeUI() {
  const dark = activeTheme() === 'dark';
  if (themeToggle) {
    themeToggle.setAttribute('aria-checked', String(dark));
    themeToggle.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
  }
  if (metaTheme) metaTheme.content = cssVar('--bg-header');
}

function setTheme(theme, { persist = false, animate = false } = {}) {
  const fade = animate && !reduceMotion.matches;

  if (fade) {
    rootEl.classList.add('theme-transition');
    clearTimeout(themeTimer);
    themeTimer = setTimeout(() => rootEl.classList.remove('theme-transition'), 520);
  }

  rootEl.setAttribute('data-theme', theme);

  if (persist) {
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }

  applyChartTheme();
  Object.values(Chart.instances).forEach(chart => chart.update(fade ? 'theme' : 'none'));

  syncThemeUI();
  window.dispatchEvent(new Event('themechange'));
}

setTheme(savedTheme() || (prefersDark.matches ? 'dark' : 'light'));

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    setTheme(activeTheme() === 'dark' ? 'light' : 'dark', { persist: true, animate: true });
  });
}

prefersDark.addEventListener('change', e => {
  if (!savedTheme()) setTheme(e.matches ? 'dark' : 'light', { animate: true });
});

window.addEventListener('storage', e => {
  if (e.key === THEME_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
    setTheme(e.newValue, { animate: true });
  }
});

/* ── Tab navigation ─────────────────────────────────────── */
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('section-' + tab.dataset.section).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

/* ── Counter animations ─────────────────────────────────── */
function animateCounter(el, target, duration = 1800) {
  let start = null;
  const step = ts => {
    if (!start) start = ts;
    const p    = Math.min((ts - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(ease * target).toLocaleString('en-IN');
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

document.querySelectorAll('.counter[data-target]').forEach(el => {
  animateCounter(el, +el.dataset.target);
});

/* ═══════════════════════════════════════════════════════════
   OVERVIEW CHARTS
═══════════════════════════════════════════════════════════ */

new Chart(document.getElementById('chartListingType'), {
  type: 'bar',
  data: {
    labels: Object.keys(DATA.listingType),
    datasets: [{
      data:            Object.values(DATA.listingType),
      backgroundColor: barFill(0.55),
      borderColor:     barEdge,
      borderWidth:     1.5,
      borderRadius:    7,
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: WARM_GRID, ticks: WARM_TICK },
      y: {
        grid: WARM_GRID,
        ticks: { ...WARM_TICK, callback: v => v.toLocaleString('en-IN') }
      }
    }
  }
});

new Chart(document.getElementById('chartOnlineOrder'), {
  type: 'doughnut',
  data: {
    labels: ['Online Orders', 'No Online Orders'],
    datasets: [{
      data:            [DATA.onlineOrder.Yes, DATA.onlineOrder.No],
      backgroundColor: ctx => ctx.dataIndex === 0 ? warmFill(PALETTE.sage, boosted(0.75)) : warmFill(PALETTE.umber, 0.18),
      borderColor:     ctx => ctx.dataIndex === 0 ? PALETTE.sage : THEME.border,
      borderWidth:     2,
      hoverOffset:     10,
    }]
  },
  options: {
    cutout: '72%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: { padding: 14, font: { size: 11 }, boxWidth: 12 }
      }
    }
  }
});

new Chart(document.getElementById('chartBookTable'), {
  type: 'doughnut',
  data: {
    labels: ['Accepts Booking', 'No Booking'],
    datasets: [{
      data:            [DATA.bookTable.Yes, DATA.bookTable.No],
      backgroundColor: ctx => ctx.dataIndex === 0 ? warmFill(PALETTE.slate, boosted(0.75)) : warmFill(PALETTE.umber, 0.18),
      borderColor:     ctx => ctx.dataIndex === 0 ? PALETTE.slate : THEME.border,
      borderWidth:     2,
      hoverOffset:     10,
    }]
  },
  options: {
    cutout: '72%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: { padding: 14, font: { size: 11 }, boxWidth: 12 }
      }
    }
  }
});

/* ═══════════════════════════════════════════════════════════
   RATINGS CHARTS
═══════════════════════════════════════════════════════════ */

const ratingKeyMap = {
  '1.5': 'rose',
  '2.0': 'rose',
  '2.5': 'ochre',
  '3.0': 'gold',
  '3.5': 'olive',
  '4.0': 'sage',
  '4.5': 'teal',
};
const ratingKeys  = Object.keys(DATA.ratingDist);
const ratingColor = k => PALETTE[ratingKeyMap[k]];

new Chart(document.getElementById('chartRatingDist'), {
  type: 'bar',
  data: {
    labels: Object.keys(DATA.ratingDist).map(l => `\u2605 ${l}`),
    datasets: [{
      data:            Object.values(DATA.ratingDist),
      backgroundColor: ctx => warmFill(ratingColor(ratingKeys[ctx.dataIndex]), boosted(0.58)),
      borderColor:     ctx => ratingColor(ratingKeys[ctx.dataIndex]),
      borderWidth:     1.5,
      borderRadius:    8,
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.parsed.y.toLocaleString('en-IN')} restaurants`
        }
      }
    },
    scales: {
      x: { grid: WARM_GRID, ticks: WARM_TICK },
      y: {
        grid: WARM_GRID,
        ticks: { ...WARM_TICK, callback: v => v.toLocaleString('en-IN') }
      }
    }
  }
});

const rbEl = document.getElementById('ratingBreakdown');
const total = DATA.totalRated;
Object.entries(DATA.ratingDist).forEach(([r, cnt]) => {
  const pct = (cnt / total * 100).toFixed(1);
  const col = tone(ratingKeyMap[r]);
  rbEl.innerHTML += `
    <div class="rb-row">
      <div class="rb-label">\u2605 ${r}</div>
      <div class="rb-bar-wrap">
        <div class="rb-bar" style="width:${pct}%;background:${col}"></div>
      </div>
      <div class="rb-val">${pct}%</div>
    </div>`;
});

new Chart(document.getElementById('chartTypeRating'), {
  type: 'bar',
  data: {
    labels: DATA.restTypes.slice(0,10).map(d => d[0]),
    datasets: [{
      data:            DATA.restTypes.slice(0,10).map(d => d[1]),
      backgroundColor: barFill(0.55),
      borderColor:     barEdge,
      borderWidth:     1.5,
      borderRadius:    6,
    }]
  },
  options: {
    indexAxis: 'y',
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: WARM_GRID,
        ticks: { ...WARM_TICK, callback: v => v.toLocaleString('en-IN') }
      },
      y: { grid: { display: false }, ticks: { ...WARM_TICK, font: { size: 11 } } }
    }
  }
});

const tiers = [
  { emoji: '\uD83C\uDFC6', name: 'Excellent (4.0\u20135.0)', desc: 'Top tier dining',      count: DATA.ratingDist['4.0'] + DATA.ratingDist['4.5'], color: tone('sage') },
  { emoji: '\uD83D\uDC4D', name: 'Good (3.5\u20133.9)',      desc: 'Above average',         count: DATA.ratingDist['3.5'],                           color: tone('olive') },
  { emoji: '\uD83D\uDE10', name: 'Average (3.0\u20133.4)',   desc: 'Meets expectations',    count: DATA.ratingDist['3.0'],                           color: tone('gold') },
  { emoji: '\uD83D\uDE15', name: 'Below Avg (2.5\u20132.9)', desc: 'Needs improvement',     count: DATA.ratingDist['2.5'],                           color: tone('ochre') },
  { emoji: '\u26A0\uFE0F', name: 'Poor (under 2.5)',         desc: 'Significantly below',   count: DATA.ratingDist['2.0'] + DATA.ratingDist['1.5'],  color: tone('rose') },
];

const tierEl = document.getElementById('tierList');
tiers.forEach(t => {
  tierEl.innerHTML += `
    <div class="tier-item">
      <div class="tier-emoji">${t.emoji}</div>
      <div class="tier-info">
        <div class="tier-name">${t.name}</div>
        <div class="tier-desc">${t.desc}</div>
      </div>
      <div class="tier-count" style="color:${t.color}">${t.count.toLocaleString('en-IN')}</div>
    </div>`;
});

/* ═══════════════════════════════════════════════════════════
   CUISINE CHARTS
═══════════════════════════════════════════════════════════ */

new Chart(document.getElementById('chartCuisines'), {
  type: 'bar',
  data: {
    labels: DATA.cuisines.map(d => d[0]),
    datasets: [{
      data:            DATA.cuisines.map(d => d[1]),
      backgroundColor: barFill(0.55),
      borderColor:     barEdge,
      borderWidth:     1.5,
      borderRadius:    6,
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: WARM_GRID, ticks: { ...WARM_TICK, maxRotation: 38, font: { size: 10 } } },
      y: {
        grid: WARM_GRID,
        ticks: { ...WARM_TICK, callback: v => (v/1000).toFixed(0) + 'k' }
      }
    }
  }
});

new Chart(document.getElementById('chartRestTypes'), {
  type: 'pie',
  data: {
    labels: DATA.restTypes.slice(0,8).map(d => d[0]),
    datasets: [{
      data:            DATA.restTypes.slice(0,8).map(d => d[1]),
      backgroundColor: barFill(0.72),
      borderColor:     barEdge,
      borderWidth:     2,
      hoverOffset:     10,
    }]
  },
  options: {
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: { padding: 10, font: { size: 10 }, boxWidth: 12 }
      }
    }
  }
});

const cuisineGrid = document.getElementById('cuisineGrid');
const maxC = DATA.cuisines[0][1];

DATA.cuisines.forEach(([name, cnt], i) => {
  const key   = keyAt(i);
  const size  = 0.72 + (cnt / maxC) * 0.72;
  cuisineGrid.innerHTML += `
    <div class="cuisine-bubble"
         style="padding:${0.38 + (cnt/maxC)*0.25}rem ${0.8 + (cnt/maxC)*0.4}rem;
                font-size:${size * 0.82}rem;
                background:${tint(key, 0.14)};
                border-color:${tint(key, 0.45)};
                color:${tone(key)};"
         title="${cnt.toLocaleString('en-IN')} restaurants">
      ${name}
      <span style="opacity:0.55;font-size:.75em;">${(cnt/1000).toFixed(1)}k</span>
    </div>`;
});

/* ═══════════════════════════════════════════════════════════
   LOCATION CHARTS
═══════════════════════════════════════════════════════════ */

new Chart(document.getElementById('chartLocations'), {
  type: 'bar',
  data: {
    labels: DATA.locations.map(d => d[0]),
    datasets: [{
      data:            DATA.locations.map(d => d[1]),
      backgroundColor: barFill(0.55),
      borderColor:     barEdge,
      borderWidth:     1.5,
      borderRadius:    6,
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: WARM_GRID, ticks: { ...WARM_TICK, maxRotation: 40, font: { size: 10 } } },
      y: {
        grid: WARM_GRID,
        ticks: { ...WARM_TICK, callback: v => v.toLocaleString('en-IN') }
      }
    }
  }
});

const lbEl = document.getElementById('locationLeaderboard');
DATA.locations.forEach(([name, cnt], i) => {
  const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
  lbEl.innerHTML += `
    <div class="lb-item">
      <div class="lb-rank ${rankClass}">${i + 1}</div>
      <div class="lb-name">${name}</div>
      <div class="lb-count">${cnt.toLocaleString('en-IN')}</div>
    </div>`;
});

const hmEl   = document.getElementById('heatmapGrid');
const maxLoc = DATA.locations[0][1];

DATA.locations.forEach(([name, cnt]) => {
  const t = cnt / maxLoc;
  hmEl.innerHTML += `
    <div class="hm-cell" data-t="${t.toFixed(4)}" title="${name}: ${cnt.toLocaleString('en-IN')} restaurants">
      <div class="hm-name" style="color:var(--text-1);">${name}</div>
      <div class="hm-val"  style="color:var(--text-1);">${cnt.toLocaleString('en-IN')}</div>
    </div>`;
});

function paintHeatmap() {
  hmEl.querySelectorAll('.hm-cell').forEach(cell => {
    const t     = +cell.dataset.t;
    const hue   = `color-mix(in srgb, var(--sage) ${Math.round(t * 100)}%, var(--terracotta))`;
    const alpha = Math.min(1, 0.12 + t * 0.42 + THEME.boost * 0.6);
    cell.style.background = `color-mix(in srgb, ${hue} ${Math.round(alpha * 100)}%, transparent)`;
  });
}
paintHeatmap();
window.addEventListener('themechange', paintHeatmap);

/* ═══════════════════════════════════════════════════════════
   COST CHARTS
═══════════════════════════════════════════════════════════ */

new Chart(document.getElementById('chartCostDist'), {
  type: 'bar',
  data: {
    labels: DATA.costRanges.map(d => d.label),
    datasets: [{
      data:            DATA.costRanges.map(d => d.count),
      backgroundColor: barFill(0.55),
      borderColor:     barEdge,
      borderWidth:     1.5,
      borderRadius:    8,
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: WARM_GRID, ticks: WARM_TICK },
      y: {
        grid: WARM_GRID,
        ticks: { ...WARM_TICK, callback: v => v.toLocaleString('en-IN') }
      }
    }
  }
});

const segEl  = document.getElementById('segmentList');
const maxSeg = Math.max(...DATA.costRanges.map(d => d.count));

DATA.costRanges.forEach((seg, i) => {
  const pct = Math.round(seg.count / maxSeg * 100);
  const col = tone(keyAt(i));
  segEl.innerHTML += `
    <div class="seg-item">
      <div class="seg-emoji">${seg.emoji}</div>
      <div class="seg-info">
        <div class="seg-label">${seg.label}</div>
      </div>
      <div class="seg-bar-wrap">
        <div class="seg-bar" style="width:${pct}%;background:${col}"></div>
      </div>
      <div class="seg-pct">${seg.count.toLocaleString('en-IN')}</div>
    </div>`;
});

new Chart(document.getElementById('chartCostType'), {
  type: 'bar',
  data: {
    labels: DATA.costByType.map(d => d[0]),
    datasets: [{
      data:            DATA.costByType.map(d => d[1]),
      backgroundColor: barFill(0.55),
      borderColor:     barEdge,
      borderWidth:     1.5,
      borderRadius:    8,
    }]
  },
  options: {
    indexAxis: 'y',
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: WARM_GRID,
        ticks: { ...WARM_TICK, callback: v => '\u20b9' + v.toLocaleString('en-IN') }
      },
      y: { grid: { display: false }, ticks: { ...WARM_TICK, font: { size: 11 } } }
    }
  }
});

const vsEl = document.getElementById('valueStats');
[
  ['Minimum Cost (for 2)',      '\u20b940'     ],
  ['Maximum Cost (for 2)',      '\u20b96,000'  ],
  ['Average Cost (for 2)',      '\u20b9555'    ],
  ['Most Common Price Range',   '\u20b9200\u2013\u20b9400'],
  ['Budget-friendly (< \u20b9400)', '46.4%'   ],
  ['Premium (> \u20b9800)',     '11.6%'        ],
].forEach(([label, val]) => {
  vsEl.innerHTML += `
    <div class="vs-item">
      <div class="vs-label">${label}</div>
      <div class="vs-val">${val}</div>
    </div>`;
});

/* ═══════════════════════════════════════════════════════════
   INSIGHTS
═══════════════════════════════════════════════════════════ */

const insights = [
  {
    icon: '\uD83C\uDFD9\uFE0F', color: 'ic-terra',
    title: 'BTM Leads the City',
    text:  'BTM Layout has the highest restaurant density — 5,124 restaurants, nearly double that of second-place HSR Layout (2,523). A true foodie neighbourhood.',
    stat:  '5,124 restaurants'
  },
  {
    icon: '\uD83D\uDCF1', color: 'ic-sage',
    title: 'A Digital-First City',
    text:  'Almost 6 in 10 Bangalore restaurants accept online orders — a strong signal that the city has embraced delivery and app-based dining culture.',
    stat:  '58.9% online'
  },
  {
    icon: '\u2B50', color: 'ic-gold',
    title: 'Well-Rated, On Balance',
    text:  'The average rating is a solid 3.7 out of 5. Over 43% of restaurants score 4.0 or above, while only 0.5% fall below 2.5.',
    stat:  'Avg 3.7 / 5.0'
  },
  {
    icon: '\uD83C\uDF5B', color: 'ic-ochre',
    title: 'North Indian Reigns',
    text:  'North Indian cuisine leads by a wide margin with 21,085 listings. Chinese (15,547) and South Indian (8,644) round out the top three.',
    stat:  '21,085 restaurants'
  },
  {
    icon: '\uD83C\uDFC3', color: 'ic-plum',
    title: 'Quick Bites First',
    text:  'Quick Bites is the most common restaurant format at 20,639 — nearly 40% of all eateries. Bangalore runs on speed and convenience.',
    stat:  '39.9% of all'
  },
  {
    icon: '\uD83D\uDCB8', color: 'ic-olive',
    title: 'Surprisingly Affordable',
    text:  'The most common meal price is \u20b9200\u2013400 for two. Nearly half of all restaurants cost under \u20b9400, making Bangalore one of India\u2019s friendliest dining cities.',
    stat:  '\u20b9555 avg for two'
  },
  {
    icon: '\uD83D\uDEAB', color: 'ic-slate',
    title: 'Booking is the Exception',
    text:  'Only 12.5% of restaurants accept table reservations. Bangalore largely operates walk-in — making spontaneous dining the norm.',
    stat:  'Only 12.5% book'
  },
  {
    icon: '\uD83D\uDEF5', color: 'ic-rose',
    title: 'Delivery Dominates',
    text:  'Delivery listings account for 50.2% of all Zomato listings — more than Dine-out, Cafes, Pubs and Buffet combined. The city orders in.',
    stat:  '25,942 listings'
  },
];

const igEl = document.getElementById('insightsGrid');
insights.forEach(ins => {
  igEl.innerHTML += `
    <div class="insight-card ${ins.color}">
      <div class="insight-icon">${ins.icon}</div>
      <div class="insight-body">
        <div class="insight-title">${ins.title}</div>
        <div class="insight-text">${ins.text}</div>
        <div class="insight-stat">${ins.stat}</div>
      </div>
    </div>`;
});

const rows = [
  ['Total Restaurants',       '51,717',                          'terracotta'],
  ['Rated Restaurants',       '41,665 \u00a0(80.6%)',            'sage'      ],
  ['Unrated / NEW',           '10,052 \u00a0(19.4%)',            'umber'     ],
  ['Online Order: Yes',       '30,444 \u00a0(58.9%)',            'sage'      ],
  ['Online Order: No',        '21,273 \u00a0(41.1%)',            'rose'      ],
  ['Table Booking: Yes',      '6,449 \u00a0(12.5%)',             'slate'     ],
  ['Top Location',            'BTM \u2014 5,124 restaurants',    'terracotta'],
  ['Top Cuisine',             'North Indian \u2014 21,085',      'ochre'     ],
  ['Top Restaurant Type',     'Quick Bites \u2014 20,639',       'olive'     ],
  ['Average Rating',          '3.7 / 5.0',                       'gold'      ],
  ['Average Cost (for two)',  '\u20b9555',                        'rose'      ],
  ['Cost Range',              '\u20b940 \u2013 \u20b96,000',     'umber'     ],
  ['Unique Locations',        '93 neighbourhoods',                'slate'     ],
  ['Unique Cuisine Types',    '70+ types',                        'plum'      ],
];

document.getElementById('summaryTable').innerHTML = `
  <table>
    <thead>
      <tr><th>Metric</th><th>Value</th></tr>
    </thead>
    <tbody>
      ${rows.map(([m, v, c]) => `
        <tr>
          <td>${m}</td>
          <td>
            <span class="td-tag" style="background:${tint(c,0.14)};color:${tone(c)};border:1.5px solid ${tint(c,0.35)};">
              ${v}
            </span>
          </td>
        </tr>`).join('')}
    </tbody>
  </table>`;

const scrollTopBtn = document.getElementById('scrollTop');
window.addEventListener('scroll', () => {
  scrollTopBtn.classList.toggle('visible', window.scrollY > 300);
});
scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
