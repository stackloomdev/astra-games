import type { Metadata } from 'next';
import { CONTENT_LOCALES, type ContentLocale } from './editorial';
import { SITE_URL } from './links';

export function editorialMetadata(locale: ContentLocale, path: string, title: string, description: string): Metadata {
  const url = `${SITE_URL}/${locale}${path}`;
  return {
    title, description,
    alternates: {
      canonical: url,
      languages: { ...Object.fromEntries(CONTENT_LOCALES.map((code) => [code, `${SITE_URL}/${code}${path}`])), 'x-default': `${SITE_URL}/en${path}` },
    },
    openGraph: { type: 'article', title, description, url, locale: locale === 'zh-CN' ? 'zh_CN' : 'en_US', siteName: 'Astra Games' },
    twitter: { card: 'summary', title, description },
  };
}
