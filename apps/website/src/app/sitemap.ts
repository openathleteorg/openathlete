import { siteRoutes } from '@/lib/site-routes';
import { languageAlternates, localizedUrl } from '@/utils/locales';
import type { MetadataRoute } from 'next';

/**
 * One entry per page and language, each listing its translations (with
 * `pt` and `x-default`). Pages shown in English for want of a translation
 * are left out. Dates only where the content carries a real one: a date
 * that changes on every build teaches search engines to ignore it.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return siteRoutes().flatMap(({ path, locales, lastModified }) =>
    locales.map((locale) => ({
      url: localizedUrl(locale, path),
      ...(lastModified && { lastModified: new Date(lastModified) }),
      alternates: { languages: languageAlternates(path, locales) },
    })),
  );
}
