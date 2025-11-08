import { m } from '@/paraglide/messages';
import { OnboardingView } from '@/views/dashboard/onboarding/onboarding-view';

export function OnboardingPage() {
  return (
    <>
      <title>{m.onboarding_welcome_title()}</title>
      <OnboardingView />
    </>
  );
}
