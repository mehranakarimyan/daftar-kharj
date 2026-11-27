/* Native (Android) storage: SQLite on the device via @capacitor-community/sqlite.
   Loaded after storage.js. On the web it does nothing; if the plugin is missing it keeps the IndexedDB store.
   Exposes the same API as storage.js, so app.js does not care which one it talks to. */
(() => {
'use strict';
const cap = window.Capacitor;
if (!cap || !(cap.isNativePlatform && cap.isNativePlatform())) return;
const SQL = cap.Plugins && cap.Plugins.CapacitorSQLite;
const idb = window.Store;
if (!SQL || !idb) return;

const DB = 'daftar_kharj';
const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS txs (id TEXT PRIMARY KEY NOT NULL, type TEXT NOT NULL, amount INTEGER NOT NULL, cat TEXT NOT NULL DEFAULT '', note TEXT NOT NULL DEFAULT '', date TEXT NOT NULL, ts INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS idx_txs_date ON txs(date);
`;
const CHUNK = 1000;
let ready = null, fb = null, ok = true, latest = null, timer = null, queue = Promise.resolve();
let saved = new Map(), metaSaved = '';

async function init() {
  let has = false;
  try { has = !!(await SQL.isConnection({ database:DB, readonly:false })).result; } catch (e) { /* assume none */ }
  if (!has) await SQL.createConnection({ database:DB, version:1, encrypted:false, mode:'no-encryption', readonly:false });
  try { await SQL.open({ database:DB, readonly:false }); } catch (e) { /* may already be open */ }
  await SQL.execute({ database:DB, statements:SCHEMA, transaction:true });
}
const query = statement => SQL.query({ database:DB, statement, values:[] });

async function load() {
  try {
    await (ready || (ready = init()));
    const m = await query("SELECT value FROM meta WHERE key = 'main'");
    const t = await query('SELECT id, type, amount, cat, note, date, ts FROM txs');
    const meta = m.values && m.values[0] && m.values[0].value ? JSON.parse(m.values[0].value) : null;
    const txs = (t.values || []).filter(r => r && typeof r === 'object' && r.id !== undefined);
    metaSaved = meta ? JSON.stringify(meta) : '';
    saved = new Map(txs.map(r => [r.id, JSON.stringify(r)]));
    return { data: (meta || txs.length) ? { ...(meta || {}), txs } : null, migrated:false };
  } catch (e) {
    fb = idb; fb.onerror = api.onerror;   // plugin failed: fall back to the IndexedDB store of the WebView
    return fb.load();
  }
}

async function write(d) {
  if (!d) return;
  const { txs, ...meta } = d;
  const metaStr = JSON.stringify(meta), cur = new Map(), set = [];
  if (metaStr !== metaSaved) set.push({ statement:"INSERT OR REPLACE INTO meta (key, value) VALUES ('main', ?)", values:[metaStr] });
  for (const t of txs) {
    const row = { id:t.id, type:t.type, amount:t.amount, cat:t.cat, note:t.note, date:t.date, ts:t.ts };
    const s = JSON.stringify(row); cur.set(t.id, s);
    if (saved.get(t.id) !== s) set.push({ statement:'INSERT OR REPLACE INTO txs (id, type, amount, cat, note, date, ts) VALUES (?, ?, ?, ?, ?, ?, ?)', values:[row.id, row.type, row.amount, row.cat, row.note, row.date, row.ts] });
  }
  saved.forEach((_, id) => { if (!cur.has(id)) set.push({ statement:'DELETE FROM txs WHERE id = ?', values:[id] }); });
  if (!set.length) return;
  try {
    for (let i = 0; i < set.length; i += CHUNK) await SQL.executeSet({ database:DB, set:set.slice(i, i + CHUNK), transaction:true, returnMode:'no' });
    saved = cur; metaSaved = metaStr; ok = true;
  } catch (e) { ok = false; if (api.onerror) api.onerror(e); }
}
function flush() { if (fb) return fb.flush(); clearTimeout(timer); timer = null; queue = queue.then(() => write(latest)).catch(() => {}); return queue; }
function save(d) { if (fb) return fb.save(d); latest = d; clearTimeout(timer); timer = setTimeout(flush, 250); }
function saveNow(d) { if (fb) return fb.saveNow(d); latest = d; return flush(); }

const api = {
  load, save, saveNow, flush,
  retireLegacy() { if (fb) fb.retireLegacy(); },
  onerror: null,
  get kind() { return fb ? fb.kind : 'sqlite'; },
  get ok() { return fb ? fb.ok : ok; },
  async persisted() { return fb ? fb.persisted() : true; }
};
window.Store = api;
})();
