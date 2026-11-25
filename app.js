(() => {
'use strict';

/* ---------- helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const nf = new Intl.NumberFormat('fa-IR');
const fa = n => nf.format(Math.round(n));
const FA_D = '۰۱۲۳۴۵۶۷۸۹', AR_D = '٠١٢٣٤٥٦٧٨٩';
const en = s => String(s).replace(/[۰-۹]/g, d => FA_D.indexOf(d)).replace(/[٠-٩]/g, d => AR_D.indexOf(d));
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const pad = n => String(n).padStart(2, '0');
const DAY = 864e5;
const MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const PALETTE = ['#148A52','#2FB872','#7BC74D','#B5D334','#0E7C86','#27A6A0','#E0A82E','#E8832A','#2E6BD1','#6B7F73'];
const EMOJIS = ['🍔','🍕','☕','🚌','🚕','⛽','📚','✏️','💻','🎬','🎮','🏠','📱','💡','💊','🏥','👕','👟','🎁','🎉','🛒','🧾','💰','💼','✈️','🐱','💇','🏋️'];

/* ---------- Jalali calendar (via Intl, no tables to maintain) ---------- */
const jfmt = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', {timeZone:'UTC', year:'numeric', month:'numeric', day:'numeric'});
const wfmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {timeZone:'UTC', weekday:'long'});
const jcache = new Map();
const isoToDate = iso => new Date(iso + 'T12:00:00Z');
const dateToIso = d => d.toISOString().slice(0, 10);
function toJ(iso) {
  let r = jcache.get(iso);
  if (r) return r;
  const o = {};
  for (const p of jfmt.formatToParts(isoToDate(iso))) if (p.type === 'year' || p.type === 'month' || p.type === 'day') o[p.type] = +p.value;
  r = {y:o.year, m:o.month, d:o.day};
  jcache.set(iso, r);
  return r;
}
const ord = (y, m, d) => y * 372 + (m - 1) * 31 + d;
function jToIso(y, m, d) {
  const off = m <= 6 ? (m - 1) * 31 : 186 + (m - 7) * 30;
  let t = Date.UTC(y + 621, 2, 21, 12) + (off + d - 1) * DAY;
  const target = ord(y, m, d);
  for (let i = 0; i < 12; i++) {
    const iso = dateToIso(new Date(t)), j = toJ(iso), o = ord(j.y, j.m, j.d);
    if (o === target) return iso;
    t += o < target ? DAY : -DAY;
  }
  return dateToIso(new Date(t));
}
const daysBetween = (a, b) => Math.round((isoToDate(b) - isoToDate(a)) / DAY);
function isLeap(y) { return daysBetween(jToIso(y, 1, 1), jToIso(y + 1, 1, 1)) === 366; }
function monthLen(y, m) { return m <= 6 ? 31 : m <= 11 ? 30 : (isLeap(y) ? 30 : 29); }
function todayISO() { const n = new Date(); return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`; }
function addDays(iso, n) { return dateToIso(new Date(isoToDate(iso).getTime() + n * DAY)); }
function curMonth() { const j = toJ(todayISO()); return {y:j.y, m:j.m}; }
const prevMonth = ({y, m}) => m === 1 ? {y:y - 1, m:12} : {y, m:m - 1};
const nextMonth = ({y, m}) => m === 12 ? {y:y + 1, m:1} : {y, m:m + 1};
const mkey = ({y, m}) => y * 100 + m;
const monthName = ({y, m}) => `${MONTHS[m - 1]} ${en(y).replace(/\d/g, d => FA_D[d])}`;
function dayLabel(iso) {
  const t = todayISO();
  if (iso === t) return 'امروز';
  if (iso === addDays(t, -1)) return 'دیروز';
  const j = toJ(iso);
  return `${wfmt.format(isoToDate(iso))} ${fa(j.d)} ${MONTHS[j.m - 1]}`;
}
const fullDate = iso => { const j = toJ(iso); return `${fa(j.d)} ${MONTHS[j.m - 1]} ${String(j.y).replace(/\d/g, d => FA_D[d])}`; };

/* ---------- data ---------- */
const KEY = 'dafter-kharj-v1';
const DEFAULT_CATS = [
  {id:'food', type:'out', name:'خوراک', emoji:'🍔', color:'#E8832A'},
  {id:'transport', type:'out', name:'رفت‌وآمد', emoji:'🚌', color:'#0E7C86'},
  {id:'uni', type:'out', name:'دانشگاه و کتاب', emoji:'📚', color:'#2E6BD1'},
  {id:'fun', type:'out', name:'تفریح', emoji:'🎬', color:'#7BC74D'},
  {id:'rent', type:'out', name:'اجاره و خوابگاه', emoji:'🏠', color:'#6B7F73'},
  {id:'bills', type:'out', name:'قبض و اینترنت', emoji:'📱', color:'#27A6A0'},
  {id:'health', type:'out', name:'سلامت', emoji:'💊', color:'#D64545'},
  {id:'clothes', type:'out', name:'پوشاک', emoji:'👕', color:'#B5D334'},
  {id:'gift', type:'out', name:'هدیه و مهمانی', emoji:'🎁', color:'#E0A82E'},
  {id:'other', type:'out', name:'سایر', emoji:'🧾', color:'#2FB872'},
  {id:'in-family', type:'in', name:'کمک خانواده', emoji:'💰', color:'#148A52'},
  {id:'in-work', type:'in', name:'کار و درآمد', emoji:'💼', color:'#0E7C86'},
  {id:'in-other', type:'in', name:'سایر درآمدها', emoji:'✨', color:'#7BC74D'}
];
const defaults = () => ({v:1, txs:[], cats:DEFAULT_CATS.map(c => ({...c})), budget:0, theme:'auto', lastCat:{out:'food', in:'in-family'}, lastBackup:0, snooze:0});
let storageOK = true;
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) { storageOK = false; }
  return defaults();
}
function normalize(d) {
  const base = defaults();
  const o = {...base, ...d};
  if (!Array.isArray(o.txs)) o.txs = [];
  if (!Array.isArray(o.cats) || !o.cats.length) o.cats = base.cats;
  o.txs = o.txs.filter(t => t && Number.isFinite(+t.amount) && /^\d{4}-\d{2}-\d{2}$/.test(t.date)).map(t => ({id:t.id || uid(), type:t.type === 'in' ? 'in' : 'out', amount:Math.round(+t.amount), cat:t.cat, note:String(t.note || ''), date:t.date, ts:t.ts || Date.now()}));
  o.lastCat = {...base.lastCat, ...(o.lastCat || {})};
  return o;
}
let data = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); storageOK = true; }
  catch (e) { storageOK = false; toast('ذخیره نشد؛ حافظهٔ مرورگر در دسترس نیست'); }
}

const FALLBACK_CAT = {id:'', name:'بدون دسته', emoji:'❔', color:'#6B7690'};
const catOf = id => data.cats.find(c => c.id === id) || FALLBACK_CAT;
const catsOf = type => data.cats.filter(c => c.type === type);
const sumBy = (list, type) => list.reduce((a, t) => a + (t.type === type ? t.amount : 0), 0);
const monthTxs = m => data.txs.filter(t => { const j = toJ(t.date); return j.y === m.y && j.m === m.m; });
const sortTxs = l => l.slice().sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : b.ts - a.ts);

/* ---------- UI state ---------- */
const ui = {tab:'add', month:curMonth(), filter:{q:'', cat:'', type:''}, form:null, deferredInstall:null};
function newForm(type = 'out') {
  return {id:null, type, amount:'', cat:data.lastCat[type] && catsOf(type).some(c => c.id === data.lastCat[type]) ? data.lastCat[type] : (catsOf(type)[0] || {}).id, note:'', date:todayISO()};
}
ui.form = newForm('out');

const ICON = {
  add:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>',
  list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r=".8"/><circle cx="4" cy="12" r=".8"/><circle cx="4" cy="18" r=".8"/></svg>',
  report:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 20V11M12 20V4M19 20v-6"/></svg>',
  settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>'
};
const TAB_LABEL = {add:'ثبت', list:'تراکنش‌ها', report:'گزارش', settings:'تنظیمات'};
document.querySelectorAll('.tab').forEach(b => { b.innerHTML = ICON[b.dataset.tab] + `<span>${TAB_LABEL[b.dataset.tab]}</span>`; });

/* ---------- toast & sheet ---------- */
let toastTimer;
function toast(msg, actLabel, actFn) {
  const el = $('#toast');
  el.innerHTML = `<div class="t"><span>${esc(msg)}</span>${actLabel ? `<button id="toastAct">${esc(actLabel)}</button>` : ''}</div>`;
  if (actLabel) $('#toastAct').onclick = () => { el.innerHTML = ''; actFn(); };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.innerHTML = ''; }, actLabel ? 5000 : 2400);
}
function sheet(html) {
  $('#sheet').innerHTML = `<div class="backdrop" data-act="backdrop"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;
}
const closeSheet = () => { $('#sheet').innerHTML = ''; };
function confirmSheet(msg, okLabel) {
  return new Promise(res => {
    sheet(`<h3>${esc(msg)}</h3><div class="btnrow"><button class="btn ghost" id="cNo">انصراف</button><button class="btn danger" id="cYes">${esc(okLabel)}</button></div>`);
    $('#cNo').onclick = () => { closeSheet(); res(false); };
    $('#cYes').onclick = () => { closeSheet(); res(true); };
  });
}

/* ---------- theme ---------- */
function applyTheme() {
  const r = document.documentElement;
  if (data.theme === 'auto') r.removeAttribute('data-theme'); else r.dataset.theme = data.theme;
  const dark = data.theme === 'dark' || (data.theme === 'auto' && matchMedia('(prefers-color-scheme:dark)').matches);
  document.querySelector('meta[name=theme-color]').content = dark ? '#08140E' : '#F4FAF6';
}
matchMedia('(prefers-color-scheme:dark)').addEventListener?.('change', applyTheme);

const isDark = () => data.theme === 'dark' || (data.theme === 'auto' && matchMedia('(prefers-color-scheme:dark)').matches);
const SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
const themeBtn = () => `<button class="iconbtn" data-act="toggle-theme" aria-label="${isDark() ? 'حالت روز' : 'حالت شب'}">${isDark() ? SUN : MOON}</button>`;
/* ---------- views ---------- */
function monthNav() {
  const cm = curMonth(), isNow = mkey(ui.month) === mkey(cm);
  return `<div class="mnav">
    <button data-act="mprev" aria-label="ماه قبل">›</button>
    <button class="mlabel" data-act="mnow" aria-label="برگشت به این ماه">${monthName(ui.month)}</button>
    <button data-act="mnext" aria-label="ماه بعد" ${isNow ? 'disabled' : ''}>‹</button></div>`;
}

function viewAdd() {
  const f = ui.form, cats = catsOf(f.type);
  const mt = monthTxs(curMonth()), spent = sumBy(mt, 'out'), today = sumBy(data.txs.filter(t => t.date === todayISO()), 'out');
  const left = data.budget - spent;
  const showBackup = data.txs.length >= 10 && Date.now() - Math.max(data.lastBackup, data.snooze) > 30 * DAY;
  const t = todayISO(), y = addDays(t, -1);
  return `
  <div class="top"><h1>${f.id ? 'ویرایش تراکنش' : 'دفتر خرج'}</h1>
    <div class="topr">${f.id ? '<button class="btn ghost small" data-act="cancel">انصراف</button>' : ''}${themeBtn()}</div></div>
  ${showBackup ? `<div class="banner"><span>بیش از ۳۰ روز از آخرین پشتیبان‌گیری گذشته.</span><button data-act="backup-now">پشتیبان بگیر</button><button data-act="backup-snooze" class="muted" aria-label="بستن">✕</button></div>` : ''}
  ${!f.id ? `<div class="glance">
    <div><small>خرج امروز</small><b class="num">${fa(today)}</b></div>
    <div><small>${data.budget > 0 ? (left >= 0 ? 'مانده بودجهٔ ماه' : 'بیشتر از بودجه') : 'خرج این ماه'}</small>
    <b class="num" style="${data.budget > 0 && left < 0 ? 'color:var(--bad)' : ''}">${fa(data.budget > 0 ? Math.abs(left) : spent)}</b></div></div>` : ''}
  <div class="seg" role="group" aria-label="نوع تراکنش">
    <button data-act="type" data-type="out" class="${f.type === 'out' ? 'on' : ''}">خرج</button>
    <button data-act="type" data-type="in" class="${f.type === 'in' ? 'on' : ''}">درآمد</button></div>
  <div class="amount" id="amt">${amountHTML()}</div>
  <div class="chips" role="group" aria-label="دسته">${cats.map(c => `<button class="chip ${f.cat === c.id ? 'on' : ''}" data-act="pickcat" data-id="${esc(c.id)}"><span>${esc(c.emoji)}</span>${esc(c.name)}</button>`).join('')}</div>
  <input class="field" data-bind="note" maxlength="80" placeholder="توضیح (اختیاری)" value="${esc(f.note)}" aria-label="توضیح">
  <div class="chips" role="group" aria-label="تاریخ">
    <button class="chip ${f.date === t ? 'on' : ''}" data-act="setdate" data-d="${t}">امروز</button>
    <button class="chip ${f.date === y ? 'on' : ''}" data-act="setdate" data-d="${y}">دیروز</button>
    <button class="chip ${f.date !== t && f.date !== y ? 'on' : ''}" data-act="datepick">📅 ${f.date !== t && f.date !== y ? fullDate(f.date) : 'تاریخ دیگر'}</button></div>
  <div class="pad" role="group" aria-label="صفحه‌کلید مبلغ">
    ${['1','2','3','4','5','6','7','8','9'].map(k => `<button data-act="key" data-k="${k}">${FA_D[k]}</button>`).join('')}
    <button class="sm" data-act="key" data-k="000" aria-label="سه صفر">۰۰۰</button>
    <button data-act="key" data-k="0">۰</button>
    <button class="sm" data-act="key" data-k="del" aria-label="پاک کردن یک رقم">⌫</button></div>
  <button class="btn block" data-act="save">${f.id ? 'ذخیرهٔ تغییرات' : (f.type === 'out' ? 'ثبت خرج' : 'ثبت درآمد')}</button>
  ${f.id ? '<div class="btnrow"><button class="btn danger" data-act="del-form">حذف این تراکنش</button></div>' : ''}`;
}
function amountHTML() {
  const a = ui.form.amount;
  return `<div class="val num ${a ? '' : 'empty'}">${a ? fa(+a) : '۰'}</div><div class="unit">تومان</div>`;
}

function txRow(t, showDate) {
  const c = catOf(t.cat);
  return `<button class="tx" data-act="edit" data-id="${t.id}">
    <span class="ico" style="background:${c.color}22">${esc(c.emoji)}</span>
    <span class="mid"><b>${esc(t.note || c.name)}</b><small>${esc(c.name)}${showDate ? ' – ' + fullDate(t.date) : ''}</small></span>
    <span class="amt num ${t.type}">${t.type === 'in' ? '+' : ''}${fa(t.amount)}</span></button>`;
}
function listBody() {
  const fl = ui.filter, q = en(fl.q.trim()).toLowerCase();
  let txs = monthTxs(ui.month);
  const all = txs.length;
  if (fl.type) txs = txs.filter(t => t.type === fl.type);
  if (fl.cat) txs = txs.filter(t => t.cat === fl.cat);
  if (q) txs = txs.filter(t => (t.note + ' ' + catOf(t.cat).name).toLowerCase().includes(q) || String(t.amount).includes(q));
  txs = sortTxs(txs);
  if (!txs.length) return `<div class="empty-state"><div class="big">${all ? '🔍' : '🧾'}</div>${all ? 'تراکنشی با این فیلتر پیدا نشد.' : 'این ماه هنوز چیزی ثبت نشده.<br>از تب «ثبت» اولین خرجت رو بنویس.'}</div>`;
  const groups = new Map();
  txs.forEach(t => { if (!groups.has(t.date)) groups.set(t.date, []); groups.get(t.date).push(t); });
  let h = '';
  groups.forEach((list, date) => {
    const out = sumBy(list, 'out');
    h += `<div class="day"><span>${dayLabel(date)}</span><span class="num">${out ? 'خرج ' + fa(out) : ''}</span></div>` + list.map(t => txRow(t)).join('');
  });
  return h;
}
function viewList() {
  const fl = ui.filter, used = [...new Set(monthTxs(ui.month).map(t => t.cat))];
  return `<div class="top"><h1>تراکنش‌ها</h1><div class="topr">${monthNav()}${themeBtn()}</div></div>
  <input class="field" type="search" data-bind="q" placeholder="جستجو در توضیح، دسته یا مبلغ" value="${esc(fl.q)}" aria-label="جستجو">
  <div class="seg" role="group" aria-label="نوع">
    <button data-act="tfilter" data-type="" class="${!fl.type ? 'on' : ''}">همه</button>
    <button data-act="tfilter" data-type="out" class="${fl.type === 'out' ? 'on' : ''}">خرج</button>
    <button data-act="tfilter" data-type="in" class="${fl.type === 'in' ? 'on' : ''}">درآمد</button></div>
  <div class="chips" style="margin-top:8px">${used.map(id => { const c = catOf(id); return `<button class="chip ${fl.cat === id ? 'on' : ''}" data-act="cfilter" data-id="${esc(id)}"><span>${esc(c.emoji)}</span>${esc(c.name)}</button>`; }).join('')}</div>
  <div id="list">${listBody()}</div>`;
}

function viewReport() {
  const m = ui.month, txs = monthTxs(m), outs = txs.filter(t => t.type === 'out');
  const total = sumBy(txs, 'out'), income = sumBy(txs, 'in');
  const head = `<div class="top"><h1>گزارش ماه</h1><div class="topr">${monthNav()}${themeBtn()}</div></div>`;
  if (!txs.length) return head + `<div class="empty-state"><div class="big">📊</div>برای ${monthName(m)} چیزی ثبت نشده.<br>با ثبت چند خرج، گزارش اینجا ساخته می‌شه.</div>`;

  const pm = prevMonth(m), pTxs = monthTxs(pm), pTotal = sumBy(pTxs, 'out');
  const isNow = mkey(m) === mkey(curMonth()), tj = toJ(todayISO());
  const len = monthLen(m.y, m.m), elapsed = isNow ? tj.d : len;
  let cmp = '';
  if (pTotal > 0 && total > 0) {
    const pct = Math.round((total - pTotal) / pTotal * 100);
    cmp = pct === 0 ? `<span class="pill">هم‌اندازهٔ ${MONTHS[pm.m - 1]}</span>` : `<span class="pill ${pct > 0 ? 'bad' : 'good'}">${fa(Math.abs(pct))}٪ ${pct > 0 ? 'بیشتر' : 'کمتر'} از ${MONTHS[pm.m - 1]}</span>`;
  }
  const bal = income - total;

  // by category
  const byCat = new Map(), pByCat = new Map();
  outs.forEach(t => byCat.set(t.cat, (byCat.get(t.cat) || 0) + t.amount));
  pTxs.filter(t => t.type === 'out').forEach(t => pByCat.set(t.cat, (pByCat.get(t.cat) || 0) + t.amount));
  const rows = [...byCat.entries()].sort((a, b) => b[1] - a[1]);

  // donut
  let off = 0, segs = '';
  rows.forEach(([id, v]) => {
    const p = v / total * 100;
    segs += `<circle r="15.9155" cx="21" cy="21" fill="none" stroke="${catOf(id).color}" stroke-width="6" stroke-dasharray="${Math.max(p - .6, .1).toFixed(2)} ${(100 - Math.max(p - .6, .1)).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"/>`;
    off += p;
  });

  // budget card
  let budgetCard = '';
  if (data.budget > 0) {
    const p = total / data.budget, over = total > data.budget, rem = data.budget - total;
    const remDays = len - tj.d + 1;
    let line = '';
    if (over) line = `<b style="color:var(--bad)">${fa(total - data.budget)} تومان از بودجه بیشتر خرج کردی.</b>`;
    else if (isNow) line = `${fa(rem)} تومان مانده؛ یعنی روزی حدود <b>${fa(rem / remDays)}</b> تومان تا آخر ماه.`;
    else line = `${fa(rem)} تومان از بودجه باقی ماند.`;
    budgetCard = `<div class="card"><h2>بودجهٔ ماه</h2>
      <div style="display:flex;justify-content:space-between;margin-bottom:6px" class="num"><span>${fa(total)}</span><span class="muted">از ${fa(data.budget)}</span></div>
      <div class="bar ${over ? 'over' : ''}"><i style="width:${Math.min(p * 100, 100)}%"></i></div>
      <p class="hint" style="margin:8px 0 0">${line}</p></div>`;
  }

  // category rows
  const catRows = rows.map(([id, v]) => {
    const c = catOf(id), p = Math.round(v / total * 100), pv = pByCat.get(id) || 0;
    let delta = '';
    if (pv > 0) { const d = Math.round((v - pv) / pv * 100); if (d !== 0) delta = `<span style="color:${d > 0 ? 'var(--bad)' : 'var(--in)'}">${d > 0 ? '▲' : '▼'} ${fa(Math.abs(d))}٪ نسبت به ماه قبل</span>`; }
    else if (pTxs.length) delta = '<span>ماه قبل نداشتی</span>';
    const budget = c.budget > 0 ? c.budget : 0, over = budget && v > budget;
    return `<button class="crow" data-act="catfilter" data-id="${esc(id)}">
      <div class="l1"><span class="dot" style="background:${c.color}"></span><span class="n">${esc(c.emoji)} ${esc(c.name)}</span><span class="v num">${fa(v)}</span></div>
      <div class="bar ${over ? 'over' : ''}"><i style="width:${budget ? Math.min(v / budget * 100, 100) : p}%;background:${over ? '' : c.color}"></i></div>
      <div class="l2"><span class="num">${budget ? `${fa(v)} از بودجهٔ ${fa(budget)}` : fa(p) + '٪ از کل'}</span>${delta}</div></button>`;
  }).join('');

  // daily chart
  const perDay = Array(len + 1).fill(0);
  outs.forEach(t => { perDay[toJ(t.date).d] += t.amount; });
  const maxDay = Math.max(...perDay), W = 320, H = 96, bw = W / len;
  let bars = '';
  for (let d = 1; d <= len; d++) {
    const v = perDay[d], h = v ? Math.max(v / maxDay * (H - 4), 3) : 1.5, x = (len - d) * bw + bw * .12;
    const hl = v === maxDay && v > 0, today = isNow && d === tj.d;
    bars += `<rect x="${x.toFixed(2)}" y="${(H - h).toFixed(2)}" width="${(bw * .76).toFixed(2)}" height="${h.toFixed(2)}" rx="2" fill="${hl ? 'var(--bad)' : v ? 'var(--accent)' : 'var(--line)'}" ${today ? 'stroke="var(--ink)" stroke-width="1"' : ''}><title>${fa(d)} ${MONTHS[m.m - 1]}: ${fa(v)} تومان</title></rect>`;
  }
  const lbl = [1, 10, 20, len].map(d => `<text x="${((len - d) * bw + bw / 2).toFixed(1)}" y="${H + 14}" font-size="10" text-anchor="middle" fill="var(--muted)" style="font-family:inherit">${fa(d)}</text>`).join('');

  // stats
  const biggest = outs.slice().sort((a, b) => b.amount - a.amount)[0];
  const topD = perDay.indexOf(maxDay);
  const avg = total / elapsed;

  return head + `
  <div class="hero"><small>جمع خرج ${monthName(m)}</small>
    <div class="total num">${fa(total)}<span>تومان</span></div>
    <div style="margin-top:4px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">${cmp}
      ${income ? `<span class="pill ${bal >= 0 ? 'good' : 'bad'}">${bal >= 0 ? 'مانده' : 'کسری'} ${fa(Math.abs(bal))}</span>` : ''}</div></div>
  ${budgetCard}
  ${total ? `<div class="card"><h2>خرج به تفکیک دسته</h2>
    <div class="donutwrap"><div class="donut"><svg viewBox="0 0 42 42" aria-hidden="true"><circle r="15.9155" cx="21" cy="21" fill="none" stroke="var(--line)" stroke-width="6"/>${segs}</svg>
    <div class="mid"><b class="num">${fa(rows.length)}</b><span class="muted">دسته</span></div></div></div>
    ${catRows}</div>
  <div class="card daily"><h2>خرج روزانه</h2>
    <svg viewBox="0 0 ${W} ${H + 18}" role="img" aria-label="نمودار خرج روزانه">${bars}${lbl}</svg></div>
  <div class="card"><h2>چند عدد مهم</h2><div class="stats">
    <div class="stat"><small>میانگین روزانه</small><b class="num">${fa(avg)}</b></div>
    <div class="stat"><small>تعداد خرج‌ها</small><b class="num">${fa(outs.length)}</b></div>
    <div class="stat"><small>بزرگ‌ترین خرج</small><b class="num">${fa(biggest.amount)}</b><em>${esc(biggest.note || catOf(biggest.cat).name)}</em></div>
    <div class="stat"><small>پرخرج‌ترین روز</small><b class="num">${fa(maxDay)}</b><em>${fa(topD)} ${MONTHS[m.m - 1]}</em></div></div></div>
  <button class="btn ghost block" data-act="share">اشتراک‌گذاری خلاصهٔ ماه</button>` : `<div class="empty-state">این ماه فقط درآمد ثبت شده.</div>`}`;
}

function viewSettings() {
  const catList = type => catsOf(type).map(c => `<button class="cl" data-act="editcat" data-id="${esc(c.id)}">
    <span class="ico" style="background:${c.color}22;width:36px;height:36px;font-size:18px">${esc(c.emoji)}</span>
    <span class="grow" style="flex:1"><b style="font-weight:600">${esc(c.name)}</b>${c.budget > 0 ? `<small class="muted" style="display:block">بودجه: ${fa(c.budget)}</small>` : ''}</span><span class="muted">ویرایش</span></button>`).join('');
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = matchMedia('(display-mode:standalone)').matches || navigator.standalone;
  return `<div class="top"><h1>تنظیمات</h1>${themeBtn()}</div>
  <div class="card"><h2>بودجهٔ ماهانه</h2>
    <input class="field" data-bind="budget" inputmode="numeric" placeholder="مثلاً ۸٬۰۰۰٬۰۰۰ (خالی = بدون بودجه)" value="${data.budget ? fa(data.budget) : ''}" aria-label="بودجهٔ ماهانه">
    <p class="hint" style="margin:0">با تعیین بودجه، تو گزارش می‌بینی روزی چقدر می‌تونی خرج کنی. بودجهٔ هر دسته رو هم می‌تونی تو ویرایش همون دسته بذاری.</p></div>
  <div class="card"><h2>دسته‌های خرج</h2>${catList('out')}
    <div class="btnrow"><button class="btn ghost small" data-act="addcat" data-type="out">+ دستهٔ جدید</button></div></div>
  <div class="card"><h2>دسته‌های درآمد</h2>${catList('in')}
    <div class="btnrow"><button class="btn ghost small" data-act="addcat" data-type="in">+ دستهٔ جدید</button></div></div>
  <div class="card"><h2>ظاهر</h2><div class="seg" role="group" aria-label="پوسته">
    ${[['auto','خودکار'],['light','روشن'],['dark','تاریک']].map(([k, l]) => `<button data-act="theme" data-t="${k}" class="${data.theme === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
  <div class="card"><h2>داده‌ها و پشتیبان</h2>
    <p class="hint" style="margin:0 0 10px">اطلاعات فقط روی همین گوشی ذخیره می‌شه (${fa(data.txs.length)} تراکنش). اگه مرورگر رو پاک کنی یا گوشی عوض کنی از بین می‌ره؛ پس هر چند وقت یه بار پشتیبان بگیر.</p>
    <div class="btnrow" style="flex-wrap:wrap">
      <button class="btn ghost small" data-act="export-json">پشتیبان (JSON)</button>
      <button class="btn ghost small" data-act="export-csv">خروجی اکسل (CSV)</button></div>
    <div class="btnrow"><button class="btn ghost small" data-act="import">بازیابی از پشتیبان</button>
      <button class="btn danger small" data-act="wipe">پاک کردن همه</button></div>
    <input type="file" id="file" accept="application/json,.json" hidden>
    ${data.lastBackup ? `<p class="hint" style="margin:10px 0 0">آخرین پشتیبان: ${fullDate(dateToIso(new Date(data.lastBackup)))}</p>` : ''}
    ${storageOK ? '' : '<p class="hint" style="color:var(--bad)">حافظهٔ مرورگر در دسترس نیست (شاید حالت خصوصی). داده‌ها ذخیره نمی‌شن.</p>'}</div>
  ${standalone ? '' : `<div class="card"><h2>نصب روی گوشی</h2>
    ${ui.deferredInstall ? '<button class="btn block" data-act="install">نصب برنامه</button>' :
    `<div class="hint">${isIOS ? 'در Safari دکمهٔ اشتراک‌گذاری (مربع با فلش) رو بزن و «Add to Home Screen» رو انتخاب کن.' : 'در Chrome منوی سه‌نقطه رو باز کن و «Install app» یا «Add to Home screen» رو بزن.'} بعدش مثل یه اپ معمولی باز می‌شه و آفلاین هم کار می‌کنه.</div>`}</div>`}
  <p class="hint" style="text-align:center">دفتر خرج – نسخهٔ ۱٫۰</p>`;
}

/* ---------- render ---------- */
const VIEWS = {add:viewAdd, list:viewList, report:viewReport, settings:viewSettings};
function render(scrollTop = false) {
  $('#view').innerHTML = VIEWS[ui.tab]();
  document.querySelectorAll('.tab').forEach(b => {
    const on = b.dataset.tab === ui.tab;
    b.classList.toggle('on', on);
    if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  if (scrollTop) window.scrollTo(0, 0);
}
function go(tab) { ui.tab = tab; render(true); }

/* ---------- actions ---------- */
function saveForm() {
  const f = ui.form, amount = parseInt(f.amount || '0', 10);
  if (!amount) { const a = $('#amt'); a.classList.remove('shake'); void a.offsetWidth; a.classList.add('shake'); toast('اول مبلغ رو وارد کن'); return; }
  if (!f.cat) { toast('یه دسته انتخاب کن'); return; }
  const rec = {type:f.type, amount, cat:f.cat, note:f.note.trim(), date:f.date};
  data.lastCat[f.type] = f.cat;
  if (f.id) {
    const t = data.txs.find(x => x.id === f.id);
    if (t) Object.assign(t, rec);
    save(); ui.form = newForm(f.type); ui.month = (({y, m}) => ({y, m}))(toJ(rec.date));
    toast('تغییرات ذخیره شد'); go('list');
  } else {
    const t = {id:uid(), ts:Date.now(), ...rec};
    data.txs.push(t); save();
    ui.form = newForm(f.type); render();
    toast(f.type === 'out' ? 'خرج ثبت شد' : 'درآمد ثبت شد', 'واگرد', () => { data.txs = data.txs.filter(x => x.id !== t.id); save(); render(); });
  }
}
async function deleteTx(id, fromForm) {
  const t = data.txs.find(x => x.id === id);
  if (!t) return;
  data.txs = data.txs.filter(x => x.id !== id); save();
  if (fromForm) { ui.form = newForm(t.type); go('list'); } else render();
  toast('تراکنش حذف شد', 'واگرد', () => { data.txs.push(t); save(); render(); });
}
function openDateSheet() {
  const cur = toJ(ui.form.date), now = toJ(todayISO());
  const st = {y:cur.y, m:cur.m, d:cur.d};
  sheet(`<h3>انتخاب تاریخ</h3><div class="row3">
    <select class="field" id="dd" aria-label="روز"></select><select class="field" id="dm" aria-label="ماه"></select><select class="field" id="dy" aria-label="سال"></select></div>
    <div class="btnrow"><button class="btn ghost" data-act="close">انصراف</button><button class="btn" id="dok">تأیید</button></div>`);
  const fillDays = () => {
    const len = monthLen(st.y, st.m); if (st.d > len) st.d = len;
    $('#dd').innerHTML = Array.from({length:len}, (_, i) => `<option value="${i + 1}" ${st.d === i + 1 ? 'selected' : ''}>${fa(i + 1)}</option>`).join('');
  };
  $('#dm').innerHTML = MONTHS.map((n, i) => `<option value="${i + 1}" ${st.m === i + 1 ? 'selected' : ''}>${n}</option>`).join('');
  $('#dy').innerHTML = Array.from({length:5}, (_, i) => now.y - 3 + i).map(y => `<option value="${y}" ${st.y === y ? 'selected' : ''}>${String(y).replace(/\d/g, d => FA_D[d])}</option>`).join('');
  fillDays();
  $('#dy').onchange = e => { st.y = +e.target.value; fillDays(); };
  $('#dm').onchange = e => { st.m = +e.target.value; fillDays(); };
  $('#dd').onchange = e => { st.d = +e.target.value; };
  $('#dok').onclick = () => { ui.form.date = jToIso(st.y, st.m, st.d); closeSheet(); render(); };
}
function openCatSheet(id, type) {
  const base = id ? data.cats.find(c => c.id === id) : null;
  const st = base ? {...base} : {id:null, type, name:'', emoji:'🧾', color:PALETTE[(data.cats.length) % PALETTE.length], budget:0};
  const paint = () => {
    $('#sheet').querySelectorAll('.sw').forEach(s => s.classList.toggle('on', s.dataset.c === st.color));
  };
  sheet(`<h3>${base ? 'ویرایش دسته' : 'دستهٔ جدید'}</h3>
    <label class="lbl" for="cn">نام</label><input class="field" id="cn" maxlength="24" value="${esc(st.name)}" placeholder="مثلاً کافه">
    <label class="lbl" for="ce">ایموجی</label><input class="field" id="ce" maxlength="4" value="${esc(st.emoji)}" style="margin-bottom:6px">
    <div class="emojis">${EMOJIS.map(e => `<button data-act="emoji" data-e="${e}" aria-label="${e}">${e}</button>`).join('')}</div>
    <label class="lbl">رنگ</label><div class="swatches">${PALETTE.map(c => `<button class="sw" data-act="swatch" data-c="${c}" style="background:${c}" aria-label="رنگ"></button>`).join('')}</div>
    ${st.type === 'out' ? `<label class="lbl" for="cb">بودجهٔ ماهانهٔ این دسته (اختیاری)</label><input class="field" id="cb" inputmode="numeric" value="${st.budget ? fa(st.budget) : ''}" placeholder="بدون بودجه">` : ''}
    <div class="btnrow"><button class="btn ghost" data-act="close">انصراف</button><button class="btn" id="csave">ذخیره</button></div>
    ${base ? '<div class="btnrow"><button class="btn danger" id="cdel">حذف دسته</button></div>' : ''}`);
  paint();
  $('#sheet').onclick = e => {
    const sw = e.target.closest('[data-act=swatch]'); if (sw) { st.color = sw.dataset.c; paint(); }
    const em = e.target.closest('[data-act=emoji]'); if (em) { $('#ce').value = em.dataset.e; }
  };
  const cb = $('#cb'); if (cb) cb.oninput = () => { const d = en(cb.value).replace(/\D/g, '').slice(0, 12); cb.value = d ? fa(+d) : ''; };
  $('#csave').onclick = () => {
    const name = $('#cn').value.trim();
    if (!name) { toast('یه اسم برای دسته بنویس'); return; }
    st.name = name; st.emoji = $('#ce').value.trim() || '🧾';
    st.budget = cb ? (parseInt(en(cb.value).replace(/\D/g, ''), 10) || 0) : 0;
    if (base) Object.assign(base, st); else { st.id = 'c-' + uid(); data.cats.push(st); }
    save(); closeSheet(); render();
  };
  const del = $('#cdel');
  if (del) del.onclick = async () => {
    if (catsOf(base.type).length <= 1) { toast('حداقل یک دسته باید بمونه'); return; }
    const n = data.txs.filter(t => t.cat === base.id).length;
    closeSheet();
    if (await confirmSheet(`«${base.name}» حذف بشه؟${n ? ` ${fa(n)} تراکنشش «بدون دسته» می‌شن.` : ''}`, 'حذف')) {
      data.cats = data.cats.filter(c => c.id !== base.id);
      if (ui.form.cat === base.id) ui.form.cat = (catsOf(ui.form.type)[0] || {}).id;
      save(); render();
    }
  };
}

/* backup / export */
function download(name, text, mime) {
  const blob = new Blob([text], {type:mime}), url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
const stamp = () => todayISO();
function exportJSON() {
  data.lastBackup = Date.now(); save();
  download(`dafter-kharj-backup-${stamp()}.json`, JSON.stringify(data, null, 1), 'application/json');
  toast('فایل پشتیبان ساخته شد'); if (ui.tab === 'settings') render();
}
function exportCSV() {
  const q = v => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [['تاریخ شمسی', 'تاریخ میلادی', 'نوع', 'دسته', 'مبلغ (تومان)', 'توضیح']];
  sortTxs(data.txs).reverse().forEach(t => { const j = toJ(t.date); rows.push([`${j.y}/${pad(j.m)}/${pad(j.d)}`, t.date, t.type === 'out' ? 'خرج' : 'درآمد', catOf(t.cat).name, t.amount, t.note]); });
  download(`dafter-kharj-${stamp()}.csv`, '\uFEFF' + rows.map(r => r.map(q).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
  toast('فایل اکسل ساخته شد');
}
function importFile(file) {
  const r = new FileReader();
  r.onload = async () => {
    try {
      const d = JSON.parse(r.result);
      if (!d || !Array.isArray(d.txs)) throw new Error('bad');
      const n = normalize(d);
      if (await confirmSheet(`${fa(n.txs.length)} تراکنش پیدا شد. جایگزین داده‌های فعلی بشه؟`, 'جایگزین کن')) {
        data = n; save(); ui.form = newForm('out'); applyTheme(); render(); toast('بازیابی شد');
      }
    } catch (e) { toast('این فایل پشتیبان معتبر نیست'); }
  };
  r.readAsText(file);
}
async function shareSummary() {
  const m = ui.month, txs = monthTxs(m), total = sumBy(txs, 'out');
  const by = new Map(); txs.filter(t => t.type === 'out').forEach(t => by.set(t.cat, (by.get(t.cat) || 0) + t.amount));
  const lines = [...by.entries()].sort((a, b) => b[1] - a[1]).map(([id, v]) => `${catOf(id).emoji} ${catOf(id).name}: ${fa(v)} (${fa(v / total * 100)}٪)`);
  const text = `خرج ${monthName(m)}: ${fa(total)} تومان\n${lines.join('\n')}`;
  try { if (navigator.share) { await navigator.share({text}); return; } } catch (e) { if (e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(text); toast('خلاصه کپی شد'); } catch (e) { toast('اشتراک‌گذاری در این مرورگر ممکن نیست'); }
}

/* ---------- events ---------- */
function pressKey(k) {
  const f = ui.form;
  if (k === 'del') f.amount = f.amount.slice(0, -1);
  else if (k === '000') { if (f.amount) f.amount = (f.amount + '000').slice(0, 12); }
  else if (!(f.amount === '' && k === '0')) f.amount = (f.amount + k).slice(0, 12);
  const a = $('#amt'); if (a) a.innerHTML = amountHTML();
}
const ACTIONS = {
  tab: el => go(el.dataset.tab),
  key: el => pressKey(el.dataset.k),
  type: el => { ui.form.type = el.dataset.type; ui.form.cat = data.lastCat[ui.form.type] && catsOf(ui.form.type).some(c => c.id === data.lastCat[ui.form.type]) ? data.lastCat[ui.form.type] : (catsOf(ui.form.type)[0] || {}).id; render(); },
  pickcat: el => { ui.form.cat = el.dataset.id; render(); },
  setdate: el => { ui.form.date = el.dataset.d; render(); },
  datepick: openDateSheet,
  save: saveForm,
  cancel: () => { ui.form = newForm('out'); go('list'); },
  'del-form': () => deleteTx(ui.form.id, true),
  edit: el => { const t = data.txs.find(x => x.id === el.dataset.id); if (!t) return; ui.form = {id:t.id, type:t.type, amount:String(t.amount), cat:t.cat, note:t.note, date:t.date}; go('add'); },
  mprev: () => { ui.month = prevMonth(ui.month); render(); },
  mnext: () => { if (mkey(ui.month) < mkey(curMonth())) { ui.month = nextMonth(ui.month); render(); } },
  mnow: () => { ui.month = curMonth(); render(); },
  tfilter: el => { ui.filter.type = el.dataset.type; render(); },
  cfilter: el => { ui.filter.cat = ui.filter.cat === el.dataset.id ? '' : el.dataset.id; render(); },
  catfilter: el => { ui.filter = {q:'', cat:el.dataset.id, type:'out'}; go('list'); },
  share: shareSummary,
  'toggle-theme': () => { data.theme = isDark() ? 'light' : 'dark'; save(); applyTheme(); render(); },
  theme: el => { data.theme = el.dataset.t; save(); applyTheme(); render(); },
  addcat: el => openCatSheet(null, el.dataset.type),
  editcat: el => openCatSheet(el.dataset.id),
  'export-json': exportJSON,
  'export-csv': exportCSV,
  'backup-now': exportJSON,
  'backup-snooze': () => { data.snooze = Date.now() - 23 * DAY; save(); render(); },
  import: () => $('#file').click(),
  wipe: async () => { if (await confirmSheet('همهٔ تراکنش‌ها و دسته‌ها پاک بشن؟ این کار برگشت نداره.', 'پاک کن')) { data = defaults(); save(); ui.form = newForm('out'); applyTheme(); render(); toast('همه‌چیز پاک شد'); } },
  install: async () => { const p = ui.deferredInstall; if (!p) return; p.prompt(); await p.userChoice; ui.deferredInstall = null; render(); },
  close: closeSheet,
  backdrop: (el, e) => { if (e.target === el) closeSheet(); },
  emoji: () => {}, swatch: () => {}
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = ACTIONS[el.dataset.act];
  if (fn) fn(el, e);
});
document.addEventListener('input', e => {
  const b = e.target.dataset && e.target.dataset.bind;
  if (!b) return;
  const v = e.target.value;
  if (b === 'note') ui.form.note = v;
  else if (b === 'q') { ui.filter.q = v; $('#list').innerHTML = listBody(); }
  else if (b === 'budget') {
    const d = en(v).replace(/\D/g, '').slice(0, 12);
    data.budget = d ? +d : 0; e.target.value = d ? fa(+d) : ''; save();
  }
});
document.addEventListener('change', e => {
  if (e.target.id === 'file' && e.target.files[0]) { importFile(e.target.files[0]); e.target.value = ''; }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#sheet').firstChild) { closeSheet(); return; }
  if (ui.tab !== 'add' || $('#sheet').firstChild) return;
  const tag = (document.activeElement || {}).tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
  const k = en(e.key);
  if (/^\d$/.test(k)) pressKey(k);
  else if (e.key === 'Backspace') pressKey('del');
  else if (e.key === 'Enter') saveForm();
});
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); ui.deferredInstall = e; if (ui.tab === 'settings') render(); });
window.addEventListener('appinstalled', () => { ui.deferredInstall = null; if (ui.tab === 'settings') render(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && ui.tab === 'add' && !ui.form.id && ui.form.date !== todayISO() && !ui.form.amount) { ui.form.date = todayISO(); }
});

/* ---------- boot ---------- */
applyTheme();
render();
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
})();
