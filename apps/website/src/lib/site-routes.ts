import { AI_BRAND_SLUGS } from '@/components/ai-brand/data';
import { CONNECTOR_SLUGS } from '@/components/connect/data';
import { getAllPosts, getPostLocales } from '@/content/blog';
import { COMPARISONS_CHECKED_ON, COMPETITORS } from '@/content/competitors';
import { learnTerms } from '@/content/learn';
import { paceChartPaths } from '@/lib/pace-charts/data';
import { RACES } from '@/lib/races/data';
import { listPlans } from '@/lib/training-plans/catalog';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/utils/locales';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export interface SiteRoute {
  /** Path without the locale prefix: '' for the home page. */
  path: string;
  /** Languages the page really exists in (fallback renders excluded). */
  locales: readonly SupportedLocale[];
  /** Date of the last real change to the content, when we know it. */
  lastModified?: string;
}

/** Dates of the last edit of pages whose text carries one. */
const KNOWN_DATES: Record<string, string> = {
  '/legal-notice': '2026-11-02',
  '/privacy-policy': '2026-11-02',
  '/terms-of-sale': '2026-10-05',
};

const APP_DIR = join(process.cwd(), 'src/app/[locale]');

/** Folders under app/[locale] with a page.tsx and no dynamic segment. */
function staticPaths(dir = APP_DIR, base = ''): string[] {
  if (!existsSync(dir)) return [];
  const paths: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      // Dynamic segments are listed from their data below; route groups
      // and private folders hold no public page of their own
      if (/^[[(_@]/.test(entry)) continue;
      paths.push(...staticPaths(full, `${base}/${entry}`));
    } else if (entry === 'page.tsx') {
      paths.push(base);
    }
  }
  return paths;
}

/** Pages that only redirect elsewhere: a sitemap must list final URLs. */
const REDIRECTS = new Set(['/ai', '/self-hosting']);

/** Every public page of the site, with the languages it exists in. */
export function siteRoutes(): SiteRoute[] {
  const routes: SiteRoute[] = staticPaths()
    .filter((path) => !REDIRECTS.has(path))
    .map((path) => ({
      path,
      locales: SUPPORTED_LOCALES,
      lastModified: KNOWN_DATES[path],
    }));

  for (const post of getAllPosts()) {
    routes.push({
      path: `/blog/${post.metadata.slug}`,
      locales: getPostLocales(post),
      lastModified: post.metadata.updatedAt ?? post.metadata.publishedAt,
    });
  }
  for (const plan of listPlans()) {
    routes.push({ path: plan.path, locales: plan.locales });
  }
  for (const competitor of COMPETITORS) {
    routes.push({
      path: `/compare/${competitor.slug}`,
      locales: SUPPORTED_LOCALES,
      lastModified: COMPARISONS_CHECKED_ON,
    });
  }
  for (const brand of AI_BRAND_SLUGS) {
    routes.push({ path: `/ai/${brand}`, locales: SUPPORTED_LOCALES });
  }
  for (const provider of CONNECTOR_SLUGS) {
    routes.push({ path: `/connect/${provider}`, locales: SUPPORTED_LOCALES });
  }
  for (const { distance, time } of paceChartPaths()) {
    routes.push({
      path: `/pace-charts/${distance}/${time}`,
      locales: SUPPORTED_LOCALES,
    });
  }
  for (const race of RACES) {
    routes.push({ path: `/races/${race.slug}`, locales: SUPPORTED_LOCALES });
  }
  for (const term of learnTerms) {
    routes.push({
      path: `/learn/${term.slug}`,
      locales: SUPPORTED_LOCALES,
      lastModified: term.updatedAt,
    });
  }

  return routes.sort((a, b) => a.path.localeCompare(b.path));
}
