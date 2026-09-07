import { createCatalogService, type Catalog } from './catalog';
import { readmeFor, type Locale } from './i18n';

/**
 * One catalogue service per language, created on first use and kept for the
 * lifetime of the server process. Each holds its own five-minute cache, ETag
 * and last-good result, so a language whose README is briefly unreachable never
 * degrades the others.
 */
const services = new Map<Locale, ReturnType<typeof createCatalogService>>();

export function catalogServiceFor(locale: Locale) {
  const existing = services.get(locale);
  if (existing) return existing;
  const service = createCatalogService({ readmePath: readmeFor(locale) });
  services.set(locale, service);
  return service;
}

export function loadCatalogFor(locale: Locale): Promise<Catalog> {
  return catalogServiceFor(locale).loadCatalog();
}
