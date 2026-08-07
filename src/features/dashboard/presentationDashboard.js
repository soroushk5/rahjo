import { appShell } from "../../app/appShell.js";
import { icon } from "../../components/icons.js";
import { dataClusters, controlLayers } from "../../data/siteContent.js";
import { verificationServices } from "../../data/demoData.js";
import {
  demoAuditEvents,
  demoOverviewMetrics,
  demoPolicyChecks,
  demoPortfolio,
  demoSeedRequests,
  demoTrend,
  demoWorkspace
} from "../../data/presentationData.js";
import { listPrototypeAccessRequests, setPreferredClusterId } from "../../services/prototypeStore.js";
import { escapeHtml } from "../../lib/html.js";

/** @param {string} serviceId */
function serviceTitle(serviceId) {
  return verificationServices.find((service) => service.id === serviceId)?.title ?? serviceId;
}

/** @param {string} value */
function statusTone(value) {
  if (["قابل پایلوت", "فعال", "اعمال‌شده در دمو", "آماده Sandbox", "پایلوت"].includes(value)) return "positive";
  if (["بررسی حقوقی", "در بررسی", "نیازمند مدرک", "نیازمند تکمیل", "مشروط"].includes(value)) return "warning";
  if (["مسدود", "نامشخص"].includes(value)) return "blocked";
  return "neutral";
}

function allRequests() {
  const browserRequests = listPrototypeAccessRequests();
  const seen = new Set(browserRequests.map((item) => item.referenceId));
  return [...browserRequests, ...demoSeedRequests.filter((item) => !seen.has(item.referenceId))].slice(0, 30);
}

function metricCards() {
  return demoOverviewMetrics.map((metric) => `
    <article class="dash-kpi dash-kpi--${metric.tone}">
      <span class="dash-kpi__icon">${icon(metric.icon, { size: 21 })}</span>
      <div><small>${metric.label}</small><strong>${metric.value}</strong><p>${metric.note}</p></div>
    </article>`).join("");
}

function trendChart() {
  const values = demoTrend.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const coordinates = demoTrend.map((point, index) => {
    const x = 6 + (index / (demoTrend.length - 1)) * 88;
    const y = 82 - ((point.value - min) / Math.max(1, max - min)) * 62;
    return { ...point, x, y };
  });
  const path = coordinates.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const area = `${path} L94,88 L6,88 Z`;

  return `
    <div class="trend-chart" aria-label="نمودار نمایشی حجم درخواست‌ها">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img">
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="currentColor" stop-opacity=".28" />
            <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
          </linearGradient>
        </defs>
        <path class="trend-area" d="${area}" />
        <path class="trend-line" d="${path}" />
        ${coordinates.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="1.5" />`).join("")}
      </svg>
      <div class="trend-chart__axis">${demoTrend.map((point) => `<span>${point.label}</span>`).join("")}</div>
    </div>`;
}

function readinessSummary() {
  return demoPortfolio.map((row) => `
    <div class="readiness-summary-row">
      <div><strong>${row.cluster}</strong><small>${row.sensitivity}</small></div>
      <div class="readiness-progress"><span style="--progress:${row.progress}%"></span></div>
      <span class="status-chip status-chip--${statusTone(row.launch)}">${row.launch}</span>
    </div>`).join("");
}

function recentRequestList(limit = 5) {
  return allRequests().slice(0, limit).map((request) => `
    <a data-link class="request-mini-row" href="/dashboard/requests" data-reference="${escapeHtml(request.referenceId)}">
      <span class="request-mini-row__icon">${icon(verificationServices.find((item) => item.id === request.serviceId)?.icon ?? "database", { size: 18 })}</span>
      <div><strong>${serviceTitle(request.serviceId)}</strong><small>${escapeHtml(request.organization)}</small></div>
      <span class="status-chip status-chip--${statusTone(request.status)}">${request.status}</span>
      <code>${request.referenceId}</code>
    </a>`).join("");
}

function auditMiniList() {
  return demoAuditEvents.slice(0, 4).map((event) => `
    <div class="audit-mini-row">
      <span class="audit-mini-row__icon">${icon(event.icon, { size: 17 })}</span>
      <div><strong>${event.title}</strong><small>${event.actor} · ${event.time}</small></div>
      <i class="audit-tone audit-tone--${event.tone}"></i>
    </div>`).join("");
}

export function renderDashboardOverviewPage() {
  const content = `
    <section class="dash-heading">
      <div>
        <div class="dash-heading__meta"><span class="workspace-dot"></span>${demoWorkspace.organization}<span>/</span>${demoWorkspace.environment}</div>
        <h1>نمای کلی کنسول داده</h1>
        <p>یک تصویر نمایشی از وضعیت سبد، Gate دسترسی و جریان درخواست‌ها برای ارائه محصول.</p>
      </div>
      <div class="dash-heading__actions">
        <a data-link class="button button--secondary" href="/map">نقشه اکوسیستم ${icon("atlas", { size: 17 })}</a>
        <a data-link class="button button--primary" href="/request">درخواست جدید ${icon("arrow", { size: 17 })}</a>
      </div>
    </section>

    <div class="demo-context-bar">${icon("shield", { size: 17 })}<span>${demoWorkspace.disclaimer}</span></div>

    <section class="dash-kpi-grid">${metricCards()}</section>

    <section class="dash-layout dash-layout--hero">
      <article class="dash-panel dash-panel--trend">
        <header class="dash-panel__head">
          <div><small>REQUEST FLOW · DEMO</small><h2>حجم درخواست‌های نمایشی</h2></div>
          <span class="demo-badge">۸ هفته نمونه</span>
        </header>
        ${trendChart()}
        <footer class="trend-summary">
          <span><b>+۲۹٪</b><small>تغییر نمایشی در بازه</small></span>
          <span><b>۴۸</b><small>بیشترین نقطه نمونه</small></span>
          <span><b>Sandbox</b><small>بدون مصرف واقعی</small></span>
        </footer>
      </article>

      <article class="dash-panel dash-panel--requests">
        <header class="dash-panel__head"><div><small>RECENT REQUESTS</small><h2>آخرین درخواست‌ها</h2></div><a data-link class="text-link" href="/dashboard/requests">مشاهده همه ${icon("arrow")}</a></header>
        <div class="request-mini-list">${recentRequestList()}</div>
      </article>
    </section>

    <section class="dash-layout dash-layout--lower">
      <article class="dash-panel">
        <header class="dash-panel__head"><div><small>PORTFOLIO READINESS</small><h2>آمادگی خوشه‌ها</h2></div><a data-link class="text-link" href="/dashboard/data">نمای کامل ${icon("arrow")}</a></header>
        <div class="readiness-summary">${readinessSummary()}</div>
      </article>

      <article class="dash-panel">
        <header class="dash-panel__head"><div><small>AUDIT SIGNALS</small><h2>رخدادهای اخیر دمو</h2></div><a data-link class="text-link" href="/dashboard/audit">رد ممیزی ${icon("arrow")}</a></header>
        <div class="audit-mini-list">${auditMiniList()}</div>
      </article>
    </section>`;

  return appShell({ content, activePath: "/dashboard", title: "نمای کلی" });
}

function requestTableRows() {
  return allRequests().map((request) => `
    <tr data-present-request data-search="${escapeHtml(`${request.referenceId} ${request.organization} ${serviceTitle(request.serviceId)} ${request.purpose} ${request.status}`.toLocaleLowerCase("fa"))}" data-status="${escapeHtml(request.status)}" data-reference="${escapeHtml(request.referenceId)}" tabindex="0">
      <td><div class="table-primary"><span>${icon(verificationServices.find((item) => item.id === request.serviceId)?.icon ?? "database", { size: 17 })}</span><div><strong>${serviceTitle(request.serviceId)}</strong><small>${escapeHtml(request.organization)}</small></div></div></td>
      <td><code>${request.referenceId}</code></td>
      <td>${escapeHtml(request.purpose)}</td>
      <td><span class="status-chip status-chip--${statusTone(request.status)}">${request.status}</span></td>
      <td>${new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(new Date(request.createdAt))}</td>
    </tr>`).join("");
}

function requestDetail(referenceId) {
  const request = allRequests().find((item) => item.referenceId === referenceId) ?? allRequests()[0];
  if (!request) return `<div class="empty-panel">درخواستی برای نمایش وجود ندارد.</div>`;
  const cluster = dataClusters.find((item) => item.id === request.serviceId);
  return `
    <div class="request-detail-head"><div><small>${request.referenceId}</small><h3>${serviceTitle(request.serviceId)}</h3></div><span class="status-chip status-chip--${statusTone(request.status)}">${request.status}</span></div>
    <dl class="request-detail-grid">
      <div><dt>سازمان</dt><dd>${escapeHtml(request.organization)}</dd></div>
      <div><dt>حساسیت</dt><dd>${cluster?.sensitivity ?? "—"}</dd></div>
      <div><dt>حجم ماهانه</dt><dd>${request.monthlyVolume}</dd></div>
      <div><dt>محیط</dt><dd>Sandbox</dd></div>
      <div class="wide"><dt>کاربرد اعلام‌شده</dt><dd>${escapeHtml(request.purpose)}</dd></div>
    </dl>
    <div class="request-gate-strip"><span>${icon("shield", { size: 18 })}</span><div><strong>Gate دسترسی</strong><small>این رکورد صرفاً دمو است؛ API key و داده واقعی صادر نشده است.</small></div></div>`;
}

export function renderDashboardRequestsPage() {
  const first = allRequests()[0]?.referenceId ?? "";
  const content = `
    <section class="dash-heading"><div><div class="dash-heading__meta">ACCESS REQUESTS / SANDBOX</div><h1>درخواست‌های دسترسی</h1><p>جست‌وجو، مرور و نمایش وضعیت Gate در محیط نمایشی.</p></div><a data-link class="button button--primary" href="/request">درخواست جدید ${icon("arrow")}</a></section>
    <section class="dash-panel request-workspace">
      <div class="request-toolbar">
        <label class="workspace-search">${icon("search", { size: 18 })}<input id="present-request-search" type="search" placeholder="شناسه، سازمان، خوشه یا کاربرد…" /></label>
        <select id="present-request-status" aria-label="فیلتر وضعیت"><option value="all">همه وضعیت‌ها</option><option>در بررسی</option><option>بررسی حقوقی</option><option>نیازمند مدرک</option><option>قابل پایلوت</option></select>
        <span id="present-request-count" class="table-count"></span>
      </div>
      <div class="request-master-detail">
        <div class="table-wrap present-request-table-wrap"><table class="data-table present-request-table"><thead><tr><th>خوشه / سازمان</th><th>شناسه</th><th>کاربرد</th><th>وضعیت</th><th>تاریخ</th></tr></thead><tbody>${requestTableRows()}</tbody></table></div>
        <aside id="present-request-detail" class="request-detail-panel" data-active-reference="${first}">${requestDetail(first)}</aside>
      </div>
    </section>`;
  return appShell({ content, activePath: "/dashboard/requests", title: "درخواست‌ها" });
}

function applyRequestFilters() {
  const queryInput = document.querySelector("#present-request-search");
  const statusSelect = document.querySelector("#present-request-status");
  const query = queryInput instanceof HTMLInputElement ? queryInput.value.trim().toLocaleLowerCase("fa") : "";
  const status = statusSelect instanceof HTMLSelectElement ? statusSelect.value : "all";
  let visible = 0;
  document.querySelectorAll("[data-present-request]").forEach((row) => {
    const matchesQuery = !query || (row.getAttribute("data-search") ?? "").includes(query);
    const matchesStatus = status === "all" || row.getAttribute("data-status") === status;
    const show = matchesQuery && matchesStatus;
    row.toggleAttribute("hidden", !show);
    if (show) visible += 1;
  });
  const count = document.querySelector("#present-request-count");
  if (count instanceof HTMLElement) count.textContent = `${visible} درخواست`;
}

export function mountDashboardRequestsPage() {
  const detail = document.querySelector("#present-request-detail");
  const selectRow = (row) => {
    if (!(row instanceof HTMLElement)) return;
    const reference = row.dataset.reference;
    if (!reference) return;
    document.querySelectorAll("[data-present-request]").forEach((item) => item.setAttribute("aria-selected", String(item === row)));
    if (detail instanceof HTMLElement) {
      detail.dataset.activeReference = reference;
      detail.innerHTML = requestDetail(reference);
    }
  };

  document.querySelectorAll("[data-present-request]").forEach((row, index) => {
    row.setAttribute("aria-selected", String(index === 0));
    row.addEventListener("click", () => selectRow(row));
    row.addEventListener("keydown", (event) => {
      if (event instanceof KeyboardEvent && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        selectRow(row);
      }
    });
  });
  document.querySelector("#present-request-search")?.addEventListener("input", applyRequestFilters);
  document.querySelector("#present-request-status")?.addEventListener("change", applyRequestFilters);
  applyRequestFilters();
}

function portfolioCards() {
  return demoPortfolio.map((row, index) => {
    const cluster = dataClusters[index];
    return `
      <article class="portfolio-card">
        <header><span class="portfolio-card__icon">${icon(cluster?.icon ?? "database", { size: 22 })}</span><div><small>${row.sensitivity}</small><h3>${row.cluster}</h3></div><strong>${row.progress}%</strong></header>
        <div class="portfolio-card__progress"><span style="--progress:${row.progress}%"></span></div>
        <dl>
          <div><dt>منبع</dt><dd>${row.source}</dd></div>
          <div><dt>حق عرضه</dt><dd>${row.rights}</dd></div>
          <div><dt>فنی</dt><dd>${row.technical}</dd></div>
        </dl>
        <footer><span class="status-chip status-chip--${statusTone(row.launch)}">${row.launch}</span><a data-link data-pick-cluster="${cluster?.id ?? ""}" href="/request">بررسی دسترسی ${icon("arrow")}</a></footer>
      </article>`;
  }).join("");
}

export function renderDashboardDataPage() {
  const content = `
    <section class="dash-heading"><div><div class="dash-heading__meta">DATA PORTFOLIO / READINESS</div><h1>سبد و آمادگی داده</h1><p>نمای ارائه‌ای از اینکه هر خوشه در کدام بخش منبع، حقوقی و فنی نیاز به تکمیل دارد.</p></div><div class="dash-heading__actions"><a data-link class="button button--secondary" href="/data">اطلس عمومی</a><a data-link class="button button--primary" href="/map">نقشه جریان ${icon("arrow")}</a></div></section>
    <div class="portfolio-gate"><div>${icon("lock", { size: 24 })}<span><small>Production gate</small><strong>عرضه عمومی بسته است</strong></span></div><p>این وضعیت عمداً در رابط دیده می‌شود تا نسخه نمایشی ادعای اتصال یا مجوز تأییدنشده ایجاد نکند.</p></div>
    <section class="portfolio-card-grid">${portfolioCards()}</section>
    <section class="dash-panel readiness-matrix-panel">
      <header class="dash-panel__head"><div><small>READINESS MATRIX</small><h2>ماتریس تصمیم عرضه</h2></div><span class="demo-badge">Demo model</span></header>
      <div class="readiness-matrix"><div class="readiness-matrix__head"><span>خوشه</span><span>منبع</span><span>حقوقی</span><span>فنی</span><span>عرضه</span></div>${demoPortfolio.map((row) => `<div class="readiness-matrix__row"><strong>${row.cluster}</strong><span>${row.source}</span><span>${row.rights}</span><span>${row.technical}</span><span class="status-chip status-chip--${statusTone(row.launch)}">${row.launch}</span></div>`).join("")}</div>
    </section>`;
  return appShell({ content, activePath: "/dashboard/data", title: "سبد داده" });
}

export function mountDashboardDataPage() {
  document.querySelectorAll("[data-pick-cluster]").forEach((link) => {
    link.addEventListener("click", () => {
      const id = link.getAttribute("data-pick-cluster");
      if (id) setPreferredClusterId(id);
    });
  });
}

function policyCheckCards() {
  return demoPolicyChecks.map((check) => `
    <article class="policy-check-card policy-check-card--${check.tone}">
      <span>${icon(check.tone === "positive" ? "check" : "shield", { size: 20 })}</span>
      <div><small>${check.label}</small><strong>${check.state}</strong><p>${check.note}</p></div>
    </article>`).join("");
}

function controlPipeline() {
  return controlLayers.map((layer, index) => `
    <div class="control-pipeline__step">
      <span>${icon(layer.icon, { size: 20 })}</span>
      <div><small>${layer.number}</small><strong>${layer.label}</strong><p>${layer.artifact}</p></div>
      ${index < controlLayers.length - 1 ? '<i aria-hidden="true"></i>' : ""}
    </div>`).join("");
}

export function renderDashboardAuditPage() {
  const content = `
    <section class="dash-heading"><div><div class="dash-heading__meta">POLICY & AUDIT / DEMO</div><h1>کنترل و رد ممیزی</h1><p>نمایی برای توضیح اینکه تصمیم دسترسی چگونه قابل بازبینی می‌ماند.</p></div><a data-link class="button button--secondary" href="/trust">منطق کنترل دسترسی ${icon("arrow")}</a></section>
    <section class="control-pipeline">${controlPipeline()}</section>
    <section class="policy-check-grid">${policyCheckCards()}</section>
    <section class="dash-layout dash-layout--audit">
      <article class="dash-panel audit-log-panel"><header class="dash-panel__head"><div><small>AUDIT EVENTS</small><h2>رخدادهای نمونه</h2></div><span class="demo-badge">امروز · نمایشی</span></header><div class="audit-timeline">${demoAuditEvents.map((event) => `<div class="audit-event"><time>${event.time}</time><span class="audit-event__icon audit-event__icon--${event.tone}">${icon(event.icon, { size: 18 })}</span><div><strong>${event.title}</strong><p>${event.detail}</p><small>${event.actor} · ${event.id}</small></div></div>`).join("")}</div></article>
      <aside class="dash-panel audit-principles"><header class="dash-panel__head"><div><small>DESIGN PRINCIPLES</small><h2>چه چیزی عمداً ثبت نمی‌شود؟</h2></div></header><ul><li><strong>داده خام اضافی</strong><span>Audit log نباید مخزن ثانویه داده حساس شود.</span></li><li><strong>Credential</strong><span>کلید یا رمز در لاگ نمایشی ذخیره نمی‌شود.</span></li><li><strong>ادعای مجوز</strong><span>تا مدرک موجود نباشد وضعیت «تأییدشده» نمایش داده نمی‌شود.</span></li></ul></aside>
    </section>`;
  return appShell({ content, activePath: "/dashboard/audit", title: "کنترل و ممیزی" });
}
