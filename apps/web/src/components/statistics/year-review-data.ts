import { StatisticsDaysDto } from '@openathlete/shared';

type Day = StatisticsDaysDto['days'][number];

const DAY_MS = 24 * 3600 * 1000;

export interface YearReview {
  movingTime: number;
  distance: number;
  elevationGain: number;
  activities: number;
  activeDays: number;
  /** Consecutive days with an activity */
  longestStreak: number;
  biggestDay: Day | null;
  /** Monday of the week with the most time in motion */
  biggestWeek: { start: string; movingTime: number } | null;
}

const monday = (date: string) => {
  const time = Date.parse(`${date}T00:00:00Z`);
  const weekday = (new Date(time).getUTCDay() + 6) % 7;
  return new Date(time - weekday * DAY_MS).toISOString().slice(0, 10);
};

export function yearReview(days: Day[], year: number): YearReview {
  const inYear = days
    .filter(({ date }) => date.startsWith(`${year}-`))
    .sort((a, b) => a.date.localeCompare(b.date));

  let longestStreak = 0;
  let streak = 0;
  let previous: number | null = null;
  const weeks = new Map<string, number>();
  for (const { date, movingTime } of inYear) {
    const time = Date.parse(`${date}T00:00:00Z`);
    streak = previous !== null && time - previous === DAY_MS ? streak + 1 : 1;
    longestStreak = Math.max(longestStreak, streak);
    previous = time;
    const week = monday(date);
    weeks.set(week, (weeks.get(week) ?? 0) + movingTime);
  }
  const [start, weekTime] = [...weeks].sort((a, b) => b[1] - a[1])[0] ?? [];
  const sum = (key: 'movingTime' | 'distance' | 'elevationGain' | 'count') =>
    inYear.reduce((total, day) => total + day[key], 0);

  return {
    movingTime: sum('movingTime'),
    distance: sum('distance'),
    elevationGain: sum('elevationGain'),
    activities: sum('count'),
    activeDays: inYear.length,
    longestStreak,
    biggestDay:
      [...inYear].sort((a, b) => b.movingTime - a.movingTime)[0] ?? null,
    biggestWeek: start ? { start, movingTime: weekTime! } : null,
  };
}
