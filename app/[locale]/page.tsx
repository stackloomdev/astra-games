import { notFound } from 'next/navigation';
import CriteriaSection from '@/components/CriteriaSection';
import Hero from '@/components/Hero';
import MagneticButton from '@/components/MagneticButton';
import Marquee from '@/components/Marquee';
import ProcessTimeline from '@/components/ProcessTimeline';
import Reveal from '@/components/Reveal';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import StructuredData from '@/components/StructuredData';
import WorksExplorer from '@/components/WorksExplorer';
import { loadCatalogFor } from '@/lib/catalog-service';
import { LOCALES, getDictionary, isLocale, localeEntry, type Locale } from '@/lib/i18n';
import { SUBMIT_ISSUE, UPSTREAM_REPO } from '@/lib/links';
import { previewPath } from '@/lib/preview-version';
import { homeGraph } from '@/lib/structured-data';

// Matches the catalogue service's own five-minute freshness window, so the
// rendered page and the JSON API never drift apart by more than one interval.
export const revalidate = 300;

function formatDate(iso: string | null, locale: Locale): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(localeEntry(locale).htmlLang, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  const [dict, catalog] = await Promise.all([getDictionary(locale), loadCatalogFor(locale)]);
  const works = catalog.works;

  const authorCount = new Set(
    works.map((work) => work.author.name.trim().toLowerCase()).filter(Boolean),
  ).size;
  const playableCount = works.filter((work) => work.demoUrl).length;

  const homeHref = `/${locale}`;
  const localeHrefs = Object.fromEntries(LOCALES.map((entry) => [entry.code, `/${entry.code}`]));

  // The lead sentence names the upstream file inline; splitting on the token
  // keeps the link inside the sentence in every language's word order.
  const [leadBefore, leadAfter] = dict.works.lead.split('{readme}');

  return (
    <>
      <StructuredData
        data={homeGraph({
          locale,
          dict,
          catalog,
          previewUrlFor: (work) => previewPath(work, locale),
        })}
      />
      <SiteHeader dict={dict} locale={locale} localeHrefs={localeHrefs} homeHref={homeHref} />

      <main>
        <Hero
          dict={dict}
          workCount={works.length}
          authorCount={authorCount}
          playableCount={playableCount}
          checkedAt={formatDate(catalog.source.lastSuccessfulAt ?? catalog.source.checkedAt, locale)}
          stale={catalog.source.stale}
        />

        <Marquee items={dict.marquee} label={dict.works.eyebrow} />

        {/* --- Catalogue ---------------------------------------------------- */}
        <section id="works" className="shell scroll-mt-24 py-24 sm:py-32">
          <Reveal>
            <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="t-micro text-[var(--palette-rausch)]">{dict.works.eyebrow}</p>
                <h2 className="t-section phrase mt-3 max-w-[24ch]">
                  <span>{dict.works.heading[0]}</span> <span>{dict.works.heading[1]}</span>
                </h2>
              </div>
              <p className="t-body max-w-[46ch] text-[var(--palette-text-secondary)]">
                {leadBefore}
                <a
                  href={catalog.source.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[var(--palette-text-primary)] underline decoration-[var(--palette-rausch)] decoration-2 underline-offset-4"
                >
                  {dict.works.upstreamReadme}
                </a>
                {leadAfter}
              </p>
            </div>
          </Reveal>

          {catalog.source.stale && catalog.source.error ? (
            <p
              role="status"
              className="mb-8 rounded-[var(--radius-standard)] border border-[var(--palette-border-strong)] bg-white/[0.03] px-4 py-3 t-body text-[var(--palette-text-secondary)]"
            >
              {dict.hero.staleBadge}
            </p>
          ) : null}

          <Reveal threshold={0.05}>
            <WorksExplorer works={works} dict={dict} locale={locale} />
          </Reveal>
        </section>

        <CriteriaSection dict={dict} />

        {/* --- How it works -------------------------------------------------- */}
        <section
          id="how"
          className="relative scroll-mt-24 overflow-hidden border-y border-[var(--palette-border)] bg-[var(--palette-bg-inset)] py-24 sm:py-32"
        >
          <div
            aria-hidden="true"
            className="aurora-blob left-[-10%] top-[10%] h-[34rem] w-[34rem] opacity-[0.18]"
            style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 68%)' }}
          />
          <div className="shell relative grid gap-14 lg:grid-cols-[0.85fr_1.15fr]">
            <Reveal>
              <div className="lg:sticky lg:top-28">
                <p className="t-micro text-[var(--palette-rausch)]">{dict.how.eyebrow}</p>
                <h2 className="t-section phrase mt-3 max-w-[20ch]">
                  <span>{dict.how.heading[0]}</span> <span>{dict.how.heading[1]}</span>
                </h2>
                <p className="t-body mt-5 max-w-[40ch] text-[var(--palette-text-secondary)]">
                  {dict.how.lead}
                </p>
                <div className="mt-8">
                  <MagneticButton href={SUBMIT_ISSUE} external>
                    {dict.how.cta}
                  </MagneticButton>
                </div>
              </div>
            </Reveal>
            <ProcessTimeline dict={dict} />
          </div>
        </section>

        {/* --- Closing CTA --------------------------------------------------- */}
        <section className="shell py-24 sm:py-32">
          <Reveal>
            <div className="relative overflow-hidden rounded-[var(--radius-large)] border border-[var(--palette-border)] bg-[var(--palette-bg-raised)] px-8 py-16 text-center elev-card sm:px-16">
              <div
                aria-hidden="true"
                className="aurora-blob left-1/2 top-[-30%] h-[30rem] w-[30rem] -translate-x-1/2 opacity-[0.28]"
                style={{ background: 'radial-gradient(circle, #ff385c 0%, transparent 66%)' }}
              />
              <div className="relative">
                <h2 className="t-section phrase mx-auto max-w-[22ch]">
                  <span>{dict.cta.heading[0]}</span> <span>{dict.cta.heading[1]}</span>
                </h2>
                <p className="t-feature mx-auto mt-5 max-w-[48ch] font-normal text-[var(--palette-text-secondary)]">
                  {dict.cta.lead}
                </p>
                <div className="mt-9 flex flex-wrap justify-center gap-3">
                  <MagneticButton href={SUBMIT_ISSUE} external>
                    {dict.cta.submit}
                  </MagneticButton>
                  <MagneticButton href={UPSTREAM_REPO} variant="ghost" external>
                    {dict.cta.github}
                  </MagneticButton>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter dict={dict} homeHref={homeHref} readmeUrl={catalog.source.url} />
    </>
  );
}
