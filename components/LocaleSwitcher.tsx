'use client';

import { useEffect, useRef, useState } from 'react';
import { LOCALES, type Locale } from '@/lib/i18n';

interface LocaleSwitcherProps {
  current: Locale;
  label: string;
  /** Where each language should land. Computed by the page that renders it. */
  hrefs: Record<string, string>;
}

export default function LocaleSwitcher({ current, label, hrefs }: LocaleSwitcherProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const active = LOCALES.find((locale) => locale.code === current) ?? LOCALES[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-[7px] rounded-[var(--radius-standard)] border border-[var(--palette-border-strong)] px-3 py-[9px] t-body-med transition-[border-color,background-color] duration-200 hover:border-[var(--palette-rausch)] hover:bg-white/[0.05]"
      >
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="8" cy="8" r="6.4" />
          <path d="M1.6 8h12.8M8 1.6c1.7 1.9 2.6 4 2.6 6.4S9.7 12.5 8 14.4C6.3 12.5 5.4 10.4 5.4 8S6.3 3.5 8 1.6z" />
        </svg>
        <span className="hidden sm:inline">{active.label}</span>
        <svg
          viewBox="0 0 16 16"
          width="11"
          height="11"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M4 6.5L8 10.5 12 6.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <ul
          role="menu"
          className="absolute end-0 top-[calc(100%+8px)] z-50 max-h-[70svh] w-[210px] overflow-y-auto rounded-[var(--radius-badge)] border border-[var(--palette-border)] bg-[var(--palette-bg-raised)] p-[6px] elev-card"
        >
          {LOCALES.map((locale) => {
            const isCurrent = locale.code === current;
            return (
              <li key={locale.code} role="none">
                <a
                  role="menuitem"
                  href={hrefs[locale.code] ?? `/${locale.code}`}
                  hrefLang={locale.htmlLang}
                  aria-current={isCurrent ? 'true' : undefined}
                  className={`flex items-center justify-between gap-3 rounded-[var(--radius-standard)] px-3 py-[9px] t-body-med transition-colors duration-150 ${
                    isCurrent
                      ? 'bg-white/[0.07] text-[var(--palette-text-primary)]'
                      : 'text-[var(--palette-text-secondary)] hover:bg-white/[0.05] hover:text-[var(--palette-text-primary)]'
                  }`}
                >
                  <span>{locale.label}</span>
                  {isCurrent ? (
                    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" className="text-[var(--palette-rausch)]">
                      <path d="M3 8.5l3.4 3.4L13 5.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </a>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
