'use client';

import { useEffect, useRef, useState } from 'react';
import type { Work } from '@/lib/catalog';
import type { Dictionary, Locale } from '@/lib/i18n';
import { previewPath } from '@/lib/preview-version';
import { gradientFor, monogram } from '@/lib/taxonomy';
import { workHref } from '@/lib/work-url';

const ADVANCE_MS = 3800;

/**
 * The hero's right half: a deck of real catalogue covers that cycles on its own.
 *
 * Real works rather than abstract decoration — the first thing the page shows
 * should be evidence that there is something to play, not a particle toy. Each
 * card links to its entry, so the animation is also navigation.
 *
 * Cycling stops while the pointer is over the deck, while the tab is hidden,
 * once the deck scrolls out of view, and entirely under reduced motion — where
 * the front card simply stays put.
 */
export default function HeroDeck({
  works,
  locale,
  dict,
  className = '',
}: {
  works: Work[];
  locale: Locale;
  dict: Dictionary;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // Pointer parallax on the whole deck.
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        const x = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
        const y = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
        node.style.setProperty('--deck-ry', `${x * 9}deg`);
        node.style.setProperty('--deck-rx', `${-y * 7}deg`);
      });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Auto-advance.
  useEffect(() => {
    if (works.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const node = root.current;
    let visible = true;
    let timer = 0;

    const tick = () => {
      if (!paused && visible && !document.hidden) setIndex((value) => (value + 1) % works.length);
    };
    timer = window.setInterval(tick, ADVANCE_MS);

    const observer = node
      ? new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
        }, { threshold: 0.2 })
      : null;
    if (node && observer) observer.observe(node);

    return () => {
      clearInterval(timer);
      observer?.disconnect();
    };
  }, [works.length, paused]);

  if (!works.length) return null;

  return (
    <div
      ref={root}
      className={`relative ${className}`}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      {/* Glow anchored behind the front card. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-[8%] top-[12%] -z-10 aspect-[4/3] rounded-full opacity-45 blur-3xl"
        style={{ background: 'radial-gradient(circle, #ff385c 0%, #8b5cf6 45%, transparent 70%)' }}
      />

      <div
        className="relative aspect-[4/3] w-full [perspective:1400px]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {works.map((work, position) => {
          // Distance from the front of the deck, wrapping around.
          const offset = (position - index + works.length) % works.length;
          const isFront = offset === 0;
          const depth = Math.min(offset, 3);

          return (
            <article
              key={work.id}
              aria-hidden={!isFront}
              className="absolute inset-0 origin-bottom transition-[transform,opacity] duration-[900ms] [transition-timing-function:var(--ease-out-soft)] motion-reduce:transition-none"
              style={{
                transform: `translate3d(${depth * 5}%, ${depth * -5}%, 0) rotateX(var(--deck-rx, 0deg)) rotateY(var(--deck-ry, 0deg)) scale(${1 - depth * 0.075})`,
                opacity: offset > 3 ? 0 : 1 - depth * 0.28,
                zIndex: works.length - depth,
                pointerEvents: isFront ? 'auto' : 'none',
              }}
            >
              <div className="relative h-full w-full overflow-hidden rounded-[var(--radius-card)] bg-[var(--palette-bg-raised)] elev-card">
                <div className="absolute inset-0" style={{ background: gradientFor(work.id) }}>
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 grid place-items-center text-[4rem] font-bold text-white/80 mix-blend-overlay"
                  >
                    {monogram(work.name)}
                  </span>
                </div>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                {/* Same URL as the catalogue card for this work below, so the
                    browser serves both from one request rather than two. */}
                <img
                  src={previewPath(work, locale)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="relative h-full w-full object-cover"
                />

                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 to-transparent"
                />

                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="t-micro text-[var(--palette-rausch)]">
                    {dict.works.categories[work.category] ?? dict.works.categories.other}
                  </p>
                  <p className="t-h2 mt-1 line-clamp-1 text-white">{work.name}</p>
                </div>

                {isFront ? (
                  <a
                    href={workHref(locale, work)}
                    className="absolute inset-0 rounded-[var(--radius-card)]"
                  >
                    <span className="sr-only">{`${work.name} — ${dict.card.details}`}</span>
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {/* Which card is showing, and a way to jump straight to one. */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {works.map((work, position) => (
          <button
            key={work.id}
            type="button"
            onClick={() => setIndex(position)}
            aria-label={work.name}
            aria-current={position === index}
            className={`h-[3px] rounded-full transition-[width,background-color] duration-500 [transition-timing-function:var(--ease-out-soft)] ${
              position === index
                ? 'w-7 bg-[var(--palette-rausch)]'
                : 'w-3 bg-[var(--palette-border-strong)] hover:bg-[var(--palette-text-tertiary)]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
