# Rahjo Presentation System

این سند مرجع نسخه‌ی قابل‌ارائه رهجو است و میان هویت بصری، داده‌ی نمایشی و رفتار محصول یک قرارداد مشترک می‌سازد.

## مبنای بصری

نسخه‌ی فعلی بر سه دارایی قبلی پروژه بنا شده است:

- `01 - کانسپت هویت بصری رهجو.png`
- `05 - سیستم آیکون‌های رهجو.png`
- `06 - وایرفریم اولیه وب‌سایت و محصول رهجو.png`

اصول حفظ‌شده:

- لوگوی مسیر/جست‌وجو + گره داده + تأیید
- خطوط و آیکون‌های 2px با گوشه‌های گرد
- Navy + Teal به‌عنوان هویت اصلی
- Amber فقط برای Gate و هشدار
- شبکه و گراف به‌عنوان ابزار فهم، نه تزئین
- فضای عمومی روشن و کنسول با Sidebar سرمه‌ای

## Design tokens

- Navy: `#0B1D33`
- Teal: `#0FA3B1`
- Cyan: `#22D3EE`
- Amber: `#F5A623`
- Soft background: `#F2F5F7`
- Cool border: `#E0E8ED`
- Typeface: `Vazirmatn` برای کل رابط فارسی و کنترل‌ها

## هندسه و spacing

- Public container: حداکثر 1240px
- Product sidebar: 272px دسکتاپ
- Card radius: 14–18px
- Hero visual radius: 32px
- Dashboard gap: 12–16px
- Public section rhythm: 72–120px
- Mobile breakpoint اصلی: 980px
- Compact mobile breakpoint: 720px

## Mock data contract

تمام داده‌های زیر نمایشی هستند و نباید به‌عنوان داده عملیاتی معرفی شوند:

- KPIها
- Trend chart
- درخواست‌های seed
- Audit events
- Readiness percentage
- Workspace/organization

مقادیر موجود در ممیزی واقعی که باید عیناً حفظ شوند:

- ۵۲ عنوان در سبد بررسی؛ نه ۵۲ سرویس فعال
- ۶ خوشه داده
- ۰ ادعای عمومی تأییدشده بر اساس مدارک فعلی
- Gate عرضه Production بسته تا تکمیل مدارک

## Demo authentication

Route: `/login`

Demo account:

- `demo@rahjo.ir`
- `RahjoDemo1405`

این حساب فقط یک Session محلی در مرورگر ایجاد می‌کند و به backend یا حساب واقعی متصل نیست.

## Presentation routes

Public:

- `/`
- `/data`
- `/platform`
- `/trust`
- `/map`
- `/login`

Demo console:

- `/dashboard`
- `/dashboard/requests`
- `/dashboard/data`
- `/dashboard/audit`
- `/request`

## Primary demo flow

1. ورود از `/login`
2. مشاهده‌ی `/dashboard`
3. ایجاد درخواست از `/request`
4. انتخاب خوشه
5. تعریف سازمان، حجم و کاربرد
6. Review و ثبت Mock request
7. بازگشت به `/dashboard/requests`
8. مشاهده‌ی همان درخواست در Browser-local state

## Presentation safety

- API واقعی وجود ندارد.
- داده شخصی واقعی نباید وارد شود.
- درخواست‌های جدید فقط در `localStorage` همان مرورگر قرار می‌گیرند.
- API key واقعی صادر نمی‌شود.
- متن رابط نباید اتصال، مجوز یا SLA اثبات‌نشده را القا کند.

## Visual QA surfaces

در هر release ارائه‌ای این صفحات باید در desktop و mobile مرور شوند:

- Landing
- Login
- Dashboard overview
- Requests dashboard
- Data portfolio dashboard
- Audit dashboard
- Data Atlas
- Ecosystem Map
- Access Request
