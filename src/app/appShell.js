// @ts-nocheck
import { brandLogo } from "../components/brandLogo.js";
import { icon } from "../components/icons.js";
import { consoleNavigation, routeLabel } from "./navigation.js";
import { getSession } from "../services/authStore.js";

function activeNavPath(path) {
  if (path === "/customers/detail") return "/customers";
  if (path === "/requests/detail") return "/requests";
  return path;
}

export function appShell({ content, activePath, title }) {
  const session = getSession();
  const user = session?.user ?? { name: "نسترن احمدی", role: "مدیر عملیات", organization: "محیط نمایشی رهجو", initials: "ن‌ا" };
  const active = activeNavPath(activePath);
  const daily = consoleNavigation.slice(0, 8);
  const management = consoleNavigation.slice(8);
  const nav = (item) => `
    <a data-link href="${item.path}" ${active === item.path ? 'aria-current="page"' : ""}>
      <span class="app-nav__icon">${icon(item.icon, { size: 19 })}</span>
      <span>${item.label}</span>
    </a>`;

  return `
    <div class="phase-app-shell">
      <aside class="phase-sidebar" aria-label="ناوبری محیط عملیاتی">
        <a data-link href="/" class="phase-sidebar__brand">${brandLogo({ inverted: true })}<small>سامانهٔ عملیات کسب‌وکار</small></a>
        <nav class="phase-app-nav" aria-label="ناوبری محصول">
          <small>کار روزانه</small>
          ${daily.map(nav).join("")}
          <small>مدیریت</small>
          ${management.map(nav).join("")}
        </nav>
        <div class="phase-sidebar__bottom">
          <a data-link href="/" class="phase-sidebar__public">${icon("external", { size: 17 })} بازگشت به سایت</a>
          <div class="phase-user">
            <span>${user.initials}</span>
            <div><strong>${user.name}</strong><small>${user.role}</small></div>
            <a data-link data-logout href="/login" aria-label="خروج از دمو">${icon("logout", { size: 17 })}</a>
          </div>
        </div>
      </aside>

      <div class="phase-app-main">
        <div class="demo-strip"><span>${icon("shield", { size: 16 })} نسخهٔ نمایشی — تمام نام‌ها، داده‌ها، پرداخت‌ها و عملیات این محیط ساختگی هستند.</span></div>
        <header class="phase-topbar">
          <div class="phase-topbar__title">
            <button id="app-menu-toggle" class="icon-button app-menu-toggle" type="button" aria-label="باز کردن منوی محیط عملیاتی" aria-expanded="false">${icon("menu")}</button>
            <div><small>محیط عملیاتی / ${routeLabel(activePath)}</small><strong>${title}</strong></div>
          </div>
          <div class="phase-topbar__actions">
            <button id="global-search" class="phase-search" type="button">${icon("search", { size: 17 })}<span>جست‌وجوی مشتری، درخواست، سند…</span><kbd>/</kbd></button>
            <a data-link class="button button--primary" href="/request-service">درخواست جدید ${icon("arrow", { size: 15 })}</a>
          </div>
        </header>
        <main id="main-content" class="phase-app-content">${content}</main>
      </div>
    </div>`;
}
