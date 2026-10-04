# نصب نسخه Expert V2 بازارا

این بسته شامل دو پروژه کامل و پاک‌سازی‌شده است:

- `bazara-backend-expert-v2-ready.zip`
- `bazara-frontend-expert-v2-ready.zip`

فایل‌های `.env`، دیتابیس، کلیدهای API، لاگ‌ها، `.git`، `node_modules` و خروجی build داخل بسته‌ها قرار نگرفته‌اند.

## ۱) نصب بک‌اند در PowerShell

```powershell
$backendRoot = "C:\Users\lenovo\Desktop\NeuroVest-1"
$backendZip = "$env:USERPROFILE\Downloads\bazara-backend-expert-v2-ready.zip"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backendExtract = "$env:TEMP\bazara-backend-expert-v2-$stamp"

Expand-Archive -Path $backendZip -DestinationPath $backendExtract -Force
robocopy $backendExtract $backendRoot /E /XD .git .venv __pycache__ logs /XF .env db.sqlite3 "*.pyc"

cd $backendRoot
.\.venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py test questionnaire market_engine.test_financial_assistant portfolio.tests -v 2
python manage.py check
```

کد خروجی `1` از `robocopy` به معنی کپی موفق فایل‌هاست. خطا محسوب نمی‌شود.

## ۲) نصب فرانت در PowerShell

```powershell
$frontendRoot = "C:\Users\lenovo\neurovest-ui"
$frontendZip = "$env:USERPROFILE\Downloads\bazara-frontend-expert-v2-ready.zip"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$frontendExtract = "$env:TEMP\bazara-frontend-expert-v2-$stamp"

Expand-Archive -Path $frontendZip -DestinationPath $frontendExtract -Force
robocopy $frontendExtract $frontendRoot /E /XD .git node_modules .next /XF .env.local tsconfig.tsbuildinfo

cd $frontendRoot
npm install
npx tsc --noEmit
npm run lint
npm run build -- --webpack
```

## ۳) تست رفتاری دستی

پس از اجرای بک‌اند و فرانت:

1. صفحه `/onboarding` را باز کنید و هر ۱۰ سؤال را پاسخ دهید.
2. نتیجه باید ریسک مؤثر، کنترل رفتاری، سازگاری پاسخ‌ها، سقف افت و ده بُعد پروفایل را نشان دهد.
3. در چت بنویسید «دلار را بررسی کن» و سپس «تومان است» و «تا چه عددی بالا می‌رود؟».
4. پاسخ دوم و سوم باید همچنان فقط به `IR_USD` مربوط باشند؛ نماد «بیمه ما» نباید ظاهر شود.
5. برای سؤال سقف قیمت، پاسخ باید ناحیه مقاومت و سناریوی صعودی/نزولی را توضیح دهد و آن را تضمین قطعی معرفی نکند.
6. در صفحه سبد ترکیبی، ریسک مؤثر و شاخص‌های رفتاری باید در کارت پروفایل نمایش داده شوند.

## تغییرات کلیدی

- تشخیص واژه با مرز یونیکد؛ رفع تطبیق اشتباه «ما» در «تومان»
- حافظه ساختاریافته برای ادامه مکالمه‌های کوتاه
- پشتیبانی مستقیم از بازار ایران، رمزارز و فارکس
- سناریوهای عددی فقط از حمایت/مقاومت و تحلیل معتبر
- پروفایل روان‌شناختی ده‌بُعدی و قابل توضیح
- استفاده از ریسک مؤثر در سبد، با سقف ظرفیت زیان و نقدشوندگی
- صفحه نتیجه حرفه‌ای، واکنش‌گرا و سازگار با تم روشن و تاریک
