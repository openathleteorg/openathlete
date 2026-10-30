import { cn } from '@/utils/shadcn';
import * as React from 'react';

interface P {
  label: string;
  value: React.ReactNode;
  unit?: string;
  caption?: string;
  /** Only for a value whose colour carries meaning, such as form */
  valueClassName?: string;
  className?: string;
}

export function MetricTile({
  label,
  value,
  unit,
  caption,
  valueClassName,
  className,
}: P) {
  return (
    <div
      data-slot="metric-tile"
      className={cn('flex flex-col rounded-lg bg-muted p-2', className)}
    >
      <span
        className="mb-0.5 truncate text-[10px] font-medium text-muted-foreground"
        title={label}
      >
        {label}
      </span>
      <div className="flex items-baseline gap-0.5">
        <span
          className={cn('text-lg font-semibold tracking-tight', valueClassName)}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[10px] font-normal text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
      {caption && (
        <span className="mt-0.5 truncate text-[9px] text-muted-foreground">
          {caption}
        </span>
      )}
    </div>
  );
}
