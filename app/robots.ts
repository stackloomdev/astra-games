import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/links';

/**
 * The catalogue is public and meant to be discovered, including by answer
 * engines — the whole point of the list is that people find these works. Major
 * AI crawlers are therefore named and allowed explicitly rather than left to
 * infer permission from the wildcard rule.
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

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: ['/', '/api/preview'], disallow: '/api/' },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: ['/', '/api/preview'],
        disallow: '/api/',
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
