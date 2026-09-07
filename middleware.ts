import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_LOCALE, LOCALE_CODES } from './lib/i18n';

/**
 * Every page lives under a locale segment, so the bare root has to pick one.
 * The visitor's `Accept-Language` decides when it names a language the site
 * actually has; otherwise it falls back to the site's primary language.
 */
function negotiate(header: string | null): string {
  if (!header) return DEFAULT_LOCALE;

  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, ...rest] = part.trim().split(';');
      const q = rest.find((token) => token.trim().startsWith('q='));
      return { tag: tag.trim().toLowerCase(), quality: q ? Number(q.split('=')[1]) || 0 : 1 };
    })
    .filter((entry) => entry.tag && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    const exact = LOCALE_CODES.find((code) => code.toLowerCase() === tag);
    if (exact) return exact;
    // "zh", "zh-tw" and "zh-hans" all resolve to the zh-CN list.
    const base = tag.split('-')[0];
    const prefixed = LOCALE_CODES.find((code) => code.toLowerCase().split('-')[0] === base);
    if (prefixed) return prefixed;
  }
  return DEFAULT_LOCALE;
}

export function middleware(request: NextRequest) {
  const target = negotiate(request.headers.get('accept-language'));
  const url = request.nextUrl.clone();
  url.pathname = `/${target}`;
  // 307, not 308: the destination depends on the request's own headers, so it
  // must never be cached as a permanent mapping for every visitor.
  return NextResponse.redirect(url, 307);
}

export const config = {
  matcher: '/',
};
