import type { Dictionary } from '@/lib/i18n';
import Reveal from './Reveal';

/**
 * The fields every catalogue entry has to fill in. Rendered as a definition
 * list rather than a table: the pairs are semantic, and a two-column table
 * would need horizontal scrolling on a phone for no gain.
 */
export default function CriteriaSection({ dict }: { dict: Dictionary }) {
  return (
    <section className="shell py-24 sm:py-32">
      <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <div className="lg:sticky lg:top-28">
            <p className="t-micro text-[var(--palette-rausch)]">{dict.criteria.eyebrow}</p>
            <h2 className="t-section phrase mt-3 max-w-[16ch]">
              <span>{dict.criteria.heading[0]}</span>{' '}
              <span>{dict.criteria.heading[1]}</span>
            </h2>
            <p className="t-body mt-5 max-w-[40ch] text-[var(--palette-text-secondary)]">
              {dict.criteria.lead}
            </p>
          </div>
        </Reveal>

        <div>
          <dl className="grid gap-px overflow-hidden rounded-[var(--radius-card)] bg-[var(--palette-border)] sm:grid-cols-2">
            {dict.criteria.rows.map((row, index) => (
              <Reveal key={row.term} delay={Math.min(index, 6) * 55}>
                <div className="h-full bg-[var(--palette-bg-raised)] p-5 transition-colors duration-300 hover:bg-[var(--palette-bg-hover)]">
                  <dt className="t-ui-semi flex items-center gap-[10px]">
                    <span
                      aria-hidden="true"
                      className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full bg-[var(--palette-rausch)]/15 t-badge text-[var(--palette-rausch)]"
                    >
                      {index + 1}
                    </span>
                    {row.term}
                  </dt>
                  <dd className="t-body mt-[10px] text-[var(--palette-text-secondary)]">
                    {row.detail}
                  </dd>
                </div>
              </Reveal>
            ))}
          </dl>

          <Reveal delay={200}>
            <p className="t-small mt-6 border-s-2 border-[var(--palette-rausch)] ps-4 text-[var(--palette-text-tertiary)]">
              {dict.criteria.note}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
