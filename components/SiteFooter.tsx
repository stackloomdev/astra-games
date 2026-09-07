import type { Dictionary } from '@/lib/i18n';
import {
  BROKEN_LINK_ISSUE, CONTRIBUTING, SUBMIT_ISSUE, UPSTREAM_REPO, X_PROFILE,
} from '@/lib/links';

export default function SiteFooter({
  dict,
  homeHref,
  readmeUrl,
}: {
  dict: Dictionary;
  homeHref: string;
  readmeUrl: string;
}) {
  const columns = [
    {
      heading: dict.footer.catalogue,
      items: [
        { label: dict.footer.links.works, href: `${homeHref}#works` },
        { label: dict.footer.links.how, href: `${homeHref}#how` },
        { label: dict.footer.links.upstream, href: readmeUrl, external: true },
        { label: dict.footer.links.mainRepo, href: UPSTREAM_REPO, external: true },
      ],
    },
    {
      heading: dict.footer.participate,
      items: [
        { label: dict.footer.links.submit, href: SUBMIT_ISSUE, external: true },
        { label: dict.footer.links.brokenLink, href: BROKEN_LINK_ISSUE, external: true },
        { label: dict.footer.links.contributing, href: CONTRIBUTING, external: true },
      ],
    },
  ];

  return (
    <footer id="about" className="relative overflow-hidden border-t border-[var(--palette-border)]">
      <div className="shell py-16">
        <div className="grid gap-12 md:grid-cols-[1.6fr_repeat(2,1fr)]">
          <div>
            <p className="t-ui-semi tracking-[-0.44px]">Astra Games</p>
            <p className="t-body mt-3 max-w-[42ch] text-[var(--palette-text-secondary)]">
              {dict.footer.disclaimer}
            </p>
            <p className="t-small mt-5 max-w-[42ch] text-[var(--palette-text-tertiary)]">
              {dict.footer.license}
            </p>

            {/* "X" is the same word everywhere, so it needs no dictionary entry;
                the accessible name spells out where the link goes. */}
            <a
              href={X_PROFILE}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Astra Games on X"
              className="mt-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--palette-border-strong)] text-[var(--palette-text-secondary)] transition-[border-color,background-color,color] duration-200 hover:border-[var(--palette-rausch)] hover:bg-white/[0.05] hover:text-[var(--palette-text-primary)]"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                <path d="M13.6 10.6 21 2h-1.8l-6.4 7.4L7.7 2H2l7.8 11.3L2 22h1.8l6.8-7.9 5.4 7.9H22l-8.4-11.4zm-2.4 2.8-.8-1.1L4.4 3.3h2.7l5 7.2.8 1.1 6.5 9.3h-2.7l-5.5-7.9z" />
              </svg>
            </a>
          </div>

          {columns.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <p className="t-micro text-[var(--palette-text-tertiary)]">{column.heading}</p>
              <ul className="mt-4 flex flex-col gap-[10px]">
                {column.items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      {...('external' in item && item.external
                        ? { target: '_blank', rel: 'noreferrer noopener' }
                        : {})}
                      className="t-body text-[var(--palette-text-secondary)] transition-colors duration-200 hover:text-[var(--palette-rausch)]"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {/* Oversized wordmark, clipped by the viewport edge. */}
      <div aria-hidden="true" className="relative select-none overflow-hidden">
        <p className="grad-brand whitespace-nowrap px-[2vw] text-center text-[clamp(4rem,17vw,15rem)] font-extrabold leading-[0.82] tracking-[-0.05em] opacity-[0.16]">
          ASTRA GAMES
        </p>
      </div>
    </footer>
  );
}
