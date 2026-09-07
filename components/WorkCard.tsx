'use client';

import { useRef, useState } from 'react';
import type { Work } from '@/lib/catalog';
import { gradientFor, hostOf, monogram } from '@/lib/taxonomy';

const CATEGORY_LABEL: Record<string, string> = {
  game: '游戏',
  experiment: '实验 · 艺术',
  app: '应用',
  tool: '工具',
  website: '网站',
  other: '作品',
};

/**
 * Airbnb listing-card geometry — 20px radius, three-layer shadow, image area on
 * top, details below — with a pointer-tracked tilt and spotlight. The tilt is
 * suppressed on touch and under reduced motion; the card is a plain link there.
 */
export default function WorkCard({ work, index }: { work: Work; index: number }) {
  const ref = useRef<HTMLElement>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const href = work.demoUrl ?? work.sourceUrl ?? '#';
  const showImage = Boolean(work.imageUrl) && !imageFailed;

  const interactive = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const onMove = (event: React.MouseEvent<HTMLElement>) => {
    const node = ref.current;
    if (!node || !interactive()) return;
    const rect = node.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    node.style.setProperty('--tilt-x', `${(0.5 - py) * 7}deg`);
    node.style.setProperty('--tilt-y', `${(px - 0.5) * 9}deg`);
    node.style.setProperty('--spot-x', `${px * 100}%`);
    node.style.setProperty('--spot-y', `${py * 100}%`);
  };

  const onLeave = () => {
    const node = ref.current;
    if (!node) return;
    node.style.setProperty('--tilt-x', '0deg');
    node.style.setProperty('--tilt-y', '0deg');
  };

  return (
    <article
      ref={ref}
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
          {showImage ? (
            // Upstream artwork is arbitrary remote media, so it stays a plain
            // <img> rather than going through the Next image optimizer.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={work.imageUrl as string}
              alt={`${work.name} 实机画面`}
              loading="lazy"
              decoding="async"
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover transition-transform duration-700 [transition-timing-function:var(--ease-out-soft)] group-hover:scale-[1.07]"
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

          <span className="absolute left-3 top-3 rounded-[var(--radius-badge)] bg-black/55 px-[10px] py-[5px] t-badge text-white backdrop-blur-sm">
            {CATEGORY_LABEL[work.category] ?? '作品'}
          </span>

          {work.demoUrl ? (
            <span className="absolute right-3 top-3 flex items-center gap-[6px] rounded-[var(--radius-badge)] bg-[var(--palette-rausch)] px-[10px] py-[5px] t-badge text-white">
              <span className="h-[5px] w-[5px] rounded-full bg-white" />
              可试玩
            </span>
          ) : null}
        </div>

        {/* --- Details --------------------------------------------------- */}
        <div className="flex flex-1 flex-col gap-[10px] p-[18px]">
          <h3 className="t-feature line-clamp-2 transition-colors duration-300 group-hover:text-[var(--palette-rausch)]">
            {work.name}
          </h3>

          {work.description ? (
            <p className="t-body line-clamp-3 text-[var(--palette-text-secondary)]">
              {work.description}
            </p>
          ) : null}

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--palette-border)] pt-3">
            <span className="t-small truncate text-[var(--palette-text-tertiary)]">
              {work.author.name ? `by ${work.author.name}` : hostOf(href)}
            </span>
            <span className="flex shrink-0 items-center gap-[6px] t-small text-[var(--palette-text-secondary)] transition-colors duration-300 group-hover:text-[var(--palette-rausch)]">
              {work.demoUrl ? '打开' : '看源码'}
              <svg
                viewBox="0 0 16 16"
                width="12"
                height="12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-[3px]"
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

      {/* Full-card target — Airbnb's whole-card tap area. */}
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="absolute inset-0 rounded-[var(--radius-card)]"
      >
        <span className="sr-only">{`打开 ${work.name}`}</span>
      </a>
    </article>
  );
}
