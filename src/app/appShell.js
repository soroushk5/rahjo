// @ts-nocheck
import { brandLogo } from "../components/brandLogo.js";
import { icon } from "../components/icons.js";
import { consoleNavigation, routeLabel } from "./navigation.js";
import { getSession } from "../services/authStore.js";
import { runtimeData, RUNTIME_DATA_STATES } from "../services/runtimeDataFacade.js";

function activeNavPath(path) {
  if (path === "/customers/detail") return "/customers";
  if (path === "/requests/detail") return "/requests";
  return path;
}

const CONSOLE_GROUPS = Object.freeze([
  {
    label: "کار روزانه",
    paths: ["/dashboard", "/customers", "/sales", "/requests", "/tasks"]
  },
  {
    label: "اجرا و پشتیبانی",
    paths: ["/services-admin", "/operations", "/finance", "/documents"]
  },
  {
    label: "مدیریت",
    paths: ["/reports", "/audit", "/settings"]
  }
]);

function cleanConsoleCopy(content) {
  return String(content || "")
    .replaceAll("AI خاموش · ", "")
    .replaceAll("بدون مدل AI", "ثبت‌شده روی سرور");
}

export function appShell({ content, activePath, title }) {
  const session = getSession();
  const runtime = runtimeData.read();
  const serverMode = runtime.mode === "server" && runtime.state === RUNTIME_DATA_STATES.READY;
  const liveName = runtime.user?.name || runtime.user?.email || "کاربر رهجو";
  const user = serverMode
    ? { name: liveName, role: runtime.user?.role || "کاربر", organization: runtime.workspace?.name || "رهجو", initials: liveName.slice(0, 2) }
    : session?.user ?? { name: "نسترن احمدی", role: "مدیر عملیات", organization: "Golden Demo", initials: "ن‌ا" };
  const active = activeNavPath(activePath);
  const navByPath = new Map(consoleNavigation.map((item) => [item.path, item]));
  const nav = (item) => `
    <a data-link href="${item.path}" ${active === item.path ? 'aria-current="page"' : ""}>
      <span class="app-nav__icon">${icon(item.icon, { size: 18 })}</span>
      <span>${item.label}</span>
    </a>`;
  const navGroups = CONSOLE_GROUPS.map((group) => `
    <section class="console-nav-group">
      <small class="console-nav-group__label">${group.label}</small>
      ${group.paths.map((path) => navByPath.get(path)).filter(Boolean).map(nav).join("")}
    </section>`).join("");
  const modeCopy = serverMode
    ? `محیط زندهٔ ${user.organization} — داده‌ها از سرور همین فضای کاری خوانده می‌شوند.`
    : "Golden Demo — داده‌های این محیط ساختگی و از فضای واقعی جدا هستند.";
  const safeContent = cleanConsoleCopy(content);

  return `
    <div class="phase-app-shell" data-console-ui="compact">
      <aside class="phase-sidebar" aria-label="ناوبری محیط عملیاتی">
        <a data-link href="/dashboard" class="phase-sidebar__brand" aria-label="داشبورد رهجو">
          ${brandLogo()}
          <small>فضای کاری</small>
        </a>
        <nav class="phase-app-nav" aria-label="ناوبری محصول">
          ${navGroups}
        </nav>
        <div class="phase-sidebar__bottom">
          <a data-link href="/" class="phase-sidebar__public">${icon("external", { size: 16 })} بازگشت به سایت</a>
          <div class="phase-user">
            <span>${user.initials}</span>
            <div><strong>${user.name}</strong><small>${user.role}</small></div>
            <a data-link ${serverMode ? "data-server-logout" : "data-logout"} href="/login" aria-label="خروج از رهجو">${icon("logout", { size: 17 })}</a>
          </div>
        </div>
      </aside>

      <div class="phase-app-main">
        <div class="demo-strip ${serverMode ? "demo-strip--live" : ""}">
          <span>${icon(serverMode ? "shield" : "document", { size: 15 })} ${modeCopy}</span>
        </div>
        <header class="phase-topbar">
          <div class="phase-topbar__title">
            <button id="app-menu-toggle" class="icon-button app-menu-toggle" type="button" aria-label="باز کردن منوی محیط عملیاتی" aria-expanded="false">${icon("menu")}</button>
            <div><small>${user.organization}</small><strong>${title || routeLabel(activePath)}</strong></div>
          </div>
          <div class="phase-topbar__actions">
            <button id="global-search" class="phase-search" type="button" aria-label="جست‌وجوی سریع">${icon("search", { size: 16 })}<span>جست‌وجو در رهجو</span><kbd>⌘ K</kbd></button>
            <a data-link class="button button--primary phase-topbar__primary" href="${serverMode ? "/cases/new" : "/request-service"}">${serverMode ? "پروندهٔ جدید" : "درخواست جدید"} ${icon("arrow", { size: 14 })}</a>
          </div>
        </header>
        <main id="main-content" class="phase-app-content">${safeContent}</main>
      </div>
    </div>`;
}
