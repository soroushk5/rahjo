import { appShell } from "../../app/appShell.js";
import { icon } from "../../components/icons.js";
import { escapeHtml } from "../../lib/html.js";
import {
  demoAccounts,
  demoAutomationRuns,
  demoDataQuality,
  demoFollowUps,
  demoOpportunities,
  demoServiceCapabilities,
  demoServiceRequests,
  operationalMetrics,
  operationalWorkspace
} from "../../data/operationalData.js";

function statusTone(value) {
  if (["Sandbox success", "بسته‌شده نمونه", "Sandbox آماده", "Approved demo", "در حال انجام"].includes(value)) return "positive";
  if (["نیازمند تأیید", "در انتظار تأیید", "باز", "قابل بررسی", "Candidate"].includes(value)) return "warning";
  if (["Blocked", "Blocked / evidence", "مدرک ناقص", "نیازمند Gate"].includes(value)) return "blocked";
  return "neutral";
}

function demoBar() {
  return `<div class="demo-context-bar">${icon("shield", { size: 17 })}<span>${escapeHtml(operationalWorkspace.disclaimer)}</span></div>`;
}

function metrics() {
  return operationalMetrics.map((metric) => `
    <article class="dash-kpi dash-kpi--${metric.tone}">
      <span class="dash-kpi__icon">${icon(metric.icon, { size: 21 })}</span>
      <div><small>${metric.label}</small><strong>${metric.value}</strong><p>${metric.note}</p></div>
    </article>`).join("");
}

function followUpRows(limit = demoFollowUps.length) {
  return demoFollowUps.slice(0, limit).map((item) => `
    <div class="request-mini-row">
      <span class="request-mini-row__icon">${icon("clock", { size: 18 })}</span>
      <div><strong>${escapeHtml(item.action)}</strong><small>${escapeHtml(item.account)} · ${escapeHtml(item.due)}</small></div>
      <span class="status-chip status-chip--${statusTone(item.status)}">${escapeHtml(item.status)}</span>
      <code>${escapeHtml(item.id)}</code>
    </div>`).join("");
}

function serviceRequestRows(limit = demoServiceRequests.length) {
  return demoServiceRequests.slice(0, limit).map((item) => `
    <div class="request-mini-row">
      <span class="request-mini-row__icon">${icon("api", { size: 18 })}</span>
      <div><strong>${escapeHtml(item.service)}</strong><small>${escapeHtml(item.account)} · ${escapeHtml(item.gate)}</small></div>
      <span class="status-chip status-chip--${statusTone(item.state)}">${escapeHtml(item.state)}</span>
      <code>${escapeHtml(item.id)}</code>
    </div>`).join("");
}

function operationalFlow() {
  const stages = [
    ["ورودی", "Website / Channel / Operator"],
    ["حافظه", "Lead / Account / Opportunity / Case"],
    ["اقدام", "Qualification / Approval / Service / Task"],
    ["نتیجه", "Outcome / Dashboard / Account history"],
    ["فاز بعد", "Think Room Intelligence"]
  ];
  return stages.map(([label, title], index) => `
    <div class="readiness-summary-row">
      <div><strong>${label}</strong><small>${title}</small></div>
      <div class="readiness-progress"><span style="--progress:${Math.min(100, 32 + index * 14)}%"></span></div>
      <span class="status-chip status-chip--${index < 4 ? "neutral" : "warning"}">${index < 4 ? "Phase 1" : "Future"}</span>
    </div>`).join("");
}

export function renderOperationalDashboardPage() {
  const content = `
    <section class="dash-heading">
      <div>
        <div class="dash-heading__meta"><span class="workspace-dot"></span>${operationalWorkspace.organization}<span>/</span>${operationalWorkspace.environment}</div>
        <h1>نمای عملیاتی رهجو</h1>
        <p>فاز اول، جریان مشتری و درخواست را تا اقدام و نتیجه روی یک حافظه مشترک متصل می‌کند؛ این نما عمداً بدون وابستگی به AI تعریف شده است.</p>
      </div>
      <div class="dash-heading__actions">
        <a data-link class="button button--secondary" href="/crm">حافظه مشتری ${icon("business", { size: 17 })}</a>
        <a data-link class="button button--primary" href="/services">سرویس‌ها و درخواست‌ها ${icon("arrow", { size: 17 })}</a>
      </div>
    </section>

    ${demoBar()}
    <section class="dash-kpi-grid">${metrics()}</section>

    <section class="dash-layout dash-layout--hero">
      <article class="dash-panel">
        <header class="dash-panel__head"><div><small>NEXT ACTIONS · DEMO</small><h2>صف اقدام امروز</h2></div><a data-link class="text-link" href="/sales">نمای فروش ${icon("arrow")}</a></header>
        <div class="request-mini-list">${followUpRows()}</div>
      </article>
      <article class="dash-panel">
        <header class="dash-panel__head"><div><small>OPERATING MODEL</small><h2>از ورودی تا نتیجه</h2></div><span class="demo-badge">AI خاموش</span></header>
        <div class="readiness-summary">${operationalFlow()}</div>
      </article>
    </section>

    <section class="dash-layout dash-layout--lower">
      <article class="dash-panel">
        <header class="dash-panel__head"><div><small>SERVICE REQUESTS</small><h2>درخواست‌های اخیر نمونه</h2></div><a data-link class="text-link" href="/services">همه درخواست‌ها ${icon("arrow")}</a></header>
        <div class="request-mini-list">${serviceRequestRows()}</div>
      </article>
      <article class="dash-panel">
        <header class="dash-panel__head"><div><small>WHY THIS MATTERS</small><h2>حافظه‌ای که بعداً به اتاق فکر می‌رسد</h2></div><a data-link class="text-link" href="/think-room">رابطه با Think Room ${icon("arrow")}</a></header>
        <div class="audit-mini-list">
          <div class="audit-mini-row"><span class="audit-mini-row__icon">${icon("business", { size: 17 })}</span><div><strong>Account / Case</strong><small>مشتری، درخواست، تعامل و تعهد باز</small></div><i class="audit-tone audit-tone--positive"></i></div>
          <div class="audit-mini-row"><span class="audit-mini-row__icon">${icon("workflow", { size: 17 })}</span><div><strong>Action / Approval</strong><small>چه کاری، با کدام Gate و توسط چه کسی انجام شد</small></div><i class="audit-tone audit-tone--positive"></i></div>
          <div class="audit-mini-row"><span class="audit-mini-row__icon">${icon("check", { size: 17 })}</span><div><strong>Outcome</strong><small>نتیجه به همان پرونده برمی‌گردد تا تصمیم بعدی بهتر شود</small></div><i class="audit-tone audit-tone--warning"></i></div>
        </div>
      </article>
    </section>`;

  return appShell({ content, activePath: "/dashboard", title: "نمای عملیاتی" });
}

function accountRows() {
  return demoAccounts.map((account) => `
    <tr>
      <td><div class="table-primary"><span>${icon("business", { size: 17 })}</span><div><strong>${escapeHtml(account.name)}</strong><small>${escapeHtml(account.tier)}</small></div></div></td>
      <td><code>${escapeHtml(account.id)}</code></td>
      <td>${escapeHtml(account.stage)}</td>
      <td>${escapeHtml(account.owner)}</td>
      <td>${escapeHtml(account.nextAction)}</td>
    </tr>`).join("");
}

function accountDetail(account = demoAccounts[0]) {
  return `
    <div class="request-detail-head"><div><small>${escapeHtml(account.id)}</small><h3>${escapeHtml(account.name)}</h3></div><span class="status-chip status-chip--neutral">${escapeHtml(account.stage)}</span></div>
    <dl class="request-detail-grid">
      <div><dt>مالک</dt><dd>${escapeHtml(account.owner)}</dd></div>
      <div><dt>منبع ورود</dt><dd>${escapeHtml(account.source)}</dd></div>
      <div><dt>Case باز</dt><dd>${account.openCases}</dd></div>
      <div><dt>پیگیری باز</dt><dd>${account.openTasks}</dd></div>
      <div class="wide"><dt>آخرین تعامل</dt><dd>${escapeHtml(account.lastInteraction)}</dd></div>
      <div class="wide"><dt>اقدام بعدی</dt><dd>${escapeHtml(account.nextAction)}</dd></div>
    </dl>
    <div class="request-gate-strip"><span>${icon("timeline", { size: 18 })}</span><div><strong>Commercial Memory</strong><small>هدف این View این است که حساب، Case، تعامل، تعهد و Outcome در یک حافظه واحد دیده شوند.</small></div></div>`;
}

export function renderCrmPage() {
  const content = `
    <section class="dash-heading"><div><div class="dash-heading__meta">CRM / COMMERCIAL MEMORY</div><h1>حساب‌ها و حافظه مشتری</h1><p>CRM فاز اول یک محصول جدا نیست؛ System of Record رابطه، پرونده، تعامل، پیگیری و نتیجه برای کل جریان تجاری است.</p></div><a data-link class="button button--primary" href="/sales">صف فروش ${icon("arrow", { size: 15 })}</a></section>
    ${demoBar()}
    <section class="dash-panel request-workspace">
      <div class="request-master-detail">
        <div class="table-wrap"><table class="data-table"><thead><tr><th>حساب</th><th>شناسه</th><th>مرحله</th><th>مالک</th><th>اقدام بعدی</th></tr></thead><tbody>${accountRows()}</tbody></table></div>
        <aside class="request-detail-panel">${accountDetail()}</aside>
      </div>
    </section>`;
  return appShell({ content, activePath: "/crm", title: "CRM / حافظه مشتری" });
}

function opportunityRows() {
  return demoOpportunities.map((item) => `
    <tr><td><div class="table-primary"><span>${icon("reports", { size: 17 })}</span><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.account)}</small></div></div></td><td><code>${escapeHtml(item.id)}</code></td><td>${escapeHtml(item.stage)}</td><td>${escapeHtml(item.owner)}</td><td>${escapeHtml(item.age)}</td><td>${escapeHtml(item.nextAction)}</td></tr>`).join("");
}

export function renderSalesPage() {
  const content = `
    <section class="dash-heading"><div><div class="dash-heading__meta">ASSISTED DIGITAL SALES</div><h1>فروش، فرصت‌ها و پیگیری</h1><p>فاز اول self-service ساده و handoff انسانی برای B2B پیچیده را روی همان Account/Case نگه می‌دارد؛ Context نباید بین کانال و فروش گم شود.</p></div><a data-link class="button button--secondary" href="/crm">Account 360 ${icon("arrow", { size: 15 })}</a></section>
    ${demoBar()}
    <section class="dash-layout dash-layout--hero">
      <article class="dash-panel"><header class="dash-panel__head"><div><small>PIPELINE · DEMO</small><h2>فرصت‌های در جریان</h2></div></header><div class="table-wrap"><table class="data-table"><thead><tr><th>فرصت</th><th>شناسه</th><th>مرحله</th><th>مالک</th><th>سن نمونه</th><th>اقدام بعدی</th></tr></thead><tbody>${opportunityRows()}</tbody></table></div></article>
      <article class="dash-panel"><header class="dash-panel__head"><div><small>FOLLOW-UP</small><h2>پیگیری‌ها</h2></div></header><div class="request-mini-list">${followUpRows()}</div></article>
    </section>`;
  return appShell({ content, activePath: "/sales", title: "فروش و پیگیری" });
}

function capabilityRows() {
  return demoServiceCapabilities.map((item) => `
    <tr><td><div class="table-primary"><span>${icon("api", { size: 17 })}</span><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.automation)}</small></div></div></td><td><code>${escapeHtml(item.id)}</code></td><td><span class="status-chip status-chip--${statusTone(item.status)}">${escapeHtml(item.status)}</span></td><td>${escapeHtml(item.eligibility)}</td><td>${escapeHtml(item.owner)}</td></tr>`).join("");
}

function requestRows() {
  return demoServiceRequests.map((item) => `
    <tr><td><code>${escapeHtml(item.id)}</code></td><td>${escapeHtml(item.account)}</td><td>${escapeHtml(item.service)}</td><td><span class="status-chip status-chip--${statusTone(item.state)}">${escapeHtml(item.state)}</span></td><td>${escapeHtml(item.gate)}</td><td>${escapeHtml(item.outcome)}</td></tr>`).join("");
}

export function renderServicesPage() {
  const content = `
    <section class="dash-heading"><div><div class="dash-heading__meta">SERVICES & APIs / CONTROLLED EXECUTION</div><h1>سرویس‌ها، درخواست‌ها و وضعیت اجرا</h1><p>کاتالوگ صرفاً capability را نشان می‌دهد؛ production eligibility برای هر سرویس مستقل است و اجرای حساس از Gate انسانی عبور می‌کند.</p></div><a data-link class="button button--primary" href="/automation">اتوماسیون و Gate ${icon("arrow", { size: 15 })}</a></section>
    ${demoBar()}
    <section class="dash-layout dash-layout--lower">
      <article class="dash-panel"><header class="dash-panel__head"><div><small>CAPABILITY REGISTRY</small><h2>کاتالوگ قابلیت نمونه</h2></div></header><div class="table-wrap"><table class="data-table"><thead><tr><th>سرویس</th><th>شناسه</th><th>وضعیت</th><th>Eligibility</th><th>Owner</th></tr></thead><tbody>${capabilityRows()}</tbody></table></div></article>
      <article class="dash-panel"><header class="dash-panel__head"><div><small>REQUEST LIFECYCLE</small><h2>درخواست‌های سرویس نمونه</h2></div></header><div class="table-wrap"><table class="data-table"><thead><tr><th>Case</th><th>حساب</th><th>سرویس</th><th>وضعیت</th><th>Gate</th><th>Outcome</th></tr></thead><tbody>${requestRows()}</tbody></table></div></article>
    </section>`;
  return appShell({ content, activePath: "/services", title: "سرویس‌ها و API" });
}

function automationRows() {
  return demoAutomationRuns.map((item) => `
    <tr><td><div class="table-primary"><span>${icon("workflow", { size: 17 })}</span><div><strong>${escapeHtml(item.workflow)}</strong><small>Risk: ${escapeHtml(item.risk)}</small></div></div></td><td><code>${escapeHtml(item.id)}</code></td><td>${escapeHtml(item.approval)}</td><td><span class="status-chip status-chip--${statusTone(item.state)}">${escapeHtml(item.state)}</span></td><td><code>${escapeHtml(item.receipt)}</code></td></tr>`).join("");
}

export function renderAutomationPage() {
  const content = `
    <section class="dash-heading"><div><div class="dash-heading__meta">DETERMINISTIC AUTOMATION</div><h1>اتوماسیون، تأیید و Run</h1><p>اتوماسیون فاز اول bounded و rule-based است. قیمت، تعهد قراردادی، داده حساس و ارسال استراتژیک بدون تأیید انسانی اجرا نمی‌شوند.</p></div><a data-link class="button button--secondary" href="/governance">ممیزی و کیفیت داده ${icon("arrow", { size: 15 })}</a></section>
    ${demoBar()}
    <section class="dash-panel"><header class="dash-panel__head"><div><small>WORKFLOW RUNS · DEMO</small><h2>Runها و Gateها</h2></div><span class="demo-badge">No autonomous agent</span></header><div class="table-wrap"><table class="data-table"><thead><tr><th>Workflow</th><th>Run</th><th>Approval</th><th>State</th><th>Receipt</th></tr></thead><tbody>${automationRows()}</tbody></table></div></section>`;
  return appShell({ content, activePath: "/automation", title: "اتوماسیون و تأیید" });
}

export function renderGovernancePage() {
  const qualityRows = demoDataQuality.map((item) => `
    <div class="readiness-summary-row"><div><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.note)}</small></div><div class="readiness-progress"><span style="--progress:46%"></span></div><span class="status-chip status-chip--warning">${escapeHtml(item.value)}</span></div>`).join("");
  const content = `
    <section class="dash-heading"><div><div class="dash-heading__meta">AUDIT / DATA QUALITY / PERMISSIONS</div><h1>ممیزی و کیفیت داده</h1><p>Foundation قابل اتکا باید نشان دهد چه داده‌ای از کجا آمده، چه کسی تغییرش داده، چه چیزی ناقص یا stale است و کدام اقدام نیاز به تأیید دارد.</p></div><a data-link class="button button--secondary" href="/dashboard/audit">نمای legacy Gate ${icon("external", { size: 15 })}</a></section>
    ${demoBar()}
    <section class="dash-layout dash-layout--hero">
      <article class="dash-panel"><header class="dash-panel__head"><div><small>DATA QUALITY · DEMO</small><h2>صف کیفیت داده</h2></div></header><div class="readiness-summary">${qualityRows}</div></article>
      <article class="dash-panel"><header class="dash-panel__head"><div><small>CONTROL PRINCIPLES</small><h2>مرزهای غیرقابل‌چشم‌پوشی</h2></div></header><div class="audit-mini-list">
        <div class="audit-mini-row"><span class="audit-mini-row__icon">${icon("identity", { size: 17 })}</span><div><strong>هویت مشترک</strong><small>Website، CRM، Case و AI آینده شناسه جداگانه نمی‌سازند.</small></div><i class="audit-tone audit-tone--positive"></i></div>
        <div class="audit-mini-row"><span class="audit-mini-row__icon">${icon("shield", { size: 17 })}</span><div><strong>Permission-aware</strong><small>داده حساس و action پرریسک با scope و Gate روشن.</small></div><i class="audit-tone audit-tone--positive"></i></div>
        <div class="audit-mini-row"><span class="audit-mini-row__icon">${icon("audit", { size: 17 })}</span><div><strong>Audit + Receipt</strong><small>Mutation و execution باید قابل بازسازی باشند.</small></div><i class="audit-tone audit-tone--warning"></i></div>
      </div></article>
    </section>`;
  return appShell({ content, activePath: "/governance", title: "ممیزی و کیفیت داده" });
}

export function renderThinkRoomPage() {
  const content = `
    <section class="dash-heading"><div><div class="dash-heading__meta">FUTURE INTELLIGENCE LAYER</div><h1>اتاق فکر و دستیار تصمیم‌ساز</h1><p>این بخش North Star پروژه است، اما dependency فاز اول نیست. وقتی فعال شود، روی همان Account، Case، Action، Approval و Outcome کار می‌کند.</p></div><a data-link class="button button--secondary" href="/dashboard">بازگشت به Foundation ${icon("arrow", { size: 15 })}</a></section>
    <div class="demo-context-bar">${icon("spark", { size: 17 })}<span>Phase 1 باید با Model Gateway خاموش کامل کار کند. این View فقط قرارداد ارتباط Foundation با Intelligence را نشان می‌دهد و ادعای AI production ندارد.</span></div>
    <section class="dash-layout dash-layout--hero">
      <article class="dash-panel"><header class="dash-panel__head"><div><small>INPUT FROM FOUNDATION</small><h2>چه چیزی از فاز اول می‌گیرد؟</h2></div></header><div class="audit-mini-list">
        <div class="audit-mini-row"><span class="audit-mini-row__icon">${icon("business", { size: 17 })}</span><div><strong>Account + Case</strong><small>تاریخچه مشتری، درخواست و Context عملیاتی</small></div><i class="audit-tone audit-tone--positive"></i></div>
        <div class="audit-mini-row"><span class="audit-mini-row__icon">${icon("document", { size: 17 })}</span><div><strong>Source + Provenance</strong><small>منبع، freshness، محدودیت دسترسی و شواهد</small></div><i class="audit-tone audit-tone--positive"></i></div>
        <div class="audit-mini-row"><span class="audit-mini-row__icon">${icon("check", { size: 17 })}</span><div><strong>Action + Outcome</strong><small>چه تصمیم/اقدامی انجام شد و چه نتیجه‌ای داشت</small></div><i class="audit-tone audit-tone--positive"></i></div>
      </div></article>
      <article class="dash-panel"><header class="dash-panel__head"><div><small>PHASE 2 CAPABILITY</small><h2>چه چیزی اضافه می‌کند؟</h2></div></header><div class="audit-mini-list">
        <div class="audit-mini-row"><span class="audit-mini-row__icon">${icon("search", { size: 17 })}</span><div><strong>Context / Evidence</strong><small>بازیابی scoped و نمایش اطلاعات ناقص/متناقض</small></div><i class="audit-tone audit-tone--warning"></i></div>
        <div class="audit-mini-row"><span class="audit-mini-row__icon">${icon("spark", { size: 17 })}</span><div><strong>Options / Recommendation</strong><small>گزینه‌ها، ریسک‌ها و recommendation قابل بازبینی</small></div><i class="audit-tone audit-tone--warning"></i></div>
        <div class="audit-mini-row"><span class="audit-mini-row__icon">${icon("users", { size: 17 })}</span><div><strong>Human Decision</strong><small>تصمیم نهایی انسان ثبت می‌شود و Outcome به حافظه برمی‌گردد</small></div><i class="audit-tone audit-tone--warning"></i></div>
      </div></article>
    </section>`;
  return appShell({ content, activePath: "/think-room", title: "Think Room / آینده" });
}
