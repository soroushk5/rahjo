// @ts-nocheck
import { Router } from "./router.js";
import { mountPrototypeChrome } from "./prototypeChrome.js";
import {
  mountPublicPage,
  renderNotFoundPage,
  renderPrivacyPage,
  renderTermsPage
} from "../features/public/publicPages.js";
import {
  renderMinimalContactPage,
  renderMinimalHomePage,
  renderMinimalProductPage,
  renderMinimalTrackPage
} from "../features/public/minimalPublicPages.js";
import { mountServiceRequestPage, renderServiceRequestPage } from "../features/requests/serviceRequestPage.js";
import { mountCorePages, renderCustomersPage, renderDashboardPage, renderRequestsPage, renderSalesPage, renderServicesAdminPage, renderTasksPage } from "../features/operations/corePages.js";
import { mountDetailPages, renderCustomerDetailPage, renderRequestDetailPage } from "../features/operations/detailPages.js";
import { mountSupportPages, renderAuditPage, renderDocumentsPage, renderFinancePage, renderOperationsPage, renderReportsPage, renderSettingsPage } from "../features/operations/supportPages.js";
import { mountLoginPage, renderLoginPage } from "../features/auth/loginPage.js";
import { isAuthenticated } from "../services/authStore.js";
import { applyRuntimeBoundary, initializeRuntimeFromDocument } from "./runtimeBoundary.js";

await initializeRuntimeFromDocument();

const root = document.querySelector("#app");
if (!(root instanceof HTMLElement)) throw new Error("App root not found");

let router;

function withChrome(pageMount) {
  return () => {
    mountPrototypeChrome();
    pageMount?.(() => router.handleNavigation());
  };
}

function renderWithSession(render, returnTo) {
  return () => isAuthenticated() ? render() : renderLoginPage({ returnTo });
}

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

function loginMount() {
  mountPrototypeChrome();
  mountLoginPage({ onSuccess: (path) => router.navigate(path || "/dashboard") });
}

const publicMount = withChrome(mountPublicPage);
const coreMount = (path) => mountWithSession(mountCorePages, path);
const detailMount = (path) => mountWithSession(mountDetailPages, path);
const supportMount = (path) => mountWithSession(mountSupportPages, path);

router = new Router({
  root,
  routes: [
    { path: "/", title: "رهجو | مشتری تا نتیجه", description: "رهجو مشتری، پرونده، تصمیم و اجرای کار را در یک مسیر قابل پیگیری نگه می‌دارد.", render: renderMinimalHomePage, mount: publicMount },
    { path: "/product", title: "محصول رهجو", description: "یک فضای کاری برای مشتری، پرونده و اجرای کار.", render: renderMinimalProductPage, mount: publicMount },
    { path: "/contact", title: "شروع با رهجو", description: "از یک جریان واقعی کسب‌وکار شروع کنید.", render: renderMinimalContactPage, mount: publicMount },

    // Legacy public URLs remain routable, but their content is folded into the
    // three canonical public destinations above.
    { path: "/services", title: "محصول رهجو", render: renderMinimalProductPage, mount: publicMount },
    { path: "/use-cases", title: "محصول رهجو", render: renderMinimalProductPage, mount: publicMount },
    { path: "/how-it-works", title: "رهجو چگونه کار می‌کند", render: renderMinimalHomePage, mount: publicMount },
    { path: "/trust", title: "محصول رهجو", render: renderMinimalProductPage, mount: publicMount },
    { path: "/pilot", title: "شروع با رهجو", render: renderMinimalContactPage, mount: publicMount },
    { path: "/about", title: "رهجو", render: renderMinimalHomePage, mount: publicMount },
    { path: "/track-request", title: "پیگیری پرونده", render: renderMinimalTrackPage, mount: publicMount },

    { path: "/privacy", title: "حریم خصوصی", render: renderPrivacyPage, mount: publicMount },
    { path: "/terms", title: "شرایط استفاده", render: renderTermsPage, mount: publicMount },
    { path: "/request-service", title: "ثبت درخواست خدمت", render: renderServiceRequestPage, mount: withChrome(mountServiceRequestPage) },
    { path: "/cases/new", title: "ورود پروندهٔ جدید", render: renderServiceRequestPage, mount: withChrome(mountServiceRequestPage) },
    { path: "/login", title: "ورود به رهجو", render: () => renderLoginPage({ returnTo: "/dashboard" }), mount: loginMount },
    { path: "/dashboard", title: "داشبورد", render: renderWithSession(renderDashboardPage, "/dashboard"), mount: coreMount("/dashboard") },
    { path: "/customers", title: "مشتریان", render: renderWithSession(renderCustomersPage, "/customers"), mount: coreMount("/customers") },
    { path: "/customers/detail", title: "پرونده مشتری", render: renderWithSession(renderCustomerDetailPage, "/customers/detail"), mount: detailMount("/customers/detail") },
    { path: "/sales", title: "فروش", render: renderWithSession(renderSalesPage, "/sales"), mount: coreMount("/sales") },
    { path: "/services-admin", title: "خدمات", render: renderWithSession(renderServicesAdminPage, "/services-admin"), mount: coreMount("/services-admin") },
    { path: "/requests", title: "درخواست‌ها", render: renderWithSession(renderRequestsPage, "/requests"), mount: coreMount("/requests") },
    { path: "/requests/detail", title: "جزئیات درخواست", render: renderWithSession(renderRequestDetailPage, "/requests/detail"), mount: detailMount("/requests/detail") },
    { path: "/tasks", title: "کارها و پیگیری‌ها", render: renderWithSession(renderTasksPage, "/tasks"), mount: coreMount("/tasks") },
    { path: "/operations", title: "عملیات و گردش‌کار", render: renderWithSession(renderOperationsPage, "/operations"), mount: supportMount("/operations") },
    { path: "/finance", title: "مالی و اعتبار", render: renderWithSession(renderFinancePage, "/finance"), mount: supportMount("/finance") },
    { path: "/documents", title: "اسناد", render: renderWithSession(renderDocumentsPage, "/documents"), mount: supportMount("/documents") },
    { path: "/reports", title: "گزارش‌ها", render: renderWithSession(renderReportsPage, "/reports"), mount: supportMount("/reports") },
    { path: "/audit", title: "ممیزی و کیفیت داده", render: renderWithSession(renderAuditPage, "/audit"), mount: supportMount("/audit") },
    { path: "/settings", title: "تنظیمات", render: renderWithSession(renderSettingsPage, "/settings"), mount: supportMount("/settings") },
    { path: "*", title: "صفحه پیدا نشد", render: renderNotFoundPage, mount: withChrome(undefined) }
  ].map(applyRuntimeBoundary)
});

window.addEventListener("rahjo:runtime-data", () => router.handleNavigation());
router.start();
