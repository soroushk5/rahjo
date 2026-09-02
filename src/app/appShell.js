import { brandLogo } from "../components/brandLogo.js";
import { icon } from "../components/icons.js";
import { consoleNavigation, routeLabel, secondaryConsoleNavigation } from "./navigation.js";
import { getSession } from "../services/authStore.js";

/** @param {{content: string, activePath: string, title: string}} options */
export function appShell({ content, activePath, title }) {
  const session = getSession();
  const user = session?.user ?? { name: "کاربر دمو", role: "مدیر عملیات", organization: "رهجو — محیط نمونه", initials: "ر" };

  /** @param {{path:string, icon:string, label:string}} item */
  const nav = (item) => `
    <a data-link href="${item.path}" ${activePath === item.path ? 'aria-current="page"' : ""}>
      <span class="app-nav__icon">${icon(item.icon, { size: 18 })}</span>
      <span>${item.label}</span>
    </a>`;

  const navGroups = [...new Set(consoleNavigation.map((item) => item.group))];

  return `
    <div class="app-shell presentation-app-shell">
      <aside class="app-sidebar" aria-label="ناوبری کنسول">
        <div class="app-sidebar__brand">
          <a data-link href="/">${brandLogo({ inverted: true })}</a>
          <span>OPERATIONAL FOUNDATION</span>
        </div>

        <div class="app-sidebar__workspace">
          <span class="workspace-dot"></span>
          <div><small>محیط جاری</small><strong>${user.organization}</strong></div>
          <em>Demo</em>
        </div>

        <nav class="app-nav" aria-label="ناوبری محصول">
          ${navGroups.map((group) => `
            <small class="app-nav__label">${group}</small>
            ${consoleNavigation.filter((item) => item.group === group).map((item) => `
              <a data-link href="${item.path}" ${activePath === item.path ? 'aria-current="page"' : ""}>
                <span class="app-nav__icon">${icon(item.icon, { size: 18 })}</span>
                <span>${item.label}</span>
                ${item.path === "/think-room" ? '<b class="nav-future">آینده</b>' : ""}
              </a>`).join("")}
          `).join("")}
          <details class="secondary-nav">
            <summary>${icon("layers", { size: 17 })}<span>نماهای مرجع / قدیمی</span></summary>
            <div>${secondaryConsoleNavigation.map(nav).join("")}</div>
          </details>
        </nav>

        <div class="app-sidebar__bottom">
          <a data-link class="app-sidebar__public" href="/">${icon("external", { size: 17 })}<span>بازگشت به سایت</span></a>
          <div class="app-user-card">
            <span class="app-user-card__avatar">${user.initials}</span>
            <div><strong>${user.name}</strong><small>مدیر عملیات — دمو</small></div>
            <a data-link data-logout href="/login" class="icon-button icon-button--dark" aria-label="خروج از محیط نمایشی">${icon("logout", { size: 17 })}</a>
          </div>
        </div>
      </aside>

      <div class="app-main">
        <header class="app-topbar">
          <div class="app-topbar__title">
            <button id="app-menu-toggle" class="icon-button app-menu-toggle" type="button" aria-label="باز کردن منوی کنسول" aria-expanded="false">${icon("menu")}</button>
            <div><small>رهجو <b>/</b> ${routeLabel(activePath)}</small><strong>${title}</strong></div>
          </div>
          <div class="app-topbar__actions">
            <span class="environment-badge"><i></i>دمو / داده مصنوعی</span>
            <button id="global-search" class="icon-button" type="button" aria-label="جست‌وجوی سریع">${icon("search")}</button>
            <a data-link class="button button--primary app-topbar__request" href="/services">ورود پرونده جدید ${icon("arrow", { size: 15 })}</a>
          </div>
        </header>
        <div class="app-context-strip">
          <span>${icon("shield", { size: 15 })} محیط دمو؛ هیچ اتصال یا سرویس واقعی ادعا نمی‌شود</span>
          <a data-link href="/governance">مشاهده ممیزی</a>
        </div>
        <main id="main-content" class="app-content">${content}</main>
      </div>
    </div>`;
}
