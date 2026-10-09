import test from 'node:test';
import assert from 'node:assert/strict';
import { adsAllowed, bannerForWidth, BANNERS, createAdQueue } from '../lib/adsterra.ts';
test('ads only run on approved catalogue and detail pages', () => {
  for (const path of ['/en', '/zh-CN/', '/en/works/chess', '/pt-BR/works/demo']) assert.equal(adsAllowed('astragames.aigccreative.com', path), true);
  for (const path of ['/en/privacy', '/en/guides/test', '/en/contact', '/api/catalog', '/en/works/', '/en/works/a/b']) assert.equal(adsAllowed('astragames.aigccreative.com', path), false);
  for (const host of ['localhost', 'astra-games.vercel.app', 'aigccreative.com', 'astragames.aigccreative.com.evil.test']) assert.equal(adsAllowed(host, '/en'), false);
});
test('responsive banner never exceeds available width', () => {
  assert.equal(bannerForWidth(319), null);
  assert.equal(bannerForWidth(320), BANNERS.mobile);
  assert.equal(bannerForWidth(727), BANNERS.mobile);
  assert.equal(bannerForWidth(728), BANNERS.desktop);
});
test('banner jobs are serialized and a failed tag does not block later units', async () => {
  const enqueue = createAdQueue();
  const events = [];
  let release;
  const first = enqueue(async () => { events.push('first'); await new Promise(resolve => { release = resolve; }); events.push('first done'); });
  const second = enqueue(async () => { events.push('second'); throw new Error('ad unavailable'); });
  const caught = second.catch(() => undefined);
  const third = enqueue(async () => { events.push('third'); });
  await Promise.resolve();
  assert.deepEqual(events, ['first']);
  release();
  await Promise.all([first, caught, third]);
  assert.deepEqual(events, ['first', 'first done', 'second', 'third']);
});
