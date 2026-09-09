import 'server-only';

import type { Work } from './catalog';
import { loadCatalogFor } from './catalog-service';
import { DEFAULT_LOCALE, LOCALES, type Locale } from './i18n';
import { workSlug } from './work-url';

/**
 * The same work appears in every language, but under a translated title — which
 * means a different id and a different slug each time. Without an explicit
 * mapping the twelve detail pages for one game look to a crawler like twelve
 * unrelated pages competing with each other.
 *
 * Deliberately kept out of `work-url.ts`: that module is imported by client
 * components, and this one reaches into the catalogue service.
 */

/** The link a work points at is the same in every translation, so it joins them. */
function joinKey(work: Work): string | null {
  const url = work.demoUrl ?? work.sourceUrl ?? work.repoUrl;
  if (!url) return null;
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    return `${parsed.host.toLowerCase()}${parsed.pathname.replace(/\/+$/, '')}${parsed.search}`;
  } catch {
    return url;
  }
}

/**
 * `alternates.languages` for one work's detail page. A language whose catalogue
 * is unreachable, or which has not translated this entry yet, simply
 * contributes nothing rather than failing the page.
 */
export async function workLanguageAlternates(
  work: Work,
): Promise<Record<string, string> | undefined> {
  const key = joinKey(work);
  if (!key) return undefined;

  const found = await Promise.all(
    LOCALES.map(async (entry) => {
      try {
        const catalog = await loadCatalogFor(entry.code as Locale);
        const match = catalog.works.find((candidate) => joinKey(candidate) === key);
        return match ? ([entry, match] as const) : null;
      } catch {
        return null;
      }
    }),
  );

  const languages: Record<string, string> = {};
  for (const hit of found) {
    if (!hit) continue;
    const [entry, match] = hit;
    languages[entry.htmlLang] = `/${entry.code}/works/${workSlug(match)}`;
  }
  if (!Object.keys(languages).length) return undefined;

  const fallback = found.find((hit) => hit && hit[0].code === DEFAULT_LOCALE);
  if (fallback) languages['x-default'] = `/${DEFAULT_LOCALE}/works/${workSlug(fallback[1])}`;

  return languages;
}
