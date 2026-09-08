import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import '../globals.css';
import { figtree } from '@/lib/fonts';
import { DEFAULT_LOCALE, LOCALES, getDictionary, isLocale, localeEntry, type Locale } from '@/lib/i18n';
import { SITE_URL } from '@/lib/links';

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale: locale.code }));
}

export async function generateMetadata({
  params,
}: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);

  // Every language advertises every other one, plus x-default on the site's
  // primary language, so search engines serve the right page per audience.
  const languages = Object.fromEntries(
    LOCALES.map((entry) => [entry.htmlLang, `/${entry.code}`]),
  );

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: dict.meta.title, template: `%s · Astra Games` },
    description: dict.meta.description,
    alternates: {
      canonical: `/${locale}`,
      languages: { ...languages, 'x-default': `/${DEFAULT_LOCALE}` },
    },
    openGraph: {
      type: 'website',
      url: `${SITE_URL}/${locale}`,
      siteName: 'Astra Games',
      title: dict.meta.title,
      description: dict.meta.description,
      locale: localeEntry(locale).htmlLang.replace('-', '_'),
    },
    twitter: { card: 'summary_large_image', title: dict.meta.title, description: dict.meta.description },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: '#0d0b0f',
  colorScheme: 'dark',
};

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const entry = localeEntry(locale as Locale);

  return (
    <html lang={entry.htmlLang} dir={entry.dir} className={figtree.variable}>
      <body>
        {/*
          Entrance animations start from a hidden state, and the hero headline
          carries that state as an inline style. Without scripting nothing would
          ever release them, so the page would render blank. An `!important`
          author rule outranks a plain inline style, which puts every animated
          element straight into its resting state instead.
        */}
        <noscript>
          <style>{`
            .reveal { opacity: 1 !important; transform: none !important; }
            [data-word] {
              opacity: 1 !important;
              transform: none !important;
              filter: none !important;
            }
          `}</style>
        </noscript>
        {children}
        {/* Cookieless page analytics and real-user Core Web Vitals. Both only
            report from a Vercel deployment; locally they are inert. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
