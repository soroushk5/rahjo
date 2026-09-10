// @ts-nocheck
import { appShell } from "../../app/appShell.js";
import { icon } from "../../components/icons.js";
import { serviceCatalog } from "../../data/phaseOneData.js";
import {
  approveRequest,
  assignAndStartRequest,
  completeRequestDocuments,
  deliverRequest,
  readDemoState,
  registerPayment,
  setSelectedCustomerId,
  setSelectedRequestId
} from "../../services/phaseOneStore.js";
import { badge, customerLink, customerName, money, panel, requestLink, serviceName } from "./shared.js";

function relationSummary(customer, requests, opportunities) {
  return `<section class="relation-summary"><h2>خلاصهٔ رابطه</h2><p>${customer.name} از سال ${customer.since} با رهجو همکاری دارد. تمرکز فعلی روی ${requests.filter((item) => !item.closedAt).length} درخواست باز و ${opportunities.length} فرصت فروش است.</p><div><span>مشتری کلیدی</span><span>پتانسیل رشد بالا</span><span>${customer.status}</span></div></section>`;
}

function accountRequests(state, requests) {
  return `<div class="table-wrap"><table class="workspace-table"><thead><tr><th>شماره</th><th>خدمت</th><th>وضعیت</th><th>پرداخت</th><th>مسئول</th><th>اقدام بعدی</th></tr></thead><tbody>${requests.map((request) => `<tr><td><strong>${requestLink(request)}</strong><small>${request.createdAt}</small></td><td>${request.title}</td><td>${badge(request.status)}</td><td>${badge(request.paymentStatus)}</td><td>${request.owner}</td><td>${request.nextAction}</td></tr>`).join("")}</tbody></table></div>`;
}

function accountTimeline(activities) {
  return `<div class="account-timeline">${activities.map((event) => `<article><i class="dot dot--${event.tone}"></i><time>${event.time}</time><div><strong>${event.title}</strong><p>${event.detail}</p><small>${event.actor}</small></div></article>`).join("")}</div>`;
}

export function renderCustomerDetailPage() {
  const state = readDemoState();
  const customer = state.customers.find((item) => item.id === state.selectedCustomerId) ?? state.customers[0];
  const requests = state.requests.filter((item) => item.accountId === customer.id);
  const opportunities = state.opportunities.filter((item) => item.accountId === customer.id);
  const tasks = state.tasks.filter((item) => item.accountId === customer.id);
  const documents = state.documents.filter((item) => item.accountId === customer.id);
  const transactions = state.transactions.filter((item) => item.accountId === customer.id);
  const activities = state.activities.filter((item) => item.accountId === customer.id);

  const overview = `
    <div class="account-overview-grid">
      ${relationSummary(customer, requests, opportunities)}
      ${panel("افراد مرتبط", `<div class="contact-list">${customer.contacts.map((contact) => `<article><span>${contact.name.split(" ").map((item) => item[0]).join("").slice(0, 2)}</span><div><strong>${contact.name}</strong><small>${contact.role}</small><p>${contact.phone}</p></div></article>`).join("")}<button type="button" class="text-link">${icon("users", { size: 15 })} افزودن فرد</button></div>`)}
      ${panel("خلاصهٔ مالی و اعتبار", `<dl class="financial-summary"><div><dt>ارزش رابطه</dt><dd>${money(customer.balance)}</dd></div><div><dt>اعتبار قابل استفاده</dt><dd>${money(customer.credit)}</dd></div><div><dt>مبلغ در انتظار</dt><dd>${money(requests.reduce((sum, item) => sum + Math.max(0, item.price - item.paid - item.creditUsed), 0))}</dd></div></dl>`)}
      ${panel("فرصت‌های باز", `<div class="mini-table">${opportunities.map((item) => `<article><div><strong>${item.title}</strong><small>${item.id}</small></div><span>${badge(item.stage)}</span><b>${money(item.value)}</b><time>${item.nextDate}</time></article>`).join("") || `<p>فرصت بازی ثبت نشده است.</p>`}</div>`, `<a data-link class="text-link" href="/sales">مشاهده همه ${icon("arrow", { size: 14 })}</a>`, "account-wide")}
      ${panel("درخواست‌های مشتری", accountRequests(state, requests), `<a data-link class="text-link" href="/requests">همه درخواست‌ها ${icon("arrow", { size: 14 })}</a>`, "account-wide")}
      ${panel("کارها و پیگیری‌های آینده", `<div class="today-list">${tasks.slice(0, 5).map((task) => `<article><span>${icon("clock", { size: 17 })}</span><div><strong>${task.title}</strong><small>${task.owner}</small></div><time>${task.due}</time></article>`).join("")}</div>`)}
      ${panel("آخرین تعامل‌ها", accountTimeline(activities.slice(0, 4)))}
    </div>`;

  const content = `
    <header class="account-header">
      <div class="account-header__identity"><span class="account-mark">${customer.name.slice(0, 1)}</span><div><div>${badge(customer.status)}<small>${customer.type}</small></div><h1>${customer.name}</h1><p>${customer.industry}</p></div></div>
      <div class="account-header__actions"><a data-link class="button button--outline" href="/request-service">${icon("requests", { size: 16 })} درخواست جدید</a><a data-link class="button button--outline" href="/sales">${icon("reports", { size: 16 })} فرصت جدید</a><button type="button" class="button button--primary">${icon("message", { size: 16 })} ثبت تعامل</button></div>
      <dl class="account-meta"><div><dt>مدیر حساب</dt><dd>${customer.owner}</dd></div><div><dt>تلفن</dt><dd>${customer.phone}</dd></div><div><dt>ایمیل</dt><dd>${customer.email}</dd></div><div><dt>نشانی</dt><dd>${customer.address}</dd></div></dl>
    </header>
    <nav class="account-tabs" role="tablist"><button type="button" data-account-tab="overview" aria-selected="true">نمای کلی</button><button type="button" data-account-tab="sales">فروش</button><button type="button" data-account-tab="requests">درخواست‌ها</button><button type="button" data-account-tab="finance">مالی</button><button type="button" data-account-tab="documents">اسناد</button><button type="button" data-account-tab="timeline">خط زمانی</button></nav>
    <div data-account-panel="overview">${overview}</div>
    <div data-account-panel="sales" hidden>${panel("فرصت‌های فروش", `<div class="table-wrap"><table class="workspace-table"><thead><tr><th>فرصت</th><th>مرحله</th><th>ارزش</th><th>احتمال</th><th>اقدام بعدی</th><th>تاریخ</th></tr></thead><tbody>${opportunities.map((item) => `<tr><td><strong>${item.title}</strong><small>${item.id}</small></td><td>${badge(item.stage)}</td><td>${money(item.value)}</td><td>${new Intl.NumberFormat("fa-IR").format(item.probability)}٪</td><td>${item.nextAction}</td><td>${item.nextDate}</td></tr>`).join("")}</tbody></table></div>`)}</div>
    <div data-account-panel="requests" hidden>${panel("درخواست‌های خدمت", accountRequests(state, requests))}</div>
    <div data-account-panel="finance" hidden>${panel("مالی و اعتبار", `<div class="account-finance-grid"><dl class="financial-summary"><div><dt>ارزش رابطه</dt><dd>${money(customer.balance)}</dd></div><div><dt>اعتبار</dt><dd>${money(customer.credit)}</dd></div></dl><div class="table-wrap"><table class="workspace-table"><thead><tr><th>شناسه</th><th>نوع</th><th>مبلغ</th><th>وضعیت</th><th>تاریخ</th></tr></thead><tbody>${transactions.map((item) => `<tr><td>${item.id}</td><td>${item.type}</td><td>${money(item.amount)}</td><td>${badge(item.status)}</td><td>${item.date}</td></tr>`).join("")}</tbody></table></div></div>`)}</div>
    <div data-account-panel="documents" hidden>${panel("اسناد و فایل‌ها", `<div class="table-wrap"><table class="workspace-table"><thead><tr><th>نام فایل</th><th>نوع</th><th>نسخه</th><th>بارگذار</th><th>تاریخ</th><th>وضعیت</th></tr></thead><tbody>${documents.map((item) => `<tr><td><strong>${item.name}</strong></td><td>${item.type}</td><td>${item.version}</td><td>${item.uploader}</td><td>${item.date}</td><td>${badge(item.status)}</td></tr>`).join("")}</tbody></table></div>`)}</div>
    <div data-account-panel="timeline" hidden>${panel("خط زمانی کامل رابطه", accountTimeline(activities))}</div>`;
  return appShell({ content, activePath: "/customers/detail", title: "پروندهٔ مشتری" });
}

function stageIndex(stage) {
  return ["اطلاعات", "مدارک", "پیشنهاد", "پرداخت", "اجرا", "تحویل"].indexOf(stage);
}

function requestStages(request) {
  const stages = ["اطلاعات", "مدارک", "پیشنهاد", "پرداخت", "اجرا", "تحویل"];
  const current = Math.max(0, stageIndex(request.stage));
  return `<ol class="request-stage-rail">${stages.map((stage, index) => `<li class="${index < current ? "is-complete" : index === current ? "is-current" : ""}"><span>${index < current ? icon("check", { size: 13 }) : ""}</span><strong>${stage}</strong></li>`).join("")}</ol>`;
}

function executionSteps(service, request) {
  const current = request.status === "تحویل‌شده" ? service.stages.length : request.status === "در حال اجرا" ? Math.min(2, service.stages.length - 1) : 0;
  return `<div class="execution-list">${service.stages.map((step, index) => `<article><b>${new Intl.NumberFormat("fa-IR").format(index + 1)}</b><div><strong>${step}</strong><small>${index < current ? "تکمیل شده" : index === current ? "در حال انجام" : "در انتظار"}</small></div>${badge(index < current ? "تکمیل‌شده" : index === current ? "در حال اجرا" : "در انتظار")}</article>`).join("")}</div>`;
}

export function renderRequestDetailPage() {
  const state = readDemoState();
  const request = state.requests.find((item) => item.id === state.selectedRequestId) ?? state.requests[0];
  const customer = state.customers.find((item) => item.id === request.accountId);
  const service = serviceCatalog.find((item) => item.id === request.serviceId) ?? serviceCatalog[0];
  const tasks = state.tasks.filter((item) => item.requestId === request.id);
  const transactions = state.transactions.filter((item) => item.requestId === request.id);
  const approvals = state.approvals.filter((item) => item.requestId === request.id);
  const activities = state.activities.filter((item) => item.requestId === request.id);
  const remaining = Math.max(0, request.price - request.discount - request.paid - request.creditUsed);
  const paymentDisabled = request.documents.some((item) => item.status !== "دریافت‌شده") || request.price <= 0 || request.paymentStatus === "پرداخت‌شده";
  const assignDisabled = request.paymentStatus !== "پرداخت‌شده" || ["در حال اجرا", "تحویل‌شده"].includes(request.status);
  const deliveryDisabled = request.status !== "در حال اجرا";

  const primaryAction = request.status === "منتظر اطلاعات" || request.status === "منتظر پیشنهاد"
    ? `<button type="button" class="button button--primary" data-request-action="documents">تکمیل مدارک و پیشنهاد</button>`
    : request.paymentStatus !== "پرداخت‌شده" && request.price > 0
      ? `<button type="button" class="button button--primary" data-request-action="payment">ثبت پرداخت نمایشی</button>`
      : !["در حال اجرا", "تحویل‌شده"].includes(request.status)
        ? `<button type="button" class="button button--primary" data-request-action="assign">تخصیص و شروع اجرا</button>`
        : request.status === "در حال اجرا"
          ? `<button type="button" class="button button--primary" data-request-action="deliver">ثبت نتیجه و تحویل</button>`
          : `<a data-link class="button button--primary" href="/customers/detail">دیدن سابقهٔ مشتری</a>`;

  const content = `
    <header class="request-detail-header">
      <div><div>${badge(request.status)}<small>${request.referenceId}</small></div><h1>${request.title}</h1><p>${customerLink(customer)}</p></div>
      <div class="request-detail-header__actions"><button type="button" class="button button--outline" data-request-action="payment" ${paymentDisabled ? "disabled" : ""}>${icon("bank", { size: 16 })} ثبت پرداخت</button><button type="button" class="button button--outline" data-request-action="assign" ${assignDisabled ? "disabled" : ""}>${icon("users", { size: 16 })} تخصیص کار</button><button type="button" class="button button--primary" data-request-action="deliver" ${deliveryDisabled ? "disabled" : ""}>${icon("check", { size: 16 })} ثبت نتیجه</button></div>
    </header>
    ${requestStages(request)}
    ${panel("اطلاعات کلی درخواست", `<dl class="request-summary"><div><dt>مشتری</dt><dd>${customer?.name ?? "—"}</dd><small>${request.contact}</small></div><div><dt>خدمت</dt><dd>${service.title}</dd><small>${request.owner}</small></div><div><dt>کانال ثبت</dt><dd>${request.channel}</dd><small>هدف: ${request.targetDate}</small></div><div><dt>SLA</dt><dd>${request.sla}</dd><small>${badge(request.operationsStatus)}</small></div><div><dt>مبلغ خدمت</dt><dd>${money(request.price)}</dd><small>${badge(request.paymentStatus)}</small></div></dl>`)}
    <div class="request-detail-grid">
      ${panel("مدارک موردنیاز", `<div class="document-status-list">${request.documents.map((document) => `<article><span>${icon("document", { size: 16 })}</span><div><strong>${document.name}</strong><small>${document.date}</small></div>${badge(document.status)}</article>`).join("")}</div>${request.documents.some((item) => item.status !== "دریافت‌شده") ? `<div class="panel-alert panel-alert--danger">${icon("bell", { size: 17 })}<div><strong>مدرک هنوز کامل نیست.</strong><span>تکمیل مدارک، وضعیت و اقدام بعدی را به‌روز می‌کند.</span></div><button type="button" class="button button--outline" data-request-action="documents">تکمیل در دمو</button></div>` : ""}`)}
      ${panel("فهرست کارها", `<div class="mini-table">${tasks.map((task) => `<article><div><strong>${task.title}</strong><small>${task.id}</small></div><span>${task.owner}</span><time>${task.due}</time>${badge(task.status)}</article>`).join("") || `<p>کاری برای این درخواست ثبت نشده است.</p>`}</div>`)}
      ${panel("وضعیت پرداخت و اعتبار", `<dl class="financial-summary"><div><dt>مبلغ کل</dt><dd>${money(request.price)}</dd></div><div><dt>پرداخت‌شده</dt><dd>${money(request.paid)}</dd></div><div><dt>اعتبار مصرف‌شده</dt><dd>${money(request.creditUsed)}</dd></div><div><dt>باقی‌مانده</dt><dd class="${remaining ? "danger-text" : "success-text"}">${money(remaining)}</dd></div></dl>${transactions.map((item) => `<div class="transaction-line"><span>${item.type}</span><strong>${money(item.amount)}</strong>${badge(item.status)}</div>`).join("")}`)}
      ${panel("مراحل اجرا", executionSteps(service, request))}
      ${panel("تأیید انسانی", `<div class="approval-list">${approvals.map((approval) => `<article><div><strong>${approval.subject}</strong><p>${approval.reason}</p><small>${approval.requester} ← ${approval.approver}</small></div>${badge(approval.decision)}${approval.decision === "منتظر تصمیم" ? `<button type="button" class="button button--outline" data-request-action="approve">ثبت تأیید</button>` : ""}</article>`).join("") || `<p>این درخواست در مرحلهٔ جاری تأیید بازی ندارد.</p>`}</div>`)}
      ${panel("ارتباطات و رویدادهای درخواست", `<div class="request-events">${activities.map((event) => `<article><i class="dot dot--${event.tone}"></i><time>${event.time}</time><div><strong>${event.title}</strong><p>${event.detail}</p><small>${event.actor}</small></div></article>`).join("") || `<p>هنوز رویدادی ثبت نشده است.</p>`}</div>`)}
    </div>
    <section class="next-action-bar">${icon("signal", { size: 22 })}<div><small>گام بعدی</small><strong>${request.nextAction}</strong>${request.outcome ? `<p>${request.outcome}</p>` : ""}</div>${primaryAction}</section>`;
  return appShell({ content, activePath: "/requests/detail", title: "جزئیات درخواست" });
}

export function mountDetailPages(rerender) {
  document.querySelectorAll("[data-customer-id]").forEach((link) => link.addEventListener("click", () => setSelectedCustomerId(link.getAttribute("data-customer-id") ?? "arya-sanat")));
  document.querySelectorAll("[data-account-tab]").forEach((button) => button.addEventListener("click", () => {
    const tab = button.getAttribute("data-account-tab");
    document.querySelectorAll("[data-account-tab]").forEach((item) => item.setAttribute("aria-selected", String(item === button)));
    document.querySelectorAll("[data-account-panel]").forEach((panel) => panel.toggleAttribute("hidden", panel.getAttribute("data-account-panel") !== tab));
  }));
  document.querySelectorAll("[data-request-id]").forEach((link) => link.addEventListener("click", () => setSelectedRequestId(link.getAttribute("data-request-id") ?? "rah-1405-0284")));
  document.querySelectorAll("[data-request-action]").forEach((button) => button.addEventListener("click", () => {
    const state = readDemoState();
    const requestId = state.selectedRequestId;
    const action = button.getAttribute("data-request-action");
    if (action === "documents") completeRequestDocuments(requestId);
    if (action === "payment") registerPayment(requestId);
    if (action === "assign") assignAndStartRequest(requestId);
    if (action === "approve") approveRequest(requestId);
    if (action === "deliver") deliverRequest(requestId);
    rerender();
  }));
}
