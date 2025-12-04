import { SITE_URL } from '@/config';
import { getAllPosts } from '@/content/blog';
import { readdirSync, statSync } from 'fs';
import type { MetadataRoute } from 'next';
import { join } from 'path';

const locales = ['en', 'fr'] as const;

/**
 * Recursively scan directory for page.tsx files and return their routes
 */
function scanRoutes(
  dir: string,
  basePath: string = '',
  routes: string[] = [],
): string[] {
  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip dynamic route segments (they start with [ or (...))
        if (entry.startsWith('[') || entry.startsWith('(')) {
          continue;
        }

        const newBasePath = basePath ? `${basePath}/${entry}` : `/${entry}`;
        scanRoutes(fullPath, newBasePath, routes);
      } else if (entry === 'page.tsx') {
        // Found a page.tsx file, add the route
        const route = basePath || '/';
        if (!routes.includes(route)) {
          routes.push(route);
        }
      }
    }
  } catch (error) {
    // If directory doesn't exist or can't be read, skip it
    console.error(`Could not scan directory ${dir}:`, error);
  }

  return routes;
}

/**
 * Get priority and changeFrequency based on route path
 */
function getRouteMetadata(path: string): {
  priority: number;
  changeFrequency:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
} {
  // Homepage
  if (path === '/') {
    return { priority: 1, changeFrequency: 'weekly' };
  }

  // Blog pages
  if (path.startsWith('/blog')) {
    return { priority: 0.8, changeFrequency: 'weekly' };
  }

  // Tools pages
  if (path.startsWith('/tools')) {
    return { priority: 0.7, changeFrequency: 'monthly' };
  }

  // Legal pages
  if (path === '/privacy-policy' || path === '/legal-notice') {
    return { priority: 0.5, changeFrequency: 'monthly' };
  }

  // Default for other pages
  return { priority: 0.6, changeFrequency: 'monthly' };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;
  const now = new Date();

  // Automatically discover all static routes
  // process.cwd() points to the Next.js app root (apps/website)
  const appDir = join(process.cwd(), 'src/app/[locale]');

  let staticRoutes: string[] = [];
  try {
    staticRoutes = scanRoutes(appDir);
  } catch (error) {
    console.error('Error scanning routes for sitemap:', error);
  }

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Generate entries for each static route and locale
  for (const route of staticRoutes) {
    const routeMetadata = getRouteMetadata(route);
    const lastModified =
      route === '/' || route.startsWith('/blog') || route.startsWith('/tools')
        ? now
        : new Date('2024-01-01');

    for (const locale of locales) {
      const url =
        locale === 'en' ? `${baseUrl}${route}` : `${baseUrl}/${locale}${route}`;

      sitemapEntries.push({
        url,
        lastModified,
        changeFrequency: routeMetadata.changeFrequency,
        priority: routeMetadata.priority,
        alternates: {
          languages: Object.fromEntries(
            locales.map((loc) => [
              loc,
              loc === 'en' ? `${baseUrl}${route}` : `${baseUrl}/${loc}${route}`,
            ]),
          ),
        },
      });
    }
  }

  // Add blog posts (dynamic routes)
  let blogPosts: ReturnType<typeof getAllPosts> = [];
  try {
    blogPosts = getAllPosts();
  } catch (error) {
    console.error('Error getting blog posts for sitemap:', error);
  }

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
