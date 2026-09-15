'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';
import type { Work } from '@/lib/catalog';
import type { Dictionary, Locale } from '@/lib/i18n';
import WorkCard from './WorkCard';

/**
 * Section pill rail + search over the catalogue. The pills are the upstream
 * README's own sections — same titles, same order, translated by upstream in
 * each language's README — so the filter always matches the list on GitHub, and
 * a section added or renamed there shows up here without a code change. The
 * rail follows Airbnb's horizontally scrollable pill bar with an underline on
 * the active pill; the grid re-flows with a layout animation, which collapses to
 * an instant swap under reduced motion.
 */
/**
 * Above this many cards the grid stops animating its reflow. A FLIP pass
 * measures and re-positions every card in the list, so the cost of switching
 * section grows with the catalogue — which has gone from six entries to over
 * sixty in a few days. Past the threshold the cards still fade in and out;
 * only the position choreography is dropped.
 */
const LAYOUT_ANIMATION_LIMIT = 24;

export default function WorksExplorer({
  works,
  dict,
  locale,
}: {
  works: Work[];
  dict: Dictionary;
  locale: Locale;
}) {
  // null shows every section.
  const [section, setSection] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const reduceMotion = useReducedMotion();

  // Walking the works in list order makes the Map's insertion order the order in
  // which the README introduces each section.
  const rail = useMemo(() => {
    const counts = new Map<string, number>();
    for (const work of [...works].sort((a, b) => a.sourceOrder - b.sourceOrder)) {
      counts.set(work.sourceCategory, (counts.get(work.sourceCategory) ?? 0) + 1);
    }
    return [
      { section: null, label: dict.works.all, count: works.length },
      ...[...counts].map(([name, count]) => ({ section: name, label: name, count })),
    ];
  }, [works, dict]);

  const animateLayout = !reduceMotion && works.length <= LAYOUT_ANIMATION_LIMIT;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return works.filter((work) => {
      if (section !== null && work.sourceCategory !== section) return false;
      if (!needle) return true;
      return [work.name, work.description, work.author.name, work.sourceCategory]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(needle));
    });
  }, [works, section, query]);

  return (
    <div>
      {/* --- Controls ------------------------------------------------------ */}
      <div className="mb-9 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto px-1"
          role="tablist"
          aria-label={dict.works.eyebrow}
        >
          {rail.map((pill) => {
            const active = section === pill.section;
            return (
              <button
                key={pill.section ?? ''}
                role="tab"
                aria-selected={active}
                onClick={() => setSection(pill.section)}
                className={`relative shrink-0 rounded-[var(--radius-standard)] px-[14px] py-[9px] t-body-med transition-colors duration-200 ${
                  active
                    ? 'text-[var(--palette-text-primary)]'
                    : 'text-[var(--palette-text-tertiary)] hover:text-[var(--palette-text-secondary)]'
                }`}
              >
                <span className="relative z-10 flex items-center gap-[7px]">
                  {pill.label}
                  <span
                    className={`t-badge tabular-nums ${
                      active ? 'text-[var(--palette-rausch)]' : 'text-[var(--palette-text-tertiary)]'
                    }`}
                  >
                    {pill.count}
                  </span>
                </span>
                {active ? (
                  <motion.span
                    layoutId="pill-underline"
                    aria-hidden="true"
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 480, damping: 38 }
                    }
                    className="absolute inset-0 rounded-[var(--radius-standard)] bg-white/[0.07] ring-1 ring-inset ring-[var(--palette-border-strong)]"
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        <label className="relative flex w-full items-center lg:w-[300px]">
          <span className="sr-only">{dict.works.search}</span>
          <svg
            viewBox="0 0 16 16"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
            className="pointer-events-none absolute start-[14px] text-[var(--palette-text-tertiary)]"
          >
            <circle cx="7" cy="7" r="4.6" />
            <path d="M10.6 10.6L14 14" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={dict.works.search}
            className="w-full rounded-[var(--radius-large)] border border-[var(--palette-border)] bg-[var(--palette-bg-raised)] py-[11px] pe-4 ps-10 t-body text-[var(--palette-text-primary)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[var(--palette-text-tertiary)] focus:border-[var(--palette-rausch)] focus:shadow-[0_0_0_2px_rgb(255_56_92/0.22)]"
          />
        </label>
      </div>

      {/* --- Grid ---------------------------------------------------------- */}
      {visible.length ? (
        <motion.div
          layout={animateLayout}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6"
        >
          <AnimatePresence mode={animateLayout ? 'popLayout' : 'sync'} initial={false}>
            {visible.map((work, index) => (
              <motion.div
                key={work.id}
                layout={animateLayout}
                initial={reduceMotion ? false : { opacity: 0, y: 22, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.97 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        duration: 0.44,
                        ease: [0.22, 1, 0.36, 1],
                        // A stagger that keeps growing turns a long list into a
                        // long wait, so it only applies while the list is short.
                        delay: animateLayout ? Math.min(index, 8) * 0.035 : 0,
                      }
                }
                className="h-full"
              >
                <WorkCard work={work} index={index} dict={dict} locale={locale} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--palette-border-strong)] py-20 text-center">
          <p className="t-feature">{dict.works.emptyTitle}</p>
          <p className="t-body mt-2 text-[var(--palette-text-secondary)]">
            {dict.works.emptyBody}{' '}
            <button
              onClick={() => {
                setQuery('');
                setSection(null);
              }}
              className="text-[var(--palette-rausch)] underline underline-offset-4"
            >
              {dict.works.reset}
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
