/**
 * Pre-renders every cover in the catalogue as small static WebP files.
 *
 *   npm run covers        (also the first step of `npm run build`)
 *
 * Covers used to be resized per request inside /api/preview. On Vercel that is
 * function Active CPU, and the CDN caches a function response per URL, Accept
 * header, region and deployment — so with twelve languages, several widths and
 * a redeploy on every push, nearly every request was a fresh encode and the
 * Hobby plan's CPU allowance ran out. Build machines are not metered that way.
 * Here each cover is encoded once, written to public/covers, and served by the
 * CDN without running a function at all.
 *
 * The catalogue itself stays live. A work added upstream after this build has
 * no file yet, and the site shows it through /api/preview's plain pass-through
 * until the next deployment. Nothing in this script can fail the build: a cover
 * that will not resolve or decode is left to that same fallback.
 *
 * Encoded files are kept in .next/cache, which Vercel restores before each
 * build, so a deployment only fetches and encodes covers that are new or older
 * than CACHE_TTL.
 */
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseCatalogMarkdown, rawUrlFor } from '../lib/catalog.js';
import { resolvePreview } from '../lib/previews.js';
import { coverKey, coverPath } from '../lib/preview-version.js';

// Cards are drawn roughly 360-450 CSS px wide and the WebGL deck samples at 640:
// 640 serves 1x screens and the deck, 1080 serves 2x and 3x screens.
const WIDTHS = [640, 1080];
const QUALITY = 74;
const OUT_DIR = 'public/covers';
const MANIFEST = join(OUT_DIR, 'manifest.json');
const CACHE_DIR = '.next/cache/astra-covers';
const CACHE_TTL = 3 * 24 * 60 * 60 * 1000;
// A cover that resolved to nothing is not retried on every build.
const UNAVAILABLE_TTL = 24 * 60 * 60 * 1000;
// No new cover is started after this; whatever is left falls back at runtime.
const BUDGET = 120 * 1000;
// A hard stop for anything the budget cannot interrupt, such as a hung socket.
// Exiting without a manifest is always safe.
const WATCHDOG = 240 * 1000;
// Mostly network wait; encoding is a small share of each slot.
const CONCURRENCY = 12;
// Far below libvips' default. A 4 MB download can still decompress to something
// enormous, and these URLs come from a community-edited README.
const MAX_INPUT_PIXELS = 40_000_000;

const started = Date.now();
const log = (message) => console.log(`[covers] ${message}`);
const cacheFile = (key, width) => join(CACHE_DIR, `${key}-${width}.webp`);
const metaFile = (key) => join(CACHE_DIR, `${key}.json`);
let everyReadmeLoaded = true;

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// lib/i18n.ts is TypeScript and this runs in plain Node, so each language's
// README is read out of the locale table rather than imported.
async function readmePaths() {
  const source = await readFile('lib/i18n.ts', 'utf8').catch(() => '');
  const paths = [...new Set([...source.matchAll(/readme:\s*'([^']+)'/g)].map((match) => match[1]))];
  return paths.length ? paths : ['README.md'];
}

async function loadWorks(readmePath) {
  try {
    const response = await fetch(rawUrlFor(readmePath), { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return parseCatalogMarkdown(await response.text(), { readmePath });
  } catch (error) {
    everyReadmeLoaded = false;
    // Two languages ship a snapshot; any other simply contributes nothing.
    const code = readmePath === 'README.md' ? 'en' : readmePath.slice('README.'.length, -'.md'.length);
    try {
      const { works } = JSON.parse(await readFile(`lib/catalog-fallback.${code}.json`, 'utf8'));
      log(`${readmePath}: ${error.message}; using the checked-in snapshot`);
      return works;
    } catch {
      log(`${readmePath}: ${error.message}; skipped`);
      return [];
    }
  }
}

async function readMeta(key) {
  try {
    return JSON.parse(await readFile(metaFile(key), 'utf8'));
  } catch {
    return null;
  }
}

async function hasEveryWidth(key) {
  try {
    await Promise.all(WIDTHS.map((width) => stat(cacheFile(key, width))));
    return true;
  } catch {
    // Includes a width added since this entry was written.
    return false;
  }
}

async function buildOne(sharp, key, work) {
  const meta = await readMeta(key);
  const previous = meta && !meta.unavailable && (await hasEveryWidth(key)) ? meta : null;
  if (previous && Date.now() - previous.builtAt < CACHE_TTL) {
    return { key, status: 'cached', usable: true, kind: previous.kind };
  }
  if (meta?.unavailable && Date.now() - meta.checkedAt < UNAVAILABLE_TTL) {
    return { key, status: 'unavailable', usable: false };
  }
  // An old encoding beats none when the source is unreachable today.
  const fallBack = (status) =>
    previous ? { key, status: 'stale', usable: true, kind: previous.kind } : { key, status, usable: false };
  if (Date.now() - started > BUDGET) return fallBack('skipped');

  try {
    const preview = await resolvePreview(work);
    if (preview.unavailable) {
      if (!previous) await writeFile(metaFile(key), JSON.stringify({ checkedAt: Date.now(), unavailable: true }));
      return fallBack('unavailable');
    }
    // Verified screenshots are bundled files that the route would redirect to.
    const body = preview.location ? await readFile(join('public', preview.location)) : preview.body;
    // Encode every width before writing any, so a failure cannot leave a mixed set.
    const outputs = await Promise.all(
      WIDTHS.map((width) =>
        sharp(body, { limitInputPixels: MAX_INPUT_PIXELS, animated: true })
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: QUALITY })
          .toBuffer(),
      ),
    );
    await Promise.all(outputs.map((output, index) => writeFile(cacheFile(key, WIDTHS[index]), output)));
    await writeFile(metaFile(key), JSON.stringify({ builtAt: Date.now(), kind: preview.kind }));
    return { key, status: 'built', usable: true, kind: preview.kind };
  } catch (error) {
    log(`${work.name}: ${error.message}`);
    return fallBack('failed');
  }
}

async function main() {
  // next.config.ts trusts the manifest, so from here until the very end there is
  // none: an interrupted run must never name files it did not write.
  await rm(MANIFEST, { force: true });

  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    log('sharp is not installed; every cover will use the /api/preview pass-through');
    return;
  }

  const readmes = await readmePaths();
  const byKey = new Map();
  for (const works of await Promise.all(readmes.map(loadWorks))) {
    for (const work of works) {
      const key = coverKey(work);
      if (!byKey.has(key)) byKey.set(key, work);
    }
  }

  await mkdir(CACHE_DIR, { recursive: true });
  const results = await mapLimit([...byKey], CONCURRENCY, ([key, work]) => buildOne(sharp, key, work));

  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  const covers = {};
  for (const result of results.filter((entry) => entry.usable)) {
    await Promise.all(
      WIDTHS.map((width) => copyFile(cacheFile(result.key, width), join('public', coverPath(result.key, width)))),
    );
    covers[result.key] = result.kind;
  }

  // Drop covers that left the catalogue — but only when every list was read, or
  // a language that failed to load today would lose its cache.
  if (everyReadmeLoaded) {
    for (const name of await readdir(CACHE_DIR)) {
      if (!byKey.has(name.slice(0, 16))) await rm(join(CACHE_DIR, name), { force: true });
    }
  }

  await writeFile(MANIFEST, `${JSON.stringify({ widths: WIDTHS, covers })}\n`);

  const count = (status) => results.filter((entry) => entry.status === status).length;
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  log(
    `${Object.keys(covers).length}/${results.length} covers from ${readmes.length} READMEs in ${seconds}s` +
      ` (${count('built')} encoded, ${count('cached')} cached, ${count('stale')} stale,` +
      ` ${count('unavailable')} unavailable, ${count('failed')} failed, ${count('skipped')} over budget)`,
  );
}

setTimeout(() => {
  log('watchdog fired; continuing the build without static covers');
  process.exit(0);
}, WATCHDOG).unref();

try {
  await main();
} catch (error) {
  // An unexpected failure costs one deployment its static covers, not the deployment.
  log(`skipped: ${error?.stack || error}`);
}
// Nothing should still hold the event loop, but a lingering socket must not
// keep `next build` from starting.
setTimeout(() => process.exit(0), 2000).unref();
