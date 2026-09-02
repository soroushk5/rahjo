import { chromium } from "playwright";
import fs from "node:fs/promises";

const baseURL = process.env.RAHJO_BASE_URL || "http://127.0.0.1:4173";
await fs.mkdir("qa-artifacts/client-demo", { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function assertNoOverflow(page, label) {
  const dims = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    doc: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth
  }));
  assert(dims.body <= dims.viewport + 2, `${label}: body overflow ${JSON.stringify(dims)}`);
  assert(dims.doc <= dims.viewport + 2, `${label}: document overflow ${JSON.stringify(dims)}`);
}

async function screenshot(page, name) {
  await page.screenshot({ path: `qa-artifacts/client-demo/${name}.png`, fullPage: true });
}

async function clickPresenterLink(page, text) {
  const link = page.locator(".demo-presenter a").filter({ hasText: text }).first();
  await link.click();
}

async function runGoldenDemo(browser, viewport, suffix) {
  const page = await browser.newPage({ viewportSize: viewport });
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });

  await page.goto(`${baseURL}/login`, { waitUntil: "networkidle" });
  await page.locator("#demo-one-click").waitFor({ state: "visible" });
  await assertNoOverflow(page, `${suffix}: login`);
  await screenshot(page, `${suffix}-01-login`);

  await page.locator("#demo-one-click").click();
  await page.waitForURL(/\/dashboard$/);
  await page.locator(".demo-presenter").waitFor({ state: "visible" });
  await page.getByText("شرکت نمونه آفتاب", { exact: false }).first().waitFor();
  await assertNoOverflow(page, `${suffix}: dashboard`);
  await screenshot(page, `${suffix}-02-dashboard`);

  await clickPresenterLink(page, "Account 360");
  await page.waitForURL(/\/crm$/);
  await page.locator('[data-demo-action="followup"]').click();
  await page.getByText("پیگیری Account 360 ثبت شد", { exact: false }).waitFor();
  await clickPresenterLink(page, "فروش");

  await page.waitForURL(/\/sales$/);
  await page.locator('[data-demo-action="qualify"]').click();
  await page.getByText("فرصت فروش برای تحویل انسانی آماده شد", { exact: false }).waitFor();
  await clickPresenterLink(page, "Case و سرویس");

  await page.waitForURL(/\/services$/);
  await page.locator('[data-demo-action="case"]').click();
  await page.getByText("Case سرویس روی حساب نمونه آماده شد", { exact: false }).waitFor();
  await clickPresenterLink(page, "Approval و اجرا");

  await page.waitForURL(/\/automation$/);
  await page.locator('[data-demo-action="approve"]').click();
  await page.getByText("تأیید انسانی برای Case ثبت شد", { exact: false }).waitFor();
  await page.locator('[data-demo-action="execute"]').click();
  await page.getByText("Workflow قطعی اجرا", { exact: false }).waitFor();
  await screenshot(page, `${suffix}-03-automation-complete`);
  await clickPresenterLink(page, "Audit و Receipt");

  await page.waitForURL(/\/governance$/);
  await page.locator('[data-demo-action="outcome"]').click();
  await page.getByText("Outcome روی همان Account/Case ثبت", { exact: false }).waitFor();
  await clickPresenterLink(page, "Outcome روی Account");

  await page.waitForURL(/\/crm$/);
  await page.getByText("سناریو کامل شد", { exact: false }).waitFor();
  await assertNoOverflow(page, `${suffix}: completed crm`);
  await screenshot(page, `${suffix}-04-outcome`);

  await page.locator("[data-demo-reset]").click();
  await page.waitForURL(/\/dashboard$/);
  await page.getByText("مرحله ۱ از ۷", { exact: false }).waitFor();
  await page.getByText("Requested", { exact: true }).first().waitFor();
  await assertNoOverflow(page, `${suffix}: reset`);
  await screenshot(page, `${suffix}-05-reset`);

  assert(errors.length === 0, `${suffix}: browser errors: ${errors.join(" | ")}`);
  await page.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await runGoldenDemo(browser, { width: 1366, height: 768 }, "1366x768-run1");
  await runGoldenDemo(browser, { width: 1440, height: 900 }, "1440x900-run2");
  console.log("Client live demo QA passed twice with deterministic reset.");
} finally {
  await browser.close();
}
