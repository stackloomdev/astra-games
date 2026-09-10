'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { Work } from '@/lib/catalog';
import type { Dictionary, Locale } from '@/lib/i18n';
import { previewPath } from '@/lib/preview-version';
import { gradientFor, monogram } from '@/lib/taxonomy';
import { workHref } from '@/lib/work-url';

/**
 * Airbnb listing-card geometry — 20px radius, three-layer shadow, image area on
 * top, details below — with a pointer-tracked tilt and spotlight. The tilt is
 * suppressed on touch and under reduced motion; the card is a plain link there.
 */
interface WorkCardProps {
  work: Work;
  index: number;
  dict: Dictionary;
  locale: Locale;
}

export default function WorkCard({ work, index, dict, locale }: WorkCardProps) {
  const ref = useRef<HTMLElement>(null);
  const [coverFailed, setCoverFailed] = useState(false);
  // Read once on mount instead of on every pointer move.
  const interactive = useRef(false);
  // The card's box, captured when the pointer arrives. Measuring it on each
  // move forces a synchronous layout, and with a grid this size that is the
  // difference between a smooth hover and a stuttering one.
  const box = useRef<DOMRect | null>(null);

  useEffect(() => {
    interactive.current =
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);
  const href = workHref(locale, work);
  // /api/preview walks author artwork → verified screenshot → the demo page's
  // Open Graph image → the GitHub repository card, and 404s when it finds
  // nothing. Only that 404 falls through to the generated cover below.
  const cover = previewPath(work, locale);

  const onEnter = () => {
    if (!interactive.current) return;
    box.current = ref.current?.getBoundingClientRect() ?? null;
  };

  const onMove = (event: React.MouseEvent<HTMLElement>) => {
    const node = ref.current;
    const rect = box.current;
    if (!node || !rect || !interactive.current) return;
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    node.style.setProperty('--tilt-x', `${(0.5 - py) * 7}deg`);
    node.style.setProperty('--tilt-y', `${(px - 0.5) * 9}deg`);
    node.style.setProperty('--spot-x', `${px * 100}%`);
    node.style.setProperty('--spot-y', `${py * 100}%`);
  };

  const onLeave = () => {
    box.current = null;
    const node = ref.current;
    if (!node) return;
    node.style.setProperty('--tilt-x', '0deg');
    node.style.setProperty('--tilt-y', '0deg');
  };

  return (
    <article
      ref={ref}
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="group relative h-full [perspective:1200px]"
      style={{ '--reveal-delay': `${Math.min(index, 9) * 55}ms` } as React.CSSProperties}
    >
      <div
        className="relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] bg-[var(--palette-bg-raised)] elev-card transition-[box-shadow,transform] duration-500 [transform:rotateX(var(--tilt-x,0deg))_rotateY(var(--tilt-y,0deg))] [transform-style:preserve-3d] [transition-timing-function:var(--ease-out-soft)] group-hover:elev-hover group-hover:-translate-y-1"
      >
        {/* --- Cover ---------------------------------------------------- */}
        <div className="relative aspect-[16/10] overflow-hidden bg-[var(--palette-bg-inset)]">
          {!coverFailed ? (
            // `sizes` drives the srcset, which lib/image-loader.ts turns into
            // /api/preview requests at those widths — a card never downloads
            // the full 1440x950 source.
            <Image
              src={cover}
              alt={`${work.name} — ${dict.card.screenshotAlt}`}
              fill
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 31vw"
              onError={() => setCoverFailed(true)}
              className="object-cover transition-transform duration-700 [transition-timing-function:var(--ease-out-soft)] group-hover:scale-[1.07]"
            />
          ) : (
            <div
              className="relative h-full w-full transition-transform duration-700 [transition-timing-function:var(--ease-out-soft)] group-hover:scale-[1.07]"
              style={{ background: gradientFor(work.id) }}
            >
              <div className="absolute inset-0 grid-veil opacity-50" />
              <span
                aria-hidden="true"
                className="absolute inset-0 grid place-items-center text-[3.25rem] font-bold tracking-[-0.04em] text-white/85 mix-blend-overlay"
              >
                {monogram(work.name)}
              </span>
            </div>
          )}

          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[var(--palette-bg-raised)] via-transparent to-transparent"
          />

          <span className="absolute start-3 top-3 rounded-[var(--radius-badge)] bg-black/55 px-[10px] py-[5px] t-badge text-white backdrop-blur-sm">
            {dict.works.categories[work.category] ?? dict.works.categories.other}
          </span>

          {/* Straight to the demo, skipping the detail page. z-2 puts it above
              the title's stretched hit area (z-1), so a click here plays rather
              than opening the entry. It replaces the old "playable" badge:
              a button says the same thing and also does something about it. */}
          {work.demoUrl ? (
            <a
              href={work.demoUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="absolute bottom-3 start-3 z-[2] inline-flex min-h-[40px] items-center gap-[7px] rounded-[var(--radius-large)] bg-[var(--palette-rausch)] px-[14px] t-body-med text-white max-sm:min-h-[44px] shadow-[0_2px_10px_rgb(0_0_0/0.35)] transition-[background-color,transform,box-shadow] duration-300 [transition-timing-function:var(--ease-out-soft)] hover:bg-[var(--palette-rausch-deep)] hover:shadow-[0_6px_18px_rgb(255_56_92/0.45)] focus-visible:outline-offset-4 group-hover:-translate-y-[2px]"
            >
              {/* Playback glyphs are not mirrored in RTL: the triangle points the way
                  the media advances, not the way the text reads. */}
              <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true">
                <path d="M4.4 2.6a.8.8 0 0 1 1.22-.68l7 5.4a.8.8 0 0 1 0 1.36l-7 5.4A.8.8 0 0 1 4.4 13.4z" />
              </svg>
              {dict.detail.play}
            </a>
          ) : null}
        </div>

        {/* --- Details --------------------------------------------------- */}
        <div className="flex flex-1 flex-col gap-[10px] p-[18px]">
          {/* The title is the card's real link. Its ::after stretches over the
              whole card, so the entire surface opens the entry — Airbnb's
              full-card tap target — while leaving room for controls stacked
              above it. */}
          <h3 className="t-feature line-clamp-2 transition-colors duration-300 group-hover:text-[var(--palette-rausch)]">
            <a
              href={href}
              className="after:absolute after:inset-0 after:z-[1] after:rounded-[var(--radius-card)] after:content-['']"
            >
              {work.name}
            </a>
          </h3>

          {work.description ? (
            <p className="t-body line-clamp-3 text-[var(--palette-text-secondary)]">
              {work.description}
            </p>
          ) : null}

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--palette-border)] pt-3">
            <span className="t-small truncate text-[var(--palette-text-tertiary)]">
              {work.author.name ? `${dict.card.by} ${work.author.name}` : work.sourceCategory}
            </span>
            <span className="flex shrink-0 items-center gap-[6px] t-small text-[var(--palette-text-secondary)] transition-colors duration-300 group-hover:text-[var(--palette-rausch)]">
              {dict.card.details}
              <svg
                viewBox="0 0 16 16"
                width="12"
                height="12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-[3px] rtl:-scale-x-100"
              >
                <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>

        {/* Cursor spotlight, above the content but never intercepting clicks. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[var(--radius-card)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(340px circle at var(--spot-x,50%) var(--spot-y,50%), rgb(255 56 92 / 0.13), transparent 62%)',
          }}
        />
      </div>

    </article>
  );
}
