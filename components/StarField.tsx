'use client';

import { useEffect, useRef } from 'react';

interface Star {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  depth: number;
  hue: number;
  twinkle: number;
}

const HUES = ['255, 56, 92', '139, 92, 246', '255, 107, 138', '246, 243, 240'];

/**
 * The hero's signature motion: a slowly rotating orbital particle field that
 * leans toward the pointer. Canvas 2D rather than WebGL — a few hundred points
 * do not justify a 3D runtime, and this degrades cleanly everywhere.
 *
 * The loop is suspended when the canvas is off-screen or the tab is hidden, and
 * never starts at all under `prefers-reduced-motion`, where a single static
 * frame is painted instead.
 */
export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !context) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let frame = 0;
    let running = false;
    let rotation = 0;
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let stars: Star[] = [];

    const seed = () => {
      // Density tracks area so a phone does not pay for a desktop particle count.
      const count = Math.round(Math.min(260, Math.max(70, (width * height) / 9000)));
      stars = Array.from({ length: count }, () => {
        const depth = 0.25 + Math.random() * 0.75;
        return {
          angle: Math.random() * Math.PI * 2,
          radius: (0.12 + Math.random() * 0.95) * Math.min(width, height) * 0.62,
          speed: (0.00006 + Math.random() * 0.00022) * (Math.random() < 0.22 ? -1 : 1),
          size: (0.5 + Math.random() * 1.7) * depth,
          depth,
          hue: Math.random(),
          twinkle: Math.random() * Math.PI * 2,
        };
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const paint = (time: number) => {
      context.clearRect(0, 0, width, height);
      const centreX = width / 2 + pointer.x * 46;
      const centreY = height * 0.46 + pointer.y * 34;

      for (const star of stars) {
        const angle = star.angle + rotation * star.speed * 900;
        // Flattened ellipse reads as an orbital plane seen at a shallow angle.
        const x = centreX + Math.cos(angle) * star.radius;
        const y = centreY + Math.sin(angle) * star.radius * 0.42;
        const alpha =
          (0.18 + 0.55 * star.depth) *
          (0.6 + 0.4 * Math.sin(time * 0.0011 + star.twinkle));

        context.beginPath();
        context.fillStyle = `rgba(${HUES[Math.floor(star.hue * HUES.length)]}, ${alpha.toFixed(3)})`;
        context.arc(x, y, star.size, 0, Math.PI * 2);
        context.fill();
      }
    };

    const tick = (time: number) => {
      if (!running) return;
      rotation += 1;
      pointer.x += (pointer.targetX - pointer.x) * 0.045;
      pointer.y += (pointer.targetY - pointer.y) * 0.045;
      paint(time);
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || reduceMotion) return;
      running = true;
      frame = requestAnimationFrame(tick);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.targetX = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.targetY = (event.clientY / window.innerHeight) * 2 - 1;
    };

    const onVisibility = () => (document.hidden ? stop() : start());

    resize();
    if (reduceMotion) {
      paint(0);
    } else {
      start();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );
    visibilityObserver.observe(canvas);

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
