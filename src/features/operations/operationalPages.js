import { appShell } from "../../app/appShell.js";
import { icon } from "../../components/icons.js";
import { escapeHtml } from "../../lib/html.js";
import {
  accountMemory,
  demoAccounts,
  demoActions,
  demoApprovals,
  demoAuditEvents,
  demoAutomationRuns,
  demoCases,
  demoDataQuality,
  demoInteractions,
  demoLeads,
  demoOpportunities,
  demoOutcomes,
  demoServiceCapabilities,
  demoTasks,
  demoWorkflows,
  operationalMetrics,
  operationalWorkspace
} from "../../data/operationalData.js";

const positiveTerms = new Set(["Active", "Qualified", "Approved", "Resolved", "Recorded", "succeeded", "Pilot Candidate", "In Progress", "Action/Execution"]);
const blockedTerms = new Set(["Blocked", "Failed", "failed", "Expired", "Unavailable/TBD", "Dormant"]);
const warningTerms = new Set(["Requested", "Reviewing", "Waiting", "Waiting/Approval", "Evidence Required", "Under Review", "queued", "running", "Proposal", "Open"]);

function tone(value = "") {
  if (positiveTerms.has(value)) return "positive";
  if (blockedTerms.has(value)) return "blocked";
  if (warningTerms.has(value)) return "warning";
  return "neutral";
}

/** @param {string} value @param {string} [label] */
function status(value, label = value) {
  return `<span class="status-chip status-chip--${tone(value)}">${escapeHtml(label)}</span>`;
}

function demoNotice() {
  return `<div class="demo-notice" role="note">${icon("shield", { size: 17 })}<div><strong>دمو / داده‌های مصنوعی</strong><span>${escapeHtml(operationalWorkspace.disclaimer)}</span></div></div>`;
}

/** @param {string} title @param {string} description @param {string} [actions] */
function pageHeader(title, description, actions = "") {
  return `<section class="ops-heading"><div><h1>${title}</h1><p>${description}</p></div><div class="ops-heading__actions">${actions}</div></section>`;
}

/** @param {string} title @param {string} meta @param {string} [action] */
function panelHeader(title, meta, action = "") {
  return `<header class="ops-panel__head"><div><h2>${title}</h2><small>${meta}</small></div>${action}</header>`;
}

function continuationRail(active = "") {
  const items = [
    ["business", "Account", "حساب"], ["requests", "Case", "پرونده"], ["shield", "Approval", "تأیید"],
    ["workflow", "Action", "اقدام"], ["check", "Outcome", "نتیجه"]
  ];
  return `<ol class="continuity-rail" aria-label="تداوم عملیاتی حساب تا نتیجه">${items.map(([glyph, key, label]) => `<li ${active === key ? 'aria-current="step"' : ""}><span>${icon(glyph, { size: 19 })}</span><div><b>${label}</b><small>${key}</small></div></li>`).join("")}</ol>`;
}

function metricStrip() {
  return `<section class="ops-metrics" aria-label="شاخص‌های نمونه">${operationalMetrics.map((item) => `
    <article class="ops-metric ops-metric--${item.tone}"><span>${icon(item.icon, { size: 23 })}</span><div><small>${item.label}</small><strong>${item.value}</strong><em>${item.note}</em></div></article>`).join("")}</section>`;
}

function taskRows(tasks = demoTasks) {
  return tasks.map((item) => `<tr data-state="${escapeHtml(item.status)}" data-priority="${escapeHtml(item.priority)}">
    <td><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.caseId)}</small></td><td>${escapeHtml(item.owner)}</td>
    <td>${escapeHtml(item.dueAt)}</td><td>${status(item.status)}</td><td>${escapeHtml(item.priority)}</td></tr>`).join("");
}

function caseRows(cases = demoCases) {
  return cases.map((item) => `<tr data-case-id="${item.caseId}" data-state="${escapeHtml(item.status)}">
    <td><code>${item.caseId}</code></td><td><strong>${escapeHtml(item.purpose)}</strong><small>${escapeHtml(item.account)}</small></td>
    <td>${escapeHtml(item.owner)}</td><td>${status(item.status)}</td><td>${escapeHtml(item.nextAction)}</td></tr>`).join("");
}

function auditRows(events = demoAuditEvents) {
  return events.map((item) => `<tr data-case="${item.caseId}"><td>${escapeHtml(item.time)}</td><td>${escapeHtml(item.actor)}</td><td>${escapeHtml(item.change)}</td><td>${escapeHtml(item.source)}</td><td>${escapeHtml(item.state)}</td><td><code>${item.caseId}</code></td></tr>`).join("");
}

export function renderOperationalDashboardPage() {
  const recentQuality = demoDataQuality.slice(0, 3).map((item) => `<li><span class="severity-dot severity-dot--${tone(item.state)}"></span><div><strong>${escapeHtml(item.summary)}</strong><small>${item.issueId} · ${escapeHtml(item.entity)} · ${escapeHtml(item.owner)}</small></div>${status(item.state)}</li>`).join("");
  const content = `
    ${pageHeader("داشبورد عملیات", "نمای لحظه‌ایِ پرونده‌ها، پیگیری‌ها، تأییدها و کیفیت داده برای اقدام انسانی و قابل ممیزی.", `<a data-link class="button button--secondary" href="/crm">مشاهده مشتریان</a><a data-link class="button button--primary" href="/services">ورود پرونده جدید ${icon("arrow", { size: 16 })}</a>`)}
    ${demoNotice()}
    ${metricStrip()}
    <div class="ops-toolbar" aria-label="فیلتر سریع داشبورد"><strong>تمرکز امروز</strong><button type="button" class="filter-button" data-dashboard-filter="all" aria-pressed="true">همه</button><button type="button" class="filter-button" data-dashboard-filter="بالا" aria-pressed="false">اولویت بالا</button><button type="button" class="filter-button" data-dashboard-filter="Blocked" aria-pressed="false">مسدود</button><span id="dashboard-filter-result" aria-live="polite">۶ پیگیری باز نمونه</span></div>
    <section class="ops-grid ops-grid--dashboard">
      <article class="ops-panel ops-panel--wide">${panelHeader("پیگیری‌های امروز", "مالک، موعد و وضعیت اقدام بعدی", `<a data-link href="/sales" class="text-link">صف فروش ${icon("arrow", { size: 15 })}</a>`)}<div class="table-wrap"><table class="ops-table"><thead><tr><th>موضوع</th><th>مالک</th><th>موعد</th><th>وضعیت</th><th>اولویت</th></tr></thead><tbody id="dashboard-task-rows">${taskRows(demoTasks.slice(0, 6))}</tbody></table></div></article>
      <article class="ops-panel">${panelHeader("هشدارهای کیفیت داده", "بدون اصلاح یا merge خودکار", `<a data-link href="/governance" class="text-link">بررسی همه</a>`)}<ul class="issue-list">${recentQuality}</ul></article>
      <article class="ops-panel ops-panel--wide">${panelHeader("پرونده‌ها و درخواست‌ها", "Case و Service روی حافظه مشترک", `<a data-link href="/services" class="text-link">فضای سرویس</a>`)}<div class="table-wrap"><table class="ops-table"><thead><tr><th>شناسه</th><th>پرونده</th><th>مالک</th><th>وضعیت</th><th>اقدام بعدی</th></tr></thead><tbody>${caseRows(demoCases.slice(0, 4))}</tbody></table></div></article>
      <article class="ops-panel">${panelHeader("فعالیت اخیر", "ردپای actor / source / state", `<a data-link href="/governance" class="text-link">بازسازی timeline</a>`)}<ol class="activity-list">${demoAuditEvents.slice(0, 4).map((item) => `<li><time>${escapeHtml(item.time)}</time><div><strong>${escapeHtml(item.change)}</strong><small>${escapeHtml(item.actor)} · ${escapeHtml(item.source)}</small></div></li>`).join("")}</ol></article>
    </section>
    <section class="ops-panel ops-continuity">${panelHeader("مسیر عملیاتی مشترک", "Phase 1 با AI خاموش کامل است؛ Outcome برای آینده حفظ می‌شود")} ${continuationRail("Case")}</section>`;
  return appShell({ content, activePath: "/dashboard", title: "داشبورد عملیات" });
}

export function mountOperationalDashboardPage() {
  const buttons = document.querySelectorAll("[data-dashboard-filter]");
  const rows = document.querySelectorAll("#dashboard-task-rows tr");
  const output = document.querySelector("#dashboard-filter-result");
  buttons.forEach((button) => button.addEventListener("click", () => {
    const filter = button.getAttribute("data-dashboard-filter") ?? "all";
    buttons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    let visible = 0;
    rows.forEach((row) => {
      const match = filter === "all" || row.getAttribute("data-priority") === filter || row.getAttribute("data-state") === filter;
      row.toggleAttribute("hidden", !match);
      if (match) visible += 1;
    });
    if (output) output.textContent = `${visible.toLocaleString("fa-IR")} پیگیری در این نما`;
  }));
}

function accountListRows(selectedId = demoAccounts[0].accountId) {
  return demoAccounts.map((account) => `<button type="button" class="account-row" data-account-id="${account.accountId}" data-search="${escapeHtml(`${account.name} ${account.accountId} ${account.owner}`)}" data-status="${account.lifecycleStatus}" aria-pressed="${String(account.accountId === selectedId)}">
    <span class="account-row__avatar">${icon("business", { size: 18 })}</span><span><strong>${escapeHtml(account.name)}</strong><small>${account.accountId}</small></span>${status(account.lifecycleStatus)}<em>${escapeHtml(account.owner)}</em></button>`).join("");
}

/** @param {string} accountId */
function accountDetail(accountId) {
  const memory = accountMemory(accountId);
  const { account } = memory;
  return `<div class="account-detail" data-account-detail="${account.accountId}">
    <header class="account-hero"><div class="account-identity"><span>${icon("business", { size: 26 })}</span><div><h2>${escapeHtml(account.name)}</h2><code>${account.accountId}</code><p>${escapeHtml(account.legalName)}</p></div></div><div class="account-hero__actions">${status(account.lifecycleStatus, account.lifecycleStatus === "Active" ? "مشتری فعال" : account.lifecycleStatus)}<button type="button" class="button button--primary" data-log-followup>${icon("clock", { size: 16 })} ثبت پیگیری</button></div></header>
    <div class="account-summary"><div><small>مالک حساب</small><strong>${escapeHtml(account.owner)}</strong></div><div><small>منبع</small><strong>${escapeHtml(account.sourceSystem)}</strong></div><div><small>آخرین به‌روزرسانی</small><strong>${escapeHtml(account.updatedAt)}</strong></div><div class="account-next"><small>اقدام بعدی</small><strong>${escapeHtml(account.nextAction)}</strong><em>${escapeHtml(account.nextDue)}</em></div></div>
    <div class="followup-confirmation" data-followup-confirmation hidden role="status">پیگیری نمونه به صف محلی اضافه شد؛ هیچ پیام خارجی ارسال نشد.</div>
    ${continuationRail("Account")}
    <div class="account-sections">
      <section class="account-section">${panelHeader("اطلاعات کلیدی", "شناسه و وضعیت canonical")}<dl class="definition-grid"><div><dt>نوع حساب</dt><dd>${escapeHtml(account.accountType)}</dd></div><div><dt>بخش</dt><dd>${escapeHtml(account.segment)}</dd></div><div><dt>Case باز</dt><dd>${memory.cases.filter((item) => item.status !== "Resolved").length.toLocaleString("fa-IR")}</dd></div><div><dt>منبع مرجع</dt><dd><code>${escapeHtml(account.sourceRef)}</code></dd></div></dl></section>
      <section class="account-section">${panelHeader("پرونده‌های باز", "Case + eligibility + action")}<div class="compact-list">${memory.cases.map((item) => `<div><span>${icon("requests", { size: 17 })}</span><p><strong>${escapeHtml(item.purpose)}</strong><small>${item.caseId} · ${escapeHtml(item.nextAction)}</small></p>${status(item.status)}</div>`).join("") || "<p>Case نمونه‌ای ثبت نشده است.</p>"}</div></section>
      <section class="account-section">${panelHeader("ارتباطات و نقش‌ها", "Contact بدون هویت تکراری")}<div class="compact-list">${memory.contacts.map((item) => `<div><span>${icon("users", { size: 17 })}</span><p><strong>${escapeHtml(item.fullName)}</strong><small>${escapeHtml(item.role)} · ${escapeHtml(item.channel)}</small></p><code>${item.contactId}</code></div>`).join("") || "<p>تماس نمونه‌ای ثبت نشده است.</p>"}</div></section>
      <section class="account-section">${panelHeader("پیگیری‌ها", "مالک و موعد")}<div class="compact-list">${memory.tasks.map((item) => `<div><span>${icon("clock", { size: 17 })}</span><p><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.owner)} · ${escapeHtml(item.dueAt)}</small></p>${status(item.status)}</div>`).join("") || "<p>پیگیری بازی وجود ندارد.</p>"}</div></section>
      <section class="account-section account-section--wide">${panelHeader("تعاملات اخیر", "کانال، زمان و source reference")}<ol class="timeline">${memory.interactions.map((item) => `<li><span>${icon(item.channel === "تماس" ? "phone" : item.channel === "سند" ? "document" : item.channel === "جلسه" ? "users" : "message", { size: 17 })}</span><div><strong>${escapeHtml(item.channel)} — ${escapeHtml(item.summary)}</strong><small>${escapeHtml(item.occurredAt)} · ${escapeHtml(item.actor)} · ${escapeHtml(item.sourceRef)}</small></div></li>`).join("") || "<li>تعامل نمونه‌ای ثبت نشده است.</li>"}</ol></section>
      <section class="account-section">${panelHeader("پیشنهاد و قرارداد", "فقط مرجع/وضعیت؛ بدون قیمت‌گذاری خودکار")}<div class="compact-list">${memory.proposals.map((item) => `<div><span>${icon("document", { size: 17 })}</span><p><strong>${escapeHtml(item.proposalId)}</strong><small>${escapeHtml(item.status)} · ${escapeHtml(item.owner)}</small></p>${status(item.approvalState)}</div>`).join("")}${memory.contracts.map((item) => `<div><span>${icon("legal", { size: 17 })}</span><p><strong>${escapeHtml(item.contractId)}</strong><small>${escapeHtml(item.status)} · ${escapeHtml(item.owner)}</small></p></div>`).join("") || "<p>مرجع فعالی ثبت نشده است.</p>"}</div></section>
      <section class="account-section">${panelHeader("خلاصه نتیجه / سوابق", "Outcome ثبت‌شده روی همان Case")}<div class="compact-list">${memory.outcomes.map((item) => `<div><span>${icon("check", { size: 17 })}</span><p><strong>${escapeHtml(item.reason)}</strong><small>${item.outcomeId} · ${escapeHtml(item.recordedAt)}</small></p>${status(item.resultStatus)}</div>`).join("") || "<p>Outcome نمونه‌ای برای این حساب ثبت نشده است.</p>"}</div></section>
    </div>
  </div>`;
}

export function renderCrmPage() {
  const selected = demoAccounts[0];
  const content = `<div class="crm-layout"><aside class="account-directory">
    <header><div><h1>مشتریان</h1><small>${demoAccounts.length.toLocaleString("fa-IR")} حساب مصنوعی</small></div>${status("Demo/Synthetic", "اطلاعات دمو")}</header>
    <label class="ops-search">${icon("search", { size: 17 })}<input id="account-search" type="search" placeholder="جست‌وجوی حساب یا شناسه…" aria-label="جست‌وجوی حساب" /></label>
    <label class="select-control"><span>وضعیت</span><select id="account-status-filter"><option value="all">همه</option><option value="Active">Active</option><option value="Prospect">Prospect</option><option value="Dormant">Dormant</option></select></label>
    <div id="account-list" class="account-list">${accountListRows(selected.accountId)}</div><p id="account-list-status" class="list-status" aria-live="polite">${demoAccounts.length.toLocaleString("fa-IR")} حساب نمایش داده شد</p>
  </aside><main class="account-detail-region"><div class="crm-topline"><span>Account 360 / مشتریان</span>${demoNotice()}</div>${accountDetail(selected.accountId)}</main></div>`;
  return appShell({ content, activePath: "/crm", title: "مشتریان / Account 360" });
}

export function mountCrmPage() {
  const list = document.querySelector("#account-list");
  const detail = document.querySelector(".account-detail-region");
  const search = document.querySelector("#account-search");
  const filter = document.querySelector("#account-status-filter");
  const output = document.querySelector("#account-list-status");
  const bindFollowup = () => document.querySelector("[data-log-followup]")?.addEventListener("click", () => {
    const message = document.querySelector("[data-followup-confirmation]");
    if (message instanceof HTMLElement) message.hidden = false;
  });
  list?.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("[data-account-id]") : null;
    if (!(button instanceof HTMLButtonElement) || !(detail instanceof HTMLElement)) return;
    list.querySelectorAll("[data-account-id]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    detail.innerHTML = `<div class="crm-topline"><span>Account 360 / مشتریان</span>${demoNotice()}</div>${accountDetail(button.dataset.accountId ?? demoAccounts[0].accountId)}`;
    bindFollowup();
  });
  const applyFilter = () => {
    const needle = search instanceof HTMLInputElement ? search.value.trim().toLocaleLowerCase("fa") : "";
    const selected = filter instanceof HTMLSelectElement ? filter.value : "all";
    let visible = 0;
    list?.querySelectorAll("[data-account-id]").forEach((row) => {
      const matches = (!needle || (row.getAttribute("data-search") ?? "").toLocaleLowerCase("fa").includes(needle)) && (selected === "all" || row.getAttribute("data-status") === selected);
      row.toggleAttribute("hidden", !matches);
      if (matches) visible += 1;
    });
    if (output) output.textContent = `${visible.toLocaleString("fa-IR")} حساب نمایش داده شد`;
  };
  search?.addEventListener("input", applyFilter);
  filter?.addEventListener("change", applyFilter);
  bindFollowup();
}

function pipelineColumns() {
  const stages = ["Identified", "Qualified", "Proposal", "On Hold"];
  return `<div class="pipeline-board">${stages.map((stage) => `<section data-stage-column="${stage}"><header><h3>${stage}</h3><span>${demoOpportunities.filter((item) => item.stage === stage).length.toLocaleString("fa-IR")}</span></header>${demoOpportunities.filter((item) => item.stage === stage).map((item) => `<article><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.account)}</small><p>${escapeHtml(item.nextAction)}</p><footer><span>${escapeHtml(item.owner)}</span><code>${item.opportunityId}</code></footer></article>`).join("")}</section>`).join("")}</div>`;
}

export function renderSalesPage() {
  const leadRows = demoLeads.map((item) => `<tr data-lead-status="${item.status}"><td><code>${item.leadId}</code></td><td><strong>${escapeHtml(item.account)}</strong><small>${escapeHtml(item.qualificationReason)}</small></td><td>${escapeHtml(item.sourceChannel)}</td><td>${status(item.status)}</td><td>${escapeHtml(item.owner)}</td><td>${escapeHtml(item.receivedAt)}</td></tr>`).join("");
  const content = `${pageHeader("فروش", "سرنخ، فرصت و پیگیری با حفظ source attribution و تحویل روشن به انسان در درخواست‌های B2B پیچیده.", `<a data-link class="button button--secondary" href="/crm">Account 360</a><button class="button button--primary" type="button" id="sales-handoff">تحویل انسانی ${icon("users", { size: 16 })}</button>`)}${demoNotice()}
    <div class="ops-tabs" role="tablist"><button type="button" role="tab" aria-selected="true" data-sales-tab="pipeline">Pipeline</button><button type="button" role="tab" aria-selected="false" data-sales-tab="leads">سرنخ‌ها</button><button type="button" role="tab" aria-selected="false" data-sales-tab="followups">پیگیری‌ها</button><span id="sales-feedback" aria-live="polite"></span></div>
    <section data-sales-panel="pipeline" class="sales-panel">${panelHeader("مسیر فرصت‌های نمونه", "هیچ مبلغ یا probability بدون evidence نمایش داده نمی‌شود")} ${pipelineColumns()}</section>
    <section data-sales-panel="leads" class="sales-panel" hidden>${panelHeader("سرنخ‌ها و منبع ورود", "source attribution در qualification حفظ می‌شود", `<label class="select-control select-control--inline"><span>وضعیت</span><select id="lead-filter"><option value="all">همه</option><option value="New">New</option><option value="Reviewing">Reviewing</option><option value="Qualified">Qualified</option></select></label>`)}<div class="table-wrap"><table class="ops-table"><thead><tr><th>شناسه</th><th>حساب کاندید</th><th>منبع</th><th>وضعیت</th><th>مالک</th><th>ورود</th></tr></thead><tbody>${leadRows}</tbody></table></div></section>
    <section data-sales-panel="followups" class="sales-panel" hidden>${panelHeader("صف پیگیری", "هر اقدام بحرانی مالک و وضعیت دارد")}<div class="table-wrap"><table class="ops-table"><thead><tr><th>موضوع</th><th>مالک</th><th>موعد</th><th>وضعیت</th><th>اولویت</th></tr></thead><tbody>${taskRows()}</tbody></table></div></section>`;
  return appShell({ content, activePath: "/sales", title: "فروش" });
}

export function mountSalesPage() {
  const tabs = document.querySelectorAll("[data-sales-tab]");
  tabs.forEach((tab) => tab.addEventListener("click", () => {
    const target = tab.getAttribute("data-sales-tab");
    tabs.forEach((item) => item.setAttribute("aria-selected", String(item === tab)));
    document.querySelectorAll("[data-sales-panel]").forEach((panel) => panel.toggleAttribute("hidden", panel.getAttribute("data-sales-panel") !== target));
  }));
  document.querySelector("#lead-filter")?.addEventListener("change", (event) => {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : "all";
    document.querySelectorAll("[data-lead-status]").forEach((row) => row.toggleAttribute("hidden", value !== "all" && row.getAttribute("data-lead-status") !== value));
  });
  document.querySelector("#sales-handoff")?.addEventListener("click", () => {
    const feedback = document.querySelector("#sales-feedback");
    if (feedback) feedback.textContent = "Task نمونه برای بازبینی انسانی ساخته شد؛ ارسال خارجی انجام نشد.";
  });
}

function capabilityRows() {
  return demoServiceCapabilities.map((item, index) => `<button type="button" class="capability-row" data-service-id="${item.serviceId}" aria-pressed="${String(index === 0)}"><span>${icon("api", { size: 18 })}</span><p><strong>${escapeHtml(item.name)}</strong><small>${item.serviceId} · ${escapeHtml(item.category)}</small></p>${status(item.publicStatus)}</button>`).join("");
}

/** @param {string} serviceId */
function capabilityDetail(serviceId) {
  const service = demoServiceCapabilities.find((item) => item.serviceId === serviceId) ?? demoServiceCapabilities[0];
  const cases = demoCases.filter((item) => item.serviceId === service.serviceId);
  return `<div class="capability-detail"><header><div><small>${service.serviceId}</small><h2>${escapeHtml(service.name)}</h2><p>${escapeHtml(service.category)} · ${escapeHtml(service.environmentStatus)}</p></div>${status(service.publicStatus)}</header>
    <div class="claim-boundary"><span>${icon("shield", { size: 19 })}</span><div><strong>مرز evidence و eligibility</strong><p>وضعیت «${escapeHtml(service.eligibilityStatus)}» فقط fixture نمایشی است و به معنی دسترسی رسمی، اتصال زنده یا مجوز قانونی نیست.</p></div></div>
    <dl class="definition-grid"><div><dt>Eligibility</dt><dd>${escapeHtml(service.eligibilityStatus)}</dd></div><div><dt>محیط</dt><dd>${escapeHtml(service.environmentStatus)}</dd></div><div><dt>Risk</dt><dd>${escapeHtml(service.riskClass)}</dd></div><div><dt>مالک</dt><dd>${escapeHtml(service.owner)}</dd></div><div><dt>Evidence ref</dt><dd><code>${escapeHtml(service.evidenceRef)}</code></dd></div></dl>
    ${panelHeader("درخواست‌های مرتبط", "Approval / execution / stale / error states")}<div class="table-wrap"><table class="ops-table"><thead><tr><th>Case</th><th>حساب</th><th>وضعیت</th><th>Approval</th><th>Action/Outcome</th></tr></thead><tbody>${cases.map((item) => {
      const approval = demoApprovals.find((candidate) => candidate.approvalId === item.approvalId);
      const action = demoActions.find((candidate) => candidate.actionId === item.actionId);
      return `<tr><td><code>${item.caseId}</code></td><td>${escapeHtml(item.account)}</td><td>${status(item.status)}</td><td>${approval ? status(approval.status) : "Evidence required"}</td><td>${action ? `${escapeHtml(action.executionMode)} · ${status(action.status)}` : "TBD"}</td></tr>`;
    }).join("") || '<tr><td colspan="5">درخواست نمونه‌ای برای این capability ثبت نشده است.</td></tr>'}</tbody></table></div></div>`;
}

export function renderServicesPage() {
  const content = `${pageHeader("سرویس‌ها و APIها", "کاتالوگ capability و وضعیت درخواست با مرز روشن evidence، approval و اجرای Sandbox.", `<button type="button" class="button button--primary" id="new-service-request">درخواست سرویس نمونه ${icon("arrow", { size: 16 })}</button>`)}${demoNotice()}<div class="service-workspace"><aside class="capability-list">${panelHeader("کاتالوگ قابلیت", "وضعیت‌های claim-safe")}<label class="ops-search">${icon("search", { size: 17 })}<input id="service-search" type="search" placeholder="جست‌وجوی capability…" /></label><div id="capability-list">${capabilityRows()}</div></aside><main id="capability-detail">${capabilityDetail(demoServiceCapabilities[0].serviceId)}</main></div><p id="service-feedback" class="interaction-feedback" aria-live="polite"></p>`;
  return appShell({ content, activePath: "/services", title: "سرویس‌ها و APIها" });
}

export function mountServicesPage() {
  const list = document.querySelector("#capability-list");
  const detail = document.querySelector("#capability-detail");
  list?.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("[data-service-id]") : null;
    if (!(button instanceof HTMLButtonElement) || !(detail instanceof HTMLElement)) return;
    list.querySelectorAll("[data-service-id]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    detail.innerHTML = capabilityDetail(button.dataset.serviceId ?? demoServiceCapabilities[0].serviceId);
  });
  document.querySelector("#service-search")?.addEventListener("input", (event) => {
    const needle = event.target instanceof HTMLInputElement ? event.target.value.toLocaleLowerCase("fa") : "";
    list?.querySelectorAll("[data-service-id]").forEach((row) => row.toggleAttribute("hidden", !row.textContent?.toLocaleLowerCase("fa").includes(needle)));
  });
  document.querySelector("#new-service-request")?.addEventListener("click", () => {
    const output = document.querySelector("#service-feedback");
    if (output) output.textContent = "Case نمونه در حافظه محلی ایجاد شد و تا دریافت evidence در وضعیت Under Review می‌ماند.";
  });
}

function runRows() {
  return demoAutomationRuns.map((item) => `<tr data-run-state="${item.state}"><td><strong>${escapeHtml(item.workflow)}</strong><small>${item.workflowId}</small></td><td><code>${item.runId}</code></td><td><code>${item.caseId}</code></td><td>${escapeHtml(item.approval)}</td><td>${status(item.state)}</td><td>${escapeHtml(item.startedAt)}</td><td><code>${escapeHtml(item.receipt)}</code></td><td>${item.state === "failed" ? `<button type="button" class="text-button" data-retry-run="${item.runId}">تلاش مجدد محدود</button>` : escapeHtml(item.retry)}</td></tr>`).join("");
}

export function renderAutomationPage() {
  const content = `${pageHeader("اتوماسیون", "Workflowهای deterministic و bounded؛ هر اقدام حساس به انسان تحویل می‌شود و receipt قابل مشاهده دارد.", `<a data-link class="button button--secondary" href="/governance">مشاهده ممیزی</a>`)}${demoNotice()}
    <section class="ops-panel">${panelHeader("کاندیداهای Workflow", "Trigger / context / risk / approval / handoff")}<div class="workflow-strip">${demoWorkflows.map((item) => `<article><span>${icon("workflow", { size: 20 })}</span><div><strong>${escapeHtml(item.name)}</strong><small>${item.workflowId} · ${escapeHtml(item.trigger)}</small><p>${escapeHtml(item.context)}</p></div><dl><div><dt>Risk</dt><dd>${escapeHtml(item.risk)}</dd></div><div><dt>Approval</dt><dd>${escapeHtml(item.approval)}</dd></div><div><dt>Handoff</dt><dd>${escapeHtml(item.humanHandoff)}</dd></div></dl>${status(item.status)}</article>`).join("")}</div></section>
    <section class="ops-panel">${panelHeader("Runها و receiptها", "queued / running / succeeded / failed / canceled / demo", `<label class="select-control select-control--inline"><span>Run state</span><select id="run-filter"><option value="all">همه</option>${["queued", "running", "succeeded", "failed", "canceled"].map((value) => `<option value="${value}">${value}</option>`).join("")}</select></label>`)}<div class="table-wrap"><table class="ops-table"><thead><tr><th>Workflow</th><th>Run</th><th>Case</th><th>Approval</th><th>State</th><th>شروع</th><th>Receipt</th><th>Retry</th></tr></thead><tbody id="run-rows">${runRows()}</tbody></table></div><p id="run-feedback" class="interaction-feedback" aria-live="polite"></p></section>
    <aside class="human-gate-note">${icon("shield", { size: 20 })}<div><strong>Gate انسانی تغییرناپذیر</strong><p>قیمت‌گذاری استثنایی، تعهد قراردادی/SLA، دسترسی داده حساس، ارسال گروهی و فعال‌سازی پرریسک در این UI هرگز خودکار اجرا نمی‌شوند.</p></div></aside>`;
  return appShell({ content, activePath: "/automation", title: "اتوماسیون" });
}

export function mountAutomationPage() {
  document.querySelector("#run-filter")?.addEventListener("change", (event) => {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : "all";
    document.querySelectorAll("[data-run-state]").forEach((row) => row.toggleAttribute("hidden", value !== "all" && row.getAttribute("data-run-state") !== value));
  });
  document.querySelector("#run-rows")?.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("[data-retry-run]") : null;
    if (!(button instanceof HTMLButtonElement)) return;
    button.disabled = true;
    button.textContent = "queued — demo";
    const row = button.closest("tr");
    row?.setAttribute("data-run-state", "queued");
    const output = document.querySelector("#run-feedback");
    if (output) output.textContent = `${button.dataset.retryRun} با همان idempotency boundary در صف محلی قرار گرفت؛ اجرای خارجی انجام نشد.`;
  });
}

function qualityRows() {
  return demoDataQuality.map((item) => `<tr data-issue-state="${item.state}" data-issue-type="${item.type}"><td>${status(item.state)}</td><td><strong>${escapeHtml(item.summary)}</strong><small>${item.issueId}</small></td><td>${escapeHtml(item.type)}</td><td>${escapeHtml(item.entity)} · <code>${escapeHtml(item.reference)}</code></td><td>${escapeHtml(item.owner)}</td><td>${escapeHtml(item.detectedAt)}</td><td>${escapeHtml(item.severity)}</td></tr>`).join("");
}

export function renderGovernancePage() {
  const content = `${pageHeader("ممیزی و کیفیت داده", "actor، source، time و state change برای بازسازی مسیر Case؛ بدون نمایش payload حساس.", "")}${demoNotice()}
    <section class="governance-summary"><article><span>${icon("audit", { size: 22 })}</span><div><small>رخداد ممیزی نمونه</small><strong>${demoAuditEvents.length.toLocaleString("fa-IR")}</strong></div></article><article><span>${icon("database", { size: 22 })}</span><div><small>Issue باز/بررسی</small><strong>${demoDataQuality.length.toLocaleString("fa-IR")}</strong></div></article><article><span>${icon("shield", { size: 22 })}</span><div><small>Approval باز/منقضی</small><strong>${demoApprovals.filter((item) => item.status !== "Approved").length.toLocaleString("fa-IR")}</strong></div></article></section>
    <section class="ops-panel">${panelHeader("هشدارهای کیفیت داده", "duplicate / missing / stale / ownerless", `<label class="select-control select-control--inline"><span>وضعیت issue</span><select id="issue-filter"><option value="all">همه</option><option value="Open">Open</option><option value="Reviewing">Reviewing</option><option value="Blocked">Blocked</option></select></label>`)}<div class="table-wrap"><table class="ops-table"><thead><tr><th>وضعیت</th><th>موضوع</th><th>نوع</th><th>موجودیت</th><th>مالک</th><th>کشف</th><th>شدت</th></tr></thead><tbody>${qualityRows()}</tbody></table></div></section>
    <section class="ops-panel">${panelHeader("بازسازی Timeline پرونده", "Case → actor / source / change / state", `<label class="select-control select-control--inline"><span>Case</span><select id="audit-case-filter"><option value="all">همه Caseها</option>${demoCases.map((item) => `<option value="${item.caseId}">${item.caseId}</option>`).join("")}</select></label>`)}<div class="table-wrap"><table class="ops-table"><thead><tr><th>زمان</th><th>Actor</th><th>رخداد</th><th>Source</th><th>State change</th><th>Case</th></tr></thead><tbody id="audit-rows">${auditRows()}</tbody></table></div><p id="audit-feedback" class="interaction-feedback" aria-live="polite">۵ رخداد مصنوعی؛ payload حساس عمداً نمایش داده نشده است.</p></section>`;
  return appShell({ content, activePath: "/governance", title: "ممیزی و کیفیت داده" });
}

export function mountGovernancePage() {
  document.querySelector("#issue-filter")?.addEventListener("change", (event) => {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : "all";
    document.querySelectorAll("[data-issue-state]").forEach((row) => row.toggleAttribute("hidden", value !== "all" && row.getAttribute("data-issue-state") !== value));
  });
  document.querySelector("#audit-case-filter")?.addEventListener("change", (event) => {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : "all";
    let count = 0;
    document.querySelectorAll("#audit-rows [data-case]").forEach((row) => {
      const visible = value === "all" || row.getAttribute("data-case") === value;
      row.toggleAttribute("hidden", !visible);
      if (visible) count += 1;
    });
    const output = document.querySelector("#audit-feedback");
    if (output) output.textContent = `${count.toLocaleString("fa-IR")} رخداد برای ${value === "all" ? "همه Caseها" : value}؛ payload حساس نمایش داده نشده است.`;
  });
}

/** @param {string} caseId */
function thinkRoomCase(caseId) {
  const selectedCase = demoCases.find((item) => item.caseId === caseId) ?? demoCases[0];
  const approval = demoApprovals.find((item) => item.approvalId === selectedCase.approvalId);
  const action = demoActions.find((item) => item.actionId === selectedCase.actionId);
  const outcome = demoOutcomes.find((item) => item.outcomeId === selectedCase.outcomeId);
  return `<div class="future-case"><header><div><small>${selectedCase.caseId}</small><h2>${escapeHtml(selectedCase.purpose)}</h2><p>${escapeHtml(selectedCase.account)} · ${escapeHtml(selectedCase.owner)}</p></div>${status(selectedCase.status)}</header>${continuationRail("Outcome")}<div class="future-records"><article><small>Context / Evidence</small><strong>منبع: ${escapeHtml(selectedCase.sourceChannel)}</strong><p>کمبودها و evidence باید از رکوردهای موجود خوانده شوند؛ این fixture ادعای RAG زنده ندارد.</p></article><article><small>Decision / Approval</small><strong>${approval ? `${approval.approvalId} · ${approval.status}` : "هنوز ثبت نشده"}</strong><p>تصمیم انسانی روی همین Case ثبت می‌شود؛ AI شرط ثبت Decision نیست.</p></article><article><small>Action</small><strong>${action ? `${action.actionId} · ${action.status}` : "اقدام آماده نشده"}</strong><p>هر اقدام حساس Gate انسانی و eligibility معتبر می‌خواهد.</p></article><article><small>Outcome</small><strong>${outcome ? outcome.outcomeId : "در انتظار نتیجه"}</strong><p>${outcome ? escapeHtml(outcome.reason) : "Outcome بعداً به همین حافظه تجاری بازمی‌گردد."}</p></article></div></div>`;
}

export function renderThinkRoomPage() {
  const content = `${pageHeader("اتاق فکر", "لایه هوشمندی آینده روی همان Account / Case / Decision / Action / Outcome؛ نه CRM دوم و نه وابستگی فاز اول.", `${status("Under Review", "آینده / غیرفعال در فاز ۱")}`)}${demoNotice()}
    <aside class="future-boundary">${icon("spark", { size: 24 })}<div><strong>Future intelligence — Not required for Phase 1</strong><p>هیچ مدل، confidence، RAG یا تصمیم خودکار در این نسخه live نیست. خاموش‌کردن این route هیچ workflow عملیاتی را نمی‌شکند.</p></div></aside>
    <div class="think-room-layout"><aside>${panelHeader("پرونده مشترک", "انتخاب Case برای دیدن پیوستگی")}<label class="select-control"><span>Case نمونه</span><select id="think-case-select">${demoCases.map((item) => `<option value="${item.caseId}">${item.caseId} — ${escapeHtml(item.account)}</option>`).join("")}</select></label><ol class="future-capabilities"><li><strong>Context + Evidence</strong><span>آینده؛ source/freshness-aware</span></li><li><strong>Options + Recommendation</strong><span>آینده؛ فقط با evidence</span></li><li><strong>Human Decision</strong><span>همیشه ثبت‌شده و قابل ممیزی</span></li><li><strong>Outcome learning</strong><span>روی همان حافظه تجاری</span></li></ol></aside><main id="think-room-case">${thinkRoomCase(demoCases[0].caseId)}</main></div>`;
  return appShell({ content, activePath: "/think-room", title: "اتاق فکر — آینده" });
}

export function mountThinkRoomPage() {
  document.querySelector("#think-case-select")?.addEventListener("change", (event) => {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : demoCases[0].caseId;
    const region = document.querySelector("#think-room-case");
    if (region instanceof HTMLElement) region.innerHTML = thinkRoomCase(value);
  });
}
