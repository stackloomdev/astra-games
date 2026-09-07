'use client';

import { useEffect, useState } from 'react';

const NAV = [
  { href: '#works', label: '作品目录' },
  { href: '#how', label: '如何收录' },
  { href: '#about', label: '关于' },
];

const UPSTREAM = 'https://github.com/MartinDelophy/awesome-gpt-6-astra';

/**
 * Sticky header. Transparent over the hero, then condenses into a blurred bar
 * with a hairline once the page scrolls — Airbnb's white sticky header pattern,
 * inverted, with the search slot replaced by section navigation.
 */
export default function SiteHeader() {
  const [condensed, setCondensed] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        const total = document.documentElement.scrollHeight - window.innerHeight;
        setCondensed(scrolled > 24);
        setProgress(total > 0 ? Math.min(1, scrolled / total) : 0);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-300 [transition-timing-function:var(--ease-out-soft)] ${
        condensed
          ? 'border-b border-[var(--palette-border)] bg-[color-mix(in_oklab,var(--palette-bg)_78%,transparent)] backdrop-blur-xl'
          : 'border-b border-transparent'
      }`}
    >
      <div className="shell flex h-[68px] items-center justify-between gap-6">
        <a href="#top" className="group flex items-center gap-[10px]">
          <span className="relative grid h-8 w-8 place-items-center">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-[var(--palette-rausch)] opacity-40 [animation:pulse-ring_2.6s_var(--ease-out-soft)_infinite]"
            />
            <span className="relative grid h-8 w-8 place-items-center rounded-full bg-[var(--palette-rausch)] text-white">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                <path d="M12 1.8l2.6 6.2 6.7.5-5.1 4.4 1.6 6.6L12 16l-5.8 3.5 1.6-6.6L2.7 8.5l6.7-.5z" />
              </svg>
            </span>
          </span>
          <span className="t-ui-semi tracking-[-0.44px]">Astra Games</span>
        </a>

        <nav className="hidden items-center gap-1 md:flex" aria-label="主导航">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="relative rounded-[var(--radius-standard)] px-3 py-2 t-body-med text-[var(--palette-text-secondary)] transition-colors duration-200 hover:text-[var(--palette-text-primary)]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a
          href={UPSTREAM}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 rounded-[var(--radius-standard)] border border-[var(--palette-border-strong)] px-4 py-[9px] t-body-med transition-[border-color,background-color] duration-200 hover:border-[var(--palette-rausch)] hover:bg-white/[0.05]"
        >
          <svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </div>

      {/* Reading progress — the only chrome that reacts continuously to scroll. */}
      <div
        aria-hidden="true"
        className="h-px origin-left bg-gradient-to-r from-[var(--palette-rausch)] via-[var(--palette-luxe-lift)] to-[var(--palette-rausch)]"
        style={{ transform: `scaleX(${progress})`, opacity: condensed ? 1 : 0 }}
      />
    </header>
  );
}
