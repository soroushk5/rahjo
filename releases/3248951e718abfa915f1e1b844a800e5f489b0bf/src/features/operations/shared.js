// @ts-nocheck
import { icon } from "../../components/icons.js";
import { serviceCatalog } from "../../data/phaseOneData.js";
import { entityHref } from "../../app/entityRoutes.js";
import { escapeHtml } from "../../lib/html.js";

const moneyFormatter = new Intl.NumberFormat("fa-IR");

export function money(value) {
  return `${moneyFormatter.format(Number(value) || 0)} ریال`;
}

export function customerName(state, id) {
  return state.customers.find((item) => item.id === id)?.name ?? "مشتری نامشخص";
}

export function serviceName(id) {
  return serviceCatalog.find((item) => item.id === id)?.title ?? "خدمت نامشخص";
}

export function customerLink(customer) {
  if (!customer) return "مشتری نامشخص";
  const href = entityHref({ type: "customer", customerId: customer.id });
  return `<a data-link data-customer-id="${escapeHtml(customer.id)}" href="${escapeHtml(href)}">${escapeHtml(customer.name)}</a>`;
}

export function requestLink(request) {
  const href = entityHref({ type: "request", requestId: request.id });
  return `<a data-link data-request-id="${escapeHtml(request.id)}" href="${escapeHtml(href)}">${escapeHtml(request.referenceId)}</a>`;
}

export function emptyState(title, description) {
  return `<div class="empty-state">${icon("search", { size: 24 })}<strong>${title}</strong><p>${description}</p></div>`;
}

export function statusTone(value) {
  if (["تکمیل‌شده", "تحویل‌شده", "پرداخت‌شده", "ثبت‌شده", "معتبر", "تأیید‌شده", "مشتری فعال", "فعال", "موفق"].includes(value)) return "success";
  if (["منتظر اطلاعات", "منتظر پرداخت", "پرداخت ناقص", "در انتظار", "نیازمند اصلاح", "منتظر تصمیم", "پیش‌نویس", "عقب‌افتاده", "بالا"].includes(value)) return "warning";
  if (["لغوشده", "ردشده", "ناموفق", "فوری", "متوقف", "باز"].includes(value)) return "danger";
  return "progress";
}

export function badge(value) {
  return `<span class="status status--${statusTone(value)}">${value}</span>`;
}

export function pageHeader(title, description, actions = "") {
  return `<header class="workspace-heading"><div><h1>${title}</h1><p>${description}</p></div>${actions ? `<div class="workspace-heading__actions">${actions}</div>` : ""}</header>`;
}

export function panel(title, content, action = "", className = "") {
  return `<section class="workspace-panel ${className}"><header><div><h2>${title}</h2></div>${action}</header>${content}</section>`;
}
