import test from "node:test";
import assert from "node:assert/strict";
import { renderMinimalHomePage, renderMinimalProductPage } from "../src/features/public/minimalPublicPages.js";

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

test("public CTAs only target real product or login destinations", () => {
  const home = renderMinimalHomePage();
  const product = renderMinimalProductPage();
  assert.match(home, /data-cta="home-product"[^>]+href="\/product"/);
  assert.match(home, /data-cta="home-login"[^>]+href="\/login"/);
  assert.match(home, /data-cta="home-final-login"[^>]+href="\/login"/);
  assert.match(home, /data-cta="home-final-product"[^>]+href="\/product"/);
  assert.match(product, /data-cta="product-login"[^>]+href="\/login"/);
  assert.match(product, /data-cta="product-home"[^>]+href="\/"/);
  assert.doesNotMatch(`${home}\n${product}`, /href="\/contact"|شروع با رهجو|شروع بررسی|دیدن دموی رهجو/);
});

test("public landing contains no intelligence marketing language", () => {
  const html = renderMinimalHomePage();
  assert.doesNotMatch(html, /\bAI\b|هوش[‌\s-]*مصنوعی/i);
});
