import { cn } from '@/utils/shadcn';
import * as React from 'react';

/** Names a group of figures inside a card */
export function SectionLabel({
  className,
  ...props
}: React.ComponentProps<'h3'>) {
  return (
    <h3
      data-slot="section-label"
      className={cn('text-sm font-medium text-muted-foreground', className)}
      {...props}
    />
  );
}
