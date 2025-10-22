import { QueryOptions, useQuery } from '@tanstack/react-query';

import { SPORT_TYPE } from '@openathlete/shared';

import { RecordService } from './record.service';

export const useGetRecordsQuery = (
  sport?: SPORT_TYPE,
  athleteId?: number,
  opt?: QueryOptions<Awaited<ReturnType<typeof RecordService.getRecords>>>,
) =>
  useQuery({
    ...opt,
    queryFn: () => RecordService.getRecords(sport, athleteId),
    queryKey: ['RecordService.getRecords', sport, athleteId],
  });
