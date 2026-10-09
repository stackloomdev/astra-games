import type { Dictionary } from '@/lib/i18n';
import { SPONSOR_EMAIL } from '@/lib/links';
import { SPONSOR } from '@/lib/sponsor';

const CONTACT_HREF = `mailto:${SPONSOR_EMAIL}?subject=${encodeURIComponent('Astra Games sponsorship')}`;

/**
 * One sponsor placement. Rendered on the server with no third-party script, so
 * it adds nothing to the client bundle and never varies between regenerations.
 * While the slot is open it pitches itself and links to the sponsorship inbox.
 */
export default function SponsorSlot({ dict }: { dict: Dictionary }) {
  const { label, pitch, cta } = dict.sponsor;
  const sponsor = SPONSOR;

  return (
    <aside
      aria-label={label}
      className="mb-10 flex flex-col gap-4 rounded-[var(--radius-card)] border border-dashed border-[var(--palette-border-strong)] bg-white/[0.02] px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-center gap-4">
        <span className="t-micro shrink-0 text-[var(--palette-text-tertiary)]">{label}</span>
        {sponsor ? (
          <span className="flex min-w-0 items-center gap-3">
            {sponsor.logo ? (
              // A plain <img>: the custom image loader only knows built cover widths.
              <img src={sponsor.logo} alt="" width={28} height={28} className="size-7 shrink-0 rounded-[var(--radius-subtle)] object-contain" />
            ) : null}
            <span className="t-body min-w-0 text-[var(--palette-text-secondary)]">
              <strong className="font-semibold text-[var(--palette-text-primary)]">{sponsor.name}</strong>
              {' — '}
              {sponsor.tagline}
            </span>
          </span>
        ) : (
          <p className="t-body min-w-0 text-[var(--palette-text-secondary)]">{pitch}</p>
        )}
      </div>
      <a
        href={sponsor ? sponsor.url : CONTACT_HREF}
        {...(sponsor ? { target: '_blank', rel: 'sponsored noopener' } : {})}
        className="inline-flex min-h-11 shrink-0 items-center justify-center self-start rounded-[var(--radius-standard)] border border-[var(--palette-border-strong)] px-4 t-body-med transition-[border-color,background-color] duration-200 hover:border-[var(--palette-rausch)] hover:bg-white/[0.05] sm:self-auto"
      >
        {sponsor ? sponsor.name : cta}
      </a>
    </aside>
  );
}
