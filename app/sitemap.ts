import type { MetadataRoute } from 'next';
import { loadCatalogFor } from '@/lib/catalog-service';
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n';
import { SITE_URL } from '@/lib/links';
import { workSlug } from '@/lib/work-url';

export const revalidate = 300;

/**
 * Home page plus one detail page per work, in all twelve languages. Each URL
 * declares the others as `alternates.languages`, which is how the localised
 * versions get recognised as the same page rather than duplicates.
 *
 * A language whose README is unreachable contributes no detail pages instead of
 * failing the whole sitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const catalogues = await Promise.all(
    LOCALES.map(async (locale) => {
      try {
        return { locale, works: (await loadCatalogFor(locale.code)).works };
      } catch {
        return { locale, works: [] };
      }
    }),
  );

  const homeAlternates = Object.fromEntries(
    LOCALES.map((locale) => [locale.htmlLang, `${SITE_URL}/${locale.code}`]),
  );

  const home: MetadataRoute.Sitemap = LOCALES.map((locale) => ({
    url: `${SITE_URL}/${locale.code}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: locale.code === DEFAULT_LOCALE ? 1 : 0.9,
    alternates: { languages: homeAlternates },
  }));

  const details: MetadataRoute.Sitemap = catalogues.flatMap(({ locale, works }) =>
    works.map((work) => ({
      url: `${SITE_URL}/${locale.code}/works/${workSlug(work)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  );

  return [...home, ...details];
}
