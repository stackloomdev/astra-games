import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreviewResponder, fetchPreviewResource, resolvePreview } from '../lib/previews.js';
import { previewVersion } from '../lib/preview-version.js';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==', 'base64');
const IMAGE = 'https://raw.githubusercontent.com/MartinDelophy/awesome-gpt-6-astra/main/assets/screenshots/miami-flap/gameplay.png';
const MIRROR = 'http://127.0.0.1:3031/';
const WORK = {
  id: 'work-cb57eb2736f27dc5', name: 'Miami Flap', imageUrl: IMAGE,
  demoUrl: 'https://miami-flap-neon.europeaningredients.chatgpt.site/',
  sourceUrl: 'https://github.com/MartinDelophy/awesome-gpt-6-astra/blob/main/assets/screenshots/miami-flap/SOURCE.md',
  repoUrl: 'https://github.com/MartinDelophy/awesome-gpt-6-astra',
};

test('the upstream author screenshot resolves through the configured archive mirror', async () => {
  const result = await fetchPreviewResource(IMAGE, {}, {
    mirrorBaseUrl: MIRROR,
    mirrorFetch: async (url, options) => {
      assert.equal(url, MIRROR + 'assets/screenshots/miami-flap/gameplay.png');
      assert.equal(options.redirect, 'error');
      return new Response(PNG, { headers: { 'Content-Type': 'image/png' } });
    },
    publicFetch: () => assert.fail('a synchronized author screenshot needs no raw CDN fetch'),
  });
  assert.deepEqual(result.body, PNG);
  assert.equal(result.contentType, 'image/png');
  assert.equal(result.url, IMAGE);
});

test('other hosts, repositories, branches, query variants and escaped paths stay on the public fetcher', async () => {
  const urls = [
    'https://images.example.net/gameplay.png',
    IMAGE.replace('MartinDelophy', 'OtherAuthor'),
    IMAGE.replace('/main/', '/another-branch/'),
    IMAGE + '?download=1', IMAGE + '#fragment',
    IMAGE.replace('assets/screenshots/miami-flap/gameplay.png', 'assets/%2e%2e%2fsecret.png'),
    IMAGE.replace('assets/screenshots/miami-flap/gameplay.png', 'assets/screenshots/%5csecret.png'),
    IMAGE.replace('assets/screenshots/miami-flap/gameplay.png', 'private/gameplay.png'),
  ];
  for (const url of urls) {
    let fetched = false;
    await fetchPreviewResource(url, {}, {
      mirrorBaseUrl: MIRROR,
      mirrorFetch: () => assert.fail(`unexpected local mirror request for ${url}`),
      publicFetch: async (actual) => { assert.equal(actual, url); fetched = true; return {}; },
    });
    assert.ok(fetched, url);
  }
});

test('a user supplied loopback image cannot use the trusted internal fetch path', async () => {
  await assert.rejects(fetchPreviewResource('https://127.0.0.1/private.png', {}, {
    mirrorBaseUrl: MIRROR,
    mirrorFetch: () => assert.fail('loopback source must not be fetched'),
    publicFetch: () => assert.fail('invalid source must be rejected first'),
  }), /Unsafe preview URL/);
});

test('a failed mirror or invalid raster falls back within the original request deadline', async () => {
  for (const makeResponse of [
    () => new Response('unavailable', { status: 503 }),
    () => new Response('<html>not an image</html>', { headers: { 'Content-Type': 'image/png' } }),
    () => new Response(PNG, { headers: { 'Content-Length': '9999999' } }),
  ]) {
    const fallback = { body: PNG, contentType: 'image/png' };
    const result = await fetchPreviewResource(IMAGE, { timeoutMs: 1000 }, {
      mirrorBaseUrl: MIRROR,
      mirrorFetch: async () => makeResponse(),
      publicFetch: async (url, options) => {
        assert.equal(url, IMAGE);
        assert.ok(options.timeoutMs > 0 && options.timeoutMs <= 1000);
        return fallback;
      },
    });
    assert.equal(result, fallback);
  }
});

test('the streaming byte limit is enforced even without a Content-Length header', async () => {
  let fellBack = false;
  await fetchPreviewResource(IMAGE, { maxBytes: PNG.length - 1 }, {
    mirrorBaseUrl: MIRROR,
    mirrorFetch: async () => new Response(PNG),
    publicFetch: async (_url, options) => {
      assert.equal(options.maxBytes, PNG.length - 1);
      fellBack = true;
      return {};
    },
  });
  assert.ok(fellBack);
});

test('the reported versioned preview URL returns the real author image through the mirror', async () => {
  assert.equal(previewVersion(WORK), 'f266542bb2d645b5');
  const respond = createPreviewResponder({
    loadCatalogFor: async () => ({ works: [WORK] }), isLocale: locale => locale === 'zh-CN', defaultLocale: 'zh-CN',
    getPreview: work => resolvePreview(work, { fetcher: (url, options) => fetchPreviewResource(url, options, {
      mirrorBaseUrl: MIRROR, mirrorFetch: async () => new Response(PNG),
      publicFetch: () => assert.fail('raw CDN should not be needed'),
    }) }),
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
