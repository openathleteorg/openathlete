import { APP_URL } from '@/config';
import { NextRequest, NextResponse } from 'next/server';

const SUPPORTED_LOCALES = ['en', 'fr'] as const;
const DEFAULT_LOCALE = 'en';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/logo_') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|avif)$/)
  ) {
    return NextResponse.next();
  }

  // Check if locale is already in path (must be first segment)
  const pathSegments = pathname.split('/').filter(Boolean);
  const firstSegment = pathSegments[0];
  const pathnameHasLocale =
    firstSegment &&
    SUPPORTED_LOCALES.includes(
      firstSegment as (typeof SUPPORTED_LOCALES)[number],
    );

  // Check if path is /auth/login (with or without locale)
  const isAuthLogin =
    pathname === '/auth/login' ||
    (pathnameHasLocale &&
      pathSegments.length === 3 &&
      pathSegments[1] === 'auth' &&
      pathSegments[2] === 'login');

  // Redirect /auth/login to the web app
  if (isAuthLogin) {
    return NextResponse.redirect(`${APP_URL}/auth/login`);
  }

  if (pathnameHasLocale) {
    // Locale is already in path - pass through to [locale] route
    // Next.js will automatically match /en or /fr to [locale] route
    return NextResponse.next();
  }

  // Detect locale from Accept-Language header or default to 'en'
  const acceptLanguage = request.headers.get('accept-language');
  let locale = DEFAULT_LOCALE;

  if (acceptLanguage) {
    const preferredLocale = acceptLanguage
      .split(',')
      .map((lang) => lang.split(';')[0].trim().toLowerCase())
      .find((lang) => {
        const langCode = lang.split('-')[0];
        return SUPPORTED_LOCALES.includes(
          langCode as (typeof SUPPORTED_LOCALES)[number],
        );
      });

    if (preferredLocale) {
      locale = preferredLocale.split('-')[0] as typeof DEFAULT_LOCALE;
    }
  }

  // Rewrite to [locale] route (internal rewrite, URL stays the same)
  // For root path, rewrite to /[locale]/
  // For other paths, rewrite to /[locale]/path
  const rewritePath = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
  const newUrl = new URL(rewritePath, request.url);
  return NextResponse.rewrite(newUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
