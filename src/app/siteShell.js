import { brandLogo } from "../components/brandLogo.js";
import { icon } from "../components/icons.js";
import { isAuthenticated } from "../services/authStore.js";

/** @param {{content: string, activePath: string}} options */
export function siteShell({ content, activePath }) {
  const signedIn = isAuthenticated();

  /** @param {string} path @param {string} label */
  const link = (path, label) => `
    <a data-link href="${path}" ${activePath === path ? 'aria-current="page"' : ""}>${label}</a>`;

  return `
    <div class="page presentation-page">
      <header class="site-header presentation-site-header">
        <div class="site-header__inner container">
          <a data-link href="/" aria-label="صفحه اصلی رهجو" class="site-brand-link">${brandLogo()}</a>

          <nav id="site-nav" class="site-nav" aria-label="ناوبری اصلی">
            ${link("/", "خانه")}
            ${link("/data", "اطلس داده")}
            ${link("/platform", "معماری")}
            ${link("/trust", "کنترل دسترسی")}
            ${link("/map", "نقشه اکوسیستم")}
          </nav>

          <div class="site-header__actions">
            <button id="mobile-nav-toggle" class="icon-button mobile-nav-toggle" type="button" aria-label="باز کردن منو" aria-controls="site-nav" aria-expanded="false">${icon("menu")}</button>
            <button class="icon-button hide-mobile" type="button" data-open-command aria-label="جست‌وجوی سریع">${icon("search")}</button>
            <a data-link class="button button--ghost hide-mobile" href="${signedIn ? "/dashboard" : "/login"}">${signedIn ? "بازگشت به کنسول" : "ورود"}</a>
            <a data-link class="button button--primary" href="/request">درخواست دسترسی</a>
          </div>
        </div>
      </header>

      <main id="main-content">${content}</main>

      <footer class="site-footer presentation-footer">
        <div class="container presentation-footer__top">
          <div class="presentation-footer__brand">${brandLogo()}<p>زیرساخت دسترسی کنترل‌شده به داده برای کاربردهای سازمانی.</p><span>${icon("shield", { size: 17 })}نسخه نمایشی؛ بدون اتصال به داده واقعی</span></div>
          <div><small>محصول</small>${link("/data", "اطلس داده")}${link("/platform", "معماری پلتفرم")}${link("/map", "نقشه اکوسیستم")}</div>
          <div><small>دسترسی</small>${link("/trust", "کنترل دسترسی")}${link("/request", "ثبت درخواست")}${link("/login", "ورود به محیط نمایشی")}</div>
          <div class="presentation-footer__principles"><small>اصول طراحی</small><span>منبع روشن</span><span>Purpose مشخص</span><span>حداقل‌سازی</span><span>رد ممیزی</span></div>
        </div>
        <div class="container presentation-footer__bottom"><span>Rahjo · Presentation Preview</span><span>Data · Verification · API · Workflow</span></div>
      </footer>
    </div>`;
}
