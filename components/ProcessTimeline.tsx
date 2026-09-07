'use client';

import { useEffect, useRef } from 'react';
import type { Dictionary } from '@/lib/i18n';

/**
 * Scroll-driven timeline. A gradient rail draws itself as the section passes
 * through the viewport and each step lifts in on its own trigger. GSAP is
 * imported dynamically so ScrollTrigger never reaches the server bundle, and
 * the whole effect is skipped under reduced motion.
 *
 * Every tween sets `immediateRender: false`, so a step is never pushed into its
 * dimmed "from" state before its trigger actually fires. Without that, a page
 * whose ScrollTrigger never activates — a hidden tab, a failed load — would
 * leave the steps stranded at quarter opacity.
 */
export default function ProcessTimeline({ dict }: { dict: Dictionary }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const context = gsap.context(() => {
        gsap.fromTo(
          '[data-rail]',
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            immediateRender: false,
            scrollTrigger: {
              trigger: node,
              start: 'top 70%',
              end: 'bottom 75%',
              scrub: 0.6,
            },
          },
        );

        gsap.utils.toArray<HTMLElement>('[data-step]').forEach((step) => {
          gsap.fromTo(
            step,
            { opacity: 0.25, x: 26 },
            {
              opacity: 1,
              x: 0,
              duration: 0.7,
              ease: 'power3.out',
              immediateRender: false,
              scrollTrigger: { trigger: step, start: 'top 82%', once: true },
            },
          );

          gsap.fromTo(
            step.querySelector('[data-dot]'),
            { scale: 0.5, backgroundColor: '#211d29' },
            {
              scale: 1,
              backgroundColor: '#ff385c',
              duration: 0.45,
              ease: 'back.out(2.2)',
              immediateRender: false,
              scrollTrigger: { trigger: step, start: 'top 82%', once: true },
            },
          );
        });
      }, node);

      cleanup = () => context.revert();
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <div ref={root} className="relative ps-9 sm:ps-12">
      {/* Rail track + the portion that draws in on scroll. */}
      <div
        aria-hidden="true"
        className="absolute bottom-6 start-[9px] top-3 w-px bg-[var(--palette-border)] sm:start-3"
      />
      <div
        data-rail
        aria-hidden="true"
        className="absolute bottom-6 start-[9px] top-3 w-px origin-top bg-gradient-to-b from-[var(--palette-rausch)] via-[var(--palette-luxe-lift)] to-transparent sm:start-3"
      />

      <ol className="flex flex-col gap-12">
        {dict.how.steps.map((step, index) => (
          <li key={step.title} data-step className="relative">
            <span
              data-dot
              aria-hidden="true"
              className="absolute -start-9 top-[9px] h-[9px] w-[9px] rounded-full bg-[var(--palette-control)] ring-4 ring-[var(--palette-bg)] sm:-start-12 sm:ms-[3px]"
            />
            <span className="t-micro text-[var(--palette-rausch)]">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="t-h2 mt-2">{step.title}</h3>
            <p className="t-body mt-[10px] max-w-[52ch] text-[var(--palette-text-secondary)]">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
