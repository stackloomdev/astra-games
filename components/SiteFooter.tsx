import type { Dictionary } from '@/lib/i18n';
import {
  BROKEN_LINK_ISSUE, COMMUNITY, CONTRIBUTING, SITE_REPO, SUBMIT_ISSUE, UPSTREAM_REPO,
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
    {
      heading: dict.footer.project,
      items: [
        { label: dict.footer.links.mainRepo, href: UPSTREAM_REPO, external: true },
        { label: dict.footer.links.siteSource, href: SITE_REPO, external: true },
        { label: 'LINUX DO', href: COMMUNITY, external: true },
      ],
    },
  ];

  return (
    <footer id="about" className="relative overflow-hidden border-t border-[var(--palette-border)]">
      <div className="shell py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <p className="t-ui-semi tracking-[-0.44px]">Astra Games</p>
            <p className="t-body mt-3 max-w-[42ch] text-[var(--palette-text-secondary)]">
              {dict.footer.disclaimer}
            </p>
            <p className="t-small mt-5 max-w-[42ch] text-[var(--palette-text-tertiary)]">
              {dict.footer.license}
            </p>
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
