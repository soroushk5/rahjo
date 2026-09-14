# W15 — Identity & Account Lifecycle

## هدف

رهجو باید بدون وابستگی به یک مرورگر یا دستگاه خاص، حساب‌های واقعی workspace را ایجاد، بازیابی و احراز هویت کند. این بسته روی session و tenant boundary سروری موجود ساخته می‌شود و آن را با signup عمومی یا auth مرورگر جایگزین نمی‌کند.

## قرارداد محصول

- عضویت workspace **invite-only** است. signup عمومی که بتواند یک نفر ناشناس را وارد workspace `rahjo` کند وجود ندارد.
- Owner/Admin می‌تواند برای ایمیل جدید، نام و نقش `admin | operator | viewer` یک لینک دعوت یک‌بارمصرف بسازد.
- لینک دعوت در fragment URL قرار می‌گیرد، ۴۸ ساعت اعتبار دارد، token خام در دیتابیس ذخیره نمی‌شود و پس از پذیرش قابل استفاده مجدد نیست.
- کاربر دعوت‌شده لینک را روی هر دستگاه باز می‌کند، گذرواژه حداقل ۸ کاراکتری تعیین می‌کند و همان‌جا session سروری دریافت می‌کند.
- Owner/Admin می‌تواند برای عضو موجود reset link کوتاه‌عمر بسازد. reset link یک‌بارمصرف است و پس از مصرف همه sessionهای قبلی آن user باطل می‌شوند.
- هر کاربر واردشده می‌تواند گذرواژه‌اش را با ارائه گذرواژه فعلی تغییر دهد؛ این کار sessionهای قبلی را باطل می‌کند.
- هر کاربر واردشده می‌تواند مجموعه جدید recovery code تولید کند. کد خام فقط یک‌بار به کاربر نمایش داده می‌شود؛ سرور فقط SHA-256 کدهای پرآنتروپی را ذخیره می‌کند. تولید مجموعه جدید، مجموعه قبلی را باطل می‌کند.
- recovery code روی دستگاه جدید همراه workspace/email و گذرواژه جدید مصرف می‌شود و سپس session تازه ساخته می‌شود.
- cookie production همچنان `__Host-rahjo_session`, `Secure`, `HttpOnly`, `Path=/`, `SameSite=Lax` است. UI و API فعلی sibling subdomainهای یک site هستند؛ اگر در آینده cross-site شوند، cookie/CORS/CSRF باید دوباره بازبینی شود.

## مرزهای امنیتی

- password hashing همان scrypt فعلی Node باقی می‌ماند: `N=16384, r=8, p=1, 64 bytes` با salt تصادفی ۱۶ بایتی.
- invitation/reset/recovery bearer secretها حداقل ۲۵۶ بیت entropy دارند و فقط digest ذخیره می‌شود.
- endpointهای عمومی invite/reset/recovery rate-limited هستند و failure عمومی اطلاعاتی درباره وجود email/workspace افشا نمی‌کند.
- Owner/Admin permission روی server و database function هر دو enforce می‌شود.
- password rotation، reset و recovery `authz_version` را بالا می‌برند و sessionهای موجود user را revoke می‌کنند.
- هیچ password یا recovery secret نباید در repo، Task OS یا receipt ذخیره شود.

## مسیرهای HTTP

Public one-time flows:

- `POST /api/v1/invitations/accept`
- `POST /api/v1/account/reset`
- `POST /api/v1/account/recovery`

Authenticated account flows:

- `GET /api/v1/members` — Owner/Admin
- `POST /api/v1/members/invitations` — Owner/Admin + CSRF
- `POST /api/v1/members/:membershipId/reset-link` — Owner/Admin + CSRF
- `POST /api/v1/account/password` — current password + CSRF
- `POST /api/v1/account/recovery-codes` — CSRF

UI:

- `/accept-invite`
- `/recover-account`
- `/account`

## Bootstrap مالک فعلی

برای lockout اولیه `owner@rahjo.local`، بعد از deploy migration و backend از utility زیر در محیط production backend استفاده می‌شود:

```bash
RAHJO_MIGRATION_DATABASE_URL='…' node scripts/issue-account-reset.mjs \
  --workspace-slug rahjo \
  --email owner@rahjo.local \
  --ui-origin https://linen-crocodile-733177.hostingersite.com
```

این utility گذرواژه را نمی‌گیرد و تغییر نمی‌دهد؛ فقط یک reset URL کوتاه‌عمر و یک‌بارمصرف صادر می‌کند. مالک URL را باز می‌کند و خودش گذرواژه جدید را در UI تعیین می‌کند.

## Acceptance

W15 account lifecycle وقتی قابل پذیرش است که:

1. owner locked-out با reset link یک‌بارمصرف روی browser تازه وارد شود؛
2. owner از `/account` یک عضو جدید invite کند؛
3. invite روی browser/device پاک پذیرفته شود و user session واقعی بگیرد؛
4. refresh و بازگشت مستقیم به protected route session را حفظ کند؛
5. logout session را revoke کند؛
6. password change sessionهای قبلی را باطل کند؛
7. recovery code روی browser/device مستقل فقط یک بار قابل مصرف باشد؛
8. token/recovery code خام در database/log/receipt نماند؛
9. هیچ open signup برای عضویت workspace وجود نداشته باشد.

## خارج از این بسته

- ارسال خودکار invitation/reset از طریق email provider. لینک‌ها فعلاً توسط Owner/Admin به‌شکل امن منتقل می‌شوند؛ delivery provider می‌تواند بعداً بدون تغییر trust model افزوده شود.
- SSO/Google/Microsoft login.
- انتقال نقش Owner و سیاست‌های چندمالک.
- تغییر boundary کلی W13/Relaticle یا ادعای production-ready بودن CRM.
