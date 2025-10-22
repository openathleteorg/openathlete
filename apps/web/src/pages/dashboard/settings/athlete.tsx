import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { m } from '@/paraglide/messages';
import { useParams } from 'react-router-dom';

export function AthleteSettingsPage() {
  const { athleteId } = useParams<{ athleteId: string }>();

  return (
    <div className="container mx-auto space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{m.settings()}</h1>
      </div>

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
