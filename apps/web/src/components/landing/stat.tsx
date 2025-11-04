import { cn } from '@/utils/shadcn';

interface StatProps {
  value: string;
  label?: string;
  className?: string;
}

export function Stat({ value, label, className }: StatProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <div className="text-3xl font-bold tracking-tight text-foreground">
        {value}
      </div>
      {label && (
        <div className="text-sm text-muted-foreground mt-1">{label}</div>
      )}
    </div>
  );
}

