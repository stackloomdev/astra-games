/**
 * Whether covers go through Next's image optimizer.
 *
 * One source of truth, read by both `next.config.ts` and the client helper that
 * builds texture URLs. They must agree: with the optimizer off Next does not
 * mount `/_next/image` at all, so a hand-built URL pointing at it 404s — which
 * is exactly how the hero carousel lost its textures while the `next/image`
 * cards kept working, since the component falls back on its own.
 *
 * Off by default because Vercel's image transformations are quota-limited and
 * start returning 402 once the allowance is spent, hiding perfectly good
 * covers. Set NEXT_PUBLIC_IMAGE_OPTIMIZATION=on to turn it back on.
 */
export const IMAGE_OPTIMIZATION_ENABLED = process.env.NEXT_PUBLIC_IMAGE_OPTIMIZATION === 'on';
