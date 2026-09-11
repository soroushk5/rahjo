import test from "node:test";
import assert from "node:assert/strict";
import {
  renderMinimalContactPage,
  renderMinimalHomePage,
  renderMinimalProductPage
} from "../src/features/public/minimalPublicPages.js";
import { publicNavigation, utilityDestinations } from "../src/app/navigation.js";

const publicPages = [renderMinimalHomePage, renderMinimalProductPage, renderMinimalContactPage];

test("public surfaces share one restrained shell", () => {
  for (const render of publicPages) {
    const html = render();
    assert.match(html, /class="page phase-site rv-site mp-site"/);
    assert.match(html, /class="phase-header rv-header mp-header"/);
    assert.match(html, /class="rv-footer mp-footer"/);
    assert.doesNotMatch(html, /class="phase-footer rv-footer mp-footer"/);
  }
});

test("landing uses compact product storytelling instead of stacked screenshots", () => {
  const html = renderMinimalHomePage();
  assert.match(html, /CRM برای مدیریت مشتری، فروش و کارهای جاری/);
  assert.match(html, /مشتری‌ها و فرصت‌ها را منظم جلو ببرید/);
  assert.match(html, /sw-hero-card/);
  assert.match(html, /sw-journey-section/);
  assert.match(html, /sw-pillar-grid/);
  assert.doesNotMatch(html, /sw-screen|sw-showcases|sw-benefit-strip/);
  assert.doesNotMatch(html, /CRM و عملیات مشتری برای کسب‌وکارهای خدماتی/);
  assert.doesNotMatch(html, /\bAI\b|هوش[‌\s-]*مصنوعی/i);
});

test("public information architecture has only three primary destinations", () => {
  assert.deepEqual(publicNavigation.map((item) => item.path), ["/", "/product", "/contact"]);
  const login = utilityDestinations.find((item) => item.path === "/login");
  assert.equal(login?.label, "ورود به رهجو");
  assert.doesNotMatch(login?.meta ?? "", /مهمان|دمو/);
});

test("product page explains three connected product pillars", () => {
  const html = renderMinimalProductPage();
  assert.match(html, /CRM را با پیگیری کارهای واقعی تیم در یک مسیر نگه دارید/);
  for (const phrase of ["حافظهٔ مشتری", "فروش و پیگیری", "پرونده و اجرا", "اقدام بعدی"]) {
    assert.match(html, new RegExp(phrase));
  }
  assert.match(html, /sw-pillar-grid/);
  assert.match(html, /sw-product-proof/);
});
