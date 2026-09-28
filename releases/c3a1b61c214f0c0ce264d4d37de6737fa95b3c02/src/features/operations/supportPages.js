// @ts-nocheck
import { appShell } from "../../app/appShell.js";
import { icon } from "../../components/icons.js";
import { automationRules, dataQualityIssues, serviceCatalog } from "../../data/phaseOneData.js";
import { approveRequest, readDemoState, resetDemoState, setSelectedRequestId } from "../../services/phaseOneStore.js";
import { badge, customerLink, customerName, money, pageHeader, panel, requestLink, serviceName } from "./shared.js";

export function renderOperationsPage() {
  const state = readDemoState();
  const columns = [
    ["آماده اجرا", state.requests.filter((item) => ["آماده اجرا", "منتظر پرداخت"].includes(item.status))],
    ["در حال اجرا", state.requests.filter((item) => item.status === "در حال اجرا")],
    ["نیازمند اقدام مشتری", state.requests.filter((item) => item.status === "منتظر اطلاعات")],
    ["آماده تحویل", state.requests.filter((item) => ["آماده تحویل", "تحویل‌شده"].includes(item.status))]
  ];
  const content = `
    ${pageHeader("عملیات و گردش‌کار", "صف اجرای خدمت، مرحلهٔ جاری، مسئول، SLA و تأییدهای انسانی در یک نمای عملیاتی.", `<button type="button" class="button button--outline">نمای گردش‌کارها</button><button type="button" class="button button--primary">قاعدهٔ جدید</button>`)}
    <div class="operations-board">${columns.map(([title, requests]) => `<section><header><strong>${title}</strong><span>${new Intl.NumberFormat("fa-IR").format(requests.length)}</span></header>${requests.map((request) => `<article><div>${badge(request.operationsStatus)}<small>${request.referenceId}</small></div><h3>${request.title}</h3><p>${customerName(state, request.accountId)}</p><dl><div><dt>مسئول</dt><dd>${request.owner}</dd></div><div><dt>هدف</dt><dd>${request.targetDate}</dd></div></dl><a data-link data-request-id="${request.id}" href="/requests/detail">بازکردن درخواست ${icon("arrow", { size: 14 })}</a></article>`).join("") || `<p class="pipeline-empty">درخواستی در این مرحله نیست.</p>`}</section>`).join("")}</div>
    <div class="dashboard-split">
      ${panel("تأییدهای در انتظار", `<div class="approval-list">${state.approvals.map((approval) => `<article><div><strong>${approval.subject}</strong><p>${approval.reason}</p><small>${approval.requester} ← ${approval.approver}</small></div>${badge(approval.decision)}${approval.decision === "منتظر تصمیم" ? `<button type="button" class="button button--outline" data-approve-request="${approval.requestId}">تأیید</button>` : ""}</article>`).join("")}</div>`)}
      ${panel("قواعد فعال", `<div class="automation-list">${automationRules.map((rule) => `<article><span>${icon("workflow", { size: 17 })}</span><div><strong>${rule.title}</strong><small>${rule.trigger} ← ${rule.action}</small></div>${badge(rule.status)}</article>`).join("")}</div>`, `<a data-link class="text-link" href="/settings">تنظیم گردش‌کار ${icon("arrow", { size: 14 })}</a>`)}
    </div>`;
  return appShell({ content, activePath: "/operations", title: "عملیات و گردش‌کار" });
}

export function renderFinancePage() {
  const state = readDemoState();
  const billed = state.requests.reduce((sum, item) => sum + item.price - item.discount, 0);
  const paid = state.requests.reduce((sum, item) => sum + item.paid + item.creditUsed, 0);
  const pending = Math.max(0, billed - paid);
  const content = `
    ${pageHeader("مالی و اعتبار", "هدف این ماژول حسابداری کامل نیست؛ رابطهٔ روشن میان قیمت، تأیید، پرداخت و اجرای خدمت است.", `<button type="button" class="button button--outline">افزایش اعتبار</button><button type="button" class="button button--primary">ثبت پرداخت دستی</button>`)}
    <div class="finance-metrics"><article><span>${icon("document")}</span><small>مبلغ درخواست‌ها</small><strong>${money(billed)}</strong></article><article><span>${icon("check")}</span><small>پرداخت و اعتبار مصرف‌شده</small><strong>${money(paid)}</strong></article><article><span>${icon("clock")}</span><small>مبلغ در انتظار</small><strong>${money(pending)}</strong></article><article><span>${icon("bank")}</span><small>اعتبار مشتریان</small><strong>${money(state.customers.reduce((sum, item) => sum + item.credit, 0))}</strong></article></div>
    ${panel("دریافتنی‌های درخواست", `<div class="table-wrap"><table class="workspace-table"><thead><tr><th>درخواست</th><th>مشتری</th><th>مبلغ</th><th>تخفیف</th><th>پرداخت‌شده</th><th>مانده</th><th>وضعیت</th></tr></thead><tbody>${state.requests.filter((item) => item.price > 0).map((request) => `<tr><td><strong>${requestLink(request)}</strong><small>${request.title}</small></td><td>${customerName(state, request.accountId)}</td><td>${money(request.price)}</td><td>${money(request.discount)}</td><td>${money(request.paid + request.creditUsed)}</td><td>${money(Math.max(0, request.price - request.discount - request.paid - request.creditUsed))}</td><td>${badge(request.paymentStatus)}</td></tr>`).join("")}</tbody></table></div>`)}
    <div class="dashboard-split">
      ${panel("اعتبار مشتریان", `<div class="credit-list">${state.customers.map((customer) => `<article><div><strong>${customerLink(customer)}</strong><small>${customer.status}</small></div><span>${money(customer.credit)}</span></article>`).join("")}</div>`)}
      ${panel("آخرین تراکنش‌ها", `<div class="transaction-list">${state.transactions.map((transaction) => `<article><div><strong>${transaction.type}</strong><small>${customerName(state, transaction.accountId)} · ${transaction.date}</small></div><span>${money(transaction.amount)}</span>${badge(transaction.status)}</article>`).join("")}</div>`)}
    </div>`;
  return appShell({ content, activePath: "/finance", title: "مالی و اعتبار" });
}

export function renderDocumentsPage() {
  const state = readDemoState();
  const content = `
    ${pageHeader("اسناد", "هر فایل نام، نوع، نسخه، بارگذار، تاریخ و ارتباط روشن با مشتری یا درخواست دارد.", `<button type="button" class="button button--primary">افزودن فایل نمایشی</button>`)}
    <div class="summary-strip"><span><b>${new Intl.NumberFormat("fa-IR").format(state.documents.length)}</b> فایل</span><span><b>${new Intl.NumberFormat("fa-IR").format(state.documents.filter((item) => item.status === "معتبر").length)}</b> معتبر</span><span><b>${new Intl.NumberFormat("fa-IR").format(state.documents.filter((item) => item.status === "نیازمند اصلاح").length)}</b> نیازمند اصلاح</span><span><b>${new Intl.NumberFormat("fa-IR").format(new Set(state.documents.map((item) => item.accountId)).size)}</b> مشتری مرتبط</span></div>
    ${panel("فایل‌ها و نسخه‌ها", `<div class="table-toolbar"><label class="table-search">${icon("search", { size: 16 })}<input data-document-query placeholder="جست‌وجوی نام، نوع، مشتری یا درخواست…" /></label><div class="filter-buttons"><button type="button" data-document-filter="همه" aria-pressed="true">همه</button><button type="button" data-document-filter="معتبر">معتبر</button><button type="button" data-document-filter="نیازمند اصلاح">نیازمند اصلاح</button><button type="button" data-document-filter="تحویل‌شده">نتیجه</button></div></div><div class="table-wrap"><table class="workspace-table"><thead><tr><th>نام فایل</th><th>نوع</th><th>نسخه</th><th>مشتری</th><th>درخواست</th><th>بارگذار</th><th>تاریخ</th><th>وضعیت</th></tr></thead><tbody>${state.documents.map((document) => `<tr data-document-row data-status="${document.status}" data-search="${document.name} ${document.type} ${customerName(state, document.accountId)} ${document.requestId}"><td><div class="file-cell"><span>${icon("document", { size: 17 })}</span><strong>${document.name}</strong></div></td><td>${document.type}</td><td>${document.version}</td><td>${customerName(state, document.accountId)}</td><td>${state.requests.find((item) => item.id === document.requestId)?.referenceId ?? "—"}</td><td>${document.uploader}</td><td>${document.date}</td><td>${badge(document.status)}</td></tr>`).join("")}</tbody></table></div>`)}
  `;
  return appShell({ content, activePath: "/documents", title: "اسناد" });
}

function bar(label, value, max, tone = "teal") {
  return `<div class="report-bar"><span>${label}</span><div><i class="bar--${tone}" style="--value:${Math.round((value / max) * 100)}%"></i></div><strong>${new Intl.NumberFormat("fa-IR").format(value)}</strong></div>`;
}

export function renderReportsPage() {
  const state = readDemoState();
  const content = `
    ${pageHeader("گزارش‌ها", "پاسخ روشن به پرسش‌های پایهٔ فروش، عملیات، مشتری و مالی؛ بدون BI پیچیده.", `<div class="period-switch"><button aria-pressed="true">این ماه</button><button>فصل جاری</button><button>سال جاری</button></div>`)}
    <nav class="report-tabs" role="tablist"><button type="button" data-report-tab="sales" aria-selected="true">فروش</button><button type="button" data-report-tab="operations">عملیات</button><button type="button" data-report-tab="customers">مشتری</button><button type="button" data-report-tab="finance">مالی پایه</button></nav>
    <div data-report-panel="sales"><div class="report-grid">${panel("ارزش مسیر فروش بر اساس مرحله", `<div class="report-bars">${bar("نیازسنجی", 21, 48, "blue")}${bar("واجد شرایط", 8, 48, "blue")}${bar("پیشنهاد", 13, 48)}${bar("مذاکره", 48, 48)}</div>`)}${panel("شاخص‌های فروش", `<dl class="performance-list"><div><dt>سرنخ جدید</dt><dd>۳۲</dd></div><div><dt>فرصت باز</dt><dd>${new Intl.NumberFormat("fa-IR").format(state.opportunities.length)}</dd></div><div><dt>فروش برنده</dt><dd>۹</dd></div><div><dt>نرخ تبدیل</dt><dd>۲۸٪</dd></div></dl>`)}</div>${panel("فروش بر اساس خدمت", `<div class="table-wrap"><table class="workspace-table"><thead><tr><th>خدمت</th><th>فرصت</th><th>ارزش</th><th>برنده</th><th>نرخ تبدیل</th></tr></thead><tbody>${serviceCatalog.slice(0, 4).map((service, index) => `<tr><td>${service.title}</td><td>${new Intl.NumberFormat("fa-IR").format(8 - index)}</td><td>${money((8 - index) * 340000000)}</td><td>${new Intl.NumberFormat("fa-IR").format(4 - Math.min(index, 3))}</td><td>${new Intl.NumberFormat("fa-IR").format(34 - index * 4)}٪</td></tr>`).join("")}</tbody></table></div>`)}</div>
    <div data-report-panel="operations" hidden><div class="report-grid">${panel("حجم درخواست بر اساس وضعیت", `<div class="report-bars">${bar("منتظر اطلاعات", 8, 26, "amber")}${bar("منتظر پرداخت", 5, 26, "amber")}${bar("در حال اجرا", 26, 26)}${bar("تحویل‌شده", 18, 26, "blue")}</div>`)}${panel("شاخص‌های عملیات", `<dl class="performance-list"><div><dt>متوسط زمان انجام</dt><dd>۸٫۴ روز</dd></div><div><dt>در SLA</dt><dd>۸۶٪</dd></div><div><dt>تأخیردار</dt><dd>۲</dd></div><div><dt>تحویل این ماه</dt><dd>۱۸</dd></div></dl>`)}</div></div>
    <div data-report-panel="customers" hidden><div class="report-grid">${panel("ترکیب مشتری", `<div class="report-bars">${bar("مشتری فعال", 74, 100)}${bar("مشتری تکراری", 52, 100, "blue")}${bar("مشتری جدید", 18, 100, "amber")}</div>`)}${panel("شاخص‌های مشتری", `<dl class="performance-list"><div><dt>مشتری جدید</dt><dd>۱۸</dd></div><div><dt>مشتری فعال</dt><dd>۷۴</dd></div><div><dt>خرید تکراری</dt><dd>۵۲٪</dd></div><div><dt>بدون تعامل ۳۰روزه</dt><dd>۶</dd></div></dl>`)}</div></div>
    <div data-report-panel="finance" hidden><div class="report-grid">${panel("وضعیت مبالغ", `<div class="report-bars">${bar("مبلغ درخواست‌ها", 100, 100, "blue")}${bar("پرداخت‌شده", 68, 100)}${bar("در انتظار", 24, 100, "amber")}${bar("اعتبار مصرف‌شده", 8, 100, "blue")}</div>`)}${panel("شاخص‌های مالی", `<dl class="performance-list"><div><dt>مبلغ درخواست‌ها</dt><dd>${money(state.requests.reduce((sum, item) => sum + item.price, 0))}</dd></div><div><dt>پرداخت‌شده</dt><dd>${money(state.requests.reduce((sum, item) => sum + item.paid, 0))}</dd></div><div><dt>اعتبار مصرف‌شده</dt><dd>${money(state.requests.reduce((sum, item) => sum + item.creditUsed, 0))}</dd></div></dl>`)}</div></div>`;
  return appShell({ content, activePath: "/reports", title: "گزارش‌ها" });
}

export function renderAuditPage() {
  const state = readDemoState();
  const content = `
    ${pageHeader("ممیزی و کیفیت داده", "ممیزی پاسخ می‌دهد چه اتفاقی، چه زمانی، توسط چه کسی و روی کدام رکورد رخ داده است.", `<button type="button" class="button button--outline">خروجی گزارش</button>`)}
    <nav class="report-tabs" role="tablist"><button type="button" data-audit-tab="events" aria-selected="true">تاریخچهٔ عملیات</button><button type="button" data-audit-tab="quality">کیفیت داده <span>${new Intl.NumberFormat("fa-IR").format(dataQualityIssues.length)}</span></button></nav>
    <div data-audit-panel="events">${panel("آخرین تغییرات و رخدادها", `<div class="audit-timeline">${state.activities.map((event) => `<article><time>${event.time}</time><i class="dot dot--${event.tone}"></i><div><strong>${event.title}</strong><p>${event.detail}</p><small>${event.type} · ${event.actor} · ${event.requestId || event.accountId}</small></div></article>`).join("")}</div>`)}</div>
    <div data-audit-panel="quality" hidden><div class="quality-summary"><article><span>${icon("bell")}</span><strong>${new Intl.NumberFormat("fa-IR").format(dataQualityIssues.filter((item) => item.status === "باز").length)}</strong><small>مشکل باز</small></article><article><span>${icon("workflow")}</span><strong>${new Intl.NumberFormat("fa-IR").format(dataQualityIssues.filter((item) => item.status === "در حال رفع").length)}</strong><small>در حال رفع</small></article><article><span>${icon("check")}</span><strong>۹۲٪</strong><small>کامل بودن اطلاعات پایه</small></article></div>${panel("موارد نیازمند اصلاح", `<div class="table-wrap"><table class="workspace-table"><thead><tr><th>نوع مشکل</th><th>رکورد</th><th>مسئول</th><th>شدت</th><th>وضعیت</th><th>اقدام</th></tr></thead><tbody>${dataQualityIssues.map((issue) => `<tr><td><strong>${issue.type}</strong><small>${issue.id}</small></td><td>${issue.record}</td><td>${issue.owner}</td><td>${badge(issue.severity)}</td><td>${badge(issue.status)}</td><td><button type="button" class="table-action">ساخت کار اصلاحی</button></td></tr>`).join("")}</tbody></table></div>`)}</div>`;
  return appShell({ content, activePath: "/audit", title: "ممیزی و کیفیت داده" });
}

export function renderSettingsPage() {
  const state = readDemoState();
  const tabs = ["کاربران و نقش‌ها", "فرایندها", "فرم و فیلد", "پیام و اعلان", "اتصال‌ها"];
  const content = `
    ${pageHeader("تنظیمات", "پیکربندی کاربران، نقش‌ها، خدمات، وضعیت‌ها، فرم‌ها و قواعد بدون تغییر کد.", `<button type="button" class="button button--outline" data-reset-demo>بازگردانی دادهٔ دمو</button><button type="button" class="button button--primary">ذخیرهٔ تنظیمات</button>`)}
    <div class="settings-layout"><nav>${tabs.map((tab, index) => `<button type="button" data-setting-tab="${index}" aria-selected="${index === 0}">${tab}</button>`).join("")}</nav><div>
      <section data-setting-panel="0">${panel("کاربران و نقش‌ها", `<div class="table-wrap"><table class="workspace-table"><thead><tr><th>کاربر</th><th>نقش</th><th>واحد</th><th>دامنهٔ دسترسی</th><th>وضعیت</th></tr></thead><tbody><tr><td><strong>نسترن احمدی</strong><small>nastaran@demo.example</small></td><td>مدیر عملیات</td><td>عملیات</td><td>مشتری، درخواست، کار، گزارش</td><td>${badge("فعال")}</td></tr><tr><td><strong>سارا کریمی</strong><small>sara@demo.example</small></td><td>فروش</td><td>فروش</td><td>مشتری و فرصت</td><td>${badge("فعال")}</td></tr><tr><td><strong>علی محمدی</strong><small>ali@demo.example</small></td><td>کارشناس</td><td>استقرار</td><td>کارهای تخصیص‌یافته</td><td>${badge("فعال")}</td></tr><tr><td><strong>ندا رضایی</strong><small>neda@demo.example</small></td><td>مالی</td><td>مالی</td><td>پیشنهاد، پرداخت، اعتبار</td><td>${badge("فعال")}</td></tr></tbody></table></div>`)}</section>
      <section data-setting-panel="1" hidden>${panel("مراحل و گردش‌کارها", `<div class="automation-detail-list">${automationRules.map((rule) => `<article><header><div><strong>${rule.title}</strong><small>${rule.id}</small></div>${badge(rule.status)}</header><dl><div><dt>شروع</dt><dd>${rule.trigger}</dd></div><div><dt>شرط</dt><dd>${rule.condition}</dd></div><div><dt>اقدام</dt><dd>${rule.action}</dd></div><div><dt>مسئول</dt><dd>${rule.owner}</dd></div><div><dt>آخرین اجرا</dt><dd>${rule.lastRun}</dd></div><div><dt>نتیجه</dt><dd>${rule.result}</dd></div></dl></article>`).join("")}</div>`)}</section>
      <section data-setting-panel="2" hidden>${panel("فرم‌ها و فیلدهای سفارشی", `<div class="config-cards"><article><strong>فرم مشتری</strong><span>۱۲ فیلد · ۳ فیلد الزامی</span><button>ویرایش</button></article><article><strong>فرم درخواست خدمت</strong><span>بر اساس خدمت · ۵ نسخه</span><button>ویرایش</button></article><article><strong>فرم نتیجه</strong><span>نتیجه، فایل خروجی و تاریخ تحویل</span><button>ویرایش</button></article></div>`)}</section>
      <section data-setting-panel="3" hidden>${panel("الگوهای پیام و اعلان", `<div class="config-cards"><article><strong>درخواست ثبت شد</strong><span>اعلان داخل سیستم · فعال</span><button>ویرایش</button></article><article><strong>مدرک ناقص است</strong><span>پیش‌نویس پیام مشتری · فعال</span><button>ویرایش</button></article><article><strong>نتیجه آمادهٔ تحویل است</strong><span>اعلان داخل سیستم · فعال</span><button>ویرایش</button></article></div>`)}</section>
      <section data-setting-panel="4" hidden>${panel("API و Connectorها", `<div class="connector-settings"><article><span>${icon("bank")}</span><div><strong>درگاه پرداخت</strong><p>برای نسخهٔ عملیاتی قابل اتصال؛ در دمو غیرفعال.</p></div>${badge("پیش‌نویس")}</article><article><span>${icon("message")}</span><div><strong>پیامک و ایمیل</strong><p>کانال مستقل با تاریخچهٔ ارتباط مشترک.</p></div>${badge("پیش‌نویس")}</article><article><span>${icon("link")}</span><div><strong>حسابداری و ERP</strong><p>Adapter مستقل از هسته و ارائه‌دهنده.</p></div>${badge("پیش‌نویس")}</article></div>`, "<small class=\"panel-note\">هیچ Credential واقعی در Front-end نگه‌داری نمی‌شود.</small>")}</section>
    </div></div>
    <div class="settings-footnote">${icon("shield", { size: 18 })}<div><strong>تغییرات مهم ثبت می‌شوند.</strong><span>در نسخهٔ عملیاتی، هر تغییر نقش، وضعیت، قیمت یا گردش‌کار یک رخداد ممیزی خواهد داشت.</span></div><small>${new Intl.NumberFormat("fa-IR").format(state.activities.length)} رخداد دمو</small></div>`;
  return appShell({ content, activePath: "/settings", title: "تنظیمات" });
}

export function mountSupportPages(rerender) {
  document.querySelectorAll("[data-request-id]").forEach((link) => link.addEventListener("click", () => setSelectedRequestId(link.getAttribute("data-request-id") ?? "rah-1405-0284")));
  document.querySelectorAll("[data-approve-request]").forEach((button) => button.addEventListener("click", () => {
    approveRequest(button.getAttribute("data-approve-request") ?? "");
    rerender();
  }));
  const documentQuery = document.querySelector("[data-document-query]");
  if (documentQuery instanceof HTMLInputElement) documentQuery.addEventListener("input", () => {
    const needle = documentQuery.value.trim().toLocaleLowerCase("fa");
    document.querySelectorAll("[data-document-row]").forEach((row) => row.toggleAttribute("hidden", Boolean(needle) && !(row.getAttribute("data-search") ?? "").toLocaleLowerCase("fa").includes(needle)));
  });
  document.querySelectorAll("[data-document-filter]").forEach((button) => button.addEventListener("click", () => {
    const filter = button.getAttribute("data-document-filter") ?? "همه";
    document.querySelectorAll("[data-document-filter]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    document.querySelectorAll("[data-document-row]").forEach((row) => row.toggleAttribute("hidden", filter !== "همه" && row.getAttribute("data-status") !== filter));
  }));
  for (const prefix of ["report", "audit", "setting"]) {
    document.querySelectorAll(`[data-${prefix}-tab]`).forEach((button) => button.addEventListener("click", () => {
      const tab = button.getAttribute(`data-${prefix}-tab`);
      document.querySelectorAll(`[data-${prefix}-tab]`).forEach((item) => item.setAttribute("aria-selected", String(item === button)));
      document.querySelectorAll(`[data-${prefix}-panel]`).forEach((panel) => panel.toggleAttribute("hidden", panel.getAttribute(`data-${prefix}-panel`) !== tab));
    }));
  }
  document.querySelector("[data-reset-demo]")?.addEventListener("click", () => {
    resetDemoState();
    rerender();
  });
}
