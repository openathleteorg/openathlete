'use client';

import { Container } from '@/components/landing/container';
import { Section } from '@/components/landing/section';
import { Button } from '@/components/ui/button';
import { APP_URL } from '@/config';
import { m } from '@/paraglide/messages';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

declare global {
  interface Window {
    gtag_report_conversion?: (url?: string) => boolean;
  }
}

export function FinalCTA() {
  const signupUrl = `${APP_URL}/auth/create-account`;

  const handleSignupClick = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  ) => {
    e.preventDefault();
    if (typeof window !== 'undefined' && window.gtag_report_conversion) {
      window.gtag_report_conversion(signupUrl);
    } else {
      // Fallback if gtag is not loaded yet
      window.location.href = signupUrl;
    }
  };

  return (
    <Section className="bg-primary text-primary-foreground">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {m.landing_finalcta_title()}
          </h2>
          <p className="mt-6 text-lg leading-8 opacity-90">
            {m.landing_finalcta_subtitle()}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="secondary" asChild className="group">
              <Link href={signupUrl} onClick={handleSignupClick}>
                {m.landing_finalcta_primary()}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/10 bg-primary-foreground/5"
              asChild
            >
              <a
                href="mailto:contact@openathlete.org"
                className="hover:text-primary-foreground"
              >
                {m.landing_finalcta_secondary()}
              </a>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
