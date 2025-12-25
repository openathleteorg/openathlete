'use client';

import heroImage from '@/assets/images/landing/hero.png';
import { AnimatedBlobs } from '@/components/landing/animated-blobs';
import { Container } from '@/components/landing/container';
import { ImagePlaceholder } from '@/components/landing/image-placeholder';
import { Stat } from '@/components/landing/stat';
import { Button } from '@/components/ui/button';
import { APP_URL } from '@/config';
import { m } from '@/paraglide/messages';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

declare global {
  interface Window {
    gtag_report_conversion?: (url?: string) => boolean;
  }
}

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
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/10 py-20 md:py-32">
      {/* Fond avec quadrillage amélioré */}
      <div className="absolute inset-0 z-0 bg-grid-pattern-fine [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.4))] dark:[mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.2))]" />

      {/* Boules colorées animées */}
      <AnimatedBlobs />

      {/* Gradient overlay pour adoucir les bords */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-background/80 via-transparent to-background/60 pointer-events-none" />

      <Container>
        <motion.div
          className="relative z-10 mx-auto max-w-3xl text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 leading-[1.1] pb-1"
            variants={titleVariants}
          >
            {m.landing_hero_title()}
          </motion.h1>

          <motion.p
            className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl"
            variants={itemVariants}
          >
            {m.landing_hero_subtitle()}
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            variants={itemVariants}
          >
            <Button size="lg" asChild className="group">
              <Link href={signupUrl} onClick={handleSignupClick}>
                {m.landing_hero_cta_primary()}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#how-it-works">{m.landing_hero_cta_secondary()}</a>
            </Button>
          </motion.div>

          <motion.div
            className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3"
            variants={itemVariants}
          >
            <Stat value={m.landing_hero_proof_1()} />
            <Stat value={m.landing_hero_proof_2()} />
            <Stat value={m.landing_hero_proof_3()} />
          </motion.div>

          <motion.div className="mt-12" variants={itemVariants}>
            <p className="text-sm text-muted-foreground">
              {m.landing_integrations_note()}
            </p>
          </motion.div>
        </motion.div>

        {/* Hero Image - Dashboard screenshot or platform overview */}
        <motion.div
          className="relative z-10 mt-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.6,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <ImagePlaceholder
            description="OpenAthlete dashboard showing training calendar, load metrics, and fatigue alerts"
            imageAlt="OpenAthlete platform dashboard overview with training calendar, load metrics, and fatigue prevention alerts"
            aspectRatio="16/9"
            imageSrc={heroImage}
          />
        </motion.div>
      </Container>
    </section>
  );
}
