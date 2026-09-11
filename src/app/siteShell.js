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
  const workspaceLabel = workspaceReady ? "ورود به محیط کار" : "ورود به رهجو";
  const link = (path, label) => `<a data-link href="${path}" ${activePath === path ? 'aria-current="page"' : ""}>${label}</a>`;

  return `
    <div class="page phase-site">
      <header class="phase-header">
        <div class="container phase-header__inner">
          <a data-link href="/" class="site-brand-link" aria-label="صفحهٔ اصلی رهجو">${brandLogo()}</a>
          <nav id="site-nav" class="phase-nav" aria-label="ناوبری اصلی">
            ${publicNavigation.map((item) => link(item.path, item.label)).join("")}
          </nav>
          <div class="phase-header__actions">
            <button id="mobile-nav-toggle" class="icon-button mobile-nav-toggle" type="button" aria-label="باز کردن منو" aria-controls="site-nav" aria-expanded="false">${icon("menu")}</button>
            <a data-link class="button button--primary" href="${workspaceHref}">${workspaceLabel} ${icon("arrow", { size: 16 })}</a>
          </div>
        </div>
      </header>

      <main id="main-content">${content}</main>

      <footer class="phase-footer">
        <div class="container phase-footer__grid">
          <div class="phase-footer__brand">
            ${brandLogo({ inverted: true })}
            <p>زیرساخت عملیاتی مشتری تا نتیجه؛ از ورودی و حافظهٔ تجاری تا پرونده، تأیید، اجرا و خروجی قابل پیگیری.</p>
          </div>
          <div><strong>محصول</strong>${link("/product", "محصول")}${link("/services", "خدمات")}${link("/use-cases", "موارد استفاده")}${link("/how-it-works", "نحوهٔ کار")}</div>
          <div><strong>شروع</strong>${link("/contact", "بررسی کسب‌وکار من")}${link("/pilot", "راه‌اندازی رهجو")}${link("/login", "ورود به رهجو")}${link("/track-request", "پیگیری درخواست")}</div>
          <div><strong>رهجو</strong>${link("/trust", "اعتماد و کنترل")}${link("/about", "دربارهٔ رهجو")}${link("/privacy", "حریم خصوصی")}${link("/terms", "شرایط استفاده")}</div>
        </div>
        <div class="container phase-footer__bottom"><span>رهجو — مسیر روشن از مشتری تا نتیجه</span><span>© ۱۴۰۵</span></div>
      </footer>
    </div>`;
}
