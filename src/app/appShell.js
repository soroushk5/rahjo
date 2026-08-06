import { brandLogo } from "../components/brandLogo.js";
import { icon } from "../components/icons.js";

/** @param {{content: string, activePath: string, title: string}} options */
export function appShell({ content, activePath, title }) {
  const navItem = (path, iconName, label) => `
    <a data-link href="${path}" ${activePath === path ? 'aria-current="page"' : ""}>
      <span aria-hidden="true">${icon(iconName)}</span><span>${label}</span>
    </a>`;

  return `
    <div class="app-shell">
      <aside class="app-sidebar">
        <a data-link href="/">${brandLogo({ inverted: true })}</a>
        <nav class="app-nav" aria-label="ناوبری محصول">
          ${navItem("/dashboard", "dashboard", "داشبورد")}
          ${navItem("/request", "requests", "درخواست جدید")}
          ${navItem("/dashboard", "api", "APIها")}
          ${navItem("/dashboard", "workflow", "گردش‌کارها")}
          ${navItem("/dashboard", "reports", "گزارش‌ها")}
          ${navItem("/dashboard", "settings", "تنظیمات")}
        </nav>
        <div class="app-sidebar__footer">Rahjo Platform · Demo</div>
      </aside>
      <div class="app-main">
        <header class="app-topbar">
          <strong>${title}</strong>
          <div class="site-header__actions">
            <button class="icon-button" aria-label="جست‌وجو">${icon("search")}</button>
            <button class="icon-button" aria-label="اعلان‌ها">${icon("bell")}</button>
          </div>
        </header>
        <main id="main-content" class="app-content">${content}</main>
      </div>
    </div>`;
}
