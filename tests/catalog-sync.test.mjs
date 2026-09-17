import test from 'node:test';
import assert from 'node:assert/strict';
import { createCatalogService } from '../lib/catalog.js';

const document = (names) => `# Works\n\n## Games\n\n${names.map((name) => `- [${name}](https://${name.toLowerCase()}.example/) — An interactive browser game.`).join('\n')}`;

test('upstream additions and removals appear after cache expiry without a release', async () => {
  let time = Date.UTC(2026, 8, 17);
  let names = ['First'];
  let reads = 0;
  const service = createCatalogService({ fallback: null, now: () => time,
    fetchImpl: async () => { reads++; return new Response(document(names)); } });
  assert.deepEqual((await service.loadCatalog()).works.map((work) => work.name), ['First']);
  names = ['Second', 'Third'];
  assert.deepEqual((await service.loadCatalog()).works.map((work) => work.name), ['First']);
  assert.equal(reads, 1);
  time += 300_001;
  assert.deepEqual((await service.loadCatalog()).works.map((work) => work.name), ['Second', 'Third']);
  assert.equal(reads, 2);
});

test('upstream failure retains the last successful catalogue, then retries', async () => {
  let time = Date.UTC(2026, 8, 17);
  let fail = false;
  const service = createCatalogService({ fallback: null, now: () => time,
    fetchImpl: async () => fail ? new Response('Unavailable', { status: 503 }) : new Response(document(['First'])) });
  const fresh = await service.loadCatalog();
  fail = true;
  time += 300_001;
  const stale = await service.loadCatalog();
  assert.deepEqual(stale.works, fresh.works);
  assert.equal(stale.source.status, 'stale');
  assert.equal(stale.source.lastSuccessfulAt, fresh.source.lastSuccessfulAt);
  assert.equal(stale.refreshAfterSeconds, 30);
  fail = false;
  time += 30_001;
  assert.equal((await service.loadCatalog()).source.status, 'fresh');
});

test('an explicitly emptied upstream catalogue removes obsolete entries', async () => {
  let time = Date.UTC(2026, 8, 17);
  let names = ['First'];
  const service = createCatalogService({ fallback: null, now: () => time,
    fetchImpl: async () => new Response(document(names)) });
  await service.loadCatalog();
  names = [];
  time += 300_001;
  const empty = await service.loadCatalog();
  assert.equal(empty.source.status, 'fresh');
  assert.deepEqual(empty.works, []);
});
