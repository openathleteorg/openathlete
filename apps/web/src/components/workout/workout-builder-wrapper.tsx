import { useGetEventQuery } from '@/services/event';
import { WorkoutBuilder } from '@/components/workout';

interface WorkoutBuilderWrapperProps {
  trainingId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Wrapper that loads the training event and its workout (if any)
 * and passes it to WorkoutBuilder
 */
export function WorkoutBuilderWrapper({
  trainingId,
  onSuccess,
  onCancel,
}: WorkoutBuilderWrapperProps) {
  const { data: event, isLoading } = useGetEventQuery(trainingId);
  const workout = event?.type === 'TRAINING' ? event.workout : null;

  return (
    <WorkoutBuilder
      trainingId={trainingId}
      workout={workout}
      isLoading={isLoading}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
}
