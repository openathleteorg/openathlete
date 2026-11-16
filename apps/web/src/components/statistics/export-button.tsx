import { m } from '@/paraglide/messages';
import { isCapacitor } from '@/utils/capacitor';
import { downloadFile, toCsv } from '@/utils/csv';
import { Download } from 'lucide-react';

import { useHasGarminData } from '../garmin-attribution/garmin-source';
import { Button } from '../ui/button';

interface P {
  /** Whose figures: an export of Garmin data keeps Garmin's attribution */
  athleteId: number;
  name: string;
  header: string[];
  rows: () => (string | number | null | undefined)[][];
}

/** The figures behind a chart. A native app has no download folder to reach. */
export function ExportButton({ athleteId, name, header, rows }: P) {
  const hasGarminData = useHasGarminData(athleteId);
  if (isCapacitor()) return null;
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-11 text-muted-foreground md:h-8"
      data-export={name}
      onClick={() =>
        downloadFile(
          `openathlete-${name}.csv`,
          new Blob(
            [
              toCsv(header, [
                ...rows(),
                // Garmin requires its attribution to travel with the data
                ...(hasGarminData
                  ? [[], [m.garmin_attribution_insights()]]
                  : []),
              ]),
            ],
            { type: 'text/csv' },
          ),
        )
      }
    >
      <Download className="size-4" />
      {m.statistics_export()}
    </Button>
  );
}
