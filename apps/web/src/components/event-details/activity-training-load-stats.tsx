import {
  TrainingLoadCalculationType,
  useActivityTrainingLoads,
} from '@/api/training-load';
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

  if (isLoading || !trainingLoads || trainingLoads.length === 0) {
    return null;
  }

  const loadsText = trainingLoads
    .filter(
      (load) =>
        load.metadata.calculationType ===
        TrainingLoadCalculationType.TRIMP_BANISTER,
    )
    .map((load) => `${load.value.toFixed(0)}`)
    .join(' / ');

  return (
    <div className="text-left">
      <div className="text-sm font-semibold">{m.training_load()}</div>
      <div className="flex items-center gap-1.5">
        <ActivityIcon className="h-4 w-4 text-muted-foreground" />
        <span>{loadsText}</span>
      </div>
    </div>
  );
}
