import { cn } from '@/utils/shadcn';
import type { ComponentProps, ReactNode } from 'react';

interface ContainerProps extends ComponentProps<'div'> {
  children: ReactNode;
  className?: string;
}

export function Container({ children, className, ...props }: ContainerProps) {
  return (
    <div
      className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}
      {...props}
    >
      {children}
    </div>
  );
}
