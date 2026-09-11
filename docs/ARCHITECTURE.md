# معماری فاز اول رهجو

## مدل محصول

هستهٔ رهجو یک زنجیرهٔ عملیاتی مشترک است:

`ورودی → Account/Contact → Opportunity/Case → Service → Approval → Action/Run → Receipt → Outcome`

وب‌سایت عمومی، ورودی و محیط عملیاتی باید همین ontology را ادامه دهند. سایت نباید یک مدل بازاریابی جدا از مدل دادهٔ محصول داشته باشد.

## اصل‌های معماری

- deterministic core + optional intelligence
- workspace isolation و authorization در سمت server
- explicit runtime mode: `demo | server`
- هیچ fallback پنهان از Server mode به Golden Demo
- یک contract پایدار Rahjo-native بین frontend و backend
- Relaticle به‌عنوان سرویس/adapter جدا، نه vocabulary مستقیم frontend
- audit/provenance به‌عنوان قابلیت محصول
- عملیات حساس پشت human approval

## توپولوژی فعلی

```text
Rahjo Web (Hostinger)
    |
    | HTTPS / credentialed CORS
    v
Rahjo Node BFF (Hostinger Web App)
    |
    +-- session / CSRF / workspace scope
    +-- versioned Rahjo API
    +-- operational projection
    +-- idempotency / audit / provenance
    |
    v
PostgreSQL (Supabase)
    |
    +-- forced workspace policies
    +-- Rahjo domain tables
    +-- web sessions / API state
    +-- crm_entity_refs
    |
    +--> native_deferred CRM bridge   [CURRENT LIVE]
    |
    +--> Relaticle adapter            [IMPLEMENTED, NOT LIVE]
```

وضعیت فعلی عمداً `native_deferred` است. این حالت برای جلوگیری از ادعای غلط، رکوردهای CRM را با `pending_relaticle` مشخص می‌کند و خود را Relaticle معرفی نمی‌کند.

## توپولوژی هدف

```text
Rahjo Web
  → Rahjo BFF/API
  → Relaticle service
      → PostgreSQL
      → Redis
      → worker / scheduler
      → storage
      → REST / MCP

Rahjo BFF/PostgreSQL
  → Case / Service / Approval / Action / Run / Receipt / Outcome / Audit
```

Relaticle Company/People/Opportunity/Task می‌توانند پایهٔ Account/Contact/Opportunity/Task باشند، اما مفاهیم Rahjo مثل Case، Approval، Action، Receipt و Outcome نباید داخل custom fieldها پنهان شوند.

## مرزهای کد

```text
src/
  app/                    routing, runtime boundary, shells
  components/             shared visual primitives
  features/public/        public product experience
  features/auth/          demo entry renderer; server login is runtime-owned
  features/requests/      request/case intake experience
  features/operations/    demo + server operational presentations
  services/
    runtimeDataFacade.js  server projection/session client
    phaseOneStore.js      Golden Demo only
server/
  src/
    app.js                Rahjo BFF routes
    repository.js         tenant-scoped persistence
    relaticleClient.js    real Relaticle REST/MCP adapter
    nativeDeferredCrmClient.js explicit interim bridge
    security.js           request/security controls
    normalization.js      deterministic normalization
  migrations/             PostgreSQL schema and workspace policies
  tests/                  BFF/security/domain contract tests
styles/
  tokens.css
  base.css
  phase-one.css
  w14-public.css
```

## Runtime boundary

### Demo mode

Golden Demo اجازه دارد از browser-local synthetic state استفاده کند. هیچ side effect بیرونی و هیچ دادهٔ واقعی نباید وارد آن شود.

### Server mode

Server mode از projection و commandهای BFF استفاده می‌کند. اگر session، backend یا قرارداد پاسخ خراب شود، UI باید حالت خطا/ورود/ممنوعیت را نشان دهد و نباید seed یا localStorage را جایگزین دادهٔ سرور کند.

`runtimeDataFacade` مسئول این مرز است و پاسخ server را با `dataMode=server` و workspace identity معتبر می‌پذیرد.

## هویت و Workspace

- session از cookie امن HttpOnly/Secure/SameSite استفاده می‌کند.
- mutationها CSRF-protected هستند.
- workspace از session/server context مشتق می‌شود، نه header آزاد client.
- PostgreSQL دارای policyهای workspace-scoped است.
- دو-workspace isolation بخشی از acceptance اجباری است.

## دامنهٔ Rahjo

مفاهیم اصلی:

- Workspace / Membership
- Account / Contact
- Lead / Opportunity
- Case
- Service / Capability
- Interaction / Task
- Approval
- Action / Run
- Execution Receipt
- Outcome
- Document / Provenance
- Audit / Outbox / Idempotency

هر mutation مهم باید actor/source/correlation/workspace و نتیجهٔ قابل بازسازی داشته باشد.

## Relaticle boundary

Integration مورد نظر:

- سرویس جدا و تا حد ممکن نزدیک upstream
- team-pinned least-privilege credentials per workspace
- REST برای CRM CRUD
- MCP برای schema/search/fetch/tool access در آینده
- validation و authorization همچنان در مرز Rahjo حفظ می‌شود

Relaticle تحت AGPL-3.0 است. کپی یا deep fork قابل‌توجه بدون ADR/تصمیم صریح مجوز انجام نمی‌شود.

## هوش مصنوعی

AI در critical path فاز اول نیست. با خاموش بودن Model Gateway باید این مسیر کار کند:

`Intake → Account → Case → Service → Approval → Action → Receipt → Outcome → Dashboard`

مدل نباید مالک authorization، canonical pricing، قرارداد، execution confirmation یا human approval باشد.

## سازگاری نسخه‌های قبل

`legacyCompatibility` برای deep-linkهای قدیمی باقی می‌ماند، اما مسیرهای legacy و storeهای قدیمی مرجع معماری جدید نیستند. Golden Demo برای presentation/QA حفظ می‌شود و Server mode منبع دادهٔ عملیاتی مستقل و صریح دارد.

## استقرار و production-readiness

Frontend و Node BFF روی Hostinger و PostgreSQL روی Supabase در وضعیت interim live هستند.

مواردی که هنوز production-ready کامل را مسدود می‌کنند:

- Relaticle service واقعی + team/PAT/custom-field provisioning
- MCP live acceptance
- backup retention خارج از production database و restore واقعی dataset زنده
- باقی‌مانده‌های API abuse/429 و website intake acceptance

بنابراین «live» و «production-ready» دو وضعیت جدا هستند و مستندات/UX باید همین تفاوت را حفظ کنند.
