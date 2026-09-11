// @ts-nocheck
import { brandLogo } from "../components/brandLogo.js";
import { icon } from "../components/icons.js";
import { publicNavigation } from "./navigation.js";
import { isAuthenticated } from "../services/authStore.js";
import { RUNTIME_DATA_STATES, runtimeData } from "../services/runtimeDataFacade.js";

export function siteShell({ content, activePath }) {
  const signedIn = isAuthenticated();
  const runtime = runtimeData.read();
  const serverReady = runtime.mode === "server" && runtime.state === RUNTIME_DATA_STATES.READY;
  const workspaceReady = signedIn || serverReady;
  const workspaceHref = workspaceReady ? "/dashboard" : "/login";
  const workspaceLabel = workspaceReady ? "محیط کار" : "ورود";
  const link = (path, label) => `<a data-link href="${path}" ${activePath === path ? 'aria-current="page"' : ""}>${label}</a>`;

  return `
    <div class="page phase-site rv-site">
      <header class="phase-header rv-header">
        <div class="container phase-header__inner rv-header__inner">
          <a data-link href="/" class="site-brand-link rv-brand" aria-label="صفحهٔ اصلی رهجو">${brandLogo()}</a>
          <nav id="site-nav" class="phase-nav rv-nav" aria-label="ناوبری اصلی">
            ${publicNavigation.map((item) => link(item.path, item.label)).join("")}
          </nav>
          <div class="phase-header__actions rv-header__actions">
            <button id="mobile-nav-toggle" class="icon-button mobile-nav-toggle" type="button" aria-label="باز کردن منو" aria-controls="site-nav" aria-expanded="false">${icon("menu")}</button>
            <a data-link class="rv-header__workspace" href="${workspaceHref}">${workspaceLabel}</a>
            ${workspaceReady
              ? `<a data-link class="button button--primary rv-header__primary" href="/dashboard">باز کردن رهجو ${icon("arrow", { size: 15 })}</a>`
              : `<a data-link class="button button--primary rv-header__primary" href="/contact">شروع بررسی ${icon("arrow", { size: 15 })}</a>`}
          </div>
        </div>
      </header>

      <main id="main-content" class="rv-main">${content}</main>

      <footer class="phase-footer rv-footer">
        <div class="container rv-footer__top">
          <div class="rv-footer__statement">
            ${brandLogo({ inverted: true })}
            <p>یک مسیر عملیاتی برای رابطهٔ مشتری، پرونده، تصمیم، اجرا و نتیجه.</p>
            <span>هستهٔ اصلی بدون وابستگی به AI کار می‌کند.</span>
          </div>
          <div class="rv-footer__links">
            <div><strong>محصول</strong>${link("/product", "محصول")}${link("/services", "خدمات")}${link("/how-it-works", "نحوهٔ کار")}${link("/use-cases", "موارد استفاده")}</div>
            <div><strong>شروع</strong>${link("/contact", "شروع بررسی")}${link("/pilot", "راه‌اندازی")}${link("/login", "ورود")}${link("/track-request", "پیگیری پرونده")}</div>
            <div><strong>رهجو</strong>${link("/trust", "اعتماد و کنترل")}${link("/about", "دربارهٔ رهجو")}${link("/privacy", "حریم خصوصی")}${link("/terms", "شرایط استفاده")}</div>
          </div>
        </div>
        <div class="container phase-footer__bottom rv-footer__bottom"><span>Rahjo / رهجو</span><span>© ۱۴۰۵</span></div>
      </footer>
    </div>`;
}
