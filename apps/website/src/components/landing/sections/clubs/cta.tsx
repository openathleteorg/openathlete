'use client';

import { Container } from '@/components/landing/container';
import { Section } from '@/components/landing/section';
import { Button } from '@/components/ui/button';
import { APP_URL } from '@/config';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function ClubsCTA() {
  const locale = getLocale();
  const localePath = locale === 'fr' ? '/fr' : '';
  const signupUrl = `${APP_URL}/auth/create-account`;
  const pricingUrl = `${localePath}/#pricing`;

  return (
    <Section id="cta">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/5 via-background to-primary/5 p-8 md:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {m.clubs_cta_title()}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {m.clubs_cta_subtitle()}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="group">
                <Link href={signupUrl}>
                  {m.clubs_cta_primary()}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href={pricingUrl}>{m.clubs_cta_secondary()}</Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
