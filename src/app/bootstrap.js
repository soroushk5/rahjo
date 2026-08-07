import { Router } from "./router.js";
import { mountPrototypeChrome } from "./prototypeChrome.js";
import { renderMarketingPage, mountMarketingPage } from "../features/marketing/marketingPage.js";
import { renderPlatformPage } from "../features/platform/platformPage.js";
import { mountDataCatalogPage, renderDataCatalogPage } from "../features/stories/storiesPage.js";
import { renderTrustPage } from "../features/trust/trustPage.js";
import { renderMapPage, mountMapPage } from "../features/map/mapPage.js";
import { mountDashboardPage, renderDashboardPage } from "../features/dashboard/dashboardPage.js";
import { mountRequestPage, renderRequestPage } from "../features/requests/requestPage.js";

const root = document.querySelector("#app");
if (!(root instanceof HTMLElement)) throw new Error("App root not found");

/** @type {Router} */
let router;

/** @param {((rerender: () => void) => void) | undefined} pageMount */
function withPrototypeChrome(pageMount) {
  return () => {
    mountPrototypeChrome();
    pageMount?.(() => router.handleNavigation());
  };
}

router = new Router({
  root,
  routes: [
    {
      path: "/",
      title: "دسترسی کنترل‌شده به داده",
      description: "رهجو؛ زیرساخت دسترسی کنترل‌شده به داده‌های حساس و سازمانی.",
      render: renderMarketingPage,
      mount: withPrototypeChrome(mountMarketingPage)
    },
    { path: "/data", title: "اطلس داده", render: renderDataCatalogPage, mount: withPrototypeChrome(mountDataCatalogPage) },
    { path: "/stories", title: "اطلس داده", render: renderDataCatalogPage, mount: withPrototypeChrome(mountDataCatalogPage) },
    { path: "/platform", title: "معماری پلتفرم", render: renderPlatformPage, mount: withPrototypeChrome(undefined) },
    { path: "/trust", title: "کنترل دسترسی", render: renderTrustPage, mount: withPrototypeChrome(undefined) },
    { path: "/map", title: "نقشه اکوسیستم", render: renderMapPage, mount: withPrototypeChrome(mountMapPage) },
    { path: "/dashboard", title: "کنسول داده", render: renderDashboardPage, mount: withPrototypeChrome(mountDashboardPage) },
    { path: "/request", title: "درخواست دسترسی", render: renderRequestPage, mount: withPrototypeChrome(mountRequestPage) }
  ]
});

router.start();
