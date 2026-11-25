/* Storage layer: IndexedDB (primary) -> localStorage (fallback) -> memory.
   The app talks only to window.Store, so a native SQLite version can replace this file later. */
(() => {
'use strict';
const DB_NAME = 'daftar-kharj', LS_KEY = 'dafter-kharj-v1';
let db = null, kind = 'idb', ok = true, latest = null, timer = null, queue = Promise.resolve();
let saved = new Map(), metaSaved = '', legacyRaw = null;

const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const finished = t => new Promise((res, rej) => { t.oncomplete = () => res(); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error || new Error('aborted')); });

function openDB() {
  return new Promise((res, rej) => {
    if (!window.indexedDB) { rej(new Error('no indexedDB')); return; }
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('meta'); r.result.createObjectStore('txs', {keyPath:'id'}); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.onblocked = () => rej(new Error('blocked'));
  });
}
function lsGet() { try { return localStorage.getItem(LS_KEY); } catch (e) { return null; } }
function remember(meta, txs) {
  const { txs: _ignored, ...m } = meta || {};
  metaSaved = meta ? JSON.stringify(m) : '';
  saved = new Map(txs.map(t => [t.id, JSON.stringify(t)]));
}

async function load() {
  try {
    db = await openDB();
    const t = db.transaction(['meta', 'txs'], 'readonly');
    const [meta, txs] = await Promise.all([req(t.objectStore('meta').get('main')), req(t.objectStore('txs').getAll())]);
    if (meta || txs.length) { remember(meta, txs); return { data: { ...(meta || {}), txs }, migrated: false }; }
    const raw = lsGet();                       // first run on this engine: migrate old localStorage data
    if (raw) { try { legacyRaw = raw; return { data: JSON.parse(raw), migrated: true }; } catch (e) { /* corrupt: start fresh */ } }
    return { data: null, migrated: false };
  } catch (e) {
    db = null;
    const raw = lsGet();
    if (raw !== null || probeLS()) { kind = 'ls'; try { return { data: raw ? JSON.parse(raw) : null, migrated: false }; } catch (e2) { return { data: null, migrated: false }; } }
    kind = 'mem'; ok = false;
    return { data: null, migrated: false };
  }
}
function probeLS() { try { localStorage.setItem('__p', '1'); localStorage.removeItem('__p'); return true; } catch (e) { return false; } }

async function writeIDB(d) {
  const { txs, ...meta } = d;
  const metaStr = JSON.stringify(meta), cur = new Map(), puts = [], dels = [];
  for (const t of txs) { const s = JSON.stringify(t); cur.set(t.id, s); if (saved.get(t.id) !== s) puts.push(t); }
  saved.forEach((_, id) => { if (!cur.has(id)) dels.push(id); });
  if (!puts.length && !dels.length && metaStr === metaSaved) return;
  const t = db.transaction(['meta', 'txs'], 'readwrite');
  const ms = t.objectStore('meta'), ts = t.objectStore('txs');
  if (metaStr !== metaSaved) ms.put(meta, 'main');
  puts.forEach(x => ts.put(x));
  dels.forEach(id => ts.delete(id));
  await finished(t);
  saved = cur; metaSaved = metaStr;
}
async function write(d) {
  if (!d) return;
  if (kind === 'idb') {
    try { await writeIDB(d); ok = true; return; }
    catch (e) { /* fall through to localStorage as a safety net */ }
  }
  try { localStorage.setItem(LS_KEY, JSON.stringify(d)); ok = true; }
  catch (e) { ok = false; if (api.onerror) api.onerror(e); }
}
function flush() { clearTimeout(timer); timer = null; queue = queue.then(() => write(latest)).catch(() => {}); return queue; }
function save(d) { latest = d; clearTimeout(timer); timer = setTimeout(flush, 250); }
function saveNow(d) { latest = d; return flush(); }
function retireLegacy() {
  if (legacyRaw === null) return;
  try { localStorage.setItem(LS_KEY + '-migrated', legacyRaw); localStorage.removeItem(LS_KEY); } catch (e) { /* keep original */ }
  legacyRaw = null;
}
const api = {
  load, save, saveNow, flush, retireLegacy, onerror: null,
  get kind() { return kind; }, get ok() { return ok; },
  async persisted() { try { return !!(navigator.storage && navigator.storage.persisted && await navigator.storage.persisted()); } catch (e) { return false; } }
};
window.Store = api;
})();
