'use client';

import { BrandLogo } from '@/components/landing/brand-logo';
import { Container } from '@/components/landing/container';
import { APP_URL, BUY_ME_A_COFFEE_URL } from '@/config';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { isConsentRequired, setConsent } from '@/utils/analytics';
import { DEFAULT_LOCALE, isSupportedLocale } from '@/utils/locales';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();
  const locale = getLocale();

  // Extract locale from pathname or use current locale
  const pathSegments = pathname.split('/').filter(Boolean);
  const currentLocale = isSupportedLocale(pathSegments[0])
    ? pathSegments[0]
    : isSupportedLocale(locale)
      ? locale
      : DEFAULT_LOCALE;

  // Build localized URLs - always use explicit locale to avoid middleware rewriting
  const getLocalizedPath = (path: string) => {
    return `/${currentLocale}${path}`;
  };

  const loginUrl = `${APP_URL}/auth/login`;
  const signupUrl = `${APP_URL}/auth/create-account`;

  return (
    <footer className="relative overflow-hidden border-t border-border/40 bg-gradient-to-b from-muted/30 via-background to-muted/20 py-16 dark:from-muted/15 dark:to-background">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/80 to-transparent"
        aria-hidden
      />
      <Container className="relative z-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-6">
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
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {m.footer_product()}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href={loginUrl}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {m.login()}
                </Link>
              </li>
              <li>
                <Link
                  href={signupUrl}
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
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
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
                <a
                  href="https://github.com/openathleteorg/openathlete"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://docs.openathlete.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href={BUY_ME_A_COFFEE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {m.buy_me_a_coffee()}
                </a>
              </li>
            </ul>
          </div>

          {/* Connecteurs */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {m.footer_connectors()}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href={getLocalizedPath('/connect/garmin')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Garmin
                </Link>
              </li>
              <li>
                <Link
                  href={getLocalizedPath('/connect/strava')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Strava
                </Link>
              </li>
              <li>
                <Link
                  href={getLocalizedPath('/connect/suunto')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Suunto
                </Link>
              </li>
              <li>
                <Link
                  href={getLocalizedPath('/connect/polar')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Polar
                </Link>
              </li>
              <li>
                <Link
                  href={getLocalizedPath('/connect/coros')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  COROS
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {m.footer_legal()}
            </h3>
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
                <Link
                  href={getLocalizedPath('/terms-of-sale')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {m.footer_terms_of_sale()}
                </Link>
              </li>
              {isConsentRequired() && (
                <li>
                  <button
                    type="button"
                    onClick={() => setConsent(null)}
                    className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {m.footer_consent_settings()}
                  </button>
                </li>
              )}
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
