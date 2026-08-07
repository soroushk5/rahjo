# استقرار رهجو روی Hostinger

## معماری انتشار

- `main`: سورس، تست‌ها و اسناد توسعه.
- `hostinger-preview`: خروجی تولیدشده و آماده استقرار؛ بدون تست، اسناد داخلی یا وابستگی build.
- Hostinger باید فقط به شاخه `hostinger-preview` متصل شود.

پس از موفق‌شدن Workflow اصلی روی `main`، GitHub Actions شاخه `hostinger-preview` را خودکار بازسازی می‌کند.

## مسیر پیشنهادی برای دیدن نسخه زنده

1. در Hostinger یک **Empty Website** با دامنه موقت یا یک subdomain آزمایشی ایجاد کنید.
2. وارد `Websites → Dashboard → Git` شوید.
3. چون Repository خصوصی است، گزینه SSH را انتخاب و کلید عمومی ساخته‌شده توسط Hostinger را به GitHub Repository به‌عنوان **read-only deploy key** اضافه کنید.
4. Repository address: `git@github.com:soroushk5/rahjo.git`
5. Branch: `hostinger-preview`
6. Install path را خالی بگذارید تا مستقیماً در `/public_html` نصب شود.
7. قبل از Deploy، `public_html` باید خالی باشد. فایل پیش‌فرضی مانند `default.php` را حذف کنید.
8. Deploy را اجرا کنید و SSL را فعال نگه دارید.
9. مسیرهای `/`, `/platform`, `/atlas`, `/dashboard`, `/request`, `/trust`, `/map` و `/health.json` را مستقیم باز کنید.

## Auto Deployment

در صفحه Git روی Auto Deployment بزنید و Webhook URL را دریافت کنید. آن URL باید به Repository webhook با event نوع `push` متصل شود. چون شاخه `hostinger-preview` بعد از موفقیت QA به‌روزرسانی می‌شود، هر انتشار فقط بعد از پاس‌شدن کنترل کیفیت به Hostinger می‌رسد.

## سیاست Preview

نسخه Preview عمداً `noindex` است، `robots.txt` تمام crawlerها را مسدود می‌کند و هدر `X-Robots-Tag` نیز فعال است. پس از تعیین دامنه نهایی، build تولیدی با `DEPLOY_MODE=production` و `SITE_ORIGIN=https://example.com` ساخته می‌شود.

## Rollback

در Hostinger از تاریخچه Deploy یا در GitHub از Commit قبلی `hostinger-preview` استفاده کنید. شاخه Preview generated است و نباید دستی ویرایش شود.
