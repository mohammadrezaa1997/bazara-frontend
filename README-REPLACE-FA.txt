نسخه Responsive + Theme سراسری Neurovest UI

روش جایگزینی:
1) از پروژه فعلی یک نسخه پشتیبان یا commit تهیه کنید.
2) محتویات این ZIP را در ریشه neurovest-ui استخراج و Replace کنید.
3) فایل .env.local و پوشه public پروژه خودتان را حذف یا جایگزین نکنید.
4) سپس اجرا کنید:

npm install
npx tsc --noEmit
npm run lint
npm run build
npm run dev

مسیرهای بررسی:
/
/onboarding
/dashboard
/iran-market
/iran-market/advisor

پوسته روشن، تیره و خودکار از کنترل سه‌حالته هدر قابل انتخاب است و انتخاب کاربر
با کلید neurovest-theme در مرورگر ذخیره می‌شود.
