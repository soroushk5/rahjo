import { appShell } from "../../app/appShell.js";
import { entityHref, readRouteContext, requestNavigation, routeWithContext } from "../../app/entityRoutes.js";
import { icon } from "../../components/icons.js";
import { escapeHtml } from "../../lib/html.js";
import { operationalWorkspace } from "../../data/operationalData.js";
import {
  accountMemory,
  approveOrReject,
  caseContext,
  createHandoffTask,
  dashboardQueue,
  getOperationalState,
  logFollowup,
  qualifyLead,
  recordOutcome,
  startOrRetryRun,
  updateDataQualityIssue
} from "../../services/operationalStore.js";

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

/** @param {ReturnType<typeof getOperationalState>} state */
function metricStrip(state) {
  const metrics = [
    { label: "پرونده‌های باز", value: state.cases.filter((item) => item.status !== "Resolved").length, note: "از حافظه محلی دمو", icon: "requests", tone: "neutral" },
    { label: "پیگیری‌های نیازمند اقدام", value: state.tasks.filter((item) => !["Resolved", "Done"].includes(item.status)).length, note: "دارای مالک و اقدام بعدی", icon: "clock", tone: "warning" },
    { label: "Caseهای نیازمند تصمیم", value: state.approvals.filter((item) => item.status !== "Approved").length, note: "Gate انسانی حفظ شده", icon: "shield", tone: "blocked" },
    { label: "Runهای منتظر یا ناموفق", value: state.runs.filter((item) => ["queued", "failed"].includes(item.state)).length, note: "فقط local deterministic", icon: "workflow", tone: "warning" },
    { label: "هشدارهای کیفیت داده", value: state.dataQuality.filter((item) => item.state !== "Resolved").length, note: "بدون merge خودکار", icon: "database", tone: "warning" }
  ];
  return `<section class="ops-metrics" aria-label="شاخص‌های نمونه">${metrics.map((item) => `
    <article class="ops-metric ops-metric--${item.tone}"><span>${icon(item.icon, { size: 23 })}</span><div><small>${item.label}</small><strong>${item.value}</strong><em>${item.note}</em></div></article>`).join("")}</section>`;
}

/** @param {Array<Record<string, any>>} [tasks] */
function taskRows(tasks = []) {
  return tasks.map((item) => `<tr data-state="${escapeHtml(item.status)}" data-priority="${escapeHtml(item.priority)}">
    <td><a data-link class="entity-link" href="${escapeHtml(routeWithContext("/crm", { account: item.accountId, case: item.caseId }))}"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml([item.taskId, item.caseId].filter(Boolean).join(" · "))}</small></a></td><td>${escapeHtml(item.owner)}</td>
    <td>${escapeHtml(item.dueAt)}</td><td>${status(item.status)}</td><td>${escapeHtml(item.priority)}</td></tr>`).join("");
}

/** @param {Array<Record<string, any>>} [cases] */
function caseRows(cases = []) {
  return cases.map((item) => `<tr data-case-id="${item.caseId}" data-state="${escapeHtml(item.status)}">
    <td><a data-link class="entity-link" href="${escapeHtml(entityHref({ type: "case", caseId: item.caseId, serviceId: item.serviceId }))}"><code>${item.caseId}</code></a></td><td><a data-link class="entity-link" href="${escapeHtml(entityHref({ type: "case", caseId: item.caseId, serviceId: item.serviceId }))}"><strong>${escapeHtml(item.purpose)}</strong><small>${escapeHtml(item.account)}</small></a></td>
    <td>${escapeHtml(item.owner)}</td><td>${status(item.status)}</td><td>${escapeHtml(item.nextAction)}</td></tr>`).join("");
}

/** @param {Array<Record<string, any>>} queue @param {ReturnType<typeof getOperationalState>} state */
function actionQueueRows(queue, state) {
  return queue.map((item) => {
    const linkedCase = item.caseId ? state.cases.find((candidate) => candidate.caseId === item.caseId) : null;
    const href = item.type === "run" ? entityHref({ type: "run", runId: item.runId, caseId: item.caseId }) : item.type === "approval" ? entityHref({ type: "case", caseId: item.caseId, serviceId: linkedCase?.serviceId }) : routeWithContext("/crm", { account: item.accountId, case: item.caseId });
    return `<tr data-state="${escapeHtml(item.state ?? item.status)}" data-priority="${escapeHtml(item.priority)}"><td><a data-link class="entity-link" href="${escapeHtml(href)}"><strong>${escapeHtml(item.nextAction)}</strong><small>${escapeHtml(item.id)} · ${escapeHtml(item.caseId ?? item.accountId ?? "")}</small></a></td><td>${escapeHtml(item.owner)}</td><td>${escapeHtml(item.type)}</td><td>${status(item.state ?? item.status)}</td><td>${escapeHtml(item.priority)}</td></tr>`;
  }).join("");
}

/** @param {Array<Record<string, any>>} [events] */
function auditRows(events = []) {
  return events.map((item) => `<tr data-case="${escapeHtml(item.caseId ?? "")}"><td>${escapeHtml(item.time)}</td><td>${escapeHtml(item.actor)}</td><td>${escapeHtml(item.change)}</td><td>${escapeHtml(item.source)}</td><td>${escapeHtml(item.state)}</td><td>${item.caseId ? `<a data-link class="entity-link" href="${escapeHtml(entityHref({ type: "audit", caseId: item.caseId }))}"><code>${escapeHtml(item.caseId)}</code></a>` : `<code>${escapeHtml(item.entityId ?? "—")}</code>`}</td></tr>`).join("");
}

/** @param {{eyebrow:string,id:string,title:string,statusValue:string,owner?:string,nextAction?:string,links?:string}} input */
function contextHeader({ eyebrow, id, title, statusValue, owner, nextAction, links = "" }) {
  return `<section class="entity-context" aria-label="Context موجودیت"><div><small>${escapeHtml(eyebrow)}</small><h2>${escapeHtml(title)}</h2><code>${escapeHtml(id)}</code></div><dl><div><dt>وضعیت</dt><dd>${status(statusValue)}</dd></div><div><dt>مالک</dt><dd>${escapeHtml(owner ?? "TBD")}</dd></div><div><dt>اقدام بعدی</dt><dd>${escapeHtml(nextAction ?? "تعیین اقدام بعدی")}</dd></div></dl><nav>${links}</nav></section>`;
}

/** @param {string} kind @param {string} id @param {string} recovery */
function missingEntity(kind, id, recovery) {
  return `<section class="ops-panel empty-state" role="status"><span>${icon("warning", { size: 28 })}</span><h2>${escapeHtml(kind)} پیدا نشد</h2><p>شناسهٔ <code>${escapeHtml(id)}</code> در seed یا حافظه محلی فعلی وجود ندارد. هیچ داده‌ای ساخته یا جایگزین نشد.</p><a data-link class="button button--primary" href="${recovery}">بازگشت به نمای امن</a></section>`;
}

export function renderOperationalDashboardPage() {
  const state = getOperationalState();
  const queue = dashboardQueue();
  const recentQuality = state.dataQuality.filter((item) => item.state !== "Resolved").slice(0, 3).map((item) => `<li><span class="severity-dot severity-dot--${tone(item.state)}"></span><div><a data-link class="entity-link" href="${escapeHtml(entityHref({ type: "audit", issueId: item.issueId }))}"><strong>${escapeHtml(item.summary)}</strong><small>${item.issueId} · ${escapeHtml(item.entity)} · ${escapeHtml(item.owner)}</small></a></div>${status(item.state)}</li>`).join("");
  const content = `
    ${pageHeader("داشبورد عملیات", "صف اقدام مشتق‌شده از حافظه محلی؛ هر مورد مالک، وضعیت و مقصد عملیاتی دارد.", `<a data-link class="button button--secondary" href="/crm">مشاهده مشتریان</a><a data-link class="button button--primary" href="/cases/new">ورود پرونده جدید ${icon("arrow", { size: 16 })}</a>`)}
    ${demoNotice()}
    ${metricStrip(state)}
    <div class="ops-toolbar" aria-label="فیلتر سریع داشبورد"><strong>تمرکز امروز</strong><button type="button" class="filter-button" data-dashboard-filter="all" aria-pressed="true">همه</button><button type="button" class="filter-button" data-dashboard-filter="بالا" aria-pressed="false">اولویت بالا</button><button type="button" class="filter-button" data-dashboard-filter="Blocked" aria-pressed="false">مسدود</button><span id="dashboard-filter-result" aria-live="polite">۶ پیگیری باز نمونه</span></div>
    <section class="ops-grid ops-grid--dashboard">
      <article class="ops-panel ops-panel--wide">${panelHeader("صف اقدام امروز", "پیگیری، Gate و Run از shared state", `<a data-link href="/sales" class="text-link">صف فروش ${icon("arrow", { size: 15 })}</a>`)}<div class="table-wrap"><table class="ops-table"><thead><tr><th>اقدام / موجودیت</th><th>مالک</th><th>نوع</th><th>وضعیت</th><th>اولویت</th></tr></thead><tbody id="dashboard-task-rows">${actionQueueRows(queue.slice(0, 10), state)}</tbody></table></div><p class="list-status">${queue.length.toLocaleString("fa-IR")} مورد actionable در حافظه دمو</p></article>
      <article class="ops-panel">${panelHeader("هشدارهای کیفیت داده", "بدون اصلاح یا merge خودکار", `<a data-link href="/governance" class="text-link">بررسی همه</a>`)}<ul class="issue-list">${recentQuality}</ul></article>
      <article class="ops-panel ops-panel--wide">${panelHeader("پرونده‌ها و درخواست‌ها", "Case و Service روی حافظه مشترک", `<a data-link href="/services" class="text-link">فضای سرویس</a>`)}<div class="table-wrap"><table class="ops-table"><thead><tr><th>شناسه</th><th>پرونده</th><th>مالک</th><th>وضعیت</th><th>اقدام بعدی</th></tr></thead><tbody>${caseRows(state.cases.slice(0, 6))}</tbody></table></div></article>
      <article class="ops-panel">${panelHeader("فعالیت اخیر", "ردپای actor / source / state", `<a data-link href="/governance" class="text-link">بازسازی timeline</a>`)}<ol class="activity-list">${state.auditEvents.slice(0, 5).map((item) => `<li><time>${escapeHtml(item.time)}</time><div><a data-link class="entity-link" href="${escapeHtml(entityHref({ type: "audit", caseId: item.caseId }))}"><strong>${escapeHtml(item.change)}</strong><small>${escapeHtml(item.actor)} · ${escapeHtml(item.source)}</small></a></div></li>`).join("")}</ol></article>
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

/** @param {Array<Record<string, any>>} accounts @param {string} [selectedId] */
function accountListRows(accounts, selectedId = accounts[0]?.accountId) {
  return accounts.map((account) => `<a data-link href="${escapeHtml(entityHref({ type: "account", accountId: account.accountId }))}" class="account-row" data-account-id="${account.accountId}" data-search="${escapeHtml(`${account.name} ${account.accountId} ${account.owner}`)}" data-status="${account.lifecycleStatus}" aria-current="${account.accountId === selectedId ? "true" : "false"}">
    <span class="account-row__avatar">${icon("business", { size: 18 })}</span><span><strong>${escapeHtml(account.name)}</strong><small>${account.accountId}</small></span>${status(account.lifecycleStatus)}<em>${escapeHtml(account.owner)}</em></a>`).join("");
}

/** @param {string} accountId @param {string} [caseId] */
function accountDetail(accountId, caseId) {
  const memory = accountMemory(accountId);
  if (!memory) return missingEntity("Account", accountId, "/crm");
  const { account } = memory;
  const activeCase = memory.cases.find((item) => item.caseId === caseId) ?? memory.cases.find((item) => item.status !== "Resolved") ?? memory.cases[0];
  return `<div class="account-detail" data-account-detail="${account.accountId}">
    ${contextHeader({ eyebrow: "Account 360", id: account.accountId, title: account.name, statusValue: account.lifecycleStatus, owner: account.owner, nextAction: account.nextAction, links: `${activeCase ? `<a data-link href="${escapeHtml(entityHref({ type: "case", caseId: activeCase.caseId, serviceId: activeCase.serviceId }))}">Case جاری</a>` : ""}<a data-link href="${escapeHtml(routeWithContext("/sales", { account: account.accountId, opportunity: memory.opportunities[0]?.opportunityId }))}">فروش</a>` })}
    <header class="account-hero"><div class="account-identity"><span>${icon("business", { size: 26 })}</span><div><h2>${escapeHtml(account.name)}</h2><code>${account.accountId}</code><p>${escapeHtml(account.legalName)}</p></div></div><div class="account-hero__actions">${status(account.lifecycleStatus, account.lifecycleStatus === "Active" ? "مشتری فعال" : account.lifecycleStatus)}<button type="button" class="button button--primary" data-log-followup data-account-id="${account.accountId}" data-case-id="${activeCase?.caseId ?? ""}">${icon("clock", { size: 16 })} ثبت پیگیری</button></div></header>
    <div class="account-summary"><div><small>مالک حساب</small><strong>${escapeHtml(account.owner)}</strong></div><div><small>منبع</small><strong>${escapeHtml(account.sourceSystem)}</strong></div><div><small>آخرین به‌روزرسانی</small><strong>${escapeHtml(account.updatedAt)}</strong></div><div class="account-next"><small>اقدام بعدی</small><strong>${escapeHtml(account.nextAction)}</strong><em>${escapeHtml(account.nextDue)}</em></div></div>
    ${continuationRail("Account")}
    <div class="account-sections">
      <section class="account-section">${panelHeader("اطلاعات کلیدی", "شناسه و وضعیت canonical")}<dl class="definition-grid"><div><dt>نوع حساب</dt><dd>${escapeHtml(account.accountType)}</dd></div><div><dt>بخش</dt><dd>${escapeHtml(account.segment)}</dd></div><div><dt>Case باز</dt><dd>${memory.cases.filter((item) => item.status !== "Resolved").length.toLocaleString("fa-IR")}</dd></div><div><dt>منبع مرجع</dt><dd><code>${escapeHtml(account.sourceRef)}</code></dd></div></dl></section>
      <section class="account-section">${panelHeader("پرونده‌های باز", "Case + eligibility + action")}<div class="compact-list">${memory.cases.map((item) => `<div><span>${icon("requests", { size: 17 })}</span><p><a data-link class="entity-link" href="${escapeHtml(entityHref({ type: "case", caseId: item.caseId, serviceId: item.serviceId }))}"><strong>${escapeHtml(item.purpose)}</strong><small>${item.caseId} · ${escapeHtml(item.nextAction)}</small></a></p>${status(item.status)}</div>`).join("") || "<p>Case نمونه‌ای ثبت نشده است.</p>"}</div></section>
      <section class="account-section">${panelHeader("ارتباطات و نقش‌ها", "Contact بدون هویت تکراری")}<div class="compact-list">${memory.contacts.map((item) => `<div><span>${icon("users", { size: 17 })}</span><p><strong>${escapeHtml(item.fullName)}</strong><small>${escapeHtml(item.role)} · ${escapeHtml(item.channel)}</small></p><code>${item.contactId}</code></div>`).join("") || "<p>تماس نمونه‌ای ثبت نشده است.</p>"}</div></section>
      <section class="account-section">${panelHeader("پیگیری‌ها", "مالک و موعد")}<div class="compact-list">${memory.tasks.map((item) => `<div><span>${icon("clock", { size: 17 })}</span><p><a data-link class="entity-link" href="${escapeHtml(routeWithContext("/sales", { account: item.accountId, opportunity: item.opportunityId }))}"><strong>${escapeHtml(item.title)}</strong><small>${item.taskId} · ${escapeHtml(item.owner)} · ${escapeHtml(item.dueAt)}</small></a></p>${status(item.status)}</div>`).join("") || "<p>پیگیری بازی وجود ندارد.</p>"}</div></section>
      <section class="account-section account-section--wide">${panelHeader("تعاملات اخیر", "کانال، زمان و source reference")}<ol class="timeline">${memory.interactions.map((item) => `<li><span>${icon(item.channel === "تماس" ? "phone" : item.channel === "سند" ? "document" : item.channel === "جلسه" ? "users" : "message", { size: 17 })}</span><div><strong>${escapeHtml(item.channel)} — ${escapeHtml(item.summary)}</strong><small>${escapeHtml(item.occurredAt)} · ${escapeHtml(item.actor)} · ${escapeHtml(item.sourceRef)}</small></div></li>`).join("") || "<li>تعامل نمونه‌ای ثبت نشده است.</li>"}</ol></section>
      <section class="account-section">${panelHeader("فرصت، پیشنهاد و قرارداد", "مرجع عملیاتی؛ بدون قیمت‌گذاری خودکار")}<div class="compact-list">${memory.opportunities.map((item) => `<div><span>${icon("reports", { size: 17 })}</span><p><a data-link class="entity-link" href="${escapeHtml(entityHref({ type: "opportunity", opportunityId: item.opportunityId, accountId: item.accountId }))}"><strong>${escapeHtml(item.title)}</strong><small>${item.opportunityId} · ${escapeHtml(item.nextAction)}</small></a></p>${status(item.stage)}</div>`).join("")}${memory.proposals.map((item) => `<div><span>${icon("document", { size: 17 })}</span><p><strong>${escapeHtml(item.proposalId)}</strong><small>${escapeHtml(item.status)} · ${escapeHtml(item.owner)}</small></p>${status(item.approvalState)}</div>`).join("")}${memory.contracts.map((item) => `<div><span>${icon("legal", { size: 17 })}</span><p><strong>${escapeHtml(item.contractId)}</strong><small>${escapeHtml(item.status)} · ${escapeHtml(item.owner)}</small></p></div>`).join("") || "<p>مرجع فعالی ثبت نشده است.</p>"}</div></section>
      <section class="account-section">${panelHeader("خلاصه نتیجه / سوابق", "Outcome ثبت‌شده روی همان Case")}<div class="compact-list">${memory.outcomes.map((item) => `<div><span>${icon("check", { size: 17 })}</span><p><strong>${escapeHtml(item.reason)}</strong><small>${item.outcomeId} · ${escapeHtml(item.recordedAt)}</small></p>${status(item.resultStatus)}</div>`).join("") || "<p>Outcome نمونه‌ای برای این حساب ثبت نشده است.</p>"}</div></section>
    </div>
  </div>`;
}

export function renderCrmPage() {
  const state = getOperationalState();
  const context = readRouteContext();
  const selectedId = context.account ?? state.accounts[0]?.accountId;
  const content = `<div class="crm-layout"><aside class="account-directory">
    <header><div><h1>مشتریان</h1><small>${state.accounts.length.toLocaleString("fa-IR")} حساب مصنوعی</small></div>${status("Demo/Synthetic", "اطلاعات دمو")}</header>
    <label class="ops-search">${icon("search", { size: 17 })}<input id="account-search" type="search" placeholder="جست‌وجوی حساب یا شناسه…" aria-label="جست‌وجوی حساب" /></label>
    <label class="select-control"><span>وضعیت</span><select id="account-status-filter"><option value="all">همه</option><option value="Active">Active</option><option value="Prospect">Prospect</option><option value="Dormant">Dormant</option></select></label>
    <div id="account-list" class="account-list">${accountListRows(state.accounts, selectedId)}</div><p id="account-list-status" class="list-status" aria-live="polite">${state.accounts.length.toLocaleString("fa-IR")} حساب نمایش داده شد</p>
  </aside><main class="account-detail-region"><div class="crm-topline"><span>Account 360 / مشتریان</span>${demoNotice()}</div>${accountDetail(selectedId, context.case)}</main></div>`;
  return appShell({ content, activePath: "/crm", title: "مشتریان / Account 360" });
}

/** @param {(() => void)} [rerender] */
export function mountCrmPage(rerender) {
  const list = document.querySelector("#account-list");
  const search = document.querySelector("#account-search");
  const filter = document.querySelector("#account-status-filter");
  const output = document.querySelector("#account-list-status");
  document.querySelector("[data-log-followup]")?.addEventListener("click", (event) => {
    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;
    logFollowup({ accountId: button.dataset.accountId ?? "", caseId: button.dataset.caseId || null, owner: "مهدی احمدی" });
    rerender?.();
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
}

/** @param {Array<Record<string, any>>} opportunities @param {string} [selectedId] */
function pipelineColumns(opportunities, selectedId) {
  const stages = ["Identified", "Qualified", "Proposal", "On Hold"];
  return `<div class="pipeline-board">${stages.map((stage) => `<section data-stage-column="${stage}"><header><h3>${stage}</h3><span>${opportunities.filter((item) => item.stage === stage).length.toLocaleString("fa-IR")}</span></header>${opportunities.filter((item) => item.stage === stage).map((item) => `<article ${item.opportunityId === selectedId ? 'aria-current="true"' : ""}><a data-link class="entity-link" href="${escapeHtml(entityHref({ type: "opportunity", opportunityId: item.opportunityId, accountId: item.accountId }))}"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.account)}</small><p>${escapeHtml(item.nextAction)}</p><footer><span>${escapeHtml(item.owner)}</span><code>${item.opportunityId}</code></footer></a></article>`).join("")}</section>`).join("")}</div>`;
}

export function renderSalesPage() {
  const state = getOperationalState();
  const context = readRouteContext();
  const selectedOpportunity = state.opportunities.find((item) => item.opportunityId === context.opportunity) ?? (context.opportunity ? null : state.opportunities[0]);
  const selectedLead = state.leads.find((item) => item.leadId === context.lead) ?? state.leads.find((item) => item.accountId === selectedOpportunity?.accountId) ?? state.leads[0];
  const leadRows = state.leads.map((item) => `<tr data-lead-status="${item.status}"><td><a data-link class="entity-link" href="${escapeHtml(entityHref({ type: "lead", leadId: item.leadId, accountId: item.accountId }))}"><code>${item.leadId}</code></a></td><td><a data-link class="entity-link" href="${escapeHtml(entityHref({ type: "lead", leadId: item.leadId, accountId: item.accountId }))}"><strong>${escapeHtml(item.account)}</strong><small>${escapeHtml(item.qualificationReason)}</small></a></td><td>${escapeHtml(item.sourceChannel)}</td><td>${status(item.status)}</td><td>${escapeHtml(item.owner)}</td><td>${escapeHtml(item.receivedAt)}</td></tr>`).join("");
  const selectedContext = selectedOpportunity ? contextHeader({ eyebrow: "Opportunity / next action", id: selectedOpportunity.opportunityId, title: selectedOpportunity.title, statusValue: selectedOpportunity.stage, owner: selectedOpportunity.owner, nextAction: selectedOpportunity.nextAction, links: `<a data-link href="${escapeHtml(entityHref({ type: "account", accountId: selectedOpportunity.accountId }))}">Account 360</a>${state.cases.find((item) => item.accountId === selectedOpportunity.accountId) ? `<a data-link href="${escapeHtml(entityHref({ type: "case", ...state.cases.find((item) => item.accountId === selectedOpportunity.accountId) }))}">Case مرتبط</a>` : ""}` }) : missingEntity("Opportunity", context.opportunity ?? "—", "/sales");
  const content = `${pageHeader("فروش", "سرنخ، فرصت و پیگیری با حفظ source attribution و تحویل روشن به انسان در درخواست‌های B2B پیچیده.", `<a data-link class="button button--secondary" href="${escapeHtml(entityHref({ type: "account", accountId: selectedOpportunity?.accountId ?? context.account }))}">Account 360</a>${selectedLead && selectedLead.status !== "Qualified" ? `<button class="button button--secondary" type="button" data-qualify-lead="${selectedLead.leadId}">تأیید qualification محلی</button>` : ""}<button class="button button--primary" type="button" id="sales-handoff" data-opportunity-id="${selectedOpportunity?.opportunityId ?? ""}" data-account-id="${selectedOpportunity?.accountId ?? context.account ?? ""}">تحویل انسانی ${icon("users", { size: 16 })}</button>`)}${demoNotice()}
    ${selectedContext}
    <div class="ops-tabs" role="tablist"><button type="button" role="tab" aria-selected="true" data-sales-tab="pipeline">Pipeline</button><button type="button" role="tab" aria-selected="false" data-sales-tab="leads">سرنخ‌ها</button><button type="button" role="tab" aria-selected="false" data-sales-tab="followups">پیگیری‌ها</button><span id="sales-feedback" aria-live="polite"></span></div>
    <section data-sales-panel="pipeline" class="sales-panel">${panelHeader("مسیر فرصت‌های نمونه", "هیچ مبلغ یا probability بدون evidence نمایش داده نمی‌شود")} ${pipelineColumns(state.opportunities, selectedOpportunity?.opportunityId)}</section>
    <section data-sales-panel="leads" class="sales-panel" hidden>${panelHeader("سرنخ‌ها و منبع ورود", "source attribution در qualification حفظ می‌شود", `<label class="select-control select-control--inline"><span>وضعیت</span><select id="lead-filter"><option value="all">همه</option><option value="New">New</option><option value="Reviewing">Reviewing</option><option value="Qualified">Qualified</option></select></label>`)}<div class="table-wrap"><table class="ops-table"><thead><tr><th>شناسه</th><th>حساب کاندید</th><th>منبع</th><th>وضعیت</th><th>مالک</th><th>ورود</th></tr></thead><tbody>${leadRows}</tbody></table></div></section>
    <section data-sales-panel="followups" class="sales-panel" hidden>${panelHeader("صف پیگیری", "هر اقدام بحرانی مالک و وضعیت دارد")}<div class="table-wrap"><table class="ops-table"><thead><tr><th>موضوع</th><th>مالک</th><th>موعد</th><th>وضعیت</th><th>اولویت</th></tr></thead><tbody>${taskRows(state.tasks)}</tbody></table></div></section>`;
  return appShell({ content, activePath: "/sales", title: "فروش" });
}

/** @param {(() => void)} [rerender] */
export function mountSalesPage(rerender) {
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
  document.querySelector("#sales-handoff")?.addEventListener("click", (event) => {
    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;
    createHandoffTask({ opportunityId: button.dataset.opportunityId, accountId: button.dataset.accountId });
    rerender?.();
  });
  document.querySelector("[data-qualify-lead]")?.addEventListener("click", (event) => {
    const button = event.currentTarget;
    if (button instanceof HTMLElement && button.dataset.qualifyLead) {
      qualifyLead({ leadId: button.dataset.qualifyLead });
      rerender?.();
    }
  });
}

/** @param {Array<Record<string, any>>} services @param {string} [selectedId] */
function capabilityRows(services, selectedId) {
  return services.map((item) => `<a data-link href="${escapeHtml(entityHref({ type: "service", serviceId: item.serviceId }))}" class="capability-row" data-service-id="${item.serviceId}" aria-current="${item.serviceId === selectedId ? "true" : "false"}"><span>${icon("api", { size: 18 })}</span><p><strong>${escapeHtml(item.name)}</strong><small>${item.serviceId} · ${escapeHtml(item.category)}</small></p>${status(item.publicStatus)}</a>`).join("");
}

/** @param {ReturnType<typeof getOperationalState>} state @param {string} serviceId @param {string} [selectedCaseId] */
function capabilityDetail(state, serviceId, selectedCaseId) {
  const service = state.services.find((item) => item.serviceId === serviceId);
  if (!service) return missingEntity("ServiceCapability", serviceId, "/services");
  const cases = state.cases.filter((item) => item.serviceId === service.serviceId);
  const selectedCase = selectedCaseId ? cases.find((item) => item.caseId === selectedCaseId) : null;
  const selectedApproval = selectedCase
    ? state.approvals.find((item) => item.approvalId === selectedCase.approvalId || item.caseId === selectedCase.caseId)
    : null;
  const invalidCase = selectedCaseId && !selectedCase;
  return `<div class="capability-detail"><header><div><small>${service.serviceId}</small><h2>${escapeHtml(service.name)}</h2><p>${escapeHtml(service.category)} · ${escapeHtml(service.environmentStatus)}</p></div>${status(service.publicStatus)}</header>
    <div class="claim-boundary"><span>${icon("shield", { size: 19 })}</span><div><strong>مرز evidence و eligibility</strong><p>وضعیت «${escapeHtml(service.eligibilityStatus)}» فقط fixture نمایشی است و به معنی دسترسی رسمی، اتصال زنده یا مجوز قانونی نیست.</p></div></div>
    <dl class="definition-grid"><div><dt>Eligibility</dt><dd>${escapeHtml(service.eligibilityStatus)}</dd></div><div><dt>محیط</dt><dd>${escapeHtml(service.environmentStatus)}</dd></div><div><dt>Risk</dt><dd>${escapeHtml(service.riskClass)}</dd></div><div><dt>مالک</dt><dd>${escapeHtml(service.owner)}</dd></div><div><dt>Evidence ref</dt><dd><code>${escapeHtml(service.evidenceRef)}</code></dd></div></dl>
    ${invalidCase ? missingEntity("Case", selectedCaseId, entityHref({ type: "service", serviceId: service.serviceId })) : selectedCase ? contextHeader({ eyebrow: "Case / Service context", id: selectedCase.caseId, title: selectedCase.purpose, statusValue: selectedCase.status, owner: selectedCase.owner, nextAction: selectedCase.nextAction, links: `<a data-link href="${escapeHtml(entityHref({ type: "account", accountId: selectedCase.accountId }))}">Account 360</a><a data-link href="${escapeHtml(routeWithContext("/automation", { case: selectedCase.caseId }))}">Automation</a><a data-link href="${escapeHtml(routeWithContext("/governance", { case: selectedCase.caseId }))}">Audit</a>` }) : ""}
    ${selectedCase && selectedApproval && !["Approved", "Rejected"].includes(selectedApproval.status) ? `<div class="case-actions" aria-label="Gate انسانی"><button type="button" class="button button--primary" data-case-decision="Approved" data-case-id="${selectedCase.caseId}">تأیید انسانی</button><button type="button" class="button button--secondary" data-case-decision="Rejected" data-case-id="${selectedCase.caseId}">رد و بازبینی</button><span>هیچ اجرا یا provider واقعی فراخوانی نمی‌شود.</span></div>` : ""}
    ${panelHeader("درخواست‌های مرتبط", "Approval / execution / stale / error states")}<div class="table-wrap"><table class="ops-table"><thead><tr><th>Case</th><th>حساب</th><th>وضعیت</th><th>Approval</th><th>Action/Outcome</th></tr></thead><tbody>${cases.map((item) => {
      const approval = state.approvals.find((candidate) => candidate.approvalId === item.approvalId || candidate.caseId === item.caseId);
      const action = state.actions.find((candidate) => candidate.actionId === item.actionId || candidate.caseId === item.caseId);
      return `<tr><td><a data-link class="entity-link" href="${escapeHtml(entityHref({ type: "case", caseId: item.caseId, serviceId: item.serviceId }))}"><code>${item.caseId}</code></a></td><td><a data-link class="entity-link" href="${escapeHtml(entityHref({ type: "account", accountId: item.accountId }))}">${escapeHtml(item.account)}</a></td><td>${status(item.status)}</td><td>${approval ? status(approval.status) : "Evidence required"}</td><td>${action ? `${escapeHtml(action.executionMode)} · ${status(action.status)}` : "TBD"}</td></tr>`;
    }).join("") || '<tr><td colspan="5">درخواست نمونه‌ای برای این capability ثبت نشده است.</td></tr>'}</tbody></table></div></div>`;
}

export function renderServicesPage() {
  const state = getOperationalState();
  const context = readRouteContext();
  const selectedServiceId = context.service ?? state.cases.find((item) => item.caseId === context.case)?.serviceId ?? state.services[0]?.serviceId;
  const content = `${pageHeader("سرویس‌ها و APIها", "کاتالوگ capability و وضعیت درخواست با مرز روشن evidence، approval و اجرای Sandbox.", `<a data-link class="button button--primary" href="/cases/new">درخواست سرویس / ساخت Case ${icon("arrow", { size: 16 })}</a>`)}${demoNotice()}<div class="service-workspace"><aside class="capability-list">${panelHeader("کاتالوگ قابلیت", "وضعیت‌های claim-safe")}<label class="ops-search">${icon("search", { size: 17 })}<input id="service-search" type="search" placeholder="جست‌وجوی capability…" /></label><div id="capability-list">${capabilityRows(state.services, selectedServiceId)}</div></aside><main id="capability-detail">${capabilityDetail(state, selectedServiceId, context.case)}</main></div><p id="service-feedback" class="interaction-feedback" aria-live="polite"></p>`;
  return appShell({ content, activePath: "/services", title: "سرویس‌ها و APIها" });
}

/** @param {(() => void)} [rerender] */
export function mountServicesPage(rerender) {
  const list = document.querySelector("#capability-list");
  document.querySelector("#service-search")?.addEventListener("input", (event) => {
    const needle = event.target instanceof HTMLInputElement ? event.target.value.toLocaleLowerCase("fa") : "";
    list?.querySelectorAll("[data-service-id]").forEach((row) => row.toggleAttribute("hidden", !row.textContent?.toLocaleLowerCase("fa").includes(needle)));
  });
  document.querySelectorAll("[data-case-decision]").forEach((button) => button.addEventListener("click", () => {
    if (!(button instanceof HTMLElement) || !button.dataset.caseId) return;
    approveOrReject({ caseId: button.dataset.caseId, decision: button.dataset.caseDecision === "Rejected" ? "Rejected" : "Approved" });
    rerender?.();
  }));
}

/** @param {Array<Record<string, any>>} runs */
function runRows(runs) {
  return runs.map((item) => `<tr data-run-state="${item.state}"><td><strong>${escapeHtml(item.workflow)}</strong><small>${item.workflowId}</small></td><td><a data-link class="entity-link" href="${escapeHtml(entityHref({ type: "run", runId: item.runId, caseId: item.caseId }))}"><code>${item.runId}</code></a></td><td><a data-link class="entity-link" href="${escapeHtml(entityHref({ type: "case", caseId: item.caseId }))}"><code>${item.caseId}</code></a></td><td>${escapeHtml(item.approval)}</td><td>${status(item.state)}</td><td>${escapeHtml(item.startedAt)}</td><td><a data-link class="entity-link" href="${escapeHtml(routeWithContext("/governance", { case: item.caseId }))}"><code>${escapeHtml(item.receipt)}</code></a></td><td>${item.state === "failed" ? `<button type="button" class="text-button" data-retry-run="${item.runId}">تلاش مجدد محدود</button>` : escapeHtml(item.retry)}</td></tr>`).join("");
}

export function renderAutomationPage() {
  const state = getOperationalState();
  const context = readRouteContext();
  const selectedRun = state.runs.find((item) => item.runId === context.run);
  const selectedCaseId = context.case ?? selectedRun?.caseId;
  const selected = selectedCaseId ? caseContext(selectedCaseId) : null;
  const invalid = Boolean(selectedCaseId && !selected);
  const contextMarkup = invalid ? missingEntity("Case", selectedCaseId, "/automation") : selected ? `${contextHeader({ eyebrow: "Approval / Action / Receipt", id: selected.case.caseId, title: selected.case.purpose, statusValue: selected.case.status, owner: selected.case.owner, nextAction: selected.case.nextAction, links: `<a data-link href="${escapeHtml(entityHref({ type: "account", accountId: selected.case.accountId }))}">Account</a><a data-link href="${escapeHtml(entityHref({ type: "case", caseId: selected.case.caseId, serviceId: selected.case.serviceId }))}">Service</a><a data-link href="${escapeHtml(routeWithContext("/governance", { case: selected.case.caseId }))}">Audit / Receipt</a>` })}<div class="case-actions">${selected.approval?.status !== "Approved" ? `<button type="button" class="button button--secondary" data-automation-approve="${selected.case.caseId}">تأیید انسانی</button>` : ""}${selected.approval?.status === "Approved" && !selected.runs.some((item) => item.state === "succeeded") ? `<button type="button" class="button button--primary" data-start-run="${selected.case.caseId}">اجرای محدود محلی</button>` : ""}<span>هیچ API یا side-effect خارجی اجرا نمی‌شود.</span></div>` : "";
  const content = `${pageHeader("اتوماسیون", "Workflowهای deterministic و bounded؛ هر اقدام حساس به انسان تحویل می‌شود و receipt قابل مشاهده دارد.", `<a data-link class="button button--secondary" href="${escapeHtml(routeWithContext("/governance", { case: selectedCaseId }))}">مشاهده ممیزی</a>`)}${demoNotice()}
    ${contextMarkup}
    <section class="ops-panel">${panelHeader("کاندیداهای Workflow", "Trigger / context / risk / approval / handoff")}<div class="workflow-strip">${state.workflows.map((item) => `<article><span>${icon("workflow", { size: 20 })}</span><div><strong>${escapeHtml(item.name)}</strong><small>${item.workflowId} · ${escapeHtml(item.trigger)}</small><p>${escapeHtml(item.context)}</p></div><dl><div><dt>Risk</dt><dd>${escapeHtml(item.risk)}</dd></div><div><dt>Approval</dt><dd>${escapeHtml(item.approval)}</dd></div><div><dt>Handoff</dt><dd>${escapeHtml(item.humanHandoff)}</dd></div></dl>${status(item.status)}</article>`).join("")}</div></section>
    <section class="ops-panel">${panelHeader("Runها و receiptها", "queued / running / succeeded / failed / canceled / demo", `<label class="select-control select-control--inline"><span>Run state</span><select id="run-filter"><option value="all">همه</option>${["queued", "running", "succeeded", "failed", "canceled"].map((value) => `<option value="${value}">${value}</option>`).join("")}</select></label>`)}<div class="table-wrap"><table class="ops-table"><thead><tr><th>Workflow</th><th>Run</th><th>Case</th><th>Approval</th><th>State</th><th>شروع</th><th>Receipt</th><th>Retry</th></tr></thead><tbody id="run-rows">${runRows(state.runs)}</tbody></table></div><p id="run-feedback" class="interaction-feedback" aria-live="polite"></p></section>
    <aside class="human-gate-note">${icon("shield", { size: 20 })}<div><strong>Gate انسانی تغییرناپذیر</strong><p>قیمت‌گذاری استثنایی، تعهد قراردادی/SLA، دسترسی داده حساس، ارسال گروهی و فعال‌سازی پرریسک در این UI هرگز خودکار اجرا نمی‌شوند.</p></div></aside>`;
  return appShell({ content, activePath: "/automation", title: "اتوماسیون" });
}

/** @param {(() => void)} [rerender] */
export function mountAutomationPage(rerender) {
  document.querySelector("#run-filter")?.addEventListener("change", (event) => {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : "all";
    document.querySelectorAll("[data-run-state]").forEach((row) => row.toggleAttribute("hidden", value !== "all" && row.getAttribute("data-run-state") !== value));
  });
  document.querySelector("#run-rows")?.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("[data-retry-run]") : null;
    if (!(button instanceof HTMLButtonElement)) return;
    startOrRetryRun({ runId: button.dataset.retryRun, mode: "retry" });
    rerender?.();
  });
  document.querySelector("[data-automation-approve]")?.addEventListener("click", (event) => {
    const button = event.currentTarget;
    if (button instanceof HTMLElement && button.dataset.automationApprove) {
      approveOrReject({ caseId: button.dataset.automationApprove, decision: "Approved" });
      rerender?.();
    }
  });
  document.querySelector("[data-start-run]")?.addEventListener("click", (event) => {
    const button = event.currentTarget;
    if (button instanceof HTMLElement && button.dataset.startRun) {
      startOrRetryRun({ caseId: button.dataset.startRun });
      rerender?.();
    }
  });
}

/** @param {Array<Record<string, any>>} issues */
function qualityRows(issues) {
  return issues.map((item) => {
    const next = item.state === "Open" ? "Reviewing" : item.state === "Reviewing" || item.state === "Blocked" ? "Resolved" : "Open";
    const targetType = item.entity === "Account" ? "account" : item.entity === "Lead" ? "lead" : item.entity === "ServiceCapability" ? "service" : "audit";
    return `<tr data-issue-state="${item.state}" data-issue-type="${item.type}"><td>${status(item.state)}</td><td><a data-link class="entity-link" href="${escapeHtml(entityHref({ type: "audit", issueId: item.issueId }))}"><strong>${escapeHtml(item.summary)}</strong><small>${item.issueId}</small></a></td><td>${escapeHtml(item.type)}</td><td><a data-link class="entity-link" href="${escapeHtml(entityHref({ type: targetType, id: item.reference, accountId: item.reference, leadId: item.reference, serviceId: item.reference }))}">${escapeHtml(item.entity)} · <code>${escapeHtml(item.reference)}</code></a></td><td>${escapeHtml(item.owner)}</td><td>${escapeHtml(item.detectedAt)}</td><td>${escapeHtml(item.severity)}<button type="button" class="text-button" data-issue-id="${item.issueId}" data-issue-next="${next}">${next}</button></td></tr>`;
  }).join("");
}

export function renderGovernancePage() {
  const state = getOperationalState();
  const context = readRouteContext();
  const selected = context.case ? caseContext(context.case) : null;
  const selectedIssue = context.issue ? state.dataQuality.find((item) => item.issueId === context.issue) : null;
  const contextMarkup = context.case && !selected ? missingEntity("Case", context.case, "/governance") : selected ? `${contextHeader({ eyebrow: "Audit / Receipt", id: selected.case.caseId, title: selected.case.purpose, statusValue: selected.case.status, owner: selected.case.owner, nextAction: selected.case.nextAction, links: `<a data-link href="${escapeHtml(entityHref({ type: "account", accountId: selected.case.accountId }))}">Account</a><a data-link href="${escapeHtml(entityHref({ type: "case", caseId: selected.case.caseId, serviceId: selected.case.serviceId }))}">Service</a><a data-link href="${escapeHtml(routeWithContext("/automation", { case: selected.case.caseId }))}">Run</a>` })}${selected.runs.some((item) => item.state === "succeeded") && !selected.outcome ? `<div class="case-actions"><button type="button" class="button button--primary" data-record-outcome="${selected.case.caseId}">ثبت Outcome محلی</button><span>نتیجه روی همین Case و Account ثبت می‌شود.</span></div>` : ""}` : "";
  const issueState = context.issue && !selectedIssue ? missingEntity("Data Quality issue", context.issue, "/governance") : "";
  const content = `${pageHeader("ممیزی و کیفیت داده", "actor، source، time و state change برای بازسازی مسیر Case؛ بدون نمایش payload حساس.", "")}${demoNotice()}
    ${contextMarkup}${issueState}
    <section class="governance-summary"><article><span>${icon("audit", { size: 22 })}</span><div><small>رخداد ممیزی نمونه</small><strong>${state.auditEvents.length.toLocaleString("fa-IR")}</strong></div></article><article><span>${icon("database", { size: 22 })}</span><div><small>Issue باز/بررسی</small><strong>${state.dataQuality.filter((item) => item.state !== "Resolved").length.toLocaleString("fa-IR")}</strong></div></article><article><span>${icon("shield", { size: 22 })}</span><div><small>Approval باز/منقضی</small><strong>${state.approvals.filter((item) => item.status !== "Approved").length.toLocaleString("fa-IR")}</strong></div></article></section>
    <section class="ops-panel">${panelHeader("هشدارهای کیفیت داده", "چرخه محلی Open → Reviewing → Resolved", `<label class="select-control select-control--inline"><span>وضعیت issue</span><select id="issue-filter"><option value="all">همه</option><option value="Open">Open</option><option value="Reviewing">Reviewing</option><option value="Blocked">Blocked</option><option value="Resolved">Resolved</option></select></label>`)}<div class="table-wrap"><table class="ops-table"><thead><tr><th>وضعیت</th><th>موضوع</th><th>نوع</th><th>موجودیت</th><th>مالک</th><th>کشف</th><th>شدت / اقدام</th></tr></thead><tbody>${qualityRows(state.dataQuality)}</tbody></table></div></section>
    <section class="ops-panel">${panelHeader("بازسازی Timeline پرونده", "Case → actor / source / change / state", `<label class="select-control select-control--inline"><span>Case</span><select id="audit-case-filter"><option value="all">همه Caseها</option>${state.cases.map((item) => `<option value="${item.caseId}" ${item.caseId === context.case ? "selected" : ""}>${item.caseId}</option>`).join("")}</select></label>`)}<div class="table-wrap"><table class="ops-table"><thead><tr><th>زمان</th><th>Actor</th><th>رخداد</th><th>Source</th><th>State change</th><th>Case / entity</th></tr></thead><tbody id="audit-rows">${auditRows(state.auditEvents)}</tbody></table></div><p id="audit-feedback" class="interaction-feedback" aria-live="polite">${state.auditEvents.length.toLocaleString("fa-IR")} رخداد مصنوعی؛ payload حساس عمداً نمایش داده نشده است.</p></section>`;
  return appShell({ content, activePath: "/governance", title: "ممیزی و کیفیت داده" });
}

/** @param {(() => void)} [rerender] */
export function mountGovernancePage(rerender) {
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
  document.querySelectorAll("[data-issue-id]").forEach((button) => button.addEventListener("click", () => {
    if (button instanceof HTMLElement && button.dataset.issueId && button.dataset.issueNext) {
      updateDataQualityIssue({ issueId: button.dataset.issueId, state: button.dataset.issueNext });
      rerender?.();
    }
  }));
  document.querySelector("[data-record-outcome]")?.addEventListener("click", (event) => {
    const button = event.currentTarget;
    if (button instanceof HTMLElement && button.dataset.recordOutcome) {
      recordOutcome({ caseId: button.dataset.recordOutcome });
      rerender?.();
    }
  });
}

/** @param {string} caseId */
/** @param {ReturnType<typeof getOperationalState>} state @param {string} caseId */
function thinkRoomCase(state, caseId) {
  const selectedCase = state.cases.find((item) => item.caseId === caseId);
  if (!selectedCase) return missingEntity("Case", caseId, "/think-room");
  const approval = state.approvals.find((item) => item.approvalId === selectedCase.approvalId || item.caseId === selectedCase.caseId);
  const action = state.actions.find((item) => item.actionId === selectedCase.actionId || item.caseId === selectedCase.caseId);
  const outcome = state.outcomes.find((item) => item.outcomeId === selectedCase.outcomeId || item.caseId === selectedCase.caseId);
  return `<div class="future-case">${contextHeader({ eyebrow: "Read-only future context", id: selectedCase.caseId, title: selectedCase.purpose, statusValue: selectedCase.status, owner: selectedCase.owner, nextAction: selectedCase.nextAction, links: `<a data-link href="${escapeHtml(entityHref({ type: "account", accountId: selectedCase.accountId }))}">Account</a><a data-link href="${escapeHtml(entityHref({ type: "case", caseId: selectedCase.caseId, serviceId: selectedCase.serviceId }))}">باز کردن Case عملیاتی</a>` })}${continuationRail("Outcome")}<div class="future-records"><article><small>Context / Evidence</small><strong>منبع: ${escapeHtml(selectedCase.sourceChannel)}</strong><p>کمبودها و evidence باید از رکوردهای موجود خوانده شوند؛ این fixture ادعای RAG زنده ندارد.</p></article><article><small>Decision / Approval</small><strong>${approval ? `${approval.approvalId} · ${approval.status}` : "هنوز ثبت نشده"}</strong><p>تصمیم انسانی روی همین Case ثبت می‌شود؛ AI شرط ثبت Decision نیست.</p></article><article><small>Action</small><strong>${action ? `${action.actionId} · ${action.status}` : "اقدام آماده نشده"}</strong><p>هر اقدام حساس Gate انسانی و eligibility معتبر می‌خواهد.</p></article><article><small>Outcome</small><strong>${outcome ? outcome.outcomeId : "در انتظار نتیجه"}</strong><p>${outcome ? escapeHtml(outcome.reason) : "Outcome بعداً به همین حافظه تجاری بازمی‌گردد."}</p></article></div></div>`;
}

export function renderThinkRoomPage() {
  const state = getOperationalState();
  const context = readRouteContext();
  const selectedCaseId = context.case ?? state.cases[0]?.caseId;
  const content = `${pageHeader("اتاق فکر", "لایه هوشمندی آینده روی همان Account / Case / Decision / Action / Outcome؛ نه CRM دوم و نه وابستگی فاز اول.", `${status("Under Review", "آینده / غیرفعال در فاز ۱")}`)}${demoNotice()}
    <aside class="future-boundary">${icon("spark", { size: 24 })}<div><strong>Future intelligence — Not required for Phase 1</strong><p>هیچ مدل، confidence، RAG یا تصمیم خودکار در این نسخه live نیست. خاموش‌کردن این route هیچ workflow عملیاتی را نمی‌شکند.</p></div></aside>
    <div class="think-room-layout"><aside>${panelHeader("پرونده مشترک", "انتخاب Case برای دیدن پیوستگی")}<label class="select-control"><span>Case نمونه</span><select id="think-case-select">${state.cases.map((item) => `<option value="${item.caseId}" ${item.caseId === selectedCaseId ? "selected" : ""}>${item.caseId} — ${escapeHtml(item.account)}</option>`).join("")}</select></label><ol class="future-capabilities"><li><strong>Context + Evidence</strong><span>آینده؛ source/freshness-aware</span></li><li><strong>Options + Recommendation</strong><span>آینده؛ فقط با evidence</span></li><li><strong>Human Decision</strong><span>همیشه ثبت‌شده و قابل ممیزی</span></li><li><strong>Outcome learning</strong><span>روی همان حافظه تجاری</span></li></ol></aside><main id="think-room-case">${thinkRoomCase(state, selectedCaseId)}</main></div>`;
  return appShell({ content, activePath: "/think-room", title: "اتاق فکر — آینده" });
}

export function mountThinkRoomPage() {
  document.querySelector("#think-case-select")?.addEventListener("change", (event) => {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : "";
    requestNavigation(routeWithContext("/think-room", { case: value }));
  });
}
