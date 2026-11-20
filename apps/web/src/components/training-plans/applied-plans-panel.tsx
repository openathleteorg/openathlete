import {
  useAppliedTrainingPlansQuery,
  useRemoveAppliedTrainingPlanMutation,
} from '@/api/training-plan';
import { ConfirmAction } from '@/components/confirm-action/confirm-action';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { m } from '@/paraglide/messages';
import { CalendarClock, MoreHorizontal, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { AppliedTrainingPlan } from '@openathlete/shared';

import { formatDateKey } from './plan-format';
import { ShiftPlanDialog } from './shift-plan-dialog';
import { usePlanAthletes } from './use-plan-athletes';

/** A plan still running: the only ones that can move or go */
const isRunning = (plan: AppliedTrainingPlan) =>
  plan.status === 'ACTIVE' || plan.status === 'DRAFT';

/**
 * The plans on a calendar: how far each is, and the two things done to a
 * running plan as a whole, moving it and taking it off.
 */
export function AppliedPlansPanel() {
  const [includeArchived, setIncludeArchived] = useState(false);
  const { data: plans = [], isPending } =
    useAppliedTrainingPlansQuery(includeArchived);
  const athletes = usePlanAthletes();
  const removePlan = useRemoveAppliedTrainingPlanMutation();
  const [shifting, setShifting] = useState<AppliedTrainingPlan | null>(null);
  const [removing, setRemoving] = useState<AppliedTrainingPlan | null>(null);

  const athleteNames = useMemo(
    () => new Map(athletes.map((athlete) => [athlete.athleteId, athlete.name])),
    [athletes],
  );

  const confirmRemove = async () => {
    if (!removing) return;
    try {
      const result = await removePlan.mutateAsync(removing.trainingPlanId);
      toast.success(
        m.training_plans_removed({
          removed: result.removed,
          kept: result.kept,
        }),
      );
    } catch {
      toast.error(m.training_plans_failed());
    }
    setRemoving(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {m.training_plans_applied_hint()}
      </p>
      <div className="flex items-center gap-2">
        <Switch
          id="plans-archived"
          checked={includeArchived}
          onCheckedChange={setIncludeArchived}
        />
        <Label htmlFor="plans-archived">
          {m.training_plans_show_archived()}
        </Label>
      </div>

      {isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {m.training_plans_applied_empty()}
        </p>
      ) : (
        <ul className="space-y-3">
          {plans.map((plan) => (
            <li
              key={plan.trainingPlanId}
              data-applied-plan={plan.trainingPlanId}
              className="flex items-start gap-2 rounded-lg border bg-card p-4"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="font-medium break-words">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {m.training_plans_applied_range({
                    start: formatDateKey(plan.startDate),
                    end: formatDateKey(plan.endDate),
                  })}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {athletes.length > 1 && athleteNames.get(plan.athleteId) && (
                    <Badge variant="secondary">
                      {athleteNames.get(plan.athleteId)}
                    </Badge>
                  )}
                  {plan.status === 'COMPLETED' && (
                    <Badge variant="outline">
                      {m.training_plans_status_completed()}
                    </Badge>
                  )}
                  {plan.status === 'ARCHIVED' && (
                    <Badge variant="outline">
                      {m.training_plans_status_archived()}
                    </Badge>
                  )}
                  {plan.currentWeek !== null && (
                    <span>
                      {m.training_plans_applied_week({
                        week: plan.currentWeek,
                        weeks: plan.weeks,
                      })}
                    </span>
                  )}
                  <span>
                    {m.training_plans_applied_done({
                      done: plan.done,
                      sessions: plan.sessions,
                    })}
                  </span>
                  {plan.modified > 0 && (
                    <span>
                      {m.training_plans_applied_modified({
                        count: plan.modified,
                      })}
                    </span>
                  )}
                </div>
              </div>
              {isRunning(plan) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-11 shrink-0 md:size-9"
                      aria-label={m.ui_more()}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShifting(plan)}>
                      <CalendarClock className="size-4" />
                      {m.training_plans_shift()}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setRemoving(plan)}
                    >
                      <Trash2 className="size-4" />
                      {m.training_plans_remove()}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </li>
          ))}
        </ul>
      )}

      <ShiftPlanDialog plan={shifting} onClose={() => setShifting(null)} />
      <ConfirmAction
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() => void confirmRemove()}
        title={m.training_plans_remove_title()}
        message={m.training_plans_remove_message()}
        confirmText={m.training_plans_remove()}
        isLoading={removePlan.isPending}
      />
    </div>
  );
}
