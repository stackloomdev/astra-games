/**
 * The current sponsor, or null while the slot is open. Swapping sponsors is an
 * edit to this file only; the slot falls back to a contact pitch when empty.
 * The tagline is the sponsor's own copy and is shown as-is in every language.
 */
export interface Sponsor {
  name: string;
  url: string;
  tagline: string;
  /** Path under /public, or an absolute URL. */
  logo?: string;
}

export const SPONSOR: Sponsor | null = null;
