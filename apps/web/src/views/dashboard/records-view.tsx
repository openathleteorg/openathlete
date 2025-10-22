import { RecordsChart } from '@/components/charts/records-chart';
import { SportSelect } from '@/components/sport-select/sport-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const handleChangeSportFilter = (value: string | null) => {
    setSport(value as SPORT_TYPE);
    setTimeout(() => {
      refetch();
    }, 100);
  };

  return (
    <div className="p-8 grid grid-cols-2 gap-4">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>{m.my_records()}</CardTitle>
        </CardHeader>
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
