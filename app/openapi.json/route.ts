import { REFRESH_SECONDS, REPOSITORY } from '@/lib/catalog';
import { LOCALE_CODES } from '@/lib/i18n';
import { DEVICE_SIZES, IMAGE_SIZES } from '@/lib/preview-sizes';
import { SITE_URL, UPSTREAM_REPO } from '@/lib/links';

export const runtime = 'nodejs';
export const revalidate = 3600;

/**
 * OpenAPI description of the two public endpoints, referenced as `service-desc`
 * from `/.well-known/api-catalog`.
 *
 * Generated rather than checked in as a static file so the locale list and the
 * cache window cannot drift from the code that implements them.
 */
export function GET() {
  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'Astra Games catalogue API',
      version: '1.0.0',
      summary: 'Read-only access to the awesome-gpt-6-astra catalogue.',
      description:
        'Two public, unauthenticated, read-only endpoints. The catalogue is parsed from the ' +
        `upstream ${REPOSITORY} README at request time and cached for ${REFRESH_SECONDS} seconds; ` +
        'this service stores no copy of the list and offers no write operations.',
      license: { name: 'CC0-1.0', identifier: 'CC0-1.0' },
      contact: { url: UPSTREAM_REPO },
    },
    servers: [{ url: SITE_URL }],
    paths: {
      '/api/catalog': {
        get: {
          operationId: 'getCatalog',
          summary: 'The catalogue in one language.',
          description:
            'Returns every listed work plus provenance describing when the upstream list was ' +
            'last read successfully and whether the data being served is stale.',
          parameters: [
            {
              name: 'locale',
              in: 'query',
              required: false,
              description: 'Language of the upstream list to read. Unknown values fall back to the default.',
              schema: { type: 'string', enum: [...LOCALE_CODES] },
            },
          ],
          responses: {
            '200': {
              description: 'The catalogue.',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Catalog' } } },
            },
          },
        },
      },
      '/api/preview': {
        get: {
          operationId: 'getPreview',
          summary: 'Cover image for one work.',
          description:
            "Resolves a cover in order: artwork supplied upstream, a verified screenshot, the demo " +
            "page's Open Graph image, then the source repository's card. Responds 404 when none resolves.",
          parameters: [
            {
              name: 'id',
              in: 'query',
              required: true,
              description: 'Work id, as returned by getCatalog. Ids are derived from the translated title, so they differ per language.',
              schema: { type: 'string' },
            },
            {
              name: 'l',
              in: 'query',
              required: false,
              description: 'Language whose catalogue the id belongs to.',
              schema: { type: 'string', enum: [...LOCALE_CODES] },
            },
            {
              name: 'v',
              in: 'query',
              required: false,
              description: 'Cache version. When present it must match the current entry, otherwise the response is 404.',
              schema: { type: 'string', pattern: '^[a-f0-9]{16}$' },
            },
            {
              name: 'w',
              in: 'query',
              required: false,
              description: 'Deliver the cover downscaled to this width in pixels, WebP when the Accept header allows it. Only the listed widths are served; anything else is a 400.',
              schema: { type: 'integer', enum: [...IMAGE_SIZES, ...DEVICE_SIZES] },
            },
          ],
          responses: {
            '200': {
              description: 'The cover image.',
              content: {
                'image/jpeg': { schema: { type: 'string', format: 'binary' } },
                'image/png': { schema: { type: 'string', format: 'binary' } },
                'image/webp': { schema: { type: 'string', format: 'binary' } },
              },
            },
            '400': { description: 'Malformed query.' },
            '404': { description: 'No such work, stale version, or no cover could be resolved.' },
          },
        },
      },
    },
    components: {
      schemas: {
        Catalog: {
          type: 'object',
          required: ['works', 'source', 'refreshAfterSeconds'],
          properties: {
            works: { type: 'array', items: { $ref: '#/components/schemas/Work' } },
            source: { $ref: '#/components/schemas/Source' },
            refreshAfterSeconds: { type: 'integer' },
          },
        },
        Work: {
          type: 'object',
          required: ['id', 'name', 'category'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            category: {
              type: 'string',
              enum: ['game', 'website', 'app', 'tool', 'experiment', 'other'],
            },
            sourceCategory: { type: 'string', description: 'The upstream section heading, untranslated by us.' },
            author: {
              type: 'object',
              properties: { name: { type: 'string' }, url: { type: ['string', 'null'] } },
            },
            demoUrl: { type: ['string', 'null'], description: 'Where the work can be tried, when one is listed.' },
            sourceUrl: { type: ['string', 'null'] },
            repoUrl: { type: ['string', 'null'] },
            imageUrl: { type: ['string', 'null'] },
            details: {
              type: 'array',
              description:
                "The entry's nested bullets: platform requirements, what the model contributed, build " +
                'resources. Recorded from what creators state publicly and not independently verified.',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  text: { type: 'string' },
                  links: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: { text: { type: 'string' }, url: { type: 'string' } },
                    },
                  },
                },
              },
            },
            sourceOrder: { type: 'integer' },
          },
        },
        Source: {
          type: 'object',
          properties: {
            repository: { type: 'string' },
            url: { type: 'string', description: 'The upstream README this language was read from.' },
            readmePath: { type: 'string' },
            checkedAt: { type: 'string', format: 'date-time' },
            lastSuccessfulAt: { type: ['string', 'null'], format: 'date-time' },
            revision: { type: 'string' },
            stale: { type: 'boolean' },
            status: { type: 'string', enum: ['fresh', 'stale', 'fallback', 'unavailable'] },
            error: { type: 'string' },
          },
        },
      },
    },
  };

  return Response.json(spec, {
    headers: {
      'Content-Type': 'application/vnd.oai.openapi+json;version=3.1',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
