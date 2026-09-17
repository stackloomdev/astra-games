import test from 'node:test';
import assert from 'node:assert/strict';
import { GUIDES, guidesForWork, workIdentity } from '../lib/editorial.ts';

test('guides follow the demo across translated names without claiming coverage of new works', () => {
  const english = guidesForWork({ name: 'Orbital Garden', demoUrl: 'https://orbital-garden-one.vercel.app/' });
  const chinese = guidesForWork({ name: '轨道花园', demoUrl: 'https://orbital-garden-one.vercel.app' });
  assert.ok(english.length > 0);
  assert.deepEqual(chinese, english);
  assert.deepEqual(guidesForWork({ demoUrl: 'https://new-work.example/' }), []);
  assert.deepEqual(guidesForWork({ demoUrl: null }), []);
});

test('query and fragment game identities remain distinct on shared hosts', () => {
  assert.notEqual(workIdentity('https://games.example/?game=one'), workIdentity('https://games.example/?game=two'));
  assert.notEqual(workIdentity('https://games.example/#one'), workIdentity('https://games.example/#two'));
  assert.equal(workIdentity('javascript:alert(1)'), null);
  assert.equal(workIdentity('not a URL'), null);
});

test('published guides have bilingual evidence statements and sources', () => {
  assert.equal(new Set(GUIDES.map((guide) => guide.slug)).size, GUIDES.length);
  for (const guide of GUIDES) {
    assert.ok(guide.sources.length);
    for (const source of guide.sources) assert.equal(new URL(source.href).protocol, 'https:');
    for (const locale of ['en', 'zh-CN']) {
      assert.ok(guide.basis[locale].length);
      assert.ok(guide.copy[locale].sections.length);
      assert.ok(guide.copy[locale].title.length);
    }
  }
});
