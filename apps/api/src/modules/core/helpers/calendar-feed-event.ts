import { Prisma } from '@openathlete/database';
import {
  WorkoutStepTargetDto,
  formatSpeed,
  getTargetIntensity,
} from '@openathlete/shared';

import { Language } from 'src/common/constants/languages.constant';
import { SPORT_LABELS } from 'src/common/constants/sport-labels.constant';
import { formatRpe } from 'src/common/utils/rpe';

const STEP_SELECT = {
  stepType: true,
  name: true,
  notes: true,
  durationType: true,
  durationValue: true,
  targets: {
    select: {
      targetType: true,
      targetMin: true,
      targetMax: true,
      targetValue: true,
      metricType: true,
    },
  },
} as const;

/** What a feed event shows, on top of its dates */
export const FEED_EVENT_SELECT = {
  eventId: true,
  name: true,
  type: true,
  startDate: true,
  endDate: true,
  training: {
    select: {
      sport: true,
      description: true,
      goalDistance: true,
      goalElevationGain: true,
      goalDuration: true,
      goalRpe: true,
      estimatedLoad: true,
      workout: {
        select: {
          steps: {
            select: {
              ...STEP_SELECT,
              repeatBlock: {
                select: {
                  repetitions: true,
                  childSteps: {
                    select: STEP_SELECT,
                    orderBy: { orderIndex: 'asc' },
                  },
                },
              },
            },
            orderBy: { orderIndex: 'asc' },
          },
        },
      },
    },
  },
  competition: {
    select: {
      sport: true,
      description: true,
      goalDistance: true,
      goalElevationGain: true,
      goalDuration: true,
      goalRpe: true,
      priority: true,
    },
  },
  note: { select: { description: true } },
} as const;

type FeedEvent = Prisma.EventGetPayload<{ select: typeof FEED_EVENT_SELECT }>;
type FeedStep = Prisma.WorkoutStepGetPayload<{
  select: typeof STEP_SELECT;
}>;
type FeedTarget = FeedStep['targets'][number];

export interface FeedContext {
  language: Language;
  /** The athlete's latest metric values by type */
  metrics: Record<string, number>;
  zoneNames: Map<number, string>;
  /** Where the event opens in the app, when the instance knows its URL */
  url: string | null;
}

const LOCALES: Record<Language, string> = {
  [Language.FR]: 'fr',
  [Language.EN]: 'en',
  [Language.IT]: 'it',
  [Language.ES]: 'es',
  [Language.PT_BR]: 'pt-BR',
};

interface Labels {
  session: string;
  race: string;
  note: string;
  sport: string;
  priority: string;
  duration: string;
  distance: string;
  elevationGain: string;
  targetRpe: string;
  estimatedLoad: string;
  workout: string;
  openInApp: string;
  lapButton: string;
  reps: string;
  steps: Record<FeedStep['stepType'], string>;
}

const LABELS: Record<Language, Labels> = {
  [Language.FR]: {
    session: 'Séance',
    race: 'Compétition',
    note: 'Note',
    sport: 'Sport',
    priority: 'Priorité',
    duration: 'Durée',
    distance: 'Distance',
    elevationGain: 'Dénivelé positif',
    targetRpe: 'RPE visé',
    estimatedLoad: 'Charge estimée',
    workout: 'Déroulé',
    openInApp: 'Ouvrir dans OpenAthlete',
    lapButton: 'bouton Lap',
    reps: 'répétitions',
    steps: {
      WARMUP: 'Échauffement',
      COOLDOWN: 'Retour au calme',
      INTERVAL_ACTIVE: 'Effort',
      INTERVAL_REST: 'Récupération',
      STEADY: 'Allure régulière',
      REPEAT: 'Répétition',
      FREE: 'Libre',
    },
  },
  [Language.EN]: {
    session: 'Session',
    race: 'Race',
    note: 'Note',
    sport: 'Sport',
    priority: 'Priority',
    duration: 'Duration',
    distance: 'Distance',
    elevationGain: 'Elevation gain',
    targetRpe: 'Target RPE',
    estimatedLoad: 'Estimated load',
    workout: 'Workout',
    openInApp: 'Open in OpenAthlete',
    lapButton: 'lap button',
    reps: 'reps',
    steps: {
      WARMUP: 'Warm-up',
      COOLDOWN: 'Cool-down',
      INTERVAL_ACTIVE: 'Interval',
      INTERVAL_REST: 'Recovery',
      STEADY: 'Steady',
      REPEAT: 'Repeat',
      FREE: 'Free',
    },
  },
  [Language.IT]: {
    session: 'Seduta',
    race: 'Gara',
    note: 'Nota',
    sport: 'Sport',
    priority: 'Priorità',
    duration: 'Durata',
    distance: 'Distanza',
    elevationGain: 'Dislivello positivo',
    targetRpe: 'RPE previsto',
    estimatedLoad: 'Carico stimato',
    workout: 'Allenamento',
    openInApp: 'Apri in OpenAthlete',
    lapButton: 'tasto Lap',
    reps: 'ripetizioni',
    steps: {
      WARMUP: 'Riscaldamento',
      COOLDOWN: 'Defaticamento',
      INTERVAL_ACTIVE: 'Sforzo',
      INTERVAL_REST: 'Recupero',
      STEADY: 'Ritmo costante',
      REPEAT: 'Ripetizione',
      FREE: 'Libero',
    },
  },
  [Language.ES]: {
    session: 'Sesión',
    race: 'Competición',
    note: 'Nota',
    sport: 'Deporte',
    priority: 'Prioridad',
    duration: 'Duración',
    distance: 'Distancia',
    elevationGain: 'Desnivel positivo',
    targetRpe: 'RPE previsto',
    estimatedLoad: 'Carga estimada',
    workout: 'Entrenamiento',
    openInApp: 'Abrir en OpenAthlete',
    lapButton: 'botón Lap',
    reps: 'repeticiones',
    steps: {
      WARMUP: 'Calentamiento',
      COOLDOWN: 'Vuelta a la calma',
      INTERVAL_ACTIVE: 'Esfuerzo',
      INTERVAL_REST: 'Recuperación',
      STEADY: 'Ritmo constante',
      REPEAT: 'Repetición',
      FREE: 'Libre',
    },
  },
  [Language.PT_BR]: {
    session: 'Sessão',
    race: 'Competição',
    note: 'Nota',
    sport: 'Esporte',
    priority: 'Prioridade',
    duration: 'Duração',
    distance: 'Distância',
    elevationGain: 'Ganho de elevação',
    targetRpe: 'RPE previsto',
    estimatedLoad: 'Carga estimada',
    workout: 'Treino',
    openInApp: 'Abrir no OpenAthlete',
    lapButton: 'botão Lap',
    reps: 'repetições',
    steps: {
      WARMUP: 'Aquecimento',
      COOLDOWN: 'Volta à calma',
      INTERVAL_ACTIVE: 'Esforço',
      INTERVAL_REST: 'Recuperação',
      STEADY: 'Ritmo constante',
      REPEAT: 'Repetição',
      FREE: 'Livre',
    },
  },
};

/** The event's text for calendar apps, in the athlete's language */
export function describeFeedEvent(
  event: FeedEvent,
  context: FeedContext,
): { description: string | null; categories: string[] } {
  const labels = LABELS[context.language];
  const { training, competition, note } = event;
  const planned = training ?? competition;
  const sport = planned && SPORT_LABELS[context.language][planned.sport];

  const facts: string[] = [];
  if (sport) facts.push(`${labels.sport}: ${sport}`);
  if (competition?.priority) {
    facts.push(`${labels.priority}: ${competition.priority}`);
  }
  if (planned?.goalDuration) {
    facts.push(`${labels.duration}: ${formatSeconds(planned.goalDuration)}`);
  }
  if (planned?.goalDistance) {
    facts.push(
      `${labels.distance}: ${formatMeters(planned.goalDistance, context.language)}`,
    );
  }
  if (planned?.goalElevationGain) {
    facts.push(
      `${labels.elevationGain}: ${Math.round(planned.goalElevationGain)} m`,
    );
  }
  if (planned?.goalRpe) {
    facts.push(`${labels.targetRpe}: ${formatRpe(planned.goalRpe)}`);
  }
  if (training?.estimatedLoad) {
    facts.push(
      `${labels.estimatedLoad}: ${Math.round(training.estimatedLoad)}`,
    );
  }

  const steps = training?.workout?.steps ?? [];
  const sections = [
    facts.join('\n'),
    planned?.description.trim() ?? note?.description.trim(),
    steps.length
      ? [
          `${labels.workout}:`,
          ...steps.flatMap((step) => stepLines(step, context)),
        ].join('\n')
      : null,
    context.url && `${labels.openInApp}: ${context.url}`,
  ].filter(Boolean);

  const kind = training
    ? labels.session
    : competition
      ? labels.race
      : labels.note;
  return {
    description: sections.join('\n\n') || null,
    categories: sport ? [kind, sport] : [kind],
  };
}

function stepLines(
  step: FeedStep & {
    repeatBlock: {
      repetitions: number;
      childSteps: FeedStep[];
    } | null;
  },
  context: FeedContext,
): string[] {
  if (step.repeatBlock) {
    const { repetitions, childSteps } = step.repeatBlock;
    return [
      `- ${repetitions} ×${step.name ? ` ${step.name}` : ''}`,
      ...childSteps.map((child) => `  ${stepLine(child, context)}`),
    ];
  }
  return [stepLine(step, context)];
}

function stepLine(step: FeedStep, context: FeedContext): string {
  const labels = LABELS[context.language];
  const parts = [
    step.name || labels.steps[step.stepType],
    stepDuration(step, context),
    ...step.targets.map((target) => formatFeedTarget(target, context)),
    step.notes?.trim(),
  ];
  return `- ${parts.filter(Boolean).join(' · ')}`;
}

function stepDuration(step: FeedStep, context: FeedContext): string | null {
  const labels = LABELS[context.language];
  const value = step.durationValue;
  switch (step.durationType) {
    case 'TIME':
      return value ? formatSeconds(value) : null;
    case 'DISTANCE':
      return value ? formatMeters(value, context.language) : null;
    case 'REPS':
      return value ? `${value} ${labels.reps}` : null;
    case 'CALORIES':
      return value ? `${value} kcal` : null;
    case 'HR_BELOW':
      return value ? `< ${value} bpm` : null;
    case 'HR_ABOVE':
      return value ? `> ${value} bpm` : null;
    case 'LAP_BUTTON':
      return labels.lapButton;
    default:
      return null;
  }
}

function formatFeedTarget(
  target: FeedTarget,
  context: FeedContext,
): string | null {
  const { targetType, targetValue, targetMin, targetMax, metricType } = target;
  if (targetType === 'OPEN') return null;
  if (targetType === 'ZONE') {
    return targetValue === null
      ? null
      : (context.zoneNames.get(targetValue) ?? null);
  }

  // Without the athlete's own metric, shared defaults would give the numbers
  // of an average athlete: better the percentage they can read as it is
  if (metricType && context.metrics[metricType] === undefined) {
    const percent = (value: number) => `${Math.round(value * 100)}%`;
    const range =
      targetMin !== null && targetMax !== null
        ? `${percent(targetMin)} - ${percent(targetMax)}`
        : targetValue !== null
          ? percent(targetValue)
          : null;
    return range && `${range} ${metricType.replaceAll('_', ' ')}`;
  }

  const { value, min, max } = getTargetIntensity(
    target as WorkoutStepTargetDto,
    context.metrics,
  );
  const show = (amount: number) =>
    targetType === 'PACE'
      ? formatSpeed(amount)
      : String(Math.round(amount * 10) / 10);
  const amount =
    min !== null && max !== null
      ? `${show(min)} - ${show(max)}`
      : value !== null
        ? show(value)
        : null;
  if (!amount) return null;
  return targetType === 'RPE'
    ? `RPE ${amount}`
    : `${amount} ${TARGET_UNITS[targetType]}`.trim();
}

const TARGET_UNITS: Record<string, string> = {
  PACE: 'min/km',
  HEARTRATE: 'bpm',
  POWER: 'W',
  CADENCE: 'rpm',
  WEIGHT: 'kg',
};

function formatSeconds(total: number): string {
  const seconds = Math.round(total);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  if (hours) {
    return minutes ? `${hours} h ${pad(minutes)}` : `${hours} h`;
  }
  if (minutes) {
    return rest ? `${minutes} min ${pad(rest)}` : `${minutes} min`;
  }
  return `${rest} s`;
}

const pad = (value: number) => String(value).padStart(2, '0');

function formatMeters(meters: number, language: Language): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = new Intl.NumberFormat(LOCALES[language], {
    maximumFractionDigits: 2,
  }).format(meters / 1000);
  return `${km} km`;
}
