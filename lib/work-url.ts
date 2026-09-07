import type { Work } from './catalog';

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
