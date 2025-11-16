import { cn } from '@/utils/shadcn';
import { HTMLMotionProps, motion } from 'framer-motion';
import * as React from 'react';

interface SectionProps
  extends Omit<
    HTMLMotionProps<'section'>,
    'initial' | 'whileInView' | 'viewport' | 'transition'
  > {
  children: React.ReactNode;
  className?: string;
  animateOnScroll?: boolean;
}

export function Section({
  children,
  className,
  animateOnScroll = true,
  ...props
}: SectionProps) {
  return (
    <motion.section
      initial={animateOnScroll ? { opacity: 0, y: 20 } : false}
      whileInView={animateOnScroll ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={cn('py-16 md:py-24', className)}
      {...props}
    >
      {children}
    </motion.section>
  );
}
