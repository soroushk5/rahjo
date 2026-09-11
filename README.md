# رهجو — مدیریت مشتری تا نتیجه

رهجو یک محصول عملیاتی برای کسب‌وکارهای خدماتی است که ورودی مشتری، حافظهٔ تجاری، فروش، پروندهٔ خدمت، تأیید انسانی، اجرا، رسید و نتیجه را در یک جریان واحد نگه می‌دارد.

نسخهٔ فعلی دو حالت صریح دارد:

- **Server mode** — رابط عملیاتی به Rahjo BFF و PostgreSQL متصل است، نشست امن و جداسازی Workspace دارد و مسیر اصلی Case → Approval → Action → Run → Receipt → Outcome بدون وابستگی به LLM کار می‌کند.
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

- سایت عمومی: خانه، محصول، خدمات، موارد استفاده، نحوهٔ کار، اعتماد، راه‌اندازی و تماس
- ورودی مشتری: ثبت درخواست/Case با منبع و provenance
- محیط عملیاتی: Dashboard، مشتریان، فروش، خدمات، پرونده‌ها، کارها، عملیات، اسناد، گزارش و ممیزی
- Account 360: رابطهٔ مشتری، افراد، فرصت‌ها، Caseها، تعهدات باز و سابقه
- Case: خدمت، تأیید، اقدام، Run، Receipt، Outcome و timeline

## هوش مصنوعی

AI جزء critical path فاز اول نیست.

مجوز، workspace scope، canonical state، قیمت/تعهد قطعی، تأیید انسانی و اجرای نهایی نباید به مدل واگذار شوند. قابلیت‌های هوشمند آینده می‌توانند تحلیل، پیشنهاد یا خلاصه اضافه کنند، ولی مسیر عملیاتی پایه با همهٔ providerها خاموش قابل اجرا است.

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
