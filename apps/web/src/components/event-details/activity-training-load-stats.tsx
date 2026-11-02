import {
  TrainingLoadCalculationType,
  useActivityTrainingLoads,
} from '@/api/training-load';
import { Loader } from '@/components/ui/loader';
import * as m from '@/paraglide/messages.js';
import { ActivityIcon } from 'lucide-react';

interface ActivityTrainingLoadStatsProps {
  activityId: number;
}

export function ActivityTrainingLoadStats({
  activityId,
}: ActivityTrainingLoadStatsProps) {
  const { data: trainingLoads, isLoading } =
    useActivityTrainingLoads(activityId);

  if (isLoading) {
    return (
      <div className="text-left">
        <div className="text-sm font-semibold">{m.training_load()}</div>
        <div className="flex items-center gap-1.5">
          <Loader size="sm" />
        </div>
      </div>
    );
  }

  if (!trainingLoads || trainingLoads.length === 0) {
    return null;
  }

  // One TRIMP entry per activity: the athlete has a single TRIMP calculation
  const trimp = trainingLoads.find(
    (load) =>
      load.metadata.calculationType === TrainingLoadCalculationType.TRIMP,
  );
  if (!trimp) return null;

  return (
    <div className="text-left">
      <div className="text-sm font-semibold">{m.training_load()}</div>
      <div className="flex items-center gap-1.5">
        <ActivityIcon className="h-4 w-4 text-muted-foreground" />
        <span>
          {trimp.value.toFixed(0)}{' '}
          <span className="text-muted-foreground text-sm">
            {m.trimp_unit()}
          </span>
        </span>
      </div>
    </div>
  );
}
