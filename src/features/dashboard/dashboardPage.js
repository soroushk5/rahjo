import { appShell } from "../../app/appShell.js";
import { icon } from "../../components/icons.js";
import { clusterReadiness, portfolioMetrics, sampleAccessRequests, verificationServices } from "../../data/demoData.js";
import { escapeHtml } from "../../lib/html.js";
import {
  clearPrototypeAccessRequests,
  getDashboardFilters,
  listPrototypeAccessRequests,
  setDashboardFilters
} from "../../services/prototypeStore.js";

/** @param {string} value */
function statusClass(value) {
  if (["قابل پایلوت", "فعال", "قابل طراحی"].includes(value)) return "positive";
  if (["مشروط", "اولیه", "در بررسی", "بررسی حقوقی"].includes(value)) return "warning";
  if (["مسدود", "نیازمند مدرک", "نامشخص", "ناقص"].includes(value)) return "blocked";
  return "neutral";
}

function portfolioCards() {
  const localCount = listPrototypeAccessRequests().length;
  const metrics = [
    ...portfolioMetrics,
    { label: "درخواست‌های این مرورگر", value: String(localCount).padStart(2, "0"), note: "ثبت‌شده در Prototype", icon: "requests" }
  ];

  return metrics
    .map(
      (metric) => `
        <article class="portfolio-kpi">
          <span>${icon(metric.icon, { size: 21 })}</span>
          <small>${metric.label}</small>
          <strong>${metric.value}</strong>
          <em>${metric.note}</em>
        </article>`
    )
    .join("");
}

function readinessRows() {
  return clusterReadiness
    .map(
      (row) => `
        <div class="readiness-row">
          <div class="readiness-row__cluster">
            <strong>${row.cluster}</strong>
            <small>${row.sensitivity}</small>
          </div>
          <span class="readiness-state readiness-state--${statusClass(row.source)}">${row.source}</span>
          <span class="readiness-state readiness-state--${statusClass(row.rights)}">${row.rights}</span>
          <span class="readiness-state readiness-state--${statusClass(row.technical)}">${row.technical}</span>
          <span class="readiness-state readiness-state--${statusClass(row.launch)}">${row.launch}</span>
        </div>`
    )
    .join("");
}

/** @typedef {{id: string, organization: string, cluster: string, purpose: string, status: string, volume: string, createdAt: string, source: "seed" | "local"}} DashboardRequest */

/** @returns {DashboardRequest[]} */
function allAccessRequests() {
  const seed = sampleAccessRequests.map((request) => ({
    ...request,
    volume: "—",
    createdAt: "داده نمونه",
    source: /** @type {const} */ ("seed")
  }));

  const local = listPrototypeAccessRequests().map((request) => ({
    id: request.referenceId,
    organization: request.organization,
    cluster: verificationServices.find((service) => service.id === request.serviceId)?.title ?? request.serviceId,
    purpose: request.purpose,
    status: request.status,
    volume: request.monthlyVolume,
    createdAt: request.createdAt,
    source: /** @type {const} */ ("local")
  }));

  return [...local, ...seed];
}

/** @param {DashboardRequest} request */
function accessRow(request) {
  const searchText = [request.id, request.organization, request.cluster, request.purpose, request.status].join(" ").toLocaleLowerCase("fa");
  return `
    <tr
      data-request-row
      data-request-id="${escapeHtml(request.id)}"
      data-status="${escapeHtml(request.status)}"
      data-search="${escapeHtml(searchText)}"
      data-organization="${escapeHtml(request.organization)}"
      data-cluster="${escapeHtml(request.cluster)}"
      data-purpose="${escapeHtml(request.purpose)}"
      data-volume="${escapeHtml(request.volume)}"
      data-created-at="${escapeHtml(request.createdAt)}"
      data-source="${request.source}"
      data-match="true"
      tabindex="0"
      aria-selected="false"
    >
      <td class="en">${escapeHtml(request.id)}</td>
      <td>${escapeHtml(request.organization)}</td>
      <td>${escapeHtml(request.cluster)}</td>
      <td>${escapeHtml(request.purpose)}</td>
      <td><span class="table-status table-status--${statusClass(request.status)}">${escapeHtml(request.status)}</span></td>
    </tr>`;
}

function accessRows() {
  return allAccessRequests().map(accessRow).join("");
}

function dashboardToolbar() {
  const filters = getDashboardFilters();
  return `
    <div class="prototype-toolbar dashboard-toolbar">
      <label class="prototype-search">
        ${icon("search", { size: 18 })}
        <input id="dashboard-search" type="search" value="${escapeHtml(filters.query)}" placeholder="شناسه، سازمان، خوشه یا کاربرد…" />
      </label>
      <select id="dashboard-status" aria-label="فیلتر وضعیت درخواست">
        <option value="all" ${filters.status === "all" ? "selected" : ""}>همه وضعیت‌ها</option>
        <option value="در بررسی" ${filters.status === "در بررسی" ? "selected" : ""}>در بررسی</option>
        <option value="بررسی حقوقی" ${filters.status === "بررسی حقوقی" ? "selected" : ""}>بررسی حقوقی</option>
        <option value="نیازمند مدرک" ${filters.status === "نیازمند مدرک" ? "selected" : ""}>نیازمند مدرک</option>
        <option value="قابل پایلوت" ${filters.status === "قابل پایلوت" ? "selected" : ""}>قابل پایلوت</option>
      </select>
      <span id="dashboard-result-count" class="prototype-result-count"></span>
      <button id="clear-local-requests" class="filter-chip" type="button">پاک‌کردن درخواست‌های این مرورگر</button>
    </div>`;
}

function sensitivityVisual() {
  return `
    <div class="sensitivity-orbit" aria-label="نمایش نمونه سطح حساسیت خوشه‌ها">
      <div class="sensitivity-orbit__core"><strong>۶</strong><small>خوشه داده</small></div>
      <span class="sensitivity-dot sensitivity-dot--one">هویت</span>
      <span class="sensitivity-dot sensitivity-dot--two">خودرو</span>
      <span class="sensitivity-dot sensitivity-dot--three">مالی</span>
      <span class="sensitivity-dot sensitivity-dot--four">سفر</span>
      <span class="sensitivity-dot sensitivity-dot--five">پیام</span>
      <span class="sensitivity-dot sensitivity-dot--six">سازمان</span>
      <svg viewBox="0 0 320 320" aria-hidden="true">
        <circle cx="160" cy="160" r="118" />
        <circle cx="160" cy="160" r="82" />
      </svg>
    </div>`;
}

function emptyDetail() {
  return `<p class="prototype-empty">یک درخواست را انتخاب کنید تا جزئیاتش اینجا دیده شود.</p>`;
}

export function renderDashboardPage() {
  const content = `
    <section class="console-head">
      <div>
        <p class="eyebrow">DATA CONTROL OVERVIEW</p>
        <h1>کنسول کنترل داده</h1>
        <p>نمایی نمونه برای مدیریت سبد، آمادگی سرویس‌ها و درخواست‌های دسترسی.</p>
      </div>
      <div class="console-head__gate">
        ${icon("lock", { size: 21 })}
        <div><small>وضعیت عرضه عمومی</small><strong>بسته تا تکمیل مدارک</strong></div>
      </div>
    </section>

    <section class="portfolio-kpis">${portfolioCards()}</section>

    <section class="console-grid">
      <article class="panel card readiness-panel">
        <div class="panel__heading">
          <div>
            <small>Portfolio readiness</small>
            <h2>ماتریس آمادگی خوشه‌ها</h2>
          </div>
          <span class="demo-badge">برگرفته از ممیزی فعلی</span>
        </div>
        <div class="readiness-table" role="table" aria-label="ماتریس آمادگی خوشه‌ها">
          <div class="readiness-row readiness-row--head" role="row">
            <span>خوشه</span><span>مدرک منبع</span><span>حق عرضه</span><span>فنی</span><span>عرضه</span>
          </div>
          ${readinessRows()}
        </div>
      </article>

      <article class="panel card sensitivity-panel">
        <div class="panel__heading">
          <div><small>Data landscape</small><h2>پراکندگی خوشه‌ها</h2></div>
        </div>
        ${sensitivityVisual()}
        <p>اندازه و موقعیت گره‌ها نمایشی است؛ سطح حساسیت در اطلس داده به‌صورت متنی ثبت شده است.</p>
      </article>
    </section>

    <section class="panel card access-table-panel">
      <div class="panel__heading">
        <div><small>Prototype access requests</small><h2>درخواست‌های دسترسی</h2></div>
        <a data-link class="text-link" href="/request">درخواست جدید ${icon("arrow")}</a>
      </div>
      ${dashboardToolbar()}
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>شناسه</th><th>سازمان</th><th>خوشه</th><th>کاربرد</th><th>وضعیت</th></tr></thead>
          <tbody>${accessRows()}</tbody>
        </table>
      </div>
      <div id="dashboard-request-detail" class="dashboard-request-detail" aria-live="polite">${emptyDetail()}</div>
    </section>`;

  return appShell({ content, activePath: "/dashboard", title: "کنسول داده" });
}

function applyDashboardFilters() {
  const search = document.querySelector("#dashboard-search");
  const statusSelect = document.querySelector("#dashboard-status");
  const query = search instanceof HTMLInputElement ? search.value.trim().toLocaleLowerCase("fa") : "";
  const status = statusSelect instanceof HTMLSelectElement ? statusSelect.value : "all";
  let visible = 0;

  document.querySelectorAll("[data-request-row]").forEach((row) => {
    const haystack = row.getAttribute("data-search") ?? "";
    const rowStatus = row.getAttribute("data-status") ?? "";
    const match = (!query || haystack.includes(query)) && (status === "all" || rowStatus === status);
    row.setAttribute("data-match", String(match));
    if (match) visible += 1;
  });

  const count = document.querySelector("#dashboard-result-count");
  if (count instanceof HTMLElement) count.textContent = `${visible} درخواست`;
  setDashboardFilters({ query, status });
}

/** @param {HTMLElement} row */
function showRequestDetail(row) {
  document.querySelectorAll("[data-request-row]").forEach((item) => item.setAttribute("aria-selected", String(item === row)));
  const detail = document.querySelector("#dashboard-request-detail");
  if (!(detail instanceof HTMLElement)) return;

  const id = row.getAttribute("data-request-id") ?? "—";
  const organization = row.getAttribute("data-organization") ?? "—";
  const cluster = row.getAttribute("data-cluster") ?? "—";
  const purpose = row.getAttribute("data-purpose") ?? "—";
  const volume = row.getAttribute("data-volume") ?? "—";
  const createdAt = row.getAttribute("data-created-at") ?? "—";
  const source = row.getAttribute("data-source") === "local" ? "ثبت‌شده در این مرورگر" : "داده نمونه اولیه";

  detail.innerHTML = `
    <div class="dashboard-request-detail__grid">
      <div><small>شناسه</small><strong class="en">${escapeHtml(id)}</strong></div>
      <div><small>سازمان</small><strong>${escapeHtml(organization)}</strong></div>
      <div><small>خوشه</small><strong>${escapeHtml(cluster)}</strong></div>
      <div><small>منبع رکورد</small><strong>${source}</strong></div>
      <div><small>حجم</small><strong>${escapeHtml(volume)}</strong></div>
      <div><small>زمان</small><strong>${escapeHtml(createdAt)}</strong></div>
      <div class="dashboard-request-detail__wide"><small>کاربرد اعلام‌شده</small><strong>${escapeHtml(purpose)}</strong></div>
    </div>`;
}

/** @param {() => void} rerender */
export function mountDashboardPage(rerender) {
  const filters = getDashboardFilters();
  const search = document.querySelector("#dashboard-search");
  const statusSelect = document.querySelector("#dashboard-status");
  if (search instanceof HTMLInputElement) search.value = filters.query;
  if (statusSelect instanceof HTMLSelectElement) statusSelect.value = filters.status;

  search?.addEventListener("input", applyDashboardFilters);
  statusSelect?.addEventListener("change", applyDashboardFilters);

  document.querySelectorAll("[data-request-row]").forEach((row) => {
    if (!(row instanceof HTMLElement)) return;
    row.addEventListener("click", () => showRequestDetail(row));
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showRequestDetail(row);
      }
    });
  });

  document.querySelector("#clear-local-requests")?.addEventListener("click", () => {
    if (!listPrototypeAccessRequests().length) return;
    if (!window.confirm("درخواست‌های نمایشی ثبت‌شده در این مرورگر پاک شوند؟")) return;
    clearPrototypeAccessRequests();
    rerender();
  });

  applyDashboardFilters();
}
