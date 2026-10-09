'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { adsAllowed, bannerForWidth, bannerMarkup, BANNERS, CONSENT_KEY, createAdQueue, GLOBAL_ADS, NATIVE_KEY, SMARTLINK } from '@/lib/adsterra';

type Choice = 'accepted' | 'declined' | null;
const AdsContext = createContext({ enabled: false, zh: false });
const enqueue = createAdQueue();
const started = new WeakSet<HTMLElement>();
function stillConsented() {
  try { return localStorage.getItem(CONSENT_KEY) === 'accepted'; } catch { return false; }
}

export function AdvertisingProvider({ children, locale }: { children: ReactNode; locale: string }) {
  const path = usePathname();
  const [choice, setChoice] = useState<Choice>(null);
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState(false);
  const zh = locale === 'zh-CN';
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const enabled = ready && choice === 'accepted' && adsAllowed(host, path);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONSENT_KEY);
      if (saved === 'accepted' || saved === 'declined') setChoice(saved);
    } catch { /* A choice can still be made for the current page. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!enabled) return;
    for (const ad of GLOBAL_ADS) {
      if (document.getElementById(ad.id)) continue;
      const script = document.createElement('script');
      script.id = ad.id;
      script.setAttribute('data-cfasync', 'false');
      script.src = ad.src;
      document[ad.target].appendChild(script);
    }
  }, [enabled]);
  function choose(next: Exclude<Choice, null>) {
    try { localStorage.setItem(CONSENT_KEY, next); } catch { /* No persistent storage available. */ }
    const withdrawing = choice === 'accepted' && next === 'declined';
    setChoice(next);
    setSettings(false);
    // Reload removes the third-party scripts and any handlers they installed.
    if (withdrawing) window.location.reload();
  }
  return <AdsContext.Provider value={{ enabled, zh }}>
    {children}
    {ready && <button className="ad-settings" onClick={() => setSettings(true)}>{zh ? '广告设置' : 'Ad settings'}</button>}
    {ready && (choice === null || settings) && <section className="ad-consent" role="dialog" aria-modal="false" aria-labelledby="ad-consent-title">
      <div><strong id="ad-consent-title">{zh ? '广告与 Cookie 选择' : 'Advertising & cookie choices'}</strong>
        <p>{zh ? '同意后，本网站将加载 Adsterra 广告（包括弹窗和悬浮广告）。广告合作方可能使用 Cookie、IP 地址和设备信息进行广告投放、统计及反欺诈。拒绝后仍可浏览全部作品。' : 'With your permission, we load Adsterra ads, including popunders and floating ads. Advertising partners may use cookies, your IP address and device information for advertising, measurement and fraud prevention. You can browse all works if you decline.'} <a href={`/${zh ? 'zh-CN' : 'en'}/privacy`}>{zh ? '隐私说明' : 'Privacy notice'}</a></p>
      </div>
      <div className="ad-consent-actions"><button onClick={() => choose('declined')}>{zh ? '拒绝广告 Cookie' : 'Decline ad cookies'}</button><button onClick={() => choose('accepted')}>{zh ? '同意并继续' : 'Accept & continue'}</button></div>
    </section>}
  </AdsContext.Provider>;
}

export function AdBanner({ rectangle = false }: { rectangle?: boolean }) {
  const { enabled, zh } = useContext(AdsContext);
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ key: string; width: number; height: number } | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      if (started.has(element)) return;
      setSize(rectangle ? (element.clientWidth >= 300 ? BANNERS.rectangle : null) : bannerForWidth(element.clientWidth));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [rectangle]);
  useEffect(() => {
    const element = ref.current;
    if (!enabled || !size || !element) return;
    void enqueue(async () => {
      if (!element.isConnected || started.has(element) || !stillConsented() || !adsAllowed(location.hostname, location.pathname)) return;
      started.add(element);
      const { default: postscribe } = await import('postscribe');
      if (!element.isConnected || !stillConsented()) return;
      await new Promise<void>((resolve) => postscribe(element, bannerMarkup(size), { done: resolve, error: () => resolve() }));
    }).catch(() => { /* An unavailable ad must never stop the catalogue. */ });
  }, [enabled, size]);
  return <aside className={`ad-slot ${rectangle ? 'ad-rectangle' : 'ad-leaderboard'}`} aria-label={zh ? '广告' : 'Advertisement'}>
    <span className="ad-label">{zh ? '广告' : 'Advertisement'}</span>
    <div ref={ref} className="ad-banner-host" style={{ minHeight: size?.height ?? (rectangle ? 250 : 90) }} />
  </aside>;
}

export function NativeAd() {
  const { enabled, zh } = useContext(AdsContext);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element || started.has(element)) return;
    started.add(element);
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = `https://bicea.org/21/${NATIVE_KEY}`;
    element.appendChild(script);
  }, [enabled]);
  return <aside className="ad-slot ad-native" aria-label={zh ? '广告' : 'Advertisement'}>
    <span className="ad-label">{zh ? '广告' : 'Advertisement'}</span>
    <div ref={ref}><div id={`container-${NATIVE_KEY}`} /></div>
  </aside>;
}

export function SponsoredOffers() {
  const { enabled, zh } = useContext(AdsContext);
  if (!enabled) return null;
  return <div className="ad-offers"><span className="ad-label">{zh ? '广告' : 'Advertisement'}</span><a href={SMARTLINK} target="_blank" rel="sponsored noopener noreferrer">{zh ? '查看赞助商推广 ↗' : 'Explore sponsored offers ↗'}</a></div>;
}
