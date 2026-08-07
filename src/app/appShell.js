import { brandLogo } from "../components/brandLogo.js";
import { icon } from "../components/icons.js";
import { consoleNavigation, routeLabel } from "./navigation.js";
import { getSession } from "../services/authStore.js";

/** @param {{content: string, activePath: string, title: string}} options */
export function appShell({ content, activePath, title }) {
  const session = getSession();
  const user = session?.user ?? { name: "کاربر دمو", role: "مدیر دسترسی داده", organization: "شرکت نمونه سازمانی", initials: "ر" };

  /** @param {{path:string, icon:string, label:string}} item */
  const nav = (item) => `
    <a data-link href="${item.path}" ${activePath === item.path ? 'aria-current="page"' : ""}>
      <span class="app-nav__icon">${icon(item.icon, { size: 18 })}</span>
      <span>${item.label}</span>
    </a>`;

  const primaryConsole = consoleNavigation.filter((item) => item.path.startsWith("/dashboard"));
  const requestItem = consoleNavigation.find((item) => item.path === "/request");

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
          ${primaryConsole.map(nav).join("")}
          <small class="app-nav__label app-nav__label--second">اقدام و کاوش</small>
          ${requestItem ? nav(requestItem) : ""}
          <a data-link href="/data"><span class="app-nav__icon">${icon("atlas", { size: 18 })}</span><span>اطلس داده</span></a>
          <a data-link href="/map"><span class="app-nav__icon">${icon("node", { size: 18 })}</span><span>نقشه اکوسیستم</span></a>
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
            <div><small>کنسول رهجو <b>/</b> ${routeLabel(activePath)}</small><strong>${title}</strong></div>
          </div>
          <div class="app-topbar__actions">
            <span class="environment-badge"><i></i>Sandbox</span>
            <button id="global-search" class="icon-button" type="button" aria-label="جست‌وجوی سریع">${icon("search")}</button>
            <a data-link class="button button--primary app-topbar__request" href="/request">درخواست جدید ${icon("arrow", { size: 15 })}</a>
          </div>
        </header>
        <div class="app-context-strip">
          <span>${icon("shield", { size: 15 })} محیط نمایشی</span>
          <a data-link href="/data">اطلس داده</a>
          <i></i>
          <a data-link href="/map">نقشه جریان</a>
          <i></i>
          <a data-link href="/trust">منطق Gate</a>
        </div>
        <main id="main-content" class="app-content">${content}</main>
      </div>
    </div>`;
}
