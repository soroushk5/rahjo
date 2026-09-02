import test from "node:test";
import assert from "node:assert/strict";
import { renderPresentationMarketingPage } from "../src/features/marketing/presentationMarketing.js";
import { renderPlatformPage } from "../src/features/platform/platformPage.js";
import { renderPresentationAtlasPage } from "../src/features/stories/presentationAtlas.js";
import { renderTrustPage } from "../src/features/trust/trustPage.js";
import { renderPresentationMapPage } from "../src/features/map/presentationMap.js";
import {
  renderDashboardAuditPage,
  renderDashboardDataPage,
  renderDashboardOverviewPage,
  renderDashboardRequestsPage
} from "../src/features/dashboard/presentationDashboard.js";
import { renderRequestPage } from "../src/features/requests/requestPage.js";
import { renderLoginPage } from "../src/features/auth/loginPage.js";
import { renderAutomationPage, renderCrmPage, renderGovernancePage, renderOperationalDashboardPage, renderSalesPage, renderServicesPage, renderThinkRoomPage } from "../src/features/operations/operationalPages.js";

const publicPages = [
  renderPresentationMarketingPage,
  renderPlatformPage,
  renderPresentationAtlasPage,
  renderTrustPage,
  renderPresentationMapPage
];

const pages = [
  ...publicPages,
  renderDashboardOverviewPage,
  renderDashboardRequestsPage,
  renderDashboardDataPage,
  renderDashboardAuditPage,
  renderRequestPage,
  renderLoginPage,
  renderOperationalDashboardPage,
  renderCrmPage,
  renderSalesPage,
  renderServicesPage,
  renderAutomationPage,
  renderGovernancePage,
  renderThinkRoomPage
];

test("all primary presentation routes render meaningful, safe markup", () => {
  for (const render of pages) {
    const html = render();
    assert.match(html, /<h1>|<h2>/);
    assert.doesNotMatch(html, /undefined|null/);
    assert.match(html, /رهجو/);
  }
});

test("public navigation exposes the operational product journey", () => {
  const html = renderPresentationMarketingPage();
  for (const path of ["/platform", "/data", "/map", "/trust", "/login", "/request"]) {
    assert.match(html, new RegExp(`href="${path}"`));
  }
});

test("presentation dashboard exposes all demo views", () => {
  const html = renderDashboardOverviewPage();
  for (const path of ["/dashboard/requests", "/dashboard/data", "/dashboard/audit", "/request"]) {
    assert.match(html, new RegExp(`href="${path}"`));
  }
});

test("visible product copy avoids newsroom framing", () => {
  const html = pages.map((render) => render()).join("\n");
  for (const phrase of ["اتاق خبر", "دفتر روایت", "میز تصمیم", "داستان داده"]) {
    assert.doesNotMatch(html, new RegExp(phrase));
  }
});

test("operational foundation surfaces preserve demo and claim boundaries", () => {
  const html = [renderOperationalDashboardPage(), renderCrmPage(), renderSalesPage(), renderServicesPage(), renderAutomationPage(), renderGovernancePage(), renderThinkRoomPage()].join("\n");
  for (const phrase of ["دمو", "داده‌های مصنوعی", "Account", "Case", "Outcome", "ممیزی", "سرویس‌ها و APIها", "اتاق فکر"]) {
    assert.match(html, new RegExp(phrase));
  }
  assert.doesNotMatch(html, /production-ready|هوش مصنوعی فعال است|تصمیم خودکار انجام می‌شود/iu);
});

test("public site tells the same operational foundation story as the workspace", () => {
  const home = renderPresentationMarketingPage();
  const publicHtml = publicPages.map((render) => render()).join("\n");

  for (const phrase of ["Operational Foundation", "CRM", "Case", "Outcome", "Dashboard", "AI خاموش", "Think Room"]) {
    assert.match(publicHtml, new RegExp(phrase, "iu"));
  }
  assert.match(home, /عملیات تجاری امروز/);
  assert.match(home, /زیرساخت هوشمندی فردا/);
  assert.doesNotMatch(home, /داده‌ای که همه‌جا نیست/);
  assert.doesNotMatch(publicHtml, /اطلس داده رهجو/);
});

test("public capability surfaces use explicit claim-safe status vocabulary", () => {
  const html = [renderPresentationAtlasPage(), renderTrustPage()].join("\n");
  for (const phrase of ["Demo / Synthetic", "Under Review", "Pilot Candidate", "Evidence Required", "Unavailable / TBD", "Production eligibility"] ) {
    assert.match(html, new RegExp(phrase, "iu"));
  }
  assert.doesNotMatch(html, /همه سرویس‌ها فعال|APIهای فعال و آماده|SLA تضمین‌شده/iu);
});
