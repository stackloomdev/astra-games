// Shared browser/server identities for covers. Plain JavaScript on purpose:
// scripts/build-covers.mjs imports it from Node without a bundler.
import previewManifest from './previews.manifest.json' with { type: 'json' };

function hash16(input) {
  let first = 2166136261;
  let second = 3339675911;
  for (let i = 0; i < input.length; i++) {
    first = Math.imul(first ^ input.charCodeAt(i), 16777619);
    second = Math.imul(second ^ input.charCodeAt(i), 2246822519);
  }
  return (first >>> 0).toString(16).padStart(8, '0') + (second >>> 0).toString(16).padStart(8, '0');
}

function canonicalUrl(value) {
  try { const url = new URL(value); url.hash = ''; return url.href.replace(/\/$/, ''); }
  catch { return null; }
}

// Cache identity. The server verifies this value against the current catalogue;
// callers cannot use arbitrary versions to bypass its cache.
export function previewVersion(work) {
  return hash16(JSON.stringify([work.id, work.imageUrl ?? null, work.demoUrl ?? null, work.sourceUrl ?? null, work.repoUrl ?? null]));
}

// Work ids hash the title, and titles are translated, so the same entry has a
// different id in every language. The locale tells the route which catalogue to
// look the id up in.
export function previewPath(work, locale) {
  return `/api/preview?id=${encodeURIComponent(work.id)}&v=${previewVersion(work)}&l=${encodeURIComponent(locale)}`;
}

/** The bundled screenshot captured for this work's demo or source link, if any. */
export function screenshotFor(work) {
  const links = [work.demoUrl, work.sourceUrl].map(canonicalUrl);
  return previewManifest.find(item => item.urls.some(url => links.includes(canonicalUrl(url)))) ?? null;
}

export function githubRepositoryUrl(work) {
  for (const value of [work.repoUrl, work.sourceUrl, work.demoUrl]) {
    try {
      const url = new URL(value);
      const [owner, rawRepo] = url.pathname.split('/').filter(Boolean);
      const repo = rawRepo?.replace(/\.git$/, '');
      if (url.hostname === 'github.com' && url.protocol === 'https:' &&
          /^[a-z\d](?:[a-z\d-]{0,38})$/i.test(owner || '') &&
          /^[a-z\d_.-]{1,100}$/i.test(repo || '') && !['.', '..'].includes(repo)) return `https://github.com/${owner}/${repo}`;
    } catch {}
  }
  return null;
}

// A cover is a function of exactly what resolvePreview reads: the author's
// artwork, a bundled screenshot matched by link, the demo page, and the GitHub
// repository derived from the links. Keying on those rather than on the raw
// fields matters. A work with no source link of its own gets the README it is
// listed in as `sourceUrl`, and that README is different in every language —
// keyed on the raw field, one cover was twelve builds. The id is left out for
// the same reason: it is derived from the translated title.
export function coverKey(work) {
  return hash16(JSON.stringify([work.imageUrl ?? null, work.demoUrl ?? null, githubRepositoryUrl(work), screenshotFor(work)?.file ?? null]));
}

// Where scripts/build-covers.mjs writes a cover, and where the site links to it.
export function coverPath(key, width) {
  return `/covers/${key}-${width}.webp`;
}
