import Link from 'next/link';
import { DEFAULT_LOCALE, getDictionary } from '@/lib/i18n';

/**
 * Rendered inside the locale layout, but Next does not hand a not-found page the
 * route params — so it speaks the site's primary language rather than guessing.
 */
export default async function NotFound() {
  const dict = await getDictionary(DEFAULT_LOCALE);

  return (
    <main className="shell grid min-h-svh place-items-center py-24 text-center">
      <div>
        <p className="t-micro text-[var(--palette-rausch)]">404</p>
        <h1 className="t-section phrase mx-auto mt-4 max-w-[20ch]">{dict.detail.notFound}</h1>
        <p className="t-body mx-auto mt-4 max-w-[44ch] text-[var(--palette-text-secondary)]">
          {dict.detail.notFoundBody}
        </p>
        <Link
          href={`/${DEFAULT_LOCALE}`}
          className="mt-8 inline-flex items-center rounded-[var(--radius-standard)] bg-[var(--palette-rausch)] px-6 py-[14px] t-ui text-white transition-colors duration-200 hover:bg-[var(--palette-rausch-deep)]"
        >
          {dict.detail.back}
        </Link>
      </div>
    </main>
  );
}
