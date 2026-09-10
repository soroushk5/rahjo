// @ts-nocheck
import { brandLogo } from "../../components/brandLogo.js";
import { icon } from "../../components/icons.js";
import { isAuthenticated, signInAsGuest } from "../../services/authStore.js";

export function renderLoginPage(options = {}) {
  const returnTo = options.returnTo ?? "/dashboard";
  return `
    <main id="main-content" class="guest-login">
      <section class="guest-login__story">
        <a data-link href="/" class="guest-login__brand" aria-label="بازگشت به رهجو">${brandLogo({ inverted: true })}</a>
        <div class="guest-login__copy">
          <h1>یک مشتری را از اولین درخواست تا تحویل نتیجه دنبال کنید.</h1>
          <p>در دموی رهجو، فروش، مدارک، پرداخت، عملیات، تأیید و سابقهٔ مشتری در یک مسیر به هم متصل‌اند.</p>
        </div>
        <ol class="guest-login__flow"><li><span>${icon("users")}</span><strong>مشتری</strong></li><li><span>${icon("requests")}</span><strong>درخواست</strong></li><li><span>${icon("bank")}</span><strong>پرداخت</strong></li><li><span>${icon("workflow")}</span><strong>اجرا</strong></li><li><span>${icon("check")}</span><strong>نتیجه</strong></li></ol>
        <div class="guest-login__sample"><span class="status status--progress">در حال اجرا</span><div><small>درخواست نمونه</small><strong>راه‌اندازی و کنترل فرایند فروش</strong><p>شرکت آریا صنعت · رهـ-۱۴۰۵-۰۲۸۴</p></div></div>
      </section>
      <section class="guest-login__panel">
        <div class="guest-login__panel-inner">
          <div class="guest-login__mobile-brand">${brandLogo()}</div>
          <h2>ورود مهمان به دموی رهجو</h2>
          <p>بدون ساخت حساب وارد شوید و سناریوی کامل فاز اول را در چند دقیقه اجرا کنید.</p>
          <ul class="check-list"><li>${icon("check", { size: 17 })} مشاهدهٔ داشبورد روزانه</li><li>${icon("check", { size: 17 })} ثبت درخواست خدمت</li><li>${icon("check", { size: 17 })} پرداخت و عملیات نمایشی</li><li>${icon("check", { size: 17 })} مشاهدهٔ Account 360</li></ul>
          <button id="guest-login-button" class="button button--primary button--large guest-login__button" type="button" data-return-to="${returnTo}">شروع دموی تعاملی ${icon("arrow")}</button>
          <p class="guest-login__note">این محیط به سرویس یا پرداخت واقعی متصل نیست. تمام نام‌ها و عملیات ساختگی‌اند و اطلاعات فقط در همین مرورگر می‌ماند.</p>
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
    button.innerHTML = `در حال آماده‌سازی دمو…`;
    window.setTimeout(() => {
      signInAsGuest();
      onSuccess(returnTo);
    }, 240);
  });
}
