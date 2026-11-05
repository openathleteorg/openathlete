import { SportType } from '@openathlete/database';

import { Language } from 'src/common/constants/languages.constant';

import {
  ActivityDescriptionFacts,
  PersonalBest,
} from './activity-description.facts';
import {
  DescriptionTranslation,
  HeadlineMood,
  descriptionTranslations,
} from './activity-description.translations';

const RUNNING_SPORTS: SportType[] = [
  SportType.RUNNING,
  SportType.TRAIL_RUNNING,
];

const STATUE_OF_LIBERTY_M = 93;
const EIFFEL_TOWER_M = 330;
const EVEREST_M = 8849;
const MARATHON_M = 42195;
const OLYMPIC_POOL_M = 50;
const PIZZA_SLICE_KCAL = 285;
/** A cost shorter than this is noise in the model, not something to tell */
const MIN_COST_SEC = 5;
/** Below this, a text has nothing the activity page doesn't already say */
const MIN_CONTENT_LINES = 2;

/**
 * Found in every description written, whatever its language: the block is
 * never written twice on one activity.
 */
export const DESCRIPTION_SIGNATURE = /OpenAthlete · openathlete\.org/;

export function translationFor(language: string | null | undefined) {
  return (
    descriptionTranslations[language as Language] ??
    descriptionTranslations[Language.EN]
  );
}

function formatNumber(t: DescriptionTranslation, value: number, digits = 0) {
  return new Intl.NumberFormat(t.locale, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value);
}

const pad = (n: number) => String(n).padStart(2, '0');

/** 42 s, 1 min 05 s, 1 h 02 min */
export function formatCost(seconds: number): string {
  const s = Math.round(seconds);
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.floor(s / 60)} min ${pad(s % 60)} s`;
  return `${Math.floor(s / 3600)} h ${pad(Math.round((s % 3600) / 60))} min`;
}

/** 22:41 or 1:42:10 */
export function formatClock(seconds: number): string {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

export function formatPace(secondsPerKm: number): string {
  return `${formatClock(secondsPerKm)} /km`;
}

/** Shares summing to `total`, by largest remainder */
export function apportion(values: number[], total: number): number[] {
  const sum = values.reduce((a, b) => a + b, 0);
  if (sum <= 0) return values.map(() => 0);
  const exact = values.map((v) => (v / sum) * total);
  const floors = exact.map(Math.floor);
  let left = total - floors.reduce((a, b) => a + b, 0);
  const byRemainder = exact
    .map((v, i) => ({ i, r: v - Math.floor(v) }))
    .sort((a, b) => b.r - a.r);
  for (const { i } of byRemainder) {
    if (left <= 0) break;
    floors[i]++;
    left--;
  }
  return floors;
}

function pick<T>(options: T[], seed: number): T {
  return options[Math.abs(Math.trunc(seed)) % options.length];
}

function headlineMood(facts: ActivityDescriptionFacts): HeadlineMood {
  const { weather } = facts;
  if (facts.personalBests.length > 0) return 'pb';
  if (weather?.sky === 'snow') return 'snow';
  if (weather?.sky === 'rain') return 'rain';
  if (weather && weather.temperatureC >= 25) return 'hot';
  if (weather && weather.temperatureC <= 2) return 'cold';
  if (facts.movingTimeSec >= 2 * 3600) return 'long';
  if (facts.movingTimeSec > 0 && facts.movingTimeSec < 30 * 60) return 'short';
  return 'default';
}

function weatherLine(
  t: DescriptionTranslation,
  facts: ActivityDescriptionFacts,
): string | null {
  const w = facts.weather;
  if (!w) return null;
  const temp = `${formatNumber(t, w.temperatureC)} °C`;
  const parts = [
    w.feelsLikeC !== null &&
    Math.round(w.feelsLikeC) !== Math.round(w.temperatureC)
      ? `🌡️ ${temp} ${t.feelsLike(`${formatNumber(t, w.feelsLikeC)} °C`)}`
      : `🌡️ ${temp}`,
    t.sky[w.sky === 'clear' && !w.isDay ? 'clear-night' : w.sky],
  ];
  if (w.windKmh !== null && w.windKmh >= 1) {
    const gusts =
      w.gustKmh !== null && w.gustKmh >= w.windKmh + 10
        ? ` ${t.gusts(formatNumber(t, w.gustKmh))}`
        : '';
    parts.push(`${t.wind(formatNumber(t, w.windKmh))}${gusts}`);
  }
  if (w.humidityPct !== null) {
    parts.push(t.humidity(formatNumber(t, w.humidityPct)));
  }
  return parts.join(' · ');
}

function totalCost(facts: ActivityDescriptionFacts): number {
  const c = facts.conditionCosts;
  if (!c) return 0;
  return [c.slopeSec, c.temperatureSec, c.altitudeSec]
    .filter((s) => s >= MIN_COST_SEC)
    .reduce((a, b) => a + b, 0);
}

function costLines(
  t: DescriptionTranslation,
  facts: ActivityDescriptionFacts,
): string[] {
  const c = facts.conditionCosts;
  if (!c || !RUNNING_SPORTS.includes(facts.sport)) return [];
  const temperatureLabel =
    facts.weather && facts.weather.temperatureC >= 18
      ? t.heat
      : facts.weather && facts.weather.temperatureC <= 6
        ? t.cold
        : t.temperature;
  const costs = (
    [
      [temperatureLabel, c.temperatureSec],
      [t.slope, c.slopeSec],
      [t.altitude, c.altitudeSec],
    ] as const
  )
    .filter(([, seconds]) => seconds >= MIN_COST_SEC)
    .sort((a, b) => b[1] - a[1])
    .map(([label, seconds]) => `${label} ${formatCost(seconds)}`);
  if (costs.length === 0) return [];

  const lines = [`${t.costsIntro} ${costs.join(' · ')}`];
  const km = facts.distanceM / 1000;
  if (km >= 1 && facts.movingTimeSec > 0) {
    const actual = facts.movingTimeSec / km;
    // Normalized as the time the activity would have taken without them, so
    // it agrees with the costs above
    const normalized = (facts.movingTimeSec - totalCost(facts)) / km;
    if (actual - normalized >= 1) {
      lines.push(t.normalizedPace(formatPace(normalized), formatPace(actual)));
    }
  }
  return lines;
}

function intensityLine(
  t: DescriptionTranslation,
  facts: ActivityDescriptionFacts,
): string | null {
  const seconds = facts.intensitySeconds;
  if (!seconds || seconds.reduce((a, b) => a + b, 0) < 60) return null;
  const blocks = apportion(seconds, 10);
  const bar = ['🟩', '🟨', '🟥']
    .map((square, i) => square.repeat(blocks[i]))
    .join('');
  const percents = apportion(seconds, 100);
  const percentSign = t.locale === 'en-GB' ? '%' : ' %';
  const labels = [t.easy, t.moderate, t.hard]
    .map((label, i) =>
      percents[i] > 0 ? `${percents[i]}${percentSign} ${label}` : null,
    )
    .filter(Boolean);
  return `${t.intensity} ${bar} — ${labels.join(' · ')}`;
}

function decouplingLine(
  t: DescriptionTranslation,
  facts: ActivityDescriptionFacts,
): string | null {
  const pct = facts.decouplingPercent;
  // Drift says something about a steady, long enough effort only
  if (pct === null || !Number.isFinite(pct) || facts.movingTimeSec < 45 * 60) {
    return null;
  }
  const verdict =
    pct < 5
      ? t.decouplingSolid
      : pct < 10
        ? t.decouplingFatigue
        : t.decouplingDeep;
  return `${t.decoupling(formatNumber(t, Math.max(0, pct), 1))} — ${verdict}`;
}

function distanceLabel(t: DescriptionTranslation, distanceM: number) {
  if (Math.abs(distanceM - 21097.5) < 1) return t.halfMarathon;
  if (Math.abs(distanceM - MARATHON_M) < 1) return t.marathon;
  return `${formatNumber(t, distanceM / 1000, 1)} km`;
}

function durationLabel(seconds: number) {
  return seconds >= 3600 ? `${seconds / 3600} h` : `${seconds / 60} min`;
}

function personalBestLine(t: DescriptionTranslation, best: PersonalBest) {
  return best.kind === 'distance'
    ? t.personalBest(
        distanceLabel(t, best.distanceM),
        formatClock(best.timeSec),
      )
    : t.powerBest(durationLabel(best.durationSec), formatNumber(t, best.watts));
}

/** Comparisons sized to the effort: a monument for a hill, Everest for a mountain */
function funLines(
  t: DescriptionTranslation,
  facts: ActivityDescriptionFacts,
): string[] {
  const lines: string[] = [];
  const gain = facts.elevationGainM;
  if (gain >= EVEREST_M) {
    lines.push(t.everestTimes(formatNumber(t, gain / EVEREST_M, 1)));
  } else if (gain >= 1000) {
    lines.push(
      t.everestPercent(formatNumber(t, Math.round((gain / EVEREST_M) * 100))),
    );
  } else if (gain >= EIFFEL_TOWER_M) {
    lines.push(t.eiffel(formatNumber(t, gain / EIFFEL_TOWER_M, 1)));
  } else if (gain >= 150) {
    lines.push(t.liberty(formatNumber(t, gain / STATUE_OF_LIBERTY_M, 1)));
  }

  const d = facts.distanceM;
  if (RUNNING_SPORTS.includes(facts.sport) && d >= 3000) {
    if (d < 41500) {
      lines.push(
        t.marathonPercent(formatNumber(t, Math.round((d / MARATHON_M) * 100))),
      );
    } else if (d < 50000) {
      lines.push(t.marathonFull);
    } else {
      lines.push(t.marathonTimes(formatNumber(t, d / MARATHON_M, 1)));
    }
  } else if (facts.sport === SportType.SWIMMING && d >= 200) {
    lines.push(t.pool(formatNumber(t, Math.round(d / OLYMPIC_POOL_M))));
  }

  // Mechanical work in kJ is close to the food energy burned in kcal: the
  // body is about 25% efficient and 1 kcal is 4.18 kJ
  if (facts.kilojoules && facts.kilojoules >= PIZZA_SLICE_KCAL) {
    lines.push(
      t.pizza(formatNumber(t, Math.round(facts.kilojoules / PIZZA_SLICE_KCAL))),
    );
  }
  return lines;
}

/**
 * The block written into the activity's description, or null when the
 * activity gives too little to say.
 */
export function renderActivityDescription(
  facts: ActivityDescriptionFacts,
  language: string | null | undefined,
): string | null {
  const t = translationFor(language);
  const content = [
    weatherLine(t, facts),
    ...costLines(t, facts),
    intensityLine(t, facts),
    decouplingLine(t, facts),
    ...facts.personalBests.slice(0, 2).map((b) => personalBestLine(t, b)),
    facts.trimp && facts.trimp >= 1
      ? t.load(formatNumber(t, Math.round(facts.trimp)))
      : null,
  ].filter((line): line is string => Boolean(line));
  const fun = funLines(t, facts);
  if (content.length + fun.length < MIN_CONTENT_LINES) return null;

  const headline = pick(t.headlines[headlineMood(facts)], facts.seed);
  return [headline, '', ...content, ...fun, '', t.footer].join('\n');
}

/**
 * The athlete's own description with the block after it, or null when the
 * block is there already (a retry, or a second copy of the activity).
 */
export function mergeDescription(
  existing: string | null | undefined,
  block: string,
): string | null {
  const own = (existing ?? '').trimEnd();
  if (DESCRIPTION_SIGNATURE.test(own)) return null;
  return own ? `${own}\n\n${block}` : block;
}
