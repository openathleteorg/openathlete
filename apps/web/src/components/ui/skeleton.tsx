import { cn } from '@/utils/shadcn';

import { TableCell, TableRow } from './table';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-primary/10 animate-pulse rounded-md', className)}
      {...props}
    />
  );
}

/**
 * Skeleton variant for cards
 */
function SkeletonCard({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('rounded-lg border bg-card p-4', className)} {...props}>
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

/**
 * Skeleton variant for list items
 */
function SkeletonListItem({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex items-center gap-3 p-3', className)} {...props}>
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/**
 * Skeleton variant for table rows
 */
function SkeletonTableRow({
  colCount = 3,
  className,
  ...props
}: React.ComponentProps<typeof TableRow> & { colCount?: number }) {
  return (
    <TableRow className={className} {...props}>
      {Array.from({ length: colCount }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}

/**
 * Skeleton variant for charts
 */
function SkeletonChart({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <Skeleton
      className={cn('h-[400px] w-full rounded-lg', className)}
      {...props}
    />
  );
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonListItem,
  SkeletonTableRow,
  SkeletonChart,
};
