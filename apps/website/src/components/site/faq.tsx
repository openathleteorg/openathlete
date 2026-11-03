'use client';

import { track } from '@/utils/analytics';
import { cn } from '@/utils/shadcn';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export interface FaqEntry {
  question: string;
  answer: string;
}

/**
 * Answers stay in the HTML while closed (only their height animates), so
 * crawlers and the FAQPage JSON-LD see the same text.
 */
export function Faq({
  items,
  placement,
  tone = 'light',
}: {
  items: FaqEntry[];
  placement: string;
  tone?: 'light' | 'dark';
}) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div
      className={cn(
        'divide-y border-y',
        tone === 'dark'
          ? 'divide-white/10 border-white/10'
          : 'divide-border border-border',
      )}
    >
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <div key={item.question}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => {
                  setOpen(isOpen ? null : index);
                  if (!isOpen)
                    track('faq_opened', { placement, question: index + 1 });
                }}
                className="flex w-full items-center justify-between gap-6 py-5 text-left text-[1.02rem] font-medium"
              >
                {item.question}
                <Plus
                  className={cn(
                    'size-5 shrink-0 transition-transform duration-300',
                    isOpen && 'rotate-45',
                  )}
                />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              <motion.div
                initial={false}
                animate={{
                  height: isOpen ? 'auto' : 0,
                  opacity: isOpen ? 1 : 0,
                }}
                transition={{ duration: 0.3, ease: [0.21, 0.65, 0.3, 1] }}
                className="overflow-hidden"
              >
                <p
                  className={cn(
                    'max-w-3xl pb-6 leading-relaxed',
                    tone === 'dark' ? 'text-white/65' : 'text-muted-foreground',
                  )}
                >
                  {item.answer}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
