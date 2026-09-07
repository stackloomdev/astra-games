import CountUp from './CountUp';
import KineticHeadline from './KineticHeadline';
import MagneticButton from './MagneticButton';
import Reveal from './Reveal';
import StarField from './StarField';

const UPSTREAM = 'https://github.com/MartinDelophy/awesome-gpt-6-astra';
const SUBMIT = `${UPSTREAM}/issues/new?template=submit-game.yml`;

interface HeroProps {
  workCount: number;
  authorCount: number;
  playableCount: number;
  checkedAt: string | null;
  stale: boolean;
}

export default function Hero({
  workCount,
  authorCount,
  playableCount,
  checkedAt,
  stale,
}: HeroProps) {
  const stats = [
    { value: workCount, suffix: '', label: '收录作品' },
    { value: authorCount, suffix: '', label: '参与创作者' },
    { value: playableCount, suffix: '', label: '可直接试玩' },
  ];

  return (
    <section id="top" className="relative isolate overflow-hidden pt-[68px]">
      {/* --- Backdrop layers, furthest to nearest ------------------------- */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-veil" />
        <div
          className="aurora-blob left-[-14%] top-[-16%] h-[46rem] w-[46rem] opacity-[0.38]"
          style={{ background: 'radial-gradient(circle, #ff385c 0%, transparent 66%)' }}
        />
        <div
          className="aurora-blob right-[-18%] top-[6%] h-[42rem] w-[42rem] opacity-[0.34] [animation-delay:-9s]"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 66%)' }}
        />
        <div
          className="aurora-blob bottom-[-24%] left-[26%] h-[38rem] w-[38rem] opacity-[0.26] [animation-delay:-17s]"
          style={{ background: 'radial-gradient(circle, #92174d 0%, transparent 68%)' }}
        />
        <StarField />
        {/* Grounds the hero into the page below instead of ending on a seam. */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[var(--palette-bg)]" />
      </div>

      <div className="shell flex min-h-[max(620px,92svh)] flex-col justify-center pb-20 pt-14 sm:pt-16">
        <Reveal>
          <a
            href={UPSTREAM}
            target="_blank"
            rel="noreferrer noopener"
            className="group inline-flex items-center gap-[10px] rounded-[var(--radius-badge)] border border-[var(--palette-border-strong)] bg-white/[0.04] py-[7px] pl-[9px] pr-4 backdrop-blur-sm transition-[border-color,background-color] duration-300 hover:border-[var(--palette-rausch)] hover:bg-white/[0.08]"
          >
            <span className="relative flex h-[7px] w-[7px]">
              <span
                className={`absolute inline-flex h-full w-full rounded-full ${
                  stale ? 'bg-[var(--palette-text-tertiary)]' : 'bg-[var(--palette-rausch)]'
                } opacity-75 [animation:pulse-ring_2.2s_var(--ease-out-soft)_infinite]`}
              />
              <span
                className={`relative inline-flex h-[7px] w-[7px] rounded-full ${
                  stale ? 'bg-[var(--palette-text-tertiary)]' : 'bg-[var(--palette-rausch)]'
                }`}
              />
            </span>
            <span className="t-badge text-[var(--palette-text-secondary)]">
              {stale ? '目录暂用最近缓存' : '目录实时同步上游 README'}
            </span>
            <svg
              viewBox="0 0 16 16"
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
              className="text-[var(--palette-text-tertiary)] transition-transform duration-300 group-hover:translate-x-[3px]"
            >
              <path d="M6 3.5L10.5 8 6 12.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </Reveal>

        <KineticHeadline
          className="t-display mt-6 max-w-[19ch] text-balance"
          lines={['Games worth playing.', 'Ideas worth building.']}
          accentLine={1}
          startDelay={140}
        />

        <Reveal delay={620}>
          <p className="t-feature mt-6 max-w-[46ch] font-normal text-[var(--palette-text-secondary)]">
            用 <span className="text-[var(--palette-text-primary)]">GPT-6 Astra</span>{' '}
            做出来的游戏、交互实验与艺术沙盒精选。每一条都写清楚玩什么、在哪里玩、模型参与了什么。
          </p>
        </Reveal>

        <Reveal delay={740}>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <MagneticButton href="#works">
              浏览作品目录
              <svg
                viewBox="0 0 16 16"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </MagneticButton>
            <MagneticButton href={SUBMIT} variant="ghost" external>
              提交你的作品
            </MagneticButton>
          </div>
        </Reveal>

        <Reveal delay={880}>
          <dl className="mt-14 flex flex-wrap gap-x-12 gap-y-7 border-t border-[var(--palette-border)] pt-8">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="t-micro text-[var(--palette-text-tertiary)]">{stat.label}</dt>
                <dd className="mt-[6px] text-[2.25rem] font-bold leading-none tracking-[-0.035em]">
                  <CountUp to={stat.value} suffix={stat.suffix} />
                </dd>
              </div>
            ))}
            {checkedAt ? (
              <div className="ml-auto self-end">
                <dt className="sr-only">最近核对</dt>
                <dd className="t-small text-[var(--palette-text-tertiary)]">
                  最近核对 {checkedAt}
                </dd>
              </div>
            ) : null}
          </dl>
        </Reveal>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
      >
        <span className="t-micro text-[var(--palette-text-tertiary)]">Scroll</span>
        <span className="h-9 w-px bg-gradient-to-b from-[var(--palette-rausch)] to-transparent [animation:float-y_2.4s_var(--ease-in-out-soft)_infinite]" />
      </div>
    </section>
  );
}
