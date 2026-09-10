// @ts-nocheck
import { appShell } from "../../app/appShell.js";
import { icon } from "../../components/icons.js";
import { dataQualityIssues, serviceCatalog } from "../../data/phaseOneData.js";
import { completeTask, readDemoState, setSelectedCustomerId, setSelectedRequestId } from "../../services/phaseOneStore.js";
import { badge, customerLink, customerName, emptyState, money, pageHeader, panel, requestLink, serviceName } from "./shared.js";

function metric(label, value, note, glyph, tone = "teal") {
  return `<article class="ops-metric ops-metric--${tone}"><span>${icon(glyph)}</span><div><small>${label}</small><strong>${value}</strong><a href="#workspace-focus">${note} ${icon("arrow", { size: 13 })}</a></div></article>`;
}

function taskRows(state, tasks) {
  return tasks.map((task) => `<tr><td>${badge(task.priority)}</td><td><strong>${task.title}</strong><small>${customerName(state, task.accountId)}</small></td><td>${task.due}</td><td>${task.owner}</td><td>${badge(task.status)}</td><td>${task.status !== "تکمیل‌شده" ? `<button type="button" class="table-action" data-complete-task="${task.id}">${icon("check", { size: 14 })} تکمیل</button>` : "—"}</td></tr>`).join("");
}

export function renderDashboardPage() {
  const state = readDemoState();
  const openRequests = state.requests.filter((item) => !["تحویل‌شده", "بسته‌شده", "لغوشده"].includes(item.status));
  const todayTasks = state.tasks.filter((item) => ["امروز", "در حال انجام", "عقب‌افتاده"].includes(item.status));
  const pendingPayments = state.requests.filter((item) => item.paymentStatus !== "پرداخت‌شده" && item.price > 0);
  const attention = state.requests.filter((item) => ["منتظر اطلاعات", "منتظر پرداخت", "در حال اجرا"].includes(item.status)).slice(0, 5);
  const actions = state.tasks.filter((item) => item.status !== "تکمیل‌شده").slice(0, 4);

  const content = `
    ${pageHeader("صبح بخیر، نسترن", "امروز چهار کار با اولویت و سررسید مشخص در انتظار شماست.", `<label class="role-switcher">نمای نقش <select aria-label="نمای نقش داشبورد"><option>مدیر عملیات</option><option>مدیر کسب‌وکار</option><option>فروش</option><option>مالی</option></select></label>`)}
    <div class="ops-metrics">
      ${metric("درخواست‌های باز", new Intl.NumberFormat("fa-IR").format(openRequests.length), "مشاهده جزئیات", "requests")}
      ${metric("کارهای امروز", new Intl.NumberFormat("fa-IR").format(todayTasks.length), "مشاهده جزئیات", "check", "blue")}
      ${metric("پرداخت‌های در انتظار", new Intl.NumberFormat("fa-IR").format(pendingPayments.length), "پیگیری مالی", "clock", "amber")}
      ${metric("موارد دارای مشکل", new Intl.NumberFormat("fa-IR").format(dataQualityIssues.filter((item) => item.status !== "رفع‌شده").length), "بررسی کیفیت داده", "shield", "rose")}
    </div>
    <div id="workspace-focus" class="dashboard-layout">
      ${panel("اقدام بعدی من", `<div class="table-wrap"><table class="workspace-table"><thead><tr><th>اولویت</th><th>اقدام</th><th>مهلت</th><th>مسئول</th><th>وضعیت</th><th></th></tr></thead><tbody>${taskRows(state, actions)}</tbody></table></div>`, `<a data-link class="text-link" href="/tasks">مشاهدهٔ همه ${icon("arrow", { size: 14 })}</a>`, "dashboard-actions")}
      <div class="dashboard-split">
        ${panel("درخواست‌های نیازمند توجه", `<div class="compact-list">${attention.map((request) => `<article><div>${badge(request.status)}<strong>${request.title}</strong><small>${customerName(state, request.accountId)} · ${request.referenceId}</small></div><div><span>${request.nextAction}</span>${requestLink(request)}</div></article>`).join("")}</div>`, `<a data-link class="text-link" href="/requests">همه درخواست‌ها ${icon("arrow", { size: 14 })}</a>`)}
        ${panel("پیگیری‌های امروز", `<div class="today-list">${todayTasks.slice(0, 5).map((task) => `<article><span>${icon(task.priority === "فوری" ? "bell" : "clock", { size: 17 })}</span><div><strong>${task.title}</strong><small>${customerName(state, task.accountId)}</small></div><time>${task.due}</time></article>`).join("")}</div>`, `<a data-link class="text-link" href="/tasks">تقویم کارها ${icon("arrow", { size: 14 })}</a>`)}
      </div>
      <div class="dashboard-split dashboard-performance">
        ${panel("عملکرد فروش", `<dl class="performance-list"><div><dt>ارزش فرصت‌های باز</dt><dd>${money(state.opportunities.reduce((sum, item) => sum + item.value, 0))}</dd></div><div><dt>پیشنهادهای فعال</dt><dd>۳ مورد</dd></div><div><dt>نرخ تبدیل نمونه</dt><dd>۲۸٪</dd></div><div><dt>اقدام بدون پیگیری</dt><dd class="danger-text">۱ مورد</dd></div></dl>`, `<a data-link class="text-link" href="/sales">گزارش فروش ${icon("arrow", { size: 14 })}</a>`)}
        ${panel("عملکرد خدمات", `<dl class="performance-list"><div><dt>خدمات تحویل‌شده</dt><dd>۱۸ مورد</dd></div><div><dt>متوسط زمان پاسخ</dt><dd>۵٫۶ ساعت</dd></div><div><dt>تحویل در SLA</dt><dd>۸۶٪</dd></div><div><dt>درخواست تأخیردار</dt><dd class="danger-text">۲ مورد</dd></div></dl>`, `<a data-link class="text-link" href="/reports">گزارش خدمات ${icon("arrow", { size: 14 })}</a>`)}
      </div>
      ${panel("آخرین فعالیت‌ها", `<div class="activity-stream">${state.activities.slice(0, 6).map((event) => `<article><i class="dot dot--${event.tone}"></i><div><strong>${event.title}</strong><p>${event.detail}</p></div><span>${event.actor}<small>${event.time}</small></span></article>`).join("")}</div>`)}
    </div>`;
  return appShell({ content, activePath: "/dashboard", title: "داشبورد" });
}

export function renderCustomersPage() {
  const state = readDemoState();
  const rows = state.customers.map((customer) => {
    const requests = state.requests.filter((item) => item.accountId === customer.id);
    const opportunity = state.opportunities.find((item) => item.accountId === customer.id);
    return `<tr data-customer-row data-search="${customer.name} ${customer.industry} ${customer.owner}"><td><div class="entity-cell"><span>${customer.name.slice(0, 1)}</span><div><strong>${customerLink(customer)}</strong><small>${customer.type} · ${customer.industry}</small></div></div></td><td>${customer.owner}</td><td>${customer.contacts[0]?.name ?? "—"}</td><td>${new Intl.NumberFormat("fa-IR").format(requests.length)}</td><td>${opportunity ? badge(opportunity.stage) : "—"}</td><td>${badge(customer.status)}</td><td><button type="button" class="icon-button" aria-label="عملیات بیشتر">•••</button></td></tr>`;
  }).join("");
  const content = `
    ${pageHeader("مشتریان", "پروفایل شخص و سازمان، اشخاص مرتبط و کل سابقهٔ رابطه در یک مکان.", `<button class="button button--outline" type="button">ورود مشتری</button><a data-link class="button button--primary" href="/request-service">مشتری و درخواست جدید</a>`)}
    <div class="summary-strip"><span><b>${new Intl.NumberFormat("fa-IR").format(state.customers.length)}</b> مشتری ثبت‌شده</span><span><b>۳</b> مشتری فعال</span><span><b>۱</b> مشتری بالقوه</span><span><b>۲</b> نیازمند پیگیری امروز</span></div>
    ${panel("فهرست مشتریان", `<div class="table-toolbar"><label class="table-search">${icon("search", { size: 16 })}<input data-table-query placeholder="جست‌وجوی نام، صنعت یا مسئول…" /></label><div class="filter-buttons"><button type="button" data-customer-filter="همه" aria-pressed="true">همه</button><button type="button" data-customer-filter="مشتری فعال">فعال</button><button type="button" data-customer-filter="بالقوه">بالقوه</button></div></div><div class="table-wrap"><table class="workspace-table"><thead><tr><th>مشتری</th><th>مسئول حساب</th><th>شخص تماس</th><th>درخواست‌ها</th><th>فرصت جاری</th><th>وضعیت</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`)}
  `;
  return appShell({ content, activePath: "/customers", title: "مشتریان" });
}

export function renderSalesPage() {
  const state = readDemoState();
  const stages = ["ورودی", "تماس اولیه", "نیازسنجی", "واجد شرایط", "پیشنهاد", "مذاکره", "برنده", "از دست رفته"];
  const content = `
    ${pageHeader("فروش", "سرنخ، فرصت و مشتری سه مفهوم متصل‌اند؛ هر فرصت یک اقدام بعدی دارد.", `<button type="button" class="button button--outline">سرنخ جدید</button><button type="button" class="button button--primary">فرصت جدید</button>`)}
    <div class="sales-summary">${metric("ارزش مسیر فروش", money(state.opportunities.reduce((sum, item) => sum + item.value, 0)), "همهٔ فرصت‌های باز", "reports")}${metric("فرصت‌های باز", new Intl.NumberFormat("fa-IR").format(state.opportunities.length), "در ۴ مرحله", "requests", "blue")}${metric("اقدام امروز", "۳", "پیگیری برنامه‌ریزی‌شده", "clock", "amber")}${metric("پیشنهاد فعال", "۲", "نیازمند پاسخ مشتری", "document", "teal")}</div>
    ${panel("مسیر فروش", `<div class="sales-pipeline">${stages.map((stage) => `<section><header><strong>${stage}</strong><span>${new Intl.NumberFormat("fa-IR").format(state.opportunities.filter((item) => item.stage === stage).length)}</span></header>${state.opportunities.filter((item) => item.stage === stage).map((item) => `<article><small>${item.id}</small><h3>${item.title}</h3><p>${customerName(state, item.accountId)}</p><div><span>${money(item.value)}</span><b>${new Intl.NumberFormat("fa-IR").format(item.probability)}٪</b></div><footer>${item.owner}<time>${item.nextDate}</time></footer></article>`).join("") || `<p class="pipeline-empty">فرصتی در این مرحله نیست.</p>`}</section>`).join("")}</div>`)}
    ${panel("اقدام‌های بعدی فروش", `<div class="table-wrap"><table class="workspace-table"><thead><tr><th>فرصت</th><th>مشتری</th><th>مرحله</th><th>مسئول</th><th>اقدام بعدی</th><th>تاریخ</th></tr></thead><tbody>${state.opportunities.map((item) => `<tr><td><strong>${item.title}</strong><small>${item.id}</small></td><td>${customerName(state, item.accountId)}</td><td>${badge(item.stage)}</td><td>${item.owner}</td><td>${item.nextAction}</td><td>${item.nextDate}</td></tr>`).join("")}</tbody></table></div>`)}
  `;
  return appShell({ content, activePath: "/sales", title: "فروش" });
}

export function renderServicesAdminPage() {
  const content = `
    ${pageHeader("خدمات", "کاتالوگ خدمات هستهٔ پیکربندی کسب‌وکار است؛ قیمت، مدارک، مسئول، مراحل و خروجی اینجا تعیین می‌شوند.", `<a data-link class="button button--outline" href="/services">نمای عمومی</a><button type="button" class="button button--primary">خدمت جدید</button>`)}
    <div class="summary-strip"><span><b>${new Intl.NumberFormat("fa-IR").format(serviceCatalog.length)}</b> خدمت</span><span><b>۴</b> درخواست اینترنتی فعال</span><span><b>۲</b> مدل قیمت‌گذاری</span><span><b>۱</b> نیازمند بازبینی</span></div>
    ${panel("کاتالوگ خدمات", `<div class="table-wrap"><table class="workspace-table service-admin-table"><thead><tr><th>خدمت</th><th>دسته</th><th>قیمت</th><th>زمان / SLA</th><th>مسئول</th><th>مدارک</th><th>درخواست آنلاین</th><th>وضعیت</th></tr></thead><tbody>${serviceCatalog.map((service) => `<tr><td><strong>${service.title}</strong><small>${service.output}</small></td><td>${service.category}</td><td>${service.priceLabel}</td><td>${service.duration}</td><td>${service.owner}</td><td>${new Intl.NumberFormat("fa-IR").format(service.documents.length)} مورد</td><td>${badge(service.online ? "فعال" : "غیرفعال")}</td><td>${badge(service.active ? "فعال" : "پیش‌نویس")}</td></tr>`).join("")}</tbody></table></div>`)}
    <div class="dashboard-split">
      ${panel("چه چیزی قابل‌پیکربندی است؟", `<ul class="config-list"><li>فرم و فیلدهای ورودی</li><li>قیمت ثابت، متغیر یا استعلامی</li><li>مدارک و شرایط پذیرش</li><li>مراحل عملیات و SLA</li><li>واحد، مسئول و تأیید انسانی</li><li>خروجی و روش تحویل</li></ul>`)}
      ${panel("مرز اتصال", `<div class="connector-note">${icon("link", { size: 24 })}<div><strong>اتصال مستقل از هسته</strong><p>درگاه پرداخت، پیام، حسابداری یا API مرتبط می‌تواند برای هر خدمت تنظیم شود؛ تغییر ارائه‌دهنده جریان اصلی را مختل نمی‌کند.</p></div></div>`)}
    </div>`;
  return appShell({ content, activePath: "/services-admin", title: "خدمات" });
}

export function renderRequestsPage() {
  const state = readDemoState();
  const rows = state.requests.map((request) => `<tr data-request-row data-search="${request.referenceId} ${request.title} ${customerName(state, request.accountId)} ${request.status}" data-status="${request.status}"><td><strong>${requestLink(request)}</strong><small>${request.createdAt}</small></td><td>${customerLink(state.customers.find((item) => item.id === request.accountId))}</td><td><strong>${request.title}</strong><small>${request.channel}</small></td><td>${badge(request.status)}</td><td>${badge(request.paymentStatus)}</td><td>${request.owner}</td><td>${request.targetDate}</td><td><span class="next-action">${request.nextAction}</span></td></tr>`).join("");
  const content = `
    ${pageHeader("درخواست‌های خدمت", "هر درخواست مشتری، خدمت، مدارک، قیمت، پرداخت، مسئول، عملیات و نتیجهٔ روشن دارد.", `<a data-link class="button button--primary" href="/request-service">درخواست جدید</a>`)}
    <div class="summary-strip"><span><b>${new Intl.NumberFormat("fa-IR").format(state.requests.length)}</b> کل درخواست‌ها</span><span><b>${new Intl.NumberFormat("fa-IR").format(state.requests.filter((item) => item.status === "منتظر اطلاعات").length)}</b> منتظر مشتری</span><span><b>${new Intl.NumberFormat("fa-IR").format(state.requests.filter((item) => item.status === "در حال اجرا").length)}</b> در حال اجرا</span><span><b>${new Intl.NumberFormat("fa-IR").format(state.requests.filter((item) => item.status === "تحویل‌شده").length)}</b> تحویل‌شده</span></div>
    ${panel("فهرست درخواست‌ها", `<div class="table-toolbar"><label class="table-search">${icon("search", { size: 16 })}<input data-request-query placeholder="جست‌وجوی شماره، مشتری، خدمت یا وضعیت…" /></label><div class="filter-buttons"><button type="button" data-request-filter="همه" aria-pressed="true">همه</button><button type="button" data-request-filter="منتظر اطلاعات">منتظر مشتری</button><button type="button" data-request-filter="منتظر پرداخت">منتظر پرداخت</button><button type="button" data-request-filter="در حال اجرا">در حال اجرا</button><button type="button" data-request-filter="تحویل‌شده">تحویل‌شده</button></div></div><div class="table-wrap"><table class="workspace-table requests-table"><thead><tr><th>شماره</th><th>مشتری</th><th>خدمت</th><th>وضعیت</th><th>پرداخت</th><th>مسئول</th><th>تاریخ هدف</th><th>اقدام بعدی</th></tr></thead><tbody>${rows}</tbody></table></div>`)}
  `;
  return appShell({ content, activePath: "/requests", title: "درخواست‌ها" });
}

export function renderTasksPage() {
  const state = readDemoState();
  const statuses = ["همه", "امروز", "عقب‌افتاده", "این هفته", "منتظر دیگران", "تکمیل‌شده"];
  const content = `
    ${pageHeader("کارها و پیگیری‌ها", "Task یک شیء درجه‌اول است و همیشه به مشتری، فرصت یا درخواست مربوط متصل می‌شود.", `<button type="button" class="button button--primary">کار جدید</button>`)}
    <div class="task-tabs" role="tablist">${statuses.map((status, index) => `<button type="button" data-task-filter="${status}" aria-pressed="${index === 0}">${status}<span>${new Intl.NumberFormat("fa-IR").format(status === "همه" ? state.tasks.length : state.tasks.filter((item) => item.status === status).length)}</span></button>`).join("")}</div>
    ${panel("فهرست کارهای من", `<div class="table-wrap"><table class="workspace-table"><thead><tr><th>اولویت</th><th>عنوان کار</th><th>مشتری / مرتبط با</th><th>مسئول</th><th>سررسید</th><th>وضعیت</th><th></th></tr></thead><tbody>${state.tasks.map((task) => `<tr data-task-row data-status="${task.status}"><td>${badge(task.priority)}</td><td><strong>${task.title}</strong><small>${task.id}</small></td><td>${customerName(state, task.accountId)}<small>${task.requestId ? state.requests.find((item) => item.id === task.requestId)?.referenceId ?? "" : task.opportunityId}</small></td><td>${task.owner}</td><td>${task.due}</td><td>${badge(task.status)}</td><td>${task.status !== "تکمیل‌شده" ? `<button type="button" class="table-action" data-complete-task="${task.id}">${icon("check", { size: 14 })} تکمیل</button>` : task.result}</td></tr>`).join("")}</tbody></table></div>`)}
  `;
  return appShell({ content, activePath: "/tasks", title: "کارها و پیگیری‌ها" });
}

export function mountCorePages(rerender) {
  document.querySelectorAll("[data-customer-id]").forEach((link) => link.addEventListener("click", () => setSelectedCustomerId(link.getAttribute("data-customer-id") ?? "arya-sanat")));
  document.querySelectorAll("[data-request-id]").forEach((link) => link.addEventListener("click", () => setSelectedRequestId(link.getAttribute("data-request-id") ?? "rah-1405-0284")));
  document.querySelectorAll("[data-complete-task]").forEach((button) => button.addEventListener("click", () => {
    completeTask(button.getAttribute("data-complete-task") ?? "");
    rerender();
  }));

  const customerQuery = document.querySelector("[data-table-query]");
  if (customerQuery instanceof HTMLInputElement) customerQuery.addEventListener("input", () => {
    const needle = customerQuery.value.trim().toLocaleLowerCase("fa");
    document.querySelectorAll("[data-customer-row]").forEach((row) => row.toggleAttribute("hidden", Boolean(needle) && !(row.getAttribute("data-search") ?? "").toLocaleLowerCase("fa").includes(needle)));
  });
  document.querySelectorAll("[data-customer-filter]").forEach((button) => button.addEventListener("click", () => {
    const filter = button.getAttribute("data-customer-filter") ?? "همه";
    document.querySelectorAll("[data-customer-filter]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    const state = readDemoState();
    document.querySelectorAll("[data-customer-row]").forEach((row, index) => row.toggleAttribute("hidden", filter !== "همه" && state.customers[index]?.status !== filter));
  }));

  const requestQuery = document.querySelector("[data-request-query]");
  if (requestQuery instanceof HTMLInputElement) requestQuery.addEventListener("input", () => {
    const needle = requestQuery.value.trim().toLocaleLowerCase("fa");
    document.querySelectorAll("[data-request-row]").forEach((row) => row.toggleAttribute("hidden", Boolean(needle) && !(row.getAttribute("data-search") ?? "").toLocaleLowerCase("fa").includes(needle)));
  });
  document.querySelectorAll("[data-request-filter]").forEach((button) => button.addEventListener("click", () => {
    const filter = button.getAttribute("data-request-filter") ?? "همه";
    document.querySelectorAll("[data-request-filter]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    document.querySelectorAll("[data-request-row]").forEach((row) => row.toggleAttribute("hidden", filter !== "همه" && row.getAttribute("data-status") !== filter));
  }));

  document.querySelectorAll("[data-task-filter]").forEach((button) => button.addEventListener("click", () => {
    const filter = button.getAttribute("data-task-filter") ?? "همه";
    document.querySelectorAll("[data-task-filter]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    document.querySelectorAll("[data-task-row]").forEach((row) => row.toggleAttribute("hidden", filter !== "همه" && row.getAttribute("data-status") !== filter));
  }));
}
