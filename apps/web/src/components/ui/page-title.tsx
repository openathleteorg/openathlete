import { cn } from '@/utils/shadcn';
import * as React from 'react';

interface P extends React.ComponentProps<'h1'> {
  /** The mobile header already shows the title below 768px */
  desktopOnly?: boolean;
}

export function PageTitle({ desktopOnly, className, ...props }: P) {
  return (
    <h1
      data-slot="page-title"
      className={cn(
        'text-2xl font-semibold tracking-tight',
        desktopOnly && 'hidden md:block',
        className,
      )}
      {...props}
    />
  );
}
