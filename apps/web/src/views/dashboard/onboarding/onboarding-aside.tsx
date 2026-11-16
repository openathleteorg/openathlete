import authBackground from '@/assets/images/auth/background.webp';
import logoWhiteSrc from '@/assets/logos/logo_white.svg';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { Check } from 'lucide-react';

import type { OnboardingStep } from './onboarding-flow';

const STEP_LABELS: Record<Exclude<OnboardingStep, 'done'>, () => string> = {
  role: m.onboarding_step_label_role,
  team: m.onboarding_step_label_team,
  'invite-athletes': m.onboarding_step_label_invite_athletes,
  sports: m.onboarding_step_label_sports,
  goal: m.onboarding_step_label_goal,
  connect: m.onboarding_step_label_connect,
  hours: m.onboarding_step_label_hours,
  'invite-coach': m.onboarding_step_label_invite_coach,
  source: m.onboarding_step_label_source,
};

/**
 * Wide screens only: the picture of the login page, with the whole path in
 * view, so the questions don't float alone in an empty screen
 */
export function OnboardingAside({
  path,
  current,
}: {
  path: OnboardingStep[];
  current: OnboardingStep;
}) {
  const steps = path.filter(
    (step): step is Exclude<OnboardingStep, 'done'> => step !== 'done',
  );
  const currentIndex = path.indexOf(current);
  // The path grows once the role is known: before, only the first step shows
  const showSteps = current !== 'role' || steps.length > 1;

  return (
    <aside className="relative hidden overflow-hidden lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col">
      <img
        src={authBackground}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/30" />
      <div className="relative flex flex-1 flex-col justify-between p-10 pt-[calc(2.5rem+var(--safe-top))] text-white xl:p-14">
        <img src={logoWhiteSrc} alt="OpenAthlete" className="h-7 w-fit" />
        <div className="flex max-w-md flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-balance xl:text-4xl">
              {m.onboarding_aside_title()}
            </h2>
            <p className="text-base leading-relaxed text-white/75">
              {m.onboarding_aside_subtitle()}
            </p>
          </div>
          {showSteps && (
            <ol className="flex flex-col gap-1" aria-hidden="true">
              {steps.map((step, index) => {
                const done = index < currentIndex;
                const active = step === current;
                return (
                  <li
                    key={step}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                      active && 'bg-white/15 font-semibold',
                      !active && !done && 'text-white/60',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs tabular-nums',
                        done
                          ? 'border-white bg-white text-black'
                          : active
                            ? 'border-white'
                            : 'border-white/40',
                      )}
                    >
                      {done ? <Check className="size-3.5" /> : index + 1}
                    </span>
                    {STEP_LABELS[step]()}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </aside>
  );
}
