'use client';

import { useRef, type ReactNode } from 'react';

interface MagneticButtonProps {
  children: ReactNode;
  href: string;
  variant?: 'primary' | 'ghost';
  external?: boolean;
  className?: string;
}

/**
 * Airbnb's primary button geometry (8px radius, 16px/500 label, 24px inline
 * padding) with a magnetic pull toward the cursor. The pull is skipped for
 * coarse pointers and under reduced motion, where it degrades to a plain link.
 */
export default function MagneticButton({
  children,
  href,
  variant = 'primary',
  external = false,
  className = '',
}: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  const canPull = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const onMove = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const node = ref.current;
    if (!node || !canPull()) return;
    const rect = node.getBoundingClientRect();
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);
    node.style.transform = `translate3d(${x * 0.22}px, ${y * 0.3}px, 0)`;
  };

  const onLeave = () => {
    const node = ref.current;
    if (node) node.style.transform = '';
  };

  const base =
    'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-[var(--radius-standard)] px-6 py-[14px] t-ui transition-[transform,box-shadow,background-color,color] duration-300 [transition-timing-function:var(--ease-out-soft)] active:scale-[0.96]';

  const skin =
    variant === 'primary'
      ? 'bg-[var(--palette-rausch)] text-white elev-card hover:bg-[var(--palette-rausch-deep)] hover:elev-hover'
      : 'border border-[var(--palette-border-strong)] bg-white/[0.03] text-[var(--palette-text-primary)] backdrop-blur-sm hover:border-[var(--palette-rausch)] hover:bg-white/[0.07]';

  return (
    <a
      ref={ref}
      href={href}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`${base} ${skin} ${className}`}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
    >
      {/* Light sweep on hover — the only decorative layer on the button. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-hover:[animation:shimmer-sweep_900ms_var(--ease-out-soft)]"
      />
      <span className="relative flex items-center gap-2">{children}</span>
    </a>
  );
}
