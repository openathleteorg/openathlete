import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  CornerDownLeft,
  Dumbbell,
  Link2,
  Minus,
  MoreHorizontal,
  Plus,
  Redo2,
  Replace,
  Trash2,
  Undo2,
  Ungroup,
  Zap,
} from 'lucide-react';
import {
  type ReactNode,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';

import type {
  CreateWorkoutStepDto,
  SPORT_TYPE,
  StrengthExercise,
  StrengthGroupKind,
  StrengthSet,
} from '@openathlete/shared';
import {
  EXERCISE_SIDE,
  WORKOUT_REPEAT_KIND,
  parseWorkoutText,
  strengthSeconds,
  tempoSchema,
} from '@openathlete/shared';

import { formatStepLength, formatTotal } from '../session-builder/step-summary';
import { equipmentLabel, targetLabel } from './exercise-labels';
import { ExercisePicker } from './exercise-picker';
import { searchExercises } from './exercise-search';
import { ExerciseVisual } from './exercise-visual';
import { type SetColumns, gridColumns } from './set-columns';
import { CellInput, SetCells, SetTable } from './set-table';
import {
  formatSeconds,
  parseQuickExercise,
  parseSeconds,
  quickSets,
} from './strength-input';
import { groupKindHint, groupKindLabel, sideLabel } from './strength-labels';
import {
  type UBlock,
  blocksFromSteps,
  duplicateBlock,
  exerciseFrom,
  groupFrom,
  groupWithNext,
  moveBlock,
  stepsFromBlocks,
  strengthReducer,
  ungroup,
  withIds,
} from './strength-state';
import { type ExerciseInfo, useExercises } from './use-exercises';

const GROUP_KINDS: StrengthGroupKind[] = [
  WORKOUT_REPEAT_KIND.SUPERSET,
  WORKOUT_REPEAT_KIND.CIRCUIT,
  WORKOUT_REPEAT_KIND.EMOM,
  WORKOUT_REPEAT_KIND.AMRAP,
  WORKOUT_REPEAT_KIND.TABATA,
];

function Stepper({
  value,
  min,
  max,
  onChange,
  label,
  suffix,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  suffix?: string;
}) {
  const set = (next: number) => onChange(Math.max(min, Math.min(max, next)));
  return (
    <div
      className="flex items-center rounded-md border bg-background"
      aria-label={label}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label={`${label} −`}
        onClick={() => set(value - 1)}
      >
        <Minus />
      </Button>
      <span className="min-w-8 text-center text-sm font-bold tabular-nums">
        {value}
        {suffix}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label={`${label} +`}
        onClick={() => set(value + 1)}
      >
        <Plus />
      </Button>
    </div>
  );
}

function ExerciseHeader({
  info,
  exercise,
  menu,
}: {
  info: ExerciseInfo | null;
  exercise: StrengthExercise;
  menu?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="group shrink-0">
        <ExerciseVisual
          exercise={info}
          animate="hover"
          className="size-14 rounded-lg bg-muted/50 [&>div]:m-1"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold leading-tight" data-exercise-name>
          {exercise.name || info?.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {[
            targetLabel(info?.target),
            equipmentLabel(info?.equipment),
            exercise.side && sideLabel(exercise.side),
            exercise.tempo && `${m.strength_tempo()} ${exercise.tempo}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
      {menu}
    </div>
  );
}

function ExerciseOptions({
  exercise,
  onChange,
}: {
  exercise: StrengthExercise;
  onChange: (exercise: StrengthExercise) => void;
}) {
  return (
    <div className="grid gap-2 rounded-lg bg-muted/40 p-2 sm:grid-cols-[8rem_1fr]">
      <CellInput
        value={exercise.tempo ?? ''}
        parse={(text) => tempoSchema.safeParse(text.trim()).success}
        onCommit={(text) =>
          onChange({ ...exercise, tempo: text.trim() || null })
        }
        placeholder={m.strength_tempo_placeholder()}
        label={m.strength_tempo()}
      />
      <Input
        value={exercise.notes ?? ''}
        onChange={(event) =>
          onChange({ ...exercise, notes: event.target.value || null })
        }
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === 'Enter') event.preventDefault();
        }}
        placeholder={m.strength_cue_placeholder()}
        aria-label={m.strength_cue()}
        className="h-9 bg-background"
      />
    </div>
  );
}

type Block<K extends UBlock['kind']> = Extract<UBlock, { kind: K }>;

interface CardProps<B extends UBlock = UBlock> {
  block: B;
  index: number;
  count: number;
  update: (block: UBlock) => void;
  apply: (change: (blocks: UBlock[]) => UBlock[]) => void;
  resolve: ReturnType<typeof useExercises>['resolve'];
  onReplace: (index: number, member?: number) => void;
  onAddToGroup: (index: number) => void;
}

function BlockMenu({
  index,
  count,
  apply,
  children,
}: Pick<CardProps, 'index' | 'count' | 'apply'> & { children?: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          aria-label={m.builder_more()}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {children}
        <DropdownMenuItem
          disabled={index === 0}
          onSelect={() => apply((blocks) => moveBlock(blocks, index, -1))}
        >
          <ArrowUp /> {m.strength_move_up()}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={index === count - 1}
          onSelect={() => apply((blocks) => moveBlock(blocks, index, 1))}
        >
          <ArrowDown /> {m.strength_move_down()}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => apply((blocks) => duplicateBlock(blocks, index))}
        >
          <Copy /> {m.builder_duplicate()}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() =>
            apply((blocks) => blocks.filter((_, i) => i !== index))
          }
        >
          <Trash2 /> {m.builder_delete()}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ExerciseCard({
  block,
  index,
  count,
  update,
  apply,
  resolve,
  onReplace,
}: CardProps<Block<'exercise'>>) {
  const { exercise } = block;
  const info = resolve(exercise.exerciseRef, exercise.name);
  const [options, setOptions] = useState(!!(exercise.tempo || exercise.notes));
  const [columns, setColumns] = useState<SetColumns>({
    load:
      info?.equipment !== 'body weight' ||
      exercise.sets.some((set) => set.load !== null),
    rpe: exercise.sets.some((set) => set.rpe !== null),
    rest: true,
  });
  const set = (next: StrengthExercise) => update({ ...block, exercise: next });
  const next = index + 1 < count;

  return (
    <div
      className="space-y-3 rounded-xl border bg-card p-3"
      data-strength-block="exercise"
    >
      <ExerciseHeader
        info={info}
        exercise={exercise}
        menu={
          <BlockMenu index={index} count={count} apply={apply}>
            <DropdownMenuItem onSelect={() => onReplace(index)}>
              <Replace /> {m.strength_replace()}
            </DropdownMenuItem>
            {next && (
              <DropdownMenuItem
                onSelect={() => apply((blocks) => groupWithNext(blocks, index))}
              >
                <Link2 /> {m.strength_superset_next()}
              </DropdownMenuItem>
            )}
            <DropdownMenuCheckboxItem
              checked={columns.load}
              onCheckedChange={(load) => setColumns({ ...columns, load })}
            >
              {m.strength_load()}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columns.rpe}
              onCheckedChange={(rpe) => setColumns({ ...columns, rpe })}
            >
              RPE
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={options}
              onCheckedChange={setOptions}
            >
              {m.strength_options()}
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            {[
              null,
              EXERCISE_SIDE.EACH,
              EXERCISE_SIDE.ALTERNATE,
              EXERCISE_SIDE.LEFT,
              EXERCISE_SIDE.RIGHT,
            ].map((side) => (
              <DropdownMenuCheckboxItem
                key={side ?? 'both'}
                checked={exercise.side === side}
                onCheckedChange={() => set({ ...exercise, side })}
              >
                {side ? sideLabel(side) : m.strength_side_both()}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
          </BlockMenu>
        }
      />
      {options && <ExerciseOptions exercise={exercise} onChange={set} />}
      <SetTable
        sets={exercise.sets}
        columns={columns}
        onChange={(sets) => set({ ...exercise, sets })}
      />
    </div>
  );
}

function GroupCard({
  block,
  index,
  count,
  update,
  apply,
  resolve,
  onReplace,
  onAddToGroup,
}: CardProps<Block<'group'>>) {
  const columns: SetColumns = {
    load: block.exercises.some((exercise) => {
      const info = resolve(exercise.exerciseRef, exercise.name);
      return (
        info?.equipment !== 'body weight' || exercise.sets[0]?.load !== null
      );
    }),
    rpe: false,
    // An EMOM rests what is left of the minute, an AMRAP goes on
    rest:
      block.group !== WORKOUT_REPEAT_KIND.EMOM &&
      block.group !== WORKOUT_REPEAT_KIND.AMRAP,
  };
  const template = gridColumns(columns, 'minmax(0,2.4fr)', '2rem');
  const setMember = (position: number, exercise: StrengthExercise | null) =>
    update({
      ...block,
      exercises: exercise
        ? block.exercises.map((item, i) => (i === position ? exercise : item))
        : block.exercises.filter((_, i) => i !== position),
    });

  return (
    <div
      className="space-y-3 rounded-xl border-2 border-primary/25 bg-card p-3"
      data-strength-block="group"
      data-group-kind={block.group}
    >
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="font-semibold"
              data-group-kind-select
            >
              <Zap /> {groupKindLabel(block.group)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            {GROUP_KINDS.map((kind) => (
              <DropdownMenuItem
                key={kind}
                className="flex-col items-start gap-0"
                onSelect={() =>
                  update({
                    ...block,
                    group: kind,
                    intervalSeconds:
                      kind === WORKOUT_REPEAT_KIND.EMOM
                        ? (block.intervalSeconds ?? 60)
                        : null,
                    timeCapSeconds:
                      kind === WORKOUT_REPEAT_KIND.AMRAP
                        ? (block.timeCapSeconds ?? 600)
                        : null,
                    rounds:
                      kind === WORKOUT_REPEAT_KIND.AMRAP
                        ? 1
                        : Math.max(block.rounds, 1),
                  })
                }
              >
                <span className="font-medium">{groupKindLabel(kind)}</span>
                <span className="text-xs text-muted-foreground">
                  {groupKindHint(kind)}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {block.group === WORKOUT_REPEAT_KIND.AMRAP ? (
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {m.strength_time_cap()}
            <CellInput
              value={formatSeconds(block.timeCapSeconds)}
              parse={(text) => (parseSeconds(text) ?? 0) >= 30}
              onCommit={(text) =>
                update({ ...block, timeCapSeconds: parseSeconds(text) })
              }
              label={m.strength_time_cap()}
              className="w-16"
            />
          </label>
        ) : (
          <Stepper
            value={block.rounds}
            min={1}
            max={99}
            onChange={(rounds) => update({ ...block, rounds })}
            label={
              block.group === WORKOUT_REPEAT_KIND.EMOM
                ? m.strength_minutes()
                : m.strength_rounds()
            }
            suffix={block.group === WORKOUT_REPEAT_KIND.EMOM ? "'" : '×'}
          />
        )}
        {block.group === WORKOUT_REPEAT_KIND.EMOM && (
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {m.strength_every()}
            <CellInput
              value={formatSeconds(block.intervalSeconds)}
              parse={(text) => (parseSeconds(text) ?? 0) >= 10}
              onCommit={(text) =>
                update({ ...block, intervalSeconds: parseSeconds(text) })
              }
              label={m.strength_every()}
              className="w-16"
            />
          </label>
        )}
        {block.group !== WORKOUT_REPEAT_KIND.EMOM &&
          block.group !== WORKOUT_REPEAT_KIND.AMRAP && (
            <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {m.strength_round_rest()}
              <CellInput
                value={formatSeconds(block.roundRest)}
                parse={(text) => parseSeconds(text) !== null}
                onCommit={(text) =>
                  update({ ...block, roundRest: parseSeconds(text) })
                }
                label={m.strength_round_rest()}
                placeholder="—"
                className="w-16"
              />
            </label>
          )}
        <div className="ml-auto">
          <BlockMenu index={index} count={count} apply={apply}>
            <DropdownMenuItem onSelect={() => onAddToGroup(index)}>
              <Plus /> {m.strength_add_to_group()}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => apply((blocks) => ungroup(blocks, index))}
            >
              <Ungroup /> {m.builder_unwrap()}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </BlockMenu>
        </div>
      </div>
      <div className="space-y-1.5">
        <div
          className="grid items-center gap-1.5 px-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
          style={{ gridTemplateColumns: template }}
        >
          <span>{m.strength_exercise()}</span>
          <span className="text-center">{m.strength_work()}</span>
          {columns.load && (
            <span className="text-center">{m.strength_load()}</span>
          )}
          {columns.rest && (
            <span className="text-center">{m.strength_then()}</span>
          )}
          <span />
        </div>
        {block.exercises.map((exercise, position) => {
          const info = resolve(exercise.exerciseRef, exercise.name);
          const last = position === block.exercises.length - 1;
          const set = exercise.sets[0];
          return (
            <div
              key={position}
              className="grid items-center gap-1.5"
              style={{ gridTemplateColumns: template }}
              data-group-member={position}
            >
              <button
                type="button"
                onClick={() => onReplace(index, position)}
                className="group flex min-w-0 items-center gap-2 rounded-md text-left hover:bg-accent"
              >
                <ExerciseVisual
                  exercise={info}
                  animate="hover"
                  className="size-9 shrink-0 rounded-md bg-muted/50 [&>div]:m-0.5"
                />
                <span className="truncate text-sm font-medium">
                  {exercise.name}
                </span>
              </button>
              {set ? (
                last && columns.rest ? (
                  <>
                    <SetCells
                      set={set}
                      columns={{ ...columns, rest: false }}
                      onChange={(next: StrengthSet) =>
                        setMember(position, { ...exercise, sets: [next] })
                      }
                    />
                    <span className="text-center text-[11px] text-muted-foreground">
                      {m.strength_end_of_round()}
                    </span>
                  </>
                ) : (
                  <SetCells
                    set={set}
                    columns={columns}
                    onChange={(next: StrengthSet) =>
                      setMember(position, { ...exercise, sets: [next] })
                    }
                    restLabel={m.strength_then()}
                  />
                )
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground"
                disabled={block.exercises.length === 1}
                aria-label={m.builder_delete()}
                onClick={() => setMember(position, null)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          );
        })}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 text-xs text-muted-foreground"
        onClick={() => onAddToGroup(index)}
      >
        <Plus className="size-3.5" /> {m.strength_add_to_group()}
      </Button>
    </div>
  );
}

function StepCard({ block, index, count, apply }: CardProps<Block<'step'>>) {
  const step = block.step;
  const length = step.repeatBlock
    ? `${step.repeatBlock.repetitions} × …`
    : (formatStepLength(step) ?? '');
  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-dashed bg-card px-3 py-2"
      data-strength-block="step"
    >
      <span className="text-base font-semibold tabular-nums">{length}</span>
      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
        {step.name}
      </span>
      <BlockMenu index={index} count={count} apply={apply} />
    </div>
  );
}

interface StrengthBuilderProps {
  steps: CreateWorkoutStepDto[];
  onChange: (steps: CreateWorkoutStepDto[]) => void;
  sport: SPORT_TYPE;
  className?: string;
}

type PickerRequest =
  | { mode: 'add' }
  | { mode: 'group'; kind: StrengthGroupKind }
  | { mode: 'replace'; index: number; member?: number }
  | { mode: 'join'; index: number };

/**
 * The strength session editor: exercises from the library with a table of
 * sets, groups (superset, circuit, EMOM, AMRAP, Tabata), and a line to
 * type "squat 4x8 @60kg r2'" for those who know what they want.
 */
export function StrengthBuilder({
  steps,
  onChange,
  sport,
  className,
}: StrengthBuilderProps) {
  const exercises = useExercises();
  const [state, dispatch] = useReducer(strengthReducer, steps, (initial) => ({
    blocks: blocksFromSteps(initial),
    past: [],
    future: [],
  }));
  const [picker, setPicker] = useState<PickerRequest | null>(null);
  const [quick, setQuick] = useState('');
  const quickInput = useRef<HTMLInputElement>(null);

  const emitted = useRef(JSON.stringify(steps));
  useEffect(() => {
    const next = stepsFromBlocks(state.blocks);
    const serialized = JSON.stringify(next);
    if (serialized === emitted.current) return;
    emitted.current = serialized;
    onChange(next);
  }, [state.blocks, onChange]);
  useEffect(() => {
    const serialized = JSON.stringify(steps);
    if (serialized === emitted.current) return;
    emitted.current = serialized;
    dispatch({ type: 'reset', steps });
  }, [steps]);

  const apply = (change: (blocks: UBlock[]) => UBlock[]) =>
    dispatch({ type: 'set', blocks: change(state.blocks) });
  const update = (block: UBlock) =>
    apply((blocks) =>
      blocks.map((item) => (item.uid === block.uid ? block : item)),
    );

  const quickParsed = useMemo(() => parseQuickExercise(quick), [quick]);
  const quickMatch = useMemo(
    () =>
      quickParsed
        ? (searchExercises(exercises.all, quickParsed.query)[0] ?? null)
        : null,
    [quickParsed, exercises.all],
  );
  const quickStep = useMemo(() => {
    if (quickParsed || !quick.trim()) return null;
    const result = parseWorkoutText(`- ${quick}`, { sport });
    return result.issues.some((issue) => issue.severity === 'error')
      ? null
      : result.steps;
  }, [quick, quickParsed, sport]);

  const submitQuick = () => {
    if (quickParsed && quickMatch) {
      apply((blocks) => [
        ...blocks,
        ...withIds([
          {
            kind: 'exercise',
            exercise: exerciseFrom(quickMatch, quickSets(quickParsed)),
          },
        ]),
      ]);
      setQuick('');
    } else if (quickStep?.length) {
      apply((blocks) => [
        ...blocks,
        ...withIds(quickStep.map((step) => ({ kind: 'step' as const, step }))),
      ]);
      setQuick('');
    }
  };

  const onPick = (infos: ExerciseInfo[]) => {
    const request = picker;
    if (!request) return;
    if (request.mode === 'add') {
      apply((blocks) => [
        ...blocks,
        ...withIds(
          infos.map((info) => ({
            kind: 'exercise' as const,
            exercise: exerciseFrom(info),
          })),
        ),
      ]);
    } else if (request.mode === 'group') {
      apply((blocks) => [
        ...blocks,
        ...withIds([groupFrom(request.kind, infos)]),
      ]);
    } else if (request.mode === 'join') {
      apply((blocks) =>
        blocks.map((block, index) => {
          if (index !== request.index || block.kind !== 'group') return block;
          const model = block.exercises[block.exercises.length - 1]?.sets[0];
          return {
            ...block,
            exercises: [
              ...block.exercises,
              ...infos.map((info) => {
                const exercise = exerciseFrom(info);
                return {
                  ...exercise,
                  sets: [
                    model
                      ? { ...model, work: { ...model.work } }
                      : exercise.sets[0],
                  ],
                };
              }),
            ],
          };
        }),
      );
    } else {
      const [info] = infos;
      apply((blocks) =>
        blocks.map((block, index) => {
          if (index !== request.index) return block;
          const swap = (exercise: StrengthExercise): StrengthExercise => ({
            ...exercise,
            exerciseRef: info.ref,
            name: info.name,
          });
          if (block.kind === 'exercise')
            return { ...block, exercise: swap(block.exercise) };
          if (block.kind === 'group' && request.member !== undefined) {
            return {
              ...block,
              exercises: block.exercises.map((exercise, i) =>
                i === request.member ? swap(exercise) : exercise,
              ),
            };
          }
          return block;
        }),
      );
    }
  };

  const seconds = strengthSeconds(state.blocks);
  const sets = state.blocks.reduce(
    (sum, block) =>
      sum +
      (block.kind === 'exercise'
        ? block.exercise.sets.length
        : block.kind === 'group'
          ? block.exercises.length * block.rounds
          : 0),
    0,
  );
  const equipment = [
    ...new Set(
      state.blocks
        .flatMap((block) =>
          block.kind === 'exercise'
            ? [block.exercise]
            : block.kind === 'group'
              ? block.exercises
              : [],
        )
        .map(
          (exercise) =>
            exercises.resolve(exercise.exerciseRef, exercise.name)?.equipment,
        )
        .filter((key): key is string => !!key && key !== 'body weight'),
    ),
  ];

  const cardProps = <B extends UBlock>(
    block: B,
    index: number,
  ): CardProps<B> => ({
    block,
    index,
    count: state.blocks.length,
    update,
    apply,
    resolve: exercises.resolve,
    onReplace: (i, member) => setPicker({ mode: 'replace', index: i, member }),
    onAddToGroup: (i) => setPicker({ mode: 'join', index: i }),
  });

  return (
    <div className={cn('min-w-0 space-y-3', className)} data-strength-builder>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border bg-card p-3">
        <span className="text-2xl font-bold tabular-nums" data-builder-total>
          {seconds ? formatTotal(seconds) : '—'}
        </span>
        <span className="text-sm text-muted-foreground">
          {m.strength_summary({ sets })}
        </span>
        {equipment.length > 0 && (
          <span
            className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground"
            data-equipment-list
          >
            <Dumbbell className="size-4 shrink-0" />
            <span className="truncate">
              {equipment.map(equipmentLabel).join(', ')}
            </span>
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={!state.past.length}
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
            disabled={!state.future.length}
            onClick={() => dispatch({ type: 'redo' })}
            aria-label={m.builder_redo()}
          >
            <Redo2 />
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="relative">
          <Input
            ref={quickInput}
            value={quick}
            onChange={(event) => setQuick(event.target.value)}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === 'Enter') {
                event.preventDefault();
                submitQuick();
              }
            }}
            placeholder={m.strength_quick_placeholder()}
            aria-label={m.strength_quick_label()}
            className="h-11 pr-24 font-mono text-sm"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="done"
            data-strength-quick
          />
          <Button
            type="button"
            size="sm"
            className="absolute right-1.5 top-1/2 -translate-y-1/2"
            disabled={!(quickParsed && quickMatch) && !quickStep?.length}
            onClick={submitQuick}
          >
            <CornerDownLeft />
            {m.builder_quick_add()}
          </Button>
        </div>
        <p className="min-h-5 text-xs text-muted-foreground" role="status">
          {quick.trim()
            ? quickParsed
              ? quickMatch
                ? `→ ${quickMatch.name} · ${quickParsed.sets} × ${quickParsed.work.type === 'REPS' ? quickParsed.work.value : formatSeconds(quickParsed.work.value)}${quickParsed.load ? ` @ ${quickParsed.load} kg` : ''}${quickParsed.rest ? ` · ${m.strength_rest()} ${formatSeconds(quickParsed.rest)}` : ''}`
                : m.strength_quick_no_match({ query: quickParsed.query })
              : quickStep
                ? `→ ${quickStep.map((step) => formatStepLength(step) ?? '').join(' + ')}`
                : m.strength_quick_hint()
            : m.strength_quick_hint()}
        </p>
      </div>

      {state.blocks.length === 0 ? (
        <div className="rounded-xl border border-dashed px-4 py-8 text-center">
          <p className="text-sm font-medium">{m.strength_empty_title()}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {m.strength_empty_hint()}
          </p>
        </div>
      ) : (
        <div className="space-y-2" data-strength-blocks>
          {state.blocks.map((block, index) =>
            block.kind === 'exercise' ? (
              <ExerciseCard key={block.uid} {...cardProps(block, index)} />
            ) : block.kind === 'group' ? (
              <GroupCard key={block.uid} {...cardProps(block, index)} />
            ) : (
              <StepCard key={block.uid} {...cardProps(block, index)} />
            ),
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => setPicker({ mode: 'add' })}
          data-add-exercise
        >
          <Plus /> {m.strength_add_exercise()}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" data-add-group>
              <Zap /> {m.strength_add_group()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            {GROUP_KINDS.map((kind) => (
              <DropdownMenuItem
                key={kind}
                className="flex-col items-start gap-0"
                onSelect={() => setPicker({ mode: 'group', kind })}
              >
                <span className="font-medium">{groupKindLabel(kind)}</span>
                <span className="text-xs text-muted-foreground">
                  {groupKindHint(kind)}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ExercisePicker
        open={!!picker}
        onOpenChange={(open) => !open && setPicker(null)}
        multiple={
          picker?.mode === 'group' ||
          picker?.mode === 'join' ||
          picker?.mode === 'add'
        }
        onPick={onPick}
      />
    </div>
  );
}
