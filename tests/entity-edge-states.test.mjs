import assert from "node:assert/strict";
import test from "node:test";
import { renderCrmPage, renderServicesPage } from "../src/features/operations/operationalPages.js";

test("unknown deep-link IDs fail safely with a recovery action", () => {
  const previousWindow = globalThis.window;
  try {
    globalThis.window = { location: { href: "https://rahjo.local/crm?account=ACC-MISSING-404" } };
    const accountHtml = renderCrmPage();
    assert.match(accountHtml, /Account پیدا نشد/);
    assert.match(accountHtml, /ACC-MISSING-404/);
    assert.match(accountHtml, /بازگشت به نمای امن/);

    globalThis.window.location.href = "https://rahjo.local/services?service=SVC-DEMO-001&case=CASE-MISSING-404";
    const caseHtml = renderServicesPage();
    assert.match(caseHtml, /Case پیدا نشد/);
    assert.match(caseHtml, /CASE-MISSING-404/);
  } finally {
    globalThis.window = previousWindow;
  }
});
