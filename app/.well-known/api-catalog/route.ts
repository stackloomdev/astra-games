import { SITE_URL, UPSTREAM_REPO } from '@/lib/links';

export const runtime = 'nodejs';
export const revalidate = 3600;

/**
 * RFC 9727 API catalog — a linkset pointing at this site's one public API.
 *
 * Only the catalogue API is listed, because it is the only thing here an agent
 * can call. There is no `status` link: the service has no health endpoint, and
 * inventing one would send agents at a URL that does not exist.
 */
export function GET() {
  const linkset = {
    linkset: [
      {
        anchor: `${SITE_URL}/api/catalog`,
        'service-desc': [
          {
            href: `${SITE_URL}/openapi.json`,
            type: 'application/vnd.oai.openapi+json;version=3.1',
            title: 'OpenAPI description',
          },
        ],
        'service-doc': [
          { href: `${SITE_URL}/llms.txt`, type: 'text/markdown', title: 'Catalogue brief' },
          { href: UPSTREAM_REPO, type: 'text/html', title: 'Upstream project' },
        ],
        license: [{ href: 'https://creativecommons.org/publicdomain/zero/1.0/', title: 'CC0 1.0' }],
      },
    ],
  };

  return Response.json(linkset, {
    headers: {
      'Content-Type': 'application/linkset+json',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
