import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import {
  Copy,
  Gauge,
  GripVertical,
  Heart,
  MessageSquareText,
  MoreHorizontal,
  Pencil,
  Repeat,
  Trash2,
  Zap,
} from 'lucide-react';
import {
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { CreateWorkoutStepTarget } from '@openathlete/shared';
import {
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
} from '@openathlete/shared';

import type { BuilderAction, BuilderStep } from './builder-state';
import { issueMessage } from './issue-message';
import { lineOf, parseLength, parseLine, parseTargets } from './line-parse';
import { type TargetLabel, describeTarget } from './step-format';
import { STEP_TONE, formatStepLength } from './step-summary';
import { stepTypeLabel } from './step-type-label';
import type { BuilderEnv } from './use-builder-env';

const EDITABLE_TYPES = [
  WORKOUT_STEP_TYPE.WARMUP,
  WORKOUT_STEP_TYPE.INTERVAL_ACTIVE,
  WORKOUT_STEP_TYPE.INTERVAL_REST,
  WORKOUT_STEP_TYPE.STEADY,
  WORKOUT_STEP_TYPE.COOLDOWN,
  WORKOUT_STEP_TYPE.FREE,
];

const KIND_ICON: Partial<Record<TargetLabel['kind'], ReactNode>> = {
  hr: <Heart className="size-3" aria-hidden />,
  power: <Zap className="size-3" aria-hidden />,
  pace: <Gauge className="size-3" aria-hidden />,
};

/** Common lengths, offered before anything is typed */
function lengthPresets(env: BuilderEnv): string[] {
  const time = [
    '30s',
    "1'",
    "2'",
    "3'",
    "5'",
    "10'",
    "15'",
    "20'",
    "30'",
    '1h',
  ];
  const distance =
    env.sport === 'SWIMMING'
      ? ['25m', '50m', '100m', '200m', '400m']
      : ['200m', '400m', '1km', '2km', '5km'];
  return [...time, ...distance, 'lap'];
}

export function TargetChip({
  label,
  className,
}: {
  label: TargetLabel;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex min-w-0 items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs',
        className,
      )}
    >
      {label.color ? (
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ background: label.color }}
          aria-hidden
        />
      ) : (
        KIND_ICON[label.kind]
      )}
      <span className="font-medium">{label.primary}</span>
      {label.secondary && (
        <span className="truncate text-muted-foreground">
          {label.secondary}
        </span>
      )}
    </span>
  );
}

function LengthEditor({
  step,
  env,
  onChange,
}: {
  step: BuilderStep;
  env: BuilderEnv;
  onChange: (
    patch: Pick<BuilderStep, 'durationType' | 'durationValue'>,
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const parsed = text.trim() ? parseLength(text, env) : null;
  const label = formatStepLength(step) ?? m.builder_length_open();

  const apply = (value: string) => {
    const length = parseLength(value, env);
    if (!length) return;
    onChange(length);
    setOpen(false);
    setText('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="min-w-12 rounded-md px-1.5 py-0.5 text-left text-base font-semibold tabular-nums hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
          data-step-length
          aria-label={m.builder_edit_length()}
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <Input
          autoFocus
          value={text}
          placeholder={m.builder_length_placeholder()}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            // Enter applies; it must not submit the event form
            if (event.key !== 'Enter') return;
            event.preventDefault();
            apply(text);
          }}
          aria-invalid={!!text.trim() && !parsed}
        />
        <p className="mt-1.5 h-4 text-xs text-muted-foreground">
          {text.trim()
            ? parsed
              ? `→ ${formatStepLength(parsed) ?? ''}`
              : m.builder_not_understood()
            : m.builder_length_hint()}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {lengthPresets(env).map((preset) => (
            <Button
              key={preset}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 tabular-nums"
              onClick={() => apply(preset)}
            >
              {preset === 'lap' ? m.builder_length_lap() : preset}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TargetEditor({
  step,
  env,
  labels,
  onChange,
}: {
  step: BuilderStep;
  env: BuilderEnv;
  labels: TargetLabel[];
  onChange: (targets: CreateWorkoutStepTarget[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const parsed = text.trim() ? parseTargets(text, env) : null;
  const zones = env.zonesByType[env.zoneType] ?? [];

  const setZone = (id: number) => {
    // A zone replaces the zone or the value of the same kind, keeps the rest
    const others = (step.targets ?? []).filter(
      (target) =>
        target.targetType !== WORKOUT_TARGET_TYPE.ZONE &&
        target.targetType !== WORKOUT_TARGET_TYPE.OPEN,
    );
    onChange([
      { targetType: WORKOUT_TARGET_TYPE.ZONE, targetValue: id },
      ...others,
    ]);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex min-w-0 flex-wrap items-center gap-1 rounded-md px-1 py-0.5 text-left hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
          data-step-targets
          aria-label={m.builder_edit_target()}
        >
          {labels.length ? (
            labels.map((label, index) => (
              <TargetChip key={index} label={label} />
            ))
          ) : (
            <span className="text-xs text-muted-foreground">
              {m.builder_target_add()}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        {zones.length > 0 && (
          <div className="mb-3 grid grid-cols-5 gap-1">
            {zones.map((zone) => (
              <button
                key={zone.id}
                type="button"
                onClick={() => setZone(zone.id)}
                className="flex flex-col items-center rounded-md border px-1 py-1.5 text-xs hover:bg-accent"
                title={zone.name}
              >
                <span
                  className="mb-1 h-1.5 w-full rounded-full"
                  style={{ background: zone.color }}
                />
                <span className="font-semibold">Z{zone.index + 1}</span>
              </button>
            ))}
          </div>
        )}
        <Input
          autoFocus
          value={text}
          placeholder={m.builder_target_placeholder()}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            if (parsed === null) return;
            onChange(parsed);
            setOpen(false);
            setText('');
          }}
          aria-invalid={!!text.trim() && parsed === null}
        />
        <p className="mt-1.5 min-h-4 text-xs text-muted-foreground">
          {text.trim()
            ? parsed
              ? parsed
                  .map((target) =>
                    describeTarget(
                      target,
                      env.sport,
                      env.zonesByType,
                      env.metrics,
                    ),
                  )
                  .filter(Boolean)
                  .map((label) =>
                    [label!.primary, label!.secondary]
                      .filter(Boolean)
                      .join(' · '),
                  )
                  .join(' + ') || m.builder_target_none()
              : m.builder_not_understood()
            : m.builder_target_hint()}
        </p>
        {(step.targets?.length ?? 0) > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 h-7 px-2 text-muted-foreground"
            onClick={() => {
              onChange([]);
              setOpen(false);
            }}
          >
            {m.builder_target_clear()}
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** The whole step as one line of text, for those who type faster */
function LineEditor({
  step,
  env,
  onDone,
  dispatch,
}: {
  step: BuilderStep;
  env: BuilderEnv;
  onDone: () => void;
  dispatch: (action: BuilderAction) => void;
}) {
  const [text, setText] = useState(() => lineOf(step, env));
  const input = useRef<HTMLInputElement>(null);
  const { steps, errors } = parseLine(text, env, step.stepType);

  useEffect(() => {
    input.current?.select();
  }, []);

  const commit = () => {
    if (errors.length || steps.length === 0) return;
    const [first, ...rest] = steps;
    // "400m Z5 r1'" makes two steps: the first replaces this one
    dispatch({
      type: 'update',
      uid: step.uid,
      patch: { ...first, repeatBlock: undefined },
    });
    if (rest.length) dispatch({ type: 'insert', steps: rest, after: step.uid });
    onDone();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onDone();
    }
  };

  return (
    <div className="min-w-0 flex-1">
      <Input
        ref={input}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        className="h-8 font-mono text-sm"
        aria-invalid={errors.length > 0}
        aria-label={m.builder_edit_line()}
        data-step-line-input
      />
      {errors.length > 0 && (
        <p className="mt-1 text-xs text-destructive">
          {issueMessage(errors[0].code, errors[0].text)}
        </p>
      )}
    </div>
  );
}

interface StepRowProps {
  step: BuilderStep;
  env: BuilderEnv;
  selected: boolean;
  nested: boolean;
  dispatch: (action: BuilderAction) => void;
  handleProps?: HTMLAttributes<HTMLButtonElement>;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
}

export function StepRow({
  step,
  env,
  selected,
  nested,
  dispatch,
  handleProps,
  editing,
  onEditingChange,
}: StepRowProps) {
  const labels = (step.targets ?? [])
    .map((target) =>
      describeTarget(target, env.sport, env.zonesByType, env.metrics),
    )
    .filter((label): label is TargetLabel => label !== null);
  const zoneColor = labels.find((label) => label.color)?.color;
  const tone = zoneColor ?? STEP_TONE[step.stepType];
  const update = (patch: Partial<BuilderStep>) =>
    dispatch({ type: 'update', uid: step.uid, patch });

  return (
    <div
      className={cn(
        'group relative flex items-center gap-1.5 rounded-lg border bg-card py-1.5 pl-1 pr-1.5 transition-shadow',
        selected
          ? 'border-ring ring-2 ring-ring/30'
          : 'hover:border-foreground/20',
      )}
      data-step-row={step.uid}
      data-selected={selected || undefined}
      onClick={() => dispatch({ type: 'select', uid: step.uid })}
      onDoubleClick={() => onEditingChange(true)}
    >
      <button
        type="button"
        className="flex h-9 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground/60 hover:text-foreground active:cursor-grabbing"
        aria-label={m.builder_drag()}
        {...handleProps}
      >
        <GripVertical className="size-4" />
      </button>
      <span
        className="h-9 w-1 shrink-0 rounded-full"
        style={{ background: tone }}
        aria-hidden
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="hidden w-28 shrink-0 truncate rounded-md px-1.5 py-1 text-left text-xs font-medium text-muted-foreground hover:bg-accent sm:block"
            data-step-type={step.stepType}
          >
            {stepTypeLabel(step.stepType)}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup
            value={step.stepType}
            onValueChange={(value) =>
              update({ stepType: value as WORKOUT_STEP_TYPE })
            }
          >
            {EDITABLE_TYPES.map((type) => (
              <DropdownMenuRadioItem key={type} value={type}>
                {stepTypeLabel(type)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {editing ? (
        <LineEditor
          step={step}
          env={env}
          dispatch={dispatch}
          onDone={() => onEditingChange(false)}
        />
      ) : (
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <LengthEditor step={step} env={env} onChange={update} />
          <TargetEditor
            step={step}
            env={env}
            labels={labels}
            onChange={(targets) => update({ targets })}
          />
          {step.name && (
            <span className="min-w-0 truncate text-sm text-muted-foreground">
              {step.name}
            </span>
          )}
          {step.notes && (
            <MessageSquareText
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-label={step.notes}
            />
          )}
        </div>
      )}

      {!editing && (
        <div
          className={cn(
            'flex shrink-0 items-center',
            selected
              ? 'opacity-100'
              : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100',
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden size-8 sm:inline-flex"
            aria-label={m.builder_edit_line()}
            onClick={(event) => {
              event.stopPropagation();
              onEditingChange(true);
            }}
          >
            <Pencil />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden size-8 sm:inline-flex"
            aria-label={m.builder_duplicate()}
            onClick={(event) => {
              event.stopPropagation();
              dispatch({ type: 'duplicate', uid: step.uid });
            }}
          >
            <Copy />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={m.builder_more()}
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEditingChange(true)}>
                <Pencil /> {m.builder_edit_line()}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => dispatch({ type: 'duplicate', uid: step.uid })}
              >
                <Copy /> {m.builder_duplicate()}
              </DropdownMenuItem>
              {!nested && (
                <DropdownMenuItem
                  onSelect={() => dispatch({ type: 'wrap', uid: step.uid })}
                >
                  <Repeat /> {m.builder_wrap()}
                </DropdownMenuItem>
              )}
              {step.durationType !== WORKOUT_DURATION_TYPE.LAP_BUTTON && (
                <DropdownMenuItem
                  onSelect={() =>
                    update({
                      durationType: WORKOUT_DURATION_TYPE.LAP_BUTTON,
                      durationValue: null,
                    })
                  }
                >
                  {m.builder_end_on_lap()}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => dispatch({ type: 'remove', uid: step.uid })}
              >
                <Trash2 /> {m.builder_delete()}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
