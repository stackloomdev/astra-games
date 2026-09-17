import { notFound } from 'next/navigation';
import { ArticleBody, ContentShell } from '@/components/Editorial';
import StructuredData from '@/components/StructuredData';
import { CONTENT_LOCALES, findGuide, GUIDES, isContentLocale } from '@/lib/editorial';
import { editorialMetadata } from '@/lib/editorial-metadata';
import { SITE_URL } from '@/lib/links';

type Props = { params: Promise<{ locale: string; slug: string }> };
export function generateStaticParams() {
  return CONTENT_LOCALES.flatMap((locale) => GUIDES.map(({ slug }) => ({ locale, slug })));
}
export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const guide = findGuide(slug);
  if (!isContentLocale(locale) || !guide) return {};
  const copy = guide.copy[locale];
  return editorialMetadata(locale, `/guides/${slug}`, copy.title, copy.description);
}
export default async function GuidePage({ params }: Props) {
  const { locale, slug } = await params;
  const guide = findGuide(slug);
  if (!isContentLocale(locale) || !guide) notFound();
  const copy = guide.copy[locale];
  return <ContentShell locale={locale} path={`/guides/${slug}`}>
    <StructuredData data={{ '@context': 'https://schema.org', '@type': 'Article', headline: copy.title, description: copy.description,
      inLanguage: locale, datePublished: guide.published, dateModified: guide.published,
      author: { '@type': 'Organization', name: 'Astra Games', url: `${SITE_URL}/${locale}/about` },
      mainEntityOfPage: `${SITE_URL}/${locale}/guides/${slug}`, citation: guide.sources.map((source) => source.href) }} />
    <article className="mx-auto max-w-3xl">
      <a className="inline-flex min-h-11 items-center text-sm underline underline-offset-4" href={`/${locale}/guides`}>{locale === 'zh-CN' ? '← 全部指南' : '← All guides'}</a>
      <p className="t-micro mt-5 text-[var(--palette-rausch)]">{guide.kind[locale]}</p>
      <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{copy.title}</h1>
      <p className="mt-5 text-sm text-[var(--palette-text-secondary)]">Astra Games · <time dateTime={guide.published}>{guide.published}</time></p>
      <aside className="my-8 rounded-xl border border-[var(--palette-border-strong)] bg-white/[0.03] p-5 text-sm leading-7 text-[var(--palette-text-secondary)]">{guide.basis[locale]}</aside>
      <nav className="mb-10 border-y border-[var(--palette-border)] py-6" aria-label={locale === 'zh-CN' ? '本文目录' : 'In this guide'}>
        <ol className="list-decimal space-y-2 ps-5">{copy.sections.map((section, index) => <li key={section.heading}><a className="underline underline-offset-4" href={`#section-${index + 1}`}>{section.heading}</a></li>)}</ol>
      </nav>
      <ArticleBody copy={copy} />
      <section className="mt-12 border-t border-[var(--palette-border)] pt-8">
        <h2 className="text-2xl font-semibold">{locale === 'zh-CN' ? '资料来源与体验入口' : 'Sources & live demos'}</h2>
        <ul className="mt-5 space-y-3 break-words">{guide.sources.map((source) => <li key={source.href}><a className="underline underline-offset-4" href={source.href}>{source.label} ↗</a></li>)}
          {guide.works.map((href) => <li key={href}><a className="underline underline-offset-4" href={href}>{new URL(href).hostname} ↗</a></li>)}
        </ul>
        <p className="mt-6 text-sm leading-7 text-[var(--palette-text-secondary)]">{locale === 'zh-CN' ? '外部作品可能随时更新。发现与当前版本不符的说明，请附页面和证据反馈。' : 'External works may change. If a guide no longer matches the current version, send the page and supporting evidence.'} <a href={`/${locale}/contact`} className="underline underline-offset-4">{locale === 'zh-CN' ? '联系与纠错' : 'Contact & corrections'}</a></p>
      </section>
    </article>
  </ContentShell>;
}
