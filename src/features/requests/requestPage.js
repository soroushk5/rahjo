import { appShell } from "../../app/appShell.js";
import { icon } from "../../components/icons.js";
import { dataClusters } from "../../data/siteContent.js";
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
import { MockAccessRequestGateway } from "../../services/verificationGateway.js";
import {
  addPrototypeAccessRequest,
  clearRequestDraft,
  getPreferredClusterId,
  loadRequestDraft,
  saveRequestDraft,
  setPreferredClusterId
} from "../../services/prototypeStore.js";

const storedDraft = loadRequestDraft();
let state = storedDraft ?? createVerificationState();
const gateway = new MockAccessRequestGateway();
const stepOrder = ["service", "details", "review", "result"];
const stepLabels = ["انتخاب خوشه", "تعریف کاربرد", "بررسی دسترسی", "ثبت درخواست"];

function hydratePreferredCluster() {
  if (state.step !== "service") return;
  const preferred = getPreferredClusterId();
  if (preferred && preferred !== state.payload.serviceId && verificationServices.some((service) => service.id === preferred)) {
    state = selectService(state, preferred);
    saveRequestDraft(state);
  }
}

function persistDraft() {
  if (state.step === "result") return;
  saveRequestDraft(state);
}

function stepper() {
  const activeIndex = stepOrder.indexOf(state.step);
  return `
    <div class="request-stepper">
      ${stepLabels
        .map(
          (label, index) => `
            <div class="request-step" data-active="${index <= activeIndex}">
              <span class="request-step__number">${index + 1}</span>
              <span>${label}</span>
            </div>`
        )
        .join("")}
    </div>`;
}

function serviceStep() {
  const options = verificationServices
    .map(
      (service) => `
        <button
          class="service-option"
          type="button"
          data-service-id="${service.id}"
          aria-pressed="${state.payload.serviceId === service.id}"
        >
          <span class="service-option__icon">${icon(service.icon, { size: 23 })}</span>
          <strong>${service.title}</strong>
          <small>${service.description}</small>
          <span class="option-arrow">${icon("arrow")}</span>
        </button>`
    )
    .join("");

  return `
    <div class="request-intro">
      <p class="eyebrow">ACCESS REQUEST</p>
      <h1>به کدام خوشه داده نیاز دارید؟</h1>
      <p>انتخاب شما فقط شروع ارزیابی است و به معنی فعال‌بودن سرویس یا تأیید دسترسی نیست.</p>
      <div class="request-persistence">انتخاب و فرم این نسخه به‌صورت محلی در مرورگر شما ذخیره می‌شود.</div>
    </div>
    <div class="service-options">${options}</div>`;
}

function detailsStep() {
  const organizationLength = state.payload.organization.trim().length;
  const purposeLength = state.payload.purpose.trim().length;
  return `
    <div class="request-intro">
      <p class="eyebrow">PURPOSE & VOLUME</p>
      <h1>کاربرد سازمانی را دقیق تعریف کنید.</h1>
      <p>در داده حساس، «چرا» و «چه مقدار» بخشی از تصمیم دسترسی هستند.</p>
      <div class="request-persistence">Draft این مرحله خودکار ذخیره می‌شود.</div>
    </div>
    <form id="verification-form" class="request-form">
      <div class="field">
        <label for="organization">نام سازمان</label>
        <input
          id="organization"
          name="organization"
          autocomplete="organization"
          value="${escapeHtml(state.payload.organization)}"
          placeholder="مثلاً شرکت بیمه نمونه"
        />
        <small id="organization-validation" data-validation>${organizationLength >= 3 ? "✓ حداقل اطلاعات لازم وارد شده" : "حداقل ۳ نویسه"}</small>
      </div>
      <div class="field">
        <label for="monthly-volume">حجم ماهانه مورد انتظار</label>
        <select id="monthly-volume" name="monthlyVolume">
          <option value="">انتخاب کنید</option>
          <option value="pilot" ${state.payload.monthlyVolume === "pilot" ? "selected" : ""}>پایلوت؛ کمتر از ۱۰۰۰ درخواست</option>
          <option value="small" ${state.payload.monthlyVolume === "small" ? "selected" : ""}>۱ تا ۱۰ هزار درخواست</option>
          <option value="medium" ${state.payload.monthlyVolume === "medium" ? "selected" : ""}>۱۰ تا ۱۰۰ هزار درخواست</option>
          <option value="large" ${state.payload.monthlyVolume === "large" ? "selected" : ""}>بیش از ۱۰۰ هزار درخواست</option>
        </select>
      </div>
      <div class="field field--wide">
        <label for="purpose">شرح کاربرد</label>
        <textarea
          id="purpose"
          name="purpose"
          rows="5"
          placeholder="داده در کدام مرحله، برای چه تصمیمی و توسط چه نقشی استفاده می‌شود؟"
        >${escapeHtml(state.payload.purpose)}</textarea>
        <small id="purpose-validation" data-validation>${purposeLength >= 12 ? "✓ شرح برای ارزیابی اولیه کافی است" : `${purposeLength}/12 نویسه حداقل`}</small>
        <small>اطلاعات واقعی شخص یا credential در این نسخه وارد نکنید.</small>
      </div>
    </form>`;
}

/** @param {string} value */
function volumeLabel(value) {
  const labels = /** @type {Record<string, string>} */ ({
    pilot: "پایلوت؛ کمتر از ۱۰۰۰",
    small: "۱ تا ۱۰ هزار",
    medium: "۱۰ تا ۱۰۰ هزار",
    large: "بیش از ۱۰۰ هزار"
  });
  return labels[value] ?? "—";
}

function reviewStep() {
  const service = verificationServices.find((item) => item.id === state.payload.serviceId);
  const cluster = dataClusters.find((item) => item.id === state.payload.serviceId);

  return `
    <div class="request-intro">
      <p class="eyebrow">ACCESS REVIEW</p>
      <h1>این درخواست هنوز مجوز دسترسی نیست.</h1>
      <p>اطلاعات زیر برای بررسی منبع، شرایط مشتری و دامنه مجاز استفاده ثبت می‌شود.</p>
    </div>
    <div class="review-ledger">
      <div><small>خوشه داده</small><strong>${escapeHtml(service?.title ?? "—")}</strong></div>
      <div><small>سطح حساسیت</small><strong>${escapeHtml(cluster?.sensitivity ?? "—")}</strong></div>
      <div><small>سازمان</small><strong>${escapeHtml(state.payload.organization)}</strong></div>
      <div><small>حجم ماهانه</small><strong>${volumeLabel(state.payload.monthlyVolume)}</strong></div>
      <div class="review-ledger__wide"><small>کاربرد اعلام‌شده</small><strong>${escapeHtml(state.payload.purpose)}</strong></div>
      <div class="review-ledger__wide"><small>نتیجه این مرحله</small><strong>ثبت برای بررسی؛ بدون API key و بدون دسترسی داده</strong></div>
    </div>
    <div class="request-note">${icon("shield")} فعال‌سازی واقعی به قرارداد منبع، مشتری مجاز، کنترل امنیتی و تأیید حقوقی وابسته است.</div>`;
}

function resultStep() {
  return `
    <div class="success-state">
      <div class="success-state__icon">${icon("check", { size: 32 })}</div>
      <p class="eyebrow">REQUEST REGISTERED</p>
      <h1>درخواست نمایشی ثبت شد.</h1>
      <p>شناسه پیگیری <strong class="en">${escapeHtml(state.referenceId ?? "—")}</strong></p>
      <div class="result-timeline">
        <span>خوشه انتخاب شد</span>
        <span>کاربرد ثبت شد</span>
        <span>در انتظار ارزیابی دسترسی</span>
      </div>
      <div class="result-actions">
        <a data-link class="button button--primary" href="/dashboard">دیدن در کنسول</a>
        <button id="restart-request" class="button button--secondary" type="button">ثبت درخواست دیگر</button>
      </div>
    </div>`;
}

function body() {
  if (state.step === "service") return serviceStep();
  if (state.step === "details") return detailsStep();
  if (state.step === "review") return reviewStep();
  return resultStep();
}

function actions() {
  if (state.step === "result") return "";
  return `
    <div class="request-actions">
      ${state.step !== "service" ? '<button id="previous-step" class="button button--secondary" type="button">مرحله قبل</button>' : ""}
      <button id="next-step" class="button button--primary" type="button" ${canContinue(state) ? "" : "disabled"}>
        ${state.step === "review" ? "ثبت برای بررسی" : "ادامه"}
      </button>
    </div>`;
}

export function renderRequestPage() {
  hydratePreferredCluster();
  const content = `
    <section class="request-page">
      <div class="request-context">
        <span>${icon("lock", { size: 22 })}</span>
        <div><strong>فرایند نمایشی درخواست دسترسی</strong><small>بدون اتصال منبع و بدون داده واقعی</small></div>
      </div>
      ${stepper()}
      <article class="request-card card">${body()}${actions()}</article>
    </section>`;

  return appShell({ content, activePath: "/request", title: "درخواست دسترسی" });
}

function updateValidationHints() {
  const organization = document.querySelector("#organization-validation");
  const purpose = document.querySelector("#purpose-validation");
  const organizationLength = state.payload.organization.trim().length;
  const purposeLength = state.payload.purpose.trim().length;

  if (organization instanceof HTMLElement) {
    organization.textContent = organizationLength >= 3 ? "✓ حداقل اطلاعات لازم وارد شده" : "حداقل ۳ نویسه";
  }
  if (purpose instanceof HTMLElement) {
    purpose.textContent = purposeLength >= 12 ? "✓ شرح برای ارزیابی اولیه کافی است" : `${purposeLength}/12 نویسه حداقل`;
  }
}

/** @param {() => void} rerender */
export function mountRequestPage(rerender) {
  document.querySelectorAll("[data-service-id]").forEach((button) => {
    on(button, "click", () => {
      const id = button.getAttribute("data-service-id");
      if (id) {
        state = selectService(state, id);
        setPreferredClusterId(id);
        persistDraft();
        rerender();
      }
    });
  });

  const form = document.querySelector("#verification-form");
  on(form, "input", (event) => {
    const target = event.target;
    if (
      !(target instanceof HTMLInputElement) &&
      !(target instanceof HTMLTextAreaElement) &&
      !(target instanceof HTMLSelectElement)
    ) return;

    state = updateVerificationFields(state, { [target.name]: target.value });
    persistDraft();
    updateValidationHints();
    const next = document.querySelector("#next-step");
    if (next instanceof HTMLButtonElement) next.disabled = !canContinue(state);
  });

  on(document.querySelector("#previous-step"), "click", () => {
    state = previousVerificationStep(state);
    persistDraft();
    rerender();
  });

  on(document.querySelector("#next-step"), "click", async () => {
    if (!canContinue(state)) return;

    if (state.step !== "review") {
      state = nextVerificationStep(state);
      persistDraft();
      rerender();
      return;
    }

    const button = document.querySelector("#next-step");
    if (button instanceof HTMLButtonElement) {
      button.disabled = true;
      button.dataset.loading = "true";
      button.textContent = "در حال ثبت…";
    }

    const response = await gateway.submit({
      serviceId: state.payload.serviceId ?? "unknown",
      organization: state.payload.organization,
      purpose: state.payload.purpose,
      monthlyVolume: state.payload.monthlyVolume
    });

    addPrototypeAccessRequest({
      referenceId: response.referenceId,
      serviceId: state.payload.serviceId ?? "unknown",
      organization: state.payload.organization,
      purpose: state.payload.purpose,
      monthlyVolume: state.payload.monthlyVolume,
      status: "در بررسی",
      createdAt: new Date().toISOString()
    });

    clearRequestDraft();
    setPreferredClusterId(null);
    state = completeVerification(state, response.referenceId);
    rerender();
  });

  on(document.querySelector("#restart-request"), "click", () => {
    clearRequestDraft();
    setPreferredClusterId(null);
    state = createVerificationState();
    rerender();
  });
}
