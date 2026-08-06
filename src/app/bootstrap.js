import { Router } from "./router.js";
import { renderDashboardPage } from "../features/dashboard/dashboardPage.js";
import { renderMarketingPage } from "../features/marketing/marketingPage.js";
import { mountRequestPage, renderRequestPage } from "../features/requests/requestPage.js";

const root = document.querySelector("#app");
if (!(root instanceof HTMLElement)) throw new Error("App root not found");

/** @type {Router} */
let router;
router = new Router({
  root,
  routes: [
    { path: "/", title: "زیرساخت داده و احراز", render: renderMarketingPage },
    { path: "/dashboard", title: "داشبورد نمایشی", render: renderDashboardPage },
    {
      path: "/request",
      title: "درخواست نمایشی",
      render: renderRequestPage,
      mount: () => mountRequestPage(() => router.handleNavigation())
    }
  ]
});

router.start();
