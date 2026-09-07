'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';
import type { Work, WorkCategory } from '@/lib/catalog';
import type { Dictionary, Locale } from '@/lib/i18n';
import { CATEGORY_ORDER } from '@/lib/taxonomy';
import WorkCard from './WorkCard';

type Filter = WorkCategory | 'all';

/**
 * Category pill rail + search over the catalogue. The rail follows Airbnb's
 * horizontally scrollable pill bar with an underline on the active pill; the
 * grid re-flows with a layout animation, which collapses to an instant swap
 * under reduced motion.
 */
export default function WorksExplorer({
  works,
  dict,
  locale,
}: {
  works: Work[];
  dict: Dictionary;
  locale: Locale;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const reduceMotion = useReducedMotion();

  const counts = useMemo(() => {
    const map = new Map<Filter, number>([['all', works.length]]);
    for (const work of works) map.set(work.category, (map.get(work.category) ?? 0) + 1);
    return map;
  }, [works]);

  // Categories with no entries are hidden rather than shown as dead pills.
  const rail = CATEGORY_ORDER.filter((category) => (counts.get(category) ?? 0) > 0);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return works.filter((work) => {
      if (filter !== 'all' && work.category !== filter) return false;
      if (!needle) return true;
      return [work.name, work.description, work.author.name, work.sourceCategory]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(needle));
    });
  }, [works, filter, query]);

  return (
    <div>
      {/* --- Controls ------------------------------------------------------ */}
      <div className="mb-9 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto px-1"
          role="tablist"
          aria-label={dict.works.eyebrow}
        >
          {rail.map((category) => {
            const active = filter === category;
            return (
              <button
                key={category}
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(category)}
                className={`relative shrink-0 rounded-[var(--radius-standard)] px-[14px] py-[9px] t-body-med transition-colors duration-200 ${
                  active
                    ? 'text-[var(--palette-text-primary)]'
                    : 'text-[var(--palette-text-tertiary)] hover:text-[var(--palette-text-secondary)]'
                }`}
              >
                <span className="relative z-10 flex items-center gap-[7px]">
                  {dict.works.categories[category]}
                  <span
                    className={`t-badge tabular-nums ${
                      active ? 'text-[var(--palette-rausch)]' : 'text-[var(--palette-text-tertiary)]'
                    }`}
                  >
                    {counts.get(category) ?? 0}
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
          layout={!reduceMotion}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((work, index) => (
              <motion.div
                key={work.id}
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, y: 22, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.97 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        duration: 0.44,
                        ease: [0.22, 1, 0.36, 1],
                        delay: Math.min(index, 8) * 0.035,
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
                setFilter('all');
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
