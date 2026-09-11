import test from "node:test";
import assert from "node:assert/strict";
import {
  renderMinimalContactPage,
  renderMinimalHomePage,
  renderMinimalProductPage,
  renderMinimalTrackPage
} from "../src/features/public/minimalPublicPages.js";

const canonicalPages = [renderMinimalHomePage, renderMinimalProductPage, renderMinimalContactPage];

test("canonical public site is intentionally limited to three destinations", () => {
  const html = canonicalPages.map((render) => render()).join("\n");
  for (const path of ["/", "/product", "/contact", "/login"]) assert.match(html, new RegExp(`href="${path}"`));
  for (const label of ["خدمات", "موارد استفاده", "اعتماد و کنترل", "راه‌اندازی"]) {
    assert.doesNotMatch(html, new RegExp(`>${label}<`));
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
