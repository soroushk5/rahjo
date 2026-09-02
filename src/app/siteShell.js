import { brandLogo } from "../components/brandLogo.js";
import { icon } from "../components/icons.js";
import { journeyRail } from "../components/journeyRail.js";
import { publicNavigation } from "./navigation.js";
import { isAuthenticated } from "../services/authStore.js";

/** @param {{content: string, activePath: string}} options */
export function siteShell({ content, activePath }) {
  const signedIn = isAuthenticated();

  /** @param {string} path @param {string} label */
  const link = (path, label) => `
    <a data-link href="${path}" ${activePath === path ? 'aria-current="page"' : ""}>${label}</a>`;

  const navLinks = publicNavigation.map((item) => link(item.path, item.label)).join("");
  const workspacePath = signedIn ? "/dashboard" : "/login";
  const workspaceLabel = signedIn ? "بازگشت به داشبورد" : "دیدن دموی محصول";

  return `
    <div class="page presentation-page public-operational-site">
      <header class="site-header presentation-site-header public-site-header">
        <div class="site-header__inner container">
          <a data-link href="/" aria-label="صفحه اصلی رهجو" class="site-brand-link">${brandLogo()}</a>

          <nav id="site-nav" class="site-nav" aria-label="ناوبری اصلی">${navLinks}</nav>

          <div class="site-header__actions">
            <button id="mobile-nav-toggle" class="icon-button mobile-nav-toggle" type="button" aria-label="باز کردن منو" aria-controls="site-nav" aria-expanded="false">${icon("menu")}</button>
            <span class="public-phase-pill hide-mobile"><i></i>Phase 1 · Operational Foundation</span>
            <a data-link class="button button--primary" href="${workspacePath}">${workspaceLabel}</a>
          </div>
        </div>
      </header>

      <div class="public-context-strip">
        <div class="container">
          <span>${icon("shield", { size: 15 })} نسخه نمایشی و claim-safe؛ Catalogue یا Demo به معنی سرویس Production نیست.</span>
          <a data-link href="/trust">مرز ادعا و کنترل‌ها</a>
        </div>
      </div>

      <main id="main-content">${content}</main>
      ${journeyRail(activePath)}

      <footer class="site-footer presentation-footer public-site-footer">
        <div class="container presentation-footer__top">
          <div class="presentation-footer__brand">
            ${brandLogo()}
            <p>زیرساخت عملیاتی و تجاری رهجو؛ از ورودی و CRM تا سرویس، اقدام، Outcome و دید مدیریتی — با AI خاموش هم قابل استفاده.</p>
            <span>${icon("shield", { size: 17 })}Operational Foundation · AI-Compatible</span>
          </div>
          <div><small>محصول</small>${link("/platform", "معماری محصول")}${link("/data", "سرویس‌ها و قابلیت‌ها")}${link("/map", "نحوه کار")}</div>
          <div><small>کنترل و دمو</small>${link("/trust", "اعتماد و کنترل")}${link(workspacePath, workspaceLabel)}${signedIn ? link("/services", "سرویس‌ها در Workspace") : ""}</div>
          <div class="presentation-footer__principles"><small>اصل محصول</small><span>Commercial Memory</span><span>Human Gate</span><span>Audit Trail</span><span>No-AI Baseline</span></div>
        </div>
        <div class="container presentation-footer__bottom"><span>Rahjo · Phase 1 Operational Foundation</span><span>Website → CRM/Case → Service/Action → Outcome → Dashboard</span></div>
      </footer>
    </div>`;
}
