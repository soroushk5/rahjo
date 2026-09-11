# چک‌لیست انتشار رهجو

## Live operational foundation

- [x] بررسی typeها و تست‌های frontend سبز است.
- [x] build و smoke بستهٔ Hostinger پاس می‌شود.
- [x] Frontend و Node BFF روی محیط زنده publish شده‌اند.
- [x] Server mode به PostgreSQL واقعی متصل است.
- [x] session امن، CSRF و server-derived workspace scope فعال‌اند.
- [x] دو Workspace در API isolation پاس شده‌اند.
- [x] مسیر no-LLM `Case → Approval → Action → Run → Receipt → Outcome` روی live API پاس شده است.
- [x] failure در Server mode با Golden Demo/localStorage پنهان نمی‌شود.
- [x] cold-browser bootstrap و reload-safe rehydration پاس شده است.
- [x] `noindex,nofollow,noarchive` تا تصمیم انتشار عمومی نهایی فعال است.

## Public/Product alignment

- [x] Landing از demo-first framing جدا شده و با ontology محصول زنده هماهنگ است.
- [ ] Product / Services / Use Cases / How It Works با همان ontology و claims واقعی منتشر شوند.
- [ ] Workspace entry و Golden Demo برای کاربر نهایی کاملاً قابل تشخیص باشند.
- [ ] Website/RFQ عمومی به intake واقعی BFF با provenance/idempotency وصل شود.
- [ ] Desktop/mobile RTL، keyboard/focus/contrast و overflow با گزارش زنده پذیرفته شوند.
- [ ] README/Architecture/marketing claims با runtime واقعی همگام بمانند.

## Production-ready کامل

موارد زیر باید پیش از تغییر `productionReady=false` به `true` پاس شوند:

- [ ] Relaticle جداگانه deploy و provenance آن pin شده است.
- [ ] حداقل دو Relaticle Team و credentialهای least-privilege team-pinned provision شده‌اند.
- [ ] Account/Contact/Opportunity/Task روی Relaticle واقعی create/read/reload و tenant-isolation پاس شده‌اند.
- [ ] custom fieldهای مورد نیاز با machine-stable semantics روی Relaticle واقعی provision شده‌اند.
- [ ] MCP live شامل auth/team identity/schema/search/fetch/revoke evidence پاس شده است.
- [ ] REST abuse/rate-limit و HTTP 429 acceptance evidence ثبت شده است.
- [ ] backup production با retention/encryption مناسب خارج از همان database نگه‌داری می‌شود.
- [ ] dataset واقعی production در محیط fresh restore شده و login/read/write/audit smoke پاس شده است.
- [ ] Website/RFQ re-entry صفر و duplicate-safe retry روی production evidence دارد.
- [ ] accessibility و browser compatibility با گزارش ثبت‌شده پذیرفته شده‌اند.
- [ ] متن حقوقی، privacy و data retention با مدل واقعی production تأیید شده‌اند.
- [ ] domain/canonical/sitemap/Open Graph نهایی و انتشار عمومی توسط انسان تأیید شده است.
- [ ] seed/demo data از production data جدا و قابل تشخیص است.
- [ ] حذف `noindex` فقط بعد از تأیید صریح go-live انجام می‌شود.

## Claim rule

تا قبل از پاس شدن همهٔ gateهای Production-ready، از عبارت‌های `production-ready`, `live Relaticle`, `live MCP`, `verified disaster recovery` یا معادل فارسی آن‌ها استفاده نشود. وضعیت درست فعلی: **Live operational foundation / interim CRM**.
