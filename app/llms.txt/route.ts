import { loadCatalogFor } from '@/lib/catalog-service';
import { DEFAULT_LOCALE, LOCALES, getDictionary } from '@/lib/i18n';
import { SITE_URL, UPSTREAM_REPO } from '@/lib/links';
import { workSlug } from '@/lib/work-url';

export const runtime = 'nodejs';
export const revalidate = 300;

/**
 * `/llms.txt` — a plain-text brief for answer engines and other agents, in the
 * convention from llmstxt.org.
 *
 * It is generated from the same live catalogue the site renders, so it can
 * never drift into describing works that are no longer listed. It states what
 * the project is, what it is not (unaffiliated, not a benchmark), and how each
 * entry's model attribution should be read — because those are exactly the
 * claims a summariser is likely to get wrong.
 */
export async function GET() {
  const dict = await getDictionary(DEFAULT_LOCALE);
  const catalog = await loadCatalogFor(DEFAULT_LOCALE);

  const lines = [
    '# Astra Games',
    '',
    `> ${dict.meta.description}`,
    '',
    'Astra Games is the website for the community-maintained `awesome-gpt-6-astra`',
    'list. The catalogue below is parsed from that list at request time, so this',
    'file always describes what the site currently shows.',
    '',
    '## How to read this list',
    '',
    '- Being listed means a work is worth exploring. It is not a benchmark result,',
    '  a quality ranking, or an endorsement.',
    '- The project is community-maintained and is **not affiliated with OpenAI**.',
    '- Model involvement is recorded from what each creator states publicly. Where a',
    "  creator's claim has not been independently verified, the entry says so.",
    '  Do not restate unverified attribution as established fact.',
    '- Entries are contributed by many different people; each work is licensed by its',
    '  own author. Only the list text and visuals are CC0.',
    '',
    `## Catalogue (${catalog.works.length} works, checked ${
      catalog.source.lastSuccessfulAt?.slice(0, 10) ?? 'unknown'
    })`,
    '',
  ];

  for (const work of catalog.works) {
    const detail = `${SITE_URL}/${DEFAULT_LOCALE}/works/${workSlug(work)}`;
    lines.push(`### ${work.name}`);
    if (work.description) lines.push(work.description);
    lines.push('');
    if (work.author.name) lines.push(`- Creator: ${work.author.name}${work.author.url ? ` (${work.author.url})` : ''}`);
    lines.push(`- Entry: ${detail}`);
    if (work.demoUrl) lines.push(`- Playable at: ${work.demoUrl}`);
    if (work.repoUrl) lines.push(`- Source: ${work.repoUrl}`);
    // The upstream bullets carry platform requirements and the model-involvement
    // record — the two things a summary most needs and most often invents. The
    // creator bullet is skipped: it is already emitted above, with a URL.
    for (const item of work.details) {
      if (!item.label) continue;
      const repeatsAuthor =
        work.author.name.length > 1 && item.text.startsWith(work.author.name);
      if (repeatsAuthor) continue;
      lines.push(`- ${item.label}: ${item.text}`);
    }
    lines.push('');
  }

  lines.push(
    '## Languages',
    '',
    LOCALES.map((locale) => `- ${locale.label}: ${SITE_URL}/${locale.code}`).join('\n'),
    '',
    '## Source',
    '',
    `- Upstream list: ${UPSTREAM_REPO}`,
    `- This catalogue as JSON: ${SITE_URL}/api/catalog?locale=${DEFAULT_LOCALE}`,
    '',
  );

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
    },
  });
}
