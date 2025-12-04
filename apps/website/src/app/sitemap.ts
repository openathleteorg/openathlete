import { SITE_URL } from '@/config';
import { getAllPosts } from '@/content/blog';
import type { MetadataRoute } from 'next';

const locales = ['en', 'fr'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;
  const now = new Date();

  const pages = [
    {
      path: '',
      priority: 1,
      changeFrequency: 'weekly' as const,
      lastModified: now, // Homepage changes frequently
    },
    {
      path: '/blog',
      priority: 0.8,
      changeFrequency: 'weekly' as const,
      lastModified: now, // Blog page changes when new articles are added
    },
    {
      path: '/privacy-policy',
      priority: 0.5,
      changeFrequency: 'monthly' as const,
      lastModified: new Date('2024-01-01'), // Set to last known update date
    },
    {
      path: '/legal-notice',
      priority: 0.5,
      changeFrequency: 'monthly' as const,
      lastModified: new Date('2024-01-01'), // Set to last known update date
    },
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Generate entries for each page and locale
  for (const page of pages) {
    for (const locale of locales) {
      const url =
        locale === 'en'
          ? `${baseUrl}${page.path}`
          : `${baseUrl}/${locale}${page.path}`;

      sitemapEntries.push({
        url,
        lastModified: page.lastModified,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: Object.fromEntries(
            locales.map((loc) => [
              loc,
              loc === 'en'
                ? `${baseUrl}${page.path}`
                : `${baseUrl}/${loc}${page.path}`,
            ]),
          ),
        },
      });
    }
  }

  // Add blog posts
  const blogPosts = getAllPosts();
  for (const post of blogPosts) {
    for (const locale of locales) {
      const url =
        locale === 'en'
          ? `${baseUrl}/blog/${post.metadata.slug}`
          : `${baseUrl}/${locale}/blog/${post.metadata.slug}`;

      sitemapEntries.push({
        url,
        lastModified: post.metadata.updatedAt
          ? new Date(post.metadata.updatedAt)
          : new Date(post.metadata.publishedAt),
        changeFrequency: 'monthly',
        priority: 0.7,
        alternates: {
          languages: Object.fromEntries(
            locales.map((loc) => [
              loc,
              loc === 'en'
                ? `${baseUrl}/blog/${post.metadata.slug}`
                : `${baseUrl}/${loc}/blog/${post.metadata.slug}`,
            ]),
          ),
        },
      });
    }
  }

  return sitemapEntries;
}
