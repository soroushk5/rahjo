import test from "node:test";
import assert from "node:assert/strict";
import { renderMinimalHomePage } from "../src/features/public/minimalPublicPages.js";

test("software-first landing makes category and daily work concrete", () => {
  const html = renderMinimalHomePage();
  assert.match(html, /CRM و عملیات مشتری برای کسب‌وکارهای خدماتی/);
  for (const phrase of ["مشتری", "فروش", "پرونده", "کارهای امروز", "اقدام بعدی من"]) assert.match(html, new RegExp(phrase));
  assert.match(html, /sw-screen/);
  assert.match(html, /sw-benefit-strip/);
  assert.match(html, /sw-showcases/);
  assert.doesNotMatch(html, /mp-how|پنج مرحله؛ از ورودی تا نتیجه/);
});

test("software-first landing has product-oriented entry actions", () => {
  const html = renderMinimalHomePage();
  assert.match(html, /href="#product"/);
  assert.match(html, /href="\/login"/);
  assert.match(html, /دیدن محیط رهجو/);
  assert.match(html, /شروع با رهجو/);
  assert.doesNotMatch(html, /شروع بررسی|دیدن دموی رهجو/);
});

test("public landing contains no intelligence marketing language", () => {
  const html = renderMinimalHomePage();
  assert.doesNotMatch(html, /\bAI\b|هوش[‌\s-]*مصنوعی/i);
});
