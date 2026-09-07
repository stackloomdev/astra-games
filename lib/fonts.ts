import { Figtree } from 'next/font/google';

/**
 * Figtree stands in for Airbnb Cereal VF, which is a commissioned typeface and
 * is not licensed for third-party use. Figtree matches Cereal's geometric
 * skeleton and rounded terminals, and covers the 500–700 range the design
 * system depends on.
 *
 * It is the only web font the site ships. The non-Latin scripts — CJK, Arabic,
 * Devanagari, Cyrillic — are served by per-script system stacks declared in
 * `globals.css` instead. A CJK web font is a multi-megabyte download and emits
 * roughly a thousand `@font-face` rules per page for its unicode-range subsets;
 * every target platform already ships a good face for each of these scripts.
 */
export const figtree = Figtree({
  variable: '--font-figtree',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});
