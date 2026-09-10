import { SITE_URL } from '@/lib/links';

export const runtime = 'nodejs';
export const revalidate = 86400;

/**
 * Written by hand rather than through Next's typed robots route, which can only
 * emit rules, sitemap and host — there is no way to add a `Content-Signal`
 * line through it.
 *
 * The catalogue is public and meant to be discovered, including by answer
 * engines. Major AI crawlers are named and allowed explicitly rather than left
 * to infer permission from the wildcard rule.
 *
 * `/api/` stays out of the index — it has no page a search result could point
 * at — except `/api/preview`, which serves the cover images that structured
 * data and Open Graph tags reference. Blocking those would leave every rich
 * result and share card without its picture.
 */
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'meta-externalagent',
  'Bytespider',
];

/**
 * How this site's own content may be used. All three are `yes`: the list's text
 * and visuals are CC0, so restricting training would contradict the licence it
 * is published under, and the point of `/llms.txt` is to be read by answer
 * engines. This covers this site only — the works it links to are licensed by
 * their own authors.
 *
 * A content signal applies to the user-agent group it sits in, so it is
 * repeated in every group; a crawler that matches its own name would otherwise
 * never see the one under `*`.
 */
const CONTENT_SIGNAL = 'ai-train=yes, search=yes, ai-input=yes';

function group(userAgent: string): string {
  return [
    `User-agent: ${userAgent}`,
    `Content-Signal: ${CONTENT_SIGNAL}`,
    'Allow: /',
    'Allow: /api/preview',
    'Disallow: /api/',
  ].join('\n');
}

export function GET() {
  const body = [
    '# Content signals declare how this content may be used.',
    '# https://contentsignals.org/',
    '',
    group('*'),
    '',
    ...AI_CRAWLERS.flatMap((agent) => [group(agent), '']),
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    `Host: ${SITE_URL}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
