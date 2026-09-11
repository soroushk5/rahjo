import test from "node:test";
import assert from "node:assert/strict";
import {
  renderMinimalContactPage,
  renderMinimalHomePage,
  renderMinimalProductPage
} from "../src/features/public/minimalPublicPages.js";
import { publicNavigation, utilityDestinations } from "../src/app/navigation.js";

const publicPages = [renderMinimalHomePage, renderMinimalProductPage, renderMinimalContactPage];

test("minimal public surfaces share one restrained shell", () => {
  for (const render of publicPages) {
    const html = render();
    assert.match(html, /class="page phase-site rv-site mp-site"/);
    assert.match(html, /class="phase-header rv-header mp-header"/);
    assert.match(html, /class="phase-footer rv-footer mp-footer"/);
  }
});

test("landing is product-led without marketing clutter", () => {
  const html = renderMinimalHomePage();
  assert.match(html, /کار مشتری را از درخواست تا نتیجه/);
  assert.match(html, /class="mp-product"/);
  assert.match(html, /class="mp-benefit-grid"/);
  assert.match(html, /class="mp-flow"/);
  assert.doesNotMatch(html, /Server-backed|Workspace-scoped|Human-gated|AI-optional/);
  assert.doesNotMatch(html, /\bAI\b|هوش[‌\s-]*مصنوعی/i);
});

test("public information architecture has only three primary destinations", () => {
  assert.deepEqual(publicNavigation.map((item) => item.path), ["/", "/product", "/contact"]);
  const login = utilityDestinations.find((item) => item.path === "/login");
  assert.equal(login?.label, "ورود به رهجو");
  assert.doesNotMatch(login?.meta ?? "", /مهمان|دمو/);
});

test("product page stays focused on four core capabilities", () => {
  const html = renderMinimalProductPage();
  assert.match(html, /چهار بخش کافی است/);
  for (const phrase of ["مشتری", "پرونده", "تصمیم و اجرا", "نتیجه"]) assert.match(html, new RegExp(phrase));
});
