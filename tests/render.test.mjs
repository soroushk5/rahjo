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

const pages = [
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
  renderLoginPage
];

test("all primary presentation routes render meaningful, safe markup", () => {
  for (const render of pages) {
    const html = render();
    assert.match(html, /<h1>|<h2>/);
    assert.doesNotMatch(html, /undefined|null/);
    assert.match(html, /رهجو/);
  }
});

test("public navigation exposes the product journey", () => {
  const html = renderPresentationMarketingPage();
  for (const path of ["/data", "/platform", "/trust", "/map", "/login", "/request"]) {
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
