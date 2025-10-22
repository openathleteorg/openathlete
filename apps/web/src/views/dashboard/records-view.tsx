import { RecordsChart } from '@/components/charts/records-chart';
import { SportSelect } from '@/components/sport-select/sport-select';
import { Card, CardContent } from '@/components/ui/card';
import { useAthleteInfo } from '@/hooks/use-athlete-info';
import { m } from '@/paraglide/messages';
import { useGetRecordsQuery } from '@/services/record';
import { useState } from 'react';

import { SPORT_TYPE } from '@openathlete/shared';

interface P {
  athleteId?: number;
}

export function RecordsView({ athleteId }: P) {
  const [sport, setSport] = useState<SPORT_TYPE | null>(null);
  const { data: records, refetch } = useGetRecordsQuery(
    sport || (undefined as SPORT_TYPE | undefined),
    athleteId,
  );
  const { athlete, isCurrentUser } = useAthleteInfo({ athleteId });

  const handleChangeSportFilter = (value: string | null) => {
    setSport(value as SPORT_TYPE);
    setTimeout(() => {
      refetch();
    }, 100);
  };

  const pageTitle = isCurrentUser
    ? m.my_records()
    : m.records_of({
        firstName: athlete?.user?.firstName || '',
        lastName: athlete?.user?.lastName || '',
      });

  return (
    <div className="p-8 grid grid-cols-2 gap-4">
      <h1 className="text-2xl font-semibold col-span-2">{pageTitle}</h1>
      <Card className="col-span-2">
        <CardContent>
          <SportSelect selected={sport} onChange={handleChangeSportFilter} />
        </CardContent>
      </Card>
      <Card className="col-span-2">
        <CardContent>
          {records && !!records.length && (
            <RecordsChart records={records} className="h-[500px]" />
          )}
          {!records?.length && (
            <h1 className="text-2xl font-semibold">
              {m.no_records_found({ sport: !!sport ? m.for_this_sport() : '' })}
            </h1>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
