import { cn } from '@/utils/shadcn';
import { Dumbbell } from 'lucide-react';
import type { CSSProperties } from 'react';

import type { ExerciseInfo } from './use-exercises';

interface ExerciseVisualProps {
  exercise: Pick<ExerciseInfo, 'frames' | 'name'> | null;
  /**
   * Moves between the two positions; 'hover' when a parent with the
   * `group` class is hovered or focused; else still on the start
   */
  animate?: boolean | 'hover';
  /** Seconds of one way: the tempo of the movement shown */
  period?: number;
  className?: string;
}

const mask = (url: string): CSSProperties => ({
  WebkitMaskImage: `url("${url}")`,
  maskImage: `url("${url}")`,
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
});

/**
 * The exercise drawn in the theme's ink: line art used as a mask, so it is
 * as readable in dark mode, and the two positions in turn as a movement.
 */
export function ExerciseVisual({
  exercise,
  animate = false,
  period = 1.6,
  className,
}: ExerciseVisualProps) {
  if (!exercise?.frames) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg bg-muted text-muted-foreground',
          className,
        )}
        aria-hidden
      >
        <Dumbbell className="size-1/3 max-h-12 max-w-12" />
      </div>
    );
  }
  const [start, end] = exercise.frames;
  const timing = { '--period': `${period}s` } as CSSProperties;
  return (
    <div
      className={cn('relative text-foreground', className)}
      role="img"
      aria-label={exercise.name}
      data-exercise-visual
    >
      <div
        className={cn(
          'absolute inset-0 bg-current',
          animate === true &&
            'motion-safe:animate-[exercise-out_var(--period)_ease-in-out_infinite_alternate]',
          animate === 'hover' &&
            'group-hover:motion-safe:animate-[exercise-out_var(--period)_ease-in-out_infinite_alternate] group-focus-visible:motion-safe:animate-[exercise-out_var(--period)_ease-in-out_infinite_alternate]',
        )}
        style={{ ...mask(start), ...timing }}
      />
      {animate && (
        <div
          className={cn(
            'absolute inset-0 bg-current opacity-0',
            animate === true &&
              'motion-safe:animate-[exercise-in_var(--period)_ease-in-out_infinite_alternate]',
            animate === 'hover' &&
              'group-hover:motion-safe:animate-[exercise-in_var(--period)_ease-in-out_infinite_alternate] group-focus-visible:motion-safe:animate-[exercise-in_var(--period)_ease-in-out_infinite_alternate]',
          )}
          style={{ ...mask(end), ...timing }}
        />
      )}
    </div>
  );
}
