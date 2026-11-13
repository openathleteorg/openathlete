import { useGetMyAthleteQuery, useGetMyCoachesQuery } from '@/api/athlete';
import { ProviderAPI, useGetConnectedProvidersQuery } from '@/api/provider';
import { useStatisticsOverviewQuery } from '@/api/statistics';
import {
  useCompleteOnboardingMutation,
  useGetMeQuery,
  useRecordSignupAttributionMutation,
} from '@/api/user';
import logoDarkSrc from '@/assets/logos/logo_dark.svg';
import logoWhiteSrc from '@/assets/logos/logo_white.svg';
import { CoachJoinLinkCard } from '@/components/coach-join-link';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { AnalyticsEvent, isLeavingForOauth } from '@/utils/analytics-events';
import { readPendingCoachJoinToken } from '@/utils/coach-join';
import { connectorProviderLabelMap } from '@/utils/label-map/core/connector-provider.label-map';
import { takeReturnTo } from '@/utils/return-to';
import { cn } from '@/utils/shadcn';
import {
  forgetSignupAttribution,
  readSignupAttribution,
} from '@/utils/signup-attribution';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useTheme } from 'next-themes';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
  getProviderSyncCapabilities,
  isFullImportInProgress,
} from '@openathlete/shared';

import { ConnectStep } from './onboarding-connect-step';
import { DoneStep } from './onboarding-done-step';
import {
  type OnboardingAnswers,
  type OnboardingProgress,
  type OnboardingStep,
  isEmail,
  lastWeeksRange,
  nextStep,
  onboardingPath,
  parseProgress,
  toCompleteOnboardingDto,
} from './onboarding-flow';
import { RACE_DISTANCE_LABELS } from './onboarding-labels';
import {
  EmailListInput,
  GoalStep,
  HoursStep,
  InviteCoachStep,
  RoleStep,
  SourceStep,
  SportsStep,
  StepHeader,
  TeamStep,
} from './onboarding-steps';

const STORAGE_KEY = 'openathlete_onboarding_v2';
// Saves of the first onboarding, which this one replaces
const LEGACY_STORAGE_KEYS = [
  'openathlete_onboarding_data',
  'openathlete_onboarding_step',
];
const VARIANT = 'v2';
// The whole history costs provider quota shared by every user: the recent
// months are enough to start, the settings offer the rest
const ONBOARDING_IMPORT_MONTHS = 3;
const IMPORT_REQUESTED_KEY = 'openathlete_onboarding_import_requested';

/** Providers whose import the onboarding already asked for, on this device */
function importRequested(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(IMPORT_REQUESTED_KEY) ?? '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function rememberImportRequested(provider: string) {
  try {
    localStorage.setItem(
      IMPORT_REQUESTED_KEY,
      JSON.stringify([...new Set([...importRequested(), provider])]),
    );
  } catch {
    // ignore
  }
}

function loadProgress(): OnboardingProgress {
  try {
    return parseProgress(localStorage.getItem(STORAGE_KEY));
  } catch {
    return parseProgress(null);
  }
}

function saveProgress(progress: OnboardingProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Private mode: the onboarding still works, it restarts on reload
  }
}

function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore
  }
}

/** Today on the device's calendar, as YYYY-MM-DD */
function localToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function OnboardingView() {
  const navigate = useNavigate();
  const posthog = usePostHog();
  const reduceMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const { initialize, authenticated } = useAuthContext();
  const { data: user, isLoading: isLoadingUser } = useGetMeQuery({
    enabled: authenticated,
  });
  const { data: coaches } = useGetMyCoachesQuery();
  const [progress, setProgress] = useState(loadProgress);
  const { answers, step, history } = progress;

  const isAthlete = answers.role === 'ATHLETE' || answers.role === 'BOTH';
  const isCoach = answers.role === 'COACH' || answers.role === 'BOTH';
  const { data: athlete } = useGetMyAthleteQuery();
  const { data: connected = [], isLoading: isLoadingConnected } =
    useGetConnectedProvidersQuery();

  const context = useMemo(
    () => ({
      hasCoach: (coaches?.length ?? 0) > 0 || !!readPendingCoachJoinToken(),
    }),
    [coaches],
  );
  const path = onboardingPath(answers, context);
  // A save from another path (role changed in another tab) restarts cleanly
  const current: OnboardingStep = path.includes(step) ? step : 'role';
  const stepIndex = path.indexOf(current);

  // Set once the API saved the onboarding: the done screen stays on
  const finishedRef = useRef(false);
  const snapshotRef = useRef({ step: current, answers });
  snapshotRef.current = { step: current, answers };

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // Somebody who finished it elsewhere has nothing to do here
  useEffect(() => {
    if (
      authenticated &&
      !isLoadingUser &&
      user?.onboardingCompleted &&
      !finishedRef.current
    ) {
      clearProgress();
      navigate(takeReturnTo(getPath(['dashboard'])), { replace: true });
    }
  }, [authenticated, user, isLoadingUser, navigate]);

  // Sent when the onboarding opens, not when it ends: the source of the
  // users who give up along the way counts too
  const { mutate: recordSignupAttribution } =
    useRecordSignupAttributionMutation({ onSuccess: forgetSignupAttribution });
  const pendingUserId =
    user && !user.onboardingCompleted ? user.userId : undefined;
  useEffect(() => {
    if (pendingUserId === undefined) return;
    const attribution = readSignupAttribution();
    if (attribution) recordSignupAttribution(attribution);
  }, [pendingUserId, recordSignupAttribution]);

  useEffect(() => {
    if (pendingUserId === undefined || progress.startedAt !== null) return;
    posthog?.capture(AnalyticsEvent.onboarding_started, { variant: VARIANT });
    setProgress((p) => ({ ...p, startedAt: Date.now() }));
  }, [pendingUserId, progress.startedAt, posthog]);

  useEffect(() => {
    posthog?.capture(AnalyticsEvent.onboarding_step_viewed, {
      step: current,
      step_index: stepIndex,
      total_steps: path.length,
      variant: VARIANT,
    });
    // One event per screen shown, not per answer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  // Leaving for a provider's consent page is not giving up: it comes back
  useEffect(() => {
    const emitAbandoned = () => {
      if (finishedRef.current || !authenticated || isLeavingForOauth()) return;
      posthog?.capture(AnalyticsEvent.onboarding_abandoned, {
        last_step: snapshotRef.current.step,
        role: snapshotRef.current.answers.role,
        variant: VARIANT,
      });
    };
    window.addEventListener('pagehide', emitAbandoned);
    return () => window.removeEventListener('pagehide', emitAbandoned);
  }, [authenticated, posthog]);

  // Connecting a device brings its recent months along, as the screen
  // promises. Once per provider: a limited import leaves the account ready
  // for another, which a second visit must not spend quota on.
  useEffect(() => {
    if (finishedRef.current) return;
    const requested = importRequested();
    for (const account of connected) {
      const eligible =
        getProviderSyncCapabilities(account.provider).supportsFullImport &&
        account.importActivitiesEnabled &&
        !account.fullImportRequestedAt &&
        !account.fullImportCompletedAt;
      if (!eligible || requested.includes(account.provider)) continue;
      rememberImportRequested(account.provider);
      ProviderAPI.importAllActivities(account.provider, {
        months: ONBOARDING_IMPORT_MONTHS,
      }).catch(() => {
        // The settings offer it again; nothing to tell here
      });
    }
  }, [connected]);

  const importing = connected.find((account) =>
    isFullImportInProgress(account),
  );
  const range = useMemo(() => lastWeeksRange(), []);
  const showImport =
    !!importing &&
    !!athlete &&
    stepIndex > path.indexOf('connect') &&
    current !== 'done';
  const { data: imported } = useStatisticsOverviewQuery(
    { athleteId: athlete?.athleteId ?? 0, from: range.from, to: range.to },
    showImport,
    showImport ? 5000 : false,
  );

  const update = (patch: Partial<OnboardingAnswers>) =>
    setProgress((p) => ({ ...p, answers: { ...p.answers, ...patch } }));

  const advance = (
    patch: Partial<OnboardingAnswers> = {},
    { skipped = false }: { skipped?: boolean } = {},
  ) => {
    const merged = { ...answers, ...patch };
    posthog?.capture(
      skipped
        ? AnalyticsEvent.onboarding_step_skipped
        : AnalyticsEvent.onboarding_step_completed,
      {
        step: current,
        step_index: stepIndex,
        total_steps: onboardingPath(merged, context).length,
        role: merged.role,
        variant: VARIANT,
      },
    );
    const target = nextStep(current, merged, context);
    setProgress((p) => ({
      ...p,
      answers: merged,
      step: target,
      history: [...p.history, current],
    }));
  };

  const goBack = () =>
    setProgress((p) => {
      const history = [...p.history];
      let previous = history.pop();
      // Skip screens the answers made irrelevant
      while (previous && !path.includes(previous)) previous = history.pop();
      return previous ? { ...p, step: previous, history } : p;
    });

  const complete = useCompleteOnboardingMutation({
    onSuccess: async (_, dto) => {
      finishedRef.current = true;
      posthog?.capture(AnalyticsEvent.onboarding_completed, {
        roles: dto.roles,
        acquisition_source: dto.acquisitionSource,
        training_goal: dto.trainingGoal,
        weekly_training_hours: dto.weeklyTrainingHours,
        coach_team_size: dto.coachTeamSize,
        sports_count: dto.practicedSports?.length ?? 0,
        target_race: !!dto.targetRace,
        device_connected: connected.length > 0,
        variant: VARIANT,
      });
      setProgress((p) => ({
        ...p,
        step: 'done',
        history: [],
      }));
      await initialize();
    },
    onError: (error) => {
      toast.error(error.message || m.onboarding_error());
    },
  });

  const finish = (patch: Partial<OnboardingAnswers>, skipped: boolean) => {
    const merged = { ...answers, ...patch };
    posthog?.capture(
      skipped
        ? AnalyticsEvent.onboarding_step_skipped
        : AnalyticsEvent.onboarding_step_completed,
      { step: current, role: merged.role, variant: VARIANT },
    );
    setProgress((p) => ({ ...p, answers: merged }));
    complete.mutate(
      toCompleteOnboardingDto(merged, {
        raceName: merged.raceDistance
          ? RACE_DISTANCE_LABELS[merged.raceDistance]()
          : undefined,
      }),
    );
  };

  const leave = () => {
    clearProgress();
    navigate(
      takeReturnTo(
        isAthlete
          ? getPath(['dashboard', 'calendar', 'root'])
          : getPath(['dashboard', 'coach']),
      ),
    );
  };

  const today = localToday();
  const race =
    answers.goal === 'RACE' &&
    answers.raceDistance &&
    answers.raceDate &&
    isAthlete
      ? {
          name: RACE_DISTANCE_LABELS[answers.raceDistance](),
          date: answers.raceDate,
        }
      : null;

  const screen = (() => {
    switch (current) {
      case 'role':
        return {
          body: (
            <RoleStep
              role={answers.role}
              onSelect={(role) => advance({ role })}
            />
          ),
          footer: null,
        };
      case 'team':
        return {
          body: (
            <TeamStep
              teamSize={answers.teamSize}
              onSelect={(teamSize) => advance({ teamSize })}
            />
          ),
          footer: (
            <Button
              variant="ghost"
              className="h-11 w-full"
              onClick={() => advance({}, { skipped: true })}
            >
              {m.onboarding_skip()}
            </Button>
          ),
        };
      case 'invite-athletes':
        return {
          body: (
            <>
              <StepHeader
                title={m.onboarding_invite_athletes_title()}
                subtitle={m.onboarding_invite_athletes_subtitle()}
              />
              <CoachJoinLinkCard />
              <EmailListInput
                id="onboarding-athlete-emails"
                label={m.onboarding_invite_athletes_emails()}
                emails={answers.athleteEmails}
                onChange={(athleteEmails) => update({ athleteEmails })}
              />
            </>
          ),
          footer: (
            <>
              <Button className="h-12 w-full" onClick={() => advance()}>
                {m.onboarding_continue()}
              </Button>
              <Button
                variant="ghost"
                className="h-11 w-full"
                onClick={() =>
                  advance({ athleteEmails: [] }, { skipped: true })
                }
              >
                {m.onboarding_later()}
              </Button>
            </>
          ),
        };
      case 'sports':
        return {
          body: (
            <SportsStep
              sports={answers.sports}
              onChange={(sports) => update({ sports })}
            />
          ),
          footer: (
            <>
              <Button
                className="h-12 w-full"
                disabled={answers.sports.length === 0}
                onClick={() => advance()}
              >
                {m.onboarding_continue()}
              </Button>
              <Button
                variant="ghost"
                className="h-11 w-full"
                onClick={() => advance({}, { skipped: true })}
              >
                {m.onboarding_skip()}
              </Button>
            </>
          ),
        };
      case 'goal':
        return {
          body: (
            <GoalStep
              goal={answers.goal}
              raceDistance={answers.raceDistance}
              raceDate={answers.raceDate}
              today={today}
              onGoal={(goal) =>
                goal === 'RACE' ? update({ goal }) : advance({ goal })
              }
              onRace={({ distance, date }) =>
                update({
                  ...(distance !== undefined && { raceDistance: distance }),
                  ...(date !== undefined && { raceDate: date }),
                })
              }
            />
          ),
          footer:
            answers.goal === 'RACE' ? (
              <>
                <Button
                  className="h-12 w-full"
                  disabled={!answers.raceDistance || !answers.raceDate}
                  onClick={() => advance()}
                >
                  {m.onboarding_continue()}
                </Button>
                <Button
                  variant="ghost"
                  className="h-11 w-full"
                  onClick={() => advance({ raceDate: '' })}
                >
                  {m.onboarding_race_no_date()}
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                className="h-11 w-full"
                onClick={() => advance({}, { skipped: true })}
              >
                {m.onboarding_skip()}
              </Button>
            ),
        };
      case 'connect':
        return {
          body: (
            <ConnectStep
              connected={connected}
              isLoadingConnected={isLoadingConnected}
            />
          ),
          footer:
            connected.length > 0 ? (
              <Button className="h-12 w-full" onClick={() => advance()}>
                {m.onboarding_continue()}
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="h-11 w-full"
                onClick={() => advance({}, { skipped: true })}
              >
                {m.onboarding_connect_none()}
              </Button>
            ),
        };
      case 'hours':
        return {
          body: (
            <HoursStep
              hours={answers.hours}
              onSelect={(hours) => advance({ hours })}
            />
          ),
          footer: (
            <Button
              variant="ghost"
              className="h-11 w-full"
              onClick={() => advance({}, { skipped: true })}
            >
              {m.onboarding_skip()}
            </Button>
          ),
        };
      case 'invite-coach':
        return {
          body: (
            <InviteCoachStep
              email={answers.coachEmail}
              onChange={(coachEmail) => update({ coachEmail })}
            />
          ),
          footer: (
            <>
              <Button
                className="h-12 w-full"
                disabled={!isEmail(answers.coachEmail.trim())}
                onClick={() => advance()}
              >
                {m.onboarding_invite_coach_send()}
              </Button>
              <Button
                variant="ghost"
                className="h-11 w-full"
                onClick={() => advance({ coachEmail: '' }, { skipped: true })}
              >
                {m.onboarding_later()}
              </Button>
            </>
          ),
        };
      case 'source':
        return {
          body: (
            <SourceStep
              source={answers.source}
              onSelect={(source) => finish({ source }, false)}
            />
          ),
          footer: (
            <Button
              variant="ghost"
              className="h-11 w-full"
              disabled={complete.isPending}
              isLoading={complete.isPending}
              onClick={() => finish({ source: null }, true)}
            >
              {m.onboarding_skip()}
            </Button>
          ),
        };
      case 'done':
        return {
          body: (
            <DoneStep
              athlete={isAthlete}
              coach={isCoach}
              athleteId={athlete?.athleteId}
              hasDevice={connected.length > 0}
              importing={!!importing}
              race={race}
              onConnect={() => {
                clearProgress();
                navigate(
                  `${getPath(['dashboard', 'settings', 'root'])}?tab=connectors`,
                );
              }}
            />
          ),
          footer: (
            <Button className="h-12 w-full" onClick={leave}>
              {isAthlete
                ? m.onboarding_done_open_calendar()
                : m.onboarding_done_open_coach()}
            </Button>
          ),
        };
    }
  })();

  // The last screen is not a question: the bar counts the others
  const questions = path.length - 1;
  const canGoBack =
    current !== 'done' && current !== 'role' && history.length > 0;

  return (
    <div className="bg-background fixed inset-0 z-50 flex flex-col overflow-y-auto pt-[var(--safe-top)] pb-[var(--safe-bottom)]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 sm:px-6 sm:py-8">
        <header className="flex min-h-14 items-center gap-3 py-2">
          {current === 'role' ? (
            <img
              src={resolvedTheme === 'dark' ? logoWhiteSrc : logoDarkSrc}
              alt="OpenAthlete"
              className="h-6"
            />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="size-11 shrink-0"
              onClick={goBack}
              disabled={!canGoBack}
              aria-label={m.onboarding_back()}
            >
              <ChevronLeft className="size-5" />
            </Button>
          )}
          {current !== 'done' && current !== 'role' && (
            <div
              className="flex flex-1 gap-1"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={questions}
              aria-valuenow={stepIndex + 1}
              aria-label={m.onboarding_progress({
                current: stepIndex + 1,
                total: questions,
              })}
            >
              {Array.from({ length: questions }).map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors duration-300',
                    index <= stepIndex ? 'bg-primary' : 'bg-border',
                  )}
                />
              ))}
            </div>
          )}
        </header>

        {showImport && importing && (
          <div className="bg-secondary text-muted-foreground mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs">
            <span className="bg-chart-5 size-2 shrink-0 animate-pulse rounded-full" />
            <span className="truncate">
              {m.onboarding_import_running({
                provider: connectorProviderLabelMap[importing.provider],
              })}
              {imported && imported.totals.count > 0 && (
                <>
                  {' · '}
                  {m.onboarding_import_activities({
                    count: imported.totals.count,
                  })}
                </>
              )}
            </span>
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={current}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="flex flex-1 flex-col gap-5 pt-2 pb-4"
          >
            {screen.body}
            {current === 'role' && (
              <div className="mt-auto flex justify-center pt-4">
                <LanguageSwitcher buttonVariant="secondary" showLabelOnMobile />
              </div>
            )}
          </motion.main>
        </AnimatePresence>

        {screen.footer && (
          <footer className="bg-background sticky bottom-0 flex flex-col gap-1 pt-2 pb-4">
            {screen.footer}
          </footer>
        )}
      </div>
    </div>
  );
}
