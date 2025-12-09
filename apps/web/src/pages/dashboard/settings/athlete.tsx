import { SessionValidationSettingsCard } from '@/components/session-validation-settings-card';
import { useAthleteInfo } from '@/hooks/use-athlete-info';
import { m } from '@/paraglide/messages';
import { useParams } from 'react-router-dom';

export function AthleteSettingsPage() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const { athlete, isCurrentUser } = useAthleteInfo({
    athleteId: athleteId ? parseInt(athleteId, 10) : undefined,
  });

  const pageTitle = isCurrentUser
    ? m.settings()
    : m.settings_of({
        firstName: athlete?.user?.firstName || '',
        lastName: athlete?.user?.lastName || '',
      });

  if (!athleteId) return null;

  return (
    <div className="w-full p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-semibold">{pageTitle}</h1>

      <SessionValidationSettingsCard athleteId={parseInt(athleteId, 10)} />
    </div>
  );
}
