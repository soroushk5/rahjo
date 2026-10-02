# CRM Core Standardization Contract

## Goal

تبدیل محصول موجود به یک CRM استاندارد، provider-neutral و قابل توسعه، بدون وابستگی هویتی یا دامنه‌ای به محصول قبلی.

## Canonical core

Core entities:
- Workspace
- User / Membership / Role
- Lead
- Account
- Contact
- Opportunity
- Task
- Activity / Note
- Audit / Provenance
- Custom Field
- Import / Dedupe

Core invariants:
- tenant isolation is mandatory;
- every mutation is attributable;
- provider failures fail closed;
- Account/Contact/Opportunity/Task semantics belong to CRM Core, not to a provider;
- UI and API do not expose provider-specific Company/People naming.

## Optional workflow extension

The following concepts are preserved but moved out of the CRM identity:
- Case
- Service / Capability
- Approval
- Action / Run
- Receipt
- Outcome

They may be enabled for operational workflows but are not prerequisites for a standard CRM deployment.

## Runtime contract

Canonical environment names use `CRM_*`.

The existing `RAHJO_*` variables are accepted only by the migration shim during cutover. New deployment manifests, docs and secrets must use `CRM_*`.

## Provider contract

CRM Core speaks:
- listAccounts
- listContacts
- listOpportunities
- listTasks
- createAccount
- createContact

The Relaticle adapter maps these to its upstream collections. No upstream naming may escape into the public CRM API.

## API contract

Core write routes:
- `POST /api/v1/accounts`
- `POST /api/v1/contacts`
- `POST /api/v1/opportunities`
- `POST /api/v1/opportunities/:id/stage`
- `POST /api/v1/tasks`
- `POST /api/v1/tasks/:id/status`
- `POST /api/v1/interactions`

Required authorization:
- scope: `crm:write`
- role: owner, admin or operator

Current core slice:
- Opportunity create/update-stage;
- Task create/update-status;
- Activity/Interaction append using the provider Note contract;
- all writes are crm:write + tenant scoped + audited.

Next core routes:
- Account/Contact update and search;
- Task due-date/assignee UX after custom-field provisioning;
- Activity list/filter UX;
- import/dedupe review.

These routes must only be implemented after their provider contracts are verified; do not guess upstream field shapes.

## Storage migration

Current production storage still uses a legacy schema/role namespace from earlier builds. It remains a compatibility boundary in this PR so the application can be standardized before a breaking database rename.

Separate cutover:
1. ship CRM_* env aliases and generic runtime identity;
2. prove branch CI and production restore;
3. migrate database schema/roles to generic `crm` / `crm_app` names;
4. switch deployment secrets/manifests;
5. remove the legacy env shim;
6. rename external resources/repository after deployment references are updated.

No production schema rename should be performed without a fresh backup/restore receipt.

## External resource rename gate

The following are external identifiers and require a coordinated cutover rather than source-only search/replace:
- GitHub repository name
- Supabase project display name
- Hostinger app/site names and environment keys
- canonical Drive project/task names
- public domain/brand, if a final commercial name is chosen

Until a new commercial brand is supplied, public product copy uses the neutral label **CRM** and technical documentation uses **CRM Core**.

## Acceptance

- no Rahjo branding on canonical public/login/runtime surfaces;
- core package/service names are generic;
- CRM_* is canonical config;
- Account/Contact provider contract is generic;
- Account/Contact write operations are tenant-scoped, role/scoped and audited;
- workflow extension remains optional;
- Quality and foundation CI stay green;
- production is not called ready until restore and provider gates pass.

## قرارداد تکمیلی نرمال‌سازی — RAH-W0-005

وضعیت: قرارداد مصوب مالک، ۲۰۲۶-۱۰-۰۱. این قرارداد مطابق Implementation Blueprint کانونی اجرا می‌شود. PR #55 آزمون‌محور باقی می‌ماند؛ اتصال runtime و آزمون‌های یکپارچه در PR پیگیری #56 انجام می‌شود.

### قرارداد اجرایی مصوب

1. **متن و رقم:** NFKC و یکسان‌سازی Yeh/Kaf عربی به ی/ک فارسی حفظ شود؛ نیم‌فاصلهٔ U+200C حفظ و صورت متفاوت از نظر برابری جدا بماند. تبدیل رقم فقط در فیلد عددیِ اعلام‌شده مجاز است.
2. **تاریخ:** instant به UTC و RFC 3339 با Z ذخیره شود و ورودی offset صریح بخواهد. هر ورودی date-only تقویم صریح داشته باشد و جداگانه به‌شکل Gregorian `YYYY-MM-DD` ذخیره شود. ورودی Jalali به‌شکل قطعی به Gregorian تبدیل شود. منطقهٔ IANA معتبر و پیش‌فرض پروژه `Asia/Tehran` باشد؛ ورودی مبهم fail-closed شود.
3. **پول:** شناسهٔ ارز از ISO 4217؛ ذخیره‌سازی ایران integer `IRR`. مقدار فقط رشتهٔ ده‌دهیِ دقیق باشد؛ `TOMAN` فقط با برچسب صریح و تبدیل دقیق ×۱۰، بدون گردکردن. ممیز شناور ممنوع.
4. **شناسه و جست‌وجو:** مقدار canonical شامل type و normalized value است؛ raw جدا می‌ماند. یکتایی تنها برای typeهای صریحاً canonical-unique و در scope تعیین‌شده اعمال می‌شود. برابری type-aware و field-specific است و از raw استفاده نمی‌کند.
5. **تکراریابی:** شناسهٔ معتبر canonical-unique، سپس تلفن/ایمیل دقیقاً نرمال‌شده؛ fuzzy فقط نامزد بازبینی می‌سازد و هرگز ادغام خودکار ندارد.
6. **ورودی خام:** فیلدهای مجاز intake جدا و tenant-scoped ذخیره می‌شوند. مصوبهٔ مالک: نگهداری دقیقاً ۳۰ روز از `created_at`؛ `retention_until = created_at + 30 days`. cleanup روزانه و idempotent است و فقط رکوردهای `retention_until <= now()` را با هویت worker/maintenance محدود و در محدودهٔ همان tenant حذف می‌کند. نقش runtime فقط insert دارد و API عادی raw را نمی‌خواند یا برنمی‌گرداند؛ raw وارد log، error، receipt، search، equality یا dedupe canonical نمی‌شود.

آزمون‌ها برای Yeh/Kaf، رقم، فاصله/نیم‌فاصله، تلفن، شناسه، تبدیل Jalali/Gregorian، timezone و date-only/instant، IRR/TOMAN، برابری/جست‌وجو، جدایی raw/canonical، تقدم dedupe و منع auto-merge لازم‌اند.

### اتصال اجرایی در PR #56

- `POST /api/v1/tasks` موعد date-only یا instant را اعتبارسنجی و در `crm_entity_contract_values` در ستون‌های جدا ذخیره می‌کند؛ Jalali به Gregorian تبدیل می‌شود و instant به UTC با نگهداری شناسهٔ IANA می‌رود. `GET /api/v1/runtime` مقدار canonical را پس از reload بازمی‌گرداند.
- `POST /api/v1/opportunities` مبلغ صریح IRR یا TOMAN را به رشتهٔ صحیح IRR تبدیل و در همان جدول ذخیره می‌کند؛ مقدار خام فقط در جدول دسترسی‌محدود می‌رود.
- `POST /api/v1/contacts` شناسهٔ نوع‌دار، ایمیل و تلفن canonical را در `crm_entity_identifiers` ثبت می‌کند؛ raw جداست. یکتایی فقط برای `rahjo_contact_id` و `relaticle_contact_id` در محدودهٔ فضای کاری فعال است، چون کلیدهای مرکب موجود یکتایی هر دو را ثابت می‌کنند.
- `GET /api/v1/crm/search` فقط برابری دقیقِ مقدار canonical را برای نام، شناسه، ایمیل، تلفن، تاریخ، لحظه و مبلغ اجرا می‌کند.
- `POST /api/v1/import/contacts` ردیف‌ها را بدون ایجاد/ادغام موجودیت stage می‌کند؛ `GET /api/v1/import/contacts/:batchId` canonical و صف بازبینی را reload می‌کند. تطبیق دقیق شناسه از کل فضای کاری و ردیف‌های همان batch بررسی می‌شود؛ تقدم تطبیق شناسهٔ معتبر، تلفن/ایمیل دقیق و سپس شباهت نام است. امتیاز fuzzy فقط candidate با وضعیت pending و `autoMerge=false` می‌سازد؛ اگر scan نام بیش از ۲۰۰۰ مخاطب داشته باشد، پرچم `fuzzyCandidatesTruncated` محدودیت را آشکار می‌کند.
- migration `009_raw_retention_cleanup.sql` برای raw intake و raw CRM مهلت ۳۰روزه را backfill و در پایگاه‌داده enforce می‌کند؛ تابع `rahjo.cleanup_expired_raw_values` فقط برای worker قابل اجراست، workspace ارسالی را با context تراکنش تطبیق می‌دهد و با batchهای محدود فقط raw منقضی‌شده را حذف می‌کند.
- اجرای دستی/زمان‌بندی‌شده از `npm run cleanup:expired-raw -- <workspace-uuid>` و `CRM_MAINTENANCE_DATABASE_URL` انجام می‌شود. هر فراخوانی فقط یک workspace می‌پذیرد؛ scheduler روزانهٔ production و credential عضوشده در نقش `rahjo_worker` باید جداگانه و در محیط مجاز تنظیم شوند. scheduler موجود Relaticle برای این cleanup استفاده نمی‌شود.
- حذف از پایگاه‌داده به معنی حذف فوری از backup نیست. چرخهٔ نگهداری و انقضای backupها مستقل است؛ این تغییر backup را نمی‌خواند، حذف نمی‌کند و زمان نگهداری آن را تغییر نمی‌دهد.

### پیش‌نویس قدیمی (برای سابقه؛ superseded)

1. **متن فارسی:** برای فیلدهای متنیِ دارای پروفایل فارسی، همان رفتار آزموده‌شدهٔ `normalizePersianText` حفظ شود: NFKC، یکسان‌سازی `ي`/`ى` به `ی` و `ك` به `ک`، حذف فقط کنترل‌نویسه‌های فعلی، فشرده‌سازی فاصله‌های معمولی و حذف فاصله‌های ابتدا و انتهای متن. نیم‌فاصله، فاصلهٔ صفرعرض و اعراب/کشیده دست‌نخورده بمانند تا پروفایل فیلدی جداگانه تصویب شود.
2. **ایمیل و تلفن:** قاعدهٔ ایمیل همان تبدیل رقم فارسی/عربی به لاتین، تبدیل حروف لاتین به حروف کوچک، سقف فعلی ۲۵۴ و اعتبارسنجی فعلی است. تلفن همان تبدیل رقم، حذف جداکننده‌ها، تبدیل پیشوند `00` به `+` و بازهٔ ۸ تا ۱۵ رقم را حفظ می‌کند. هیچ پیش‌شمارهٔ کشوری حدس زده نشود؛ `09…` و `+989…` تا تصویب قاعدهٔ کشور/تبدیل دو مقدار متفاوت‌اند.
3. **شناسه‌ها:** شناسه را عدد فرض نکنید. صفرهای ابتدایی، حروف، خط‌تیره و قالب ورودی را در مقدار مرجع حفظ کنید. نرمال‌سازی کلید جست‌وجو فقط با پروفایل مختص همان نوع شناسه انجام شود. شناسهٔ داخلی پایگاه داده از شناسهٔ بیرونی/ملی/شرکتی جدا بماند و هر یکتایی در محدودهٔ همان فضای کاری تعریف شود. رقم کنترلی یا تبدیل رقم به‌طور سراسری افزوده نشود.
4. **تاریخ و زمان:** تاریخِ تقویمی از لحظهٔ زمانی نوع جدا داشته باشد. نمایش فارسی می‌تواند جلالی باشد؛ مقدار تاریخ ذخیره‌شده میلادی و به‌شکل `YYYY-MM-DD` باشد. لحظهٔ زمانی ورودی باید زمان‌مهر سازگار با RFC 3339 و دارای `Z` یا اختلاف‌زمان باشد؛ در پایگاه داده به‌صورت لحظهٔ UTC ذخیره شود. اختلاف‌زمان جای منطقهٔ زمانی نیست: برای نمایش/برنامه‌ریزی از نام منطقهٔ IANA استفاده شود. زمان‌مهر بی‌منطقه رد شود؛ تاریخ جلالی فقط وقتی پذیرفته شود که تقویم ورودی صریحاً مشخص و تبدیل معتبر باشد. کتابخانهٔ تبدیل، سیاست منطقهٔ زمانی پیش‌فرض و قاعدهٔ موعدهای تاریخ‌محور هنوز انتخاب نشده‌اند.
5. **پول:** مقدار را از رشتهٔ ده‌دهیِ دقیق بخوانید؛ از ممیز شناور دودویی استفاده نکنید. هر مقدار مالی باید واحد و کد ارز آشکار داشته باشد؛ مقایسه/جمعِ مقدارهای بدون واحد یا با واحد متفاوت ممنوع باشد. مدل پیشنهادی ذخیره‌سازی: مقدار صحیح در کوچک‌ترین واحدِ تعریف‌شده برای کد ارز به‌همراه کد ارز و مقیاس؛ اگر دامنه به تومان نیاز دارد، تومان به‌عنوان واحد نمایشی/دامنه‌ای صریح نگهداری و تبدیل آن به IRR فقط پس از تصویب قرارداد و گردکردن انجام شود. کد ارز سه‌حرفی و مقیاس باید از مرجع ISO 4217 گرفته شود؛ این قرارداد به‌تنهایی تومان را کد ISO نمی‌داند.
6. **برابری و جست‌وجو:** برابری از پروفایل همان فیلد پیروی کند. متن فارسی فقط با قواعد بند ۱ کلیدسازی شود؛ ایمیل با قواعد ایمیل؛ تلفن بدون قاعدهٔ کشور معادل‌سازی نشود؛ شناسه با تطبیق دقیقِ نوع‌دار مقایسه شود. جست‌وجوی زیررشته‌ای، پیشوندی یا تقریبی فقط نتیجهٔ پیشنهادی می‌دهد و هویت/تکراری بودن را اثبات نمی‌کند.
7. **ورودی خام:** مقدار نرمال‌شده مقدار کاربردی فعلی است؛ raw جدا و دسترسی‌محدود نگهداری می‌شود و از مسیرهای عادی بازگردانده نمی‌شود. مدت مصوب ۳۰ روز است و حذف از پایگاه‌داده backup را فوراً حذف نمی‌کند.
8. **ورود و تکراریابی:** ابتدا پیش‌نمایشِ بدون نوشتن، محدودهٔ فضای کاری و قواعد یکتایی را نشان دهد. تطبیق دقیق روی کلیدهای مصوب فقط «نامزد تکراری» تولید کند؛ تطبیق تقریبی هرگز ادغام خودکار نکند. ادغام، حذف یا جایگزینی رکورد نیازمند تأیید انسانی و رسید قابل بازبینی است. کلید جلوگیری از تکرار برای همان درخواست حفظ شود.
9. **اعتبارسنجی و سازگاری:** کران‌های فعلی `normalizeIntake` (سازمان ۲۵۵، نام تماس ۱۶۰، هدف ۱۲۰۰، شناسهٔ خدمت ۱۲۰، ایمیل ۲۵۴ و تلفن ورودی ۴۰ نویسه) حفظ شوند. کد جاوااسکریپت فعلی سقف متن را با `String.length` پس از NFKC می‌سنجد؛ بنابراین این سقف واحد UTF-16 است و در این کار تغییر نمی‌کند. هر تغییر آینده در واحد شمارش یا کران‌ها باید با آزمون مرزی و نسخه‌بندی قرارداد همراه باشد.

### جدول قدیمی تصمیم‌ها (superseded؛ تصمیم‌های فعلی در بالا مصوب‌اند)

| تصمیم لازم از مالک | گزینه‌ها و بده‌بستان |
|---|---|
| منطقهٔ زمانی فضای کاری و معنی موعد | انتخاب صریح `Asia/Tehran` برای همهٔ تیم یا تنظیم منطقه برای هر فضای کاری/کاربر؛ اولی یکدستی بیشتری می‌دهد، دومی با اعضای چندمنطقه‌ای سازگارتر است. تا انتخاب، منطقهٔ پیش‌فرض حدس زده نشود. |
| ورود تاریخ جلالی | نمایش جلالی با ورودی فقط میلادی و کم‌ابهام، یا پذیرش ورودی جلالیِ صریح با نیاز به تجزیه‌گر، قواعد سال کبیسه و پیام خطای بیشتر. |
| واحد مرجع پول | نگهداری/نمایش فقط IRR، یا پشتیبانی صریح از تومان به‌عنوان واحد محصول با نسبت تبدیل، مقیاس، گردکردن و متن رسید مشخص؛ گزینهٔ دوم برای کاربر آشناتر اما پرریسک‌تر در تبدیل و گزارش مالی است. |
| شناسهٔ ملی/شرکتی | تعیین انواع شناسه، رقم کنترلی، صفرهای ابتدایی، یکتایی در سطح فضای کاری و دسترسی؛ بدون این تصمیم فقط رشتهٔ خام حفظ می‌شود و یکتایی استنتاج نمی‌شود. |
| کلیدهای تکراریابی | ایمیل، تلفن، شناسه یا ترکیب نوع‌دار؛ تطبیق دقیق مثبت کاذب کمتری دارد، ولی موارد واقعی بیشتری برای بررسی انسانی می‌گذارد. هیچ ادغامی خودکار نیست. |
| نگهداری ورودی خام | تصمیم قدیمی superseded است؛ مصوبهٔ مالک در ۲۰۲۶-۱۰-۰۱: ۳۰ روز از `created_at`، cleanup روزانه و tenant-safe، بدون ادعای حذف فوری از backup. |

### مراجع فنی

- قالب timestamp و offset: [RFC 3339](https://www.rfc-editor.org/rfc/rfc3339)؛ منطقه‌های زمانی و قواعد تاریخی/سیاسی: [پایگاه منطقهٔ زمانی IANA](https://www.iana.org/time-zones).
- کد سه‌حرفی ارز و رابطهٔ واحدهای خرد در ارزهایی که دارند: [ISO 4217](https://www.iso.org/iso-4217-currency-codes.html).
- این مراجع قالب فنی را تعیین می‌کنند؛ تصمیم‌های محصولی جدول بالا را به‌جای مالک نمی‌گیرند.
