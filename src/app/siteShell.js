import { brandLogo } from "../components/brandLogo.js";
import { icon } from "../components/icons.js";
/** @param {{content: string, activePath: string}} options */
export function siteShell({ content, activePath }) {
  /** @param {string} path @param {string} label */
  const link = (path, label) => `<a data-link href="${path}" ${activePath === path ? 'aria-current="page"' : ""}>${label}</a>`;
  return `<div class="page"><header class="site-header"><div class="site-header__inner container">
    <a data-link href="/" aria-label="صفحه اصلی رهجو">${brandLogo()}</a>
    <nav class="site-nav" aria-label="ناوبری اصلی">${link("/", "خانه")}${link("/platform", "پلتفرم")}${link("/stories", "روایت‌ها")}${link("/trust", "اعتماد")}${link("/map", "نقشه")}</nav>
    <div class="site-header__actions"><a data-link class="button button--ghost hide-mobile" href="/dashboard">میز تصمیم</a><a data-link class="button button--primary" href="/request">درخواست دمو</a></div>
  </div></header><main id="main-content">${content}</main>
  <footer class="site-footer"><div class="container footer-grid"><div>${brandLogo()}<p class="muted">زیرساخت روایت‌محور برای داده، تصمیم و پیگیری.</p></div><nav aria-label="پیوندهای پایانی">${link("/platform","پلتفرم")}${link("/stories","دفتر روایت")}${link("/trust","مرکز اعتماد")}${link("/map","نقشه سایت")}</nav><div class="footer-note">${icon("shield")} نسخه نمایشی؛ بدون اتصال داده واقعی</div></div></footer></div>`;
}
