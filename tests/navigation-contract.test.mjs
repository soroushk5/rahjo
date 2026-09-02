import assert from "node:assert/strict";
import test from "node:test";
import { allDestinations, consoleNavigation, publicJourney, publicNavigation, secondaryConsoleNavigation } from "../src/app/navigation.js";
import { renderPresentationMarketingPage } from "../src/features/marketing/presentationMarketing.js";
import { renderPlatformPage } from "../src/features/platform/platformPage.js";
import { renderPresentationAtlasPage } from "../src/features/stories/presentationAtlas.js";
import { renderTrustPage } from "../src/features/trust/trustPage.js";
import { renderPresentationMapPage } from "../src/features/map/presentationMap.js";
import { renderDashboardOverviewPage, renderDashboardRequestsPage, renderDashboardDataPage, renderDashboardAuditPage } from "../src/features/dashboard/presentationDashboard.js";
import { renderRequestPage } from "../src/features/requests/requestPage.js";
import { renderLoginPage } from "../src/features/auth/loginPage.js";
import { renderAutomationPage, renderCrmPage, renderGovernancePage, renderOperationalDashboardPage, renderSalesPage, renderServicesPage, renderThinkRoomPage } from "../src/features/operations/operationalPages.js";

const knownRoutes = new Set([
  "/", "/data", "/stories", "/map", "/platform", "/trust", "/login",
  "/dashboard", "/crm", "/sales", "/services", "/automation", "/governance", "/think-room",
  "/dashboard/requests", "/dashboard/data", "/dashboard/audit", "/request"
]);

const renderers = [
  renderPresentationMarketingPage,
  renderPlatformPage,
  renderPresentationAtlasPage,
  renderTrustPage,
  renderPresentationMapPage,
  renderDashboardOverviewPage,
  renderDashboardRequestsPage,
  renderDashboardDataPage,
  renderDashboardAuditPage,
  renderRequestPage,
  () => renderLoginPage({ returnTo: "/dashboard" }),
  renderOperationalDashboardPage,
  renderCrmPage,
  renderSalesPage,
  renderServicesPage,
  renderAutomationPage,
  renderGovernancePage,
  renderThinkRoomPage
];

function internalHrefs(html) {
  return [...html.matchAll(/href="(\/[^"]*)"/g)].map((match) => match[1]);
}

test("shared navigation only points at registered routes", () => {
  for (const item of [...publicNavigation, ...consoleNavigation, ...secondaryConsoleNavigation, ...publicJourney, ...allDestinations]) {
    assert.ok(knownRoutes.has(item.path), `Unknown navigation route: ${item.path}`);
  }
});

test("rendered primary pages contain no orphan internal links", () => {
  for (const render of renderers) {
    for (const href of internalHrefs(render())) {
      assert.ok(knownRoutes.has(href), `Orphan internal href: ${href}`);
    }
  }
});

test("public walkthrough follows operational product sequencing", () => {
  assert.deepEqual(publicJourney.map((item) => item.path), ["/", "/platform", "/data", "/map", "/trust", "/login"]);
  assert.equal(new Set(publicJourney.map((item) => item.path)).size, publicJourney.length);
  assert.deepEqual(publicNavigation.map((item) => item.label), ["خانه", "محصول", "سرویس‌ها", "نحوه کار", "اعتماد و کنترل"]);
});
