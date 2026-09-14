// @ts-nocheck
import { siteShell } from "../../app/siteShell.js";
import { readRuntimeConfig } from "../../config/runtimeConfig.js";
import { icon } from "../../components/icons.js";

function field(name, label, type = "text", autocomplete = "") {
  return `<label class="public-intake-field"><span>${label}</span><input name="${name}" type="${type}" ${autocomplete ? `autocomplete="${autocomplete}"` : ""} /></label>`;
}

export function renderPublicIntakePage() {
  return siteShell({
    activePath: "/contact",
    content: `
      <section class="public-intake" data-public-intake-page>
        <div class="container public-intake__grid">
          <div class="public-intake__intro">
            <p class="sw-kicker">شروع</p>
            <h1>از یک جریان واقعی مشتری شروع کنید.</h1>
            <p class="sw-lead">کوتاه بگویید چه کاری را می‌خواهید منظم‌تر جلو ببرید. درخواست شما مستقیم وارد مسیر عملیاتی رهجو می‌شود.</p>
            <ol class="public-intake__steps">
              <li><span>۱</span><div><strong>درخواست</strong><small>نیاز و راه تماس را ثبت می‌کنید.</small></div></li>
              <li><span>۲</span><div><strong>بررسی</strong><small>درخواست داخل فضای کاری بررسی می‌شود.</small></div></li>
              <li><span>۳</span><div><strong>ادامه</strong><small>اقدام بعدی با شما هماهنگ می‌شود.</small></div></li>
            </ol>
          </div>

          <div class="public-intake__card">
            <form id="rahjo-public-intake" class="public-intake-form" novalidate>
              <div class="public-intake-form__row">
                ${field("organization", "نام شرکت یا مجموعه", "text", "organization")}
                ${field("contactName", "نام شما", "text", "name")}
              </div>
              <div class="public-intake-form__row">
                ${field("email", "ایمیل", "email", "email")}
                ${field("phone", "شماره تماس", "tel", "tel")}
              </div>
              <label class="public-intake-field public-intake-field--wide"><span>چه چیزی را می‌خواهید بهتر مدیریت کنید؟</span><textarea name="purpose" rows="5" maxlength="1200"></textarea></label>
              <p class="public-intake-form__hint">حداقل یکی از ایمیل یا شماره تماس را وارد کنید.</p>
              <p id="public-intake-feedback" class="public-intake-form__feedback" role="status" aria-live="polite"></p>
              <button class="button button--primary button--large public-intake-form__submit" type="submit">ثبت درخواست ${icon("arrow", { size: 16 })}</button>
              <small class="public-intake-form__privacy">اطلاعات این فرم فقط برای بررسی و پیگیری همین درخواست استفاده می‌شود.</small>
            </form>
          </div>
        </div>
      </section>`
  });
}

function attribution() {
  const query = new URLSearchParams(window.location.search);
  const value = {
    utmSource: query.get("utm_source") ?? "",
    utmMedium: query.get("utm_medium") ?? "",
    utmCampaign: query.get("utm_campaign") ?? "",
    utmTerm: query.get("utm_term") ?? "",
    utmContent: query.get("utm_content") ?? "",
    referrer: document.referrer ?? "",
    landingPath: `${window.location.pathname}${window.location.search}`
  };
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item));
}

function newIdempotencyKey() {
  const id = typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `web-${id}`;
}

function feedbackMessage(status, code) {
  if (status === 429 || code === "RATE_LIMITED") return "تعداد درخواست‌ها زیاد شده است. چند دقیقه دیگر دوباره تلاش کنید.";
  if (status === 422 || code === "VALIDATION_FAILED") return "لطفاً فیلدهای فرم را بررسی کنید و دوباره بفرستید.";
  if (status === 503) return "ثبت درخواست موقتاً در دسترس نیست. کمی بعد دوباره تلاش کنید.";
  return "ثبت درخواست انجام نشد. اتصال را بررسی کنید و دوباره تلاش کنید.";
}

export function mountPublicIntakePage() {
  const form = document.querySelector("#rahjo-public-intake");
  if (!(form instanceof HTMLFormElement)) return;
  const button = form.querySelector("button[type=submit]");
  const feedback = document.querySelector("#public-intake-feedback");
  let runtime;
  try {
    runtime = readRuntimeConfig(document);
  } catch {
    runtime = { mode: "invalid", apiBase: "" };
  }

  if (runtime.mode !== "server" || !runtime.apiBase) {
    if (button instanceof HTMLButtonElement) button.disabled = true;
    if (feedback) feedback.textContent = "ثبت عمومی فقط روی نسخهٔ متصل به سرور فعال است.";
    return;
  }

  form.addEventListener("input", () => {
    delete form.dataset.idempotencyKey;
    if (feedback) feedback.textContent = "";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const organization = String(data.get("organization") ?? "").trim();
    const contactName = String(data.get("contactName") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const purpose = String(data.get("purpose") ?? "").trim();
    if (!organization || !contactName || !purpose || (!email && !phone)) {
      if (feedback) feedback.textContent = "نام مجموعه، نام شما، توضیح نیاز و یک راه تماس لازم است.";
      return;
    }

    const idempotencyKey = form.dataset.idempotencyKey || newIdempotencyKey();
    form.dataset.idempotencyKey = idempotencyKey;
    if (button instanceof HTMLButtonElement) button.disabled = true;
    if (feedback) feedback.textContent = "در حال ثبت درخواست…";

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(`${runtime.apiBase.replace(/\/$/, "")}/api/v1/public/intakes`, {
        method: "POST",
        credentials: "omit",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify({ organization, contactName, email, phone, purpose, attribution: attribution() })
      });
      let payload = {};
      try { payload = await response.json(); } catch { payload = {}; }
      if (!response.ok) {
        if (feedback) feedback.textContent = feedbackMessage(response.status, payload.code);
        return;
      }
      if (payload.dataMode !== "server" || payload.status !== "received") {
        if (feedback) feedback.textContent = "پاسخ سرور معتبر نبود. دوباره تلاش کنید.";
        return;
      }
      form.reset();
      delete form.dataset.idempotencyKey;
      if (feedback) feedback.textContent = payload.replayed
        ? "درخواست شما قبلاً ثبت شده بود و دوباره ایجاد نشد."
        : "درخواست شما ثبت شد. برای هماهنگی ادامهٔ مسیر با شما تماس می‌گیریم.";
    } catch {
      if (feedback) feedback.textContent = "اتصال به سرور برقرار نشد. دوباره تلاش کنید.";
    } finally {
      window.clearTimeout(timer);
      if (button instanceof HTMLButtonElement) button.disabled = false;
    }
  });
}
