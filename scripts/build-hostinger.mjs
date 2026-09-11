import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { injectRuntimeMetadata, runtimeHealthFields } from './runtime-metadata.mjs';

const root = resolve(process.cwd());
const output = join(root, 'dist-hostinger');
const mode = process.env.DEPLOY_MODE === 'production' ? 'production' : 'preview';
const siteOrigin = (process.env.SITE_ORIGIN || '').replace(/\/$/, '');
const commitSha = process.env.COMMIT_SHA || process.env.GITHUB_SHA || 'local';
const assetVersion = commitSha.replace(/[^A-Za-z0-9._-]/g, '').slice(0, 40) || 'local';
const rawBasePath = (process.env.SITE_BASE_PATH || '').trim();
const siteBasePath = rawBasePath && rawBasePath !== '/' ? `/${rawBasePath.replace(/^\/+|\/+$/g, '')}` : '';
const releaseBase = `/releases/${assetVersion}`;
const assetBase = `${siteBasePath}${releaseBase}`;
const releaseRoot = join(output, 'releases', assetVersion);
const generatedAt = new Date().toISOString();
const runtimeMode = process.env.RAHJO_RUNTIME_MODE || (mode === 'preview' ? 'demo' : '');
const rawApiBase = (process.env.RAHJO_API_BASE || '').trim();

if (!['demo', 'server'].includes(runtimeMode)) {
  throw new Error('RAHJO_RUNTIME_MODE must be explicitly set to demo or server for production builds');
}

if (runtimeMode === 'demo' && rawApiBase) {
  throw new Error('RAHJO_API_BASE must be empty in demo mode');
}

let apiBase = '';
if (runtimeMode === 'server') {
  if (!rawApiBase) throw new Error('RAHJO_API_BASE is required in server mode');
  const apiUrl = new URL(rawApiBase);
  if (apiUrl.username || apiUrl.password || apiUrl.search || apiUrl.hash) {
    throw new Error('RAHJO_API_BASE cannot contain credentials, a query, or a fragment');
  }
  const localHttp = apiUrl.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(apiUrl.hostname);
  if (apiUrl.protocol !== 'https:' && !localHttp) {
    throw new Error('RAHJO_API_BASE must use HTTPS; HTTP is allowed only for localhost');
  }
  if (mode === 'production' && apiUrl.protocol !== 'https:') {
    throw new Error('Production server mode requires an HTTPS RAHJO_API_BASE');
  }
  apiBase = apiUrl.toString().replace(/\/$/, '');
}

if (siteBasePath.includes('..') || /[?#]/.test(siteBasePath)) {
  throw new Error('SITE_BASE_PATH must be a safe URL path');
}

if (mode === 'production') {
  if (!siteOrigin) {
    throw new Error('SITE_ORIGIN is required for a production Hostinger build');
  }

  const productionUrl = new URL(siteOrigin);
  if (productionUrl.protocol !== 'https:' || productionUrl.pathname !== '/') {
    throw new Error('SITE_ORIGIN must be an HTTPS origin without a path');
  }

  if (!/^[0-9a-f]{40}$/i.test(commitSha)) {
    throw new Error('COMMIT_SHA must be the full source commit for a production build');
  }
}

const runtimeEntries = ['assets', 'src', 'styles', '.htaccess'];

await rm(output, { recursive: true, force: true, maxRetries: 8, retryDelay: 250 });
await mkdir(output, { recursive: true });

for (const entry of runtimeEntries) {
  await cp(join(root, entry), join(output, entry), { recursive: true });
}

await mkdir(releaseRoot, { recursive: true });
for (const entry of ['assets', 'src', 'styles']) {
  await cp(join(root, entry), join(releaseRoot, entry), { recursive: true });
}

let index = await readFile(join(root, 'index.html'), 'utf8');
const runtimeConfig = { mode: runtimeMode, apiBase, buildSha: commitSha };
const robotsMeta = mode === 'preview'
  ? '<meta name="robots" content="noindex,nofollow,noarchive,nosnippet" />'
  : '<meta name="robots" content="index,follow,max-image-preview:large" />';

index = injectRuntimeMetadata(index, runtimeConfig)
  .replace(/<meta name="robots"[^>]*>\s*/g, '')
  .replace(/(<meta name="theme-color"[^>]*>)/, `$1\n    ${robotsMeta}`)
  .replace(/<script id="base-path-bootstrap">[\s\S]*?<\/script>/, '<script src="src/app/basePath.js"></script>')
  .replace(/(<link rel="icon" href="\/?assets\/favicon\.svg" type="image\/svg\+xml" \/>)/, '$1\n    <link rel="manifest" href="assets/site.webmanifest" />')
  .replace(/href="\/?(assets|styles)\//g, `href="${assetBase}/$1/`)
  .replace(/src="\/?src\//g, `src="${assetBase}/src/`);

if (mode === 'production' && siteOrigin) {
  index = index.replace('</head>', `    <link rel="canonical" href="${siteOrigin}/" />\n  </head>`);
}

await writeFile(join(output, 'index.html'), index);
await writeFile(join(output, '404.html'), index);

if (mode === 'production') {
  const htaccessPath = join(output, '.htaccess');
  let htaccess = (await readFile(htaccessPath, 'utf8'))
    .replace(/^\s*Header always set X-Robots-Tag .*\r?\n/m, '');
  if (runtimeMode === 'server') {
    const apiOrigin = new URL(apiBase).origin;
    htaccess = htaccess.replace("connect-src 'self';", `connect-src 'self' ${apiOrigin};`);
  }
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
  start_url: `${siteBasePath || ''}/`,
  scope: `${siteBasePath || ''}/`,
  display: 'standalone',
  background_color: '#f5f8fb',
  theme_color: '#0b1d31',
  icons: [{ src: `${assetBase}/assets/favicon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
};
const manifestJson = JSON.stringify(manifest, null, 2);
await writeFile(join(output, 'assets/site.webmanifest'), manifestJson);
await writeFile(join(releaseRoot, 'assets/site.webmanifest'), manifestJson);

const health = {
  status: 'ok',
  application: 'rahjo-web-platform',
  deploymentMode: mode,
  ...runtimeHealthFields(runtimeConfig),
  commit: commitSha,
  assetVersion,
  assetBase,
  siteBasePath,
  generatedAt,
};
await writeFile(join(output, 'health.json'), JSON.stringify(health, null, 2));

if (mode === 'production' && siteOrigin) {
  const routes = ['/', '/product', '/contact', '/privacy', '/terms'];
  const urls = routes.map((route) => `  <url><loc>${siteOrigin}${route}</loc></url>`).join('\n');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  await writeFile(join(output, 'sitemap.xml'), sitemap);
}

console.log(`Hostinger ${mode} package created at ${output}`);
