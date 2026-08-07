import { brandLogo } from "../components/brandLogo.js";
import { icon } from "../components/icons.js";
import { getSession } from "../services/authStore.js";

/** @param {{content: string, activePath: string, title: string}} options */
export function appShell({ content, activePath, title }) {
  const session = getSession();
  const user = session?.user ?? { name: "کاربر دمو", role: "مدیر دسترسی داده", organization: "شرکت نمونه سازمانی", initials: "ر" };

  /** @param {string} path @param {string} iconName @param {string} label */
  const nav = (path, iconName, label) => `
    <a data-link href="${path}" ${activePath === path ? 'aria-current="page"' : ""}>
      <span class="app-nav__icon">${icon(iconName, { size: 18 })}</span>
      <span>${label}</span>
    </a>`;

  return `
    <div class="app-shell presentation-app-shell">
      <aside class="app-sidebar" aria-label="ناوبری کنسول">
        <div class="app-sidebar__brand">
          <a data-link href="/">${brandLogo({ inverted: true })}</a>
          <span>CONTROL CONSOLE</span>
        </div>

        <div class="app-sidebar__workspace">
          <span class="workspace-dot"></span>
          <div><small>Workspace</small><strong>${user.organization}</strong></div>
          <em>Sandbox</em>
        </div>

        <nav class="app-nav" aria-label="ناوبری محصول">
          <small class="app-nav__label">کنسول</small>
          ${nav("/dashboard", "dashboard", "نمای کلی")}
          ${nav("/dashboard/requests", "requests", "درخواست‌ها")}
          ${nav("/dashboard/data", "database", "سبد داده")}
          ${nav("/dashboard/audit", "audit", "کنترل و ممیزی")}
          <small class="app-nav__label app-nav__label--second">کاوش</small>
          ${nav("/data", "atlas", "اطلس داده")}
          ${nav("/map", "node", "نقشه اکوسیستم")}
          ${nav("/request", "workflow", "درخواست دسترسی")}
        </nav>

        <div class="app-sidebar__bottom">
          <a data-link class="app-sidebar__public" href="/">${icon("external", { size: 17 })}<span>بازگشت به سایت</span></a>
          <div class="app-user-card">
            <span class="app-user-card__avatar">${user.initials}</span>
            <div><strong>${user.name}</strong><small>${user.role}</small></div>
            <a data-link data-logout href="/login" class="icon-button icon-button--dark" aria-label="خروج از محیط نمایشی">${icon("logout", { size: 17 })}</a>
          </div>
        </div>
      </aside>

      <div class="app-main">
        <header class="app-topbar">
          <div class="app-topbar__title">
            <button id="app-menu-toggle" class="icon-button app-menu-toggle" type="button" aria-label="باز کردن منوی کنسول" aria-expanded="false">${icon("menu")}</button>
            <div><small>رهجو / محیط نمایشی</small><strong>${title}</strong></div>
          </div>
          <div class="app-topbar__actions">
            <span class="environment-badge"><i></i>Sandbox</span>
            <button id="global-search" class="icon-button" type="button" aria-label="جست‌وجوی سریع">${icon("search")}</button>
            <a data-link class="button button--primary app-topbar__request" href="/request">درخواست جدید ${icon("arrow", { size: 15 })}</a>
          </div>
        </header>
        <main id="main-content" class="app-content">${content}</main>
      </div>
    </div>`;
}
