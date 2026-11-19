import { cn } from '@/utils/shadcn';

import { SPORT_TYPE } from '@openathlete/shared';

import { sportIconSrc } from './sport-icon-src';

interface P {
  sport: SPORT_TYPE;
  className?: string;
  /** Next to the sport's name: hidden from screen readers, which read it */
  decorative?: boolean;
}

export function SportIcon({ sport, className, decorative }: P) {
  const icon = sportIconSrc(sport);
  return (
    <img
      src={icon}
      alt={decorative ? '' : sport}
      aria-hidden={decorative || undefined}
      className={cn('w-4 h-4 dark:invert dark:brightness-90', className)}
    />
  );
}
