import { useCompleteStrengthSessionMutation } from '@/api/exercise';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { m } from '@/paraglide/messages';
import { activityPath } from '@/routes/paths';
import { hapticSuccess, hapticTap } from '@/utils/haptics';
import { cn } from '@/utils/shadcn';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Maximize,
  Minimize,
  Minus,
  Pause,
  Play,
  Plus,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import type {
  AmrapMoment,
  CreateWorkoutStepDto,
  Moment,
  WorkMoment,
} from '@openathlete/shared';
import {
  WORKOUT_DURATION_TYPE,
  nextWork,
  sessionTimeline,
  strengthBlocks,
  strengthSeconds,
} from '@openathlete/shared';

import { ConfirmAction } from '../confirm-action/confirm-action';
import { formatStepLength, formatTotal } from '../session-builder/step-summary';
import { stepTypeLabel } from '../session-builder/step-type-label';
import { equipmentLabel } from '../strength/exercise-labels';
import { ExerciseVisual } from '../strength/exercise-visual';
import { setsSummary } from '../strength/sets-summary';
import { groupKindLabel, sideLabel } from '../strength/strength-labels';
import { type ExerciseInfo, useExercises } from '../strength/use-exercises';
import { beep, speak, unlockAudio, vibrate } from './player-cues';
import {
  type PlayerState,
  current,
  initialPlayer,
  momentRemaining,
  momentSeconds,
  playerReducer,
  sessionElapsed,
  sessionResult,
  sessionTotals,
} from './player-state';
import { announcement, clock, positionText, workText } from './player-text';

const MUTE_KEY = 'openathlete_player_muted';
const saveKey = (eventId: number) => `openathlete_player_${eventId}`;

/** A session under way survives a reload or an accidental close */
function restore(eventId: number, moments: Moment[]): PlayerState {
  const fresh = initialPlayer(moments);
  try {
    const saved = JSON.parse(
      localStorage.getItem(saveKey(eventId)) ?? 'null',
    ) as (Omit<PlayerState, 'moments'> & { count: number; at: number }) | null;
    // Another plan, or a day old: start again
    if (
      !saved ||
      saved.count !== moments.length ||
      Date.now() - saved.at > 12 * 3600 * 1000
    ) {
      return fresh;
    }
    if (saved.phase === 'running') {
      // It was running when it stopped: it waits paused from then
      return {
        ...fresh,
        ...saved,
        moments,
        phase: 'paused',
        pausedAt: saved.at,
      };
    }
    return { ...fresh, ...saved, moments };
  } catch {
    return fresh;
  }
}

function persist(eventId: number, state: PlayerState) {
  try {
    if (state.phase === 'ready') {
      localStorage.removeItem(saveKey(eventId));
      return;
    }
    const { moments, ...rest } = state;
    localStorage.setItem(
      saveKey(eventId),
      JSON.stringify({ ...rest, count: moments.length, at: Date.now() }),
    );
  } catch {
    // Storage is a safety net, not a requirement
  }
}

function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
      } catch {
        // Denied (battery saver): the screen may sleep
      }
      if (cancelled) void lock?.release();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') void request();
    };
    void request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release();
    };
  }, [active]);
}

/** A countdown as a ring that empties */
function Ring({
  progress,
  children,
  className,
  tone = 'primary',
}: {
  progress: number;
  children: ReactNode;
  className?: string;
  tone?: 'primary' | 'rest';
}) {
  const radius = 46;
  const length = 2 * Math.PI * radius;
  return (
    <div className={cn('relative aspect-square', className)}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          className="fill-none stroke-muted"
          strokeWidth="5"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          className={cn(
            'fill-none transition-[stroke-dashoffset] duration-200 ease-linear',
            tone === 'rest' ? 'stroke-[var(--chart-2)]' : 'stroke-primary',
          )}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - Math.max(0, Math.min(1, progress)))}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

function Adjuster({
  label,
  value,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-1 rounded-full border bg-card p-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 rounded-full"
          aria-label={`${label} −`}
          onClick={() => onChange(Math.max(0, value - step))}
        >
          <Minus />
        </Button>
        <span className="min-w-16 text-center text-xl font-bold tabular-nums">
          {value}
          <span className="ml-0.5 text-sm font-medium text-muted-foreground">
            {unit}
          </span>
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 rounded-full"
          aria-label={`${label} +`}
          onClick={() => onChange(value + step)}
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}

/** Seconds of one way of the drawn movement, from the tempo when there is one */
function movementPeriod(moment: WorkMoment): number {
  const [eccentric, , concentric] = (moment.tempo ?? '').split('-').map(Number);
  const total =
    (Number.isFinite(eccentric) ? eccentric : 0) +
    (Number.isFinite(concentric) ? concentric : 0);
  return total > 0 ? Math.min(4, Math.max(0.8, total / 2)) : 1.4;
}

function WorkView({
  moment,
  info,
  remaining,
  total,
  reps,
  load,
  onReps,
  onLoad,
  paused,
}: {
  moment: WorkMoment;
  info: ExerciseInfo | null;
  remaining: number | null;
  total: number | null;
  reps: number;
  load: number | null;
  onReps: (value: number) => void;
  onLoad: (value: number) => void;
  paused: boolean;
}) {
  const [howTo, setHowTo] = useState(false);
  const timed = moment.work.type === WORKOUT_DURATION_TYPE.TIME;
  const isReps = moment.work.type === WORKOUT_DURATION_TYPE.REPS;
  return (
    <div
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-4 md:flex-row md:items-center md:gap-10"
      data-player-work={moment.key}
    >
      <div className="relative w-full max-w-sm flex-1 md:max-w-none">
        <ExerciseVisual
          exercise={info}
          animate={!paused}
          period={movementPeriod(moment)}
          className="mx-auto aspect-square max-h-[38vh] w-full md:max-h-[60vh]"
        />
        {info?.mediaUrl && (
          <a
            href={info.mediaUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="absolute bottom-2 right-2 rounded-full border bg-background/90 px-3 py-1.5 text-xs font-medium"
          >
            {m.player_watch_video()}
          </a>
        )}
      </div>
      <div className="flex w-full flex-1 flex-col items-center gap-3 text-center md:items-start md:text-left">
        <span
          className="rounded-full bg-muted px-3 py-1 text-sm font-semibold"
          data-player-position
        >
          {positionText(moment)}
        </span>
        <h1
          className="text-3xl font-bold leading-tight tracking-tight md:text-5xl"
          data-player-exercise
        >
          {moment.name || info?.name}
        </h1>
        {timed && remaining !== null && total ? (
          <Ring progress={remaining / total} className="w-40 md:w-48">
            <span
              className="text-5xl font-bold tabular-nums md:text-6xl"
              data-player-clock
            >
              {clock(remaining)}
            </span>
          </Ring>
        ) : (
          <p
            className="text-2xl font-semibold text-muted-foreground md:text-3xl"
            data-player-target
          >
            {workText(moment) || m.player_open()}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-1.5 md:justify-start">
          {moment.side && (
            <span className="rounded-md border px-2 py-0.5 text-xs">
              {sideLabel(moment.side)}
            </span>
          )}
          {moment.tempo && (
            <span className="rounded-md border px-2 py-0.5 text-xs">
              {m.strength_tempo()} {moment.tempo}
            </span>
          )}
          {moment.rpe && (
            <span className="rounded-md border px-2 py-0.5 text-xs">
              RPE {moment.rpe}
            </span>
          )}
        </div>
        {moment.notes && (
          <p className="max-w-prose text-base italic text-muted-foreground">
            {moment.notes}
          </p>
        )}
        {isReps && (
          <div
            className="flex flex-wrap justify-center gap-3 md:justify-start"
            data-player-adjust
          >
            <Adjuster
              label={m.player_done_reps()}
              value={reps}
              step={1}
              unit=""
              onChange={onReps}
            />
            {load !== null && (
              <Adjuster
                label={m.strength_load()}
                value={load}
                step={2.5}
                unit="kg"
                onChange={onLoad}
              />
            )}
          </div>
        )}
        {info && info.steps.length > 0 && (
          <div className="w-full max-w-prose">
            <button
              type="button"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => setHowTo((open) => !open)}
              aria-expanded={howTo}
            >
              {howTo ? m.player_hide_how() : m.player_show_how()}
            </button>
            {howTo && (
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-left text-sm text-muted-foreground">
                {info.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NextUp({
  moment,
  info,
}: {
  moment: WorkMoment | AmrapMoment | null;
  info: ExerciseInfo | null;
}) {
  if (!moment) {
    return (
      <p className="text-lg font-medium text-muted-foreground">
        {m.player_last()}
      </p>
    );
  }
  const work = moment.kind === 'work' ? moment : moment.round[0];
  return (
    <div
      className="flex w-full max-w-md items-center gap-4 rounded-2xl border bg-card p-3"
      data-player-next
    >
      <ExerciseVisual
        exercise={info}
        animate
        className="size-20 shrink-0 rounded-xl bg-muted/50 [&>div]:m-1"
      />
      <div className="min-w-0 text-left">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {m.player_next()}
        </p>
        <p className="truncate text-lg font-semibold">
          {moment.kind === 'amrap'
            ? `AMRAP · ${clock(moment.seconds)}`
            : work?.name}
        </p>
        {moment.kind === 'work' && (
          <p className="text-sm text-muted-foreground">
            {positionText(moment)} · {workText(moment)}
          </p>
        )}
      </div>
    </div>
  );
}

interface SessionPlayerProps {
  eventId: number;
  name: string;
  steps: CreateWorkoutStepDto[];
  /** The session was recorded already: play it again, without saving */
  done: boolean;
  onExit: () => void;
}

/**
 * The full-screen session player: the exercise drawn as it moves, what to
 * do in big, the rest counted down with what comes next, beeps and the
 * voice for those who train with the phone on the floor. What was done is
 * written as it goes and becomes the activity at the end.
 */
export function SessionPlayer({
  eventId,
  name,
  steps,
  done,
  onExit,
}: SessionPlayerProps) {
  const navigate = useNavigate();
  const { resolve } = useExercises();
  const moments = useMemo(() => sessionTimeline(steps), [steps]);
  const [state, dispatch] = useReducer(playerReducer, moments, (list) =>
    restore(eventId, list),
  );
  const [now, setNow] = useState(() => Date.now());
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [fullscreen, setFullscreen] = useState(false);
  const [reps, setReps] = useState(0);
  const [load, setLoad] = useState<number | null>(null);
  const [rpe, setRpe] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const complete = useCompleteStrengthSessionMutation();

  const moment = current(state);
  const running = state.phase === 'running';
  const next = nextWork(state.moments, state.index);
  const infoOf = useCallback(
    (work: WorkMoment | undefined | null) =>
      work ? resolve(work.exerciseRef, work.name) : null,
    [resolve],
  );

  // The clock: a tick drives timed moments and the countdowns on screen
  useEffect(() => {
    if (state.phase !== 'running') return;
    const timer = window.setInterval(() => {
      const time = Date.now();
      setNow(time);
      dispatch({ type: 'tick', now: time });
    }, 200);
    return () => window.clearInterval(timer);
  }, [state.phase]);

  useEffect(() => persist(eventId, state), [eventId, state]);
  useWakeLock(running);

  // The athlete's figures start from the plan of each set
  useEffect(() => {
    if (moment?.kind !== 'work') return;
    setReps(
      moment.work.type === WORKOUT_DURATION_TYPE.REPS ? moment.work.value : 0,
    );
    setLoad(moment.load);
  }, [moment]);

  // A word on entering each moment, beeps on the last three seconds
  const announced = useRef<string | null>(null);
  useEffect(() => {
    if (!running || !moment || announced.current === moment.key) return;
    announced.current = moment.key;
    hapticTap();
    vibrate(80);
    if (!muted) speak(announcement(moment, next));
  }, [running, moment, next, muted]);
  const remaining = momentRemaining(state, now);
  const lastBeep = useRef<string>('');
  useEffect(() => {
    if (!running || remaining === null || muted || !moment) return;
    const second = Math.ceil(remaining);
    const mark = `${moment.key}:${second}`;
    if (
      second <= 3 &&
      second >= 1 &&
      lastBeep.current !== mark &&
      remaining > 0.05
    ) {
      lastBeep.current = mark;
      beep(second === 1 ? 'go' : 'tick');
    }
  }, [remaining, running, muted, moment]);

  useEffect(() => {
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch {
      // A preference of this device only
    }
  }, [muted]);

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else
      void document.documentElement
        .requestFullscreen?.()
        .catch(() => undefined);
  };

  const act = useCallback(
    (type: 'done' | 'skip' | 'back' | 'pause' | 'resume') => {
      const time = Date.now();
      setNow(time);
      if (type === 'done') dispatch({ type, now: time, reps, load });
      else dispatch({ type, now: time });
    },
    [reps, load],
  );
  const start = () => {
    unlockAudio();
    const time = Date.now();
    setNow(time);
    dispatch({ type: 'start', now: time });
    if (window.matchMedia('(pointer: coarse)').matches) toggleFullscreen();
  };

  const primary = () => {
    if (state.phase === 'paused') return act('resume');
    if (!moment) return;
    if (moment.kind === 'rest') return act('skip');
    // A hold or a timed step can end before its time: the time it lasted counts
    act('done');
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (state.phase !== 'running' && state.phase !== 'paused') return;
      if ((event.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        primary();
      } else if (event.key === 'ArrowRight') act('skip');
      else if (event.key === 'ArrowLeft') act('back');
      else if (event.key.toLowerCase() === 'p')
        act(state.phase === 'paused' ? 'resume' : 'pause');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const [quitting, setQuitting] = useState(false);
  const leave = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    onExit();
  };
  const exit = () => {
    if (state.phase === 'running' || state.phase === 'paused') {
      // Kept paused: the session can be taken up again later
      dispatch({ type: 'pause', now: Date.now() });
      setQuitting(true);
      return;
    }
    leave();
  };
  const discard = () => {
    try {
      localStorage.removeItem(saveKey(eventId));
    } catch {
      // Nothing kept
    }
    onExit();
  };

  const save = () => {
    complete.mutate(
      { eventId, body: sessionResult(state, rpe, comment) },
      {
        onSuccess: (activity) => {
          hapticSuccess();
          try {
            localStorage.removeItem(saveKey(eventId));
          } catch {
            // Nothing kept
          }
          toast.success(m.player_saved());
          navigate(activityPath(activity.eventId), { replace: true });
        },
        onError: () => toast.error(m.player_save_error()),
      },
    );
  };

  const elapsed = sessionElapsed(state, now);
  const workMoments = state.moments.filter((item) => item.kind !== 'rest');
  const progress = workMoments.length
    ? workMoments.filter((item) => state.moments.indexOf(item) < state.index)
        .length / workMoments.length
    : 0;

  // Before: what the session holds and what to bring
  if (state.phase === 'ready') {
    const blocks = strengthBlocks(steps);
    const kit = [
      ...new Set(
        state.moments
          .flatMap((item) =>
            item.kind === 'work'
              ? [item]
              : item.kind === 'amrap'
                ? item.round
                : [],
          )
          .map((item) => infoOf(item)?.equipment)
          .filter((key): key is string => !!key && key !== 'body weight'),
      ),
    ];
    // One line per exercise, with all its sets: a pyramid reads 8 / 6 / 4
    const lines = blocks.flatMap((block) => {
      if (block.kind === 'exercise') {
        return [
          {
            exercise: block.exercise,
            detail: setsSummary(block.exercise.sets),
          },
        ];
      }
      if (block.kind === 'group') {
        return block.exercises.map((exercise) => ({
          exercise,
          detail: `${groupKindLabel(block.group)} · ${setsSummary(
            Array.from(
              { length: block.group === 'AMRAP' ? 1 : block.rounds },
              () => ({ ...exercise.sets[0], rest: null }),
            ),
          )}`,
        }));
      }
      return [
        {
          exercise: {
            exerciseRef: null,
            name: block.step.name ?? '',
            sets: [],
            tempo: null,
            side: null,
            notes: null,
          },
          detail: [
            stepTypeLabel(block.step.stepType),
            formatStepLength(block.step),
          ]
            .filter(Boolean)
            .join(' · '),
        },
      ];
    });
    return (
      <div
        className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-4 pb-[calc(1.5rem+var(--safe-bottom))] pt-[calc(1rem+var(--safe-top))]"
        data-player="ready"
      >
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            onClick={exit}
            aria-label={m.ui_close()}
          >
            <X />
          </Button>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            {m.player_ready_kicker()}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          <p className="text-muted-foreground">
            ≈ {formatTotal(strengthSeconds(blocks))} ·{' '}
            {m.player_ready_count({
              count: lines.filter((line) => line.exercise.exerciseRef).length,
            })}
          </p>
        </div>
        {kit.length > 0 && (
          <div
            className="flex items-start gap-2 rounded-xl border bg-card p-3 text-sm"
            data-player-kit
          >
            <Dumbbell className="mt-0.5 size-4 shrink-0" />
            <span>
              <span className="font-medium">{m.player_kit()} </span>
              {kit.map(equipmentLabel).join(', ')}
            </span>
          </div>
        )}
        <ul className="space-y-2">
          {lines.map(({ exercise, detail }, index) => (
            <li
              key={index}
              className="flex items-center gap-3 rounded-xl border bg-card p-2"
            >
              <ExerciseVisual
                exercise={resolve(exercise.exerciseRef, exercise.name)}
                className="size-14 shrink-0 rounded-lg bg-muted/50 [&>div]:m-1"
              />
              <div className="min-w-0">
                <p className="truncate font-medium">{exercise.name}</p>
                <p className="text-sm tabular-nums text-muted-foreground">
                  {detail}
                </p>
              </div>
            </li>
          ))}
        </ul>
        {done && (
          <p className="rounded-xl bg-muted p-3 text-sm">
            {m.player_already_done()}
          </p>
        )}
        <Button
          type="button"
          size="lg"
          className="sticky bottom-[calc(1rem+var(--safe-bottom))] h-14 text-lg"
          onClick={start}
          disabled={moments.length === 0}
          data-player-start
        >
          <Play /> {m.player_start()}
        </Button>
      </div>
    );
  }

  // After: how it went
  if (state.phase === 'finished') {
    const totals = sessionTotals(state);
    return (
      <div
        className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-6 px-4 pb-[calc(1.5rem+var(--safe-bottom))] pt-[calc(2rem+var(--safe-top))]"
        data-player="finished"
      >
        <div className="text-center">
          <p className="text-5xl" aria-hidden>
            💪
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {m.player_finished()}
          </h1>
          <p className="mt-1 text-muted-foreground">{name}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            [
              clock(sessionElapsed(state, state.finishedAt ?? now)),
              m.player_total_time(),
            ],
            [String(totals.sets), m.player_total_sets()],
            [
              totals.volume ? `${totals.volume} kg` : String(totals.reps),
              totals.volume ? m.player_total_volume() : m.player_total_reps(),
            ],
          ].map(([value, label]) => (
            <div key={label} className="rounded-xl border bg-card p-3">
              <p className="text-2xl font-bold tabular-nums">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <p className="font-medium">{m.player_rpe_question()}</p>
          <div
            className="grid grid-cols-10 gap-1"
            role="radiogroup"
            aria-label="RPE"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rpe === value}
                onClick={() => setRpe(value)}
                className={cn(
                  'h-11 rounded-lg border text-sm font-semibold tabular-nums',
                  rpe === value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'hover:bg-accent',
                )}
              >
                {value}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{m.player_rpe_easy()}</span>
            <span>{m.player_rpe_max()}</span>
          </div>
        </div>
        <Textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder={m.player_comment()}
          aria-label={m.player_comment()}
          className="h-24"
        />
        <div className="mt-auto flex flex-col gap-2">
          {!done && (
            <Button
              type="button"
              size="lg"
              className="h-14 text-lg"
              onClick={save}
              isLoading={complete.isPending}
              data-player-save
            >
              <Check /> {m.player_save()}
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={discard}>
            {done ? m.ui_close() : m.player_discard()}
          </Button>
        </div>
      </div>
    );
  }

  // During
  const total = momentSeconds(state);
  const isRest = moment?.kind === 'rest';
  const timedWork =
    moment?.kind === 'work' && moment.work.type === WORKOUT_DURATION_TYPE.TIME;
  const primaryLabel =
    state.phase === 'paused'
      ? m.player_resume()
      : isRest
        ? m.player_skip_rest()
        : timedWork
          ? m.player_step_done()
          : m.player_set_done();
  const primaryIcon =
    state.phase === 'paused' ? (
      <Play />
    ) : isRest ? (
      <SkipForward />
    ) : timedWork ? (
      <Check />
    ) : (
      <Check />
    );

  return (
    <div
      className="flex min-h-dvh flex-col bg-background pb-[calc(1rem+var(--safe-bottom))] pt-[var(--safe-top)]"
      data-player={state.phase}
    >
      <header className="flex items-center gap-2 px-2 py-2 md:px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11"
          onClick={exit}
          aria-label={m.ui_close()}
        >
          <X />
        </Button>
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span
          className="w-14 text-right text-sm font-semibold tabular-nums"
          data-player-elapsed
        >
          {clock(elapsed)}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11"
          onClick={() => act(state.phase === 'paused' ? 'resume' : 'pause')}
          aria-label={
            state.phase === 'paused' ? m.player_resume() : m.player_pause()
          }
          data-player-pause
        >
          {state.phase === 'paused' ? <Play /> : <Pause />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11"
          onClick={() => setMuted((value) => !value)}
          aria-label={muted ? m.player_unmute() : m.player_mute()}
          aria-pressed={muted}
        >
          {muted ? <VolumeX /> : <Volume2 />}
        </Button>
        {'requestFullscreen' in document.documentElement && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden size-11 sm:inline-flex"
            onClick={toggleFullscreen}
            aria-label={m.player_fullscreen()}
          >
            {fullscreen ? <Minimize /> : <Maximize />}
          </Button>
        )}
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-2 md:px-10">
        {state.phase === 'paused' && (
          <p
            className="rounded-full bg-muted px-4 py-1.5 text-sm font-semibold"
            role="status"
          >
            {m.player_paused()}
          </p>
        )}
        {moment?.kind === 'work' && (
          <WorkView
            moment={moment}
            info={infoOf(moment)}
            remaining={remaining}
            total={total}
            reps={reps}
            load={load}
            onReps={setReps}
            onLoad={setLoad}
            paused={state.phase === 'paused'}
          />
        )}
        {isRest && remaining !== null && (
          <div className="flex flex-col items-center gap-6" data-player-rest>
            <Ring
              progress={total ? remaining / total : 0}
              tone="rest"
              className="w-56 md:w-72"
            >
              <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                {m.player_rest()}
              </span>
              <span
                className="text-6xl font-bold tabular-nums md:text-7xl"
                data-player-clock
              >
                {clock(remaining)}
              </span>
            </Ring>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-full px-5"
                onClick={() =>
                  dispatch({
                    type: 'adjustRest',
                    seconds: -15,
                    now: Date.now(),
                  })
                }
              >
                −15 s
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-full px-5"
                onClick={() =>
                  dispatch({ type: 'adjustRest', seconds: 15, now: Date.now() })
                }
              >
                +15 s
              </Button>
            </div>
            <NextUp
              moment={next}
              info={
                next?.kind === 'work'
                  ? infoOf(next)
                  : next
                    ? infoOf(next.round[0])
                    : null
              }
            />
          </div>
        )}
        {moment?.kind === 'amrap' && remaining !== null && (
          <AmrapView
            moment={moment}
            state={state}
            remaining={remaining}
            infoOf={infoOf}
          />
        )}
      </main>

      <footer className="mx-auto flex w-full max-w-xl items-center gap-3 px-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-14 shrink-0 rounded-full"
          onClick={() => act('back')}
          aria-label={m.player_back()}
          data-player-back
        >
          <ChevronLeft className="size-6" />
        </Button>
        <Button
          type="button"
          size="lg"
          className="h-16 flex-1 rounded-full text-lg font-semibold"
          onClick={primary}
          data-player-primary
        >
          {primaryIcon}
          {primaryLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-14 shrink-0 rounded-full"
          onClick={() => act('skip')}
          aria-label={m.player_skip()}
          data-player-skip
        >
          <ChevronRight className="size-6" />
        </Button>
      </footer>
      <button
        type="button"
        className="mx-auto mt-2 text-xs text-muted-foreground underline-offset-4 hover:underline"
        onClick={() => dispatch({ type: 'finish', now: Date.now() })}
      >
        {m.player_finish_now()}
      </button>
      <ConfirmAction
        open={quitting}
        onClose={() => setQuitting(false)}
        onConfirm={leave}
        title={m.player_quit_title()}
        message={m.player_confirm_quit()}
        confirmText={m.player_quit()}
        cancelText={m.player_stay()}
      />
    </div>
  );
}

function AmrapView({
  moment,
  state,
  remaining,
  infoOf,
}: {
  moment: AmrapMoment;
  state: PlayerState;
  remaining: number;
  infoOf: (work: WorkMoment) => ExerciseInfo | null;
}) {
  const progress = state.amrap[moment.key] ?? { position: 0, rounds: 0 };
  const work = moment.round[progress.position];
  return (
    <div
      className="flex w-full max-w-4xl flex-col items-center gap-6 md:flex-row md:justify-center md:gap-12"
      data-player-amrap
    >
      <Ring progress={remaining / moment.seconds} className="w-44 md:w-60">
        <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          AMRAP
        </span>
        <span className="text-5xl font-bold tabular-nums md:text-6xl">
          {clock(remaining)}
        </span>
        <span className="text-sm font-medium" data-player-rounds>
          {m.player_rounds_done({ count: progress.rounds })}
        </span>
      </Ring>
      {work && (
        <div className="flex flex-col items-center gap-3 text-center md:items-start md:text-left">
          <ExerciseVisual
            exercise={infoOf(work)}
            animate
            className="size-48 md:size-64"
          />
          <h1 className="text-3xl font-bold">{work.name}</h1>
          <p className="text-2xl text-muted-foreground">{workText(work)}</p>
          <p className="text-sm text-muted-foreground">
            {m.player_amrap_position({
              position: progress.position + 1,
              count: moment.round.length,
            })}
          </p>
        </div>
      )}
    </div>
  );
}
