<div dir="rtl">

# ساخت اپ اندروید

اپ نصبی همین کد وب رو با [Capacitor](https://capacitorjs.com) تو یه پوستهٔ اندرویدی می‌پیچه. داده‌ها تو **SQLite روی گوشی** ذخیره می‌شن (`storage-sqlite.js`).

## پیش‌نیاز
- Node.js (نسخهٔ LTS)
- Android Studio (با Android SDK)
- گوشی با USB debugging روشن، یا یه Emulator

## یک‌بار راه‌اندازی

```powershell
npm init -y
npm install @capacitor/core @capacitor/android @capacitor/app @capacitor/filesystem @capacitor/share @capacitor-community/sqlite
npm install -D @capacitor/cli
npm pkg set scripts.build:web="node scripts/build-web.js"
npm pkg set scripts.sync="node scripts/build-web.js && npx cap sync android"
npm run build:web
npx cap add android
npm run sync
```

مطمئن شو نسخهٔ اصلی (major) `@capacitor/core` و `@capacitor-community/sqlite` یکی باشه:

```powershell
npm ls @capacitor/core @capacitor-community/sqlite
```

## تنظیم امنیتی
تو `android/app/src/main/AndroidManifest.xml`، تو تگ `<application`، مقدار `android:allowBackup` را `"false"` کن.

## اجرا روی گوشی
```powershell
npx cap open android
```
تو Android Studio صبر کن Gradle Sync تموم بشه، گوشی رو وصل کن و دکمهٔ Run (مثلث سبز) رو بزن.

## بعد از هر تغییر تو کد وب
```powershell
npm run sync
```
و دوباره Run بزن.

## انتقال داده از نسخهٔ وب به اپ
تو نسخهٔ وب از تنظیمات یه **پشتیبان رمزدار** بگیر، فایل رو به گوشی بفرست، و تو اپ از **بازیابی از پشتیبان** واردش کن.

## نکات
- فایل‌های `www/` و `node_modules/` ساخته می‌شن و تو گیت نیستن.
- پوشهٔ `android/` رو تو گیت بذار (به‌جز فایل‌های build و کلید امضا).
- کلید امضا (`.jks` / `.keystore`) و رمزهاش رو هرگز تو گیت نذار و از اون یه کپی امن نگه دار؛ اگه گم بشه نمی‌تونی آپدیت منتشر کنی.

</div>
