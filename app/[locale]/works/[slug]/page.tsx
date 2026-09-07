import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import MagneticButton from '@/components/MagneticButton';
import Reveal from '@/components/Reveal';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import WorkCard from '@/components/WorkCard';
import { loadCatalogFor } from '@/lib/catalog-service';
import { LOCALES, getDictionary, isLocale, type Locale } from '@/lib/i18n';
import { SITE_URL } from '@/lib/links';
import { previewPath } from '@/lib/preview-version';
import { gradientFor, hostOf, monogram } from '@/lib/taxonomy';
import { findWorkBySlug, workSlug } from '@/lib/work-url';

export const revalidate = 300;
// Slugs come from a list that changes upstream without a redeploy, so pages are
// rendered on demand and then cached, rather than fixed at build time.
export const dynamicParams = true;

async function resolve(locale: string, slug: string) {
  if (!isLocale(locale)) return null;
  const catalog = await loadCatalogFor(locale as Locale);
  const work = findWorkBySlug(catalog.works, decodeURIComponent(slug));
  return work ? { catalog, work, locale: locale as Locale } : null;
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/works/[slug]'>): Promise<Metadata> {
  const { locale, slug } = await params;
  const resolved = await resolve(locale, slug);
  if (!resolved) return {};
  const { work } = resolved;

  return {
    title: work.name,
    description: work.description || undefined,
    alternates: { canonical: `/${locale}/works/${workSlug(work)}` },
    openGraph: {
      type: 'article',
      url: `${SITE_URL}/${locale}/works/${workSlug(work)}`,
      title: work.name,
      description: work.description || undefined,
      images: [`${SITE_URL}${previewPath(work, locale)}`],
    },
  };
}

export default async function WorkPage({ params }: PageProps<'/[locale]/works/[slug]'>) {
  const { locale: rawLocale, slug } = await params;
  const resolved = await resolve(rawLocale, slug);
  const dict = await getDictionary(isLocale(rawLocale) ? (rawLocale as Locale) : 'zh-CN');
  const homeHref = `/${isLocale(rawLocale) ? rawLocale : 'zh-CN'}`;
  const localeHrefs = Object.fromEntries(LOCALES.map((entry) => [entry.code, `/${entry.code}`]));

  if (!resolved) notFound();
  const { catalog, work, locale } = resolved;

  const related = catalog.works.filter((entry) => entry.id !== work.id).slice(0, 3);
  const facts = [
    { term: dict.detail.author, value: work.author.name, href: work.author.url },
    { term: dict.detail.category, value: dict.works.categories[work.category] },
    { term: dict.detail.listedUnder, value: work.sourceCategory },
    { term: dict.detail.repository, value: hostOf(work.repoUrl), href: work.repoUrl },
  ].filter((fact) => fact.value);

  return (
    <>
      <SiteHeader dict={dict} locale={locale} localeHrefs={localeHrefs} homeHref={homeHref} />

      <main className="pt-[68px]">
        {/* --- Cover banner ------------------------------------------------ */}
        <section className="relative isolate overflow-hidden">
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <div className="absolute inset-0" style={{ background: gradientFor(work.id) }} />
            <div className="absolute inset-0 grid-veil opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--palette-bg)]/55 via-[var(--palette-bg)]/78 to-[var(--palette-bg)]" />
          </div>

          <div className="shell grid items-center gap-10 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
            <div>
              <a
                href={`${homeHref}#works`}
                className="inline-flex items-center gap-[7px] t-body-med text-[var(--palette-text-secondary)] transition-colors duration-200 hover:text-[var(--palette-rausch)]"
              >
                <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="rtl:-scale-x-100">
                  <path d="M13 8H3M7 4L3 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {dict.detail.back}
              </a>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="rounded-[var(--radius-badge)] border border-[var(--palette-border-strong)] bg-white/[0.05] px-[10px] py-[5px] t-badge">
                  {dict.works.categories[work.category]}
                </span>
                {work.demoUrl ? (
                  <span className="flex items-center gap-[6px] rounded-[var(--radius-badge)] bg-[var(--palette-rausch)] px-[10px] py-[5px] t-badge text-white">
                    <span className="h-[5px] w-[5px] rounded-full bg-white" />
                    {dict.card.playable}
                  </span>
                ) : null}
              </div>

              <h1 className="t-section mt-4 max-w-[20ch] text-balance">{work.name}</h1>

              {work.description ? (
                <p className="t-feature mt-5 max-w-[52ch] font-normal text-[var(--palette-text-secondary)]">
                  {work.description}
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                {work.demoUrl ? (
                  <MagneticButton href={work.demoUrl} external>
                    {dict.detail.play}
                  </MagneticButton>
                ) : null}
                {work.sourceUrl ? (
                  <MagneticButton href={work.sourceUrl} variant="ghost" external>
                    {dict.detail.source}
                  </MagneticButton>
                ) : null}
              </div>
            </div>

            <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-card)] bg-[var(--palette-bg-inset)] elev-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPath(work, locale)}
                alt={`${work.name} — ${dict.card.screenshotAlt}`}
                className="h-full w-full object-cover"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 grid place-items-center text-[3.5rem] font-bold text-white/25"
              >
                {monogram(work.name)}
              </span>
            </div>
          </div>
        </section>

        {/* --- Facts and upstream detail bullets ---------------------------- */}
        <section className="shell grid gap-12 pb-24 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <p className="t-micro text-[var(--palette-rausch)]">{dict.detail.metadata}</p>
              <dl className="mt-5 flex flex-col gap-4">
                {facts.map((fact) => (
                  <div key={fact.term} className="border-t border-[var(--palette-border)] pt-4">
                    <dt className="t-small text-[var(--palette-text-tertiary)]">{fact.term}</dt>
                    <dd className="t-ui mt-1">
                      {fact.href ? (
                        <a
                          href={fact.href}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="underline decoration-[var(--palette-rausch)] decoration-2 underline-offset-4 transition-colors duration-200 hover:text-[var(--palette-rausch)]"
                        >
                          {fact.value}
                        </a>
                      ) : (
                        fact.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="t-small mt-8 border-s-2 border-[var(--palette-border-strong)] ps-4 text-[var(--palette-text-tertiary)]">
                {dict.detail.upstreamNote}
              </p>
            </div>
          </Reveal>

          <div className="flex flex-col gap-px overflow-hidden rounded-[var(--radius-card)] bg-[var(--palette-border)]">
            {work.details.map((detail, index) => (
              <Reveal key={`${detail.label}-${index}`} delay={Math.min(index, 6) * 60}>
                <div className="h-full bg-[var(--palette-bg-raised)] p-6">
                  {detail.label ? (
                    <p className="t-micro text-[var(--palette-rausch)]">{detail.label}</p>
                  ) : null}
                  <p className="t-body mt-[10px] text-[var(--palette-text-secondary)]">
                    {detail.text}
                  </p>
                  {detail.links.length ? (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {detail.links.map((link) => (
                        <li key={link.url}>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-[6px] rounded-[var(--radius-standard)] border border-[var(--palette-border-strong)] px-3 py-[7px] t-small transition-[border-color,background-color] duration-200 hover:border-[var(--palette-rausch)] hover:bg-white/[0.05]"
                          >
                            {link.text || hostOf(link.url)}
                            <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="text-[var(--palette-text-tertiary)]">
                              <path d="M6 3h7v7M13 3L4 12" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* --- Related ------------------------------------------------------ */}
        {related.length ? (
          <section className="border-t border-[var(--palette-border)] bg-[var(--palette-bg-inset)] py-20">
            <div className="shell">
              <h2 className="t-h2 mb-8">{dict.detail.otherWorks}</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((entry, index) => (
                  <Reveal key={entry.id} delay={index * 70}>
                    <WorkCard work={entry} index={index} dict={dict} locale={locale} />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter dict={dict} homeHref={homeHref} readmeUrl={catalog.source.url} />
    </>
  );
}
