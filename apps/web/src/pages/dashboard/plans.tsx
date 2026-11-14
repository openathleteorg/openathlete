import { m } from '@/paraglide/messages';
import { TrainingPlansView } from '@/views/dashboard/training-plans-view';

export function TrainingPlansPage() {
  return (
    <>
      <title>{m.training_plans()}</title>
      <TrainingPlansView />
    </>
  );
}
