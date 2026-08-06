import { brandLogo } from "../components/brandLogo.js";

/** @param {{content: string, activePath: string}} options */
export function siteShell({ content, activePath }) {
  const link = (path, label) => `<a data-link href="${path}" ${activePath === path ? 'aria-current="page"' : ""}>${label}</a>`;
  return `
    <div class="page">
      <header class="site-header">
        <div class="site-header__inner container">
          <a data-link href="/" aria-label="صفحه اصلی رهجو">${brandLogo()}</a>
          <nav class="site-nav" aria-label="ناوبری اصلی">
            ${link("/", "راهکارها")}
            <a href="#solutions">محصولات</a>
            ${link("/dashboard", "نمایش محصول")}
            <a href="#contact">تماس</a>
          </nav>
          <div class="site-header__actions">
            <a data-link class="button button--ghost" href="/dashboard">ورود نمایشی</a>
            <a data-link class="button button--primary" href="/request">درخواست دمو</a>
          </div>
        </div>
      </header>
      <main id="main-content">${content}</main>
      <footer class="site-footer">
        <div class="site-footer__inner container">
          ${brandLogo()}
          <p class="muted">نسخه مفهومی MVP — هیچ سرویس حساس یا اتصال واقعی فعال نیست.</p>
        </div>
      </footer>
    </div>`;
}
