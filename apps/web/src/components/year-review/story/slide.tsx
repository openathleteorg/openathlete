import { cn } from '@/utils/shadcn';
import { ReactNode } from 'react';

import { after } from './after';

export function Slide({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <article className={cn('yr-slide', className)}>{children}</article>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="yr-eyebrow yr-reveal">{children}</span>;
}

/** A title whose second line takes the brand gradient */
export function Title({
  children,
  accent,
  className,
  delay = 100,
}: {
  children: ReactNode;
  accent?: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <h2 className={cn('yr-title yr-reveal', className)} style={after(delay)}>
      {children}
      {accent && (
        <>
          <br />
          <span className="yr-gradient">{accent}</span>
        </>
      )}
    </h2>
  );
}

/** The tiles and figures of a slide share these */
export function Stat({
  value,
  label,
  tone,
  delay,
}: {
  value: ReactNode;
  label: ReactNode;
  tone?: 'coral' | 'mint';
  delay: number;
}) {
  return (
    <div className="yr-stat yr-reveal" data-tone={tone} style={after(delay)}>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}
