import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">{pageTitle}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{m.settings()}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {/* TODO: Add athlete-specific settings content */}
            Paramètres de l'athlète coaché (ID: {athleteId})
          </p>
          <p className="text-muted-foreground mt-4">
            Fonctionnalités à implémenter :
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>Gestion des équipements de l'athlète</li>
            <li>Zones d'entraînement personnalisées</li>
            <li>Préférences d'affichage</li>
            <li>Permissions et accès</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
