import {
  AcquisitionSource,
  CoachTeamSize,
  CompleteOnboardingDto,
  SPORT_TYPE,
  TargetRaceDistance,
  TrainingGoal,
  WeeklyTrainingHours,
} from '@openathlete/shared';

export type OnboardingRole = 'ATHLETE' | 'COACH' | 'BOTH';

export type OnboardingStep =
  | 'role'
  | 'team'
  | 'invite-athletes'
  | 'sports'
  | 'goal'
  | 'connect'
  | 'hours'
  | 'invite-coach'
  | 'source'
  | 'done';

export interface OnboardingAnswers {
  role: OnboardingRole | null;
  teamSize: CoachTeamSize | null;
  athleteEmails: string[];
  sports: SPORT_TYPE[];
  goal: TrainingGoal | null;
  raceDistance: TargetRaceDistance | null;
  /** YYYY-MM-DD, empty until chosen */
  raceDate: string;
  hours: WeeklyTrainingHours | null;
  coachEmail: string;
  source: AcquisitionSource | null;
}

export interface OnboardingProgress {
  answers: OnboardingAnswers;
  step: OnboardingStep;
  /** Steps to go back through, the latest last */
  history: OnboardingStep[];
  /** When the first screen showed, for onboarding_started once */
  startedAt: number | null;
}

export const EMPTY_ANSWERS: OnboardingAnswers = {
  role: null,
  teamSize: null,
  athleteEmails: [],
  sports: [],
  goal: null,
  raceDistance: null,
  raceDate: '',
  hours: null,
  coachEmail: '',
  source: null,
};

export const INITIAL_PROGRESS: OnboardingProgress = {
  answers: EMPTY_ANSWERS,
  step: 'role',
  history: [],
  startedAt: null,
};

export interface FlowContext {
  /** Already linked to a coach, or about to be through a join link */
  hasCoach: boolean;
}

const coaches = (role: OnboardingRole | null) =>
  role === 'COACH' || role === 'BOTH';
const trains = (role: OnboardingRole | null) =>
  role === 'ATHLETE' || role === 'BOTH';

/** The screens this user goes through, given their answers so far. */
export function onboardingPath(
  answers: OnboardingAnswers,
  context: FlowContext,
): OnboardingStep[] {
  const path: OnboardingStep[] = ['role'];
  if (coaches(answers.role)) path.push('team', 'invite-athletes');
  if (trains(answers.role)) {
    path.push('sports', 'goal', 'connect', 'hours');
    if (answers.goal === 'FOLLOW_COACH' && !context.hasCoach) {
      path.push('invite-coach');
    }
  }
  path.push('source', 'done');
  return path;
}

/** The step after `step`, or `step` itself at the end. */
export function nextStep(
  step: OnboardingStep,
  answers: OnboardingAnswers,
  context: FlowContext,
): OnboardingStep {
  const path = onboardingPath(answers, context);
  const index = path.indexOf(step);
  if (index === -1) return path[0];
  return path[Math.min(index + 1, path.length - 1)];
}

export const isEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/** What the API stores, leaving out what does not apply to the roles. */
export function toCompleteOnboardingDto(
  answers: OnboardingAnswers,
  { raceName }: { raceName?: string } = {},
): CompleteOnboardingDto {
  const roles: CompleteOnboardingDto['roles'] =
    answers.role === 'BOTH'
      ? ['ATHLETE', 'COACH']
      : answers.role === 'COACH'
        ? ['COACH']
        : ['ATHLETE'];
  const athlete = trains(answers.role);
  const coach = coaches(answers.role);
  const athleteEmails = answers.athleteEmails
    .map((email) => email.trim())
    .filter(isEmail);
  const coachEmail = answers.coachEmail.trim();

  return {
    roles,
    ...(answers.source && { acquisitionSource: answers.source }),
    ...(coach && answers.teamSize && { coachTeamSize: answers.teamSize }),
    ...(coach && athleteEmails.length > 0 && { athleteEmails }),
    ...(athlete && {
      ...(answers.sports.length > 0 && { practicedSports: answers.sports }),
      ...(answers.goal && { trainingGoal: answers.goal }),
      ...(answers.hours && { weeklyTrainingHours: answers.hours }),
      ...(answers.goal === 'RACE' &&
        answers.raceDistance &&
        answers.raceDate && {
          targetRace: {
            distance: answers.raceDistance,
            date: answers.raceDate,
            ...(raceName && { name: raceName }),
          },
        }),
      ...(answers.goal === 'FOLLOW_COACH' &&
        isEmail(coachEmail) && { coachEmail }),
    }),
  };
}

/**
 * Reads progress saved before an OAuth redirect or a reload. Anything that
 * does not look like it is dropped: a broken save starts afresh.
 */
export function parseProgress(raw: string | null): OnboardingProgress {
  if (!raw) return INITIAL_PROGRESS;
  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingProgress>;
    if (!parsed || typeof parsed !== 'object' || !parsed.answers) {
      return INITIAL_PROGRESS;
    }
    return {
      answers: { ...EMPTY_ANSWERS, ...parsed.answers },
      step: typeof parsed.step === 'string' ? parsed.step : 'role',
      history: Array.isArray(parsed.history) ? parsed.history : [],
      startedAt: typeof parsed.startedAt === 'number' ? parsed.startedAt : null,
    };
  } catch {
    return INITIAL_PROGRESS;
  }
}

const WEEKS = 12;

/** Monday 00:00 UTC, twelve weeks back, and now: stable for the session */
export function lastWeeksRange(now: Date = new Date()) {
  const day = (now.getUTCDay() + 6) % 7;
  const monday = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - day,
  );
  return {
    from: new Date(monday - (WEEKS - 1) * 7 * 24 * 3600 * 1000),
    to: now,
  };
}
