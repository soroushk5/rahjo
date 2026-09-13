// @ts-nocheck
import { brandLogo } from "../../components/brandLogo.js";
import { icon } from "../../components/icons.js";
import { isAuthenticated, signInAsGuest } from "../../services/authStore.js";

export function renderLoginPage(options = {}) {
  const returnTo = options.returnTo ?? "/dashboard";
  return `
    <main id="main-content" class="guest-login mp-demo-login">
      <section class="guest-login__story mp-demo-login__story">
        <a data-link href="/" class="guest-login__brand" aria-label="بازگشت به رهجو">${brandLogo({ inverted: true })}</a>
        <div class="guest-login__copy">
          <span class="mp-demo-login__label">Golden Demo</span>
          <h1>یک مسیر کامل را با دادهٔ نمایشی امتحان کنید.</h1>
          <p>مشتری، پرونده، تأیید، اقدام و نتیجه در یک سناریوی کوتاه و قابل بازنشانی.</p>
        </div>
        <ol class="guest-login__flow mp-demo-login__flow">
          <li><span>${icon("users")}</span><strong>مشتری</strong></li>
          <li><span>${icon("requests")}</span><strong>پرونده</strong></li>
          <li><span>${icon("shield")}</span><strong>تأیید</strong></li>
          <li><span>${icon("workflow")}</span><strong>اقدام</strong></li>
          <li><span>${icon("check")}</span><strong>نتیجه</strong></li>
        </ol>
      </section>
      <section class="guest-login__panel mp-demo-login__panel">
        <div class="guest-login__panel-inner">
          <div class="guest-login__mobile-brand">${brandLogo()}</div>
          <h2>ورود به Golden Demo</h2>
          <p>بدون ساخت حساب، محیط نمایشی رهجو را باز کنید.</p>
          <button id="guest-login-button" class="button button--primary button--large guest-login__button" type="button" data-return-to="${returnTo}">باز کردن دمو ${icon("arrow")}</button>
          <p class="guest-login__note">تمام داده‌ها ساختگی‌اند و فقط برای ارزیابی تجربهٔ محصول استفاده می‌شوند.</p>
          <a data-link class="text-link" href="/">بازگشت به سایت ${icon("arrow", { size: 16 })}</a>
        </div>
      </section>
    </main>`;
}

export function mountLoginPage({ onSuccess }) {
  const button = document.querySelector("#guest-login-button");
  const returnTo = button instanceof HTMLButtonElement ? button.dataset.returnTo ?? "/dashboard" : "/dashboard";
  if (isAuthenticated()) {
    onSuccess(returnTo);
    return;
  }
  if (!(button instanceof HTMLButtonElement)) return;
  button.addEventListener("click", () => {
    button.disabled = true;
    button.innerHTML = `در حال آماده‌سازی…`;
    window.setTimeout(() => {
      signInAsGuest();
      onSuccess(returnTo);
    }, 240);
  });
}
