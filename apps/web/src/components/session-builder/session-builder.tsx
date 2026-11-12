import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  DndContext,
  type DragEndEvent,
  type DragMoveEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Blocks,
  Copy,
  GripVertical,
  Keyboard,
  LayoutTemplate,
  Minus,
  MoreHorizontal,
  Plus,
  Redo2,
  Trash2,
  Type,
  Undo2,
  Ungroup,
} from 'lucide-react';
import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';

import type { CreateWorkoutStepDto, SPORT_TYPE } from '@openathlete/shared';
import {
  WORKOUT_TARGET_TYPE,
  calculateWorkoutDistance,
  calculateWorkoutDuration,
} from '@openathlete/shared';

import {
  type BuilderAction,
  type BuilderStep,
  builderReducer,
  initialState,
  isRepeat,
  locate,
  withoutUids,
} from './builder-state';
import { type Drop, INDENT, projectDrop } from './drop';
import { parseLines } from './line-parse';
import { ProfileChart } from './profile-chart';
import { QuickAdd } from './quick-add';
import { describeSteps } from './quick-add-text';
import { StepRow } from './step-row';
import { formatKm, formatTotal } from './step-summary';
import { quickTemplates } from './templates';
import { TextEditor } from './text-editor';
import { useBuilderEnv } from './use-builder-env';

interface SessionBuilderProps {
  steps: CreateWorkoutStepDto[];
  onChange: (steps: CreateWorkoutStepDto[]) => void;
  sport: SPORT_TYPE;
  /** The session's athlete, whose zones targets use; null for a template */
  athleteId: number | null;
  className?: string;
}

type Row =
  | { kind: 'step'; id: string; step: BuilderStep; parent: string | null }
  | { kind: 'repeat'; id: string; step: BuilderStep; parent: null }
  | { kind: 'end'; id: string; parent: string };

function rowsOf(steps: BuilderStep[]): Row[] {
  return steps.flatMap((step): Row[] => {
    if (!isRepeat(step))
      return [{ kind: 'step', id: step.uid, step, parent: null }];
    return [
      { kind: 'repeat', id: step.uid, step, parent: null },
      ...(step.repeatBlock?.childSteps ?? []).map((child): Row => ({
        kind: 'step',
        id: child.uid,
        step: child,
        parent: step.uid,
      })),
      { kind: 'end', id: `${step.uid}:end`, parent: step.uid },
    ];
  });
}

/** Keys typed in a field stay there: Enter must not submit the event form */
function keepKeys(event: KeyboardEvent<HTMLInputElement>) {
  event.stopPropagation();
  if (event.key === 'Enter') event.preventDefault();
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable);

function Sortable({
  id,
  disabled,
  shift = 0,
  children,
}: {
  id: string;
  /** Not draggable; it still takes drops (a repeat's end) */
  disabled?: boolean;
  /** Pixels across while dragged: the level it will land at */
  shift?: number;
  children: (handle: Record<string, unknown>) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: disabled ? { draggable: true, droppable: false } : false,
  });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(
          transform && { ...transform, x: isDragging ? shift : 0 },
        ),
        transition,
      }}
      className={cn(
        isDragging &&
          'relative z-10 opacity-90 shadow-lg ring-2 ring-primary/40 rounded-lg',
      )}
    >
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

function RepeatHeader({
  step,
  selected,
  dispatch,
  handleProps,
}: {
  step: BuilderStep;
  selected: boolean;
  dispatch: (action: BuilderAction) => void;
  handleProps: Record<string, unknown>;
}) {
  const repetitions = step.repeatBlock?.repetitions ?? 1;
  const setRepetitions = (value: number) => {
    if (!step.repeatBlock || !Number.isFinite(value)) return;
    dispatch({
      type: 'update',
      uid: step.uid,
      patch: {
        repeatBlock: {
          ...step.repeatBlock,
          repetitions: Math.max(1, Math.min(99, Math.round(value))),
        },
      } as Partial<CreateWorkoutStepDto>,
    });
  };
  return (
    <div
      className={cn(
        'group flex items-center gap-1.5 rounded-t-lg border border-b-0 bg-muted/60 py-1 pl-1 pr-1.5',
        selected && 'border-ring ring-2 ring-ring/30',
      )}
      data-repeat-row={step.uid}
      onClick={() => dispatch({ type: 'select', uid: step.uid })}
    >
      <button
        type="button"
        className="flex h-8 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground/60 hover:text-foreground"
        aria-label={m.builder_drag()}
        {...handleProps}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="flex items-center rounded-md border bg-background">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={m.builder_repeat_less()}
          onClick={(event) => {
            event.stopPropagation();
            setRepetitions(repetitions - 1);
          }}
        >
          <Minus />
        </Button>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={99}
          value={repetitions}
          onChange={(event) => setRepetitions(Number(event.target.value))}
          onKeyDown={keepKeys}
          className="w-9 bg-transparent text-center text-base font-bold tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          aria-label={m.builder_repeat_count()}
          data-repeat-count
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={m.builder_repeat_more()}
          onClick={(event) => {
            event.stopPropagation();
            setRepetitions(repetitions + 1);
          }}
        >
          <Plus />
        </Button>
      </div>
      <span className="text-sm font-semibold">×</span>
      <Input
        value={step.name ?? ''}
        placeholder={m.builder_repeat_name()}
        onChange={(event) =>
          dispatch({
            type: 'update',
            uid: step.uid,
            patch: { name: event.target.value || null },
          })
        }
        onKeyDown={keepKeys}
        className="h-8 min-w-0 flex-1 border-transparent bg-transparent px-1.5 text-sm shadow-none hover:border-input focus-visible:bg-background"
      />
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
          <DropdownMenuItem
            onSelect={() => dispatch({ type: 'duplicate', uid: step.uid })}
          >
            <Copy /> {m.builder_duplicate()}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => dispatch({ type: 'unwrap', uid: step.uid })}
          >
            <Ungroup /> {m.builder_unwrap()}
          </DropdownMenuItem>
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
  );
}

const SHORTCUTS: [string, () => string][] = [
  ['/', () => m.builder_key_quick()],
  ['↑ ↓', () => m.builder_key_select()],
  ['⌥ ↑ ↓', () => m.builder_key_move()],
  ['↵', () => m.builder_key_edit()],
  ['⌘ D', () => m.builder_duplicate()],
  ['R', () => m.builder_wrap()],
  ['⌫', () => m.builder_delete()],
  ['⌘ Z', () => m.builder_undo()],
  ['⇧ ⌘ Z', () => m.builder_redo()],
];

/**
 * The structured session editor of every endurance sport: write it in one
 * line ("6x(1km Z4 / 2' Z1)"), click zones, drag blocks, or switch to
 * text. Steps edit in place; everything undoes.
 */
export function SessionBuilder({
  steps,
  onChange,
  sport,
  athleteId,
  className,
}: SessionBuilderProps) {
  const env = useBuilderEnv(sport, athleteId);
  const [state, dispatch] = useReducer(builderReducer, steps, initialState);
  const [mode, setMode] = useState<'blocks' | 'text'>('blocks');
  const [editing, setEditing] = useState<string | null>(null);
  const quickAdd = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);

  // The parent hears every change; steps it sets itself (AI, template)
  // replace the builder's
  const emitted = useRef(JSON.stringify(steps));
  useEffect(() => {
    const plain = withoutUids(state.steps);
    const serialized = JSON.stringify(plain);
    if (serialized === emitted.current) return;
    emitted.current = serialized;
    onChange(plain);
  }, [state.steps, onChange]);
  useEffect(() => {
    const serialized = JSON.stringify(steps);
    if (serialized === emitted.current) return;
    emitted.current = serialized;
    dispatch({ type: 'reset', steps });
  }, [steps]);

  const rows = useMemo(() => rowsOf(state.steps), [state.steps]);
  const selectable = rows.filter((row) => row.kind !== 'end');

  const add = useCallback(
    (added: CreateWorkoutStepDto[]) => {
      if (added.length === 0) return;
      dispatch({ type: 'insert', steps: added, after: state.selected });
    },
    [state.selected],
  );

  const totals = useMemo(() => {
    const plain = withoutUids(state.steps);
    return {
      duration: calculateWorkoutDuration({ steps: plain }, env.metrics, sport),
      distance: calculateWorkoutDistance(
        { steps: plain },
        env.metrics,
        sport,
        env.zones.map((zone) => ({
          trainingZoneId: zone.trainingZoneId,
          type: zone.type,
        })),
      ),
    };
  }, [state.steps, env, sport]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Where the dragged row would land now, to show its level as it moves
  const [drag, setDrag] = useState<{ id: string; drop: Drop | null } | null>(
    null,
  );
  const project = ({ active, over, delta }: DragMoveEvent) =>
    over
      ? projectDrop(rows, String(active.id), String(over.id), delta.x)
      : null;
  const onDragMove = (event: DragMoveEvent) =>
    setDrag({ id: String(event.active.id), drop: project(event) });
  const onDragEnd = (event: DragEndEvent) => {
    setDrag(null);
    const drop = project(event);
    if (!drop) return;
    dispatch({
      type: 'moveTo',
      uid: String(event.active.id),
      parent: drop.parent,
      index: drop.index,
    });
  };
  const shiftOf = (row: Row) => {
    if (!drag?.drop || drag.id !== row.id) return 0;
    return (drag.drop.depth - (row.parent ? 1 : 0)) * INDENT;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isTyping(event.target) || mode !== 'blocks') return;
    const mod = event.metaKey || event.ctrlKey;
    const key = event.key.toLowerCase();
    const index = selectable.findIndex((row) => row.id === state.selected);
    const current = state.selected;
    const handled = () => {
      event.preventDefault();
      event.stopPropagation();
    };
    if (mod && key === 'z') {
      handled();
      dispatch({ type: event.shiftKey ? 'redo' : 'undo' });
    } else if (mod && key === 'y') {
      handled();
      dispatch({ type: 'redo' });
    } else if (event.key === '/') {
      handled();
      quickAdd.current?.focus();
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      handled();
      const delta = event.key === 'ArrowUp' ? -1 : 1;
      if (event.altKey && current) {
        dispatch({ type: 'move', uid: current, delta });
      } else {
        const next =
          selectable[
            index === -1
              ? 0
              : Math.max(0, Math.min(selectable.length - 1, index + delta))
          ];
        if (next) dispatch({ type: 'select', uid: next.id });
      }
    } else if (!current) {
      return;
    } else if (mod && key === 'd') {
      handled();
      dispatch({ type: 'duplicate', uid: current });
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      handled();
      dispatch({ type: 'remove', uid: current });
    } else if (event.key === 'Enter') {
      const where = locate(state.steps, current);
      if (where && !isRepeat(where.step)) {
        handled();
        setEditing(current);
      }
    } else if (key === 'r' && !mod) {
      handled();
      dispatch({ type: 'wrap', uid: current });
    } else if (event.key === 'Escape') {
      handled();
      dispatch({ type: 'select', uid: null });
    }
  };

  // The selected row stays in view as the keyboard moves through them
  useEffect(() => {
    if (!state.selected) return;
    root.current
      ?.querySelector(
        `[data-step-row="${state.selected}"], [data-repeat-row="${state.selected}"]`,
      )
      ?.scrollIntoView({ block: 'nearest' });
  }, [state.selected]);

  const zones = env.zonesByType[env.zoneType] ?? [];
  const selectedStep = state.selected
    ? locate(state.steps, state.selected)?.step
    : null;
  const applyZone = (zoneId: number) => {
    if (selectedStep && !isRepeat(selectedStep)) {
      dispatch({
        type: 'update',
        uid: selectedStep.uid,
        patch: {
          targets: [
            { targetType: WORKOUT_TARGET_TYPE.ZONE, targetValue: zoneId },
            ...(selectedStep.targets ?? []).filter(
              (target) => target.targetType !== WORKOUT_TARGET_TYPE.ZONE,
            ),
          ],
        },
      });
      return;
    }
    const zone = env.zones.find((z) => z.trainingZoneId === zoneId);
    add(parseLines(`- 5m Z${(zone?.index ?? 0) + 1}`, env).steps);
  };
  const templates = quickTemplates(sport).filter(
    (template) =>
      !parseLines(template.text, env).issues.some(
        (issue) => issue.severity === 'error',
      ),
  );

  return (
    <div
      ref={root}
      className={cn('min-w-0 space-y-3 outline-none', className)}
      onKeyDown={onKeyDown}
      tabIndex={-1}
      data-session-builder
    >
      <div className="rounded-xl border bg-card p-3">
        <div className="mb-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-2xl font-bold tabular-nums" data-builder-total>
            {totals.duration ? formatTotal(totals.duration) : '—'}
          </span>
          {totals.distance ? (
            <span className="text-sm tabular-nums text-muted-foreground">
              ≈ {formatKm(totals.distance)}
            </span>
          ) : null}
          <span className="text-sm text-muted-foreground">
            {describeSteps(
              withoutUids(state.steps).filter((step) => isRepeat(step)),
            )}
          </span>
        </div>
        <ProfileChart
          steps={state.steps}
          env={env}
          selected={state.selected}
          onSelect={(uid) => dispatch({ type: 'select', uid })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg bg-muted p-0.5" role="tablist">
          {(
            [
              ['blocks', <Blocks key="b" />, m.builder_mode_blocks()],
              ['text', <Type key="t" />, m.builder_mode_text()],
            ] as const
          ).map(([value, icon, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => setMode(value)}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-muted-foreground [&_svg]:size-4',
                mode === value && 'bg-background text-foreground shadow-sm',
              )}
              data-builder-mode={value}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          {templates.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <LayoutTemplate />
                  <span className="hidden sm:inline">
                    {m.builder_templates()}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>
                  {m.builder_templates_hint()}
                </DropdownMenuLabel>
                {templates.map((template) => (
                  <DropdownMenuItem
                    key={template.text}
                    onSelect={() => add(parseLines(template.text, env).steps)}
                    className="flex-col items-start gap-0"
                  >
                    <span>{template.label()}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {template.text.replace(/\n/g, ' ; ')}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hidden size-8 sm:inline-flex"
                aria-label={m.builder_shortcuts()}
              >
                <Keyboard />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-3 text-sm">
              <p className="mb-2 font-medium">{m.builder_shortcuts()}</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                {SHORTCUTS.map(([keys, label]) => (
                  <div key={keys} className="contents">
                    <dt>
                      <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                        {keys}
                      </kbd>
                    </dt>
                    <dd className="text-muted-foreground">{label()}</dd>
                  </div>
                ))}
              </dl>
            </PopoverContent>
          </Popover>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={state.past.length === 0}
            onClick={() => dispatch({ type: 'undo' })}
            aria-label={m.builder_undo()}
          >
            <Undo2 />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={state.future.length === 0}
            onClick={() => dispatch({ type: 'redo' })}
            aria-label={m.builder_redo()}
          >
            <Redo2 />
          </Button>
        </div>
      </div>

      {mode === 'text' ? (
        <TextEditor
          steps={withoutUids(state.steps)}
          env={env}
          onChange={(next) => dispatch({ type: 'replace', steps: next })}
        />
      ) : (
        <>
          <QuickAdd ref={quickAdd} env={env} onAdd={add} />

          {zones.length > 0 && (
            <div
              className="flex items-center gap-1.5 overflow-x-auto pb-0.5"
              data-zone-palette
            >
              <span className="shrink-0 text-xs text-muted-foreground">
                {selectedStep && !isRepeat(selectedStep)
                  ? m.builder_zone_set()
                  : m.builder_zone_add()}
              </span>
              {zones.map((zone) => (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => applyZone(zone.id)}
                  title={zone.name}
                  className="flex h-8 min-w-11 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold hover:bg-accent"
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: zone.color }}
                  />
                  Z{zone.index + 1}
                </button>
              ))}
            </div>
          )}

          {state.steps.length === 0 ? (
            <div className="rounded-xl border border-dashed px-4 py-8 text-center">
              <p className="text-sm font-medium">{m.builder_empty_title()}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {m.builder_empty_hint()}
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragMove={onDragMove}
              onDragEnd={onDragEnd}
              onDragCancel={() => setDrag(null)}
            >
              <SortableContext
                items={rows.map((row) => row.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1.5" role="list">
                  {rows.map((row) => {
                    if (row.kind === 'end') {
                      const repeat = state.steps.find(
                        (step) => step.uid === row.parent,
                      );
                      const last = repeat?.repeatBlock?.childSteps.slice(-1)[0];
                      return (
                        <Sortable key={row.id} id={row.id} disabled>
                          {() => (
                            <div className="-mt-1.5 rounded-b-lg border border-t-0 bg-muted/30 px-2 pb-1.5 pt-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-muted-foreground"
                                onClick={() =>
                                  dispatch({
                                    type: 'insert',
                                    steps: last
                                      ? withoutUids([last])
                                      : parseLines('- 1m', env).steps,
                                    into: row.parent,
                                  })
                                }
                              >
                                <Plus className="size-3.5" />
                                {m.builder_repeat_add_step()}
                              </Button>
                            </div>
                          )}
                        </Sortable>
                      );
                    }
                    if (row.kind === 'repeat') {
                      return (
                        <Sortable key={row.id} id={row.id} shift={shiftOf(row)}>
                          {(handle) => (
                            <RepeatHeader
                              step={row.step}
                              selected={state.selected === row.id}
                              dispatch={dispatch}
                              handleProps={handle}
                            />
                          )}
                        </Sortable>
                      );
                    }
                    return (
                      <Sortable key={row.id} id={row.id} shift={shiftOf(row)}>
                        {(handle) => (
                          <div
                            className={cn(
                              row.parent &&
                                '-mt-1.5 border-x bg-muted/30 px-2 pt-1.5',
                            )}
                            role="listitem"
                          >
                            <StepRow
                              step={row.step}
                              env={env}
                              selected={state.selected === row.id}
                              nested={row.parent !== null}
                              dispatch={dispatch}
                              handleProps={handle}
                              editing={editing === row.id}
                              onEditingChange={(on) => {
                                setEditing(on ? row.id : null);
                                if (!on) root.current?.focus();
                              }}
                            />
                          </div>
                        )}
                      </Sortable>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </>
      )}
    </div>
  );
}
