import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.RAHJO_QA_ORIGIN || 'http://127.0.0.1:4173';
const output = 'qa-artifacts/public-site';
const routes = [
  { path: '/', slug: 'home', h1: 'عملیات تجاری امروز' },
  { path: '/platform', slug: 'product', h1: 'رهجو یک Dashboard نیست' },
  { path: '/data', slug: 'services', h1: 'سرویس را از وضعیتش جدا نکنیم' },
  { path: '/map', slug: 'journey', h1: 'Context باید از ورودی تا نتیجه زنده بماند' },
  { path: '/trust', slug: 'trust', h1: 'اعتماد از' }
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
      hasOperationalSite: Boolean(document.querySelector('.public-operational-site')),
      hasClaimBoundary: Boolean(document.querySelector('.public-context-strip')),
      navVisible: Boolean(document.querySelector('#site-nav'))
    }));

    if (metrics.scrollWidth > metrics.clientWidth + 2) failures.push(`${viewport.name} ${route.path}: horizontal overflow ${metrics.scrollWidth}/${metrics.clientWidth}`);
    if (!metrics.hasOperationalSite) failures.push(`${viewport.name} ${route.path}: missing public-operational-site shell`);
    if (!metrics.hasClaimBoundary) failures.push(`${viewport.name} ${route.path}: missing claim boundary strip`);
    if (!metrics.navVisible) failures.push(`${viewport.name} ${route.path}: missing site navigation`);

    if (consoleErrors.length) failures.push(`${viewport.name} ${route.path}: console errors: ${consoleErrors.join(' | ')}`);
    if (pageErrors.length) failures.push(`${viewport.name} ${route.path}: page errors: ${pageErrors.join(' | ')}`);

    if (viewport.name === 'mobile') {
      const toggle = page.locator('#mobile-nav-toggle');
      if (await toggle.isVisible()) {
        await toggle.click();
        const expanded = await toggle.getAttribute('aria-expanded');
        if (expanded !== 'true') failures.push(`mobile ${route.path}: mobile nav did not expand`);
        await toggle.click();
      }
    }

    if (route.path === '/trust') {
      const firstGate = page.locator('[data-public-gate]').first();
      await firstGate.click();
      if ((await firstGate.getAttribute('aria-pressed')) !== 'true') failures.push(`${viewport.name} /trust: gate interaction did not update`);
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

console.log(`Public-site rendered QA passed for ${routes.length} routes across ${viewports.length} viewports.`);
