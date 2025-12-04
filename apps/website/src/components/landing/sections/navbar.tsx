'use client';

import { BrandLogo } from '@/components/landing/brand-logo';
import { Container } from '@/components/landing/container';
import { LanguageSwitcher } from '@/components/landing/language-switcher';
import { Button } from '@/components/ui/button';
import { APP_URL } from '@/config';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
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

  // Build localized home URL - always use explicit locale to avoid middleware rewriting
  const homeUrl = `/${currentLocale}`;

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href={homeUrl} className="flex items-center gap-2">
            <BrandLogo className="h-6 w-auto" />
            <span className="text-xl font-bold tracking-tight">
              OpenAthlete
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <a href="#how-it-works">{m.landing_hero_cta_secondary()}</a>
            </Button>
            <Button asChild>
              <Link href={`${APP_URL}/login`}>{m.login()}</Link>
            </Button>
            <LanguageSwitcher />
          </div>
        </div>
      </Container>
    </nav>
  );
}
