import { QueryOptions, useQuery } from '@tanstack/react-query';

import { SPORT_TYPE } from '@openathlete/shared';

import { RecordAPI } from './record.api';
import { recordKeys } from './record.keys';

export const useGetRecordsQuery = (
  sport?: SPORT_TYPE,
  athleteId?: number,
  opt?: QueryOptions<Awaited<ReturnType<typeof RecordAPI.getRecords>>>,
) =>
  useQuery({
    ...opt,
    queryFn: () => RecordAPI.getRecords(sport, athleteId),
    queryKey: [recordKeys.getRecords, sport, athleteId],
  });
