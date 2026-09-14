import type { Work } from './catalog';
import { coverKey, coverPath, previewPath } from './preview-version';

/**
 * Readable, stable detail-page slug: the work's name plus the first eight hex
 * characters of its content-addressed id. The hash suffix is what lookup keys
 * off, so a renamed work keeps resolving from an old link — and because names
 * are translated, each language gets its own readable slug for the same entry.
 */
export function workSlug(work: Work): string {
  const hash = work.id.replace(/^work-/, '').slice(0, 8);
  const base = work.name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return base ? `${base}-${hash}` : hash;
}

/** Resolve a slug back to a work, tolerating a changed name. */
export function findWorkBySlug(works: Work[], slug: string): Work | undefined {
  const exact = works.find((work) => workSlug(work) === slug);
  if (exact) return exact;
  const hash = slug.split('-').pop() ?? '';
  if (!/^[a-f0-9]{8}$/.test(hash)) return undefined;
  return works.find((work) => work.id.replace(/^work-/, '').startsWith(hash));
}

export function workHref(locale: string, work: Work): string {
  return `/${locale}/works/${workSlug(work)}`;
}

// Filled in by next.config.ts from the manifest scripts/build-covers.mjs wrote,
// and inlined into server and client bundles alike.
const BUILT_COVERS = new Set((process.env.ASTRA_COVER_KEYS ?? '').split(',').filter(Boolean));
const COVER_WIDTHS = (process.env.ASTRA_COVER_WIDTHS ?? '')
  .split(',')
  .map(Number)
  .filter((width) => width > 0)
  .sort((a, b) => a - b);

/**
 * The static WebP the build step made for this work's cover, at the smallest
 * built width of at least `minWidth` (or the widest there is). Null when there
 * is no such file — a work added upstream since the last deployment, or a cover
 * that would not resolve when the site was built.
 */
export function builtCover(work: Work, minWidth = 0): string | null {
  const key = coverKey(work);
  if (!BUILT_COVERS.has(key) || !COVER_WIDTHS.length) return null;
  const width = COVER_WIDTHS.find((candidate) => candidate >= minWidth) ?? COVER_WIDTHS[COVER_WIDTHS.length - 1];
  return coverPath(key, width);
}

/**
 * A cover for somewhere with no image loader, such as a WebGL texture: the
 * built file when there is one, otherwise /api/preview, which passes the
 * original through at full size.
 */
export function coverUrl(work: Work, locale: string, minWidth: number): string {
  return builtCover(work, minWidth) ?? previewPath(work, locale);
}
