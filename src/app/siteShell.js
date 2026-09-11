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
    <div class="page phase-site rv-site mp-site">
      <header class="phase-header rv-header mp-header">
        <div class="container phase-header__inner rv-header__inner mp-header__inner">
          <a data-link href="/" class="site-brand-link rv-brand mp-brand" aria-label="صفحهٔ اصلی رهجو">${brandLogo()}</a>
          <nav id="site-nav" class="phase-nav rv-nav mp-nav" aria-label="ناوبری اصلی">
            ${publicNavigation.map((item) => link(item.path, item.label)).join("")}
          </nav>
          <div class="phase-header__actions rv-header__actions mp-header__actions">
            <button id="mobile-nav-toggle" class="icon-button mobile-nav-toggle" type="button" aria-label="باز کردن منو" aria-controls="site-nav" aria-expanded="false">${icon("menu")}</button>
            <a data-link class="mp-login" href="${workspaceHref}">${workspaceLabel}</a>
            ${workspaceReady
              ? `<a data-link class="button button--primary mp-header__primary" href="/dashboard">باز کردن رهجو</a>`
              : `<a data-link class="button button--primary mp-header__primary" href="/contact">شروع</a>`}
          </div>
        </div>
      </header>

      <main id="main-content" class="rv-main mp-main">${content}</main>

      <footer class="phase-footer rv-footer mp-footer">
        <div class="container mp-footer__inner">
          <div class="mp-footer__brand">${brandLogo({ inverted: true })}<p>رهجو، مسیر مشتری تا نتیجه.</p></div>
          <nav class="mp-footer__links" aria-label="پیوندهای پایین صفحه">
            ${link("/product", "محصول")}${link("/contact", "شروع")}${link("/login", "ورود")}${link("/privacy", "حریم خصوصی")}${link("/terms", "شرایط استفاده")}
          </nav>
        </div>
        <div class="container mp-footer__bottom"><span>Rahjo / رهجو</span><span>© ۱۴۰۵</span></div>
      </footer>
    </div>`;
}
