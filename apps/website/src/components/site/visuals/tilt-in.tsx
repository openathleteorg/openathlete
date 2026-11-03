'use client';

import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { type ReactNode, useRef } from 'react';

/**
 * Lays its content back a few degrees and stands it up as it scrolls into
 * the middle of the screen. Used for the hero screenshot.
 */
export function TiltIn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const rotateX = useTransform(progress, [0, 1], [14, 0]);
  const scale = useTransform(progress, [0, 1], [0.94, 1]);

  return (
    <div ref={ref} className={className} style={{ perspective: 1600 }}>
      <motion.div
        style={reduce ? undefined : { rotateX, scale, transformOrigin: 'top' }}
      >
        {children}
      </motion.div>
    </div>
  );
}
