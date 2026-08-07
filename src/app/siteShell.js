import { brandLogo } from "../components/brandLogo.js";
import { icon } from "../components/icons.js";
import { journeyRail } from "../components/journeyRail.js";
import { publicNavigation } from "./navigation.js";
import { isAuthenticated } from "../services/authStore.js";

/** @param {{content: string, activePath: string}} options */
export function siteShell({ content, activePath }) {
  const signedIn = isAuthenticated();

  /** @param {string} path @param {string} label */
  const link = (path, label) => `
    <a data-link href="${path}" ${activePath === path ? 'aria-current="page"' : ""}>${label}</a>`;

  const navLinks = publicNavigation.map((item) => link(item.path, item.label)).join("");

  return `
    <div class="page presentation-page">
      <header class="site-header presentation-site-header">
        <div class="site-header__inner container">
          <a data-link href="/" aria-label="صفحه اصلی رهجو" class="site-brand-link">${brandLogo()}</a>

          <nav id="site-nav" class="site-nav" aria-label="ناوبری اصلی">${navLinks}</nav>

          <div class="site-header__actions">
            <button id="mobile-nav-toggle" class="icon-button mobile-nav-toggle" type="button" aria-label="باز کردن منو" aria-controls="site-nav" aria-expanded="false">${icon("menu")}</button>
            <button class="icon-button hide-mobile" type="button" data-open-command aria-label="جست‌وجوی سریع">${icon("search")}</button>
            <a data-link class="button button--ghost hide-mobile" href="${signedIn ? "/dashboard" : "/login"}">${signedIn ? "بازگشت به کنسول" : "ورود به دمو"}</a>
            <a data-link class="button button--primary" href="/request">درخواست دسترسی</a>
          </div>
        </div>
      </header>

      <main id="main-content">${content}</main>
      ${journeyRail(activePath)}

      <footer class="site-footer presentation-footer">
        <div class="container presentation-footer__top">
          <div class="presentation-footer__brand">${brandLogo()}<p>زیرساخت دسترسی کنترل‌شده به داده برای کاربردهای سازمانی.</p><span>${icon("shield", { size: 17 })}نسخه نمایشی؛ بدون اتصال به داده واقعی</span></div>
          <div><small>شناخت محصول</small>${link("/data", "اطلس داده")}${link("/map", "نقشه اکوسیستم")}${link("/platform", "معماری پلتفرم")}</div>
          <div><small>دسترسی و دمو</small>${link("/trust", "کنترل دسترسی")}${link("/request", "ثبت درخواست")}${link(signedIn ? "/dashboard" : "/login", signedIn ? "بازگشت به کنسول" : "ورود به کنسول دمو")}</div>
          <div class="presentation-footer__principles"><small>اصل تجربه</small><span>منبع روشن</span><span>Purpose مشخص</span><span>حداقل‌سازی</span><span>رد ممیزی</span></div>
        </div>
        <div class="container presentation-footer__bottom"><span>Rahjo · Presentation Preview</span><span>Data · Verification · API · Workflow</span></div>
      </footer>
    </div>`;
}
