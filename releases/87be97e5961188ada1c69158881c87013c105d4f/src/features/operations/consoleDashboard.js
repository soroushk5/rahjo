// @ts-nocheck
import { appShell } from "../../app/appShell.js";
import { icon } from "../../components/icons.js";
import { dataQualityIssues } from "../../data/phaseOneData.js";
import { readDemoState } from "../../services/phaseOneStore.js";
import { badge, customerName, pageHeader, panel, requestLink } from "./shared.js";

const number = new Intl.NumberFormat("fa-IR");

function metric(label, value, note, glyph, tone = "teal") {
  return `
    <article class="ops-metric ops-metric--${tone}">
      <span>${icon(glyph, { size: 18 })}</span>
      <div><small>${label}</small><strong>${value}</strong><em>${note}</em></div>
    </article>`;
}

function taskRows(state, tasks) {
  if (!tasks.length) return `<tr><td colspan="6">کاری برای امروز باقی نمانده است.</td></tr>`;
  return tasks.map((task) => `
    <tr>
      <td>${badge(task.priority)}</td>
      <td><strong>${task.title}</strong><small>${customerName(state, task.accountId)}</small></td>
      <td>${task.due}</td>
      <td>${task.owner}</td>
      <td>${badge(task.status)}</td>
      <td>${task.status !== "تکمیل‌شده" ? `<button type="button" class="table-action" data-complete-task="${task.id}">${icon("check", { size: 13 })} تکمیل</button>` : "—"}</td>
    </tr>`).join("");
}

export function renderCompactDashboardPage() {
  const state = readDemoState();
  const openRequests = state.requests.filter((item) => !["تحویل‌شده", "بسته‌شده", "لغوشده"].includes(item.status));
  const todayTasks = state.tasks.filter((item) => ["امروز", "در حال انجام", "عقب‌افتاده"].includes(item.status));
  const pendingPayments = state.requests.filter((item) => item.paymentStatus !== "پرداخت‌شده" && item.price > 0);
  const qualityIssues = dataQualityIssues.filter((item) => item.status !== "رفع‌شده");
  const actions = state.tasks.filter((item) => item.status !== "تکمیل‌شده").slice(0, 5);
  const attention = state.requests.filter((item) => ["منتظر اطلاعات", "منتظر پرداخت", "در حال اجرا"].includes(item.status)).slice(0, 4);
  const activity = state.activities.slice(0, 4);

  const content = `
    <div class="console-dashboard" data-console-dashboard="compact">
      ${pageHeader(
        "مرکز کار امروز",
        "اقدام بعدی، موارد نیازمند توجه و وضعیت کلی تیم در یک نگاه.",
        `<label class="role-switcher">نمای کار <select aria-label="نمای نقش داشبورد"><option>مدیر عملیات</option><option>مدیر کسب‌وکار</option><option>فروش</option><option>مالی</option></select></label>`
      )}

      <section class="ops-metrics" aria-label="خلاصهٔ امروز">
        ${metric("پرونده‌های باز", number.format(openRequests.length), "در جریان", "requests")}
        ${metric("کارهای امروز", number.format(todayTasks.length), "نیازمند پیگیری", "check", "blue")}
        ${metric("پرداخت در انتظار", number.format(pendingPayments.length), "برای بررسی", "clock", "amber")}
        ${metric("کیفیت داده", number.format(qualityIssues.length), "مورد باز", "shield", "rose")}
      </section>

      <div id="workspace-focus" class="console-dashboard__grid">
        ${panel(
          "اقدام بعدی من",
          `<div class="table-wrap"><table class="workspace-table"><thead><tr><th>اولویت</th><th>اقدام</th><th>مهلت</th><th>مسئول</th><th>وضعیت</th><th></th></tr></thead><tbody>${taskRows(state, actions)}</tbody></table></div>`,
          `<a data-link class="text-link" href="/tasks">همهٔ کارها ${icon("arrow", { size: 14 })}</a>`,
          "dashboard-actions"
        )}

        <aside class="console-dashboard__side" aria-label="موارد مهم امروز">
          ${panel(
            "نیازمند توجه",
            `<div class="compact-list">${attention.map((request) => `<article><div>${badge(request.status)}<strong>${request.title}</strong><small>${customerName(state, request.accountId)} · ${request.referenceId}</small></div><div><span>${request.nextAction}</span>${requestLink(request)}</div></article>`).join("") || `<p class="console-inline-empty">مورد فوری وجود ندارد.</p>`}</div>`,
            `<a data-link class="text-link" href="/requests">پرونده‌ها ${icon("arrow", { size: 14 })}</a>`
          )}

          ${panel(
            "آخرین حرکت‌ها",
            `<div class="activity-stream">${activity.map((event) => `<article><i class="dot dot--${event.tone}"></i><div><strong>${event.title}</strong><p>${event.detail}</p></div><span>${event.actor}<small>${event.time}</small></span></article>`).join("")}</div>`
          )}
        </aside>
      </div>
    </div>`;

  return appShell({ content, activePath: "/dashboard", title: "داشبورد" });
}
