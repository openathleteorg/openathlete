/* eslint-disable react-refresh/only-export-components -- server-only helpers, never hot-reloaded on the client */
import type { FaqEntry } from '@/components/site/faq';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { Check } from 'lucide-react';
import Image from 'next/image';
import type { ReactNode } from 'react';

/**
 * Small pieces shared by the audience and pricing pages (athletes, coaches,
 * clubs, pricing, open source). They render on the server.
 */

type Inputs = Record<string, string>;

/**
 * A message looked up by key, for numbered series (`*_1_title`, `*_2_title`…).
 * Inputs a message does not use are ignored.
 */
export function msg(key: string, inputs: Inputs = {}): string {
  return (m[key as keyof typeof m] as (inputs: Inputs) => string)(inputs);
}

/** Answers quoting a price take it from `inputs` (supporterPriceVars). */
export function faqEntries(
  prefix: string,
  count: number,
  inputs: Inputs = {},
): FaqEntry[] {
  return Array.from({ length: count }, (_, index) => ({
    question: msg(`${prefix}_${index + 1}_q`, inputs),
    answer: msg(`${prefix}_${index + 1}_a`, inputs),
  }));
}

export function CheckList({
  items,
  tone = 'dark',
  className,
}: {
  items: ReactNode[];
  tone?: 'dark' | 'light';
  className?: string;
}) {
  return (
    <ul className={cn('grid gap-2.5', className)}>
      {items.map((item, index) => (
        <li
          key={index}
          className={cn(
            'flex gap-2.5 text-[0.95rem]',
            tone === 'light' && 'text-white/85',
          )}
        >
          <Check
            className={cn(
              'mt-0.5 size-4 shrink-0',
              tone === 'light' ? 'text-mint' : 'text-mint-strong',
            )}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Unsplash photos, resized by Next. Only IDs checked by hand belong here. */
export const PHOTOS = {
  trailRidge: 'https://images.unsplash.com/photo-1530143311094-34d807799e8f',
  trackAerial: 'https://images.unsplash.com/photo-1502904550040-7534597429ae',
  groupRun: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5',
} as const;

export function Photo({
  src,
  alt,
  className,
  priority,
  sizes = '(min-width: 1024px) 600px, 100vw',
  width = 1600,
  height = 1067,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
}) {
  return (
    <Image
      src={`${src}?auto=format&fit=crop&w=${width}&q=70`}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      className={cn('object-cover', className)}
    />
  );
}

/** The repository's files, for "read the code" links. */
export function sourceUrl(path: string): string {
  return `https://github.com/openathleteorg/openathlete/blob/main/${path}`;
}
