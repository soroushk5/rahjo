import { appShell } from "../../app/appShell.js";
import { icon } from "../../components/icons.js";
import { clusterReadiness, portfolioMetrics, sampleAccessRequests } from "../../data/demoData.js";

/** @param {string} value */
function statusClass(value) {
  if (["قابل پایلوت", "فعال", "قابل طراحی"].includes(value)) return "positive";
  if (["مشروط", "اولیه", "در بررسی", "بررسی حقوقی"].includes(value)) return "warning";
  if (["مسدود", "نیازمند مدرک", "نامشخص", "ناقص"].includes(value)) return "blocked";
  return "neutral";
}

function portfolioCards() {
  return portfolioMetrics
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

function accessRows() {
  return sampleAccessRequests
    .map(
      (request) => `
        <tr>
          <td class="en">${request.id}</td>
          <td>${request.organization}</td>
          <td>${request.cluster}</td>
          <td>${request.purpose}</td>
          <td><span class="table-status table-status--${statusClass(request.status)}">${request.status}</span></td>
        </tr>`
    )
    .join("");
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
        <div><small>Sample access requests</small><h2>درخواست‌های دسترسی نمونه</h2></div>
        <a data-link class="text-link" href="/request">درخواست جدید ${icon("arrow")}</a>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>شناسه</th><th>سازمان</th><th>خوشه</th><th>کاربرد</th><th>وضعیت</th></tr></thead>
          <tbody>${accessRows()}</tbody>
        </table>
      </div>
    </section>`;

  return appShell({ content, activePath: "/dashboard", title: "کنسول داده" });
}
