import { Badge as UIBadge } from '@/components/ui/badge';
import { cn } from '@/utils/shadcn';
import type { ComponentProps, ReactNode } from 'react';

interface LandingBadgeProps extends ComponentProps<typeof UIBadge> {
  children: ReactNode;
}

export function LandingBadge({
  children,
  className,
  ...props
}: LandingBadgeProps) {
  return (
    <UIBadge
      className={cn('bg-primary/10 text-primary border-primary/20', className)}
      {...props}
    >
      {children}
    </UIBadge>
  );
}
