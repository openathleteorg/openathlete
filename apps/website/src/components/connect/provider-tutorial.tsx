'use client';

import { Container } from '@/components/landing/container';
import { Section } from '@/components/landing/section';
import { m } from '@/paraglide/messages';
import { motion } from 'framer-motion';
import { CheckCircle, MousePointerClick, Settings } from 'lucide-react';
import * as React from 'react';

type Provider = 'GARMIN' | 'STRAVA' | 'SUUNTO' | 'POLAR';

interface ProviderTutorialProps {
  provider: Provider;
}

const stepIcons = [Settings, MousePointerClick, CheckCircle];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
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

const getStepMessages = (provider: Provider, step: number) => {
  const key = provider.toLowerCase() as
    | 'garmin'
    | 'strava'
    | 'suunto'
    | 'polar';
  return {
    title: (
      m[
        `connect_${key}_tutorial_step_${step}_title` as keyof typeof m
      ] as () => string
    )(),
    description: (
      m[
        `connect_${key}_tutorial_step_${step}_description` as keyof typeof m
      ] as () => string
    )(),
  };
};

export function ProviderTutorial({ provider }: ProviderTutorialProps) {
  const steps = [1, 2, 3].map((step) => ({
    step,
    Icon: stepIcons[step - 1],
    ...getStepMessages(provider, step),
  }));

  return (
    <Section id="tutorial" className="bg-background">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {(
              m[
                `connect_${provider.toLowerCase()}_tutorial_title` as keyof typeof m
              ] as () => string
            )()}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {(
              m[
                `connect_${provider.toLowerCase()}_tutorial_subtitle` as keyof typeof m
              ] as () => string
            )()}
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="space-y-8"
          >
            {steps.map(({ step, Icon, title, description }) => (
              <motion.div
                key={step}
                variants={itemVariants}
                className="group relative overflow-hidden rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-6">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-primary bg-primary/10">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 text-sm font-medium text-muted-foreground">
                      {m.connect_tutorial_step_label({ step: step.toString() })}
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">{title}</h3>
                    <p className="text-muted-foreground">{description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Success message */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-12 rounded-2xl border-2 border-green-500/20 bg-green-500/5 p-8 text-center"
          >
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
            <h3 className="text-xl font-semibold">
              {(
                m[
                  `connect_${provider.toLowerCase()}_tutorial_success` as keyof typeof m
                ] as () => string
              )()}
            </h3>
          </motion.div>
        </div>
      </Container>
    </Section>
  );
}
