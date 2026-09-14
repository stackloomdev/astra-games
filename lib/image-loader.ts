import type { ImageLoaderProps } from 'next/image';
import { coverPath } from './preview-version';

/**
 * Picks the width of a built cover. Those are static files at a few fixed
 * widths — /covers/<key>-<width>.webp — and next.config.ts sets `deviceSizes`
 * to exactly those widths, so every width Next asks for names a file that
 * exists.
 *
 * Nothing is resized here, or anywhere at request time. A cover without a
 * built file is rendered `unoptimized`, which bypasses this loader.
 */
export default function coverLoader({ src, width }: ImageLoaderProps): string {
  const built = /^\/covers\/([a-f0-9]{16})-\d+\.webp$/.exec(src);
  return built ? coverPath(built[1], width) : src;
}
