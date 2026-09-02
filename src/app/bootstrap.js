import { Router } from "./router.js";
import { mountPrototypeChrome } from "./prototypeChrome.js";
import { mountConnectedDashboardData, mountConnectedDashboardRequests, mountConnectedRequestFlow } from "./connectedFlow.js";
import { renderPresentationMarketingPage, mountPresentationMarketingPage } from "../features/marketing/presentationMarketing.js";
import { renderPlatformPage } from "../features/platform/platformPage.js";
import { mountPresentationAtlasPage, renderPresentationAtlasPage } from "../features/stories/presentationAtlas.js";
import { mountTrustPage, renderTrustPage } from "../features/trust/trustPage.js";
import { mountPresentationMapPage, renderPresentationMapPage } from "../features/map/presentationMap.js";
import { mountDashboardDataPage, mountDashboardRequestsPage, renderDashboardAuditPage, renderDashboardDataPage, renderDashboardOverviewPage, renderDashboardRequestsPage } from "../features/dashboard/presentationDashboard.js";
import { mountRequestPage, renderRequestPage } from "../features/requests/requestPage.js";
import { mountLoginPage, renderLoginPage } from "../features/auth/loginPage.js";
import {
  mountAutomationPage,
  mountCrmPage,
  mountGovernancePage,
  mountOperationalDashboardPage,
  mountSalesPage,
  mountServicesPage,
  mountThinkRoomPage,
  renderAutomationPage,
  renderCrmPage,
  renderGovernancePage,
  renderOperationalDashboardPage,
  renderSalesPage,
  renderServicesPage,
  renderThinkRoomPage
} from "../features/operations/operationalPages.js";
import { isAuthenticated } from "../services/authStore.js";

const root = document.querySelector("#app");
if (!(root instanceof HTMLElement)) throw new Error("App root not found");

/** @type {Router} */
let router;

/** @param {((rerender: () => void) => void) | undefined} pageMount */
function withChrome(pageMount) {
  return () => {
    mountPrototypeChrome();
    pageMount?.(() => router.handleNavigation());
  };
}

/** @param {() => string} render @param {string} returnTo */
function renderWithSession(render, returnTo) {
  return () => isAuthenticated() ? render() : renderLoginPage({ returnTo });
}

/** @param {((rerender: () => void) => void) | undefined} pageMount @param {string} returnTo */
function mountWithSession(pageMount, returnTo) {
  return () => {
    mountPrototypeChrome();
    if (isAuthenticated()) {
      pageMount?.(() => router.handleNavigation());
      return;
    }
    mountLoginPage({ onSuccess: (path) => router.navigate(path || returnTo) });
  };
}

/**
 * @param {((rerender: () => void) => void) | undefined} primary
 * @param {() => void} enhancement
 * @returns {(rerender: () => void) => void}
 */
function composeMount(primary, enhancement) {
  return function composedMount(rerender) {
    primary?.(rerender);
    enhancement();
  };
}

function loginMount() {
  mountPrototypeChrome();
  mountLoginPage({ onSuccess: (path) => router.navigate(path || "/dashboard") });
}

router = new Router({
  root,
  routes: [
    { path: "/", title: "دسترسی کنترل‌شده به داده", description: "رهجو؛ زیرساخت دسترسی کنترل‌شده به داده برای کاربردهای سازمانی.", render: renderPresentationMarketingPage, mount: withChrome(mountPresentationMarketingPage) },
    { path: "/data", title: "اطلس داده", render: renderPresentationAtlasPage, mount: withChrome(mountPresentationAtlasPage) },
    { path: "/stories", title: "اطلس داده", render: renderPresentationAtlasPage, mount: withChrome(mountPresentationAtlasPage) },
    { path: "/platform", title: "معماری پلتفرم", render: renderPlatformPage, mount: withChrome(undefined) },
    { path: "/trust", title: "کنترل دسترسی", render: renderTrustPage, mount: withChrome(mountTrustPage) },
    { path: "/map", title: "نقشه اکوسیستم", render: renderPresentationMapPage, mount: withChrome(mountPresentationMapPage) },
    { path: "/login", title: "ورود به محیط نمایشی", render: () => renderLoginPage({ returnTo: "/dashboard" }), mount: loginMount },
    { path: "/dashboard", title: "داشبورد عملیات", render: renderWithSession(renderOperationalDashboardPage, "/dashboard"), mount: mountWithSession(mountOperationalDashboardPage, "/dashboard") },
    { path: "/crm", title: "مشتریان و حافظه تجاری", render: renderWithSession(renderCrmPage, "/crm"), mount: mountWithSession(mountCrmPage, "/crm") },
    { path: "/sales", title: "فروش", render: renderWithSession(renderSalesPage, "/sales"), mount: mountWithSession(mountSalesPage, "/sales") },
    { path: "/services", title: "سرویس‌ها و APIها", render: renderWithSession(renderServicesPage, "/services"), mount: mountWithSession(mountServicesPage, "/services") },
    { path: "/automation", title: "اتوماسیون", render: renderWithSession(renderAutomationPage, "/automation"), mount: mountWithSession(mountAutomationPage, "/automation") },
    { path: "/governance", title: "ممیزی و کیفیت داده", render: renderWithSession(renderGovernancePage, "/governance"), mount: mountWithSession(mountGovernancePage, "/governance") },
    { path: "/think-room", title: "اتاق فکر — آینده", render: renderWithSession(renderThinkRoomPage, "/think-room"), mount: mountWithSession(mountThinkRoomPage, "/think-room") },
    { path: "/dashboard/requests", title: "درخواست‌ها", render: renderWithSession(renderDashboardRequestsPage, "/dashboard/requests"), mount: mountWithSession(composeMount(mountDashboardRequestsPage, mountConnectedDashboardRequests), "/dashboard/requests") },
    { path: "/dashboard/data", title: "سبد داده", render: renderWithSession(renderDashboardDataPage, "/dashboard/data"), mount: mountWithSession(composeMount(mountDashboardDataPage, mountConnectedDashboardData), "/dashboard/data") },
    { path: "/dashboard/audit", title: "کنترل و ممیزی", render: renderWithSession(renderDashboardAuditPage, "/dashboard/audit"), mount: mountWithSession(undefined, "/dashboard/audit") },
    { path: "/request", title: "درخواست دسترسی", render: renderWithSession(renderRequestPage, "/request"), mount: mountWithSession(composeMount(mountRequestPage, mountConnectedRequestFlow), "/request") }
  ]
});

router.start();
