import { appShell } from "../../app/appShell.js";
import { metricCard } from "../../components/metricCard.js";
import { statusBadge } from "../../components/statusBadge.js";
import { metrics, recentRequests, services } from "../../data/demoData.js";

function dashboardChart() {
  return `
    <svg class="chart-area" viewBox="0 0 800 340" role="img" aria-label="نمودار نمونه درخواست‌های هفتگی">
      <g stroke="#E3E9EF" stroke-width="1">
        <line x1="40" y1="50" x2="760" y2="50"/><line x1="40" y1="110" x2="760" y2="110"/>
        <line x1="40" y1="170" x2="760" y2="170"/><line x1="40" y1="230" x2="760" y2="230"/>
        <line x1="40" y1="290" x2="760" y2="290"/>
      </g>
      <path d="M40 260 C110 252,120 165,190 186 S300 278,355 178 S460 86,520 145 S625 240,760 92" fill="none" stroke="#0FA3B1" stroke-width="6" stroke-linecap="round"/>
      <g fill="#0B1D33"><circle cx="190" cy="186" r="6"/><circle cx="355" cy="178" r="6"/><circle cx="520" cy="145" r="6"/><circle cx="760" cy="92" r="6"/></g>
    </svg>`;
}

export function renderDashboardPage() {
  const metricMarkup = metrics.map(metricCard).join("");
  const serviceMarkup = services.map((service) => `<div class="service-row"><span>${service.name}</span>${statusBadge(service.status)}</div>`).join("");
  const requestRows = recentRequests.map((request) => `<tr><td class="en">${request.id}</td><td>${request.type}</td><td>${request.status}</td><td>${request.time}</td></tr>`).join("");

  const content = `
    <section class="dashboard-title"><h1>نمای کلی سامانه</h1><p class="muted">داده‌های این صفحه نمونه‌اند و به سرویس واقعی متصل نیستند.</p></section>
    <section class="metric-grid" aria-label="شاخص‌های اصلی">${metricMarkup}</section>
    <section class="dashboard-grid">
      <article class="panel card"><div class="panel__heading"><h2>روند درخواست‌ها</h2><span class="muted">۷ روز اخیر</span></div>${dashboardChart()}</article>
      <article class="panel card"><div class="panel__heading"><h2>وضعیت سرویس‌ها</h2><span class="muted">Demo</span></div><div class="service-list">${serviceMarkup}</div></article>
    </section>
    <section class="panel card" style="margin-top: 1rem;"><div class="panel__heading"><h2>آخرین درخواست‌ها</h2><a data-link class="muted" href="/request">درخواست جدید ←</a></div><table class="data-table"><thead><tr><th>شناسه</th><th>نوع</th><th>وضعیت</th><th>زمان</th></tr></thead><tbody>${requestRows}</tbody></table></section>`;

  return appShell({ content, activePath: "/dashboard", title: "داشبورد" });
}
