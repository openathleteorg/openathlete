'use client';

import heroImage from '@/assets/images/landing/hero.png';
import { Container } from '@/components/landing/container';
import { ImagePlaceholder } from '@/components/landing/image-placeholder';
import { Stat } from '@/components/landing/stat';
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

export function Hero() {
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
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20 py-20 md:py-32">
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-800 dark:[mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
      <Container>
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            {m.landing_hero_title()}
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
            {m.landing_hero_subtitle()}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="group">
              <Link href={signupUrl} onClick={handleSignupClick}>
                {m.landing_hero_cta_primary()}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#how-it-works">{m.landing_hero_cta_secondary()}</a>
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <Stat value={m.landing_hero_proof_1()} />
            <Stat value={m.landing_hero_proof_2()} />
            <Stat value={m.landing_hero_proof_3()} />
          </div>

          <div className="mt-12">
            <p className="text-sm text-muted-foreground">
              {m.landing_integrations_note()}
            </p>
          </div>
        </div>

        {/* Hero Image - Dashboard screenshot or platform overview */}
        <div className="mt-20">
          <ImagePlaceholder
            description="OpenAthlete dashboard showing training calendar, load metrics, and fatigue alerts"
            imageAlt="OpenAthlete platform dashboard overview with training calendar, load metrics, and fatigue prevention alerts"
            aspectRatio="16/9"
            imageSrc={heroImage}
          />
        </div>
      </Container>
    </section>
  );
}
