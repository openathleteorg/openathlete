import { SITE_URL } from '@/config';
import type { MetadataRoute } from 'next';

const locales = ['en', 'fr'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;
  const now = new Date();

  const pages = [
    { path: '', priority: 1, changeFrequency: 'weekly' as const },
    { path: '/privacy-policy', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/legal-notice', priority: 0.5, changeFrequency: 'monthly' as const },
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Generate entries for each page and locale
  for (const page of pages) {
    for (const locale of locales) {
      const url = locale === 'en' 
        ? `${baseUrl}${page.path}`
        : `${baseUrl}/${locale}${page.path}`;
      
      sitemapEntries.push({
        url,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: Object.fromEntries(
            locales.map((loc) => [
              loc,
              loc === 'en' 
                ? `${baseUrl}${page.path}`
                : `${baseUrl}/${loc}${page.path}`,
            ])
          ),
        },
      });
    }
  }

  return sitemapEntries;
}

