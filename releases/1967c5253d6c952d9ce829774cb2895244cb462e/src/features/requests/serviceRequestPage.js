// @ts-nocheck
import { siteShell } from "../../app/siteShell.js";
import { icon } from "../../components/icons.js";
import { serviceCatalog } from "../../data/phaseOneData.js";
import { clearRequestDraft, createServiceRequest, readDemoState, saveRequestDraft } from "../../services/phaseOneStore.js";
import { escapeHtml } from "../../lib/html.js";

const stepLabels = ["انتخاب خدمت", "اطلاعات", "مدارک و قیمت", "بازبینی", "ثبت شد"];

function emptyDraft() {
  return { step: 0, payload: { serviceId: serviceCatalog[0].id, organization: "", contact: "", role: "", phone: "", email: "", industry: "", need: "", channel: "وب‌سایت", documentsReady: false }, referenceId: null, requestId: null };
}

function draft() {
  const stored = readDemoState().requestDraft;
  return stored && Number.isInteger(stored.step) ? { ...emptyDraft(), ...stored, payload: { ...emptyDraft().payload, ...(stored.payload ?? {}) } } : emptyDraft();
}

function progress(current) {
  return `<ol class="request-progress">${stepLabels.map((label, index) => `<li class="${index < current ? "is-complete" : index === current ? "is-current" : ""}"><span>${index < current ? icon("check", { size: 14 }) : new Intl.NumberFormat("fa-IR").format(index + 1)}</span><strong>${label}</strong></li>`).join("")}</ol>`;
}

function serviceStep(state) {
  return `<div class="request-step"><header><h2>چه خدمتی نیاز دارید؟</h2><p>خدمت را انتخاب کنید تا زمان، مدارک و مدل قیمت‌گذاری مرتبط نمایش داده شود.</p></header><div class="request-service-options">${serviceCatalog.filter((item) => item.online).map((service) => `<button type="button" data-flow-service="${service.id}" aria-pressed="${state.payload.serviceId === service.id}"><span>${icon("settings")}</span><div><strong>${service.title}</strong><p>${service.summary}</p><small>${service.duration} · ${service.priceLabel}</small></div><i>${icon("check", { size: 15 })}</i></button>`).join("")}</div></div>`;
}

function detailsStep(state) {
  const p = state.payload;
  return `<div class="request-step"><header><h2>اطلاعات مشتری و نیاز</h2><p>این اطلاعات در دموی محلی برای ساخت پروفایل مشتری و درخواست استفاده می‌شود.</p></header><div class="form-grid"><label><span>نام مجموعه *</span><input name="organization" value="${escapeHtml(p.organization)}" required /></label><label><span>نام شخص تماس *</span><input name="contact" value="${escapeHtml(p.contact)}" required /></label><label><span>سمت</span><input name="role" value="${escapeHtml(p.role)}" /></label><label><span>شماره تماس *</span><input name="phone" value="${escapeHtml(p.phone)}" inputmode="tel" required /></label><label><span>ایمیل</span><input name="email" value="${escapeHtml(p.email)}" type="email" /></label><label><span>صنعت</span><input name="industry" value="${escapeHtml(p.industry)}" /></label><label><span>کانال ورود</span><select name="channel">${["وب‌سایت", "تماس", "پیام‌رسان", "معرفی", "اپراتور"].map((item) => `<option ${p.channel === item ? "selected" : ""}>${item}</option>`).join("")}</select></label><label class="form-grid__wide"><span>شرح نیاز *</span><textarea name="need" rows="4" required>${escapeHtml(p.need)}</textarea></label></div></div>`;
}

function documentsStep(state) {
  const service = serviceCatalog.find((item) => item.id === state.payload.serviceId) ?? serviceCatalog[0];
  return `<div class="request-step"><header><h2>مدارک، زمان و قیمت</h2><p>موارد زیر بر اساس تنظیمات همین خدمت نمایش داده شده‌اند.</p></header><div class="request-doc-layout"><section><h3>مدارک موردنیاز</h3><ul class="document-checklist">${service.documents.map((item, index) => `<li><span>${icon("document", { size: 17 })}</span><div><strong>${item}</strong><small>${index === 0 || state.payload.documentsReady ? "آمادهٔ ثبت" : "هنوز اضافه نشده"}</small></div><i class="status ${index === 0 || state.payload.documentsReady ? "status--success" : "status--warning"}">${index === 0 || state.payload.documentsReady ? "دریافت‌شده" : "نیازمند تکمیل"}</i></li>`).join("")}</ul><label class="check-field"><input name="documentsReady" type="checkbox" ${state.payload.documentsReady ? "checked" : ""} /><span>برای ادامهٔ دموی سریع، همهٔ مدارک را دریافت‌شده در نظر بگیر.</span></label></section><aside><h3>خلاصهٔ خدمت</h3><dl><div><dt>خدمت</dt><dd>${service.title}</dd></div><div><dt>زمان تقریبی</dt><dd>${service.duration}</dd></div><div><dt>مدل قیمت</dt><dd>${service.priceLabel}</dd></div><div><dt>مسئول</dt><dd>${service.owner}</dd></div><div><dt>خروجی</dt><dd>${service.output}</dd></div></dl><p>${icon("shield", { size: 16 })} هیچ فایل یا پرداخت واقعی در این دمو انجام نمی‌شود.</p></aside></div></div>`;
}

function reviewStep(state) {
  const service = serviceCatalog.find((item) => item.id === state.payload.serviceId) ?? serviceCatalog[0];
  return `<div class="request-step"><header><h2>بازبینی و ثبت درخواست</h2><p>پس از ثبت، مشتری، درخواست و کار پیگیری به‌صورت همزمان در دموی رهجو ساخته می‌شوند.</p></header><div class="review-grid"><section><h3>مشتری</h3><dl><div><dt>مجموعه</dt><dd>${escapeHtml(state.payload.organization)}</dd></div><div><dt>شخص تماس</dt><dd>${escapeHtml(state.payload.contact)}</dd></div><div><dt>تماس</dt><dd>${escapeHtml(state.payload.phone)}</dd></div><div><dt>کانال</dt><dd>${escapeHtml(state.payload.channel)}</dd></div></dl></section><section><h3>درخواست</h3><dl><div><dt>خدمت</dt><dd>${service.title}</dd></div><div><dt>نیاز</dt><dd>${escapeHtml(state.payload.need)}</dd></div><div><dt>مدارک</dt><dd>${state.payload.documentsReady ? "تکمیل‌شده" : "نیازمند پیگیری"}</dd></div><div><dt>قیمت</dt><dd>${service.priceLabel}</dd></div></dl></section></div><div class="review-note">${icon("check", { size: 18 })}<div><strong>بعد از ثبت چه اتفاقی می‌افتد؟</strong><span>یک کد پیگیری، درخواست خدمت، Task برای مسئول و رخداد Timeline ساخته می‌شود.</span></div></div></div>`;
}

function resultStep(state) {
  return `<div class="request-result"><span>${icon("check", { size: 30 })}</span><h2>درخواست با موفقیت در محیط نمایشی ثبت شد.</h2><p>این درخواست اکنون در فهرست درخواست‌ها، کارهای امروز و پروندهٔ مشتری دیده می‌شود.</p><div><small>کد پیگیری</small><strong>${state.referenceId}</strong></div><div class="button-row"><a data-link class="button button--primary" href="/login">ورود به محیط عملیاتی</a><a data-link class="button button--outline" href="/track-request">پیگیری با کد</a></div><button type="button" class="text-link" data-flow-restart>ثبت یک درخواست دیگر</button></div>`;
}

export function renderServiceRequestPage() {
  const state = draft();
  const body = [serviceStep, detailsStep, documentsStep, reviewStep][state.step]?.(state) ?? resultStep(state);
  return siteShell({ activePath: "/request-service", content: `<section class="request-flow-page"><div class="container"><header class="request-flow-page__header"><div><a data-link href="/services" class="text-link">${icon("arrow", { size: 16 })} بازگشت به خدمات</a><h1>ثبت درخواست خدمت</h1><p>از انتخاب خدمت تا دریافت کد پیگیری؛ یک جریان روشن و کوتاه.</p></div><span>پیش‌نویس در همین مرورگر ذخیره می‌شود</span></header>${progress(state.step)}<form id="service-request-form" class="request-flow-card" novalidate>${body}${state.step < 4 ? `<div id="flow-error" class="form-error" role="alert" hidden></div><footer><button type="button" class="button button--ghost" data-flow-back ${state.step === 0 ? "disabled" : ""}>مرحلهٔ قبل</button><button type="button" class="button button--primary" data-flow-next>${state.step === 3 ? "ثبت درخواست" : "ادامه"} ${icon("arrow", { size: 15 })}</button></footer>` : ""}</form></div></section>` });
}

export function mountServiceRequestPage(rerender) {
  const state = draft();
  document.querySelectorAll("[data-flow-service]").forEach((button) => button.addEventListener("click", () => {
    state.payload.serviceId = button.getAttribute("data-flow-service") ?? serviceCatalog[0].id;
    saveRequestDraft(state);
    rerender();
  }));

  const form = document.querySelector("#service-request-form");
  if (form instanceof HTMLFormElement) form.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;
    state.payload[target.name] = target instanceof HTMLInputElement && target.type === "checkbox" ? target.checked : target.value;
    saveRequestDraft(state);
  });

  document.querySelector("[data-flow-back]")?.addEventListener("click", () => {
    state.step = Math.max(0, state.step - 1);
    saveRequestDraft(state);
    rerender();
  });

  document.querySelector("[data-flow-next]")?.addEventListener("click", () => {
    const error = document.querySelector("#flow-error");
    const showError = (message) => { if (error instanceof HTMLElement) { error.hidden = false; error.textContent = message; } };
    if (state.step === 1 && (!state.payload.organization.trim() || !state.payload.contact.trim() || !state.payload.phone.trim() || !state.payload.need.trim())) {
      showError("نام مجموعه، شخص تماس، شماره تماس و شرح نیاز را کامل کنید.");
      return;
    }
    if (state.step < 3) {
      state.step += 1;
      saveRequestDraft(state);
      rerender();
      return;
    }
    const request = createServiceRequest(state.payload);
    saveRequestDraft({ ...state, step: 4, referenceId: request.referenceId, requestId: request.id });
    rerender();
  });

  document.querySelector("[data-flow-restart]")?.addEventListener("click", () => {
    clearRequestDraft();
    rerender();
  });
}
