import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreviewResponder, fetchPublicResource, resolvePreview } from '../lib/previews.js';
import { previewVersion } from '../lib/preview-version.js';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==', 'base64');
const IMAGE = 'https://raw.githubusercontent.com/MartinDelophy/awesome-gpt-6-astra/main/assets/screenshots/miami-flap/gameplay.png';
const WORK = {
  id: 'work-cb57eb2736f27dc5', name: 'Miami Flap', imageUrl: IMAGE,
  demoUrl: 'https://miami-flap-neon.europeaningredients.chatgpt.site/',
  sourceUrl: 'https://github.com/MartinDelophy/awesome-gpt-6-astra/blob/main/assets/screenshots/miami-flap/SOURCE.md',
  repoUrl: 'https://github.com/MartinDelophy/awesome-gpt-6-astra',
};

test('a user supplied loopback image is rejected by the public fetcher', async () => {
  await assert.rejects(fetchPublicResource('https://127.0.0.1/private.png'), /Unsafe preview URL/);
});

test('the reported versioned preview URL returns the real author image from upstream', async () => {
  assert.equal(previewVersion(WORK), 'f266542bb2d645b5');
  const respond = createPreviewResponder({
    loadCatalogFor: async () => ({ works: [WORK] }), isLocale: locale => locale === 'zh-CN', defaultLocale: 'zh-CN',
    getPreview: work => resolvePreview(work, { fetcher: async (url) => {
      assert.equal(url, IMAGE);
      return { body: PNG, contentType: 'image/png', url };
    } }),
  });
  const response = await respond(new Request('https://astragames.aigccreative.com/api/preview?id=work-cb57eb2736f27dc5&v=f266542bb2d645b5&l=zh-CN'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Preview-Type'), 'author-image');
  assert.equal(response.headers.get('Content-Type'), 'image/png');
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), PNG);
});

test('an unavailable preview cannot leave a browser or CDN negative cache', async () => {
  const respond = createPreviewResponder({
    loadCatalogFor: async () => ({ works: [WORK] }), isLocale: () => true, defaultLocale: 'en',
    getPreview: async () => ({ unavailable: true, kind: 'unavailable', maxAge: 900 }),
  });
  const response = await respond(new Request('https://astragames.aigccreative.com/api/preview?id=' + WORK.id));
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});
