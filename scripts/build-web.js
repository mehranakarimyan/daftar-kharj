// Copies the web app into www/ (the folder Capacitor packages into the Android app).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(root, 'www');
const files = ['index.html', 'style.css', 'app.js', 'storage.js', 'storage-sqlite.js', 'secure.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png'];
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
for (const f of files) {
  const src = path.join(root, f);
  if (!fs.existsSync(src)) { console.error('Missing file: ' + f); process.exit(1); }
  fs.copyFileSync(src, path.join(out, f));
}
const fonts = path.join(root, 'fonts');
if (fs.existsSync(fonts)) fs.cpSync(fonts, path.join(out, 'fonts'), { recursive: true });
console.log('www/ is ready (' + files.length + ' files)');
