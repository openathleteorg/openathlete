import type { BlogPost } from '@/content/blog/types';
import { type SupportedLocale, localePath } from '@/utils/locales';

export function postHref(locale: SupportedLocale, post: BlogPost) {
  return localePath(locale, `/blog/${post.metadata.slug}`);
}
