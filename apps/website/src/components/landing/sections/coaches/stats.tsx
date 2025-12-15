'use client';

import { Container } from '@/components/landing/container';
import { Section } from '@/components/landing/section';
import { m } from '@/paraglide/messages';
import { motion } from 'framer-motion';
import { ArrowUpRight, Clock, ShieldCheck, TrendingUp, Users } from 'lucide-react';

const stats = [
  {
    value: m.coaches_stats_item_1(),
    Icon: Users,
    gradient: 'from-blue-500/10 to-blue-600/5',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    value: m.coaches_stats_item_2(),
    Icon: Clock,
    gradient: 'from-purple-500/10 to-purple-600/5',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    value: m.coaches_stats_item_3(),
    Icon: ShieldCheck,
    gradient: 'from-green-500/10 to-green-600/5',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    value: m.coaches_stats_item_4(),
    Icon: TrendingUp,
    gradient: 'from-orange-500/10 to-orange-600/5',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export function CoachesStats() {
  return (
    <Section id="stats" className="bg-muted/20">
      <Container>
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {m.coaches_stats_title()}
          </h2>
        </motion.div>

        <motion.div
          className="mx-auto mt-20 max-w-6xl"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map(({ value, Icon, gradient, iconColor }, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group relative overflow-hidden rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-lg hover:border-primary/20"
              >
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="mb-4 flex items-center justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm border shadow-sm transition-transform group-hover:scale-110`}>
                      <Icon className={`h-6 w-6 ${iconColor}`} />
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  
                  <div className="text-3xl font-bold tracking-tight text-foreground leading-tight">
                    {value}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}

