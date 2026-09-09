import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Covers come from /api/preview, which is same-origin but carries the work
    // id, cache version and locale as query params. `search` is omitted so any
    // of them is allowed — pinning it would break the moment a cover changes.
    localPatterns: [{ pathname: '/api/preview' }],
    // Upstream screenshots are full-size; these are the widths the cards and
    // the detail banner actually render at.
    imageSizes: [96, 128, 256, 384, 512],
    // The optimised variants are as immutable as the version in the source URL,
    // so there is no reason to re-encode them every hour.
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
};

export default nextConfig;
