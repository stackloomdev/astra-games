// Run against `npm start` after `npm run build`, or a public deployment.
// Example: node --experimental-strip-types scripts/smoke-content.mjs http://localhost:3100
import assert from 'node:assert/strict';
import { GUIDES, CONTENT_LOCALES } from '../lib/editorial.ts';
const base = process.argv[2] || 'http://localhost:3100';
const paths = CONTENT_LOCALES.flatMap((locale) => [
  `/${locale}/guides`, ...GUIDES.map(({ slug }) => `/${locale}/guides/${slug}`),
  ...['about', 'privacy', 'contact'].map((page) => `/${locale}/${page}`),
]);
const sitemap = await fetch(`${base}/sitemap.xml`).then((response) => response.text());
for (const path of paths) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200, path);
  const html = await response.text();
  assert.ok(html.includes('<h1'), `${path}: server-rendered heading`);
  assert.ok(html.includes(`rel="canonical" href="https://astragames.aigccreative.com${path}"`), `${path}: self canonical`);
  assert.ok(sitemap.includes(`<loc>https://astragames.aigccreative.com${path}</loc>`), `${path}: sitemap entry`);
  assert.ok(!html.includes('pagead2.googlesyndication.com'), `${path}: no ad script`);
}
for (const path of ['/ja/privacy', '/ja/guides', '/en/guides/missing-guide']) {
  assert.equal((await fetch(base + path)).status, 404, `${path}: unavailable content stays 404`);
}
console.log(`PASS: ${paths.length} editorial pages, canonicals, sitemap entries and three unavailable routes.`);
