import { cn } from '@/utils/shadcn';

interface UnreadBadgeProps {
  count: number;
  className?: string;
}

export function UnreadBadge({ count, className }: UnreadBadgeProps) {
  if (count === 0) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'min-w-[1.25rem] h-5 px-1.5',
        'rounded-full text-xs font-medium',
        'bg-destructive text-white',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
