import test from "node:test";
import assert from "node:assert/strict";
import { renderMinimalHomePage } from "../src/features/public/minimalPublicPages.js";

test("compact landing makes category, audience and flow concrete", () => {
  const html = renderMinimalHomePage();
  assert.match(html, /CRM برای مدیریت مشتری، فروش و کارهای جاری/);
  for (const phrase of ["فروش B2B", "بازرگانی", "کسب‌وکارهای پروژه‌ای", "آموزش و مشاوره", "تیم‌های در حال رشد"]) {
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

test("compact landing has product-oriented entry actions", () => {
  const html = renderMinimalHomePage();
  assert.match(html, /href="#product"/);
  assert.match(html, /href="\/contact"/);
  assert.match(html, /محصول را ببینید/);
  assert.match(html, /شروع با رهجو/);
  assert.doesNotMatch(html, /شروع بررسی|دیدن دموی رهجو/);
});

test("public landing contains no intelligence marketing language", () => {
  const html = renderMinimalHomePage();
  assert.doesNotMatch(html, /\bAI\b|هوش[‌\s-]*مصنوعی/i);
});
