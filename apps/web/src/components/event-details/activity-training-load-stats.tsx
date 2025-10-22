import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TrainingLoadCalculationType, useActivityTrainingLoads } from '@/api/training-load';
import { ActivityIcon } from 'lucide-react';
import * as m from '@/paraglide/messages.js';

interface ActivityTrainingLoadStatsProps {
  activityId: number;
}

const CALCULATION_TYPE_LABELS: Record<TrainingLoadCalculationType, string> = {
  [TrainingLoadCalculationType.FOSTER_RPE]: 'Foster (RPE)',
  [TrainingLoadCalculationType.TRIMP_EDWARDS]: 'TRIMP Edwards',
  [TrainingLoadCalculationType.TRIMP_BANISTER]: 'TRIMP Banister',
};

export function ActivityTrainingLoadStats({
  activityId,
}: ActivityTrainingLoadStatsProps) {
  const { data: trainingLoads, isLoading } =
    useActivityTrainingLoads(activityId);

  if (isLoading || !trainingLoads || trainingLoads.length === 0) {
    return null;
  }

  // Format all loads as a single string
  const loadsText = trainingLoads
    .map((load: any) => `${load.value.toFixed(0)}`)
    .join(' / ');

  return (
    <Popover>
      <PopoverTrigger className="text-left">
        <div className="text-sm font-semibold">{m.training_load()}</div>
        <div className="flex items-center gap-1.5">
          <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          <span>{loadsText}</span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto">
        <div className="space-y-2">
          {trainingLoads.map((load: any) => (
            <div key={load.trainingLoadEntryId} className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">
                {CALCULATION_TYPE_LABELS[load.metadata.calculationType as TrainingLoadCalculationType]}
              </span>
              <span className="text-sm font-medium">{load.value.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
