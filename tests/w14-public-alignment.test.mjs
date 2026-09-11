import test from "node:test";
import assert from "node:assert/strict";
import { renderHomePageV2 } from "../src/features/public/homePageV2.js";

test("W14 landing uses the canonical operational journey", () => {
  const html = renderHomePageV2();
  for (const phrase of ["ورودی", "مشتری", "پرونده", "خدمت", "تأیید", "اقدام", "رسید", "نتیجه"]) {
    assert.match(html, new RegExp(phrase));
  }
});

test("W14 landing leads with real product entry points instead of demo-first framing", () => {
  const html = renderHomePageV2();
  assert.match(html, /href="\/contact"/);
  assert.match(html, /href="\/login"/);
  assert.match(html, /بررسی فرایند کسب‌وکار من/);
  assert.match(html, /ورود به محیط رهجو/);
  assert.doesNotMatch(html, /دیدن دموی رهجو/);
});

test("W14 landing keeps AI outside the critical-path promise", () => {
  const html = renderHomePageV2();
  assert.match(html, /بدون وابستگی به AI/);
  assert.match(html, /تأیید انسانی/);
  assert.match(html, /قابل ممیزی/);
});
