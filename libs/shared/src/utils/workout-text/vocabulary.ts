import { TRAINING_ZONE_TYPE, WORKOUT_STEP_TYPE } from '../../types/misc';
import { METRIC_TYPE } from '../../types/misc/core/metric-type.enum';
import { SPORT_TYPE } from '../../types/misc/core/sport-type.enum';

/**
 * Words the workout text understands, in every language of the app. The
 * parser reads all of them whatever the user's language; the serializer
 * writes those of the locale it is given.
 */

export type WorkoutTextLocale = 'en' | 'fr' | 'es' | 'it' | 'pt-BR' | 'de';

/** Lower case, accents removed: "Récup" and "recup" are the same word */
export function fold(word: string): string {
  return word.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

type TypedStep = Exclude<WORKOUT_STEP_TYPE, WORKOUT_STEP_TYPE.REPEAT>;

/** First words of a label that give a step its type */
const STEP_TYPE_WORDS: Record<TypedStep, string[]> = {
  [WORKOUT_STEP_TYPE.WARMUP]: [
    'warmup',
    'warm-up',
    'wu',
    'echauffement',
    'echauf',
    'echauff',
    'calentamiento',
    'riscaldamento',
    'aquecimento',
    'aufwarmen',
    'einlaufen',
    'einfahren',
  ],
  [WORKOUT_STEP_TYPE.COOLDOWN]: [
    'cooldown',
    'cool-down',
    'cd',
    'rac',
    'retour',
    'enfriamiento',
    'defaticamento',
    'desaquecimento',
    'volta',
    'auslaufen',
    'ausfahren',
    'abwarmen',
  ],
  [WORKOUT_STEP_TYPE.INTERVAL_REST]: [
    'rest',
    'recovery',
    'rec',
    'recup',
    'recuperation',
    'repos',
    'descanso',
    'recuperacion',
    'recupero',
    'riposo',
    'recuperacao',
    'pause',
    'erholung',
    'trabpause',
  ],
  [WORKOUT_STEP_TYPE.INTERVAL_ACTIVE]: [
    'active',
    'interval',
    'effort',
    'work',
    'travail',
    'esfuerzo',
    'sforzo',
    'esforco',
    'intervall',
    'belastung',
  ],
  [WORKOUT_STEP_TYPE.STEADY]: [
    'steady',
    'continu',
    'continuo',
    'constante',
    'gleichmaßig',
    'dauer',
  ],
  [WORKOUT_STEP_TYPE.FREE]: ['free', 'libre', 'libero', 'livre', 'frei'],
};

/** "Retour au calme" and "volta à calma" are cooldowns in two words or more */
const COOLDOWN_PHRASES = [
  'retour au calme',
  'volta a calma',
  'vuelta a la calma',
];

export function stepTypeFromLabel(label: string): TypedStep | null {
  const folded = fold(label.trim());
  if (COOLDOWN_PHRASES.some((phrase) => folded.startsWith(phrase))) {
    return WORKOUT_STEP_TYPE.COOLDOWN;
  }
  const first = folded.split(/\s+/)[0] ?? '';
  for (const [type, words] of Object.entries(STEP_TYPE_WORDS)) {
    if (words.includes(first)) return type as TypedStep;
  }
  return null;
}

/** A label that says nothing but the step type is not kept as a name */
export function isBareStepTypeLabel(label: string): boolean {
  const folded = fold(label.trim());
  if (COOLDOWN_PHRASES.includes(folded)) return true;
  return Object.values(STEP_TYPE_WORDS).some((words) => words.includes(folded));
}

const STEP_TYPE_LABELS: Record<WorkoutTextLocale, Record<TypedStep, string>> = {
  en: {
    [WORKOUT_STEP_TYPE.WARMUP]: 'Warmup',
    [WORKOUT_STEP_TYPE.COOLDOWN]: 'Cooldown',
    [WORKOUT_STEP_TYPE.INTERVAL_REST]: 'Rest',
    [WORKOUT_STEP_TYPE.INTERVAL_ACTIVE]: 'Interval',
    [WORKOUT_STEP_TYPE.STEADY]: 'Steady',
    [WORKOUT_STEP_TYPE.FREE]: 'Free',
  },
  fr: {
    [WORKOUT_STEP_TYPE.WARMUP]: 'Échauffement',
    [WORKOUT_STEP_TYPE.COOLDOWN]: 'Retour au calme',
    [WORKOUT_STEP_TYPE.INTERVAL_REST]: 'Récup',
    [WORKOUT_STEP_TYPE.INTERVAL_ACTIVE]: 'Effort',
    [WORKOUT_STEP_TYPE.STEADY]: 'Continu',
    [WORKOUT_STEP_TYPE.FREE]: 'Libre',
  },
  es: {
    [WORKOUT_STEP_TYPE.WARMUP]: 'Calentamiento',
    [WORKOUT_STEP_TYPE.COOLDOWN]: 'Enfriamiento',
    [WORKOUT_STEP_TYPE.INTERVAL_REST]: 'Descanso',
    [WORKOUT_STEP_TYPE.INTERVAL_ACTIVE]: 'Esfuerzo',
    [WORKOUT_STEP_TYPE.STEADY]: 'Continuo',
    [WORKOUT_STEP_TYPE.FREE]: 'Libre',
  },
  it: {
    [WORKOUT_STEP_TYPE.WARMUP]: 'Riscaldamento',
    [WORKOUT_STEP_TYPE.COOLDOWN]: 'Defaticamento',
    [WORKOUT_STEP_TYPE.INTERVAL_REST]: 'Recupero',
    [WORKOUT_STEP_TYPE.INTERVAL_ACTIVE]: 'Sforzo',
    [WORKOUT_STEP_TYPE.STEADY]: 'Continuo',
    [WORKOUT_STEP_TYPE.FREE]: 'Libero',
  },
  'pt-BR': {
    [WORKOUT_STEP_TYPE.WARMUP]: 'Aquecimento',
    [WORKOUT_STEP_TYPE.COOLDOWN]: 'Desaquecimento',
    [WORKOUT_STEP_TYPE.INTERVAL_REST]: 'Descanso',
    [WORKOUT_STEP_TYPE.INTERVAL_ACTIVE]: 'Esforço',
    [WORKOUT_STEP_TYPE.STEADY]: 'Constante',
    [WORKOUT_STEP_TYPE.FREE]: 'Livre',
  },
  de: {
    [WORKOUT_STEP_TYPE.WARMUP]: 'Aufwärmen',
    [WORKOUT_STEP_TYPE.COOLDOWN]: 'Auslaufen',
    [WORKOUT_STEP_TYPE.INTERVAL_REST]: 'Pause',
    [WORKOUT_STEP_TYPE.INTERVAL_ACTIVE]: 'Intervall',
    [WORKOUT_STEP_TYPE.STEADY]: 'Gleichmäßig',
    [WORKOUT_STEP_TYPE.FREE]: 'Frei',
  },
};

export function stepTypeLabel(
  type: TypedStep,
  locale: WorkoutTextLocale,
): string {
  return STEP_TYPE_LABELS[locale][type];
}

/** Words that end a step on the lap button, or leave it open */
export const LAP_WORDS = ['lap', 'tour', 'vuelta', 'giro', 'volta', 'runde'];
export const OPEN_WORDS = [
  'open',
  'ouvert',
  'abierto',
  'aperto',
  'aberto',
  'offen',
];

/** Suffixes naming the zone type: "Z2 HR", "Z3 Pace", "Z4 Power" */
export const ZONE_TYPE_WORDS: Record<string, TRAINING_ZONE_TYPE> = {
  hr: TRAINING_ZONE_TYPE.HEARTRATE,
  fc: TRAINING_ZONE_TYPE.HEARTRATE,
  bpm: TRAINING_ZONE_TYPE.HEARTRATE,
  hf: TRAINING_ZONE_TYPE.HEARTRATE,
  puls: TRAINING_ZONE_TYPE.HEARTRATE,
  pace: TRAINING_ZONE_TYPE.PACE,
  allure: TRAINING_ZONE_TYPE.PACE,
  ritmo: TRAINING_ZONE_TYPE.PACE,
  passo: TRAINING_ZONE_TYPE.PACE,
  power: TRAINING_ZONE_TYPE.POWER,
  puissance: TRAINING_ZONE_TYPE.POWER,
  potencia: TRAINING_ZONE_TYPE.POWER,
  potenza: TRAINING_ZONE_TYPE.POWER,
  leistung: TRAINING_ZONE_TYPE.POWER,
  w: TRAINING_ZONE_TYPE.POWER,
};

export const ZONE_TYPE_SUFFIX: Record<TRAINING_ZONE_TYPE, string> = {
  [TRAINING_ZONE_TYPE.HEARTRATE]: 'HR',
  [TRAINING_ZONE_TYPE.PACE]: 'Pace',
  [TRAINING_ZONE_TYPE.POWER]: 'Power',
};

/** What a percentage is of: "90% VMA", "75% HR", "95% FTP" */
export type PercentBase = 'HR' | 'FTP' | 'CP' | 'VMA';

export const PERCENT_BASE_WORDS: Record<string, PercentBase> = {
  hr: 'HR',
  fc: 'HR',
  fcmax: 'HR',
  hrmax: 'HR',
  hf: 'HR',
  hfmax: 'HR',
  ftp: 'FTP',
  power: 'FTP',
  cp: 'CP',
  vma: 'VMA',
  mas: 'VMA',
  vam: 'VMA',
};

const CYCLING_SPORTS = new Set<SPORT_TYPE>([
  SPORT_TYPE.CYCLING,
  SPORT_TYPE.VIRTUAL_RIDE,
  SPORT_TYPE.GRAVEL_RIDE,
  SPORT_TYPE.MOUNTAIN_BIKE_RIDE,
  SPORT_TYPE.E_BIKE_RIDE,
  SPORT_TYPE.E_MOUNTAIN_BIKE_RIDE,
  SPORT_TYPE.HANDCYCLE,
  SPORT_TYPE.VELOMOBILE,
]);

const RUNNING_SPORTS = new Set<SPORT_TYPE>([
  SPORT_TYPE.RUNNING,
  SPORT_TYPE.TRAIL_RUNNING,
  SPORT_TYPE.VIRTUAL_RUN,
]);

export function isCyclingSport(sport: SPORT_TYPE): boolean {
  return CYCLING_SPORTS.has(sport);
}

export function isRunningSport(sport: SPORT_TYPE): boolean {
  return RUNNING_SPORTS.has(sport);
}

export function isSwimmingSport(sport: SPORT_TYPE): boolean {
  return sport === SPORT_TYPE.SWIMMING;
}

/** The metric a bare "85%" is a percentage of, by sport */
export function defaultPercentBase(sport: SPORT_TYPE): PercentBase {
  if (isCyclingSport(sport)) return 'FTP';
  if (isRunningSport(sport)) return 'VMA';
  return 'HR';
}

export function percentBaseMetric(
  base: PercentBase,
  sport: SPORT_TYPE,
): METRIC_TYPE {
  switch (base) {
    case 'HR':
      return METRIC_TYPE.HR_MAX;
    case 'VMA':
      return METRIC_TYPE.VMA;
    case 'FTP':
      return isRunningSport(sport)
        ? METRIC_TYPE.FTP_RUNNING
        : METRIC_TYPE.FTP_CYCLING;
    case 'CP':
      return isRunningSport(sport)
        ? METRIC_TYPE.CRITICAL_POWER_RUNNING
        : METRIC_TYPE.CRITICAL_POWER_CYCLING;
  }
}

export function metricPercentBase(metric: string): PercentBase | null {
  switch (metric) {
    case METRIC_TYPE.HR_MAX:
      return 'HR';
    case METRIC_TYPE.VMA:
      return 'VMA';
    case METRIC_TYPE.FTP_CYCLING:
    case METRIC_TYPE.FTP_RUNNING:
      return 'FTP';
    case METRIC_TYPE.CRITICAL_POWER_CYCLING:
    case METRIC_TYPE.CRITICAL_POWER_RUNNING:
      return 'CP';
    default:
      return null;
  }
}
