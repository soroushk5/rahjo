import { brandLogo } from "../components/brandLogo.js";
import { icon } from "../components/icons.js";

/** @param {{content: string, activePath: string, title: string}} options */
export function appShell({ content, activePath, title }) {
  /** @param {string} path @param {string} iconName @param {string} label */
  const nav = (path, iconName, label) => `
    <a data-link href="${path}" ${activePath === path ? 'aria-current="page"' : ""}>
      <span>${icon(iconName)}</span>
      <span>${label}</span>
    </a>`;

  return `
    <div class="app-shell">
      <aside class="app-sidebar" aria-label="ناوبری کنسول">
        <a data-link href="/">${brandLogo({ inverted: true })}</a>
        <div class="sidebar-kicker">DATA CONTROL CONSOLE</div>
        <nav class="app-nav" aria-label="ناوبری محصول">
          ${nav("/dashboard", "dashboard", "نمای کلی")}
          ${nav("/request", "requests", "درخواست دسترسی")}
          ${nav("/data", "database", "اطلس داده")}
          ${nav("/map", "atlas", "نقشه اکوسیستم")}
        </nav>
        <div class="app-sidebar__footer">
          <span class="live-dot"></span>
          Demo workspace
        </div>
      </aside>

      <div class="app-main">
        <header class="app-topbar">
          <div class="app-topbar__title">
            <button id="app-menu-toggle" class="icon-button app-menu-toggle" type="button" aria-label="باز کردن منوی کنسول" aria-expanded="false">${icon("menu")}</button>
            <div>
              <small>رهجو / محیط نمایشی</small>
              <strong>${title}</strong>
            </div>
          </div>
          <div class="site-header__actions">
            <span class="demo-badge">Demo data</span>
            <button id="global-search" class="icon-button" type="button" aria-label="جست‌وجوی سریع">${icon("search")}</button>
          </div>
        </header>
        <main id="main-content" class="app-content">${content}</main>
      </div>
    </div>`;
}
