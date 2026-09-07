import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n';
import { loadCatalogFor } from '@/lib/catalog-service';
import { createPreviewResponder } from '@/lib/previews';

// Resolving a cover means DNS lookups and raw https requests — Node runtime only.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const respond = createPreviewResponder({
  loadCatalogFor: (locale) => loadCatalogFor(locale as never),
  isLocale,
  defaultLocale: DEFAULT_LOCALE,
});

export async function GET(request: Request) {
  return respond(request);
}

export async function HEAD(request: Request) {
  return respond(request);
}
