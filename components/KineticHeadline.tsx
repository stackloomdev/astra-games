'use client';

import { useEffect, useRef } from 'react';

interface KineticHeadlineProps {
  /** Each entry becomes one line; lines animate word by word. */
  lines: string[];
  className?: string;
  /** Index of the line that carries the brand gradient. */
  accentLine?: number;
  startDelay?: number;
}

/**
 * Word-by-word entrance for the hero headline. Words are wrapped in a clipping
 * span and slide up from below the baseline with a slight blur, which reads as
 * type "settling" rather than sliding. Each word keeps its own DOM node so the
 * full sentence stays selectable and screen readers get one continuous label.
 */
export default function KineticHeadline({
  lines,
  className = '',
  accentLine = -1,
  startDelay = 0,
}: KineticHeadlineProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const words = Array.from(node.querySelectorAll<HTMLElement>('[data-word]'));

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      words.forEach((word) => {
        word.style.transform = 'none';
        word.style.opacity = '1';
        word.style.filter = 'none';
      });
      return;
    }

    const timers = words.map((word, index) =>
      window.setTimeout(() => {
        word.style.transform = 'translate3d(0, 0, 0)';
        word.style.opacity = '1';
        word.style.filter = 'blur(0px)';
      }, startDelay + index * 62),
    );

    return () => timers.forEach(clearTimeout);
  }, [startDelay]);

  return (
    <h1 ref={ref} className={className}>
      {lines.map((line, lineIndex) => (
        <span key={line} className="block overflow-hidden pb-[0.08em]">
          {line.split(' ').map((word, wordIndex) => (
            <span
              key={`${word}-${wordIndex}`}
              data-word
              className={`inline-block will-change-transform ${
                lineIndex === accentLine ? 'grad-brand' : ''
              }`}
              style={{
                transform: 'translate3d(0, 108%, 0)',
                opacity: 0,
                filter: 'blur(9px)',
                transition:
                  'transform 900ms var(--ease-out-soft), opacity 700ms var(--ease-out-soft), filter 700ms var(--ease-out-soft)',
              }}
            >
              {word}
              {wordIndex < line.split(' ').length - 1 ? ' ' : ''}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}
