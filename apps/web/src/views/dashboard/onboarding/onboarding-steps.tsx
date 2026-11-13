import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { m } from '@/paraglide/messages';
import { sportTypeLabelMap } from '@/utils/label-map/core/sport-type.label-map';
import { cn } from '@/utils/shadcn';
import { motion } from 'framer-motion';
import { Check, Plus, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import {
  ACQUISITION_SOURCES,
  AcquisitionSource,
  COACH_TEAM_SIZES,
  CoachTeamSize,
  ONBOARDING_SPORTS,
  SPORT_TYPE,
  TARGET_RACE_DISTANCES,
  TargetRaceDistance,
  TrainingGoal,
  WEEKLY_TRAINING_HOURS,
  WeeklyTrainingHours,
} from '@openathlete/shared';

import { type OnboardingRole, isEmail } from './onboarding-flow';
import {
  HOURS_LABELS,
  RACE_DISTANCE_LABELS,
  TEAM_LABELS,
} from './onboarding-labels';

export function StepHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-[1.75rem]">
        {title}
      </h1>
      {subtitle && (
        <p className="text-muted-foreground text-[0.9375rem] leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/** A large answer: one tap picks it, and usually moves on */
export function ChoiceCard({
  title,
  description,
  badge,
  selected,
  onSelect,
}: {
  title: string;
  description?: string;
  badge?: ReactNode;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        'flex min-h-14 w-full items-center gap-3 rounded-xl border-[1.5px] bg-background px-4 py-3 text-left transition-colors',
        'focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
        selected
          ? 'border-primary bg-secondary'
          : 'border-border hover:border-ring',
      )}
    >
      {badge && (
        <span
          aria-hidden="true"
          className="bg-secondary text-foreground flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-semibold"
        >
          {badge}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-medium">{title}</span>
        {description && (
          <span className="text-muted-foreground text-sm">{description}</span>
        )}
      </span>
      {selected && <Check className="text-primary size-5 shrink-0" />}
    </button>
  );
}

/** A small answer among several, single or multiple choice */
export function ChoiceChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        'min-h-11 rounded-full border-[1.5px] px-4 text-sm font-medium transition-colors',
        'focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background hover:border-ring',
      )}
    >
      {label}
    </button>
  );
}

export function RoleStep({
  role,
  onSelect,
}: {
  role: OnboardingRole | null;
  onSelect: (role: OnboardingRole) => void;
}) {
  const choices: {
    role: OnboardingRole;
    badge: string;
    title: string;
    description: string;
  }[] = [
    {
      role: 'ATHLETE',
      badge: 'ATH',
      title: m.onboarding_role_athlete_title(),
      description: m.onboarding_role_athlete_desc(),
    },
    {
      role: 'COACH',
      badge: 'CO',
      title: m.onboarding_role_coach_title(),
      description: m.onboarding_role_coach_desc(),
    },
    {
      role: 'BOTH',
      badge: 'A+C',
      title: m.onboarding_role_both_title(),
      description: m.onboarding_role_both_desc(),
    },
  ];
  return (
    <>
      <StepHeader
        title={m.onboarding_role_title()}
        subtitle={m.onboarding_role_subtitle()}
      />
      <div className="flex flex-col gap-2">
        {choices.map((choice) => (
          <ChoiceCard
            key={choice.role}
            badge={choice.badge}
            title={choice.title}
            description={choice.description}
            selected={role === choice.role}
            onSelect={() => onSelect(choice.role)}
          />
        ))}
      </div>
    </>
  );
}

export function TeamStep({
  teamSize,
  onSelect,
}: {
  teamSize: CoachTeamSize | null;
  onSelect: (size: CoachTeamSize) => void;
}) {
  return (
    <>
      <StepHeader
        title={m.onboarding_team_title()}
        subtitle={m.onboarding_team_subtitle()}
      />
      <div className="flex flex-col gap-2">
        {COACH_TEAM_SIZES.map((size) => (
          <ChoiceCard
            key={size}
            title={TEAM_LABELS[size]()}
            selected={teamSize === size}
            onSelect={() => onSelect(size)}
          />
        ))}
      </div>
    </>
  );
}

/** Addresses typed one at a time, shown as removable chips */
export function EmailListInput({
  id,
  label,
  emails,
  onChange,
}: {
  id: string;
  label: string;
  emails: string[];
  onChange: (emails: string[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const [invalid, setInvalid] = useState(false);

  const add = () => {
    const email = draft.trim().toLowerCase();
    if (!email) return;
    if (!isEmail(email)) {
      setInvalid(true);
      return;
    }
    if (!emails.includes(email)) onChange([...emails, email]);
    setDraft('');
    setInvalid(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          type="email"
          inputMode="email"
          autoComplete="off"
          placeholder={m.email_placeholder()}
          value={draft}
          aria-invalid={invalid}
          onChange={(event) => {
            setDraft(event.target.value);
            setInvalid(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              add();
            }
          }}
          onBlur={add}
          className="h-11"
        />
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={add}
          aria-label={m.onboarding_invite_athletes_add()}
        >
          <Plus />
        </Button>
      </div>
      {invalid && (
        <p className="text-destructive text-sm">
          {m.onboarding_invite_athletes_invalid()}
        </p>
      )}
      {emails.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {emails.map((email) => (
            <li
              key={email}
              className="bg-secondary flex min-h-9 items-center gap-1 rounded-full py-1 pr-1 pl-3 text-sm"
            >
              <span className="max-w-56 truncate">{email}</span>
              <button
                type="button"
                className="hover:bg-background flex size-7 items-center justify-center rounded-full"
                aria-label={m.onboarding_invite_athletes_remove({ email })}
                onClick={() =>
                  onChange(emails.filter((item) => item !== email))
                }
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SportsStep({
  sports,
  onChange,
}: {
  sports: SPORT_TYPE[];
  onChange: (sports: SPORT_TYPE[]) => void;
}) {
  return (
    <>
      <StepHeader
        title={m.onboarding_sports_title()}
        subtitle={m.onboarding_sports_subtitle()}
      />
      <div className="flex flex-wrap gap-2">
        {ONBOARDING_SPORTS.map((sport) => {
          const selected = sports.includes(sport);
          return (
            <ChoiceChip
              key={sport}
              label={sportTypeLabelMap[sport]}
              selected={selected}
              onToggle={() =>
                onChange(
                  selected
                    ? sports.filter((item) => item !== sport)
                    : [...sports, sport],
                )
              }
            />
          );
        })}
      </div>
    </>
  );
}

const GOALS: {
  goal: TrainingGoal;
  title: () => string;
  description: () => string;
}[] = [
  {
    goal: 'RACE',
    title: m.onboarding_goal_race_title,
    description: m.onboarding_goal_race_desc,
  },
  {
    goal: 'PROGRESS',
    title: m.onboarding_goal_progress_title,
    description: m.onboarding_goal_progress_desc,
  },
  {
    goal: 'RESTART',
    title: m.onboarding_goal_restart_title,
    description: m.onboarding_goal_restart_desc,
  },
  {
    goal: 'FOLLOW_COACH',
    title: m.onboarding_goal_follow_coach_title,
    description: m.onboarding_goal_follow_coach_desc,
  },
];

export function GoalStep({
  goal,
  raceDistance,
  raceDate,
  today,
  onGoal,
  onRace,
}: {
  goal: TrainingGoal | null;
  raceDistance: TargetRaceDistance | null;
  raceDate: string;
  /** YYYY-MM-DD, the earliest race date offered */
  today: string;
  onGoal: (goal: TrainingGoal) => void;
  onRace: (race: {
    distance?: TargetRaceDistance | null;
    date?: string;
  }) => void;
}) {
  return (
    <>
      <StepHeader title={m.onboarding_goal_title()} />
      <div className="flex flex-col gap-2">
        {GOALS.map((item) => (
          <ChoiceCard
            key={item.goal}
            title={item.title()}
            description={item.description()}
            selected={goal === item.goal}
            onSelect={() => onGoal(item.goal)}
          />
        ))}
      </div>
      {goal === 'RACE' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3"
        >
          <p className="text-muted-foreground text-sm">
            {m.onboarding_race_title()}
          </p>
          <div className="flex flex-wrap gap-2">
            {TARGET_RACE_DISTANCES.map((distance) => (
              <ChoiceChip
                key={distance}
                label={RACE_DISTANCE_LABELS[distance]()}
                selected={raceDistance === distance}
                onToggle={() =>
                  onRace({
                    distance: raceDistance === distance ? null : distance,
                  })
                }
              />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="onboarding-race-date">
              {m.onboarding_race_date()}
            </Label>
            <Input
              id="onboarding-race-date"
              type="date"
              min={today}
              value={raceDate}
              onChange={(event) => onRace({ date: event.target.value })}
              className="h-11"
            />
          </div>
        </motion.div>
      )}
    </>
  );
}

export function HoursStep({
  hours,
  onSelect,
}: {
  hours: WeeklyTrainingHours | null;
  onSelect: (hours: WeeklyTrainingHours) => void;
}) {
  return (
    <>
      <StepHeader
        title={m.onboarding_hours_title()}
        subtitle={m.onboarding_hours_subtitle()}
      />
      <div className="flex flex-col gap-2">
        {WEEKLY_TRAINING_HOURS.map((value) => (
          <ChoiceCard
            key={value}
            title={HOURS_LABELS[value]()}
            selected={hours === value}
            onSelect={() => onSelect(value)}
          />
        ))}
      </div>
    </>
  );
}

export function InviteCoachStep({
  email,
  onChange,
}: {
  email: string;
  onChange: (email: string) => void;
}) {
  return (
    <>
      <StepHeader
        title={m.onboarding_invite_coach_title()}
        subtitle={m.onboarding_invite_coach_subtitle()}
      />
      <div className="flex flex-col gap-2">
        <Label htmlFor="onboarding-coach-email">
          {m.onboarding_invite_coach_email()}
        </Label>
        <Input
          id="onboarding-coach-email"
          type="email"
          inputMode="email"
          autoComplete="off"
          placeholder={m.email_placeholder()}
          value={email}
          onChange={(event) => onChange(event.target.value)}
          className="h-11"
        />
      </div>
    </>
  );
}

const SOURCE_LABELS: Record<AcquisitionSource, () => string> = {
  REDDIT: m.onboarding_acquisition_reddit,
  GOOGLE: m.onboarding_acquisition_google,
  AI_ASSISTANT: m.onboarding_acquisition_ai_assistant,
  COACH_OR_FRIEND: m.onboarding_acquisition_coach_or_friend,
  DISCORD: m.onboarding_acquisition_discord,
  YOUTUBE: m.onboarding_acquisition_youtube,
  OTHER: m.onboarding_acquisition_other,
};

export function SourceStep({
  source,
  onSelect,
}: {
  source: AcquisitionSource | null;
  onSelect: (source: AcquisitionSource) => void;
}) {
  return (
    <>
      <StepHeader title={m.onboarding_source_title()} />
      <div className="flex flex-wrap gap-2" role="group">
        {ACQUISITION_SOURCES.map((item) => (
          <ChoiceChip
            key={item}
            label={SOURCE_LABELS[item]()}
            selected={source === item}
            onToggle={() => onSelect(item)}
          />
        ))}
      </div>
    </>
  );
}
