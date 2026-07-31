import type { MetadataRoute } from 'next';
import { getURL } from '@/utils/helpers';

// Only the landing page is public. /account and /auth/* are behind auth and are
// disallowed in robots.ts, so they stay out of here.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: getURL(),
      changeFrequency: 'monthly',
      priority: 1
    }
  ];
}
