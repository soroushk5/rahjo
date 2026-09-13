import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.RAHJO_QA_ORIGIN || 'http://127.0.0.1:4173';
const output = 'qa-artifacts/public-site';
const routes = [
  {
    path: '/',
    slug: 'home',
    h1: 'مشتری‌ها و فرصت‌ها را منظم جلو ببرید',
    markers: ['.sw-hero-card', '.sw-journey-section', '.sw-pillar-grid']
  },
  {
    path: '/product',
    slug: 'product',
    h1: 'CRM را با پیگیری کارهای واقعی تیم در یک مسیر نگه دارید',
    markers: ['.sw-journey', '.sw-pillar-grid', '.sw-product-proof']
  },
  { path: '/login', slug: 'login', h1: '', markers: [] }
];
const viewports = [
  { name: 'desktop', width: 1365, height: 900 },
  { name: 'mobile', width: 390, height: 844 }
];
const allowedPublicLinks = new Set(['/', '/product', '/login', '/privacy', '/terms']);
const legacyRoutes = [
  ['/contact', '/login'],
  ['/pilot', '/login'],
  ['/services', '/product'],
  ['/use-cases', '/product'],
  ['/how-it-works', '/'],
  ['/trust', '/product'],
  ['/about', '/'],
  ['/map', '/'],
  ['/data', '/product']
];

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const failures = [];

async function waitForPath(page, expected, label) {
  try {
    await page.waitForFunction((path) => window.location.pathname === path, expected, { timeout: 2500 });
  } catch {
    failures.push(`${label}: expected ${expected}, got ${new URL(page.url()).pathname}`);
  }
}

async function clickTo(page, selector, expected, label) {
  const target = page.locator(selector).first();
  if (!(await target.count())) {
    failures.push(`${label}: missing ${selector}`);
    return;
  }
  await target.click();
  await waitForPath(page, expected, label);
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

  for (const route of routes) {
    consoleErrors.length = 0;
    pageErrors.length = 0;
    const response = await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle' });
    if (!response?.ok()) failures.push(`${viewport.name} ${route.path}: HTTP ${response?.status()}`);

    const dir = await page.getAttribute('html', 'dir');
    if (dir !== 'rtl') failures.push(`${viewport.name} ${route.path}: html dir=${dir}`);

    if (route.h1) {
      const h1 = (await page.locator('h1').first().textContent())?.replace(/\s+/g, ' ').trim() || '';
      if (!h1.includes(route.h1)) failures.push(`${viewport.name} ${route.path}: unexpected h1 "${h1}"`);
    }

    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      text: document.body.innerText,
      headerNavCount: document.querySelectorAll('.mp-header .mp-nav a').length,
      headerNavPresent: Boolean(document.querySelector('.mp-header .mp-nav')),
      mobileTogglePresent: Boolean(document.querySelector('#mobile-nav-toggle')),
      headerActionCount: document.querySelectorAll('.mp-header__actions a').length,
      homeBrandLink: document.querySelector('.mp-header .mp-brand')?.getAttribute('href') || '',
      legacyDarkFlow: Boolean(document.querySelector('.mp-how')),
      oversizedScreens: document.querySelectorAll('.sw-screen, .sw-showcase').length,
      internalLinks: [...document.querySelectorAll('a[href]')]
        .map((anchor) => new URL(anchor.href, window.location.origin))
        .filter((url) => url.origin === window.location.origin)
        .map((url) => url.pathname)
    }));

    if (metrics.scrollWidth > metrics.clientWidth + 2) failures.push(`${viewport.name} ${route.path}: horizontal overflow ${metrics.scrollWidth}/${metrics.clientWidth}`);
    if (/\bAI\b|هوش[‌\s-]*مصنوعی/i.test(metrics.text)) failures.push(`${viewport.name} ${route.path}: public copy mentions excluded intelligence framing`);

    if (route.path !== '/login') {
      if (metrics.headerNavPresent || metrics.headerNavCount !== 0) failures.push(`${viewport.name} ${route.path}: public header tabs returned`);
      if (metrics.mobileTogglePresent) failures.push(`${viewport.name} ${route.path}: obsolete mobile nav toggle returned`);
      if (metrics.headerActionCount !== 1) failures.push(`${viewport.name} ${route.path}: expected one header action, got ${metrics.headerActionCount}`);
      if (metrics.homeBrandLink !== '/') failures.push(`${viewport.name} ${route.path}: brand does not link home`);
      for (const path of metrics.internalLinks) {
        if (path === '/contact') failures.push(`${viewport.name} ${route.path}: dead-end /contact link returned`);
        if (!allowedPublicLinks.has(path)) failures.push(`${viewport.name} ${route.path}: unexpected public link ${path}`);
      }
    }

    if (route.path === '/' && metrics.legacyDarkFlow) failures.push(`${viewport.name} /: legacy dark flow section returned`);
    if (route.path === '/' && metrics.oversizedScreens !== 0) failures.push(`${viewport.name} /: oversized screenshot-era layout returned`);

    for (const marker of route.markers) {
      if (!(await page.locator(marker).first().count())) failures.push(`${viewport.name} ${route.path}: missing ${marker}`);
    }

    if (consoleErrors.length) failures.push(`${viewport.name} ${route.path}: console errors: ${consoleErrors.join(' | ')}`);
    if (pageErrors.length) failures.push(`${viewport.name} ${route.path}: page errors: ${pageErrors.join(' | ')}`);

    await page.screenshot({ path: `${output}/${route.slug}-${viewport.name}.png`, fullPage: true });
  }

  // Primary behavior audit: click the real controls and verify the resulting SPA route.
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await clickTo(page, '[data-cta="header-access"]', '/login', `${viewport.name} header access`);

  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await clickTo(page, '[data-cta="home-product"]', '/product', `${viewport.name} home product CTA`);

  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await clickTo(page, '[data-cta="home-login"]', '/login', `${viewport.name} home login CTA`);

  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await clickTo(page, '[data-cta="home-final-login"]', '/login', `${viewport.name} home final login CTA`);

  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await clickTo(page, '[data-cta="home-final-product"]', '/product', `${viewport.name} home final product CTA`);

  await page.goto(`${baseUrl}/product`, { waitUntil: 'networkidle' });
  await clickTo(page, '[data-cta="product-login"]', '/login', `${viewport.name} product login CTA`);

  await page.goto(`${baseUrl}/product`, { waitUntil: 'networkidle' });
  await clickTo(page, '[data-cta="product-home"]', '/', `${viewport.name} product home CTA`);

  await page.goto(`${baseUrl}/product`, { waitUntil: 'networkidle' });
  await clickTo(page, '.mp-header .mp-brand', '/', `${viewport.name} brand home link`);

  // Footer links are part of the public contract too.
  for (const [path, expected] of [['/product', '/product'], ['/login', '/login'], ['/privacy', '/privacy'], ['/terms', '/terms']]) {
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    await clickTo(page, `.mp-footer a[data-route-path="${path}"]`, expected, `${viewport.name} footer ${path}`);
  }

  // Retired marketing routes must consolidate onto the canonical public surfaces.
  for (const [path, expected] of legacyRoutes) {
    await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' });
    await waitForPath(page, expected, `${viewport.name} legacy ${path}`);
  }

  await page.goto(`${baseUrl}/track-request`, { waitUntil: 'networkidle' });
  await clickTo(page, '[data-cta="track-login"]', '/login', `${viewport.name} legacy tracking login`);

  await context.close();
}

await browser.close();

if (failures.length) {
  console.error('Public-site rendered QA failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Public UX audit passed: ${routes.length} canonical surfaces, ${viewports.length} viewports, CTA/footer clicks and legacy redirects.`);
