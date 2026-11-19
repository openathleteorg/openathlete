import {
  CalendarDayForm,
  SPORT_TYPE,
  YEAR_REVIEW_PERSONA_HOURS,
  YearReviewDto,
  YearReviewPersona,
  YearReviewRecordDto,
} from '@openathlete/shared';

/** An activity of the year, with its start read on the athlete's calendar */
export interface YearActivity {
  /** YYYY-MM-DD */
  day: string;
  /** Minutes after midnight */
  minute: number;
  /** 1 (Monday) to 7 (Sunday) */
  weekday: number;
  sport: SPORT_TYPE;
  name: string;
  startDate: Date;
  /** Seconds from start to finish */
  duration: number;
  movingTime: number;
  distance: number;
  elevationGain: number;
  averageHeartrate: number | null;
  isRace: boolean;
  fromGarmin: boolean;
}

/** A race of the calendar, with the activity linked to it */
export interface YearRace {
  name: string;
  priority: 'A' | 'B' | 'C' | null;
  goalDuration: number | null;
  activity: YearActivity;
}

/** The best of a record kind this year, and before it */
export type YearRecord = YearReviewRecordDto;

/** Shares of starts that make a time of day someone's own */
const EARLY_BIRD_SHARE = 0.4;
const LUNCH_BREAK_SHARE = 0.35;
const NIGHT_OWL_SHARE = 0.4;
const WEEKEND_SHARE = 0.55;
/** Sports that each fill this share of the time make an all-rounder */
const ALL_ROUNDER_SPORTS = 3;
const ALL_ROUNDER_SPORT_SHARE = 0.1;
/** Active on this share of the days of the year */
const METRONOME_DAY_SHARE = 0.5;
/** Average time in motion of an endurance athlete's outings */
const ENDURANCE_AVERAGE_SECONDS = 90 * 60;

/** Plans followed loosely say little: under this, no completion rate */
const PLAN_MIN_SESSIONS = 10;

/** The records shown first, in this order: the ones athletes talk about */
const RECORD_SHOWCASE: {
  family: YearRecord['family'];
  distance?: number;
  duration?: number;
}[] = [
  { family: 'RUN', distance: 42195 },
  { family: 'RIDE', duration: 1200 },
  { family: 'RUN', distance: 21097.5 },
  { family: 'SWIM', distance: 1500 },
  { family: 'RUN', distance: 10000 },
  { family: 'RIDE', duration: 300 },
  { family: 'RUN', distance: 5000 },
  { family: 'SWIM', distance: 400 },
  { family: 'RIDE', duration: 3600 },
  { family: 'RUN', distance: 1000 },
  { family: 'RIDE', duration: 60 },
];
const RECORD_HIGHLIGHTS = 4;

const DAY_MS = 24 * 3600 * 1000;

const isLeap = (year: number) =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const dayOfYear = (day: string) =>
  Math.round(
    (Date.parse(`${day}T00:00:00Z`) - Date.parse(`${day.slice(0, 4)}-01-01`)) /
      DAY_MS,
  );

const dateOfYear = (year: number, index: number) =>
  new Date(Date.UTC(year, 0, 1) + index * DAY_MS).toISOString().slice(0, 10);

/**
 * One level per day of the year: 0 at rest, then 1 to 3 by thirds of the
 * athlete's own active days, so a quiet year still shows its big days.
 */
export function dayLevels(activities: YearActivity[], year: number): number[] {
  const time = new Array<number>(isLeap(year) ? 366 : 365).fill(0);
  for (const activity of activities) {
    time[dayOfYear(activity.day)] += activity.movingTime;
  }
  const active = time.filter((seconds) => seconds > 0).sort((a, b) => a - b);
  const third = (share: number) =>
    active[Math.floor((active.length - 1) * share)] ?? 0;
  const [low, high] = [third(1 / 3), third(2 / 3)];
  return time.map((seconds) =>
    seconds === 0 ? 0 : seconds <= low ? 1 : seconds <= high ? 2 : 3,
  );
}

/** The longest run of active days, the first one when several tie */
export function longestStreak(
  levels: number[],
  year: number,
): YearReviewDto['longestStreak'] {
  let best: { start: number; days: number } | null = null;
  let start = 0;
  levels.forEach((level, index) => {
    if (level === 0) {
      start = index + 1;
      return;
    }
    const days = index - start + 1;
    if (!best || days > best.days) best = { start, days };
  });
  if (!best) return null;
  const { start: first, days } = best;
  return {
    days,
    start: dateOfYear(year, first),
    end: dateOfYear(year, first + days - 1),
  };
}

export function sportTotals(
  activities: YearActivity[],
): YearReviewDto['sports'] {
  const bySport = new Map<SPORT_TYPE, YearReviewDto['sports'][number]>();
  for (const { sport, movingTime, distance } of activities) {
    const totals = bySport.get(sport) ?? {
      sport,
      movingTime: 0,
      distance: 0,
      count: 0,
    };
    totals.movingTime += movingTime;
    totals.distance += distance;
    totals.count += 1;
    bySport.set(sport, totals);
  }
  return [...bySport.values()].sort((a, b) => b.movingTime - a.movingTime);
}

export function monthTotals(
  activities: YearActivity[],
): YearReviewDto['months'] {
  const months = Array.from({ length: 12 }, () => ({
    distance: 0,
    movingTime: 0,
  }));
  for (const { day, distance, movingTime } of activities) {
    const month = months[Number(day.slice(5, 7)) - 1];
    month.distance += distance;
    month.movingTime += movingTime;
  }
  return months;
}

export function hourCounts(activities: YearActivity[]): number[] {
  const hours = new Array<number>(24).fill(0);
  for (const { minute } of activities) hours[Math.floor(minute / 60)] += 1;
  return hours;
}

/** The usual start: the average minute within the busiest hour */
export function favoriteMinute(activities: YearActivity[]): number | null {
  const hours = hourCounts(activities);
  const busiest = hours.indexOf(Math.max(...hours));
  const starts = activities
    .map(({ minute }) => minute)
    .filter((minute) => Math.floor(minute / 60) === busiest);
  if (!starts.length) return null;
  return Math.round(starts.reduce((a, b) => a + b, 0) / starts.length);
}

/** The first persona the year fits, with the figure that proves it */
export function persona(
  activities: YearActivity[],
  sports: YearReviewDto['sports'],
  activeDays: number,
  daysInYear: number,
): YearReviewDto['persona'] {
  const count = activities.length;
  const shareOf = (keep: (activity: YearActivity) => boolean) =>
    count ? activities.filter(keep).length / count : 0;
  const within = ([from, to]: readonly number[]) =>
    shareOf(({ minute }) => minute >= from * 60 && minute < to * 60);
  const totalTime = sports.reduce((sum, sport) => sum + sport.movingTime, 0);

  const early = within(YEAR_REVIEW_PERSONA_HOURS.EARLY_BIRD);
  const lunch = within(YEAR_REVIEW_PERSONA_HOURS.LUNCH_BREAK);
  const night = within(YEAR_REVIEW_PERSONA_HOURS.NIGHT_OWL);
  const weekend = shareOf(({ weekday }) => weekday >= 6);
  const candidates: [YearReviewPersona, number, boolean][] = [
    ['EARLY_BIRD', early, early >= EARLY_BIRD_SHARE],
    ['LUNCH_BREAK', lunch, lunch >= LUNCH_BREAK_SHARE],
    ['NIGHT_OWL', night, night >= NIGHT_OWL_SHARE],
    ['WEEKEND_WARRIOR', weekend, weekend >= WEEKEND_SHARE],
  ];
  const regular = sports.filter(
    (sport) =>
      totalTime > 0 && sport.movingTime / totalTime >= ALL_ROUNDER_SPORT_SHARE,
  ).length;
  candidates.push(['ALL_ROUNDER', regular, regular >= ALL_ROUNDER_SPORTS]);
  candidates.push([
    'METRONOME',
    activeDays,
    activeDays >= daysInYear * METRONOME_DAY_SHARE,
  ]);
  const average = count ? totalTime / count : 0;
  candidates.push(['ENDURANCE', average, average >= ENDURANCE_AVERAGE_SECONDS]);

  const match = candidates.find(([, , fits]) => fits);
  return match
    ? { kind: match[0], value: match[1] }
    : { kind: 'BALANCED', value: activeDays };
}

/** Chronic load once a week, and its peak: done days only */
export function fitnessCurve(
  form: CalendarDayForm[],
  year: number,
): YearReviewDto['fitness'] {
  const days = form.filter(
    (day) => !day.projected && day.date.startsWith(`${year}-`),
  );
  if (!days.some((day) => day.ctl > 0)) return null;
  const round = (ctl: number) => Math.round(ctl * 10) / 10;
  const points = days
    .filter((_, index) => index % 7 === 0 || index === days.length - 1)
    .map(({ date, ctl }) => ({ date, ctl: round(ctl) }));
  const peak = days.reduce((best, day) => (day.ctl > best.ctl ? day : best));
  return { points, peak: { date: peak.date, ctl: round(peak.ctl) } };
}

/**
 * The race of the year: a season goal first, then the longest. Without a
 * race on the calendar, an activity marked as one; without either, the
 * outing that lasted longest.
 */
export function highlight(
  races: YearRace[],
  activities: YearActivity[],
): YearReviewDto['highlight'] {
  const rank = (race: YearRace) =>
    race.priority === 'A' ? 0 : race.priority === 'B' ? 1 : 2;
  const [race] = [...races].sort(
    (a, b) => rank(a) - rank(b) || b.activity.distance - a.activity.distance,
  );
  const fromActivity = (
    activity: YearActivity,
    kind: 'RACE' | 'BIGGEST_OUTING',
    name = activity.name,
    goalDuration: number | null = null,
  ) => ({
    kind,
    name,
    date: activity.startDate,
    sport: activity.sport,
    distance: activity.distance,
    duration: activity.duration,
    elevationGain: activity.elevationGain,
    averageHeartrate: activity.averageHeartrate,
    goalDuration,
  });
  if (race) {
    return fromActivity(race.activity, 'RACE', race.name, race.goalDuration);
  }
  const [marked] = activities
    .filter((activity) => activity.isRace)
    .sort((a, b) => b.distance - a.distance);
  if (marked) return fromActivity(marked, 'RACE');
  const [biggest] = [...activities].sort((a, b) => b.movingTime - a.movingTime);
  return biggest ? fromActivity(biggest, 'BIGGEST_OUTING') : null;
}

const beaten = (record: YearRecord) =>
  record.previous !== null &&
  (record.type === 'SPEED'
    ? record.value < record.previous
    : record.value > record.previous);

/** Records beaten this year, the best known first, then firsts to fill */
export function recordHighlights(
  records: YearRecord[],
): YearReviewDto['records'] {
  const showcaseRank = (record: YearRecord) => {
    const rank = RECORD_SHOWCASE.findIndex(
      (kind) =>
        kind.family === record.family &&
        (kind.distance ?? null) === record.distance &&
        (kind.duration ?? null) === record.duration,
    );
    return rank === -1 ? RECORD_SHOWCASE.length : rank;
  };
  const shown = records.filter(
    (record) => showcaseRank(record) < RECORD_SHOWCASE.length,
  );
  const byRank = (a: YearRecord, b: YearRecord) =>
    showcaseRank(a) - showcaseRank(b);
  const improved = records.filter(beaten);
  return {
    improved: improved.length,
    highlights: [
      ...shown.filter(beaten).sort(byRank),
      ...shown.filter((record) => record.previous === null).sort(byRank),
    ].slice(0, RECORD_HIGHLIGHTS),
  };
}

export function planCompletion(
  planned: number,
  done: number,
): YearReviewDto['plan'] {
  return planned >= PLAN_MIN_SESSIONS ? { planned, done } : null;
}

export function buildYearReview({
  year,
  firstName,
  activities,
  races,
  records,
  form,
  plan,
}: {
  year: number;
  firstName: string | null;
  activities: YearActivity[];
  races: YearRace[];
  records: YearRecord[];
  form: CalendarDayForm[];
  plan: { planned: number; done: number };
}): YearReviewDto {
  const levels = dayLevels(activities, year);
  const sports = sportTotals(activities);
  const activeDays = levels.filter((level) => level > 0).length;
  const sum = (key: 'distance' | 'movingTime' | 'elevationGain') =>
    activities.reduce((total, activity) => total + activity[key], 0);
  return {
    year,
    firstName,
    totals: {
      distance: sum('distance'),
      movingTime: sum('movingTime'),
      elevationGain: sum('elevationGain'),
      activities: activities.length,
      activeDays,
    },
    sports,
    days: levels,
    longestStreak: longestStreak(levels, year),
    months: monthTotals(activities),
    hours: hourCounts(activities),
    favoriteMinute: favoriteMinute(activities),
    persona: persona(activities, sports, activeDays, levels.length),
    fitness: fitnessCurve(form, year),
    highlight: highlight(races, activities),
    records: recordHighlights(records),
    plan: planCompletion(plan.planned, plan.done),
    garminSourced: activities.some((activity) => activity.fromGarmin),
  };
}
