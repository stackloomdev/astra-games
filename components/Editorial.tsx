import type { ReactNode } from 'react';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import { getDictionary, LOCALES } from '@/lib/i18n';
import { UPSTREAM_REPO } from '@/lib/links';
import { GUIDES, type ArticleCopy, type ContentLocale, type Guide } from '@/lib/editorial';

export async function ContentShell({ locale, path, children }: { locale: ContentLocale; path: string; children: ReactNode }) {
  const dict = await getDictionary(locale);
  const localeHrefs = Object.fromEntries(LOCALES.map(({ code }) => [code,
    code === 'en' || code === 'zh-CN' ? `/${code}${path}` : `/${code}`,
  ]));
  return <>
    <SiteHeader dict={dict} locale={locale} localeHrefs={localeHrefs} homeHref={`/${locale}`} />
    <main id="main-content" className="shell pb-24 pt-32 sm:pt-40">{children}</main>
    <SiteFooter dict={dict} homeHref={`/${locale}`} readmeUrl={UPSTREAM_REPO} />
  </>;
}

export function ArticleBody({ copy }: { copy: ArticleCopy }) {
  return <div className="editorial-body">
    <p className="text-lg leading-8 text-[var(--palette-text-primary)]">{copy.intro}</p>
    {copy.sections.map((section, index) => <section key={section.heading} id={`section-${index + 1}`} className="mt-10 scroll-mt-24">
      <h2 className="mb-4 text-2xl font-semibold tracking-tight">{section.heading}</h2>
      {section.paragraphs?.map((paragraph) => <p key={paragraph} className="mt-4 text-base leading-8 text-[var(--palette-text-secondary)]">{paragraph}</p>)}
      {section.items && <ul className="list-disc space-y-3 ps-6 text-base leading-8 text-[var(--palette-text-secondary)]">
        {section.items.map((item) => <li key={item}>{item}</li>)}
      </ul>}
    </section>)}
  </div>;
}

export function GuideCards({ locale, guides = GUIDES }: { locale: ContentLocale; guides?: Guide[] }) {
  return <div className="grid gap-5 md:grid-cols-3">
    {guides.map((guide, index) => <a key={guide.slug} href={`/${locale}/guides/${guide.slug}`}
      className="group flex flex-col rounded-[var(--radius-card)] border border-[var(--palette-border)] bg-[var(--palette-bg-raised)] p-6 transition-colors hover:border-[var(--palette-rausch)]">
      <div className="flex items-center justify-between gap-4 text-sm text-[var(--palette-text-secondary)]">
        <span>{guide.kind[locale]}</span><span aria-hidden="true" className="text-[var(--palette-rausch)]">0{index + 1} ↗</span>
      </div>
      <h3 className="mb-3 mt-6 text-xl font-semibold leading-snug group-hover:text-[var(--palette-rausch)]">{guide.copy[locale].title}</h3>
      <p className="text-base leading-7 text-[var(--palette-text-secondary)]">{guide.copy[locale].description}</p>
      <span className="mt-auto pt-6 text-sm">{locale === 'zh-CN' ? '阅读指南' : 'Read guide'} <span aria-hidden="true">→</span></span>
    </a>)}
  </div>;
}

export function GuideSection({ locale, guides = GUIDES }: { locale: ContentLocale; guides?: Guide[] }) {
  if (!guides.length) return null;
  return <section className="shell py-16" aria-labelledby="guides-heading">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
      <div>
        <p className="t-micro text-[var(--palette-rausch)]">{locale === 'zh-CN' ? '从发现到体验' : 'Beyond the preview'}</p>
        <h2 id="guides-heading" className="mt-3 text-3xl font-semibold tracking-tight">{locale === 'zh-CN' ? '玩法与创作指南' : 'Guides for playing & creating'}</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--palette-text-secondary)]">{locale === 'zh-CN' ? '了解操作、机制与适用场景。每篇指南标明资料来源和实际核验范围。' : 'Understand the controls, mechanics and use cases. Each guide states its sources and what was actually checked.'}</p>
      </div>
      <a className="inline-flex min-h-11 items-center underline underline-offset-4" href={`/${locale}/guides`}>{locale === 'zh-CN' ? '全部指南 →' : 'All guides →'}</a>
    </div>
    <GuideCards locale={locale} guides={guides} />
  </section>;
}
