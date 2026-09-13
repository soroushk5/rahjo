# رهجو — مدیریت مشتری تا نتیجه

رهجو یک CRM و فضای عملیاتی برای تیم‌هایی است که مشتری، فروش، پرونده و اجرای کار را در یک جریان قابل پیگیری نگه می‌دارند. دسته‌بندی محصول عمداً به یک صنعت محدود نیست؛ فروش B2B، بازرگانی، خدمات و پروژه، آموزش و مشاوره و کسب‌وکارهای در حال رشد می‌توانند از همان هستهٔ مشترک استفاده کنند.

نسخهٔ فعلی دو حالت صریح دارد:

- **Server mode** — رابط عملیاتی به Rahjo BFF و PostgreSQL متصل است، نشست امن و جداسازی Workspace دارد و مسیر اصلی Case → Approval → Action → Run → Receipt → Outcome را روی دادهٔ سرور اجرا می‌کند.
- **Golden Demo mode** — دادهٔ ساختگی و مرورگرمحلی برای نمایش و QA است و از دادهٔ سرور جدا می‌ماند.

در Server mode هیچ شکست backend نباید با دادهٔ دمو یا `localStorage` پنهان شود.

## وضعیت Production فعلی

نسخهٔ public و backend زنده‌اند، اما وضعیت رسمی همچنان **interim / not production-ready** است.

توپولوژی فعلی:

```text
Rahjo Web
  → Rahjo Node BFF
  → PostgreSQL (Supabase)
  → native_deferred CRM bridge
```

Relaticle هنوز به‌عنوان سرویس production جداگانه deploy/provision نشده است. adapter آن در source وجود دارد و مرز AGPL حفظ شده، اما CRM زندهٔ فعلی به‌صورت صریح `native_deferred` کار می‌کند و رکوردهای در انتظار Relaticle را به‌عنوان Relaticle جا نمی‌زند.

همچنین MCP زندهٔ Relaticle و backup/restore کامل dataset production هنوز gateهای باز production-readiness هستند.

## مدل عملیاتی

زنجیرهٔ canonical محصول:

```text
Intake
→ Account / Contact
→ Opportunity / Case
→ Service
→ Approval
→ Action / Run
→ Execution Receipt
→ Outcome
→ Account / Dashboard history
```

مفاهیم Rahjo مانند Case، Service، Approval، Action، Run، Receipt، Outcome، Provenance و Audit مفاهیم درجه‌یک دامنه هستند و صرفاً custom field نیستند.

## سطوح محصول

- سایت عمومی canonical: **خانه و محصول**؛ ورود به محیط کار یک utility action جداست و هدر تب عمومی ندارد.
- `/contact`، `/pilot` و مسیرهای بازاریابی قدیمی compatibility-only هستند. تا وقتی public acquisition/intake واقعی وجود ندارد، «شروع» نباید به صفحهٔ نمایشی یا dead-end اشاره کند.
- ورودی مشتری: ثبت درخواست/Case با منبع و provenance.
- محیط عملیاتی: Dashboard، مشتریان، فروش، خدمات، پرونده‌ها، کارها، عملیات، اسناد، گزارش و ممیزی.
- Account 360: رابطهٔ مشتری، افراد، فرصت‌ها، Caseها، تعهدات باز و سابقه.
- Case: خدمت، تأیید، اقدام، Run، Receipt، Outcome و timeline.

## قرارداد سایت عمومی

صفحهٔ عمومی باید کوتاه و product-led بماند:

1. یک promise روشن و یک preview کوچک از محیط محصول.
2. یک شماتیک ساده از `ورودی → مشتری → فرصت → پرونده → نتیجه`.
3. سه ستون اصلی: **حافظهٔ مشتری، فروش و پیگیری، پرونده و اجرا**.
4. CTAهایی که فقط به مقصد واقعی بروند: **محصول، ورود یا محیط کار**.

نمایش چند screenshot بزرگ پشت سر هم، feature-gridهای پرکننده، CTA نمایشیِ «شروع» و صفحه‌های عمومی بدون ارزش مستقل خلاف baseline فعلی W14 هستند.

Public Site QA علاوه بر render دسکتاپ/موبایل، CTAهای canonical را کلیک می‌کند و مقصد نهایی route را بررسی می‌کند. لینک `/contact` در public canonical تا زمان تکمیل W14-005 مجاز نیست.

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

برای frontend محلی سپس `http://localhost:4173` را باز کنید. تنظیم runtime باید مشخص کند محیط در `demo` یا `server` mode اجرا می‌شود.

## کنترل کیفیت

```bash
npm run check
npm test
npm run build:hostinger
npm run smoke:hostinger
```

برای BFF نیز تست‌های `server/` باید جداگانه پاس شوند. انتشار production تنها با سبز بودن CI کافی نیست؛ gateهای امنیت، restore و topology نیز در Task OS canonical نگه‌داری می‌شوند.

## اسناد مرجع

- وضعیت اجرای canonical: Google Drive `RAHJO — Task OS — Phase 1 Operational Foundation`
- قرارداد W14 سایت و محصول عمومی: `docs/W14_PUBLIC_PRODUCT_ALIGNMENT.md`
- معماری فنی: `docs/ARCHITECTURE.md`
- Blueprint فاز اول: `docs/PHASE_ONE_PRODUCT_BLUEPRINT.md`
- قرارداد انتشار Hostinger: `docs/HOSTINGER_PRODUCTION.md`
- چک‌لیست go-live: `docs/GO_LIVE_CHECKLIST.md`

## مرز ایمنی و مجوز

- Golden Demo از Server mode جدا است.
- credential واقعی نباید در UI، source، Drive receipt یا log قرار بگیرد.
- Relaticle تحت AGPL-3.0 بررسی و pin شده است؛ source قابل‌توجه Relaticle بدون تصمیم مجوز/provenance جداگانه داخل Rahjo کپی نمی‌شود.
- تا زمانی که Relaticle/MCP production و restore واقعی production تأیید نشده‌اند، از برچسب `production-ready` استفاده نمی‌شود.

مسیرهای legacy فقط برای سازگاری نگه داشته می‌شوند و نباید منبع معماری یا روایت جدید محصول باشند.
