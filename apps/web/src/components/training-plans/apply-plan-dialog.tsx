import {
  type ApplyTrainingPlanBody,
  useApplyTrainingPlanMutation,
  usePreviewTrainingPlanMutation,
} from '@/api/training-plan';
import { FormProvider, RHFDatePicker } from '@/components/hook-form';
import { RHFSelect } from '@/components/hook-form/rhf-select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SelectItem } from '@/components/ui/select';
import { m } from '@/paraglide/messages';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  PLAN_ANCHOR,
  TRAINING_PLAN_CONFLICT_MODE,
  TrainingPlanApplyPreview,
  TrainingPlanTemplateSummary,
} from '@openathlete/shared';

import { formatDateKey, toDateKey } from './plan-format';
import { usePlanAthletes } from './use-plan-athletes';

const formSchema = z.object({
  athlete: z.string().min(1),
  date: z.string().min(1),
  anchor: z.nativeEnum(PLAN_ANCHOR),
  conflictMode: z.enum([
    TRAINING_PLAN_CONFLICT_MODE.KEEP,
    TRAINING_PLAN_CONFLICT_MODE.REPLACE,
  ]),
});

type FormValues = z.infer<typeof formSchema>;

const toBody = (values: FormValues): ApplyTrainingPlanBody => ({
  targets: [
    {
      athleteId: Number.parseInt(values.athlete, 10),
      date: toDateKey(values.date),
    },
  ],
  anchor: values.anchor,
  conflictMode: values.conflictMode,
});

const names = (items: { name: string }[]) =>
  items.map((item) => item.name).join(', ');

/** What applying would do, before anything changes */
function Preview({ preview }: { preview: TrainingPlanApplyPreview }) {
  const lines = [
    m.training_plans_preview_range({
      start: formatDateKey(preview.startDate),
      end: formatDateKey(preview.endDate),
    }),
    m.training_plans_preview_sessions({ count: preview.sessions }),
    preview.skipped > 0 &&
      m.training_plans_preview_skipped({ count: preview.skipped }),
    preview.conflicts.length > 0 &&
      m.training_plans_preview_conflicts({ count: preview.conflicts.length }),
    preview.races.length > 0 &&
      m.training_plans_preview_races({ names: names(preview.races) }),
    preview.periods.length > 0 &&
      m.training_plans_preview_periods({ names: names(preview.periods) }),
    preview.overlappingPlans.length > 0 &&
      m.training_plans_preview_overlap({
        names: names(preview.overlappingPlans),
      }),
  ].filter((line) => line !== false);

  return (
    <ul
      data-plan-preview
      className="space-y-1 rounded-lg border bg-card p-3 text-sm"
    >
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

interface P {
  plan: TrainingPlanTemplateSummary | null;
  onClose: () => void;
}

/**
 * Puts a library plan on one calendar, from a first day or up to a last
 * one. The preview comes first: applying is offered once it is on screen.
 */
export function ApplyPlanDialog({ plan, onClose }: P) {
  const athletes = usePlanAthletes();
  const previewPlan = usePreviewTrainingPlanMutation();
  const applyPlan = useApplyTrainingPlanMutation();
  const methods = useForm<FormValues>({ resolver: zodResolver(formSchema) });
  const firstAthlete = athletes[0]?.athleteId;
  const { reset: resetPreview } = previewPlan;

  useEffect(() => {
    if (!plan) return;
    methods.reset({
      athlete: firstAthlete ? String(firstAthlete) : '',
      date: '',
      anchor: PLAN_ANCHOR.START,
      conflictMode: TRAINING_PLAN_CONFLICT_MODE.KEEP,
    });
    resetPreview();
  }, [plan, firstAthlete, methods, resetPreview]);

  // A preview answers for the values it was asked with
  useEffect(() => {
    const subscription = methods.watch((_values, { type }) => {
      if (type === 'change') resetPreview();
    });
    return () => subscription.unsubscribe();
  }, [methods, resetPreview]);

  const preview = previewPlan.data?.[0];

  const onSubmit = methods.handleSubmit(async (values) => {
    if (!plan) return;
    const request = {
      templateId: plan.trainingPlanTemplateId,
      body: toBody(values),
    };
    try {
      if (!preview) {
        await previewPlan.mutateAsync(request);
        return;
      }
      const response = await applyPlan.mutateAsync(request);
      const sessions =
        response.status === 'done'
          ? response.results.reduce((sum, result) => sum + result.sessions, 0)
          : preview.sessions;
      toast.success(m.training_plans_applied_success({ count: sessions }));
      onClose();
    } catch {
      toast.error(m.training_plans_failed());
    }
  });

  return (
    <Dialog open={plan !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {m.training_plans_apply_title({ name: plan?.name ?? '' })}
          </DialogTitle>
          <DialogDescription>
            {m.training_plans_weeks_count({ count: plan?.weeks ?? 0 })} ·{' '}
            {m.training_plans_sessions_count({ count: plan?.sessions ?? 0 })}
          </DialogDescription>
        </DialogHeader>
        {athletes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {m.training_plans_no_athlete()}
          </p>
        ) : (
          <FormProvider methods={methods} onSubmit={onSubmit}>
            <div className="space-y-4">
              {athletes.length > 1 && (
                <RHFSelect name="athlete" label={m.athlete()}>
                  {athletes.map((athlete) => (
                    <SelectItem
                      key={athlete.athleteId}
                      value={String(athlete.athleteId)}
                    >
                      {athlete.name}
                    </SelectItem>
                  ))}
                </RHFSelect>
              )}
              <RHFDatePicker
                name="date"
                label={m.training_plans_apply_date()}
                required
              />
              <RHFSelect name="anchor" label={m.training_plans_anchor()}>
                <SelectItem value={PLAN_ANCHOR.START}>
                  {m.training_plans_anchor_start()}
                </SelectItem>
                <SelectItem value={PLAN_ANCHOR.END}>
                  {m.training_plans_anchor_end()}
                </SelectItem>
              </RHFSelect>
              <RHFSelect
                name="conflictMode"
                label={m.training_plans_conflicts()}
              >
                <SelectItem value={TRAINING_PLAN_CONFLICT_MODE.KEEP}>
                  {m.training_plans_conflicts_keep()}
                </SelectItem>
                <SelectItem value={TRAINING_PLAN_CONFLICT_MODE.REPLACE}>
                  {m.training_plans_conflicts_replace()}
                </SelectItem>
              </RHFSelect>
              {preview && <Preview preview={preview} />}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  {m.cancel()}
                </Button>
                <Button
                  type="submit"
                  isLoading={previewPlan.isPending || applyPlan.isPending}
                >
                  {preview
                    ? m.training_plans_apply()
                    : m.training_plans_preview()}
                </Button>
              </div>
            </div>
          </FormProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}
