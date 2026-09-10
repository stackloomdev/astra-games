// The only widths a cover is ever requested at.
//
// `next/image` builds its srcset from these two lists, and /api/preview refuses
// anything outside their union — the route re-encodes on demand, so an open
// width parameter would be a way to make it do unbounded work for a stranger.
//
// Nothing above 1440 is here because that is how wide the source screenshots
// are; asking for more would only upscale.
export const IMAGE_SIZES = [96, 128, 256, 384, 512];
export const DEVICE_SIZES = [640, 750, 828, 1080, 1440];

const allowed = new Set([...IMAGE_SIZES, ...DEVICE_SIZES]);

/** Strict on purpose: the value arrives as a query-string digit run. */
export function parsePreviewWidth(value: string | null): number | null {
  if (typeof value !== 'string' || !/^\d{1,4}$/.test(value)) return null;
  const width = Number(value);
  return allowed.has(width) ? width : null;
}
