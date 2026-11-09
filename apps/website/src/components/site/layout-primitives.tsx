import { cn } from '@/utils/shadcn';
import type { ReactNode } from 'react';

export function Container({
  children,
  className,
  size = 'default',
}: {
  children: ReactNode;
  className?: string;
  size?: 'default' | 'narrow' | 'wide';
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-5 sm:px-8',
        size === 'default' && 'max-w-[76rem]',
        size === 'narrow' && 'max-w-[52rem]',
        size === 'wide' && 'max-w-[88rem]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Section({
  children,
  className,
  id,
  tone = 'white',
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: 'white' | 'paper' | 'ink';
}) {
  return (
    <section
      id={id}
      className={cn(
        'relative py-20 sm:py-28',
        tone === 'paper' && 'bg-paper',
        tone === 'ink' && 'ink-band',
        className,
      )}
    >
      {children}
    </section>
  );
}

/** Kicker, title and lead at the top of a section. */
export function SectionHeading({
  kicker,
  title,
  lead,
  align = 'left',
  tone = 'dark',
  className,
  as: Heading = 'h2',
  size = 'default',
}: {
  kicker?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  align?: 'left' | 'center';
  tone?: 'dark' | 'light';
  className?: string;
  as?: 'h1' | 'h2';
  size?: 'default' | 'side';
}) {
  return (
    <div
      className={cn(
        'max-w-[44rem]',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {kicker && (
        <p
          className={cn(
            'kicker mb-4',
            tone === 'dark' ? 'text-muted-foreground' : 'text-ink-soft',
          )}
        >
          {kicker}
        </p>
      )}
      <Heading
        className={cn(
          Heading === 'h1'
            ? 'display-1'
            : size === 'side'
              ? 'display-2-side'
              : 'display-2',
        )}
      >
        {title}
      </Heading>
      {lead && (
        <p
          className={cn(
            'lead mt-5',
            align === 'center' && 'mx-auto',
            tone === 'light' && 'text-ink-soft',
          )}
        >
          {lead}
        </p>
      )}
    </div>
  );
}
