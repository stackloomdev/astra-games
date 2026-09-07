interface MarqueeProps {
  items: string[];
  label: string;
  durationSeconds?: number;
}

/**
 * Infinite tag ribbon. The item list is rendered twice and the track translates
 * exactly -50%, so the loop is seamless without measuring anything at runtime.
 * The duplicate is hidden from assistive tech.
 */
export default function Marquee({ items, label, durationSeconds = 46 }: MarqueeProps) {
  const row = (ariaHidden: boolean) => (
    <ul
      className="flex shrink-0 items-center"
      {...(ariaHidden ? { 'aria-hidden': 'true' } : { 'aria-label': label })}
    >
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex items-center">
          <span className="t-micro whitespace-nowrap px-7 text-[var(--palette-text-secondary)]">
            {item}
          </span>
          <span
            aria-hidden="true"
            className="h-[3px] w-[3px] shrink-0 rounded-full bg-[var(--palette-rausch)]"
          />
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className="marquee relative overflow-hidden border-y border-[var(--palette-border)] bg-[var(--palette-bg-inset)] py-4"
      style={{ '--marquee-duration': `${durationSeconds}s` } as React.CSSProperties}
    >
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
      {/* Edge fades so items dissolve instead of clipping at the viewport. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--palette-bg-inset)] to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--palette-bg-inset)] to-transparent"
      />
    </div>
  );
}
