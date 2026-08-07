# Rahjo go-live checklist

## قبل از اتصال

- [ ] دامنه موقت یا subdomain اختصاصی Preview ساخته شده است.
- [ ] `public_html` خالی است.
- [ ] Deploy key فقط read-only است.
- [ ] Hostinger به شاخه `hostinger-preview` متصل شده است.

## بعد از اولین Deploy

- [ ] `/health.json` مقدار `status: ok` نشان می‌دهد.
- [ ] Refresh مستقیم روی تمام routeها خطای 404 نمی‌دهد.
- [ ] فونت Vazirmatn بارگذاری می‌شود.
- [ ] موبایل و دسکتاپ overflow افقی ندارند.
- [ ] Console مرورگر خطای JavaScript یا CSP ندارد.
- [ ] SSL فعال است و mixed content وجود ندارد.
- [ ] سایت در موتور جست‌وجو index نمی‌شود.

## پیش از Production عمومی

- [ ] دامنه نهایی و canonical مشخص شده است.
- [ ] robots و X-Robots-Tag از حالت Preview خارج شده‌اند.
- [ ] Sitemap با URL نهایی ساخته شده است.
- [ ] Open Graph image و metadata نهایی ثبت شده‌اند.
- [ ] Lighthouse و تست مرورگر واقعی ثبت شده‌اند.
- [ ] هیچ ادعای سرویس فعال بدون مدرک در رابط وجود ندارد.
