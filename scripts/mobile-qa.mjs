import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const baseUrl = process.env.RAHJO_QA_URL ?? "http://127.0.0.1:4173";
const artifactDir = process.env.RAHJO_QA_ARTIFACT_DIR ?? "qa-artifacts";
const routes = ["/dashboard", "/crm", "/sales", "/services", "/automation", "/governance", "/think-room"];

await mkdir(artifactDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
  locale: "fa-IR"
});
const page = await context.newPage();
const consoleErrors = [];
const pageErrors = [];

page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => pageErrors.push(error.message));

async function assertNoHorizontalOverflow(label) {
  const result = await page.evaluate(() => ({
    bodyClientWidth: document.body.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    docClientWidth: document.documentElement.clientWidth,
    docScrollWidth: document.documentElement.scrollWidth
  }));
  assert.ok(result.bodyScrollWidth <= result.bodyClientWidth + 2, `${label}: body horizontal overflow ${JSON.stringify(result)}`);
  assert.ok(result.docScrollWidth <= result.docClientWidth + 2, `${label}: document horizontal overflow ${JSON.stringify(result)}`);
}

async function waitForSidebarOpen() {
  await page.waitForFunction(() => {
    const sidebar = document.querySelector(".app-sidebar");
    if (!(sidebar instanceof HTMLElement) || !sidebar.hasAttribute("data-open")) return false;
    const box = sidebar.getBoundingClientRect();
    return box.x >= -2 && box.x < window.innerWidth && box.right <= window.innerWidth + 2;
  }, { timeout: 2500 });
}

async function waitForSidebarClosed() {
  await page.waitForFunction(() => {
    const sidebar = document.querySelector(".app-sidebar");
    if (!(sidebar instanceof HTMLElement) || sidebar.hasAttribute("data-open")) return false;
    const box = sidebar.getBoundingClientRect();
    return box.x >= window.innerWidth - 2;
  }, { timeout: 2500 });
}

try {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.locator("#login-submit").click();
  await page.waitForURL(/\/dashboard$/, { timeout: 5000 });
  await page.locator("#main-content").waitFor({ state: "visible" });

  const viewport = page.viewportSize();
  assert.deepEqual(viewport, { width: 390, height: 844 });
  assert.equal(await page.locator("#app-menu-toggle").isVisible(), true, "mobile menu toggle must be visible at 390px");
  assert.equal(await page.locator(".app-sidebar").getAttribute("data-open"), null, "sidebar should start closed");
  assert.equal(await page.locator("#app-menu-toggle").getAttribute("aria-expanded"), "false");
  await waitForSidebarClosed();
  await assertNoHorizontalOverflow("dashboard closed menu");
  await page.screenshot({ path: `${artifactDir}/mobile-dashboard-390x844.png`, fullPage: true });

  await page.locator("#app-menu-toggle").focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("#app-menu-toggle").getAttribute("aria-expanded"), "true", "keyboard Enter should open mobile menu");
  assert.notEqual(await page.locator(".app-sidebar").getAttribute("data-open"), null, "sidebar should expose data-open when opened");
  await waitForSidebarOpen();
  const sidebarBox = await page.locator(".app-sidebar").boundingBox();
  assert.ok(sidebarBox, "sidebar must have a rendered bounding box");
  assert.ok(sidebarBox.x >= -2 && sidebarBox.x < 390, `sidebar should be inside viewport when open: ${JSON.stringify(sidebarBox)}`);
  assert.ok(sidebarBox.width <= 390, `sidebar width should fit viewport: ${JSON.stringify(sidebarBox)}`);
  await assertNoHorizontalOverflow("dashboard open menu");
  await page.screenshot({ path: `${artifactDir}/mobile-menu-open-390x844.png`, fullPage: true });

  await page.locator('.app-sidebar a[href="/crm"]').click();
  await page.waitForURL(/\/crm$/, { timeout: 5000 });
  assert.equal(await page.locator("#app-menu-toggle").getAttribute("aria-expanded"), "false", "navigating from sidebar should close mobile menu");
  assert.equal(await page.locator(".app-sidebar").getAttribute("data-open"), null, "sidebar data-open should be removed after navigation");
  await waitForSidebarClosed();
  await assertNoHorizontalOverflow("crm after sidebar navigation");

  for (const route of routes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    await page.locator("#main-content").waitFor({ state: "visible" });
    assert.equal(await page.locator("#app-menu-toggle").isVisible(), true, `${route}: mobile menu toggle should remain visible`);
    await assertNoHorizontalOverflow(route);
  }

  const focusOutline = await page.locator("#app-menu-toggle").evaluate((element) => {
    element.focus();
    const style = getComputedStyle(element);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  assert.notEqual(focusOutline.outlineStyle, "none", `focus outline should be visible: ${JSON.stringify(focusOutline)}`);

  assert.deepEqual(pageErrors, [], `page errors detected: ${JSON.stringify(pageErrors)}`);
  assert.deepEqual(consoleErrors, [], `console errors detected: ${JSON.stringify(consoleErrors)}`);

  console.log("MOBILE_QA_PASS viewport=390x844 routes=7 offcanvas=pass keyboard=pass overflow=pass console=clean");
} finally {
  await browser.close();
}
