'use client';

import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  to: number;
  durationMs?: number;
  suffix?: string;
}

/**
 * Counts up once the number scrolls into view. Renders the final value straight
 * away when motion is reduced, and always ends on the exact target so the digit
 * never settles one short.
 */
export default function CountUp({ to, durationMs = 1400, suffix = '' }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(to);
      return;
    }

    let frame = 0;
    let start = 0;

    const step = (time: number) => {
      if (!start) start = time;
      const progress = Math.min(1, (time - start) / durationMs);
      // easeOutExpo — fast arrival, long settle.
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.round(eased * to));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        frame = requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to, durationMs]);

  return (
    <span ref={ref} className="tabular-nums">
      {value}
      {suffix}
    </span>
  );
}
