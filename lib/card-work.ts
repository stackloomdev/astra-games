import type { Work } from './catalog';

/**
 * A work as the cards show it: everything but the nested detail bullets, which
 * only the detail page renders.
 *
 * Whatever a server component hands to a client component is serialised into
 * the page payload, and an ISR page stores that payload in its HTML and again
 * in each of its RSC files. The bullets are over half of each work's size
 * there, so the catalogue grid, the hero deck and the related works take this
 * instead of the full entry.
 */
export type CardWork = Omit<Work, 'details'>;

export function toCardWork(work: Work): CardWork {
  const { details: _details, ...card } = work;
  return card;
}
