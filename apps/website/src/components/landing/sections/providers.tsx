'use client';

import { GarminLogo, PolarLogo, StravaLogo, SuuntoLogo } from '@/assets/icons';
import { BrandLogo } from '@/components/landing/brand-logo';
import { Container } from '@/components/landing/container';
import { Section } from '@/components/landing/section';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { motion } from 'framer-motion';

export function Providers() {
  return (
    <Section id="providers">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {m.landing_providers_title()}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {m.landing_providers_subtitle()}
          </p>
        </div>

        <div className="mt-8 mx-auto w-full max-w-md">
          <div className="relative aspect-square w-full">
            {/* Orbits: thicker and higher-contrast dashed borders */}
            <div className="absolute inset-[10%] rounded-full border border-dashed border-foreground/10" />
            <div className="absolute inset-[20%] rounded-full border border-dashed border-foreground/10" />
            <div className="absolute inset-[30%] rounded-full border border-dashed border-foreground/10" />
            <div className="absolute inset-[38%] rounded-full border border-dashed border-foreground/10" />

            {/* Orbiting logos positioned at top-center of each ring */}
            <motion.div
              className="absolute inset-[10%]"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, ease: 'linear', duration: 28 }}
            >
              <LogoDot className="left-1/2 -translate-x-1/2 top-0 -translate-y-1/2">
                <StravaLogo className="h-4 w-auto" />
              </LogoDot>
            </motion.div>

            <motion.div
              className="absolute inset-[20%]"
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, ease: 'linear', duration: 34 }}
            >
              <LogoDot className="left-1/2 -translate-x-1/2 top-0 -translate-y-1/2">
                <GarminLogo className="h-5 w-auto" />
              </LogoDot>
            </motion.div>

            <motion.div
              className="absolute inset-[30%]"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, ease: 'linear', duration: 30 }}
            >
              <LogoDot className="left-1/2 -translate-x-1/2 top-0 -translate-y-1/2">
                <SuuntoLogo className="h-5 w-auto" />
              </LogoDot>
            </motion.div>

            <motion.div
              className="absolute inset-[38%]"
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, ease: 'linear', duration: 24 }}
            >
              <LogoDot className="left-1/2 -translate-x-1/2 top-0 -translate-y-1/2">
                <PolarLogo className="h-10 w-auto" />
              </LogoDot>
            </motion.div>

            {/* Center OpenAthlete logo */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <BrandLogo className="h-8 w-auto opacity-90" />
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function LogoDot({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('absolute flex items-center justify-center', className)}>
      {children}
    </div>
  );
}
