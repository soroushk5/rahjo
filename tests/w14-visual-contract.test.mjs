import test from "node:test";
import assert from "node:assert/strict";
import { renderHomePageV2 } from "../src/features/public/homePageV2.js";
import {
  renderAlignedHowItWorksPage,
  renderAlignedProductPage,
  renderAlignedServicesPage,
  renderAlignedUseCasesPage
} from "../src/features/public/alignedPublicPages.js";
import { renderAlignedTrustPage } from "../src/features/public/alignedEntryPages.js";
import { publicNavigation, utilityDestinations } from "../src/app/navigation.js";

const publicPages = [
  renderHomePageV2,
  renderAlignedProductPage,
  renderAlignedServicesPage,
  renderAlignedUseCasesPage,
  renderAlignedHowItWorksPage,
  renderAlignedTrustPage
];

test("W14 public surfaces share the rebaselined shell", () => {
  for (const render of publicPages) {
    const html = render();
    assert.match(html, /class="page phase-site rv-site"/);
    assert.match(html, /class="phase-header rv-header"/);
    assert.match(html, /class="phase-footer rv-footer"/);
  }
});

test("landing is product-led and exposes the operating spine", () => {
  const html = renderHomePageV2();
  assert.match(html, /مشتری را از اولین درخواست تا نتیجه/);
  assert.match(html, /class="rv-product"/);
  assert.match(html, /class="rv-spine"/);
  assert.match(html, /Server-backed/);
  assert.match(html, /Workspace-scoped/);
  assert.match(html, /Human-gated/);
  assert.match(html, /AI-optional/);
  assert.doesNotMatch(html, /class="w14-eyebrow"/);
  assert.doesNotMatch(html, /دیدن دموی رهجو/);
});

test("product family uses one canonical customer-to-outcome map", () => {
  const product = renderAlignedProductPage();
  const services = renderAlignedServicesPage();
  const useCases = renderAlignedUseCasesPage();
  const how = renderAlignedHowItWorksPage();

  assert.match(product, /rv-layer-table/);
  assert.match(services, /rv-contract-list/);
  assert.match(useCases, /rv-scenario-list/);
  assert.match(how, /rv-gate-list/);
  for (const html of [product, services, useCases, how]) {
    assert.match(html, /rv-journey/);
    for (const stage of ["ورودی", "مشتری", "پرونده", "خدمت", "تأیید", "اقدام", "نتیجه"]) {
      assert.match(html, new RegExp(stage));
    }
  }
});

test("public navigation no longer presents login as the product demo", () => {
  assert.deepEqual(publicNavigation.map((item) => item.path), ["/", "/product", "/services", "/use-cases", "/how-it-works"]);
  const login = utilityDestinations.find((item) => item.path === "/login");
  assert.equal(login?.label, "ورود به رهجو");
  assert.doesNotMatch(login?.meta ?? "", /مهمان|دمو/);
});
