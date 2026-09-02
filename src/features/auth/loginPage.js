import { brandLogo } from "../../components/brandLogo.js";
import { icon } from "../../components/icons.js";
import { dataClusters } from "../../data/siteContent.js";
import { demoCredentials, isAuthenticated, signIn } from "../../services/authStore.js";
import { escapeHtml } from "../../lib/html.js";

function loginNetwork() {
  return `
    <div class="login-network" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        ${dataClusters.map((cluster) => `<line x1="50" y1="50" x2="${cluster.x}" y2="${cluster.y}" />`).join("")}
        <circle cx="50" cy="50" r="24" />
      </svg>
      <div class="login-network__core">${brandLogo({ compact: true, inverted: true })}<span>OPS</span></div>
      ${dataClusters.map((cluster) => `
        <span class="login-network__node" style="--x:${cluster.x}%;--y:${cluster.y}%">
          ${icon(cluster.icon, { size: 18 })}<b>${cluster.shortTitle}</b>
        </span>`).join("")}
    </div>`;
}

/** @param {{returnTo?: string}} [options] */
export function renderLoginPage(options = {}) {
  const returnTo = options.returnTo ?? "/dashboard";
  return `
    <main id="main-content" class="login-page">
      <section class="login-visual">
        <a data-link href="/" class="login-brand" aria-label="بازگشت به رهجو">${brandLogo({ inverted: true })}</a>
        <div class="login-visual__copy">
          <span class="login-overline">Operational Foundation · Demo</span>
          <h1>از ورودی مشتری تا اقدام و نتیجه؛ روی یک حافظه تجاری.</h1>
          <p>محیط عملیاتی رهجو برای مدیریت حساب، پرونده، فروش، سرویس، تأیید و Outcome ساخته شده و با AI خاموش هم کامل می‌ماند.</p>
        </div>
        ${loginNetwork()}
        <div class="login-proof-row">
          <span>${icon("business", { size: 18 })}<b>حافظه تجاری</b><small>Account · Case · Interaction</small></span>
          <span>${icon("shield", { size: 18 })}<b>Gate انسانی</b><small>Approval · Action · Audit</small></span>
          <span>${icon("check", { size: 18 })}<b>حلقه نتیجه</b><small>Outcome · Follow-up · History</small></span>
        </div>
      </section>

      <section class="login-panel">
        <div class="login-panel__inner">
          <div class="login-mobile-brand">${brandLogo()}</div>
          <header>
            <span class="demo-badge">Demo / Synthetic / No-AI</span>
            <h2>ورود به فضای عملیاتی رهجو</h2>
            <p>برای بررسی محیط دمو از حساب نمایشی زیر استفاده کنید.</p>
          </header>

          <form id="demo-login-form" class="login-form" data-return-to="${escapeHtml(returnTo)}" novalidate>
            <label class="field">
              <span>ایمیل</span>
              <div class="input-shell">${icon("identity", { size: 19 })}<input id="login-email" name="email" type="email" autocomplete="username" value="${demoCredentials.email}" required /></div>
            </label>
            <label class="field">
              <span>رمز عبور</span>
              <div class="input-shell">${icon("lock", { size: 19 })}<input id="login-password" name="password" type="password" autocomplete="current-password" value="${demoCredentials.password}" required /></div>
            </label>
            <div id="login-error" class="login-error" role="alert" hidden></div>
            <button id="login-submit" class="button button--primary login-submit" type="submit">ورود به محیط نمایشی ${icon("arrow")}</button>
          </form>

          <div class="demo-credential-box">
            <div>${icon("document", { size: 18 })}<strong>اطلاعات دمو</strong></div>
            <code>${demoCredentials.email}</code>
            <code>${demoCredentials.password}</code>
          </div>

          <p class="login-disclaimer">این ورود فقط یک Session محلی می‌سازد. داده‌ها مصنوعی‌اند و هیچ حساب، API، provider، eligibility یا سرویس Production در این نسخه وجود ندارد.</p>
          <a data-link class="text-link login-back" href="/">بازگشت به سایت ${icon("arrow")}</a>
        </div>
      </section>
    </main>`;
}

/** @param {{onSuccess: (path: string) => void}} options */
export function mountLoginPage({ onSuccess }) {
  if (isAuthenticated()) {
    const form = document.querySelector("#demo-login-form");
    const returnTo = form instanceof HTMLFormElement ? form.dataset.returnTo ?? "/dashboard" : "/dashboard";
    onSuccess(returnTo);
    return;
  }

  const form = document.querySelector("#demo-login-form");
  if (!(form instanceof HTMLFormElement)) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = form.querySelector("#login-email");
    const password = form.querySelector("#login-password");
    const error = form.querySelector("#login-error");
    const submit = form.querySelector("#login-submit");
    if (!(email instanceof HTMLInputElement) || !(password instanceof HTMLInputElement)) return;

    if (submit instanceof HTMLButtonElement) {
      submit.disabled = true;
      submit.dataset.loading = "true";
      submit.textContent = "در حال ورود…";
    }

    window.setTimeout(() => {
      const result = signIn(email.value, password.value);
      if (!result.ok) {
        if (error instanceof HTMLElement) {
          error.hidden = false;
          error.textContent = "ایمیل یا رمز عبور محیط نمایشی درست نیست.";
        }
        if (submit instanceof HTMLButtonElement) {
          submit.disabled = false;
          submit.dataset.loading = "false";
          submit.innerHTML = `ورود به محیط نمایشی ${icon("arrow")}`;
        }
        return;
      }
      onSuccess(form.dataset.returnTo ?? "/dashboard");
    }, 320);
  });
}
