import test from "node:test";
import assert from "node:assert/strict";
import {
  renderMinimalContactPage,
  renderMinimalHomePage,
  renderMinimalProductPage,
  renderMinimalTrackPage
} from "../src/features/public/minimalPublicPages.js";
import { publicNavigation } from "../src/app/navigation.js";

const canonicalPages = [renderMinimalHomePage, renderMinimalProductPage, renderMinimalContactPage];

test("canonical public site is intentionally limited to three destinations", () => {
  assert.deepEqual(publicNavigation.map((item) => [item.path, item.label]), [
    ["/", "خانه"],
    ["/product", "محصول"],
    ["/contact", "شروع"]
  ]);
  const html = canonicalPages.map((render) => render()).join("\n");
  for (const path of ["/", "/product", "/contact", "/login"]) assert.match(html, new RegExp(`href="${path}"`));
  for (const path of ["/services", "/use-cases", "/how-it-works", "/trust", "/pilot", "/about"]) {
    assert.doesNotMatch(html, new RegExp(`<a[^>]+href="${path}"`));
  }
});

test("public home explains the software category and concrete jobs", () => {
  const html = renderMinimalHomePage();
  assert.match(html, /CRM و عملیات مشتری برای کسب‌وکارهای خدماتی/);
  assert.match(html, /مشتری، فروش و اجرای خدمت/);
  for (const concreteArea of ["مشتریان", "فروش", "پرونده و عملیات", "اقدام بعدی من"]) {
    assert.match(html, new RegExp(concreteArea));
  }
  assert.doesNotMatch(html, /پنج مرحله؛ از ورودی تا نتیجه|شروع بررسی/);
});

test("canonical public copy is concise and avoids intelligence positioning", () => {
  const html = canonicalPages.map((render) => render()).join("\n");
  assert.doesNotMatch(html, /\bAI\b|هوش[‌\s-]*مصنوعی/i);
  for (const phrase of ["Relaticle زنده", "MCP زنده", "production-ready", "پرداخت واقعی متصل است"]) {
    assert.doesNotMatch(html, new RegExp(phrase, "i"));
  }
});

test("legacy tracking route remains safe and sends users to secure login", () => {
  const html = renderMinimalTrackPage();
  assert.match(html, /href="\/login"/);
  assert.doesNotMatch(html, /فرم|کد پیگیری/);
});
