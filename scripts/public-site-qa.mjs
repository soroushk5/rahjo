import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.RAHJO_QA_ORIGIN || 'http://127.0.0.1:4173';
const output = 'qa-artifacts/public-site';
const routes = [
  { path: '/', slug: 'home', h1: 'مشتری را از اولین درخواست تا نتیجه', markers: ['.rv-product', '.rv-spine'] },
  { path: '/product', slug: 'product', h1: 'یک سیستم برای حافظهٔ مشتری و اجرای کار', markers: ['.rv-layer-table', '.rv-journey'] },
  { path: '/services', slug: 'services', h1: 'خدمت در رهجو یک قرارداد اجرایی', markers: ['.rv-contract-list', '.rv-journey'] },
  { path: '/use-cases', slug: 'use-cases', h1: 'برای جایی که فروش و ارائهٔ خدمت', markers: ['.rv-scenario-list', '.rv-journey'] },
  { path: '/how-it-works', slug: 'how-it-works', h1: 'هر مرحله، context را به مرحلهٔ بعد', markers: ['.rv-journey', '.rv-gate-list'] },
  { path: '/trust', slug: 'trust', h1: 'اعتماد از محدودکردن اختیار سیستم', markers: ['.w14-trust-grid'] }
];
const viewports = [
  { name: 'desktop', width: 1365, height: 900 },
  { name: 'mobile', width: 390, height: 844 }
];

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const failures = [];

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, locale: 'fa-IR' });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  for (const route of routes) {
    consoleErrors.length = 0;
    pageErrors.length = 0;
    const response = await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle' });
    if (!response?.ok()) failures.push(`${viewport.name} ${route.path}: HTTP ${response?.status()}`);

    const dir = await page.getAttribute('html', 'dir');
    if (dir !== 'rtl') failures.push(`${viewport.name} ${route.path}: html dir=${dir}`);

    const h1 = (await page.locator('h1').first().textContent())?.replace(/\s+/g, ' ').trim() || '';
    if (!h1.includes(route.h1)) failures.push(`${viewport.name} ${route.path}: unexpected h1 "${h1}"`);

    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      hasSite: Boolean(document.querySelector('.rv-site')),
      hasHeader: Boolean(document.querySelector('.rv-header')),
      hasNav: Boolean(document.querySelector('#site-nav')),
      oldEyebrowAboveHero: Boolean(document.querySelector('.rv-hero .w14-eyebrow'))
    }));

    if (metrics.scrollWidth > metrics.clientWidth + 2) failures.push(`${viewport.name} ${route.path}: horizontal overflow ${metrics.scrollWidth}/${metrics.clientWidth}`);
    if (!metrics.hasSite) failures.push(`${viewport.name} ${route.path}: missing rv-site shell`);
    if (!metrics.hasHeader) failures.push(`${viewport.name} ${route.path}: missing rv-header`);
    if (!metrics.hasNav) failures.push(`${viewport.name} ${route.path}: missing site navigation`);
    if (route.path === '/' && metrics.oldEyebrowAboveHero) failures.push(`${viewport.name} /: decorative hero eyebrow returned`);

    for (const marker of route.markers) {
      if (!(await page.locator(marker).first().count())) failures.push(`${viewport.name} ${route.path}: missing ${marker}`);
    }

    if (consoleErrors.length) failures.push(`${viewport.name} ${route.path}: console errors: ${consoleErrors.join(' | ')}`);
    if (pageErrors.length) failures.push(`${viewport.name} ${route.path}: page errors: ${pageErrors.join(' | ')}`);

    if (viewport.name === 'mobile') {
      const toggle = page.locator('#mobile-nav-toggle');
      if (!(await toggle.isVisible())) failures.push(`mobile ${route.path}: mobile nav toggle is not visible`);
      else {
        await toggle.click();
        const expanded = await toggle.getAttribute('aria-expanded');
        const navOpen = await page.locator('#site-nav').getAttribute('data-open');
        if (expanded !== 'true' || navOpen === null) failures.push(`mobile ${route.path}: mobile nav did not expand`);
        await toggle.click();
      }
    }

    await page.screenshot({ path: `${output}/${route.slug}-${viewport.name}.png`, fullPage: true });
  }

  await context.close();
}

await browser.close();

if (failures.length) {
  console.error('Public-site rendered QA failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Public-site rendered QA passed for ${routes.length} canonical routes across ${viewports.length} viewports.`);
