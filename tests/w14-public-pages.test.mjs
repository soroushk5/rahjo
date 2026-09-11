import test from "node:test";
import assert from "node:assert/strict";
import {
  renderAlignedHowItWorksPage,
  renderAlignedProductPage,
  renderAlignedServicesPage,
  renderAlignedUseCasesPage
} from "../src/features/public/alignedPublicPages.js";

const pages = [
  renderAlignedProductPage,
  renderAlignedServicesPage,
  renderAlignedUseCasesPage,
  renderAlignedHowItWorksPage
];

test("aligned public pages render the same canonical operational vocabulary", () => {
  const html = pages.map((render) => render()).join("\n");
  for (const phrase of ["مشتری", "پرونده", "خدمت", "تأیید", "اقدام", "رسید", "نتیجه"]) {
    assert.match(html, new RegExp(phrase));
  }
});

test("aligned public pages keep core navigation and entry actions", () => {
  const html = pages.map((render) => render()).join("\n");
  for (const path of ["/product", "/services", "/use-cases", "/how-it-works", "/contact", "/login"]) {
    assert.match(html, new RegExp(`href="${path}"`));
  }
});

test("aligned public pages do not claim unavailable production capabilities", () => {
  const html = pages.map((render) => render()).join("\n");
  for (const phrase of ["Relaticle زنده", "MCP زنده", "production-ready", "پرداخت واقعی متصل است"]) {
    assert.doesNotMatch(html, new RegExp(phrase, "i"));
  }
});
