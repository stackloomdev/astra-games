// Ported from MartinDelophy/awesome-gpt-6-astra `website/server/previews.js`.
// Resolves a cover for each catalogue entry: author artwork, then a verified
// local screenshot, then the demo page's Open Graph image, then the GitHub
// repository card. Fetching is deliberately locked down — HTTPS only, DNS
// resolved once and the address pinned for the request, private ranges
// rejected, size and redirect budgets enforced — because the URLs come from
// a community-edited README.
//
// Unchanged from upstream except: the manifest is a static import, and the
// Node (req, res) handler is replaced by a Web Response one.
import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import { isIP } from 'node:net';
import { createHash } from 'node:crypto';
import previewManifest from './previews.manifest.json' with { type: 'json' };
import { previewVersion } from './preview-version.js';

const manifest = previewManifest;
const DAY = 86400;
const MAX_CACHE_BYTES = 24 * 1024 * 1024;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const cache = new Map();
const pending = new Map();
let cacheBytes = 0;

function canonicalUrl(value) {
  try { const url = new URL(value); url.hash = ''; return url.href.replace(/\/$/, ''); }
  catch { return null; }
}

/** Conservative public-address policy. IPv6 tunnels/mapped IPv4 are rejected. */
export function isPublicAddress(address) {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
      (a === 192 && b === 0 && (c === 0 || c === 2)) ||
      (a === 192 && b === 88 && c === 99) || (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113));
  }
  if (isIP(address) === 6) {
    const lower = address.toLowerCase();
    // Only global unicast 2000::/3; conservatively exclude special-purpose 2001::/23 and 6to4.
    const first = Number.parseInt(lower.split(':')[0], 16);
    const second = Number.parseInt(lower.split(':')[1] || '0', 16);
    return first >= 0x2000 && first < 0x3fff && first !== 0x2002 &&
      !(first === 0x2001 && (second < 0x200 || second === 0xdb8));
  }
  return false;
}

export function validatePreviewUrl(value) {
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password ||
      (url.port && url.port !== '443') || isIP(host.replace(/^\[|\]$/g, '')) ||
      !host.includes('.') || host.endsWith('.') ||
      /\.(localhost|local|internal|test|invalid|example|onion|home|lan)$/.test(host) ||
      host.length > 253 || url.href.length > 2048) throw new Error('Unsafe preview URL');
  return url;
}

/** Resolve once, reject any private address, then pin that address for this request. */
export async function fetchPublicResource(value, { maxBytes = MAX_IMAGE_BYTES, timeoutMs = 4500, redirects = 3 } = {}) {
  const deadline = Date.now() + timeoutMs;
  const visit = async (input, remainingRedirects) => {
    const url = validatePreviewUrl(input);
    const timeLeft = deadline - Date.now();
    if (timeLeft <= 0) throw new Error('Preview timed out');
    let timer;
    const records = await Promise.race([
      lookup(url.hostname, { all: true, verbatim: true }),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('DNS timed out')), timeLeft); }),
    ]).finally(() => clearTimeout(timer));
    if (!records.length || records.some(({ address }) => !isPublicAddress(address))) throw new Error('Non-public preview address');
    const pinned = records[0];
    const response = await new Promise((resolve, reject) => {
      const req = request(url, {
        method: 'GET',
        agent: false,
        headers: { 'User-Agent': 'AstraShowcase/1.0 (public project preview)', Accept: 'text/html,image/png,image/jpeg,image/webp,image/gif,image/avif;q=0.9', 'Accept-Encoding': 'identity' },
        lookup: (_host, options, callback) => options.all
          ? callback(null, [{ address: pinned.address, family: pinned.family }])
          : callback(null, pinned.address, pinned.family),
      }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.destroy();
          try { resolve({ redirect: new URL(res.headers.location, url).href }); }
          catch { reject(new Error('Invalid preview redirect')); }
          return;
        }
        if (res.statusCode !== 200) { res.destroy(); reject(new Error('Preview resource unavailable')); return; }
        if (Number(res.headers['content-length']) > maxBytes) { res.destroy(); reject(new Error('Preview too large')); return; }
        const chunks = [];
        let length = 0;
        res.on('data', chunk => {
          length += chunk.length;
          if (length > maxBytes) { req.destroy(new Error('Preview too large')); return; }
          chunks.push(chunk);
        });
        res.on('error', reject);
        res.on('end', () => resolve({ body: Buffer.concat(chunks), contentType: String(res.headers['content-type'] || '').split(';')[0].trim().toLowerCase(), url: url.href }));
      });
      const timeout = setTimeout(() => req.destroy(new Error('Preview timed out')), Math.max(1, deadline - Date.now()));
      req.on('error', reject);
      req.on('close', () => clearTimeout(timeout));
      req.end();
    });
    if (response.redirect) {
      if (remainingRedirects <= 0) throw new Error('Too many preview redirects');
      return visit(response.redirect, remainingRedirects - 1);
    }
    return response;
  };
  return visit(value, redirects);
}

function decodeEntities(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#(?:x[\da-f]+|\d+));/gi, entity => {
    const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' };
    if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
    const point = entity[2].toLowerCase() === 'x' ? parseInt(entity.slice(3, -1), 16) : parseInt(entity.slice(2, -1), 10);
    return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : '';
  });
}

export function extractOpenGraphImage(html, pageUrl) {
  const tags = String(html).slice(0, 768 * 1024).match(/<meta\b[^>]*>/gi) || [];
  const candidates = [];
  for (const tag of tags) {
    const attrs = {};
    for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) attrs[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4]);
    const property = (attrs.property || attrs.name || '').toLowerCase();
    if (['og:image', 'og:image:url', 'og:image:secure_url', 'twitter:image', 'twitter:image:src'].includes(property) && attrs.content) {
      try { candidates.push({ url: validatePreviewUrl(new URL(attrs.content, pageUrl).href).href, priority: property.startsWith('og:') ? 0 : 1 }); } catch {}
    }
  }
  return candidates.sort((a, b) => a.priority - b.priority)[0]?.url || null;
}

function imageType(body) {
  if (body.length < 16) return null;
  if (body.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff) return 'image/jpeg';
  if (/^GIF8[79]a/.test(body.subarray(0, 6).toString('ascii'))) return 'image/gif';
  if (body.subarray(0, 4).toString() === 'RIFF' && body.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  if (body.subarray(4, 8).toString() === 'ftyp' && ['avif', 'avis'].includes(body.subarray(8, 12).toString())) return 'image/avif';
  return null;
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

async function buildPreview(work, fetcher) {
  const matched = manifest.find(item => item.urls.some(url => [work.demoUrl, work.sourceUrl].map(canonicalUrl).includes(canonicalUrl(url))));
  if (matched && !work.imageUrl) return { location: matched.file, kind: 'screenshot', maxAge: DAY };
  const deadline = Date.now() + 10500;
  const fetchBeforeDeadline = (url, options = {}) => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error('Preview budget exhausted');
    return fetcher(url, { ...options, timeoutMs: Math.min(3500, remaining) });
  };
  const readImage = async (url, kind) => {
    const result = await fetchBeforeDeadline(url);
    const contentType = imageType(result.body);
    if (!contentType) throw new Error('Not a supported raster image');
    return { body: result.body, contentType, kind, maxAge: DAY };
  };
  if (work.imageUrl) {
    try { return await readImage(work.imageUrl, 'author-image'); } catch {}
  }
  if (matched) return { location: matched.file, kind: 'screenshot', maxAge: DAY };
  const pages = [work.demoUrl, githubRepositoryUrl(work)].filter((url, index, all) => url && all.indexOf(url) === index);
  for (const url of pages) {
    try {
      const page = await fetchBeforeDeadline(url, { maxBytes: 768 * 1024 });
      if (page.contentType !== 'text/html' && page.contentType !== 'application/xhtml+xml') continue;
      const og = extractOpenGraphImage(page.body.toString('utf8'), page.url || url);
      if (og) return await readImage(og, new URL(url).hostname === 'github.com' ? 'repository-card' : 'author-image');
    } catch {}
  }
  return { unavailable: true, kind: 'unavailable', maxAge: 900 };
}

/** Only call with an entry returned by loadCatalog(), never a user-supplied URL. */
export async function resolvePreview(work, { fetcher = fetchPublicResource } = {}) {
  const key = createHash('sha256').update(JSON.stringify([work.id, work.imageUrl, work.demoUrl, work.sourceUrl, work.repoUrl])).digest('hex');
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  if (pending.has(key)) return pending.get(key);
  const promise = buildPreview(work, fetcher).then(value => {
    const existing = cache.get(key);
    if (existing) { cacheBytes -= existing.value.body?.length || 0; cache.delete(key); }
    cache.set(key, { value, expiresAt: Date.now() + value.maxAge * 1000 });
    cacheBytes += value.body?.length || 0;
    while (cache.size > 256 || cacheBytes > MAX_CACHE_BYTES) {
      const oldest = cache.keys().next().value;
      cacheBytes -= cache.get(oldest).value.body?.length || 0;
      cache.delete(oldest);
    }
    return value;
  }).finally(() => pending.delete(key));
  pending.set(key, promise);
  return promise;
}

/**
 * Web-standard replacement for upstream's Node `(req, res)` handler, so the same
 * resolver can back a Next.js route handler. The query contract keeps upstream's
 * strictness — exactly one `id`, an optional 16-hex `v` that must match the
 * current catalogue entry, nothing unexpected — and adds one `l` for the
 * language, because a work's id is derived from its translated title.
 */
export function createPreviewResponder({ loadCatalogFor, isLocale, defaultLocale, getPreview = resolvePreview }) {
  const baseHeaders = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };

  return async function respond(request) {
    const method = request.method || 'GET';
    if (!['GET', 'HEAD'].includes(method)) {
      return new Response(null, { status: 405, headers: { ...baseHeaders, Allow: 'GET, HEAD' } });
    }

    const params = new URL(request.url).searchParams;
    const id = params.get('id');
    const version = params.get('v');
    const locale = params.get('l');
    if (params.getAll('id').length !== 1 || !id || id.length > 200 || params.getAll('v').length > 1 ||
        (version !== null && !/^[a-f0-9]{16}$/.test(version)) ||
        params.getAll('l').length > 1 || (locale !== null && !isLocale(locale)) ||
        [...params.keys()].some(key => !['id', 'v', 'l'].includes(key))) {
      return new Response(null, { status: 400, headers: baseHeaders });
    }

    try {
      const catalog = await loadCatalogFor(locale || defaultLocale);
      const work = catalog.works.find(entry => entry.id === id);
      if (!work) return new Response(null, { status: 404, headers: baseHeaders });

      // A stale version means the catalogue moved on; never cache that answer.
      if (version !== null && version !== previewVersion(work)) {
        return new Response(null, { status: 404, headers: { ...baseHeaders, 'Cache-Control': 'no-store' } });
      }

      const result = await getPreview(work);
      const headers = {
        ...baseHeaders,
        'Cache-Control': `public, max-age=${result.maxAge}, s-maxage=${result.maxAge}, stale-while-revalidate=86400`,
        'X-Preview-Type': result.kind,
      };

      if (result.unavailable) return new Response(null, { status: 404, headers });
      if (result.location) return new Response(null, { status: 307, headers: { ...headers, Location: result.location } });

      return new Response(method === 'HEAD' ? null : result.body, {
        status: 200,
        headers: { ...headers, 'Content-Type': result.contentType, 'Content-Length': String(result.body.length) },
      });
    } catch {
      return new Response(null, { status: 503, headers: { ...baseHeaders, 'Cache-Control': 'no-store' } });
    }
  };
}
