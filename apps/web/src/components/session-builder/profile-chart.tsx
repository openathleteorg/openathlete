import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { useMemo, useState } from 'react';

import type { WORKOUT_STEP_TYPE, WorkoutStepDto } from '@openathlete/shared';

import { flattenSteps } from '../workout/workout-profile';
import type { BuilderStep } from './builder-state';
import { STEP_TONE, formatClock } from './step-summary';
import type { BuilderEnv } from './use-builder-env';

interface ProfileChartProps {
  steps: BuilderStep[];
  env: BuilderEnv;
  selected: string | null;
  onSelect: (uid: string) => void;
  className?: string;
}

const WIDTH = 1000;
const HEIGHT = 100;
const MIN_LEVEL = 0.14;

/**
 * The session as bars, intensity up and time across, drawn as the steps
 * are typed. A bar selects its step; the selected step stands out.
 */
export function ProfileChart({
  steps,
  env,
  selected,
  onSelect,
  className,
}: ProfileChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const { segments, total, parentOf } = useMemo(() => {
    const parents = new Map<string, string>();
    for (const step of steps) {
      for (const child of step.repeatBlock?.childSteps ?? []) {
        parents.set(child.uid, step.uid);
      }
    }
    const flat = flattenSteps(
      steps as unknown as WorkoutStepDto[],
      env.zonesByType,
      env.metrics,
      env.sport,
    );
    const last = flat[flat.length - 1];
    return {
      segments: flat,
      total: last ? last.startTime + last.duration : 0,
      parentOf: parents,
    };
  }, [steps, env]);

  if (segments.length === 0 || total === 0) {
    return (
      <div
        className={cn(
          'flex h-24 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground',
          className,
        )}
      >
        {m.builder_profile_empty()}
      </div>
    );
  }

  const uidOf = (index: number) =>
    (segments[index].step as unknown as BuilderStep).uid;
  const isSelected = (index: number) => {
    const uid = uidOf(index);
    return uid === selected || parentOf.get(uid) === selected;
  };
  const anySelected = segments.some((_, index) => isSelected(index));
  const hover = hovered !== null ? segments[hovered] : null;
  const ticks = [0, total / 2, total];

  return (
    <div className={cn('relative select-none', className)} data-profile-chart>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="h-24 w-full overflow-visible"
        role="img"
        aria-label={m.builder_profile_label()}
        onMouseLeave={() => setHovered(null)}
      >
        <line
          x1={0}
          x2={WIDTH}
          y1={HEIGHT}
          y2={HEIGHT}
          className="stroke-border"
          vectorEffect="non-scaling-stroke"
        />
        {segments.map((segment, index) => {
          const x = (segment.startTime / total) * WIDTH;
          const width = Math.max((segment.duration / total) * WIDTH - 1.5, 1);
          const level = Math.max(MIN_LEVEL, Math.min(segment.intensity / 5, 1));
          const height = level * (HEIGHT - 6);
          const ramp = segment.isWarmup || segment.isCooldown;
          const y = HEIGHT - height;
          // A warm-up rises and a cool-down falls, as they are run
          const points = segment.isWarmup
            ? `${x},${HEIGHT} ${x},${HEIGHT - height * 0.45} ${x + width},${y} ${x + width},${HEIGHT}`
            : `${x},${HEIGHT} ${x},${y} ${x + width},${HEIGHT - height * 0.45} ${x + width},${HEIGHT}`;
          const dim = anySelected && !isSelected(index);
          // Without a target, the step's own tone, as on its row below
          const fill =
            segment.intensity === 0
              ? STEP_TONE[segment.step.stepType as WORKOUT_STEP_TYPE]
              : segment.color;
          return (
            <g
              key={index}
              className="cursor-pointer"
              onMouseEnter={() => setHovered(index)}
              onClick={() => onSelect(uidOf(index))}
            >
              {ramp ? (
                <polygon
                  points={points}
                  fill={fill}
                  opacity={dim ? 0.5 : 0.95}
                />
              ) : (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  rx={2}
                  fill={fill}
                  opacity={dim ? 0.5 : 0.95}
                />
              )}
              {hovered === index && (
                <rect
                  x={x}
                  y={0}
                  width={width}
                  height={HEIGHT}
                  className="fill-foreground/5"
                />
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-muted-foreground">
        {ticks.map((tick) => (
          <span key={tick}>{formatClock(tick)}</span>
        ))}
      </div>
      {hover && (
        <div
          className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-sm"
          style={{
            left: `${Math.min(
              92,
              Math.max(
                8,
                ((hover.startTime + hover.duration / 2) / total) * 100,
              ),
            )}%`,
          }}
        >
          <span className="font-medium tabular-nums">
            {formatClock(hover.startTime)} →{' '}
            {formatClock(hover.startTime + hover.duration)}
          </span>
          {hover.step.name ? (
            <span className="text-muted-foreground"> · {hover.step.name}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}
