import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderMinimalHomePage, renderMinimalProductPage } from "../src/features/public/minimalPublicPages.js";
import { renderPublicIntakePage } from "../src/features/public/publicIntakePage.js";

test("compact landing makes category, audience and flow concrete", () => {
  const html = renderMinimalHomePage();
  assert.match(html, /CRM برای مدیریت مشتری، فروش و کارهای جاری/);
  for (const phrase of ["فروش B2B", "بازرگانی", "خدمات و پروژه", "آموزش و مشاوره", "تیم‌های در حال رشد"]) {
    assert.match(html, new RegExp(phrase));
  }
  for (const phrase of ["مشتری", "فرصت", "پرونده", "نتیجه", "اقدام بعدی"]) {
    assert.match(html, new RegExp(phrase));
  }
  assert.match(html, /sw-hero-card/);
  assert.match(html, /sw-journey-section/);
  assert.match(html, /sw-pillar-grid/);
  assert.doesNotMatch(html, /sw-screen|sw-showcases|mp-how/);
});

test("public CTAs target real product, Start or login destinations", () => {
  const home = renderMinimalHomePage();
  const product = renderMinimalProductPage();
  const start = renderPublicIntakePage();
  assert.match(home, /data-cta="home-product"[^>]+href="\/product"/);
  assert.match(home, /data-cta="home-login"[^>]+href="\/login"/);
  assert.match(home, /data-cta="header-start"[^>]+href="\/contact"/);
  assert.match(home, /data-cta="home-final-login"[^>]+href="\/login"/);
  assert.match(home, /data-cta="home-final-product"[^>]+href="\/product"/);
  assert.match(product, /data-cta="product-login"[^>]+href="\/login"/);
  assert.match(product, /data-cta="product-home"[^>]+href="\/"/);
  assert.match(start, /id="rahjo-public-intake"/);
  assert.doesNotMatch(`${home}\n${product}\n${start}`, /شروع بررسی|دیدن دموی رهجو/);
});

test("public canonical surfaces contain no intelligence marketing language", () => {
  const html = `${renderMinimalHomePage()}\n${renderMinimalProductPage()}\n${renderPublicIntakePage()}`;
  assert.doesNotMatch(html, /\bAI\b|هوش[‌\s-]*مصنوعی/i);
});

test("production sitemap exposes Start and excludes compatibility-only acquisition routes", () => {
  const buildScript = readFileSync("scripts/build-hostinger.mjs", "utf8");
  const smokeScript = readFileSync("scripts/smoke-hostinger.mjs", "utf8");

  assert.match(buildScript, /const routes = \['\/', '\/product', '\/contact', '\/privacy', '\/terms'\];/);
  assert.match(smokeScript, /const publicRoutes = \['\/', '\/product', '\/contact', '\/privacy', '\/terms'\];/);
  assert.doesNotMatch(smokeScript, /const nonCanonicalRoutes = \[[^\n]*'\/contact'/);
});
