import test from "node:test";
import assert from "node:assert/strict";
import { renderMarketingPage } from "../src/features/marketing/marketingPage.js";
import { renderPlatformPage } from "../src/features/platform/platformPage.js";
import { renderDataCatalogPage } from "../src/features/stories/storiesPage.js";
import { renderTrustPage } from "../src/features/trust/trustPage.js";
import { renderMapPage } from "../src/features/map/mapPage.js";
import { renderDashboardPage } from "../src/features/dashboard/dashboardPage.js";
import { renderRequestPage } from "../src/features/requests/requestPage.js";

const pages = [
  renderMarketingPage,
  renderPlatformPage,
  renderDataCatalogPage,
  renderTrustPage,
  renderMapPage,
  renderDashboardPage,
  renderRequestPage
];

test("all primary routes render meaningful, safe markup", () => {
  for (const render of pages) {
    const html = render();
    assert.match(html, /<h1>/);
    assert.doesNotMatch(html, /undefined|null/);
    assert.match(html, /رهجو/);
  }
});

test("public navigation exposes the data platform architecture", () => {
  const html = renderMarketingPage();
  for (const path of ["/data", "/platform", "/trust", "/map", "/dashboard", "/request"]) {
    assert.match(html, new RegExp(`href="${path}"`));
  }
});

test("visible product copy avoids newsroom framing", () => {
  const html = pages.map((render) => render()).join("\n");
  for (const phrase of ["اتاق خبر", "دفتر روایت", "میز تصمیم", "داستان داده"]) {
    assert.doesNotMatch(html, new RegExp(phrase));
  }
});
