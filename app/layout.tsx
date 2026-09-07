import type { Metadata, Viewport } from 'next';
import { Figtree, Noto_Sans_SC } from 'next/font/google';
import './globals.css';

/* Figtree stands in for Airbnb Cereal VF, which is a commissioned typeface and
   is not licensed for third-party use. Figtree matches Cereal's geometric
   skeleton and rounded terminals, and covers the 500–700 range the design
   system depends on. */
const figtree = Figtree({
  variable: '--font-figtree',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const notoSansSC = Noto_Sans_SC({
  variable: '--font-noto-sc',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

const SITE_URL = 'https://astragames.aigccreative.com';
const DESCRIPTION =
  '用 GPT-6 Astra 做出来的游戏、实验与交互作品精选。目录实时同步上游 awesome-gpt-6-astra，收录即可玩。';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Astra Games — GPT-6 Astra 作品精选',
    template: '%s · Astra Games',
  },
  description: DESCRIPTION,
  keywords: ['GPT-6 Astra', 'AI 游戏', 'awesome list', 'vibe coding', '浏览器游戏', 'AI 创作'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Astra Games',
    title: 'Astra Games — GPT-6 Astra 作品精选',
    description: DESCRIPTION,
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Astra Games — GPT-6 Astra 作品精选',
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0d0b0f',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${figtree.variable} ${notoSansSC.variable}`}>
      <body>{children}</body>
    </html>
  );
}
