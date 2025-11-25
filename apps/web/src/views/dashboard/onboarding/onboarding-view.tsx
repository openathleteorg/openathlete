import { useCompleteOnboardingMutation, useGetMeQuery } from '@/api/user';
import logoDarkSrc from '@/assets/logos/logo_dark.svg';
import logoWhiteSrc from '@/assets/logos/logo_white.svg';
import { ConnectorsList } from '@/components/connectors/connectors-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuthContext } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { cn } from '@/utils/shadcn';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { CompleteOnboardingDto } from '@openathlete/shared';

type OnboardingStep =
  | 'welcome'
  | 'role-selection'
  | 'coach-invitation'
  | 'athlete-info'
  | 'connectors'
  | 'athlete-invitations'
  | 'complete';

interface OnboardingData {
  roles: ('ATHLETE' | 'COACH')[];
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  weight?: number;
  height?: number;
  hrMax?: number;
  hrRest?: number;
  coachEmail?: string;
  athleteEmails: string[];
}

const ONBOARDING_STORAGE_KEY = 'openathlete_onboarding_data';
const ONBOARDING_STEP_KEY = 'openathlete_onboarding_step';

// Load onboarding data from localStorage
const loadOnboardingData = (): OnboardingData | null => {
  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load onboarding data from localStorage:', error);
  }
  return null;
};

// Save onboarding data to localStorage
const saveOnboardingData = (data: OnboardingData) => {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save onboarding data to localStorage:', error);
  }
};

// Load current step index from localStorage
const loadOnboardingStep = (): number => {
  try {
    const stored = localStorage.getItem(ONBOARDING_STEP_KEY);
    if (stored) {
      const step = parseInt(stored, 10);
      if (!isNaN(step) && step >= 0) {
        return step;
      }
    }
  } catch (error) {
    console.error('Failed to load onboarding step from localStorage:', error);
  }
  return 0;
};

// Save current step index to localStorage
const saveOnboardingStep = (stepIndex: number) => {
  try {
    localStorage.setItem(ONBOARDING_STEP_KEY, stepIndex.toString());
  } catch (error) {
    console.error('Failed to save onboarding step to localStorage:', error);
  }
};

// Clear onboarding data from localStorage
const clearOnboardingStorage = () => {
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    localStorage.removeItem(ONBOARDING_STEP_KEY);
  } catch (error) {
    console.error('Failed to clear onboarding data from localStorage:', error);
  }
};

export function OnboardingView() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const { initialize, authenticated } = useAuthContext();
  const { data: user, isLoading: isLoadingUser } = useGetMeQuery({
    enabled: authenticated, // Only fetch if authenticated
  });

  // Load initial data from localStorage or use defaults
  const [currentStepIndex, setCurrentStepIndex] = useState(() =>
    loadOnboardingStep(),
  );
  const [data, setData] = useState<OnboardingData>(() => {
    const stored = loadOnboardingData();
    return (
      stored || {
        roles: [],
        athleteEmails: [],
      }
    );
  });

  // Generate steps based on selected roles
  const steps = useMemo<OnboardingStep[]>(() => {
    const baseSteps: OnboardingStep[] = ['welcome', 'role-selection'];
    const isAthlete = data.roles.includes('ATHLETE');
    const isCoach = data.roles.includes('COACH');
    const isAthleteOnly = isAthlete && !isCoach;

    if (data.roles.length === 0) {
      return baseSteps;
    }

    const roleBasedSteps: OnboardingStep[] = [];

    // If athlete only, add coach invitation step
    if (isAthleteOnly) {
      roleBasedSteps.push('coach-invitation');
    }

    // If athlete (alone or with coach), add athlete info and connectors
    if (isAthlete) {
      roleBasedSteps.push('athlete-info', 'connectors');
    }

    // If coach (alone or with athlete), add athlete invitations
    if (isCoach) {
      roleBasedSteps.push('athlete-invitations');
    }

    // Always end with complete
    return [...baseSteps, ...roleBasedSteps, 'complete'];
  }, [data.roles]);

  const currentStep = steps[currentStepIndex];

  // Adjust step index when steps array changes (e.g., when roles change)
  // Only adjust if we're not on role-selection step (to allow going back)
  useEffect(() => {
    // If we're on role-selection, don't adjust - user can change roles freely
    if (currentStep === 'role-selection') {
      return;
    }

    // If current step index is out of bounds, adjust it
    if (currentStepIndex >= steps.length) {
      setCurrentStepIndex(Math.max(0, steps.length - 1));
      return;
    }
    // If current step doesn't exist in new steps array, find closest match
    const stepAtCurrentIndex = steps[currentStepIndex];
    if (!stepAtCurrentIndex) {
      // Find the closest valid step
      const validIndex = Math.min(currentStepIndex, steps.length - 1);
      setCurrentStepIndex(Math.max(0, validIndex));
    }
  }, [steps, currentStepIndex, currentStep]);

  // Redirect if onboarding already completed (only if user data is loaded and authenticated)
  useEffect(() => {
    if (authenticated && !isLoadingUser && user && user.onboardingCompleted) {
      navigate(getPath(['dashboard']));
    }
  }, [authenticated, user, isLoadingUser, navigate]);

  const completeOnboardingMutation = useCompleteOnboardingMutation({
    onSuccess: async () => {
      await initialize();
      navigate(getPath(['dashboard']));
    },
    onError: (error) => {
      toast.error(error.message || m.onboarding_error());
    },
  });

  const handleNext = () => {
    // If on role-selection, regenerate steps and move to next
    if (currentStep === 'role-selection') {
      if (data.roles.length === 0) {
        toast.error(m.onboarding_role_selection_subtitle());
        return;
      }
      // Steps will be regenerated, find the next step after role-selection
      const roleSelectionIndex = steps.indexOf('role-selection');
      const nextIndex = roleSelectionIndex + 1;
      if (nextIndex < steps.length) {
        setCurrentStepIndex(nextIndex);
        saveOnboardingStep(nextIndex);
      }
      return;
    }

    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      saveOnboardingStep(nextIndex);
    } else if (currentStep === 'complete') {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      // When going back to role-selection, we need to ensure we stay on that step
      // even if steps array changes
      const previousIndex = currentStepIndex - 1;
      const previousStep = steps[previousIndex];

      let newIndex: number;
      if (previousStep === 'role-selection') {
        // Find role-selection in the current steps array (it should always be at index 1)
        const roleSelectionIndex = steps.indexOf('role-selection');
        newIndex = roleSelectionIndex >= 0 ? roleSelectionIndex : previousIndex;
      } else {
        newIndex = previousIndex;
      }
      setCurrentStepIndex(newIndex);
      saveOnboardingStep(newIndex);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleComplete = () => {
    const payload: CompleteOnboardingDto = {
      roles: data.roles,
      gender: data.gender,
      weight: data.weight,
      height: data.height,
      hrMax: data.hrMax,
      hrRest: data.hrRest,
      coachEmail: data.coachEmail || undefined,
      athleteEmails:
        data.athleteEmails.length > 0 ? data.athleteEmails : undefined,
    };

    completeOnboardingMutation.mutate(payload);
  };

  // Save data to localStorage whenever it changes
  useEffect(() => {
    saveOnboardingData(data);
  }, [data]);

  // Clear localStorage when onboarding is completed successfully
  useEffect(() => {
    if (completeOnboardingMutation.isSuccess) {
      clearOnboardingStorage();
    }
  }, [completeOnboardingMutation.isSuccess]);

  // Don't auto-advance when roles are selected - let user click "Next" button

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="flex flex-col items-center gap-6 text-center">
            <h1 className="text-3xl font-bold">
              {m.onboarding_welcome_title()}
            </h1>
            <p className="text-muted-foreground text-md">
              {m.onboarding_welcome_subtitle()}
            </p>
          </div>
        );

      case 'role-selection':
        return (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">
                {m.onboarding_role_selection_title()}
              </h2>
              <p className="text-muted-foreground mt-2">
                {m.onboarding_role_selection_subtitle()}
              </p>
            </div>
            <div className="grid gap-4">
              <button
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    roles: d.roles.includes('ATHLETE')
                      ? d.roles.filter((r) => r !== 'ATHLETE')
                      : [...d.roles, 'ATHLETE'],
                  }))
                }
                className={cn(
                  'flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors',
                  data.roles.includes('ATHLETE')
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50',
                )}
              >
                <CheckCircle2
                  className={cn(
                    'h-5 w-5',
                    data.roles.includes('ATHLETE')
                      ? 'text-primary'
                      : 'text-muted-foreground',
                  )}
                />
                <span className="font-medium">
                  {m.onboarding_role_athlete()}
                </span>
              </button>
              <button
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    roles: d.roles.includes('COACH')
                      ? d.roles.filter((r) => r !== 'COACH')
                      : [...d.roles, 'COACH'],
                  }))
                }
                className={cn(
                  'flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors',
                  data.roles.includes('COACH')
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50',
                )}
              >
                <CheckCircle2
                  className={cn(
                    'h-5 w-5',
                    data.roles.includes('COACH')
                      ? 'text-primary'
                      : 'text-muted-foreground',
                  )}
                />
                <span className="font-medium">{m.onboarding_role_coach()}</span>
              </button>
            </div>
          </div>
        );

      case 'coach-invitation':
        return (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">
                {m.onboarding_coach_invitation_title()}
              </h2>
              <p className="text-muted-foreground mt-2">
                {m.onboarding_coach_invitation_subtitle()}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="coach-email">
                  {m.onboarding_coach_invitation_email()}
                </Label>
                <Input
                  id="coach-email"
                  type="email"
                  placeholder={m.email_placeholder()}
                  value={data.coachEmail || ''}
                  onChange={(e) =>
                    setData((d) => ({ ...d, coachEmail: e.target.value }))
                  }
                  className="mt-2"
                />
              </div>
              <Button variant="ghost" onClick={handleSkip} className="w-full">
                {m.onboarding_coach_invitation_skip()}
              </Button>
            </div>
          </div>
        );

      case 'athlete-info':
        return (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">
                {m.onboarding_athlete_info_title()}
              </h2>
              <p className="text-muted-foreground mt-2">
                {m.onboarding_athlete_info_subtitle()}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="gender">{m.gender()}</Label>
                <Select
                  value={data.gender}
                  onValueChange={(value: 'MALE' | 'FEMALE' | 'OTHER') =>
                    setData((d) => ({ ...d, gender: value }))
                  }
                >
                  <SelectTrigger id="gender" className="mt-2">
                    <SelectValue placeholder={m.gender_placeholder()} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">{m.gender_male()}</SelectItem>
                    <SelectItem value="FEMALE">{m.gender_female()}</SelectItem>
                    <SelectItem value="OTHER">{m.gender_other()}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="weight">
                  {m.onboarding_athlete_info_weight()}
                </Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="70"
                  value={data.weight || ''}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      weight: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    }))
                  }
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="height">
                  {m.onboarding_athlete_info_height()}
                </Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="175"
                  value={data.height || ''}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      height: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    }))
                  }
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="hr-max">
                  {m.onboarding_athlete_info_hr_max()}
                </Label>
                <Input
                  id="hr-max"
                  type="number"
                  placeholder="190"
                  value={data.hrMax || ''}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      hrMax: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    }))
                  }
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="hr-rest">
                  {m.onboarding_athlete_info_hr_rest()}
                </Label>
                <Input
                  id="hr-rest"
                  type="number"
                  placeholder="50"
                  value={data.hrRest || ''}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      hrRest: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    }))
                  }
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        );

      case 'connectors':
        return (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">
                {m.onboarding_connectors_title()}
              </h2>
              <p className="text-muted-foreground mt-2">
                {m.onboarding_connectors_subtitle()}
              </p>
            </div>
            <ConnectorsList showSkip onSkip={handleSkip} />
          </div>
        );

      case 'athlete-invitations':
        return (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">
                {m.onboarding_athlete_invitations_title()}
              </h2>
              <p className="text-muted-foreground mt-2">
                {m.onboarding_athlete_invitations_subtitle()}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="athlete-emails">
                  {m.onboarding_athlete_invitations_title()}
                </Label>
                <Textarea
                  id="athlete-emails"
                  placeholder={m.onboarding_athlete_invitations_placeholder()}
                  value={data.athleteEmails.join('\n')}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      athleteEmails: e.target.value
                        .split('\n')
                        .map((email) => email.trim())
                        .filter((email) => email.length > 0),
                    }))
                  }
                  className="mt-2 min-h-[120px]"
                />
              </div>
              <Button variant="ghost" onClick={handleSkip} className="w-full">
                {m.onboarding_athlete_invitations_skip()}
              </Button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="flex flex-col items-center gap-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
            <h1 className="text-3xl font-bold">
              {m.onboarding_complete_title()}
            </h1>
            <p className="text-muted-foreground text-lg">
              {m.onboarding_complete_subtitle()}
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    if (currentStep === 'role-selection') {
      return data.roles.length > 0;
    }
    return true;
  };

  if (!currentStep) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 fixed top-0 left-0 w-full h-full z-50">
      <div className="mb-8">
        <img
          src={resolvedTheme === 'dark' ? logoWhiteSrc : logoDarkSrc}
          alt="OpenAthlete"
          className="h-8"
        />
      </div>
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="rounded-lg border bg-card p-8 shadow-sm overflow-y-auto max-h-[calc(100vh-100px)]"
          >
            {renderStep()}
            <div className="mt-8 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentStepIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                {m.onboarding_previous()}
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed() || completeOnboardingMutation.isPending}
                isLoading={completeOnboardingMutation.isPending}
              >
                {currentStep === 'complete'
                  ? m.onboarding_complete_continue()
                  : currentStep === 'welcome'
                    ? m.onboarding_welcome_next()
                    : m.onboarding_next()}
                {currentStep !== 'complete' && currentStep !== 'welcome' && (
                  <ChevronRight className="h-4 w-4 ml-2" />
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
