import {
  FitnessState,
  addUtcDays,
  advanceFitness,
  getUtcWeekStart,
  startOfUtcDay,
  toUtcDateKey,
} from './training-load';

export interface LoadEntry {
  date: Date;
  value: number;
}

export interface PlannedSessionLoad {
  startDate: Date;
  /** Estimated TRIMP of the session, null when it cannot be estimated */
  load: number | null;
  /** An activity is linked: its own load is already in the actual load */
  done: boolean;
}

export interface WeekLoad {
  weekStart: Date;
  weekEnd: Date;
  /** Load of the activities done */
  actual: number;
  /** Load of the sessions still to do, from today on */
  estimated: number;
  /** Load of every session planned in the week, done, missed or to do */
  planned: number;
  /** Fitness and fatigue at the end of the week */
  fitness: FitnessState;
  /** The week ends today or later: its fitness counts sessions still to do */
  projected: boolean;
}

/**
 * Buckets loads into UTC weeks, Monday to Sunday, from the week of `from` to
 * the week of `to`, and runs the fitness model day by day over the whole span:
 * done activities up to today, then the sessions still planned.
 *
 * Missed sessions (past and not done) count in `planned` only: they neither
 * add to the remaining load nor to the projected fitness.
 *
 * Everything happens in one pass over the inputs, so callers fetch each table
 * once for the whole range.
 */
export function buildWeeklyLoads({
  from,
  to,
  entries,
  sessions,
  today,
}: {
  from: Date;
  to: Date;
  entries: LoadEntry[];
  sessions: PlannedSessionLoad[];
  today: Date;
}): WeekLoad[] {
  const firstWeek = getUtcWeekStart(from);
  const lastWeek = getUtcWeekStart(to);
  const todayStart = startOfUtcDay(today);

  const weeks = new Map<string, WeekLoad>();
  for (
    let weekStart = firstWeek;
    weekStart <= lastWeek;
    weekStart = addUtcDays(weekStart, 7)
  ) {
    const weekEnd = addUtcDays(weekStart, 6);
    weeks.set(toUtcDateKey(weekStart), {
      weekStart,
      weekEnd,
      actual: 0,
      estimated: 0,
      planned: 0,
      fitness: { ctl: 0, atl: 0 },
      projected: weekEnd >= todayStart,
    });
  }

  const weekOf = (date: Date) => weeks.get(toUtcDateKey(getUtcWeekStart(date)));
  const dailyLoad = new Map<string, number>();
  const addDailyLoad = (date: Date, load: number) => {
    const key = toUtcDateKey(date);
    dailyLoad.set(key, (dailyLoad.get(key) ?? 0) + load);
  };

  for (const entry of entries) {
    const week = weekOf(entry.date);
    if (!week) continue;
    week.actual += entry.value;
    addDailyLoad(entry.date, entry.value);
  }

  for (const session of sessions) {
    const week = weekOf(session.startDate);
    if (!week || session.load === null) continue;
    week.planned += session.load;
    if (!session.done && session.startDate >= todayStart) {
      week.estimated += session.load;
      addDailyLoad(session.startDate, session.load);
    }
  }

  let fitness: FitnessState = { ctl: 0, atl: 0 };
  const sorted = [...weeks.values()];
  for (const week of sorted) {
    for (let day = 0; day < 7; day++) {
      const date = addUtcDays(week.weekStart, day);
      fitness = advanceFitness(fitness, dailyLoad.get(toUtcDateKey(date)) ?? 0);
    }
    week.fitness = fitness;
  }

  return sorted;
}

export interface DayLoad {
  date: Date;
  /** Done load, then planned load from today on */
  load: number;
  fitness: FitnessState;
  /** Today or later: counts the sessions still to do */
  projected: boolean;
}

/**
 * The same model day by day, for the days from `from` to `to`. It starts at
 * `warmupFrom` like the weekly summary does, so the form at the end of a
 * week matches its summary.
 */
export function buildDailyLoads({
  warmupFrom,
  from,
  to,
  entries,
  sessions,
  today,
}: {
  warmupFrom: Date;
  from: Date;
  to: Date;
  entries: LoadEntry[];
  sessions: PlannedSessionLoad[];
  today: Date;
}): DayLoad[] {
  const todayStart = startOfUtcDay(today);
  const dailyLoad = new Map<string, number>();
  const add = (date: Date, load: number) => {
    const key = toUtcDateKey(date);
    dailyLoad.set(key, (dailyLoad.get(key) ?? 0) + load);
  };
  for (const entry of entries) add(entry.date, entry.value);
  for (const session of sessions) {
    if (
      session.load !== null &&
      !session.done &&
      session.startDate >= todayStart
    ) {
      add(session.startDate, session.load);
    }
  }

  const first = startOfUtcDay(from);
  const last = startOfUtcDay(to);
  const days: DayLoad[] = [];
  let fitness: FitnessState = { ctl: 0, atl: 0 };
  for (
    let date = startOfUtcDay(warmupFrom);
    date <= last;
    date = addUtcDays(date, 1)
  ) {
    const load = dailyLoad.get(toUtcDateKey(date)) ?? 0;
    fitness = advanceFitness(fitness, load);
    if (date >= first) {
      days.push({ date, load, fitness, projected: date >= todayStart });
    }
  }
  return days;
}
