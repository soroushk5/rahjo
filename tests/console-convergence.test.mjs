import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("authenticated shell uses the compact grouped console contract", async () => {
  const shell = await read("src/app/appShell.js");
  assert.match(shell, /data-console-ui="compact"/);
  assert.match(shell, /کار روزانه/);
  assert.match(shell, /اجرا و پشتیبانی/);
  assert.match(shell, /مدیریت/);
  assert.match(shell, /Golden Demo/);
  assert.match(shell, /محیط زندهٔ \$\{user\.organization\} — داده‌ها از سرور همین فضای کاری خوانده می‌شوند/);
  assert.doesNotMatch(shell, /هوش[‌\s-]*مصنوعی/);
});

test("demo dashboard is reduced to one primary work area and two supporting panels", async () => {
  const dashboard = await read("src/features/operations/consoleDashboard.js");
  assert.match(dashboard, /data-console-dashboard="compact"/);
  assert.match(dashboard, /مرکز کار امروز/);
  assert.match(dashboard, /اقدام بعدی من/);
  assert.match(dashboard, /نیازمند توجه/);
  assert.match(dashboard, /آخرین حرکت‌ها/);
  assert.doesNotMatch(dashboard, /عملکرد فروش/);
  assert.doesNotMatch(dashboard, /عملکرد خدمات/);
  assert.doesNotMatch(dashboard, /\bAI\b|هوش[‌\s-]*مصنوعی/i);
});

test("console visual system is loaded after public styles and includes focus/mobile rules", async () => {
  const index = await read("index.html");
  const css = await read("styles/console-convergence.css");
  assert.ok(index.indexOf("styles/console-convergence.css") > index.indexOf("styles/w14-public-ux-fixes.css"));
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media \(max-width: 980px\)/);
  assert.match(css, /console-dashboard__grid/);
  assert.match(css, /console-nav-group/);
});

test("bootstrap routes dashboard through the compact renderer without changing other operational routes", async () => {
  const bootstrap = await read("src/app/bootstrap.js");
  assert.match(bootstrap, /renderCompactDashboardPage/);
  assert.match(bootstrap, /path: "\/dashboard"[\s\S]*renderCompactDashboardPage/);
  for (const path of ["/customers", "/sales", "/requests", "/tasks", "/operations", "/finance", "/documents", "/reports", "/audit", "/settings"]) {
    assert.ok(bootstrap.includes(`path: "${path}"`), `missing ${path}`);
  }
});
