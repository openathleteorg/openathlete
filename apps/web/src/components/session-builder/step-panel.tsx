import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { Check, Plus, Type, X } from 'lucide-react';
import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useState,
} from 'react';

import type { CreateWorkoutStepTarget } from '@openathlete/shared';
import {
  METERS_PER_MILE,
  METERS_PER_YARD,
  SPORT_TYPE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
  roundImperialDistance,
} from '@openathlete/shared';

import { TargetForm } from '../workout/target-form';
import type { BuilderAction, BuilderStep } from './builder-state';
import { describeTarget } from './step-format';
import { TargetChip } from './step-row';
import { STEP_TONE } from './step-summary';
import { stepTypeLabel } from './step-type-label';
import type { BuilderEnv } from './use-builder-env';

const TYPES = [
  WORKOUT_STEP_TYPE.WARMUP,
  WORKOUT_STEP_TYPE.INTERVAL_ACTIVE,
  WORKOUT_STEP_TYPE.INTERVAL_REST,
  WORKOUT_STEP_TYPE.STEADY,
  WORKOUT_STEP_TYPE.COOLDOWN,
  WORKOUT_STEP_TYPE.FREE,
];

const TIME_PRESETS = [30, 60, 120, 180, 300, 600, 900, 1200, 1800, 3600];
const RUN_DISTANCES = [200, 400, 800, 1000, 2000, 5000];
const SWIM_DISTANCES = [25, 50, 100, 200, 400];
// Tracks are metric everywhere; longer reps in miles, pools in yards
const RUN_DISTANCES_IMPERIAL = [200, 400, 800, ...[1, 2, 5].map(miles)];
const SWIM_DISTANCES_IMPERIAL = [25, 50, 100, 200, 500].map(yards);

function miles(value: number) {
  return toCentimeters(value * METERS_PER_MILE);
}
function yards(value: number) {
  return toCentimeters(value * METERS_PER_YARD);
}
/** Distances are stored to the centimetre, as the text editor reads them */
function toCentimeters(meters: number) {
  return Math.round(meters * 100) / 100;
}

type DistanceFieldUnit = 'm' | 'km' | 'mi' | 'yd';
const METERS_IN: Record<DistanceFieldUnit, number> = {
  m: 1,
  km: 1000,
  mi: METERS_PER_MILE,
  yd: METERS_PER_YARD,
};

/** The units the field toggles between: none in a metric pool */
function distanceUnits(imperial: boolean, swim: boolean): DistanceFieldUnit[] {
  if (imperial) return swim ? ['yd', 'm'] : ['m', 'mi'];
  return swim ? ['m'] : ['m', 'km'];
}

/** The unit a distance reads best in: the one it was planned in */
function distanceUnitOf(
  meters: number,
  imperial: boolean,
  swim: boolean,
): DistanceFieldUnit {
  if (imperial) {
    const round = roundImperialDistance(meters, swim);
    if (round && (round.unit === 'yd') === swim) return round.unit;
    if (swim) return meters > 0 ? 'm' : 'yd';
    return 'm';
  }
  // Kilometres read better past 1 km, except in the pool
  return !swim && meters >= 1000 ? 'km' : 'm';
}

/** Lengths a kind switch starts from, before the coach adjusts */
const FIRST_LENGTH = { time: 300, distance: 1000, swimDistance: 100 };

type LengthKind = 'time' | 'distance' | 'lap';

function kindOf(type: BuilderStep['durationType']): LengthKind | null {
  switch (type) {
    case WORKOUT_DURATION_TYPE.TIME:
      return 'time';
    case WORKOUT_DURATION_TYPE.DISTANCE:
      return 'distance';
    case WORKOUT_DURATION_TYPE.LAP_BUTTON:
      return 'lap';
    default:
      return null;
  }
}

const presetLabel = (seconds: number) =>
  seconds >= 3600 ? '1h' : seconds < 60 ? `${seconds}"` : `${seconds / 60}'`;

const distanceLabel = (meters: number, imperial: boolean, swim: boolean) => {
  const round = imperial ? roundImperialDistance(meters, swim) : null;
  if (round) return `${round.value} ${round.unit}`;
  return meters >= 1000 ? `${meters / 1000} km` : `${meters} m`;
};

/** Keys typed in the panel stay there: Enter must not submit the event form */
function keepKeys(event: KeyboardEvent<HTMLElement>) {
  event.stopPropagation();
  if (event.key === 'Enter' && event.target instanceof HTMLInputElement)
    event.preventDefault();
}

/**
 * A number field that lets its text be empty or half typed while the step
 * keeps its last valid value; undo and outside changes show up in it.
 */
function NumberField({
  value,
  onValue,
  label,
  suffix,
  step = 1,
  className,
  ...rest
}: {
  value: number | null;
  onValue: (value: number | null) => void;
  label: string;
  suffix: string;
  step?: number;
  className?: string;
} & Record<`data-${string}`, string | boolean>) {
  const [text, setText] = useState(value === null ? '' : String(value));
  useEffect(() => {
    const parsed = text.trim() === '' ? null : Number(text.replace(',', '.'));
    if (parsed !== value) setText(value === null ? '' : String(value));
    // The text follows the value only when they disagree
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <label
      className={cn(
        'flex h-10 items-center rounded-md border bg-background pr-2.5 focus-within:ring-2 focus-within:ring-ring/40',
        className,
      )}
    >
      <input
        type="text"
        inputMode={step < 1 ? 'decimal' : 'numeric'}
        value={text}
        aria-label={label}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          if (next.trim() === '') return onValue(null);
          const parsed = Number(next.replace(',', '.'));
          if (Number.isFinite(parsed) && parsed >= 0) onValue(parsed);
        }}
        onFocus={(event) => event.target.select()}
        onKeyDown={keepKeys}
        className="h-full w-full min-w-0 bg-transparent px-2.5 text-right text-base font-semibold tabular-nums outline-none"
        {...rest}
      />
      <span className="shrink-0 text-sm text-muted-foreground">{suffix}</span>
    </label>
  );
}

function Section({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[6.5rem_1fr] sm:items-start sm:gap-3">
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium text-muted-foreground sm:pt-2.5"
      >
        {label}
      </label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  className,
  ...rest
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
} & Record<`data-${string}`, string | boolean>) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium tabular-nums transition-colors hover:bg-accent',
        active &&
          'border-primary bg-primary text-primary-foreground hover:bg-primary/90',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

function LengthSection({
  step,
  env,
  update,
}: {
  step: BuilderStep;
  env: BuilderEnv;
  update: (patch: Partial<BuilderStep>) => void;
}) {
  const imperial = env.unitSystem === 'IMPERIAL';
  const kind = kindOf(step.durationType);
  const swim = env.sport === SPORT_TYPE.SWIMMING;
  const value = step.durationValue ?? 0;
  const [unit, setUnit] = useState(() => distanceUnitOf(value, imperial, swim));
  const fieldUnits = distanceUnits(imperial, swim);
  const long = unit === 'km' || unit === 'mi';

  const setKind = (next: LengthKind) => {
    if (next === kind) return;
    if (next === 'lap') {
      update({
        durationType: WORKOUT_DURATION_TYPE.LAP_BUTTON,
        durationValue: null,
      });
    } else if (next === 'time') {
      update({
        durationType: WORKOUT_DURATION_TYPE.TIME,
        durationValue: FIRST_LENGTH.time,
      });
    } else {
      const meters = imperial
        ? swim
          ? yards(FIRST_LENGTH.swimDistance)
          : miles(1)
        : swim
          ? FIRST_LENGTH.swimDistance
          : FIRST_LENGTH.distance;
      setUnit(distanceUnitOf(meters, imperial, swim));
      update({
        durationType: WORKOUT_DURATION_TYPE.DISTANCE,
        durationValue: meters,
      });
    }
  };

  const setSeconds = (seconds: number) => {
    if (seconds > 0)
      update({
        durationType: WORKOUT_DURATION_TYPE.TIME,
        durationValue: Math.round(seconds),
      });
  };
  const setMeters = (meters: number) => {
    if (meters > 0)
      update({
        durationType: WORKOUT_DURATION_TYPE.DISTANCE,
        durationValue: toCentimeters(meters),
      });
  };

  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60);

  return (
    <div className="space-y-2">
      <div className="inline-flex rounded-lg bg-muted p-0.5" role="radiogroup">
        {(
          [
            ['time', m.builder_panel_time()],
            ['distance', m.builder_panel_distance()],
            ['lap', m.builder_length_lap()],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={kind === value}
            onClick={() => setKind(value)}
            className={cn(
              'h-9 rounded-md px-3 text-sm font-medium text-muted-foreground',
              kind === value && 'bg-background text-foreground shadow-sm',
            )}
            data-panel-length-kind={value}
          >
            {label}
          </button>
        ))}
      </div>

      {kind === 'time' && (
        <>
          <div className="flex items-center gap-2">
            <NumberField
              value={minutes}
              label={m.builder_panel_minutes()}
              suffix="min"
              className="w-28"
              onValue={(next) => setSeconds((next ?? 0) * 60 + seconds)}
              data-panel-minutes
            />
            <NumberField
              value={seconds}
              label={m.builder_panel_seconds()}
              suffix="s"
              className="w-24"
              onValue={(next) => setSeconds(minutes * 60 + (next ?? 0))}
              data-panel-seconds
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {TIME_PRESETS.map((preset) => (
              <Chip
                key={preset}
                active={value === preset}
                onClick={() => setSeconds(preset)}
                className="h-8 px-2.5 text-xs"
              >
                {presetLabel(preset)}
              </Chip>
            ))}
          </div>
        </>
      )}

      {kind === 'distance' && (
        <>
          <div className="flex items-center gap-2">
            <NumberField
              value={
                long
                  ? Number((value / METERS_IN[unit]).toFixed(3))
                  : Math.round(value / METERS_IN[unit])
              }
              label={m.builder_panel_distance()}
              suffix={unit}
              step={long ? 0.1 : 1}
              className="w-32"
              onValue={(next) => setMeters((next ?? 0) * METERS_IN[unit])}
              data-panel-distance
            />
            {fieldUnits.length > 1 && (
              <div className="inline-flex rounded-lg bg-muted p-0.5">
                {fieldUnits.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={unit === option}
                    onClick={() => setUnit(option)}
                    className={cn(
                      'h-9 rounded-md px-3 text-sm font-medium text-muted-foreground',
                      unit === option &&
                        'bg-background text-foreground shadow-sm',
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {(swim
              ? imperial
                ? SWIM_DISTANCES_IMPERIAL
                : SWIM_DISTANCES
              : imperial
                ? RUN_DISTANCES_IMPERIAL
                : RUN_DISTANCES
            ).map((preset) => (
              <Chip
                key={preset}
                active={Math.abs(value - preset) < 0.01}
                onClick={() => {
                  setUnit(distanceUnitOf(preset, imperial, swim));
                  setMeters(preset);
                }}
                className="h-8 px-2.5 text-xs"
              >
                {distanceLabel(preset, imperial, swim)}
              </Chip>
            ))}
          </div>
        </>
      )}

      {kind === 'lap' && (
        <p className="text-sm text-muted-foreground">
          {m.builder_panel_lap_hint()}
        </p>
      )}
    </div>
  );
}

function TargetPopover({
  trigger,
  initial,
  sport,
  onSubmit,
}: {
  trigger: ReactNode;
  initial?: CreateWorkoutStepTarget;
  sport: SPORT_TYPE;
  onSubmit: (target: CreateWorkoutStepTarget) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-h-[70vh] w-[22rem] overflow-y-auto p-4"
        onKeyDown={(event) => event.stopPropagation()}
      >
        <TargetForm
          initialValues={initial}
          sport={sport}
          submitLabel={initial ? m.builder_panel_done() : m.target_form_add()}
          onCancel={() => setOpen(false)}
          onSubmit={(values) => {
            onSubmit({
              targetType: values.targetType,
              targetMin: values.targetMin ?? null,
              targetMax: values.targetMax ?? null,
              targetValue: values.targetValue ?? null,
              metricType: values.metricType ?? null,
            });
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function IntensitySection({
  step,
  env,
  update,
}: {
  step: BuilderStep;
  env: BuilderEnv;
  update: (patch: Partial<BuilderStep>) => void;
}) {
  const zones = env.zonesByType[env.zoneType] ?? [];
  const targets = step.targets ?? [];
  const zoneIds = new Set(zones.map((zone) => zone.id));
  const activeZone = targets.find(
    (target) =>
      target.targetType === WORKOUT_TARGET_TYPE.ZONE &&
      zoneIds.has(target.targetValue ?? NaN),
  );
  // The zone row shows its own; every other target is listed
  const others = targets
    .map((target, index) => ({ target, index }))
    .filter(({ target }) => target !== activeZone);

  const toggleZone = (id: number) => {
    const rest = targets.filter(
      (target) =>
        target !== activeZone && target.targetType !== WORKOUT_TARGET_TYPE.OPEN,
    );
    update({
      targets:
        activeZone?.targetValue === id
          ? rest
          : [
              { targetType: WORKOUT_TARGET_TYPE.ZONE, targetValue: id },
              ...rest,
            ],
    });
  };

  return (
    <div className="space-y-2">
      {zones.length > 0 && (
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${Math.min(zones.length, 7)}, minmax(0, 1fr))`,
          }}
        >
          {zones.map((zone) => {
            const active = activeZone?.targetValue === zone.id;
            return (
              <button
                key={zone.id}
                type="button"
                aria-pressed={active}
                title={zone.name}
                onClick={() => toggleZone(zone.id)}
                className={cn(
                  'flex h-11 flex-col items-center justify-center gap-1 rounded-md border text-xs font-semibold transition-colors hover:bg-accent',
                  active && 'border-foreground bg-accent ring-2 ring-ring/30',
                )}
                data-panel-zone={zone.index + 1}
              >
                <span
                  className="h-1.5 w-3/5 rounded-full"
                  style={{ background: zone.color }}
                />
                Z{zone.index + 1}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        {others.map(({ target, index }) => {
          const label = describeTarget(
            target,
            env.sport,
            env.zonesByType,
            env.metrics,
            env.unitSystem,
          );
          if (!label) return null;
          return (
            <span key={index} className="inline-flex items-center">
              <TargetPopover
                initial={target}
                sport={env.sport}
                onSubmit={(next) =>
                  update({
                    targets: targets.map((t, i) => (i === index ? next : t)),
                  })
                }
                trigger={
                  <button
                    type="button"
                    className="rounded-md hover:ring-2 hover:ring-ring/30"
                    aria-label={m.builder_edit_target()}
                  >
                    <TargetChip label={label} className="h-8 text-sm" />
                  </button>
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={m.builder_target_clear()}
                onClick={() =>
                  update({ targets: targets.filter((_, i) => i !== index) })
                }
              >
                <X />
              </Button>
            </span>
          );
        })}
        <TargetPopover
          sport={env.sport}
          onSubmit={(target) =>
            update({
              // A new zone replaces the zone the row shows
              targets:
                target.targetType === WORKOUT_TARGET_TYPE.ZONE
                  ? [target, ...targets.filter((t) => t !== activeZone)]
                  : [...targets, target],
            })
          }
          trigger={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              data-panel-add-target
            >
              <Plus />
              {zones.length > 0
                ? m.builder_panel_other_target()
                : m.builder_panel_add_target()}
            </Button>
          }
        />
      </div>
    </div>
  );
}

interface StepPanelProps {
  step: BuilderStep;
  env: BuilderEnv;
  dispatch: (action: BuilderAction) => void;
  onClose: () => void;
  onEditAsText: () => void;
}

/**
 * Everything about a step with buttons and fields, for those who would
 * rather click than type: its kind, its length, its intensity, what the
 * athlete reads on the watch. Each change applies at once and undoes.
 */
export function StepPanel({
  step,
  env,
  dispatch,
  onClose,
  onEditAsText,
}: StepPanelProps) {
  const id = useId();
  const update = (patch: Partial<BuilderStep>) =>
    dispatch({ type: 'update', uid: step.uid, patch });

  return (
    <div
      className="space-y-3 rounded-b-lg border border-t-0 bg-card px-3 pb-3 pt-3"
      data-step-panel={step.uid}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        // The builder's shortcuts (delete, move) are for the list, not here
        event.stopPropagation();
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <Section label={m.builder_panel_type()}>
        <div className="flex flex-wrap gap-1">
          {TYPES.map((type) => (
            <Chip
              key={type}
              active={step.stepType === type}
              onClick={() => update({ stepType: type })}
              data-panel-type={type}
            >
              <span
                className="size-2 rounded-full"
                style={{ background: STEP_TONE[type] }}
                aria-hidden
              />
              {stepTypeLabel(type)}
            </Chip>
          ))}
        </div>
      </Section>

      <Section label={m.builder_panel_length()}>
        <LengthSection step={step} env={env} update={update} />
      </Section>

      <Section label={m.builder_panel_intensity()}>
        <IntensitySection step={step} env={env} update={update} />
      </Section>

      <Section label={m.builder_panel_name()} htmlFor={`${id}-name`}>
        <Input
          id={`${id}-name`}
          value={step.name ?? ''}
          placeholder={m.builder_panel_name_placeholder()}
          onChange={(event) => update({ name: event.target.value || null })}
          onKeyDown={keepKeys}
          className="h-10"
          data-panel-name
        />
      </Section>

      <Section label={m.builder_panel_notes()} htmlFor={`${id}-notes`}>
        <Textarea
          id={`${id}-notes`}
          value={step.notes ?? ''}
          placeholder={m.builder_panel_notes_placeholder()}
          onChange={(event) => update({ notes: event.target.value || null })}
          onKeyDown={keepKeys}
          rows={2}
          className="min-h-16 resize-y"
          data-panel-notes
        />
      </Section>

      <div className="flex items-center justify-between gap-2 border-t pt-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={onEditAsText}
        >
          <Type />
          {m.builder_edit_line()}
        </Button>
        <Button type="button" size="sm" onClick={onClose} data-panel-done>
          <Check />
          {m.builder_panel_done()}
        </Button>
      </div>
    </div>
  );
}
