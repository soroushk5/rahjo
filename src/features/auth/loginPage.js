// @ts-nocheck
import { brandLogo } from "../../components/brandLogo.js";
import { icon } from "../../components/icons.js";
import { isAuthenticated, signInAsGuest } from "../../services/authStore.js";

export function renderLoginPage(options = {}) {
  const returnTo = options.returnTo ?? "/dashboard";
  return `
    <main id="main-content" class="guest-login rv-demo-entry">
      <section class="guest-login__story rv-demo-entry__story">
        <a data-link href="/" class="guest-login__brand" aria-label="بازگشت به رهجو">${brandLogo({ inverted: true })}</a>
        <div class="guest-login__copy rv-demo-entry__copy">
          <span class="rv-demo-entry__mode">Golden Demo · دادهٔ ساختگی</span>
          <h1>همان مسیر مشتری تا نتیجه، در یک محیط جدا و قابل بازنشانی.</h1>
          <p>Golden Demo برای دیدن تجربهٔ محصول است؛ نه جایگزین Workspace واقعی. همهٔ نام‌ها، پرونده‌ها و عملیات ساختگی‌اند.</p>
        </div>
        <ol class="guest-login__flow rv-demo-entry__flow">
          <li><span>${icon("users")}</span><strong>مشتری</strong></li>
          <li><span>${icon("requests")}</span><strong>پرونده</strong></li>
          <li><span>${icon("shield")}</span><strong>تأیید</strong></li>
          <li><span>${icon("workflow")}</span><strong>اقدام</strong></li>
          <li><span>${icon("document")}</span><strong>رسید</strong></li>
          <li><span>${icon("check")}</span><strong>نتیجه</strong></li>
        </ol>
        <div class="guest-login__sample rv-demo-entry__case">
          <span class="status status--progress">نیازمند تأیید</span>
          <div><small>پروندهٔ نمونه</small><strong>راه‌اندازی عملیات فروش</strong><p>آریا صنعت · CASE-DEMO-1028</p></div>
        </div>
      </section>
      <section class="guest-login__panel rv-demo-entry__panel">
        <div class="guest-login__panel-inner">
          <div class="guest-login__mobile-brand">${brandLogo()}</div>
          <span class="rv-demo-entry__eyebrow">محیط ارزیابی</span>
          <h2>ورود به Golden Demo</h2>
          <p>بدون ساخت حساب، حلقهٔ اصلی رهجو را با دادهٔ ساختگی اجرا کنید و هر زمان به حالت اولیه برگردانید.</p>
          <ul class="check-list rv-demo-entry__checks">
            <li>${icon("check", { size: 17 })} Dashboard و اقدام بعدی</li>
            <li>${icon("check", { size: 17 })} Case و Approval انسانی</li>
            <li>${icon("check", { size: 17 })} Action، Receipt و Outcome</li>
            <li>${icon("check", { size: 17 })} Account 360 و Audit trail</li>
          </ul>
          <button id="guest-login-button" class="button button--primary button--large guest-login__button" type="button" data-return-to="${returnTo}">شروع Golden Demo ${icon("arrow")}</button>
          <div class="rv-demo-entry__boundary">${icon("shield", { size: 17 })}<p>این حالت به Workspace یا رکورد واقعی متصل نیست. داده فقط برای همین تجربهٔ نمایشی در مرورگر نگه‌داری می‌شود.</p></div>
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
    button.innerHTML = `در حال آماده‌سازی Golden Demo…`;
    window.setTimeout(() => {
      signInAsGuest();
      onSuccess(returnTo);
    }, 240);
  });
}
