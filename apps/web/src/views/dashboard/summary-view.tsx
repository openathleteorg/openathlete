import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAthleteInfo } from '@/hooks/use-athlete-info';
import { m } from '@/paraglide/messages';

interface SummaryViewProps {
  athleteId?: string;
}

export function SummaryView({ athleteId }: SummaryViewProps) {
  const { athlete, isCurrentUser } = useAthleteInfo({
    athleteId: athleteId ? parseInt(athleteId, 10) : undefined,
  });

  const pageTitle = isCurrentUser
    ? m.my_summary()
    : m.summary_of({
        firstName: athlete?.user?.firstName || '',
        lastName: athlete?.user?.lastName || '',
      });

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">{pageTitle}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{m.summary()}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {/* TODO: Add summary content */}
            Page en construction pour l'athlète {athleteId || 'actuel'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
