import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.RAHJO_QA_ORIGIN || 'http://127.0.0.1:4173';
const output = 'qa-artifacts/console';
const viewports = [
  { name: 'desktop', width: 1365, height: 900 },
  { name: 'mobile', width: 390, height: 844 }
];

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const failures = [];

async function waitForPath(page, expected, label) {
  try {
    await page.waitForFunction((path) => window.location.pathname === path, expected, { timeout: 3000 });
  } catch {
    failures.push(`${label}: expected ${expected}, got ${new URL(page.url()).pathname}`);
  }
}

async function enterDemo(page, label) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  const button = page.locator('#guest-login-button');
  if (!(await button.count())) {
    failures.push(`${label}: demo login button missing`);
    return false;
  }
  await button.click();
  await waitForPath(page, '/dashboard', `${label} login`);
  return true;
}

async function checkSurface(page, route, viewport) {
  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
  if (!response?.ok()) failures.push(`${viewport} ${route}: HTTP ${response?.status()}`);

  const metrics = await page.evaluate(() => ({
    dir: document.documentElement.dir,
    lang: document.documentElement.lang,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    shell: Boolean(document.querySelector('.phase-app-shell[data-console-ui="compact"]')),
    sidebar: Boolean(document.querySelector('.phase-sidebar')),
    topbar: Boolean(document.querySelector('.phase-topbar')),
    groups: document.querySelectorAll('.console-nav-group').length,
    navLinks: document.querySelectorAll('.phase-app-nav a').length,
    text: document.body.innerText,
    mainVisible: Boolean(document.querySelector('#main-content'))
  }));

  if (metrics.dir !== 'rtl') failures.push(`${viewport} ${route}: html dir=${metrics.dir}`);
  if (metrics.lang !== 'fa') failures.push(`${viewport} ${route}: html lang=${metrics.lang}`);
  if (!metrics.shell || !metrics.sidebar || !metrics.topbar || !metrics.mainVisible) failures.push(`${viewport} ${route}: compact console shell incomplete`);
  if (metrics.groups !== 3) failures.push(`${viewport} ${route}: expected 3 nav groups, got ${metrics.groups}`);
  if (metrics.navLinks < 10 || metrics.navLinks > 12) failures.push(`${viewport} ${route}: unexpected nav link count ${metrics.navLinks}`);
  if (metrics.scrollWidth > metrics.clientWidth + 2) failures.push(`${viewport} ${route}: horizontal overflow ${metrics.scrollWidth}/${metrics.clientWidth}`);
  if (/\bAI\b|هوش[‌\s-]*مصنوعی/i.test(metrics.text)) failures.push(`${viewport} ${route}: excluded intelligence wording rendered`);

  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  if (errors.length) failures.push(`${viewport} ${route}: ${errors.join(' | ')}`);
}

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, locale: 'fa-IR' });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  if (!(await enterDemo(page, viewport.name))) {
    await context.close();
    continue;
  }

  // Dashboard is intentionally compact: summary → one action table → two supporting cards.
  const dashboard = await page.evaluate(() => ({
    compactMarker: Boolean(document.querySelector('[data-console-dashboard="compact"]')),
    metricCount: document.querySelectorAll('.ops-metrics .ops-metric').length,
    dashboardPanels: document.querySelectorAll('[data-console-dashboard="compact"] .workspace-panel').length,
    performanceBlocks: document.querySelectorAll('.dashboard-performance').length,
    bodyText: document.body.innerText,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  if (!dashboard.compactMarker) failures.push(`${viewport.name} dashboard: compact marker missing`);
  if (dashboard.metricCount !== 4) failures.push(`${viewport.name} dashboard: expected 4 summary metrics, got ${dashboard.metricCount}`);
  if (dashboard.dashboardPanels !== 3) failures.push(`${viewport.name} dashboard: expected 3 operational panels, got ${dashboard.dashboardPanels}`);
  if (dashboard.performanceBlocks !== 0) failures.push(`${viewport.name} dashboard: legacy performance blocks returned`);
  if (/\bAI\b|هوش[‌\s-]*مصنوعی/i.test(dashboard.bodyText)) failures.push(`${viewport.name} dashboard: excluded intelligence wording rendered`);
  if (dashboard.scrollWidth > dashboard.clientWidth + 2) failures.push(`${viewport.name} dashboard: horizontal overflow`);

  await page.screenshot({ path: `${output}/dashboard-${viewport.name}.png`, fullPage: true });

  // Real sidebar navigation should survive the visual convergence.
  const customers = page.locator('.phase-app-nav a[href="/customers"]').first();
  if (!(await customers.count())) failures.push(`${viewport.name}: customers nav missing`);
  else {
    await customers.click();
    await waitForPath(page, '/customers', `${viewport.name} customers nav`);
    await page.screenshot({ path: `${output}/customers-${viewport.name}.png`, fullPage: true });
  }

  await checkSurface(page, '/customers', viewport.name);
  await checkSurface(page, '/requests', viewport.name);
  await checkSurface(page, '/customers/detail', viewport.name);
  await checkSurface(page, '/requests/detail', viewport.name);

  if (viewport.name === 'mobile') {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });
    const toggle = page.locator('#app-menu-toggle');
    if (!(await toggle.count())) failures.push('mobile: app menu toggle missing');
    else {
      await toggle.click();
      const open = await page.locator('.phase-sidebar').evaluate((element) => element.hasAttribute('data-open'));
      const expanded = await toggle.getAttribute('aria-expanded');
      if (!open || expanded !== 'true') failures.push('mobile: sidebar did not open accessibly');
    }
  }

  // Keyboard focus must stay visible on the first reachable console control.
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  if (!(await page.locator('.skip-link').evaluate((element) => element === document.activeElement))) {
    failures.push(`${viewport.name}: skip link is not first keyboard target`);
  }
  await page.keyboard.press('Enter');
  if (!(await page.locator('#main-content').evaluate((element) => element === document.activeElement))) {
    failures.push(`${viewport.name}: skip link did not focus console main`);
  }

  if (consoleErrors.length) failures.push(`${viewport.name}: console errors: ${consoleErrors.join(' | ')}`);
  if (pageErrors.length) failures.push(`${viewport.name}: page errors: ${pageErrors.join(' | ')}`);
  await context.close();
}

await browser.close();

if (failures.length) {
  console.error('Console rendered QA failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Console convergence QA passed for ${viewports.length} viewports, dashboard density, core routes, mobile nav and keyboard focus.`);
