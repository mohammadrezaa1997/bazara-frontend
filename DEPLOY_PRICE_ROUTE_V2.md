# استقرار مسیر قیمت NeuroVest

این فرانت Static Export نیست و باید با Node.js اجرا شود، چون `/api/prices`
یک Route داینامیک است:

```bash
npm ci
npm run build
npm run start -- -H 0.0.0.0 -p 3000
```

این مسیر درخواست‌ها را یک دقیقه cache می‌کند، CoinGecko و سه منبع تتر را با
timeout کوتاه و به‌صورت موازی می‌خواند و هنگام قطع موقت از آخرین پاسخ سالم
حافظه استفاده می‌کند.

برای CoinGecko اختیاری:

```env
COINGECKO_API_KEY=
COINGECKO_API_KEY_TYPE=demo
```

اگر میزبان Next.js به دامنه‌های خارجی دسترسی ندارد، آدرس relay مجاز را بدهید:

```env
PRICE_UPSTREAM_PROXY_URL=https://your-authorized-relay.example/prices
PRICE_UPSTREAM_PROXY_TOKEN=change-me
```

در غیر این صورت باید خروجی HTTPS/DNS برای `api.coingecko.com` و حداقل یکی از
`api.nobitex.ir`، `api.wallex.ir` یا `api.bitpin.ir` توسط دیتاسنتر باز شود.
