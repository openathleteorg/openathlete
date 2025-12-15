'use client';

import { AnimatedBlobs } from '@/components/landing/animated-blobs';
import { Container } from '@/components/landing/container';
import { ProviderLogo } from '@/components/providers/provider-logos';
import { Button } from '@/components/ui/button';
import { APP_URL } from '@/config';
import { m } from '@/paraglide/messages';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { BrandLogo } from '../landing/brand-logo';

type Provider = 'GARMIN' | 'STRAVA' | 'SUUNTO' | 'POLAR';

interface ProviderHeroProps {
  provider: Provider;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

const titleVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

const getProviderMessages = (provider: Provider) => {
  const key = provider.toLowerCase() as
    | 'garmin'
    | 'strava'
    | 'suunto'
    | 'polar';
  return {
    title: (m[`connect_${key}_hero_title` as keyof typeof m] as () => string)(),
    subtitle: (
      m[`connect_${key}_hero_subtitle` as keyof typeof m] as () => string
    )(),
    cta: (m[`connect_${key}_hero_cta` as keyof typeof m] as () => string)(),
  };
};

export function ProviderHero({ provider }: ProviderHeroProps) {
  const messages = getProviderMessages(provider);

  return (
    <section className="relative overflow-hidden border-b bg-background py-20 sm:py-32">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 bg-grid-pattern-fine opacity-30" />
      <AnimatedBlobs />
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-background/80 via-background/40 to-background" />

      <Container className="relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-4xl text-center"
        >
          {/* Logos */}
          <motion.div
            variants={itemVariants}
            className="mb-8 flex items-center justify-center gap-6"
          >
            <ProviderLogo provider={provider} className="h-12 w-auto" />
            <div className="h-px w-12 bg-border" />
            <BrandLogo className="h-18 w-auto" />
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={titleVariants}
            className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
          >
            {messages.title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            {messages.subtitle}
          </motion.p>

          {/* CTA */}
          <motion.div
            variants={itemVariants}
            className="flex justify-center gap-4"
          >
            <Button asChild size="lg" className="group">
              <Link href={`${APP_URL}/auth/create-account`}>
                {messages.cta}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
