import { loadCatalogFor } from '@/lib/catalog-service';
import { DEFAULT_LOCALE } from '@/lib/i18n';
import { SITE_URL } from '@/lib/links';

export const runtime = 'nodejs';
export const revalidate = 3600;

const DOMAIN = new URL(SITE_URL).hostname;

/**
 * Agentic Resource Discovery manifest.
 *
 * Lists what actually exists: a read-only catalogue API, its OpenAPI
 * description, and the plain-text brief. No MCP server, no agent endpoint and
 * no authenticated resource is advertised, because none exists — an agent that
 * believed otherwise would just fail against a 404.
 */
export async function GET() {
  let workCount: number | null = null;
  try {
    workCount = (await loadCatalogFor(DEFAULT_LOCALE)).works.length;
  } catch {
    workCount = null;
  }

  const manifest = {
    specVersion: '0.1',
    host: {
      name: 'Astra Games',
      domain: DOMAIN,
      url: SITE_URL,
      description:
        'A community-maintained catalogue of games, interactive experiments and art sandboxes ' +
        'made with GPT-6 Astra. Not affiliated with OpenAI; listing is not a benchmark or an ' +
        'endorsement, and model attribution comes from what creators state publicly.',
    },
    entries: [
      {
        id: `urn:air:${DOMAIN}:api:catalog`,
        displayName: 'Catalogue API',
        description:
          'Every listed work in one of twelve languages, with creator, platform notes, where to ' +
          'play it, and what the creator says the model contributed.' +
          (workCount === null ? '' : ` Currently ${workCount} works.`),
        type: 'application/json',
        url: `${SITE_URL}/api/catalog`,
        representativeQueries: [
          'What games have been built with GPT-6 Astra?',
          'Which of these works can I play in a browser right now?',
          'Who made the games in the awesome-gpt-6-astra list?',
          'What did GPT-6 Astra actually contribute to these projects?',
        ],
      },
      {
        id: `urn:air:${DOMAIN}:api:openapi`,
        displayName: 'Catalogue API description',
        description: 'OpenAPI 3.1 description of the catalogue and cover-image endpoints.',
        type: 'application/vnd.oai.openapi+json',
        url: `${SITE_URL}/openapi.json`,
        representativeQueries: [
          'How do I call the Astra Games catalogue API?',
          'What parameters does the catalogue endpoint take?',
        ],
      },
      {
        id: `urn:air:${DOMAIN}:doc:brief`,
        displayName: 'Plain-text brief',
        description:
          'The catalogue as plain text, with the caveats a summariser most often gets wrong: ' +
          'listing is not endorsement, the project is unaffiliated with OpenAI, and unverified ' +
          'model attribution is marked as such.',
        type: 'text/markdown',
        url: `${SITE_URL}/llms.txt`,
        representativeQueries: [
          'Summarise the Astra Games catalogue.',
          'Is being listed on Astra Games an endorsement?',
        ],
      },
    ],
  };

  return Response.json(manifest, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
