// @ts-nocheck
import { appShell } from "../../app/appShell.js";
import { icon } from "../../components/icons.js";
import { escapeHtml } from "../../lib/html.js";
import { runtimeData } from "../../services/runtimeDataFacade.js";
import { badge, emptyState, pageHeader, panel } from "./shared.js";

const number = new Intl.NumberFormat("fa-IR");
const date = new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" });

function projection() {
  return runtimeData.readProjection() ?? {};
}

function list(name) {
  const value = projection()[name];
  return Array.isArray(value) ? value : [];
}

function text(value, fallback = "—") {
  return escapeHtml(String(value ?? fallback));
}

function when(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? text(value) : date.format(parsed);
}

function label(value) {
  return ({
    waiting_approval: "منتظر تأیید", ready_action: "آمادهٔ اقدام", executing: "در حال اجرا",
    resolved: "حل‌شده", rejected: "ردشده", requested: "در انتظار", approved: "تأیید‌شده",
    queued: "در صف", succeeded: "موفق", recorded: "ثبت‌شده", active: "فعال",
    human: "انسانی", pending_relaticle: "در انتظار Relaticle"
  })[value] ?? String(value ?? "نامشخص");
}

function serverNotice() {
  const state = runtimeData.read();
  return `<div id="server-feedback" class="server-feedback" role="status" aria-live="polite">
    ${icon("shield", { size: 17 })}<span>دادهٔ زندهٔ فضای کاری <strong>${text(state.workspace?.name)}</strong> · AI خاموش · بدون جایگزینی دادهٔ دمو</span>
  </div>`;
}

function metric(title, value, note, glyph, tone = "teal") {
  return `<article class="ops-metric ops-metric--${tone}"><span>${icon(glyph)}</span><div><small>${text(title)}</small><strong>${number.format(value)}</strong><em>${text(note)}</em></div></article>`;
}

function caseHref(id) {
  return `/requests/detail?case=${encodeURIComponent(id)}`;
}

function accountHref(id) {
  return `/customers/detail?account=${encodeURIComponent(id)}`;
}

function caseRows(items = list("cases")) {
  if (!items.length) return `<tr><td colspan="7">هنوز Case سروری ثبت نشده است.</td></tr>`;
  const services = new Map(list("services").map((item) => [item.id, item]));
  return items.map((item) => `<tr data-server-row data-search="${text([item.id, item.purpose, item.account_ref, item.status].join(" "))}">
    <td><a data-link href="${caseHref(item.id)}"><strong>${text(item.id)}</strong></a><small>${when(item.updated_at)}</small></td>
    <td>${text(item.purpose)}</td><td>${text(services.get(item.service_id)?.name || item.service_id)}</td>
    <td><a data-link href="${accountHref(item.account_ref)}">${text(item.account_ref)}</a></td>
    <td>${badge(label(item.status))}</td><td>${text(item.priority)}</td><td>${number.format(item.version || 1)}</td>
  </tr>`).join("");
}

function casesTable(items) {
  return `<div class="table-toolbar"><label class="table-search">${icon("search", { size: 16 })}<input data-server-query placeholder="جست‌وجوی Case، هدف یا مشتری…" /></label></div>
    <div class="table-wrap"><table class="workspace-table"><thead><tr><th>Case</th><th>هدف</th><th>خدمت</th><th>مشتری</th><th>وضعیت</th><th>اولویت</th><th>نسخه</th></tr></thead><tbody>${caseRows(items)}</tbody></table></div>`;
}

function renderDashboard() {
  const state = runtimeData.read();
  const cases = list("cases");
  const approvals = list("approvals");
  const pending = cases.filter((item) => !["resolved", "rejected"].includes(item.status));
  const content = `${pageHeader(`سلام، ${text(state.user?.name || "همکار رهجو")}`, "وضعیت واقعی مشتری تا نتیجه؛ تمام اعداد از سرور همین فضای کاری خوانده شده‌اند.", `<a data-link class="button button--primary" href="/cases/new">پروندهٔ جدید ${icon("arrow", { size: 15 })}</a>`)}
    ${serverNotice()}
    <div class="ops-metrics">
      ${metric("Caseهای باز", pending.length, "نیازمند اقدام", "requests")}
      ${metric("تأییدهای در انتظار", approvals.filter((item) => item.status === "requested").length, "Gate انسانی", "shield", "amber")}
      ${metric("اجراهای موفق", list("runs").filter((item) => item.state === "succeeded").length, "بدون مدل AI", "workflow", "blue")}
      ${metric("نتیجه‌های ثبت‌شده", list("outcomes").length, "متصل به Receipt", "check")}
    </div>
    <div class="dashboard-layout">
      ${panel("صف اقدام عملیاتی", casesTable(pending.slice(0, 12)), `<a data-link class="text-link" href="/requests">همهٔ Caseها ${icon("arrow", { size: 14 })}</a>`)}
      <div class="dashboard-split">
        ${panel("آخرین رسیدها", `<div class="compact-list">${list("receipts").slice(0, 6).map((item) => `<article><div>${badge(label(item.result_status))}<strong>${text(item.id)}</strong><small>${text(item.action_id)} · ${when(item.issued_at)}</small></div><code>${text(String(item.payload_sha256 || "").slice(0, 16))}…</code></article>`).join("") || emptyState("رسیدی ثبت نشده", "پس از اجرای تأییدشده، Receipt تغییرناپذیر اینجا ظاهر می‌شود.")}</div>`)}
        ${panel("آخرین رخدادها", `<div class="activity-stream">${list("auditEvents").slice(0, 6).map((item) => `<article><i class="dot"></i><div><strong>${text(item.event_type)}</strong><p>${text(item.entity_type)} · ${text(item.entity_id)}</p></div><span>${text(item.source)}<small>${when(item.created_at)}</small></span></article>`).join("") || emptyState("رخدادی نیست", "رویدادهای ممیزی سرور اینجا نمایش داده می‌شوند.")}</div>`)}
      </div>
    </div>`;
  return appShell({ content, activePath: "/dashboard", title: "داشبورد زنده" });
}

function renderCustomers() {
  const accounts = list("accounts");
  const contacts = list("contacts");
  const rows = accounts.map((item) => `<tr data-server-row data-search="${text([item.id, item.name, item.source].join(" "))}"><td><a data-link href="${accountHref(item.id)}"><strong>${text(item.name || item.id)}</strong></a><small>${text(item.id)}</small></td><td>${text(item.source)}</td><td>${badge(label(item.syncState))}</td><td>${number.format(list("cases").filter((record) => record.account_ref === item.id).length)}</td><td>${number.format(contacts.filter((record) => record.companyId === item.id || record.company_id === item.id).length)}</td></tr>`).join("");
  const content = `${pageHeader("مشتریان", "Account و Contactهای واقعی این فضای کاری؛ منبع هر رکورد مشخص است.", `<a data-link class="button button--primary" href="/cases/new">مشتری و Case جدید</a>`)}${serverNotice()}
    <div class="summary-strip"><span><b>${number.format(accounts.length)}</b> Account</span><span><b>${number.format(contacts.length)}</b> Contact</span><span><b>${number.format(accounts.filter((item) => item.syncState === "verified").length)}</b> همگام با Relaticle</span><span><b>${number.format(accounts.filter((item) => item.syncState === "pending_relaticle").length)}</b> در صف همگام‌سازی</span></div>
    ${panel("فهرست مشتریان سرور", `<div class="table-toolbar"><label class="table-search">${icon("search", { size: 16 })}<input data-server-query placeholder="نام یا شناسه مشتری…" /></label></div><div class="table-wrap"><table class="workspace-table"><thead><tr><th>مشتری</th><th>منبع</th><th>همگام‌سازی</th><th>Case</th><th>Contact</th></tr></thead><tbody>${rows || `<tr><td colspan="5">هنوز مشتری ثبت نشده است.</td></tr>`}</tbody></table></div>`)} `;
  return appShell({ content, activePath: "/customers", title: "مشتریان" });
}

function renderCustomerDetail() {
  const id = new URLSearchParams(location.search).get("account") || list("accounts")[0]?.id;
  const account = list("accounts").find((item) => item.id === id);
  if (!account) return appShell({ content: `${pageHeader("مشتری پیدا نشد", "این شناسه در فضای کاری فعلی وجود ندارد.", `<a data-link class="button button--outline" href="/customers">بازگشت</a>`)}${serverNotice()}`, activePath: "/customers", title: "پروندهٔ مشتری" });
  const cases = list("cases").filter((item) => item.account_ref === account.id);
  const contacts = list("contacts").filter((item) => item.companyId === account.id || item.company_id === account.id);
  const content = `${pageHeader(text(account.name || account.id), `حافظهٔ تجاری زنده · ${text(account.id)}`, `<a data-link class="button button--primary" href="/cases/new">Case جدید</a>`)}${serverNotice()}
    <div class="account-overview-grid"><section class="workspace-panel"><header><h2>مشخصات Account</h2></header><dl class="financial-summary"><div><dt>شناسه</dt><dd>${text(account.id)}</dd></div><div><dt>منبع</dt><dd>${text(account.source)}</dd></div><div><dt>وضعیت همگام‌سازی</dt><dd>${badge(label(account.syncState))}</dd></div></dl></section>
    ${panel("اشخاص مرتبط", `<div class="compact-list">${contacts.map((item) => `<article><div><strong>${text(item.name || item.id)}</strong><small>${text(item.email || item.phone || item.id)}</small></div></article>`).join("") || emptyState("Contact ثبت نشده", "با Intake بعدی ایجاد می‌شود.")}</div>`)}</div>
    ${panel("Caseهای این مشتری", casesTable(cases))}`;
  return appShell({ content, activePath: "/customers/detail", title: "پروندهٔ مشتری" });
}

function renderSales() {
  const leads = list("leads");
  const opportunities = list("opportunities");
  const rows = leads.map((item) => `<tr><td><strong>${text(item.id)}</strong><small>${when(item.updated_at)}</small></td><td>${text(item.account_ref)}</td><td>${text(item.contact_ref)}</td><td>${badge(label(item.status))}</td><td>${text(item.source_channel)}</td></tr>`).join("");
  const content = `${pageHeader("فروش", "Lead و Opportunityهای سروری؛ بدون آمار یا کارت ساختگی.", `<a data-link class="button button--primary" href="/cases/new">ورودی جدید</a>`)}${serverNotice()}
    <div class="sales-summary">${metric("سرنخ‌ها", leads.length, "ثبت‌شده روی سرور", "reports")}${metric("فرصت‌ها", opportunities.length, "منبع Relaticle", "requests", "blue")}${metric("Caseهای باز", list("cases").filter((item) => !["resolved", "rejected"].includes(item.status)).length, "جریان فعال", "clock", "amber")}${metric("نتیجه‌ها", list("outcomes").length, "تکمیل‌شده", "check")}</div>
    ${panel("سرنخ‌های ثبت‌شده", `<div class="table-wrap"><table class="workspace-table"><thead><tr><th>Lead</th><th>Account</th><th>Contact</th><th>وضعیت</th><th>منبع</th></tr></thead><tbody>${rows || `<tr><td colspan="5">هنوز Lead ثبت نشده است.</td></tr>`}</tbody></table></div>`)}
    ${opportunities.length ? panel("فرصت‌ها", `<pre>${text(JSON.stringify(opportunities, null, 2))}</pre>`) : ""}`;
  return appShell({ content, activePath: "/sales", title: "فروش" });
}

function renderServices() {
  const capabilities = list("serviceCapabilities");
  const rows = list("services").map((item) => `<tr><td><strong>${text(item.name)}</strong><small>${text(item.id)}</small></td><td>${text(item.description)}</td><td>${badge(label(item.capability_status))}</td><td>${badge(label(item.execution_mode))}</td><td>${number.format(capabilities.filter((capability) => capability.service_id === item.id).length)}</td><td>${when(item.updated_at)}</td></tr>`).join("");
  const content = `${pageHeader("خدمات", "کاتالوگ واقعی و قابلیت‌های مجاز همین workspace.", `<a data-link class="button button--primary" href="/cases/new">شروع Intake</a>`)}${serverNotice()}
    ${panel("کاتالوگ خدمات سرور", `<div class="table-wrap"><table class="workspace-table"><thead><tr><th>خدمت</th><th>توضیح</th><th>وضعیت</th><th>نوع اجرا</th><th>قابلیت</th><th>آخرین تغییر</th></tr></thead><tbody>${rows || `<tr><td colspan="6">هیچ خدمت فعالی برای این workspace وجود ندارد.</td></tr>`}</tbody></table></div>`)}
    ${capabilities.length ? panel("قابلیت‌ها و مرز اجرا", `<div class="config-cards">${capabilities.map((item) => `<article><strong>${text(item.capability_code)}</strong><span>${text(item.service_id)} · ${text(item.risk_class)}</span>${badge(label(item.eligibility_status))}<small>${text(item.environment_status)}</small></article>`).join("")}</div>`) : ""}`;
  return appShell({ content, activePath: "/services-admin", title: "خدمات" });
}

function renderCases() {
  const content = `${pageHeader("Caseها و درخواست‌های خدمت", "مسیر واقعی Case از Intake تا Approval، Action، Receipt و Outcome.", `<a data-link class="button button--primary" href="/cases/new">Case جدید</a>`)}${serverNotice()}
    <div class="summary-strip"><span><b>${number.format(list("cases").length)}</b> کل</span><span><b>${number.format(list("cases").filter((item) => item.status === "waiting_approval").length)}</b> منتظر تأیید</span><span><b>${number.format(list("cases").filter((item) => ["ready_action", "executing"].includes(item.status)).length)}</b> در عملیات</span><span><b>${number.format(list("cases").filter((item) => item.status === "resolved").length)}</b> حل‌شده</span></div>
    ${panel("فهرست Caseهای سرور", casesTable())}`;
  return appShell({ content, activePath: "/requests", title: "Caseها" });
}

function renderCaseDetail() {
  const id = new URLSearchParams(location.search).get("case") || list("cases")[0]?.id;
  const item = list("cases").find((record) => record.id === id);
  if (!item) return appShell({ content: `${pageHeader("Case پیدا نشد", "این شناسه در workspace فعلی دیده نمی‌شود.", `<a data-link class="button button--outline" href="/requests">بازگشت</a>`)}${serverNotice()}`, activePath: "/requests", title: "جزئیات Case" });
  const approval = list("approvals").find((record) => record.case_id === item.id);
  const actions = list("actions").filter((record) => record.case_id === item.id);
  const action = actions[0];
  const runs = list("runs").filter((record) => actions.some((candidate) => candidate.id === record.action_id));
  const receipts = list("receipts").filter((record) => actions.some((candidate) => candidate.id === record.action_id));
  const outcome = list("outcomes").find((record) => record.case_id === item.id);
  let nextAction = `<span class="status status--success">این Case تکمیل شده است.</span>`;
  if (approval?.status === "requested") nextAction = `<button class="button button--primary" data-approval="${text(approval.id)}" data-decision="approved">تأیید انسانی</button><button class="button button--outline" data-approval="${text(approval.id)}" data-decision="rejected">رد درخواست</button>`;
  else if (item.status === "ready_action" && !action) nextAction = `<button class="button button--primary" data-create-action="${text(item.id)}">ساخت Action تأییدشده</button>`;
  else if (action?.status === "queued") nextAction = `<button class="button button--primary" data-run-action="${text(action.id)}">اجرای قطعی بدون AI</button>`;
  else if (receipts.some((record) => record.result_status === "succeeded") && !outcome) nextAction = `<label class="field-control server-outcome"><span>شرح نتیجه</span><textarea id="outcome-reason" rows="2">نتیجه پس از تأیید انسانی و اجرای موفق ثبت شد</textarea></label><button class="button button--primary" data-record-outcome="${text(item.id)}">ثبت Outcome</button>`;
  const content = `${pageHeader(text(item.id), text(item.purpose), `<a data-link class="button button--outline" href="/requests">همهٔ Caseها</a>`)}${serverNotice()}
    <section class="workspace-panel server-case-hero"><header><div><small>وضعیت جاری</small><h2>${badge(label(item.status))}</h2></div><div class="server-next-actions">${nextAction}</div></header>
      <dl class="financial-summary"><div><dt>Account</dt><dd><a data-link href="${accountHref(item.account_ref)}">${text(item.account_ref)}</a></dd></div><div><dt>Service</dt><dd>${text(item.service_id)}</dd></div><div><dt>منبع</dt><dd>${text(item.source_channel)}</dd></div><div><dt>نسخه</dt><dd>${number.format(item.version || 1)}</dd></div></dl></section>
    <div class="server-flow-grid">
      ${panel("Approval", approval ? `<dl class="financial-summary"><div><dt>شناسه</dt><dd>${text(approval.id)}</dd></div><div><dt>وضعیت</dt><dd>${badge(label(approval.status))}</dd></div><div><dt>Policy</dt><dd>${text(approval.policy_ref)}</dd></div></dl>` : emptyState("Approval ندارد", "برای این Case تأیید ثبت نشده است."))}
      ${panel("Action و Run", `<div class="compact-list">${actions.map((record) => `<article><div><strong>${text(record.id)}</strong><small>${text(record.action_type)} · ${badge(label(record.status))}</small></div></article>`).join("") || emptyState("Action ندارد", "پس از تأیید انسانی ساخته می‌شود.")}${runs.map((record) => `<article><div><strong>${text(record.id)}</strong><small>تلاش ${number.format(record.attempt)} · ${badge(label(record.state))}</small></div></article>`).join("")}</div>`)}
      ${panel("Receipt", `<div class="compact-list">${receipts.map((record) => `<article><div><strong>${text(record.id)}</strong><small>${badge(label(record.result_status))} · ${when(record.issued_at)}</small></div><code>${text(record.payload_sha256)}</code></article>`).join("") || emptyState("Receipt ندارد", "بعد از اجرای موفق صادر می‌شود.")}</div>`)}
      ${panel("Outcome", outcome ? `<dl class="financial-summary"><div><dt>شناسه</dt><dd>${text(outcome.id)}</dd></div><div><dt>وضعیت</dt><dd>${badge(label(outcome.result_status))}</dd></div><div><dt>دلیل</dt><dd>${text(outcome.reason)}</dd></div></dl>` : emptyState("Outcome ندارد", "پس از Receipt موفق قابل ثبت است."))}
    </div>`;
  return appShell({ content, activePath: "/requests/detail", title: "جزئیات Case" });
}

function renderIntake() {
  const services = list("services").filter((item) => item.capability_status === "active");
  const content = `${pageHeader("ورود پروندهٔ جدید", "مشتری، Contact، Lead، Case و Approval در یک تراکنش سروری ساخته می‌شوند.", `<a data-link class="button button--outline" href="/requests">انصراف</a>`)}${serverNotice()}
    <form id="server-intake" class="intake-layout" novalidate>
      <section class="workspace-panel intake-step"><header><span>۱</span><div><h2>مشتری و تماس</h2><small>حداقل یک راه تماس لازم است</small></div></header>
        <label class="field-control"><span>نام سازمان *</span><input name="organization" required maxlength="255" /></label>
        <label class="field-control"><span>نام شخص تماس *</span><input name="contactName" required maxlength="160" /></label>
        <label class="field-control"><span>ایمیل</span><input name="email" type="email" maxlength="254" /></label>
        <label class="field-control"><span>تلفن</span><input name="phone" inputmode="tel" maxlength="40" /></label>
      </section>
      <section class="workspace-panel intake-step"><header><span>۲</span><div><h2>خدمت و هدف</h2><small>داده مستقیماً به همین workspace می‌رود</small></div></header>
        <label class="select-control"><span>خدمت *</span><select name="serviceId" required>${services.map((item) => `<option value="${text(item.id)}">${text(item.name)} — ${text(item.id)}</option>`).join("")}</select></label>
        <label class="field-control"><span>هدف پرونده *</span><textarea name="purpose" rows="5" maxlength="1200" required></textarea></label>
        <label class="select-control"><span>منبع</span><select name="sourceChannel"><option value="operator">ورودی اپراتور</option><option value="website">وب‌سایت</option><option value="referral">معرفی</option><option value="phone">تماس تلفنی</option></select></label>
      </section>
      <section class="workspace-panel intake-step"><header><span>۳</span><div><h2>کنترل و ثبت</h2><small>ساخت Case به معنی اجرای خودکار نیست</small></div></header>
        <div class="claim-boundary">${icon("shield", { size: 21 })}<div><strong>Gate انسانی اجباری است</strong><p>پس از ثبت، Approval جداگانه لازم است و هیچ مدل AI فراخوانی نمی‌شود.</p></div></div>
        <p id="intake-error" class="interaction-feedback" role="alert"></p>
        <button class="button button--primary" type="submit" ${services.length ? "" : "disabled"}>ساخت پرونده روی سرور</button>
      </section>
    </form>`;
  return appShell({ content, activePath: "/requests", title: "پروندهٔ جدید" });
}

function renderOperations() {
  const content = `${pageHeader("عملیات و گردش‌کار", "صف واقعی Approval، Action و Run؛ تمام اجراها deterministic و بدون AI هستند.")}${serverNotice()}
    ${panel("تأییدهای انسانی", `<div class="table-wrap"><table class="workspace-table"><thead><tr><th>Approval</th><th>Case</th><th>Policy</th><th>وضعیت</th><th>زمان</th></tr></thead><tbody>${list("approvals").map((item) => `<tr><td>${text(item.id)}</td><td><a data-link href="${caseHref(item.case_id)}">${text(item.case_id)}</a></td><td>${text(item.policy_ref)}</td><td>${badge(label(item.status))}</td><td>${when(item.requested_at)}</td></tr>`).join("") || `<tr><td colspan="5">موردی نیست.</td></tr>`}</tbody></table></div>`)}
    ${panel("Actionها و Runها", `<div class="table-wrap"><table class="workspace-table"><thead><tr><th>Action</th><th>Case</th><th>نوع</th><th>حالت اجرا</th><th>وضعیت</th></tr></thead><tbody>${list("actions").map((item) => `<tr><td>${text(item.id)}</td><td><a data-link href="${caseHref(item.case_id)}">${text(item.case_id)}</a></td><td>${text(item.action_type)}</td><td>${text(item.execution_mode)}</td><td>${badge(label(item.status))}</td></tr>`).join("") || `<tr><td colspan="5">موردی نیست.</td></tr>`}</tbody></table></div>`)}`;
  return appShell({ content, activePath: "/operations", title: "عملیات" });
}

function renderAudit() {
  const content = `${pageHeader("ممیزی، Receipt و Outcome", "زنجیرهٔ شواهد سرور؛ payload حساس نمایش داده نمی‌شود.")}${serverNotice()}
    <div class="quality-summary">${metric("رخداد ممیزی", list("auditEvents").length, "ثبت سرور", "shield")}${metric("Receipt", list("receipts").length, "هش‌دار", "document", "blue")}${metric("Outcome", list("outcomes").length, "متصل", "check")}</div>
    ${panel("Timeline ممیزی", `<div class="audit-timeline">${list("auditEvents").map((item) => `<article><time>${when(item.created_at)}</time><i class="dot"></i><div><strong>${text(item.event_type)}</strong><p>${text(item.entity_type)} · ${text(item.entity_id)}</p><small>${text(item.source)} · ${text(item.correlation_id)}</small></div></article>`).join("") || emptyState("رخدادی نیست", "اولین رویداد بعد از Intake ثبت می‌شود.")}</div>`)}
    ${panel("رسیدهای تغییرناپذیر", `<div class="table-wrap"><table class="workspace-table"><thead><tr><th>Receipt</th><th>Action</th><th>Run</th><th>نتیجه</th><th>SHA-256</th><th>زمان</th></tr></thead><tbody>${list("receipts").map((item) => `<tr><td>${text(item.id)}</td><td>${text(item.action_id)}</td><td>${text(item.run_id)}</td><td>${badge(label(item.result_status))}</td><td><code>${text(item.payload_sha256)}</code></td><td>${when(item.issued_at)}</td></tr>`).join("") || `<tr><td colspan="6">رسیدی نیست.</td></tr>`}</tbody></table></div>`)}`;
  return appShell({ content, activePath: "/audit", title: "ممیزی" });
}

function renderReports() {
  const cases = list("cases");
  const resolved = cases.filter((item) => item.status === "resolved").length;
  const content = `${pageHeader("گزارش‌های عملیاتی", "شاخص‌های مشتق‌شده فقط از دادهٔ سرور فعلی.")}${serverNotice()}
    <div class="ops-metrics">${metric("کل مشتریان", list("accounts").length, "Account", "users")}${metric("کل Caseها", cases.length, "ثبت‌شده", "requests", "blue")}${metric("Case حل‌شده", resolved, "دارای Outcome", "check")}${metric("نرخ تکمیل", cases.length ? Math.round(resolved / cases.length * 100) : 0, "درصد", "signal", "amber")}</div>
    ${panel("توزیع وضعیت Case", `<div class="config-cards">${["waiting_approval", "ready_action", "executing", "resolved", "rejected"].map((status) => `<article><strong>${text(label(status))}</strong><span>${number.format(cases.filter((item) => item.status === status).length)} Case</span></article>`).join("")}</div>`)}`;
  return appShell({ content, activePath: "/reports", title: "گزارش‌ها" });
}

function renderSettings() {
  const state = runtimeData.read();
  const content = `${pageHeader("تنظیمات و وضعیت محیط", "هویت، workspace و مرزهای فعال این نشست.")}${serverNotice()}
    <div class="settings-layout"><nav><button aria-selected="true">فضای کاری</button><button>امنیت</button><button>اتصال‌ها</button></nav>
      <section class="workspace-panel"><header><h2>مشخصات زنده</h2></header><dl class="financial-summary"><div><dt>Workspace</dt><dd>${text(state.workspace?.name)}</dd></div><div><dt>Slug</dt><dd>${text(state.workspace?.slug)}</dd></div><div><dt>کاربر</dt><dd>${text(state.user?.name)}</dd></div><div><dt>نقش</dt><dd>${text(state.user?.role)}</dd></div><div><dt>حالت داده</dt><dd>Server</dd></div><div><dt>AI</dt><dd>خاموش</dd></div><div><dt>نسخه</dt><dd><code>${text(state.buildSha)}</code></dd></div><div><dt>نوشتن امن</dt><dd>${badge(state.canMutate ? "فعال" : "فقط خواندنی")}</dd></div></dl></section></div>`;
  return appShell({ content, activePath: "/settings", title: "تنظیمات" });
}

function renderUnavailable(path) {
  const title = path === "/finance" ? "مالی و اعتبار" : path === "/documents" ? "اسناد" : path === "/tasks" ? "کارها و پیگیری‌ها" : "ماژول";
  const description = path === "/tasks" ? "صف اقدام‌ها از Approval و Caseهای واقعی ساخته می‌شود؛ Task مستقل پس از اتصال Relaticle فعال خواهد شد." : "این ماژول هنوز قرارداد نوشتن سروری ندارد؛ برای جلوگیری از نمایش دادهٔ ساختگی، عمداً خالی نگه داشته شده است.";
  return appShell({ content: `${pageHeader(title, description)}${serverNotice()}${panel("وضعیت", emptyState("دادهٔ ساختگی نمایش داده نمی‌شود", "هستهٔ مشتری، Case، Approval، Action، Receipt و Outcome هم‌اکنون زنده است."))}`, activePath: path, title });
}

export function renderServerOperationalRoute(path) {
  if (path === "/dashboard" || path === "/login") return renderDashboard();
  if (path === "/customers") return renderCustomers();
  if (path === "/customers/detail") return renderCustomerDetail();
  if (path === "/sales") return renderSales();
  if (path === "/services-admin") return renderServices();
  if (path === "/requests") return renderCases();
  if (path === "/requests/detail") return renderCaseDetail();
  if (path === "/cases/new" || path === "/request-service") return renderIntake();
  if (path === "/operations") return renderOperations();
  if (path === "/audit") return renderAudit();
  if (path === "/reports") return renderReports();
  if (path === "/settings") return renderSettings();
  return renderUnavailable(path);
}

function setFeedback(message, tone = "") {
  const feedback = document.querySelector("#server-feedback");
  if (!(feedback instanceof HTMLElement)) return;
  feedback.dataset.tone = tone;
  const output = feedback.querySelector("span");
  if (output) output.textContent = message;
}

async function perform(button, message, operation) {
  if (button instanceof HTMLButtonElement) button.disabled = true;
  setFeedback("در حال ثبت روی سرور…");
  try {
    await operation();
    setFeedback(message, "success");
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : "عملیات ناموفق بود.", "error");
    if (button instanceof HTMLButtonElement) button.disabled = false;
  }
}

export function mountServerOperationalRoute() {
  const query = document.querySelector("[data-server-query]");
  if (query instanceof HTMLInputElement) query.addEventListener("input", () => {
    const needle = query.value.trim().toLocaleLowerCase("fa");
    document.querySelectorAll("[data-server-row]").forEach((row) => row.toggleAttribute("hidden", Boolean(needle) && !(row.getAttribute("data-search") || "").toLocaleLowerCase("fa").includes(needle)));
  });

  document.querySelectorAll("[data-approval]").forEach((button) => button.addEventListener("click", () => perform(button, "تصمیم انسانی ثبت شد.", () => runtimeData.command(`/api/v1/approvals/${encodeURIComponent(button.dataset.approval)}/decision`, { body: { decision: button.dataset.decision } }))));
  document.querySelectorAll("[data-create-action]").forEach((button) => button.addEventListener("click", () => perform(button, "Action روی سرور ساخته شد.", () => runtimeData.command(`/api/v1/cases/${encodeURIComponent(button.dataset.createAction)}/actions`, { body: { actionType: "human-reviewed-service", executionMode: "human" }, idempotencyKey: `ui-action-${button.dataset.createAction}` }))));
  document.querySelectorAll("[data-run-action]").forEach((button) => button.addEventListener("click", () => perform(button, "اجرا موفق و Receipt صادر شد.", () => runtimeData.command(`/api/v1/actions/${encodeURIComponent(button.dataset.runAction)}/runs`, { body: {} }))));
  document.querySelectorAll("[data-record-outcome]").forEach((button) => button.addEventListener("click", () => {
    const reason = document.querySelector("#outcome-reason");
    return perform(button, "Outcome ثبت و Case حل شد.", () => runtimeData.command(`/api/v1/cases/${encodeURIComponent(button.dataset.recordOutcome)}/outcomes`, { body: { reason: reason instanceof HTMLTextAreaElement ? reason.value : "نتیجه ثبت شد" } }));
  }));

  const intake = document.querySelector("#server-intake");
  intake?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!(intake instanceof HTMLFormElement) || !intake.reportValidity()) return;
    const fields = new FormData(intake);
    const email = String(fields.get("email") || "").trim();
    const phone = String(fields.get("phone") || "").trim();
    if (!email && !phone) {
      const error = document.querySelector("#intake-error");
      if (error) error.textContent = "حداقل ایمیل یا تلفن را وارد کنید.";
      return;
    }
    const button = intake.querySelector("button[type=submit]");
    perform(button, "پرونده با موفقیت روی سرور ساخته شد.", async () => {
      const response = await runtimeData.command("/api/v1/intakes", {
        body: {
          organization: String(fields.get("organization") || ""), contactName: String(fields.get("contactName") || ""),
          email, phone, purpose: String(fields.get("purpose") || ""), serviceId: String(fields.get("serviceId") || ""),
          sourceChannel: String(fields.get("sourceChannel") || "operator"), attribution: { entry: "rahjo-server-ui" }
        },
        idempotencyKey: `ui-intake-${crypto.randomUUID()}`
      });
      const caseId = response?.data?.caseId;
      if (caseId) {
        history.pushState({}, "", caseHref(caseId));
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    });
  });
}
