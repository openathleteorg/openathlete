import { cn } from '@/utils/shadcn';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Unified Loader component for inline loading states, overlays, and small areas
 */
export function Loader({ className, size = 'md' }: LoaderProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <Loader2
      className={cn('animate-spin text-primary', sizeClasses[size], className)}
    />
  );
}

interface PageLoaderProps {
  message?: string;
  className?: string;
}

/**
 * Unified PageLoader component for full-page loading states
 */
export function PageLoader({ message, className }: PageLoaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center h-screen flex-col',
        className,
      )}
    >
      <Loader size="lg" />
      {message && (
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
