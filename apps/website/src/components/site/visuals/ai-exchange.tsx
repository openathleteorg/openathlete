'use client';

import { motion, useInView, useReducedMotion } from 'framer-motion';
import { CalendarCheck, Sparkles } from 'lucide-react';
import { useRef } from 'react';

/** A prompt and its answer appearing one after the other. */
export function AiExchange({
  prompt,
  reply,
  via,
  tools = ['move_sessions', 'update_session'],
}: {
  prompt: string;
  reply: string;
  via: string;
  /** MCP tools the answer called, shown under it. */
  tools?: string[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const reduce = useReducedMotion();
  const show = inView || reduce;
  const appear = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 12 },
    animate: show ? { opacity: 1, y: 0 } : {},
    transition: { delay, duration: 0.5, ease: [0.21, 0.65, 0.3, 1] as const },
  });

  return (
    <div ref={ref} className="grid gap-4">
      <motion.div
        {...appear(0)}
        className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-white/10 px-4 py-3 text-[0.95rem] text-white"
      >
        {prompt}
      </motion.div>
      <motion.div {...appear(0.9)} className="flex max-w-[92%] gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky via-orchid to-coral text-ink">
          <Sparkles className="size-4" />
        </span>
        <div className="rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.04] px-4 py-3 text-[0.95rem] text-white/85">
          {reply}
          <motion.span
            {...appear(1.6)}
            className="mt-3 flex w-fit items-center gap-1.5 rounded-full bg-mint/15 px-2.5 py-1 font-mono text-[0.7rem] text-mint"
          >
            <CalendarCheck className="size-3.5" />
            {tools.join(' · ')}
          </motion.span>
        </div>
      </motion.div>
      <motion.p
        {...appear(1.8)}
        className="pl-11 font-mono text-[0.7rem] text-white/40"
      >
        {via}
      </motion.p>
    </div>
  );
}
