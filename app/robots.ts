import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/links';

export default function robots(): MetadataRoute.Robots {
  return {
    // The preview route proxies remote images and has no indexable content.
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
