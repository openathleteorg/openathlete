'use client';

import { BrandLogo } from '@/components/landing/brand-logo';
import { Container } from '@/components/landing/container';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();
  const locale = getLocale();

  // Extract locale from pathname or use current locale
  const pathSegments = pathname.split('/').filter(Boolean);
  const currentLocale =
    pathSegments[0] === 'fr' || pathSegments[0] === 'en'
      ? pathSegments[0]
      : locale === 'fr'
        ? 'fr'
        : 'en';

  // Build localized URLs - always use explicit locale to avoid middleware rewriting
  const getLocalizedPath = (path: string) => {
    return `/${currentLocale}${path}`;
  };

  return (
    <footer className="border-t bg-muted/30 py-12">
      <Container>
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
            <Link
              href={getLocalizedPath('/')}
              className="flex items-center gap-2"
            >
              <BrandLogo className="h-6 w-auto" />
              <span className="text-lg font-semibold tracking-tight">
                OpenAthlete
              </span>
            </Link>
            <nav className="flex gap-4 text-sm text-muted-foreground">
              <Link
                href={getLocalizedPath('/legal-notice')}
                className="hover:text-foreground transition-colors"
              >
                {m.landing_footer_legal().split(' · ')[0]}
              </Link>
              <Link
                href={getLocalizedPath('/privacy-policy')}
                className="hover:text-foreground transition-colors"
              >
                {m.landing_footer_legal().split(' · ')[1]}
              </Link>
              <a
                href="mailto:contact@openathlete.org"
                className="hover:text-foreground transition-colors"
              >
                {m.landing_footer_legal().split(' · ')[2]}
              </a>
            </nav>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} OpenAthlete. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
