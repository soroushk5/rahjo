import { appShell } from "../../app/appShell.js";
import { icon } from "../../components/icons.js";
import { verificationServices } from "../../data/demoData.js";
import {
  canContinue,
  completeVerification,
  createVerificationState,
  nextVerificationStep,
  previousVerificationStep,
  selectService,
  updateVerificationFields
} from "../../domain/verification.js";
import { escapeHtml, on } from "../../lib/html.js";
import { MockVerificationGateway } from "../../services/verificationGateway.js";

let state = createVerificationState();
const gateway = new MockVerificationGateway();

const stepOrder = ["service", "details", "review", "result"];
const stepLabels = ["نوع درخواست", "اطلاعات", "تأیید", "نتیجه"];

function stepper() {
  const activeIndex = stepOrder.indexOf(state.step);
  return `<div class="request-stepper">${stepLabels.map((label, index) => `<div class="request-step" data-active="${index <= activeIndex}"><span class="request-step__number">${index + 1}</span><span>${label}</span></div>`).join("")}</div>`;
}

function serviceStep() {
  const options = verificationServices.map((service) => `
    <button class="service-option" type="button" data-service-id="${service.id}" aria-pressed="${state.payload.serviceId === service.id}">
      <span class="service-option__icon" aria-hidden="true">${icon(service.icon)}</span>
      <strong>${service.title}</strong><small>${service.description}</small>
    </button>`).join("");
  return `<h1>درخواست احراز یا استعلام</h1><p class="muted">نوع درخواست نمایشی را انتخاب کنید. اتصال واقعی پس از عبور از ممیزی و قرارداد فعال می‌شود.</p><div class="service-options">${options}</div><div class="request-note">در این MVP فقط تجربه و معماری جریان تست می‌شود؛ هیچ داده‌ای ارسال یا ذخیره نمی‌شود.</div>`;
}

function detailsStep() {
  return `<h1>اطلاعات درخواست</h1><p class="muted">برای نمونه، فقط ساختار فرم و اعتبارسنجی محلی نمایش داده می‌شود.</p><form id="verification-form" class="request-form"><div class="field"><label for="national-id">کد ملی نمونه</label><input id="national-id" name="nationalId" inputmode="numeric" maxlength="10" value="${escapeHtml(state.payload.nationalId)}" placeholder="۱۰ رقم" /></div><div class="field"><label for="mobile">شماره موبایل نمونه</label><input id="mobile" name="mobile" inputmode="tel" maxlength="11" value="${escapeHtml(state.payload.mobile)}" placeholder="09xxxxxxxxx" /></div></form>`;
}

function reviewStep() {
  const service = verificationServices.find((item) => item.id === state.payload.serviceId);
  return `<h1>بازبینی درخواست</h1><p class="muted">پیش از ارسال، جزئیات نمونه را بررسی کنید.</p><div class="request-note"><strong>خدمت:</strong> ${escapeHtml(service?.title ?? "—")}<br/><strong>کد ملی:</strong> <span class="en">${escapeHtml(state.payload.nationalId)}</span><br/><strong>موبایل:</strong> <span class="en">${escapeHtml(state.payload.mobile)}</span></div>`;
}

function resultStep() {
  return `<div class="success-state"><div class="success-state__icon">${icon("check")}</div><h1>درخواست نمایشی ثبت شد</h1><p class="muted">شناسه پیگیری: <strong class="en">${escapeHtml(state.referenceId ?? "—")}</strong></p><button id="restart-request" class="button button--secondary" type="button">شروع درخواست جدید</button></div>`;
}

function currentStepMarkup() {
  if (state.step === "service") return serviceStep();
  if (state.step === "details") return detailsStep();
  if (state.step === "review") return reviewStep();
  return resultStep();
}

function actions() {
  if (state.step === "result") return "";
  const isFirst = state.step === "service";
  const isReview = state.step === "review";
  return `<div class="request-actions">${isFirst ? "" : '<button id="previous-step" class="button button--secondary" type="button">مرحله قبل</button>'}<button id="next-step" class="button button--primary" type="button" ${canContinue(state) ? "" : "disabled"}>${isReview ? "ثبت نمایشی" : "ادامه"}</button></div>`;
}

export function renderRequestPage() {
  const content = `<section class="request-page">${stepper()}<article class="request-card card">${currentStepMarkup()}${actions()}</article></section>`;
  return appShell({ content, activePath: "/request", title: "درخواست جدید" });
}

/** @param {() => void} rerender */
export function mountRequestPage(rerender) {
  document.querySelectorAll("[data-service-id]").forEach((button) => {
    on(button, "click", () => {
      const serviceId = button.getAttribute("data-service-id");
      if (!serviceId) return;
      state = selectService(state, serviceId);
      rerender();
    });
  });

  const form = document.querySelector("#verification-form");
  on(form, "input", (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    state = updateVerificationFields(state, { [event.target.name]: event.target.value });
    const nextButton = document.querySelector("#next-step");
    if (nextButton instanceof HTMLButtonElement) nextButton.disabled = !canContinue(state);
  });

  on(document.querySelector("#previous-step"), "click", () => {
    state = previousVerificationStep(state);
    rerender();
  });

  on(document.querySelector("#next-step"), "click", async () => {
    if (!canContinue(state)) return;
    if (state.step !== "review") {
      state = nextVerificationStep(state);
      rerender();
      return;
    }
    const nextButton = document.querySelector("#next-step");
    if (nextButton instanceof HTMLButtonElement) {
      nextButton.disabled = true;
      nextButton.textContent = "در حال ثبت…";
    }
    const response = await gateway.submit({
      serviceId: state.payload.serviceId ?? "unknown",
      nationalId: state.payload.nationalId,
      mobile: state.payload.mobile
    });
    state = completeVerification(state, response.referenceId);
    rerender();
  });

  on(document.querySelector("#restart-request"), "click", () => {
    state = createVerificationState();
    rerender();
  });
}
