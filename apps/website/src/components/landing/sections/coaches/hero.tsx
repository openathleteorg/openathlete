'use client';

import { AnimatedBlobs } from '@/components/landing/animated-blobs';
import { Container } from '@/components/landing/container';
import { Button } from '@/components/ui/button';
import { APP_URL } from '@/config';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
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
      ease: [0.22, 1, 0.36, 1],
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
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function CoachesHero() {
  const locale = getLocale();
  const localePath = locale === 'fr' ? '/fr' : '';
  const signupUrl = `${APP_URL}/auth/create-account`;
  const pricingUrl = `${localePath}/#pricing`;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/10 py-20 md:py-32">
      {/* Fond avec quadrillage amélioré */}
      <div className="absolute inset-0 z-0 bg-grid-pattern-fine [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.4))] dark:[mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.2))]" />
      
      {/* Boules colorées animées */}
      <AnimatedBlobs />
      
      {/* Gradient overlay pour adoucir les bords */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-background/80 via-transparent to-background/60 pointer-events-none" />
      
      <Container>
        <motion.div
          className="relative z-10 mx-auto max-w-4xl text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 leading-[1.1] pb-1"
            variants={titleVariants}
          >
            {m.coaches_hero_title()}
          </motion.h1>
          
          <motion.p
            className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl"
            variants={itemVariants}
          >
            {m.coaches_hero_subtitle()}
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            variants={itemVariants}
          >
            <Button size="lg" asChild className="group">
              <Link href={signupUrl}>
                {m.coaches_hero_cta_primary()}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href={pricingUrl}>{m.coaches_hero_cta_secondary()}</Link>
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

