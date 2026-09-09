'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { Work } from '@/lib/catalog';
import type { Dictionary, Locale } from '@/lib/i18n';
import { optimizedPreview, workHref } from '@/lib/work-url';

const ADVANCE_MS = 4200;
const CARD_ASPECT = 1.6;
/** Pointer travel, as a fraction of the canvas width, that advances one card. */
const DRAG_PER_CARD = 0.34;
/** Below this the gesture was a click, not a drag. */
const CLICK_SLOP_PX = 6;

/**
 * The hero's right half: the catalogue's covers as a 3D carousel, draggable,
 * with a mirrored floor.
 *
 * Two animation systems, deliberately kept apart. Card placement is driven by a
 * single `position` value; pointer parallax moves the *camera* and nothing
 * else. The CSS version this replaces drove both through one `transform` with a
 * 900ms transition, so every pointer move restarted the card tween and the deck
 * swam around under the cursor.
 *
 * three is imported dynamically, and only above the lg breakpoint where the
 * carousel is actually shown.
 */
export default function HeroCarousel3D({
  works,
  locale,
  dict,
  className = '',
}: {
  works: Work[];
  locale: Locale;
  dict: Dictionary;
  className?: string;
}) {
  const router = useRouter();
  const mount = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  // The carousel is hidden below lg. CSS alone would still run the effect and
  // pull three's ~700 KB chunk onto phones to render something invisible, so
  // the viewport gates the import itself.
  const [enabled, setEnabled] = useState(false);
  // The render loop reads these without re-running the effect.
  const activeRef = useRef(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const sync = () => setEnabled(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const node = mount.current;
    if (!enabled || !node || !works.length) return;

    let disposed = false;
    let cleanup = () => {};

    (async () => {
      let THREE: typeof import('three');
      try {
        THREE = await import('three');
      } catch {
        if (!disposed) setFailed(true);
        return;
      }
      if (disposed) return;

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      let renderer: import('three').WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      } catch {
        setFailed(true);
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearAlpha(0);
      node.appendChild(renderer.domElement);
      const canvas = renderer.domElement;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      canvas.style.cursor = 'grab';
      // Horizontal drags rotate the carousel; vertical ones must still scroll
      // the page, so only the horizontal axis is claimed.
      canvas.style.touchAction = 'pan-y';

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(0, 0, 2.5);

      const geometry = new THREE.PlaneGeometry(CARD_ASPECT, 1, 1, 1);
      const loader = new THREE.TextureLoader();

      const vertexShader = `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;
      // Rounded corners, rim light and depth dimming from the plane's own UVs.
      // uReflect turns the same material into the mirrored copy: dimmer, and
      // fading out with distance from the card it reflects.
      const fragmentShader = `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uMap;
        uniform float uHasMap;
        uniform float uDim;
        uniform float uOpacity;
        uniform float uReflect;
        uniform vec3 uFallback;

        float roundedBox(vec2 p, vec2 b, float r) {
          vec2 q = abs(p) - b + r;
          return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
        }

        void main() {
          // Do not name this 'half' -- that is a reserved word in GLSL ES, and
          // using it fails the whole shader compile, leaving the canvas blank.
          vec2 halfSize = vec2(${(CARD_ASPECT / 2).toFixed(3)}, 0.5);
          vec2 p = (vUv - 0.5) * vec2(${CARD_ASPECT.toFixed(3)}, 1.0);
          float d = roundedBox(p, halfSize, 0.075);
          float alpha = 1.0 - smoothstep(-0.006, 0.006, d);
          if (alpha <= 0.001) discard;

          vec3 color = uHasMap > 0.5 ? texture2D(uMap, vUv).rgb : uFallback;
          color *= uDim;
          color += smoothstep(0.012, 0.0, abs(d)) * 0.30 * (1.0 - uReflect);

          if (uReflect > 0.5) {
            // The mirror is flipped vertically, so its vUv.y = 1 edge is the one
            // furthest from the card. The fade has to reach zero before the
            // bottom of the frame, or the reflection is sliced off mid-opacity
            // instead of dissolving.
            alpha *= 0.34 * (1.0 - smoothstep(0.02, 0.44, vUv.y));
            color *= 0.72;
          }

          gl_FragColor = vec4(color, alpha * uOpacity);
        }
      `;

      interface Card {
        index: number;
        material: import('three').ShaderMaterial;
        mirrorMaterial: import('three').ShaderMaterial;
        mesh: import('three').Mesh;
        mirror: import('three').Mesh;
      }

      const makeMaterial = (reflect: boolean) =>
        new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          uniforms: {
            uMap: { value: null },
            uHasMap: { value: 0 },
            uDim: { value: 1 },
            uOpacity: { value: 1 },
            uReflect: { value: reflect ? 1 : 0 },
            uFallback: { value: new THREE.Color('#241b2c') },
          },
        });

      const textures: import('three').Texture[] = [];
      const cards: Card[] = works.map((work, index) => {
        const material = makeMaterial(false);
        const mirrorMaterial = makeMaterial(true);

        loader.load(
          // The card is never wider than a few hundred CSS pixels on screen;
          // uploading the full screenshot would cost ~5 MB of VRAM per card.
          optimizedPreview(work, locale, 640),
          (texture) => {
            if (disposed) {
              texture.dispose();
              return;
            }
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            for (const target of [material, mirrorMaterial]) {
              target.uniforms.uMap.value = texture;
              target.uniforms.uHasMap.value = 1;
            }
            textures.push(texture);
            // Covers arrive one by one and the loop may be idle — off-screen or
            // in a background tab. Paint the new one straight away.
            renderer.render(scene, camera);
          },
          undefined,
          () => {
            /* A cover that will not load keeps its flat fallback colour. */
          },
        );

        const mesh = new THREE.Mesh(geometry, material);
        const mirror = new THREE.Mesh(geometry, mirrorMaterial);
        mesh.userData.index = index;
        scene.add(mesh, mirror);
        return { index, material, mirrorMaterial, mesh, mirror };
      });

      // --- Layout -----------------------------------------------------------
      /** Shortest signed distance from the active card, so the ring wraps. */
      const signedOffset = (index: number, from: number) => {
        const n = works.length;
        return ((((index - from) % n) + n + n / 2) % n) - n / 2;
      };

      const CARD_BOTTOM = -0.5;
      const MIRROR_GAP = 0.045;
      // Lift the whole arrangement so the reflection has room to fade out
      // inside the canvas instead of being cut off at its bottom edge.
      const GROUP_Y = 0.15;
      let position = 0;
      const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

      const layout = () => {
        for (const card of cards) {
          const offset = signedOffset(card.index, position);
          const distance = Math.abs(offset);
          const side = Math.sign(offset);

          const x = side * (0.52 * Math.min(distance, 1) + 0.34 * Math.max(distance - 1, 0));
          const y = GROUP_Y + distance * -0.03;
          const z = -distance * 0.62;
          const scale = 1 - Math.min(distance, 2.4) * 0.05;
          const rotY = -offset * 0.5;
          const rotZ = side * Math.min(distance, 1) * -0.02;

          card.mesh.position.set(x, y, z);
          card.mesh.rotation.set(0, rotY, rotZ);
          card.mesh.scale.setScalar(scale);

          // Mirrored across the plane just under the card's bottom edge.
          card.mirror.position.set(x, y + (CARD_BOTTOM - MIRROR_GAP) * 2 * scale, z);
          card.mirror.rotation.set(0, rotY, -rotZ);
          card.mirror.scale.set(scale, -scale, scale);

          const dim = 1 - Math.min(distance, 2.4) * 0.22;
          const opacity = distance > 2.6 ? 0 : 1;
          card.material.uniforms.uDim.value = dim;
          card.material.uniforms.uOpacity.value = opacity;
          card.mirrorMaterial.uniforms.uDim.value = dim;
          card.mirrorMaterial.uniforms.uOpacity.value = opacity;

          card.mesh.renderOrder = Math.round(100 - distance * 10);
          card.mirror.renderOrder = Math.round(50 - distance * 10);
        }
      };

      const resize = () => {
        const rect = node.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        renderer.setSize(rect.width, rect.height, false);
        camera.aspect = rect.width / rect.height;
        // Framed so the front card fills roughly three fifths of the view
        // height; narrower containers pull back so the fan does not overrun.
        camera.position.z = 2.5 + Math.max(0, 1.45 - camera.aspect) * 1.6;
        camera.updateProjectionMatrix();
      };

      resize();
      layout();
      renderer.render(scene, camera);
      setReady(true);

      // --- Drag -------------------------------------------------------------
      const drag = { active: false, pointerId: -1, startX: 0, startPosition: 0, moved: 0 };

      const onPointerDown = (event: PointerEvent) => {
        if (event.button !== 0) return;
        drag.active = true;
        drag.pointerId = event.pointerId;
        drag.startX = event.clientX;
        drag.startPosition = position;
        drag.moved = 0;
        canvas.setPointerCapture(event.pointerId);
        canvas.style.cursor = 'grabbing';
      };

      const onPointerUp = (event: PointerEvent) => {
        if (!drag.active || event.pointerId !== drag.pointerId) return;
        drag.active = false;
        if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
        canvas.style.cursor = 'grab';
        // Settle on whichever card the gesture left nearest the front.
        const n = works.length;
        setActive(((Math.round(position) % n) + n) % n);
      };

      // --- Loop -------------------------------------------------------------
      let frame = 0;
      let onScreen = true;
      let lastAdvance = performance.now();

      const tick = (time: number) => {
        frame = requestAnimationFrame(tick);
        if (!onScreen || document.hidden) return;

        const busy = pausedRef.current || drag.active;
        if (!reduceMotion && !busy && time - lastAdvance > ADVANCE_MS) {
          lastAdvance = time;
          setActive((value) => (value + 1) % works.length);
        }
        if (busy) lastAdvance = time;

        if (!drag.active) {
          // Ease toward the active index along the shorter way around the ring.
          const delta = signedOffset(activeRef.current, position);
          position += delta * (reduceMotion ? 1 : 0.09);
        }

        // Parallax moves the camera only, so it settles quickly without
        // touching the card tween.
        pointer.x += (pointer.tx - pointer.x) * 0.08;
        pointer.y += (pointer.ty - pointer.y) * 0.08;
        camera.position.x = pointer.x * 0.42;
        camera.position.y = pointer.y * -0.20;
        camera.lookAt(0, 0, 0);

        layout();
        renderer.render(scene, camera);
      };
      frame = requestAnimationFrame(tick);

      // --- Input ------------------------------------------------------------
      const fine =
        window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion;

      const onPointerMove = (event: PointerEvent) => {
        if (drag.active && event.pointerId === drag.pointerId) {
          const dx = event.clientX - drag.startX;
          drag.moved = Math.max(drag.moved, Math.abs(dx));
          const width = canvas.getBoundingClientRect().width || 1;
          // Drag left to bring the next card forward.
          position = drag.startPosition - dx / (width * DRAG_PER_CARD);
          return;
        }
        if (!fine) return;
        const rect = node.getBoundingClientRect();
        pointer.tx = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
        pointer.ty = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
      };

      const raycaster = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      const onClick = (event: MouseEvent) => {
        // A gesture that travelled was a drag; it already chose a card.
        if (drag.moved > CLICK_SLOP_PX) return;
        const rect = canvas.getBoundingClientRect();
        ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(ndc, camera);
        const hit = raycaster.intersectObjects(cards.map((card) => card.mesh), false)[0];
        if (!hit) return;
        const index = hit.object.userData.index as number;
        // A card at the back is asking to come forward; the front one is asking
        // to be opened.
        if (index === activeRef.current) router.push(workHref(locale, works[index]));
        else setActive(index);
      };

      const onEnter = () => {
        pausedRef.current = true;
      };
      const onLeave = () => {
        pausedRef.current = false;
        pointer.tx = 0;
        pointer.ty = 0;
      };

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      canvas.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
      canvas.addEventListener('click', onClick);
      node.addEventListener('pointerenter', onEnter);
      node.addEventListener('pointerleave', onLeave);

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(node);
      const visibility = new IntersectionObserver(
        ([entry]) => {
          onScreen = entry.isIntersecting;
        },
        { threshold: 0.15 },
      );
      visibility.observe(node);

      cleanup = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
        canvas.removeEventListener('click', onClick);
        node.removeEventListener('pointerenter', onEnter);
        node.removeEventListener('pointerleave', onLeave);
        resizeObserver.disconnect();
        visibility.disconnect();
        // Everything allocated on the GPU has to be handed back explicitly.
        geometry.dispose();
        for (const card of cards) {
          card.material.dispose();
          card.mirrorMaterial.dispose();
        }
        textures.forEach((texture) => texture.dispose());
        renderer.dispose();
        canvas.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [enabled, works, locale, router]);

  if (!works.length) return null;
  const current = works[active] ?? works[0];

  return (
    <div className={className}>
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute inset-x-[10%] top-[14%] -z-10 aspect-[4/3] rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, #ff385c 0%, #8b5cf6 48%, transparent 70%)' }}
        />
        <div
          ref={mount}
          aria-hidden="true"
          className={`aspect-[4/3] w-full transition-opacity duration-700 ${
            ready && !failed ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      {/* The canvas is invisible to assistive tech and to crawlers, so the
          active work also exists here as ordinary text and a real link. */}
      <div className="mt-1 text-center">
        <p className="t-micro text-[var(--palette-rausch)]">
          {dict.works.categories[current.category] ?? dict.works.categories.other}
        </p>
        <a
          href={workHref(locale, current)}
          className="t-h2 mt-1 inline-block transition-colors duration-300 hover:text-[var(--palette-rausch)]"
        >
          {current.name}
        </a>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {works.map((work, index) => (
          <button
            key={work.id}
            type="button"
            onClick={() => setActive(index)}
            aria-label={work.name}
            aria-current={index === active}
            className={`h-[3px] rounded-full transition-[width,background-color] duration-500 [transition-timing-function:var(--ease-out-soft)] ${
              index === active
                ? 'w-7 bg-[var(--palette-rausch)]'
                : 'w-3 bg-[var(--palette-border-strong)] hover:bg-[var(--palette-text-tertiary)]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
