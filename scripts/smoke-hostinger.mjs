import { access, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const output = resolve(process.cwd(), 'dist-hostinger');
const mode = process.env.DEPLOY_MODE === 'production' ? 'production' : 'preview';
const siteOrigin = (process.env.SITE_ORIGIN || '').replace(/\/$/, '');

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

if (!index.includes('Vazirmatn')) throw new Error('Vazirmatn is missing from deployment');
if (!index.includes('/assets/site.webmanifest')) throw new Error('Web manifest is not linked');
if (!index.includes('href="/styles/tokens.css"')) throw new Error('Hostinger styles must use root-relative URLs');
if (!index.includes('src="/src/app/bootstrap.js"')) throw new Error('Hostinger scripts must use root-relative URLs');
if (!htaccess.includes('RewriteRule . /index.html [L]')) throw new Error('SPA fallback is missing');
if (health.deploymentMode !== mode) throw new Error(`Health metadata does not report ${mode} mode`);

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
}

console.log(`Hostinger ${mode} smoke test passed (${required.length} required files).`);
