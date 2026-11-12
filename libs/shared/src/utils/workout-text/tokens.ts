import type { CreateWorkoutStepTarget } from '../../types/dtos/core/workout.dto';
import {
  TRAINING_ZONE_TYPE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_TARGET_TYPE,
} from '../../types/misc';
import type { SPORT_TYPE } from '../../types/misc/core/sport-type.enum';
import {
  LAP_WORDS,
  OPEN_WORDS,
  PERCENT_BASE_WORDS,
  type PercentBase,
  ZONE_TYPE_WORDS,
  fold,
  isSwimmingSport,
} from './vocabulary';

/**
 * Reading single words of a step: "10'", "400m", "Z3", "4:30/km". Every
 * function takes a word already folded (lower case, no accent).
 */

export interface ParsedDuration {
  durationType: WORKOUT_DURATION_TYPE;
  durationValue: number | null;
}

const NUM = '(\\d+(?:[.,]\\d+)?)';

function num(text: string): number {
  return Number(text.replace(',', '.'));
}

/** Quotes and primes typed by phones and other keyboards, as ' and " */
export function normalizeQuotes(text: string): string {
  return text
    .replace(/[’‘′`´]/g, "'")
    .replace(/[″“”]/g, '"')
    .replace(/''/g, '"');
}

const time = (seconds: number): ParsedDuration => ({
  durationType: WORKOUT_DURATION_TYPE.TIME,
  durationValue: Math.round(seconds),
});
const distance = (meters: number): ParsedDuration => ({
  durationType: WORKOUT_DURATION_TYPE.DISTANCE,
  durationValue: Math.round(meters * 100) / 100,
});

/**
 * A plain "m" is minutes up to 49 ("10m", Intervals.icu's reading) and
 * metres from 50 ("400m", how runners write it); in the pool it is always
 * metres. "min" and "mtr" are never ambiguous.
 */
export const MINUTES_BELOW = 50;

export function parseDuration(
  word: string,
  sport: SPORT_TYPE,
): ParsedDuration | null {
  if (LAP_WORDS.includes(word) || word === 'presslap') {
    return {
      durationType: WORKOUT_DURATION_TYPE.LAP_BUTTON,
      durationValue: null,
    };
  }
  if (OPEN_WORDS.includes(word)) {
    return { durationType: WORKOUT_DURATION_TYPE.OPEN, durationValue: null };
  }
  let match: RegExpMatchArray | null;
  if ((match = word.match(/^(\d+)h(\d{1,2})(?:m|min|')(\d{1,2})(?:s|")?$/))) {
    return time(num(match[1]) * 3600 + num(match[2]) * 60 + num(match[3]));
  }
  if ((match = word.match(/^(\d+)h(?:(\d{1,2})(?:m|min|')?)?$/))) {
    return time(num(match[1]) * 3600 + num(match[2] ?? '0') * 60);
  }
  if (
    (match = word.match(
      new RegExp(`^${NUM}(?:min|mn|')(?:(\\d{1,2})(?:s|sec|")?)?$`),
    ))
  ) {
    return time(num(match[1]) * 60 + num(match[2] ?? '0'));
  }
  if ((match = word.match(/^(\d+)m(\d{1,2})s?$/))) {
    return time(num(match[1]) * 60 + num(match[2]));
  }
  if ((match = word.match(new RegExp(`^${NUM}(?:s|sec|secs|")$`)))) {
    return time(num(match[1]));
  }
  if ((match = word.match(/^(\d+):(\d{2})(?::(\d{2}))?$/))) {
    return match[3] !== undefined
      ? time(num(match[1]) * 3600 + num(match[2]) * 60 + num(match[3]))
      : time(num(match[1]) * 60 + num(match[2]));
  }
  if ((match = word.match(new RegExp(`^${NUM}(?:km|k)$`)))) {
    return distance(num(match[1]) * 1000);
  }
  if ((match = word.match(new RegExp(`^${NUM}mi$`)))) {
    return distance(num(match[1]) * 1609.344);
  }
  if (
    (match = word.match(
      new RegExp(`^${NUM}(?:mtr|meters?|metres?|metros?|metri)$`),
    ))
  ) {
    return distance(num(match[1]));
  }
  if ((match = word.match(new RegExp(`^${NUM}(?:yd|yds|y)$`)))) {
    return distance(num(match[1]) * 0.9144);
  }
  if ((match = word.match(new RegExp(`^${NUM}m$`)))) {
    const value = num(match[1]);
    if (isSwimmingSport(sport) || value >= MINUTES_BELOW)
      return distance(value);
    return time(value * 60);
  }
  if ((match = word.match(/^(\d+)$/))) {
    // "10x400": a bare number large enough is metres; "Série 2" stays a label
    const value = num(match[1]);
    return value >= MINUTES_BELOW ? distance(value) : null;
  }
  if ((match = word.match(/^(?:hr|fc)([<>])(\d+)$/))) {
    return {
      durationType:
        match[1] === '<'
          ? WORKOUT_DURATION_TYPE.HR_BELOW
          : WORKOUT_DURATION_TYPE.HR_ABOVE,
      durationValue: num(match[2]),
    };
  }
  if ((match = word.match(/^(\d+)k?cal$/))) {
    return {
      durationType: WORKOUT_DURATION_TYPE.CALORIES,
      durationValue: num(match[1]),
    };
  }
  if ((match = word.match(/^(\d+)(?:reps?|rep)$/))) {
    return {
      durationType: WORKOUT_DURATION_TYPE.REPS,
      durationValue: num(match[1]),
    };
  }
  return null;
}

/** "30/30", "45/15", "1'/1'": an effort and its recovery, in seconds unless said */
export function parseOnOff(
  word: string,
  sport: SPORT_TYPE,
): [ParsedDuration, ParsedDuration] | null {
  const match = word.match(/^([^/]+)\/([^/]+)$/);
  if (!match) return null;
  const side = (text: string) =>
    /^\d+(?:[.,]\d+)?$/.test(text)
      ? time(num(text))
      : parseDuration(text, sport);
  const on = side(match[1]);
  const off = side(match[2]);
  if (!on || !off) return null;
  if (
    on.durationType !== WORKOUT_DURATION_TYPE.TIME &&
    on.durationType !== WORKOUT_DURATION_TYPE.DISTANCE
  ) {
    return null;
  }
  return [on, off];
}

export type ParsedTarget =
  | { kind: 'target'; target: CreateWorkoutStepTarget }
  | { kind: 'zone'; zone: number; zoneType: TRAINING_ZONE_TYPE | null }
  | {
      kind: 'percent';
      min: number;
      max: number | null;
      base: PercentBase | null;
    }
  | { kind: 'zone_range' }
  | { kind: 'ramp' }
  | { kind: 'none' };

/** Metres a pace is given per */
const PACE_UNITS: Record<string, number> = {
  km: 1000,
  mi: 1609.344,
  '100m': 100,
  '100y': 91.44,
  '500m': 500,
  '400m': 400,
};

function paceSeconds(text: string): number {
  const [minutes, seconds] = text.split(/[:']/);
  return num(minutes) * 60 + num(seconds);
}

function range(
  type: WORKOUT_TARGET_TYPE,
  low: number,
  high: number | null,
): ParsedTarget {
  if (high === null || high === low) {
    return { kind: 'target', target: { targetType: type, targetValue: low } };
  }
  return {
    kind: 'target',
    target: {
      targetType: type,
      targetMin: Math.min(low, high),
      targetMax: Math.max(low, high),
    },
  };
}

/**
 * A target word; `next` is the word after it, read when it names what the
 * value is of ("Z2 HR", "85% FTP"). `consumed` says whether it was.
 */
export function parseTarget(
  word: string,
  next: string | undefined,
): { parsed: ParsedTarget; consumed: boolean } | null {
  const nextZoneType = next ? ZONE_TYPE_WORDS[next] : undefined;
  const nextBase = next ? PERCENT_BASE_WORDS[next] : undefined;
  let match: RegExpMatchArray | null;

  if (word === 'freeride') return { parsed: { kind: 'none' }, consumed: false };
  if (word === 'ramp' || word === 'rampe') {
    return { parsed: { kind: 'ramp' }, consumed: false };
  }
  if ((match = word.match(/^z(\d{1,2})(hr|fc|pace|power|w)?$/))) {
    const inline = match[2] ? ZONE_TYPE_WORDS[match[2]] : undefined;
    return {
      parsed: {
        kind: 'zone',
        zone: Number(match[1]),
        zoneType: inline ?? nextZoneType ?? null,
      },
      consumed: !inline && !!nextZoneType,
    };
  }
  if (word.match(/^z\d{1,2}-z?\d{1,2}$/)) {
    return {
      parsed: { kind: 'zone_range' },
      consumed: !!nextZoneType,
    };
  }
  if ((match = word.match(new RegExp(`^${NUM}%?(?:-${NUM})?%([a-z]+)?$`)))) {
    const inline = match[3] ? PERCENT_BASE_WORDS[match[3]] : undefined;
    if (match[3] && !inline) return null;
    return {
      parsed: {
        kind: 'percent',
        min: num(match[1]) / 100,
        max: match[2] !== undefined ? num(match[2]) / 100 : null,
        base: inline ?? nextBase ?? null,
      },
      consumed: !inline && !!nextBase,
    };
  }
  if ((match = word.match(/^(\d+)(?:-(\d+))?w$/))) {
    return {
      parsed: range(
        WORKOUT_TARGET_TYPE.POWER,
        num(match[1]),
        match[2] ? num(match[2]) : null,
      ),
      consumed: false,
    };
  }
  if ((match = word.match(/^(\d+)(?:-(\d+))?bpm$/))) {
    return {
      parsed: range(
        WORKOUT_TARGET_TYPE.HEARTRATE,
        num(match[1]),
        match[2] ? num(match[2]) : null,
      ),
      consumed: false,
    };
  }
  if (
    (match = word.match(
      /^(\d+[:']\d{2})(?:-(\d+[:']\d{2}))?\/(km|mi|100m|100y|500m|400m)$/,
    ))
  ) {
    const meters = PACE_UNITS[match[3]];
    const speed = (pace: string) =>
      Math.round((meters / paceSeconds(pace)) * 10000) / 10000;
    return {
      parsed: range(
        WORKOUT_TARGET_TYPE.PACE,
        speed(match[1]),
        match[2] ? speed(match[2]) : null,
      ),
      consumed: false,
    };
  }
  if (
    (match = word.match(new RegExp(`^${NUM}(?:-${NUM})?(?:km/h|kmh|kph)$`)))
  ) {
    const speed = (kmh: string) => Math.round((num(kmh) / 3.6) * 10000) / 10000;
    return {
      parsed: range(
        WORKOUT_TARGET_TYPE.PACE,
        speed(match[1]),
        match[2] ? speed(match[2]) : null,
      ),
      consumed: false,
    };
  }
  if ((match = word.match(/^(\d+)(?:-(\d+))?(?:rpm|spm|ppm)$/))) {
    return {
      parsed: range(
        WORKOUT_TARGET_TYPE.CADENCE,
        num(match[1]),
        match[2] ? num(match[2]) : null,
      ),
      consumed: false,
    };
  }
  if ((match = word.match(new RegExp(`^rpe${NUM}(?:-${NUM})?$`)))) {
    return {
      parsed: range(
        WORKOUT_TARGET_TYPE.RPE,
        num(match[1]),
        match[2] ? num(match[2]) : null,
      ),
      consumed: false,
    };
  }
  if (
    word === 'rpe' &&
    next &&
    /^\d+(?:[.,]\d+)?(?:-\d+(?:[.,]\d+)?)?$/.test(next)
  ) {
    const [low, high] = next.split('-');
    return {
      parsed: range(WORKOUT_TARGET_TYPE.RPE, num(low), high ? num(high) : null),
      consumed: true,
    };
  }
  if ((match = word.match(new RegExp(`^${NUM}(?:-${NUM})?kg$`)))) {
    return {
      parsed: range(
        WORKOUT_TARGET_TYPE.WEIGHT,
        num(match[1]),
        match[2] ? num(match[2]) : null,
      ),
      consumed: false,
    };
  }
  return null;
}

export interface Token {
  text: string;
  /** Folded, quotes normalized: what the parsing functions read */
  word: string;
  from: number;
  to: number;
}

/**
 * Splits on spaces, keeping columns; joins what people type with spaces
 * inside one value: "95 - 105%", "4:30 /km", "Z2 - Z3".
 */
export function tokenize(text: string, offset = 0): Token[] {
  const raw: Token[] = [];
  const re = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    raw.push({
      text: match[0],
      word: fold(normalizeQuotes(match[0])),
      from: offset + match.index,
      to: offset + match.index + match[0].length,
    });
  }
  const tokens: Token[] = [];
  for (let i = 0; i < raw.length; i += 1) {
    const token = raw[i];
    const prev = tokens[tokens.length - 1];
    const join = (a: Token, b: Token): Token => ({
      text: `${a.text}${b.text}`,
      word: `${a.word}${b.word}`,
      from: a.from,
      to: b.to,
    });
    // "95 - 105%": the dash and the next value join the previous value
    if (
      token.word === '-' &&
      prev &&
      /[\d%]$/.test(prev.word) &&
      raw[i + 1] &&
      /^z?\d/.test(raw[i + 1].word)
    ) {
      tokens[tokens.length - 1] = join(join(prev, token), raw[i + 1]);
      i += 1;
      continue;
    }
    if (prev && /\d$/.test(prev.word) && /^-z?\d/.test(token.word)) {
      tokens[tokens.length - 1] = join(prev, token);
      continue;
    }
    // "4:30 /km", "75 %", "32 km/h", "250 W"
    if (
      prev &&
      /\d$/.test(prev.word) &&
      /^(\/(km|mi|100m|100y|500m|400m)|%|km\/h|kmh|w|bpm|rpm|spm|kg)$/.test(
        token.word,
      )
    ) {
      tokens[tokens.length - 1] = join(prev, token);
      continue;
    }
    tokens.push(token);
  }
  return tokens;
}
