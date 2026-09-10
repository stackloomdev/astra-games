import type { NextConfig } from 'next';

import { IMAGE_OPTIMIZATION_ENABLED } from './lib/image-optimization';

/**
 * RFC 8288 discovery links, advertised on the pages an agent would land on.
 *
 * Only relations that resolve to something real: the API catalog, its OpenAPI
 * description, the plain-text brief, and the licence. Every one of these is an
 * IANA-registered relation type.
 *
 * Note that Next also emits a `Link` header for font and stylesheet preloads.
 * Multiple Link headers are valid per RFC 8288, but this must be verified after
 * any change — losing the preload header would delay font loading on every page.
 */
const DISCOVERY_LINK = [
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  '</openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json"',
  '</llms.txt>; rel="describedby"; type="text/markdown"',
  '<https://creativecommons.org/publicdomain/zero/1.0/>; rel="license"',
].join(', ');

const nextConfig: NextConfig = {
  async headers() {
    // Scoped to the rendered pages: static assets gain nothing from carrying
    // discovery links on every request.
    return ['/', '/:locale', '/:locale/works/:slug'].map((source) => ({
      source,
      headers: [{ key: 'Link', value: DISCOVERY_LINK }],
    }));
  },

  images: {
    // See lib/image-optimization.ts for why this defaults to off.
    unoptimized: !IMAGE_OPTIMIZATION_ENABLED,
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
