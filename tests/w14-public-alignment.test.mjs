import test from "node:test";
import assert from "node:assert/strict";
import { renderMinimalHomePage } from "../src/features/public/minimalPublicPages.js";

test("minimal landing keeps the public story short and operational", () => {
  const html = renderMinimalHomePage();
  for (const phrase of ["درخواست", "پرونده", "تأیید", "اقدام", "نتیجه"]) assert.match(html, new RegExp(phrase));
  assert.match(html, /mp-product/);
  assert.match(html, /mp-benefit-grid/);
  assert.match(html, /mp-flow/);
});

test("minimal landing has two clear entry actions", () => {
  const html = renderMinimalHomePage();
  assert.match(html, /href="\/contact"/);
  assert.match(html, /href="\/login"/);
  assert.match(html, /شروع بررسی/);
  assert.doesNotMatch(html, /دیدن دموی رهجو/);
});

test("public landing contains no intelligence marketing language", () => {
  const html = renderMinimalHomePage();
  assert.doesNotMatch(html, /\bAI\b|هوش[‌\s-]*مصنوعی/i);
});
