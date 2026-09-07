const UPSTREAM = 'https://github.com/MartinDelophy/awesome-gpt-6-astra';

const LINKS = [
  {
    heading: '目录',
    items: [
      { label: '作品目录', href: '#works' },
      { label: '如何收录', href: '#how' },
      { label: '上游 README', href: `${UPSTREAM}#readme`, external: true },
    ],
  },
  {
    heading: '参与',
    items: [
      { label: '提交游戏', href: `${UPSTREAM}/issues/new?template=submit-game.yml`, external: true },
      { label: '反馈失效链接', href: `${UPSTREAM}/issues/new?template=broken-link.yml`, external: true },
      { label: '贡献指南', href: `${UPSTREAM}/blob/main/CONTRIBUTING.md`, external: true },
    ],
  },
  {
    heading: '项目',
    items: [
      { label: '主仓库', href: UPSTREAM, external: true },
      { label: '官网源码', href: 'https://github.com/stackloomdev/astra-games', external: true },
      { label: 'LINUX DO', href: 'https://linux.do/', external: true },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer id="about" className="relative overflow-hidden border-t border-[var(--palette-border)]">
      <div className="shell py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <p className="t-ui-semi tracking-[-0.44px]">Astra Games</p>
            <p className="t-body mt-3 max-w-[38ch] text-[var(--palette-text-secondary)]">
              社区维护的 GPT-6 Astra 作品清单，与 OpenAI 无隶属关系。收录表示值得探索，不代表性能评测或官方推荐。
            </p>
            <p className="t-small mt-5 text-[var(--palette-text-tertiary)]">
              清单文字与视觉素材以 CC0 1.0 贡献至公有领域；链接指向的作品仍遵循各自许可。
            </p>
          </div>

          {LINKS.map((column) => (
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
