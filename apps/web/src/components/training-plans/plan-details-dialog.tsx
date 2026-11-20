import { useTrainingPlanTemplateQuery } from '@/api/training-plan';
import { SportIcon } from '@/components/sport-icon/sport-icon';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SectionLabel } from '@/components/ui/section-label';
import { Skeleton } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';

import type { TrainingPlanTemplateSummary } from '@openathlete/shared';

import { sessionsInOrder, weekdayName, weeksOf } from './plan-format';

interface P {
  plan: TrainingPlanTemplateSummary | null;
  onClose: () => void;
}

/** A library plan week by week: what each day holds */
export function PlanDetailsDialog({ plan, onClose }: P) {
  const { data: detail, isPending } = useTrainingPlanTemplateQuery(
    plan?.trainingPlanTemplateId ?? null,
  );

  return (
    <Dialog open={plan !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent mobileFullscreen className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{plan?.name}</DialogTitle>
          {plan?.goal && <DialogDescription>{plan.goal}</DialogDescription>}
        </DialogHeader>
        {plan?.description && (
          <p className="text-sm whitespace-pre-line text-muted-foreground">
            {plan.description}
          </p>
        )}
        {isPending || !detail ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : (
          <ol className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            {weeksOf(detail.content).map(({ number, cycleName, week }) => (
              <li key={number} className="space-y-2" data-plan-week={number}>
                <SectionLabel>
                  {m.training_plans_week({ number })} · {cycleName}
                  {week.theme ? ` · ${week.theme}` : ''}
                </SectionLabel>
                {week.sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {m.training_plans_no_sessions()}
                  </p>
                ) : (
                  <ul className="divide-y rounded-lg border bg-card">
                    {sessionsInOrder(week).map((session, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 px-3 py-2 text-sm"
                      >
                        <span className="w-9 shrink-0 text-muted-foreground">
                          {weekdayName(session.dayOfWeek)}
                        </span>
                        {session.kind !== 'NOTE' && (
                          <SportIcon sport={session.sport} />
                        )}
                        <span className="min-w-0 flex-1 break-words">
                          {session.name}
                        </span>
                        {session.kind === 'NOTE' && (
                          <Badge variant="secondary">
                            {m.training_plans_note_badge()}
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}
