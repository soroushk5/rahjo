import { brandLogo } from "../components/brandLogo.js";
import { icon } from "../components/icons.js";

/** @param {{content: string, activePath: string}} options */
export function siteShell({ content, activePath }) {
  /** @param {string} path @param {string} label */
  const link = (path, label) => `
    <a data-link href="${path}" ${activePath === path ? 'aria-current="page"' : ""}>
      ${label}
    </a>`;

  return `
    <div class="page">
      <header class="site-header">
        <div class="site-header__inner container">
          <a data-link href="/" aria-label="صفحه اصلی رهجو">
            ${brandLogo()}
          </a>

          <nav class="site-nav" aria-label="ناوبری اصلی">
            ${link("/", "خانه")}
            ${link("/data", "اطلس داده")}
            ${link("/platform", "معماری")}
            ${link("/trust", "کنترل دسترسی")}
            ${link("/map", "نقشه اکوسیستم")}
          </nav>

          <div class="site-header__actions">
            <a data-link class="button button--ghost hide-mobile" href="/dashboard">کنسول داده</a>
            <a data-link class="button button--primary" href="/request">درخواست دسترسی</a>
          </div>
        </div>
      </header>

      <main id="main-content">${content}</main>

      <footer class="site-footer">
        <div class="container footer-grid">
          <div>
            ${brandLogo()}
            <p class="muted">زیرساخت دسترسی کنترل‌شده به داده‌های حساس و سازمانی.</p>
          </div>
          <nav aria-label="پیوندهای پایانی">
            ${link("/data", "اطلس داده")}
            ${link("/platform", "معماری پلتفرم")}
            ${link("/trust", "کنترل دسترسی")}
            ${link("/map", "نقشه اکوسیستم")}
          </nav>
          <div class="footer-note">
            ${icon("shield")}
            نسخه نمایشی؛ بدون اتصال به داده واقعی
          </div>
        </div>
      </footer>
    </div>`;
}
