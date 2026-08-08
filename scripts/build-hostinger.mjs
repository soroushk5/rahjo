import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(process.cwd());
const output = join(root, 'dist-hostinger');
const mode = process.env.DEPLOY_MODE === 'production' ? 'production' : 'preview';
const siteOrigin = (process.env.SITE_ORIGIN || '').replace(/\/$/, '');
const commitSha = process.env.GITHUB_SHA || process.env.COMMIT_SHA || 'local';
const generatedAt = new Date().toISOString();

if (mode === 'production') {
  if (!siteOrigin) {
    throw new Error('SITE_ORIGIN is required for a production Hostinger build');
  }

  const productionUrl = new URL(siteOrigin);
  if (productionUrl.protocol !== 'https:' || productionUrl.pathname !== '/') {
    throw new Error('SITE_ORIGIN must be an HTTPS origin without a path');
  }
}

const runtimeEntries = ['assets', 'src', 'styles', '.htaccess'];

await rm(output, { recursive: true, force: true, maxRetries: 8, retryDelay: 250 });
await mkdir(output, { recursive: true });

for (const entry of runtimeEntries) {
  await cp(join(root, entry), join(output, entry), { recursive: true });
}

let index = await readFile(join(root, 'index.html'), 'utf8');
const robotsMeta = mode === 'preview'
  ? '<meta name="robots" content="noindex,nofollow,noarchive,nosnippet" />'
  : '<meta name="robots" content="index,follow,max-image-preview:large" />';

index = index
  .replace(/<meta name="robots"[^>]*>\s*/g, '')
  .replace('<meta name="theme-color" content="#0b1d33" />', `<meta name="theme-color" content="#0b1d33" />\n    ${robotsMeta}`)
  .replace('رهجو؛ زیرساخت داده، احراز و گردش‌کار برای فرایندهای سازمانی قابل‌اعتماد.', 'رهجو؛ لایه دسترسی کنترل‌شده به داده‌های حساس و کمیاب برای کاربردهای سازمانی.')
  .replace(/href="(assets|styles)\//g, 'href="/$1/')
  .replace(/src="src\//g, 'src="/src/')
  .replace(/(<link rel="icon" href="\/?assets\/favicon\.svg" type="image\/svg\+xml" \/>)/, '$1\n    <link rel="manifest" href="/assets/site.webmanifest" />');

if (mode === 'production' && siteOrigin) {
  index = index.replace('</head>', `    <link rel="canonical" href="${siteOrigin}/" />\n  </head>`);
}

await writeFile(join(output, 'index.html'), index);
await writeFile(join(output, '404.html'), index);

if (mode === 'production') {
  const htaccessPath = join(output, '.htaccess');
  const htaccess = (await readFile(htaccessPath, 'utf8'))
    .replace(/^\s*Header always set X-Robots-Tag .*\r?\n/m, '');
  await writeFile(htaccessPath, htaccess);
}

const robots = mode === 'preview'
  ? 'User-agent: *\nDisallow: /\n'
  : `User-agent: *\nAllow: /\n${siteOrigin ? `Sitemap: ${siteOrigin}/sitemap.xml\n` : ''}`;
await writeFile(join(output, 'robots.txt'), robots);

const manifest = {
  name: 'رهجو',
  short_name: 'رهجو',
  lang: 'fa',
  dir: 'rtl',
  start_url: '/',
  display: 'standalone',
  background_color: '#f5f8fb',
  theme_color: '#0b1d33',
  icons: [{ src: '/assets/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
};
await writeFile(join(output, 'assets/site.webmanifest'), JSON.stringify(manifest, null, 2));

const health = {
  status: 'ok',
  application: 'rahjo-web-platform',
  deploymentMode: mode,
  commit: commitSha,
  generatedAt,
};
await writeFile(join(output, 'health.json'), JSON.stringify(health, null, 2));

if (mode === 'production' && siteOrigin) {
  const routes = ['/', '/platform', '/atlas', '/trust', '/dashboard', '/request', '/map'];
  const urls = routes.map((route) => `  <url><loc>${siteOrigin}${route}</loc></url>`).join('\n');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  await writeFile(join(output, 'sitemap.xml'), sitemap);
}

console.log(`Hostinger ${mode} package created at ${output}`);
