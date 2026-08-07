import { access, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const output = resolve(process.cwd(), 'dist-hostinger');
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

if (!index.includes('Vazirmatn')) throw new Error('Vazirmatn is missing from deployment');
if (!index.includes('noindex,nofollow')) throw new Error('Preview deployment must remain noindex');
if (!htaccess.includes('RewriteRule . /index.html [L]')) throw new Error('SPA fallback is missing');
if (!robots.includes('Disallow: /')) throw new Error('Preview robots policy is unsafe');

console.log(`Hostinger smoke test passed (${required.length} required files).`);
