import type { NextConfig } from 'next';

import { DEVICE_SIZES, IMAGE_SIZES } from './lib/preview-sizes';

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
    // Covers are resized by /api/preview itself, not by Next's optimiser: on
    // Vercel that optimiser bills against an image-transformation quota and
    // answers 402 once it runs out, which took every cover on the site down.
    // See lib/image-loader.ts and lib/preview-resize.js.
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
    // These are the widths the loader may name, and the route accepts no other.
    imageSizes: IMAGE_SIZES,
    deviceSizes: DEVICE_SIZES,
  },

  // The bundled screenshots live in public/, which is served from the CDN and is
  // not otherwise part of a serverless bundle — /api/preview needs to read them
  // to resize them. Without this it still works, by redirecting at the full-size
  // CDN copy instead.
  outputFileTracingIncludes: {
    '/api/preview': ['./public/previews/**'],
  },
};

export default nextConfig;
