import type { ImageLoaderProps } from 'next/image';

/**
 * Points `next/image` at /api/preview instead of /_next/image.
 *
 * The built-in optimiser is the obvious way to do this, but on Vercel it bills
 * against a transformation quota and starts answering 402 once that is spent,
 * which is how every cover on this site went blank. /api/preview already holds
 * the bytes and resizes them itself, so the srcset can just name a width and
 * pay ordinary function time for it.
 */
export default function previewLoader({ src, width }: ImageLoaderProps): string {
  // Covers are the only images here today, but a static asset added later must
  // not be rewritten into a route that cannot serve it.
  if (!src.startsWith('/api/preview?')) return src;
  return `${src}&w=${width}`;
}
