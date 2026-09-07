'use client';

import { useEffect, useRef, type ElementType, type ReactNode } from 'react';

/** Grace period before a still-hidden element is released regardless. */
const FAILSAFE_MS = 2500;

interface RevealProps {
  children: ReactNode;
  /** Stagger offset in ms, applied as a CSS transition-delay. */
  delay?: number;
  /** Fraction of the element that must be visible before it is released. */
  threshold?: number;
  as?: ElementType;
  className?: string;
}

/**
 * Releases `.reveal` elements once they scroll into view. Elements are released
 * one time only and the observer disconnects, so a long catalogue does not keep
 * hundreds of live observers around.
 *
 * Content must never be permanently invisible because an observer did not fire.
 * IntersectionObserver depends on the page actually being composited, which does
 * not happen in a background or hidden tab, and it is missing altogether in some
 * environments. So there are two escapes: no observer support releases the
 * element straight away, and a timer releases anything still hidden after a
 * short grace period.
 */
export default function Reveal({
  children,
  delay = 0,
  threshold = 0.15,
  as: Tag = 'div',
  className = '',
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      node.classList.add('is-in');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(node);

    // Safety net: whatever the observer did or did not do, the element is
    // readable shortly after mount.
    const failsafe = window.setTimeout(() => {
      node.classList.add('is-in');
      observer.disconnect();
    }, FAILSAFE_MS);

    return () => {
      clearTimeout(failsafe);
      observer.disconnect();
    };
  }, [threshold]);

  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
