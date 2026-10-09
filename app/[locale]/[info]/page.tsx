import { notFound } from 'next/navigation';
import { ArticleBody, ContentShell } from '@/components/Editorial';
import { CONTENT_LOCALES, isContentLocale } from '@/lib/editorial';
import { editorialMetadata } from '@/lib/editorial-metadata';
import { INFORMATION, INFORMATION_PAGES, INFORMATION_UPDATED, isInformationPage, WEBSITE_ISSUES, WEBSITE_REPO } from '@/lib/site-information';
import { BROKEN_LINK_ISSUE, UPSTREAM_REPO } from '@/lib/links';

type Props = { params: Promise<{ locale: string; info: string }> };
export function generateStaticParams() {
  return CONTENT_LOCALES.flatMap((locale) => INFORMATION_PAGES.map((info) => ({ locale, info })));
}
export async function generateMetadata({ params }: Props) {
  const { locale, info } = await params;
  if (!isContentLocale(locale) || !isInformationPage(info)) return {};
  const copy = INFORMATION[info][locale];
  return editorialMetadata(locale, `/${info}`, copy.title, copy.description);
}
export default async function InformationPage({ params }: Props) {
  const { locale, info } = await params;
  if (!isContentLocale(locale) || !isInformationPage(info)) notFound();
  const copy = INFORMATION[info][locale];
  const zh = locale === 'zh-CN';
  const links = info === 'privacy' ? [
    ['Vercel Web Analytics · Privacy', 'https://vercel.com/docs/analytics/privacy-policy'],
    ['Vercel Speed Insights · Privacy', 'https://vercel.com/docs/speed-insights/privacy-policy'],
    ['Adsterra · Privacy policy', 'https://adsterra.com/privacy-policy-managed/'],
    ['Adsterra · Cookie policy', 'https://adsterra.com/cookies/'],
    ['Vercel · Privacy policy', 'https://vercel.com/legal/privacy-policy'],
    [zh ? '联系与隐私反馈' : 'Contact & privacy questions', `/${locale}/contact`],
  ] : [
    [zh ? '官网问题与内容纠错（GitHub）' : 'Website issues & editorial corrections (GitHub)', WEBSITE_ISSUES],
    [zh ? '目录失效链接反馈（上游）' : 'Report a broken catalogue link (upstream)', BROKEN_LINK_ISSUE],
    [zh ? '官网源码与维护记录' : 'Website source & maintenance history', WEBSITE_REPO],
    [zh ? '上游作品目录' : 'Upstream catalogue', UPSTREAM_REPO],
  ];
  return <ContentShell locale={locale} path={`/${info}`}>
    <article className="mx-auto max-w-3xl">
      <p className="t-micro text-[var(--palette-rausch)]">ASTRA GAMES</p>
      <h1 className="t-section mt-4">{copy.title}</h1>
      <p className="mb-10 mt-5 text-sm text-[var(--palette-text-secondary)]">{zh ? '更新日期' : 'Updated'} · <time dateTime={INFORMATION_UPDATED}>{INFORMATION_UPDATED}</time></p>
      <ArticleBody copy={copy} />
      <nav className="mt-10 border-t border-[var(--palette-border)] pt-8" aria-label={zh ? '相关链接' : 'Useful links'}>
        <ul className="space-y-4">{links.map(([label, href]) => <li key={href}><a className="underline underline-offset-4" href={href}>{label} →</a></li>)}</ul>
      </nav>
    </article>
  </ContentShell>;
}
