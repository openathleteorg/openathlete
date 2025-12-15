'use client';

import { motion } from 'framer-motion';
import * as React from 'react';

interface BlobProps {
  className?: string;
  delay?: number;
  duration?: number;
}

function Blob({ className, delay = 0, duration = 20 }: BlobProps) {
  return (
    <motion.div
      className={className}
      animate={{
        x: [
          '0%',
          '10%',
          '-5%',
          '15%',
          '0%',
          '-10%',
          '5%',
          '0%',
        ],
        y: [
          '0%',
          '-15%',
          '10%',
          '-5%',
          '5%',
          '15%',
          '-10%',
          '0%',
        ],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: 'easeInOut',
      }}
    />
  );
}

export function AnimatedBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Boule bleue - haut gauche */}
      <Blob
        className="absolute top-[10%] left-[10%] w-96 h-96 rounded-full bg-blue-500/15 blur-[120px] dark:bg-blue-400/8"
        delay={0}
        duration={25}
      />
      
      {/* Boule violette - haut droite */}
      <Blob
        className="absolute top-[20%] right-[15%] w-80 h-80 rounded-full bg-purple-500/15 blur-[100px] dark:bg-purple-400/8"
        delay={5}
        duration={30}
      />
      
      {/* Boule rose - centre gauche */}
      <Blob
        className="absolute top-[50%] left-[5%] w-72 h-72 rounded-full bg-pink-500/15 blur-[90px] dark:bg-pink-400/8"
        delay={10}
        duration={22}
      />
      
      {/* Boule cyan - centre droite */}
      <Blob
        className="absolute top-[40%] right-[10%] w-64 h-64 rounded-full bg-cyan-500/15 blur-[80px] dark:bg-cyan-400/8"
        delay={7}
        duration={28}
      />
      
      {/* Boule indigo - bas centre */}
      <Blob
        className="absolute bottom-[15%] left-[50%] w-96 h-96 rounded-full bg-indigo-500/15 blur-[110px] dark:bg-indigo-400/8"
        delay={12}
        duration={26}
      />
    </div>
  );
}

