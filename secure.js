/* Password-based backup encryption: PBKDF2-SHA256 -> AES-256-GCM (WebCrypto). Needs https or localhost. */
(() => {
'use strict';
const te = new TextEncoder(), td = new TextDecoder();
const ITER = 310000, MIN_ITER = 100000, MAX_ITER = 1000000;
const b64 = buf => { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const available = () => !!(window.crypto && crypto.subtle);
async function deriveKey(pw, salt, iter) {
  const base = await crypto.subtle.importKey('raw', te.encode(pw), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name:'PBKDF2', salt, iterations:iter, hash:'SHA-256' }, base, { name:'AES-GCM', length:256 }, false, ['encrypt', 'decrypt']);
}
async function encrypt(text, pw) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pw, salt, ITER);
  const ct = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, te.encode(text));
  return { format:'daftar-kharj-backup', v:1, enc:'aes-256-gcm', kdf:'pbkdf2-sha256', iter:ITER, salt:b64(salt), iv:b64(iv), data:b64(ct) };
}
function isEncrypted(o) {
  return !!o && o.format === 'daftar-kharj-backup' && o.enc === 'aes-256-gcm' && typeof o.salt === 'string' && typeof o.iv === 'string' && typeof o.data === 'string' && Number.isInteger(o.iter) && o.iter >= MIN_ITER && o.iter <= MAX_ITER;
}
async function decrypt(o, pw) {
  if (!isEncrypted(o)) throw new Error('bad format');
  const key = await deriveKey(pw, unb64(o.salt), o.iter);
  return td.decode(await crypto.subtle.decrypt({ name:'AES-GCM', iv:unb64(o.iv) }, key, unb64(o.data)));
}
window.Secure = { available, encrypt, decrypt, isEncrypted };
})();
