import type { Catalog, Work, WorkCategory } from './catalog';
import { LOCALES, localeEntry, type Locale } from './i18n';
import type { Dictionary } from './dictionaries/types';
import { SITE_URL, UPSTREAM_REPO } from './links';
import { workSlug } from './work-url';

/**
 * Schema.org graphs for search engines and answer engines.
 *
 * Every value here comes from the parsed upstream entry. Nothing is asserted
 * that the catalogue does not actually record — no `offers`, no
 * `aggregateRating`, no `isAccessibleForFree`. Those would be invented facts,
 * and an answer engine repeating them would be repeating our invention.
 */

const PUBLISHER_ID = `${SITE_URL}/#publisher`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/** schema.org type that best fits each catalogue category. */
const SCHEMA_TYPE: Record<WorkCategory, string> = {
  game: 'VideoGame',
  app: 'SoftwareApplication',
  tool: 'SoftwareApplication',
  website: 'WebSite',
  experiment: 'CreativeWork',
  other: 'CreativeWork',
};

function absolute(path: string): string {
  return path.startsWith('http') ? path : `${SITE_URL}${path}`;
}

function publisher() {
  return {
    '@type': 'Organization',
    '@id': PUBLISHER_ID,
    name: 'Astra Games',
    url: SITE_URL,
    // The list is community-maintained and unaffiliated with OpenAI; sameAs
    // points only at the project itself.
    sameAs: [UPSTREAM_REPO],
  };
}

function website(locale: Locale, dict: Dictionary) {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: 'Astra Games',
    description: dict.meta.description,
    inLanguage: LOCALES.map((entry) => entry.htmlLang),
    publisher: { '@id': PUBLISHER_ID },
  };
}

function workNode(work: Work, locale: Locale, previewUrl: string) {
  const sameAs = [work.demoUrl, work.repoUrl, work.sourceUrl].filter(
    (url, index, all): url is string => Boolean(url) && all.indexOf(url) === index,
  );

  return {
    '@type': SCHEMA_TYPE[work.category],
    '@id': `${SITE_URL}/${locale}/works/${workSlug(work)}#work`,
    name: work.name,
    ...(work.description ? { description: work.description } : {}),
    url: `${SITE_URL}/${locale}/works/${workSlug(work)}`,
    image: absolute(previewUrl),
    genre: work.sourceCategory,
    inLanguage: localeEntry(locale).htmlLang,
    ...(work.author.name
      ? {
          author: {
            '@type': 'Person',
            name: work.author.name,
            ...(work.author.url ? { url: work.author.url } : {}),
          },
        }
      : {}),
    // Browser-playable is the one platform fact the catalogue guarantees for
    // anything with a demo link.
    ...(work.demoUrl
      ? { gamePlatform: 'Web browser', operatingSystem: 'Web browser', installUrl: work.demoUrl }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
    isPartOf: { '@id': WEBSITE_ID },
  };
}

/** Home page: the site, its publisher, and the catalogue as an ordered list. */
export function homeGraph({
  locale,
  dict,
  catalog,
  previewUrlFor,
}: {
  locale: Locale;
  dict: Dictionary;
  catalog: Catalog;
  previewUrlFor: (work: Work) => string;
}) {
  const url = `${SITE_URL}/${locale}`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      website(locale, dict),
      publisher(),
      {
        '@type': 'CollectionPage',
        '@id': `${url}#page`,
        url,
        name: dict.meta.title,
        description: dict.meta.description,
        inLanguage: localeEntry(locale).htmlLang,
        isPartOf: { '@id': WEBSITE_ID },
        about: { '@type': 'Thing', name: 'GPT-6 Astra' },
        mainEntity: { '@id': `${url}#catalogue` },
      },
      {
        '@type': 'ItemList',
        '@id': `${url}#catalogue`,
        name: dict.works.eyebrow,
        numberOfItems: catalog.works.length,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        itemListElement: catalog.works.map((work, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: workNode(work, locale, previewUrlFor(work)),
        })),
      },
    ],
  };
}

/** Detail page: the work itself, plus the trail back to the catalogue. */
export function workGraph({
  work,
  locale,
  dict,
  previewUrl,
}: {
  work: Work;
  locale: Locale;
  dict: Dictionary;
  previewUrl: string;
}) {
  const url = `${SITE_URL}/${locale}/works/${workSlug(work)}`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      website(locale, dict),
      publisher(),
      workNode(work, locale, previewUrl),
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Astra Games', item: `${SITE_URL}/${locale}` },
          { '@type': 'ListItem', position: 2, name: dict.works.eyebrow, item: `${SITE_URL}/${locale}#works` },
          { '@type': 'ListItem', position: 3, name: work.name, item: url },
        ],
      },
    ],
  };
}
