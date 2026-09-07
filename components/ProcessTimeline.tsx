'use client';

import { useEffect, useRef } from 'react';

const STEPS = [
  {
    n: '01',
    title: '做出可以体验的东西',
    body: '游戏、交互实验、艺术沙盒都算。原型也欢迎，不要求开源，但要能真的跑起来。',
  },
  {
    n: '02',
    title: '留下 Astra 的痕迹',
    body: '开发日志、原始 Prompt、迭代记录 —— 说明 GPT-6 Astra 具体参与了哪部分工作。没有依据的归因不会被写成事实。',
  },
  {
    n: '03',
    title: '提交一条 Issue',
    body: '附上试玩地址或带运行说明的源码仓库、一张实机截图，以及平台和使用条件。',
  },
  {
    n: '04',
    title: '合入目录，自动上线',
    body: '上游 README 合并后，本站在几分钟内自动同步，不需要任何人再改一次网站数据。',
  },
];

/**
 * Scroll-driven timeline. A gradient rail draws itself as the section passes
 * through the viewport and each step lifts in on its own trigger. GSAP is
 * imported dynamically so ScrollTrigger never reaches the server bundle, and
 * the whole effect is skipped under reduced motion.
 *
 * Every tween sets `immediateRender: false`, so a step is never pushed into its
 * dimmed "from" state before its trigger actually fires. Without that, a page
 * whose ScrollTrigger never activates — a hidden tab, a failed load — would
 * leave the steps stranded at quarter opacity.
 */
export default function ProcessTimeline() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const context = gsap.context(() => {
        gsap.fromTo(
          '[data-rail]',
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            immediateRender: false,
            scrollTrigger: {
              trigger: node,
              start: 'top 70%',
              end: 'bottom 75%',
              scrub: 0.6,
            },
          },
        );

        gsap.utils.toArray<HTMLElement>('[data-step]').forEach((step) => {
          gsap.fromTo(
            step,
            { opacity: 0.25, x: 26 },
            {
              opacity: 1,
              x: 0,
              duration: 0.7,
              ease: 'power3.out',
              immediateRender: false,
              scrollTrigger: { trigger: step, start: 'top 82%', once: true },
            },
          );

          gsap.fromTo(
            step.querySelector('[data-dot]'),
            { scale: 0.5, backgroundColor: '#211d29' },
            {
              scale: 1,
              backgroundColor: '#ff385c',
              duration: 0.45,
              ease: 'back.out(2.2)',
              immediateRender: false,
              scrollTrigger: { trigger: step, start: 'top 82%', once: true },
            },
          );
        });
      }, node);

      cleanup = () => context.revert();
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <div ref={root} className="relative pl-9 sm:pl-12">
      {/* Rail track + the portion that draws in on scroll. */}
      <div
        aria-hidden="true"
        className="absolute bottom-6 left-[9px] top-3 w-px bg-[var(--palette-border)] sm:left-3"
      />
      <div
        data-rail
        aria-hidden="true"
        className="absolute bottom-6 left-[9px] top-3 w-px origin-top bg-gradient-to-b from-[var(--palette-rausch)] via-[var(--palette-luxe-lift)] to-transparent sm:left-3"
      />

      <ol className="flex flex-col gap-12">
        {STEPS.map((step) => (
          <li key={step.n} data-step className="relative">
            <span
              data-dot
              aria-hidden="true"
              className="absolute -left-9 top-[9px] h-[9px] w-[9px] rounded-full bg-[var(--palette-control)] ring-4 ring-[var(--palette-bg)] sm:-left-12 sm:ml-[3px]"
            />
            <span className="t-micro text-[var(--palette-rausch)]">{step.n}</span>
            <h3 className="t-h2 mt-2">{step.title}</h3>
            <p className="t-body mt-[10px] max-w-[52ch] text-[var(--palette-text-secondary)]">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
