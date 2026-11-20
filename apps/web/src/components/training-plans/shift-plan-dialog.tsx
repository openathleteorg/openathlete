import { useShiftAppliedTrainingPlanMutation } from '@/api/training-plan';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { m } from '@/paraglide/messages';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import type { AppliedTrainingPlan } from '@openathlete/shared';

interface P {
  plan: AppliedTrainingPlan | null;
  onClose: () => void;
}

/** Moves an applied plan by whole days, a week by default */
export function ShiftPlanDialog({ plan, onClose }: P) {
  const shiftPlan = useShiftAppliedTrainingPlanMutation();
  const [days, setDays] = useState('7');

  useEffect(() => {
    if (plan) setDays('7');
  }, [plan]);

  const amount = Number.parseInt(days, 10);
  const valid =
    Number.isInteger(amount) && amount !== 0 && Math.abs(amount) <= 366;

  const submit = async () => {
    if (!plan || !valid) return;
    try {
      await shiftPlan.mutateAsync({
        trainingPlanId: plan.trainingPlanId,
        days: amount,
      });
      toast.success(m.training_plans_shifted());
      onClose();
    } catch {
      toast.error(m.training_plans_shift_failed());
    }
  };

  return (
    <Dialog open={plan !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{m.training_plans_shift_title()}</DialogTitle>
          <DialogDescription>{m.training_plans_shift_hint()}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Label htmlFor="shift-days">{m.training_plans_shift_days()}</Label>
          <Input
            id="shift-days"
            type="number"
            inputMode="numeric"
            min={-366}
            max={366}
            value={days}
            onChange={(event) => setDays(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {m.cancel()}
          </Button>
          <Button
            onClick={() => void submit()}
            disabled={!valid}
            isLoading={shiftPlan.isPending}
          >
            {m.training_plans_shift()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
