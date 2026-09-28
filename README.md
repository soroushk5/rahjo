# CRM Core — CRM استاندارد و قابل توسعه

CRM Core یک هستهٔ CRM چندفضای‌کاری برای مدیریت مشتری، مخاطب، سرنخ، فرصت فروش، وظیفه و فعالیت است. طراحی محصول provider-neutral است: منطق CRM به یک backend خاص وابسته نیست و Relaticle فقط یکی از adapterهای قابل استفاده است.

## هستهٔ استاندارد CRM

مدل اصلی محصول:

```text
Lead
→ Account
→ Contact
→ Opportunity
→ Task / Activity / Note
→ Follow-up
```

قواعد هسته:

- Account و Contact مرجع اصلی رابطه با مشتری هستند.
- Lead ورودی خام است و می‌تواند به Account/Contact و Opportunity تبدیل شود.
- Opportunity دارای stage، owner و next action است.
- Task/Activity/Note تاریخچهٔ تعامل و پیگیری را می‌سازند.
- Workspace isolation، RBAC، audit و provenance زیرساخت هستند.
- backend failure هرگز با demo/local data پنهان نمی‌شود.

## Extensionهای اختیاری

Case، Service، Approval، Action، Run، Receipt و Outcome از هستهٔ CRM جدا می‌شوند و به‌عنوان Workflow/Operations Extension حفظ می‌شوند. این extension برای تیم‌هایی است که بعد از فروش نیاز به اجرای فرایند، تأیید انسانی یا ثبت نتیجه دارند؛ اما دیگر هویت یا پیش‌فرض CRM نیست.

## Runtime

دو حالت صریح وجود دارد:

- **Server mode** — رابط به CRM BFF و PostgreSQL متصل است، نشست امن و workspace isolation دارد.
- **Demo mode** — دادهٔ ساختگی و مرورگرمحلی برای نمایش و QA، کاملاً جدا از دادهٔ سرور.

تنظیمات canonical backend با پیشوند `CRM_*` هستند. نام‌های قدیمی فقط موقتاً در compatibility shim پذیرفته می‌شوند تا cutover production بدون downtime انجام شود.

## Provider boundary

```text
CRM Web
  → CRM Core BFF
  → CRM Repository
  → CRM Provider Adapter
       ├─ Relaticle
       └─ Native deferred bridge (interim)
  → PostgreSQL
```

API و UI با مفاهیم `Account` و `Contact` کار می‌کنند؛ adapter مسئول نگاشت آن‌ها به واژگان backend است.

## API هسته

در این مرحله:

- `GET /api/v1/runtime`
- `POST /api/v1/accounts`
- `POST /api/v1/contacts`
- session/account lifecycle
- public intake
- workflow extension routes

نوشتن Account/Contact نیازمند `crm:write` و نقش owner/admin/operator است.

## وضعیت production

production فعلی هنوز **interim / not production-ready** است. تا وقتی backend نهایی، restore production و provider provisioning کامل نشده‌اند این برچسب تغییر نمی‌کند.

## اجرای محلی

Frontend:

```bash
npm install
npm run dev
```

Backend:

```bash
cd server
npm install
npm run check
npm test
```

## کنترل کیفیت

```bash
npm run check
npm test
npm run build:hostinger
npm run smoke:hostinger
```

CI باید هم Quality و هم foundation/security gates را پاس کند.

## اسناد

- `docs/CRM_STANDARDIZATION.md` — قرارداد استانداردسازی و cutover
- `docs/ARCHITECTURE.md` — معماری فنی
- `docs/GO_LIVE_CHECKLIST.md` — گیت‌های go-live
- `docs/HOSTINGER_PRODUCTION.md` — قرارداد deployment

## مرز امنیت و مجوز

- credential واقعی وارد UI، source، receipt یا log نمی‌شود.
- provider tokenها server-side و workspace-pinned هستند.
- Relaticle تحت AGPL-3.0 به‌عنوان سرویس جدا و adapter شده نگه داشته می‌شود.
- تغییر backend provider نباید قرارداد دامنهٔ CRM را عوض کند.
