import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { m } from '@/paraglide/messages';

interface SummaryViewProps {
  athleteId?: string;
}

export function SummaryView({ athleteId }: SummaryViewProps) {
  return (
    <div className="container mx-auto space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{m.summary()}</h1>
      </div>

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
