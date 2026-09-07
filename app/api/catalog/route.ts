import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n';
import { catalogServiceFor } from '@/lib/catalog-service';

// The parser needs node:crypto and the remark toolchain — Node runtime, not edge.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * JSON mirror of the catalogue. `?locale=` selects the language; anything
 * unrecognised falls back to the default rather than erroring, so an old link
 * without the parameter keeps working. Caching headers come from the service.
 */
function serve(request: Request) {
  const requested = new URL(request.url).searchParams.get('locale');
  const locale = requested && isLocale(requested) ? requested : DEFAULT_LOCALE;
  return catalogServiceFor(locale).handleCatalog(request);
}

export async function GET(request: Request) {
  return serve(request);
}

export async function HEAD(request: Request) {
  return serve(request);
}
