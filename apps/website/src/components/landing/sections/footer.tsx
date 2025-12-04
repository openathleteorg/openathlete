'use client';

import { BrandLogo } from '@/components/landing/brand-logo';
import { Container } from '@/components/landing/container';
import { APP_URL } from '@/config';
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
    <footer className="border-t bg-muted/30 py-16">
      <Container>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              href={getLocalizedPath('/')}
              className="flex items-center gap-2 mb-4"
            >
              <BrandLogo className="h-6 w-auto" />
              <span className="text-lg font-semibold tracking-tight">
                OpenAthlete
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              {m.footer_description()}
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold mb-4">{m.footer_product()}</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href={`${APP_URL}/auth/login`}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {m.login()}
                </Link>
              </li>
              <li>
                <Link
                  href={`${APP_URL}/auth/create-account`}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {m.footer_signup()}
                </Link>
              </li>
              <li>
                <Link
                  href={getLocalizedPath('/#pricing')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {m.footer_pricing()}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold mb-4">
              {m.footer_resources()}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href={getLocalizedPath('/blog')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {m.blog_title()}
                </Link>
              </li>
              <li>
                <Link
                  href={getLocalizedPath('/tools')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {m.footer_tools()}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold mb-4">{m.footer_legal()}</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href={getLocalizedPath('/privacy-policy')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {m.footer_privacy()}
                </Link>
              </li>
              <li>
                <Link
                  href={getLocalizedPath('/legal-notice')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {m.footer_legal_notice()}
                </Link>
              </li>
              <li>
                <a
                  href="mailto:contact@openathlete.org"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {m.footer_contact()}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} OpenAthlete. {m.footer_rights()}
          </p>
        </div>
      </Container>
    </footer>
  );
}
