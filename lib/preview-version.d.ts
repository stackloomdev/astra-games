import type { Work } from './catalog';

export function previewVersion(work: Work): string;
/** `/api/preview?id=…&v=…&l=…` — version pins the cache, locale selects the catalogue. */
export function previewPath(work: Work, locale: string): string;
