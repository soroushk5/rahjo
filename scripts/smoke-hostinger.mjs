import { access, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const output = resolve(process.cwd(), 'dist-hostinger');
const mode = process.env.DEPLOY_MODE === 'production' ? 'production' : 'preview';
const siteOrigin = (process.env.SITE_ORIGIN || '').replace(/\/$/, '');
const expectedCommit = process.env.COMMIT_SHA || process.env.GITHUB_SHA || null;

if (mode === 'production' && !siteOrigin) {
  throw new Error('SITE_ORIGIN is required to smoke-test a production build');
}
const required = [
  'index.html',
  '404.html',
  '.htaccess',
  'robots.txt',
  'health.json',
  'assets/favicon.svg',
  'assets/site.webmanifest',
  'styles/tokens.css',
  'src/app/bootstrap.js',
];

for (const file of required) {
  await access(join(output, file));
  const info = await stat(join(output, file));
  if (!info.size) throw new Error(`${file} is empty`);
}

const index = await readFile(join(output, 'index.html'), 'utf8');
const htaccess = await readFile(join(output, '.htaccess'), 'utf8');
const robots = await readFile(join(output, 'robots.txt'), 'utf8');
const health = JSON.parse(await readFile(join(output, 'health.json'), 'utf8'));
const runtimeConfigMatch = index.match(/<script id="rahjo-runtime-config" type="application\/json">([\s\S]*?)<\/script>/);
if (!runtimeConfigMatch) throw new Error('Runtime configuration is missing from deployment HTML');
const runtimeConfig = JSON.parse(runtimeConfigMatch[1]);
const assetBase = health.assetBase;
const siteBasePath = health.siteBasePath || '';

if (!/^\/(?:[A-Za-z0-9._~-]+\/)*releases\/[A-Za-z0-9._-]+$/.test(assetBase || '')) {
  throw new Error(`Health metadata has an invalid assetBase: ${assetBase}`);
}
if (siteBasePath && !/^\/[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)*$/.test(siteBasePath)) {
  throw new Error(`Health metadata has an invalid siteBasePath: ${siteBasePath}`);
}
if (assetBase !== `${siteBasePath}/releases/${health.assetVersion}`) {
  throw new Error('Health metadata assetBase does not match siteBasePath and assetVersion');
}
if (expectedCommit && health.commit !== expectedCommit) {
  throw new Error(`Health commit ${health.commit} does not match expected source ${expectedCommit}`);
}
if (mode === 'production' && !/^[0-9a-f]{40}$/i.test(health.commit || '')) {
  throw new Error('Production health metadata must contain a full source commit');
}

const versionedRequired = [
  'assets/favicon.svg',
  'assets/site.webmanifest',
  'styles/tokens.css',
  'styles/base.css',
  'styles/phase-one.css',
  'src/app/basePath.js',
  'src/app/bootstrap.js',
];

for (const file of versionedRequired) {
  const versionedPath = join(output, 'releases', health.assetVersion, file);
  await access(versionedPath);
  const info = await stat(versionedPath);
  if (!info.size) throw new Error(`${assetBase}/${file} is empty`);
}

if (!index.includes('Vazirmatn')) throw new Error('Vazirmatn is missing from deployment');
if (!index.includes(`${assetBase}/assets/site.webmanifest`)) throw new Error('Versioned web manifest is not linked');
if (!index.includes(`href="${assetBase}/styles/tokens.css"`)) throw new Error('Hostinger styles must use release-versioned URLs');
if (!index.includes(`src="${assetBase}/src/app/basePath.js"`)) throw new Error('Base-path bootstrap must use a release-versioned URL');
if (!index.includes(`src="${assetBase}/src/app/bootstrap.js"`)) throw new Error('Hostinger scripts must use release-versioned URLs');
if (index.includes('src="/src/app/bootstrap.js"')) throw new Error('Unversioned production bootstrap URL is unsafe with immutable caching');
if (/<script(?![^>]*\bsrc=)(?![^>]*\btype=["']application\/json["'])[^>]*>/i.test(index)) {
  throw new Error('Executable inline scripts are incompatible with the production CSP');
}
if (!htaccess.includes('RewriteRule . /index.html [L]')) throw new Error('SPA fallback is missing');
if (!htaccess.includes('max-age=31536000, immutable')) throw new Error('Immutable asset caching policy is missing');
if (!htaccess.includes('Content-Security-Policy')) throw new Error('Production CSP header is missing');
if (!htaccess.includes("script-src 'self'")) throw new Error('Production CSP must restrict scripts to same-origin assets');
if (health.deploymentMode !== mode) throw new Error(`Health metadata does not report ${mode} mode`);
if (!['demo', 'server'].includes(runtimeConfig.mode)) throw new Error('Deployment runtime mode must be demo or server');
if (health.runtimeMode !== runtimeConfig.mode) throw new Error('Health and HTML runtime modes differ');
if (health.apiBase !== runtimeConfig.apiBase) throw new Error('Health and HTML API bases differ');
if (health.buildSha !== runtimeConfig.buildSha || health.commit !== runtimeConfig.buildSha) {
  throw new Error('Health and HTML build SHAs differ');
}
if (runtimeConfig.mode === 'demo' && runtimeConfig.apiBase !== '') throw new Error('Demo deployment cannot expose a server API base');
if (runtimeConfig.mode === 'server') {
  const apiUrl = new URL(runtimeConfig.apiBase);
  if (apiUrl.username || apiUrl.password || apiUrl.search || apiUrl.hash) throw new Error('Server API base contains unsafe URL fields');
  if (mode === 'production' && apiUrl.protocol !== 'https:') throw new Error('Production server API base must use HTTPS');
  if (mode === 'production' && !htaccess.includes(`connect-src 'self' ${apiUrl.origin};`)) {
    throw new Error('Production CSP does not allow the configured server API origin');
  }
}

if (mode === 'preview') {
  if (!index.includes('noindex,nofollow')) throw new Error('Preview deployment must remain noindex');
  if (!htaccess.includes('X-Robots-Tag "noindex')) throw new Error('Preview X-Robots-Tag is missing');
  if (!robots.includes('Disallow: /')) throw new Error('Preview robots policy is unsafe');
} else {
  if (index.includes('noindex')) throw new Error('Production HTML must be indexable');
  if (htaccess.includes('X-Robots-Tag')) throw new Error('Production headers must not force noindex');
  if (!robots.includes('Allow: /')) throw new Error('Production robots policy must allow crawling');
  if (!index.includes(`<link rel="canonical" href="${siteOrigin}/" />`)) throw new Error('Production canonical URL is missing');
  if (!robots.includes(`Sitemap: ${siteOrigin}/sitemap.xml`)) throw new Error('Production sitemap URL is missing from robots.txt');
  await access(join(output, 'sitemap.xml'));

  const sitemap = await readFile(join(output, 'sitemap.xml'), 'utf8');
  const publicRoutes = ['/', '/product', '/contact', '/privacy', '/terms'];
  const nonCanonicalRoutes = ['/services', '/use-cases', '/how-it-works', '/pilot', '/trust', '/about', '/track-request'];
  const retiredRoutes = ['/platform', '/data', '/map', '/atlas', '/request'];

  for (const route of publicRoutes) {
    if (!sitemap.includes(`<loc>${siteOrigin}${route}</loc>`)) {
      throw new Error(`Production sitemap is missing ${route}`);
    }
  }

  for (const route of [...nonCanonicalRoutes, ...retiredRoutes]) {
    if (sitemap.includes(`<loc>${siteOrigin}${route}</loc>`)) {
      throw new Error(`Production sitemap exposes non-canonical route ${route}`);
    }
  }
}

console.log(`Hostinger ${mode} smoke test passed (${required.length} required files).`);
