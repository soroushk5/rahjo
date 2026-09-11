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

test("landing is software-led instead of abstract marketing", () => {
  const html = renderMinimalHomePage();
  assert.match(html, /CRM و عملیات مشتری برای کسب‌وکارهای خدماتی/);
  assert.match(html, /مشتری، فروش و اجرای خدمت را در یک سیستم پیگیری کنید/);
  assert.match(html, /sw-screen/);
  assert.match(html, /sw-showcases/);
  assert.match(html, /sw-benefit-strip/);
  assert.doesNotMatch(html, /mp-how|Server-backed|Workspace-scoped|Human-gated|AI-optional/);
  assert.doesNotMatch(html, /\bAI\b|هوش[‌\s-]*مصنوعی/i);
});

test("public information architecture has only three primary destinations", () => {
  assert.deepEqual(publicNavigation.map((item) => item.path), ["/", "/product", "/contact"]);
  const login = utilityDestinations.find((item) => item.path === "/login");
  assert.equal(login?.label, "ورود به رهجو");
  assert.doesNotMatch(login?.meta ?? "", /مهمان|دمو/);
});

test("product page focuses on three concrete software areas", () => {
  const html = renderMinimalProductPage();
  assert.match(html, /CRM را از اجرای کار جدا نکنید/);
  for (const phrase of ["مشتریان", "فروش", "عملیات", "فرصت", "پرونده"]) assert.match(html, new RegExp(phrase));
  assert.match(html, /sw-product-grid/);
  assert.doesNotMatch(html, /چهار بخش کافی است/);
});
