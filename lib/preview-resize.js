// Downscaling for /api/preview.
//
// Covers are drawn a few hundred pixels wide but arrive at 1440x950, which is
// megabytes of decode and VRAM per card. Next's image optimiser would fix that,
// but on Vercel it bills against a transformation quota and answers 402 once the
// quota is spent — good covers disappear behind a billing limit. This route has
// already fetched the bytes, so it resizes them itself: ordinary function time,
// cacheable like any other response, no quota to exhaust.
//
// Every path here degrades to null, never to an error. A null answer means the
// caller serves the original, which is correct — just larger.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const MAX_VARIANT_BYTES = 12 * 1024 * 1024;
const MAX_VARIANTS = 512;
// Well under libvips' default. A 4MB download can still decompress to something
// enormous, and this endpoint takes its input from a community-edited README.
const MAX_INPUT_PIXELS = 40_000_000;

const variants = new Map();
let variantBytes = 0;

let sharpModule;
async function loadSharp() {
  if (sharpModule === undefined) {
    try {
      sharpModule = (await import('sharp')).default;
    } catch {
      sharpModule = null;
    }
  }
  return sharpModule;
}

const LOCAL_TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif', gif: 'image/gif' };

/**
 * Read one of the bundled screenshots so it can be resized like a fetched one.
 *
 * Only ever called with a path out of previews.manifest.json, but validated
 * anyway. Returns null when the file is not on disk — `public/` is not
 * guaranteed to be inside a serverless bundle, and the caller then falls back
 * to redirecting at the CDN copy.
 */
export async function readLocalPreview(location) {
  const match = /^\/previews\/([a-z0-9][a-z0-9._-]{0,80})\.(jpe?g|png|webp|avif|gif)$/i.exec(location || '');
  if (!match || match[1].includes('..')) return null;
  try {
    const body = await readFile(join(process.cwd(), 'public', 'previews', `${match[1]}.${match[2]}`));
    return { body, contentType: LOCAL_TYPES[match[2].toLowerCase()] };
  } catch {
    return null;
  }
}

function remember(key, value) {
  variants.set(key, value);
  variantBytes += value.body.length;
  while (variants.size > MAX_VARIANTS || variantBytes > MAX_VARIANT_BYTES) {
    const oldest = variants.keys().next().value;
    if (oldest === undefined) break;
    variantBytes -= variants.get(oldest).body.length;
    variants.delete(oldest);
  }
}

/**
 * A cover at one of the widths it is actually drawn at, WebP where the client
 * says it can read it. Null means "serve what you already have".
 */
export async function renderVariant({ key, body, contentType, width, accept }) {
  // Resizing a GIF through libvips drops the animation unless the whole file is
  // decoded as frames; not worth it for the handful that are animated.
  if (contentType === 'image/gif') return null;

  const format = /(^|,)\s*image\/webp\b/.test(accept || '') ? 'image/webp' : contentType;
  const cacheKey = `${key}|${width}|${format}`;
  const hit = variants.get(cacheKey);
  if (hit) {
    variants.delete(cacheKey);
    variants.set(cacheKey, hit);
    return hit;
  }

  const sharp = await loadSharp();
  if (!sharp) return null;

  try {
    const pipeline = sharp(body, {
      limitInputPixels: MAX_INPUT_PIXELS,
      sequentialRead: true,
      // WebP is the one input here that may carry frames worth keeping.
      animated: contentType === 'image/webp',
    }).resize({ width, withoutEnlargement: true });

    const encoded =
      format === 'image/webp' ? pipeline.webp({ quality: 74 })
      : format === 'image/png' ? pipeline.png({ compressionLevel: 9, palette: true })
      : format === 'image/avif' ? pipeline.avif({ quality: 55 })
      : pipeline.jpeg({ quality: 78, mozjpeg: true });

    const buffer = await encoded.toBuffer();
    // A source already narrower than the request is not enlarged, so re-encoding
    // it can cost more than it saves. Hand back the original in that case.
    if (buffer.length >= body.length) return null;

    const value = { body: buffer, contentType: format, width };
    remember(cacheKey, value);
    return value;
  } catch {
    return null;
  }
}
