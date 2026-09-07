import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import ProcessTimeline from '@/components/ProcessTimeline';
import Reveal from '@/components/Reveal';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import WorksExplorer from '@/components/WorksExplorer';
import MagneticButton from '@/components/MagneticButton';
import { loadCatalog, README_URL } from '@/lib/catalog';

// Matches the catalogue service's own five-minute freshness window, so the
// rendered page and the JSON API never drift apart by more than one interval.
export const revalidate = 300;

const UPSTREAM = 'https://github.com/MartinDelophy/awesome-gpt-6-astra';
const SUBMIT = `${UPSTREAM}/issues/new?template=submit-game.yml`;

const MARQUEE = [
  '单键飞行', '半流体物理', '海岛塔防', '卡丁车竞速', '粒子艺术',
  '球形世界探索', '程序化美术', 'Web Audio', 'Three.js', 'Canvas 2D',
  '原生 WebGL', 'One Shot 测试', '多轮迭代',
];

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Shanghai',
  }).format(date);
}

export default async function HomePage() {
  const catalog = await loadCatalog();
  const works = catalog.works;

  const authorCount = new Set(
    works.map((work) => work.author.name.trim().toLowerCase()).filter(Boolean),
  ).size;
  const playableCount = works.filter((work) => work.demoUrl).length;

  return (
    <>
      <SiteHeader />

      <main>
        <Hero
          workCount={works.length}
          authorCount={authorCount}
          playableCount={playableCount}
          checkedAt={formatDate(catalog.source.lastSuccessfulAt ?? catalog.source.checkedAt)}
          stale={catalog.source.stale}
        />

        <Marquee items={MARQUEE} />

        {/* --- Catalogue ---------------------------------------------------- */}
        <section id="works" className="shell scroll-mt-24 py-24 sm:py-32">
          <Reveal>
            <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="t-micro text-[var(--palette-rausch)]">作品目录</p>
                <h2 className="t-section phrase mt-3 max-w-[18ch]">
                  <span>收录即可玩，</span>
                  <span>不是一堆死链接</span>
                </h2>
              </div>
              <p className="t-body max-w-[42ch] text-[var(--palette-text-secondary)]">
                目录直接解析{' '}
                <a
                  href={README_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[var(--palette-text-primary)] underline decoration-[var(--palette-rausch)] decoration-2 underline-offset-4"
                >
                  上游 README
                </a>
                ，上游增删改后这里几分钟内自动跟上，本站不保存第二份作品数据。
              </p>
            </div>
          </Reveal>

          {catalog.source.stale && catalog.source.error ? (
            <p
              role="status"
              className="mb-8 rounded-[var(--radius-standard)] border border-[var(--palette-border-strong)] bg-white/[0.03] px-4 py-3 t-body text-[var(--palette-text-secondary)]"
            >
              {catalog.source.error}
            </p>
          ) : null}

          <Reveal threshold={0.05}>
            <WorksExplorer works={works} />
          </Reveal>
        </section>

        {/* --- How it works -------------------------------------------------- */}
        <section
          id="how"
          className="relative scroll-mt-24 overflow-hidden border-y border-[var(--palette-border)] bg-[var(--palette-bg-inset)] py-24 sm:py-32"
        >
          <div
            aria-hidden="true"
            className="aurora-blob left-[-10%] top-[10%] h-[34rem] w-[34rem] opacity-[0.18]"
            style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 68%)' }}
          />
          <div className="shell relative grid gap-14 lg:grid-cols-[0.85fr_1.15fr]">
            <Reveal>
              <div className="lg:sticky lg:top-28">
                <p className="t-micro text-[var(--palette-rausch)]">如何收录</p>
                <h2 className="t-section phrase mt-3 max-w-[14ch]">
                  <span>做完了，</span>
                  <span>四步就能挂上来</span>
                </h2>
                <p className="t-body mt-5 max-w-[38ch] text-[var(--palette-text-secondary)]">
                  这是一份社区清单。任何人都可以推荐自己或他人的公开作品，只要注明原作者。
                </p>
                <div className="mt-8">
                  <MagneticButton href={SUBMIT} external>
                    提交作品
                  </MagneticButton>
                </div>
              </div>
            </Reveal>
            <ProcessTimeline />
          </div>
        </section>

        {/* --- Closing CTA --------------------------------------------------- */}
        <section className="shell py-24 sm:py-32">
          <Reveal>
            <div className="relative overflow-hidden rounded-[var(--radius-large)] border border-[var(--palette-border)] bg-[var(--palette-bg-raised)] px-8 py-16 text-center elev-card sm:px-16">
              <div
                aria-hidden="true"
                className="aurora-blob left-1/2 top-[-30%] h-[30rem] w-[30rem] -translate-x-1/2 opacity-[0.28]"
                style={{ background: 'radial-gradient(circle, #ff385c 0%, transparent 66%)' }}
              />
              <div className="relative">
                <h2 className="t-section phrase mx-auto max-w-[20ch]">
                  <span>你用 Astra&nbsp;</span>
                  <span>做了什么？</span>
                </h2>
                <p className="t-feature mx-auto mt-5 max-w-[46ch] font-normal text-[var(--palette-text-secondary)]">
                  一个能跑的原型就够了。写清楚玩法、入口和模型参与了什么，剩下的交给目录。
                </p>
                <div className="mt-9 flex flex-wrap justify-center gap-3">
                  <MagneticButton href={SUBMIT} external>
                    提交你的作品
                  </MagneticButton>
                  <MagneticButton href={UPSTREAM} variant="ghost" external>
                    在 GitHub 上查看
                  </MagneticButton>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
