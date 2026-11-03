import { APP_URL } from '@/config';
import { DEFAULT_LOCALE, isSupportedLocale } from '@/utils/locales';
import { NextRequest, NextResponse } from 'next/server';

/**
 * English pages live at the root, the other languages under /<locale>.
 * Unprefixed paths are always English, whatever the browser asks for:
 * search engines must see one language per URL. Visitors whose browser
 * prefers another language get a banner suggesting it (LocaleSuggestion).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  const lowerFirst = first?.toLowerCase();

  // /pt-BR/... and other case variants: one URL per page
  if (first && first !== lowerFirst && isSupportedLocale(lowerFirst)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${[lowerFirst, ...segments.slice(1)].join('/')}`;
    return NextResponse.redirect(url, 308);
  }

  const hasLocale = isSupportedLocale(first);
  const rest = hasLocale ? segments.slice(1) : segments;

  // Old links to the login page
  if (rest.length === 2 && rest[0] === 'auth' && rest[1] === 'login') {
    return NextResponse.redirect(`${APP_URL}/auth/login`, 308);
  }

  // /en/... duplicates the root
  if (first === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = `/${segments.slice(1).join('/')}`;
    return NextResponse.redirect(url, 308);
  }

  if (hasLocale) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Pages only: no Next internals, metadata routes, social images or files
  matcher: [
    '/((?!api|_next|og|sitemap.xml|robots.txt|manifest.webmanifest|icon.png|.*\\.[a-zA-Z0-9]+$).*)',
  ],
};
