import { Router } from "./router.js";
import { renderMarketingPage, mountMarketingPage } from "../features/marketing/marketingPage.js";
import { renderPlatformPage } from "../features/platform/platformPage.js";
import { renderDataCatalogPage } from "../features/stories/storiesPage.js";
import { renderTrustPage } from "../features/trust/trustPage.js";
import { renderMapPage, mountMapPage } from "../features/map/mapPage.js";
import { renderDashboardPage } from "../features/dashboard/dashboardPage.js";
import { mountRequestPage, renderRequestPage } from "../features/requests/requestPage.js";

const root = document.querySelector("#app");
if (!(root instanceof HTMLElement)) throw new Error("App root not found");

/** @type {Router} */
let router;

const renderAndMountMap = () => mountMapPage(() => router.handleNavigation());
const renderAndMountMarketing = () => mountMarketingPage(() => router.handleNavigation());
const renderAndMountRequest = () => mountRequestPage(() => router.handleNavigation());

router = new Router({
  root,
  routes: [
    {
      path: "/",
      title: "دسترسی کنترل‌شده به داده",
      description: "رهجو؛ زیرساخت دسترسی کنترل‌شده به داده‌های حساس و سازمانی.",
      render: renderMarketingPage,
      mount: renderAndMountMarketing
    },
    { path: "/data", title: "اطلس داده", render: renderDataCatalogPage },
    { path: "/stories", title: "اطلس داده", render: renderDataCatalogPage },
    { path: "/platform", title: "معماری پلتفرم", render: renderPlatformPage },
    { path: "/trust", title: "کنترل دسترسی", render: renderTrustPage },
    { path: "/map", title: "نقشه اکوسیستم", render: renderMapPage, mount: renderAndMountMap },
    { path: "/dashboard", title: "کنسول داده", render: renderDashboardPage },
    { path: "/request", title: "درخواست دسترسی", render: renderRequestPage, mount: renderAndMountRequest }
  ]
});

router.start();
