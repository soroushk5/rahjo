// @ts-nocheck
import { brandLogo } from "../components/brandLogo.js";
import { isAuthenticated } from "../services/authStore.js";

export function siteShell({ content, activePath }) {
  const signedIn = isAuthenticated();
  const accessHref = signedIn ? "/dashboard" : "/login";
  const accessLabel = signedIn ? "باز کردن رهجو" : "ورود به رهجو";
  const link = (path, label) => `<a data-link href="${path}" ${activePath === path ? 'aria-current="page"' : ""}>${label}</a>`;

  return `
    <div class="page phase-site rv-site mp-site">
      <header class="phase-header rv-header mp-header">
        <div class="container phase-header__inner rv-header__inner mp-header__inner mp-header__inner--minimal">
          <a data-link href="/" class="site-brand-link rv-brand mp-brand" aria-label="صفحهٔ اصلی رهجو">${brandLogo()}</a>
          <div class="phase-header__actions rv-header__actions mp-header__actions">
            <a data-link data-cta="header-access" class="button button--primary mp-header__primary" href="${accessHref}">${accessLabel}</a>
          </div>
        </div>
      </header>

      <main id="main-content" class="rv-main mp-main">${content}</main>

      <footer class="rv-footer mp-footer">
        <div class="container mp-footer__inner">
          <div class="mp-footer__brand">${brandLogo()}<p>CRM ساده برای مدیریت مشتری، فروش و اجرای کار.</p></div>
          <nav class="mp-footer__links" aria-label="پیوندهای پایین صفحه">
            ${link("/product", "محصول")}${link("/login", "ورود")}${link("/privacy", "حریم خصوصی")}${link("/terms", "شرایط استفاده")}
          </nav>
        </div>
        <div class="container mp-footer__bottom"><span>Rahjo / رهجو</span><span>© ۱۴۰۵</span></div>
      </footer>
    </div>`;
}
