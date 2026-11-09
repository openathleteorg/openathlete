import { MetricType } from '@openathlete/database';

/**
 * COROS' tools answer in text written for an AI to read, with no published
 * format, and change it without notice. Parsers throw on what they cannot
 * read: silence would look like an athlete without activities.
 */
export class CorosFormatError extends Error {
  constructor(what: string) {
    super(`Unexpected COROS answer: ${what}`);
    this.name = 'CorosFormatError';
  }
}

export interface CorosSportRecord {
  /** 18 digits: too large for a number */
  labelId: string;
  sportType: number;
  /** YYYY-MM-DD, in the athlete's time zone */
  date: string;
  /** Seconds since the epoch, when COROS gives them */
  startTimestamp: number | null;
  endTimestamp: number | null;
  /** COROS' sport label, such as "Outdoor Run" */
  sportLabel: string;
  /** Holds the activity's name, not a place */
  location: string | null;
  durationSeconds: number;
  distanceMeters: number;
  averageHeartrate: number | null;
  calories: number | null;
}

export interface CorosMetricRecord {
  type: MetricType;
  date: Date;
  value: number;
}

const firstNumber = (pattern: RegExp, text: string): number | null => {
  const match = pattern.exec(text);
  return match ? Number(match[1]) : null;
};

/** "57:37" or "1:04:21", in seconds */
function parseClock(value: string): number {
  return value.split(':').reduce((total, part) => total * 60 + Number(part), 0);
}

/** "2h 05min", "7h" or "45 min", in seconds */
function parseHours(value: string): number | null {
  const match = /^\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*min)?/i.exec(value);
  if (!match || (!match[1] && !match[2])) return null;
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60;
}

const utcDay = (day: string) => new Date(`${day}T00:00:00.000Z`);

/** One record of `querySportRecords` */
function parseSportRecord(block: string): CorosSportRecord {
  const header = /^\s*\d+\.\s+(.+?)\s+\S\s+(\d{4}-\d{2}-\d{2})\s*$/m.exec(
    block,
  );
  const labelId = /LabelId:\s*(\d+)/.exec(block)?.[1];
  const sportType = firstNumber(/SportType:\s*(\d+)/, block);
  if (!header || !labelId || sportType === null) {
    throw new CorosFormatError('sport record without date or identifiers');
  }
  const duration = /Duration:\s*([\d:]+)/.exec(block)?.[1];
  return {
    labelId,
    sportType,
    sportLabel: header[1],
    date: header[2],
    startTimestamp: firstNumber(/startTimestamp=(\d+)/, block),
    endTimestamp: firstNumber(/endTimestamp=(\d+)/, block),
    location: /Location:[ \t]*(.+)/.exec(block)?.[1].trim() || null,
    durationSeconds: duration ? parseClock(duration) : 0,
    distanceMeters: Math.round(
      (firstNumber(/Distance:\s*([\d.]+)\s*km/, block) ?? 0) * 1000,
    ),
    averageHeartrate: firstNumber(/Avg HR:\s*(\d+)/, block),
    calories: firstNumber(/Calories:\s*(\d+)/, block),
  };
}

/**
 * COROS words "nothing in this range" several ways depending on the tool and
 * the day: "No sport records found…", "No data found", "(0 records)", "null".
 */
export function isCorosNoData(text: string): boolean {
  const trimmed = text.trim();
  return (
    /^No\b[^\n]*\bfound\b/i.test(trimmed) ||
    /not available yet/i.test(trimmed) ||
    /^null$/i.test(trimmed) ||
    /\(0 records?\)/i.test(trimmed)
  );
}

export function parseSportRecords(text: string): CorosSportRecord[] {
  const blocks = text
    .split(/\n(?=\s*\d+\.\s+\S)/)
    .filter((block) => /^\s*\d+\.\s+\S/.test(block));
  if (blocks.length > 0) return blocks.map(parseSportRecord);
  // No activity is normal, unlike a header announcing some that we can't read
  if (isCorosNoData(text)) return [];
  throw new CorosFormatError('no readable sport record');
}

/** The start of an answer, for a log: enough to fix a parser, not a dump */
export function corosExcerpt(text: string, length = 300): string {
  return text
    .slice(0, length)
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '<email>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Read from the raw text, never through JSON.parse: these ids may be 64-bit
 * integers. COROS writes it as prose or as JSON depending on the tool.
 */
export function parseIdInPlan(text: string): string | null {
  return /"?idInPlan"?\s*[:=]\s*"?(\d+)/i.exec(text)?.[1] ?? null;
}

/** The temporary address of a FIT file, in `queryActivityFitFileDownloadUrls` */
export function parseFitUrl(text: string): string | null {
  return /https:\/\/[^\s"'<>)\]]+/.exec(text)?.[0] ?? null;
}

/** Splits a text into the days it reports, on lines holding only a date */
function dayBlocks(text: string): { day: string; block: string }[] {
  const marks = [...text.matchAll(/^\s*(\d{4}-\d{2}-\d{2})\b.*$/gm)];
  return marks.map((mark, index) => ({
    day: mark[1],
    block: text.slice(
      mark.index,
      index + 1 < marks.length ? marks[index + 1].index : text.length,
    ),
  }));
}

/**
 * `querySleepOverview`. Nights belong to the day of waking. Stage ratios are
 * left out: COROS gives them over the whole day, naps included.
 */
export function parseSleepOverview(text: string): CorosMetricRecord[] {
  const metrics: CorosMetricRecord[] = [];
  for (const { day, block } of dayBlocks(text)) {
    const date = utcDay(day);
    // A score of 0 is a night COROS has not computed yet
    const score = firstNumber(/Sleep Score:\s*(\d+)/i, block);
    if (!score) continue;
    metrics.push({ type: MetricType.SLEEP_SCORE, date, value: score });

    const asleep = /Main Sleep \(asleep\):\s*(.+)/i.exec(block)?.[1];
    const asleepSeconds = asleep ? parseHours(asleep) : null;
    if (asleepSeconds) {
      metrics.push({
        type: MetricType.SLEEP_DURATION,
        date,
        value: asleepSeconds / 3600,
      });
    }
    const awake = firstNumber(/Awake Time:\s*(\d+)\s*min/i, block);
    if (awake !== null) {
      metrics.push({
        type: MetricType.SLEEP_AWAKE_DURATION,
        date,
        value: awake / 60,
      });
    }
    const naps = firstNumber(/Naps Total:\s*(\d+)\s*min/i, block);
    if (naps) {
      metrics.push({ type: MetricType.NAP_DURATION, date, value: naps / 60 });
    }
  }
  return metrics;
}

/** One value per day, such as `queryRestingHeartRate` in bpm */
export function parseDailyValues(
  text: string,
  type: MetricType,
  unit: 'bpm' | 'ms',
): CorosMetricRecord[] {
  const pattern = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${unit}\\b`);
  return dayBlocks(text).flatMap(({ day, block }) => {
    const value = firstNumber(pattern, block);
    return value ? [{ type, date: utcDay(day), value }] : [];
  });
}

/** `queryFitnessAssessmentOverview` gives today's estimate */
export function parseVo2Max(text: string, today: string): CorosMetricRecord[] {
  const value = firstNumber(/VO2max:\s*([\d.]+)/i, text);
  return value ? [{ type: MetricType.VO2MAX, date: utcDay(today), value }] : [];
}
