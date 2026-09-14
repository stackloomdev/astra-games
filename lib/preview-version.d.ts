import type { Work } from './catalog';

export function previewVersion(work: Work): string;
/** `/api/preview?id=…&v=…&l=…` — version pins the cache, locale selects the catalogue. */
export function previewPath(work: Work, locale: string): string;
type CoverLinks = Pick<Work, 'imageUrl' | 'demoUrl' | 'sourceUrl' | 'repoUrl'>;

/** The bundled screenshot captured for this work's demo or source link, if any. */
export function screenshotFor(work: CoverLinks): { file: string; urls: string[]; capturedAt: string; kind: string } | null;
export function githubRepositoryUrl(work: CoverLinks): string | null;
/** Cover identity: the same for a work in every language. */
export function coverKey(work: CoverLinks): string;
/** `/covers/<key>-<width>.webp`, as written by scripts/build-covers.mjs. */
export function coverPath(key: string, width: number): string;
