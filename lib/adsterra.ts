export const AD_HOST = 'astragames.aigccreative.com';
export const CONSENT_KEY = 'astra-ad-consent-v1';
export const SMARTLINK = 'https://arwf.org/4/02136891cd5e3c14177cf28df443c36c';
export const GLOBAL_ADS = [
  { id: 'astra-social-bar', src: 'https://bicea.org/14/95086edd12585303ad57f6de57f152dc', target: 'body' },
] as const;
export const NATIVE_KEY = 'e56e2513b7bdba55a8fbe1807e479a71';
export const BANNERS = {
  rectangle: { key: '6f52a0901dff3d9c876c0fe73e1a0e9b', width: 300, height: 250 },
  desktop: { key: 'd3dd7442c60329a96ce990040f3efe2d', width: 728, height: 90 },
  mobile: { key: '958e63997f98410c8a57df63646988e1', width: 320, height: 50 },
} as const;
export function adsAllowed(host: string, path: string) {
  return host === AD_HOST && /^\/[a-z]{2}(?:-[A-Z]{2})?(?:\/?|\/works\/[^/]+\/?$)$/.test(path);
}
export function bannerForWidth(width: number) {
  return width >= 728 ? BANNERS.desktop : width >= 320 ? BANNERS.mobile : null;
}
export function bannerMarkup(banner: { key: string; width: number; height: number }) {
  return `<script>atOptions = {'key':'${banner.key}','format':'iframe','height':${banner.height},'width':${banner.width},'params':{}};</script><script src="https://bicea.org/22/${banner.key}"></script>`;
}
// Serial execution prevents concurrent atOptions assignments from changing another tag.
export function createAdQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return (job: () => Promise<void>) => {
    const next = tail.then(job);
    tail = next.catch(() => undefined);
    return next;
  };
}
