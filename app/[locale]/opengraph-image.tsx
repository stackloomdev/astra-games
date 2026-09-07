import { ImageResponse } from 'next/og';
import { loadCatalogFor } from '@/lib/catalog-service';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Astra Games — games and experiments built with GPT-6 Astra';
export const revalidate = 3600;

/**
 * Share card. The wordmark and tagline stay in Latin script for every language:
 * rendering CJK, Arabic or Devanagari here would mean shipping a font subset per
 * locale into the image renderer, and the localised sentence still reaches the
 * reader through the card's own description text.
 *
 * The work count is live but optional — if the catalogue cannot be reached the
 * card renders without it rather than failing and leaving no image at all.
 */
export default async function OpengraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;

  let workCount: number | null = null;
  try {
    workCount = (await loadCatalogFor(locale)).works.length;
  } catch {
    workCount = null;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          backgroundColor: '#0d0b0f',
          backgroundImage:
            'radial-gradient(900px circle at 12% 8%, rgba(255,56,92,0.34), transparent 55%),' +
            'radial-gradient(760px circle at 92% 22%, rgba(139,92,246,0.30), transparent 55%),' +
            'radial-gradient(700px circle at 62% 108%, rgba(146,23,77,0.28), transparent 60%)',
          color: '#f6f3f0',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#ff385c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
            }}
          >
            {/* Drawn, not typed: the image renderer's default font has no star
                glyph and would fall back to a tofu box. */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff">
              <path d="M12 1.8l2.6 6.2 6.7.5-5.1 4.4 1.6 6.6L12 16l-5.8 3.5 1.6-6.6L2.7 8.5l6.7-.5z" />
            </svg>
          </div>
          <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.6 }}>Astra Games</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2.6, lineHeight: 1.05 }}>
            Games worth playing.
          </div>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              letterSpacing: -2.6,
              lineHeight: 1.05,
              color: '#ff5b7a',
            }}
          >
            Ideas worth building.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', fontSize: 26, color: '#a9a2b4' }}>
          <div>
            {workCount === null
              ? 'Built with GPT-6 Astra'
              : `${workCount} works built with GPT-6 Astra`}
          </div>
          <div style={{ margin: '0 14px', color: '#ff385c' }}>·</div>
          <div>astragames.aigccreative.com</div>
        </div>
      </div>
    ),
    size,
  );
}
