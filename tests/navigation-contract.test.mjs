import assert from "node:assert/strict";
import test from "node:test";
import { allDestinations, consoleNavigation, publicNavigation } from "../src/app/navigation.js";
import {
  renderAboutPage, renderContactPage, renderHomePage, renderHowItWorksPage, renderPilotPage,
  renderPrivacyPage, renderProductPage, renderServicesPage, renderTermsPage, renderTrackRequestPage,
  renderTrustPage, renderUseCasesPage
} from "../src/features/public/publicPages.js";
import { renderLoginPage } from "../src/features/auth/loginPage.js";
import { renderServiceRequestPage } from "../src/features/requests/serviceRequestPage.js";
import { renderCustomersPage, renderDashboardPage, renderRequestsPage, renderSalesPage, renderServicesAdminPage, renderTasksPage } from "../src/features/operations/corePages.js";
import { renderCustomerDetailPage, renderRequestDetailPage } from "../src/features/operations/detailPages.js";
import { renderAuditPage, renderDocumentsPage, renderFinancePage, renderOperationsPage, renderReportsPage, renderSettingsPage } from "../src/features/operations/supportPages.js";

const knownRoutes = new Set([
  "/", "/product", "/services", "/use-cases", "/how-it-works", "/pilot", "/trust", "/about", "/contact",
  "/privacy", "/terms", "/track-request", "/request-service", "/login", "/dashboard", "/customers", "/customers/detail",
  "/sales", "/services-admin", "/requests", "/requests/detail", "/tasks", "/operations", "/finance", "/documents", "/reports", "/audit", "/settings"
]);

const renderers = [
  renderHomePage, renderProductPage, renderServicesPage, renderUseCasesPage, renderHowItWorksPage,
  renderPilotPage, renderTrustPage, renderAboutPage, renderContactPage, renderPrivacyPage, renderTermsPage,
  renderTrackRequestPage, renderServiceRequestPage, () => renderLoginPage({ returnTo: "/dashboard" }),
  renderDashboardPage, renderCustomersPage, renderCustomerDetailPage, renderSalesPage, renderServicesAdminPage,
  renderRequestsPage, renderRequestDetailPage, renderTasksPage, renderOperationsPage, renderFinancePage,
  renderDocumentsPage, renderReportsPage, renderAuditPage, renderSettingsPage
];

function internalHrefs(html) {
  return [...html.matchAll(/href="(\/[^"#?]*)/g)].map((match) => match[1]);
}

test("shared navigation only points at registered phase-one routes", () => {
  for (const item of allDestinations) assert.ok(knownRoutes.has(item.path), `Unknown navigation route: ${item.path}`);
});

test("rendered phase-one pages contain no orphan internal links", () => {
  for (const render of renderers) {
    for (const href of internalHrefs(render())) assert.ok(knownRoutes.has(href), `Orphan internal href: ${href}`);
  }
});

test("public and operations navigation expose the intended information architecture", () => {
  assert.deepEqual(publicNavigation.map((item) => item.path), ["/", "/product", "/services", "/use-cases", "/how-it-works"]);
  assert.deepEqual(consoleNavigation.map((item) => item.path), [
    "/dashboard", "/customers", "/sales", "/services-admin", "/requests", "/tasks",
    "/operations", "/finance", "/documents", "/reports", "/audit", "/settings"
  ]);
});
