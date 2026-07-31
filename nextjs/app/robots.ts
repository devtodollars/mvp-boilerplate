import type { MetadataRoute } from 'next';
import { getURL } from '@/utils/helpers';

// Without this file /robots.txt 404s. A 404 is harmless (crawlers read it as
// "no rules, crawl everything"), but serving a real file lets us keep the
// authenticated and API surface out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/account', '/auth/']
    },
    sitemap: getURL('sitemap.xml')
  };
}
