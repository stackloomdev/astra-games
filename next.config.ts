import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { NextConfig } from 'next';

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

/**
 * What scripts/build-covers.mjs wrote for this build: the widths it encodes and
 * the key of every cover it produced. Absent in a `next dev` that has not run
 * `npm run covers`, which only means every cover takes the /api/preview
 * pass-through at full size.
 */
function readCoverManifest(): { widths: number[]; keys: string[] } {
  try {
    const manifest = JSON.parse(readFileSync(join(process.cwd(), 'public/covers/manifest.json'), 'utf8'));
    if (!Array.isArray(manifest.widths) || typeof manifest.covers !== 'object') throw new Error('malformed');
    return { widths: manifest.widths, keys: Object.keys(manifest.covers) };
  } catch {
    return { widths: [], keys: [] };
  }
}

const covers = readCoverManifest();

const nextConfig: NextConfig = {
  // Inlined into server and client bundles alike, so the rendered HTML, the
  // hydrated cards and the WebGL deck all agree on which covers are static files.
  env: {
    ASTRA_COVER_KEYS: covers.keys.join(','),
    ASTRA_COVER_WIDTHS: covers.widths.join(','),
  },

  async headers() {
    // Scoped to the rendered pages: static assets gain nothing from carrying
    // discovery links on every request.
    return ['/', '/:locale', '/:locale/works/:slug'].map((source) => ({
      source,
      headers: [{ key: 'Link', value: DISCOVERY_LINK }],
    }));
  },

  images: {
    // Nothing goes through Next's own optimiser: on Vercel its transformations
    // are quota-limited, and resizing inside a function instead ran out the
    // Active CPU allowance. Built covers are already the right size and the
    // loader only picks one of their widths; a cover without a built file is
    // rendered `unoptimized` and skips the loader.
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
    // A srcset may only name widths that exist on disk.
    ...(covers.widths.length ? { deviceSizes: covers.widths, imageSizes: [] } : {}),
  },
};

export default nextConfig;
