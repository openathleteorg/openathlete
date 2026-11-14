import { useUpdateTrainingPlanTemplateMutation } from '@/api/training-plan';
import { FormProvider } from '@/components/hook-form';
import { RHFSelect } from '@/components/hook-form/rhf-select';
import { RHFTextField } from '@/components/hook-form/rhf-text-field';
import { RHFTextarea } from '@/components/hook-form/rhf-textarea';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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

import { PLAN_LEVEL, TrainingPlanTemplateSummary } from '@openathlete/shared';

import { NO_LEVEL, planLevelLabel } from './plan-level';

const formSchema = z.object({
  name: z.string().trim().min(1).max(120),
  goal: z.string().max(200),
  description: z.string().max(5000),
  level: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface P {
  plan: TrainingPlanTemplateSummary | null;
  onClose: () => void;
}

/** Name, goal, description and level of a library plan */
export function EditPlanDialog({ plan, onClose }: P) {
  const updatePlan = useUpdateTrainingPlanTemplateMutation();
  const methods = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  useEffect(() => {
    if (!plan) return;
    methods.reset({
      name: plan.name,
      goal: plan.goal,
      description: plan.description,
      level: plan.level ?? NO_LEVEL,
    });
  }, [plan, methods]);

  const onSubmit = methods.handleSubmit(async (values) => {
    if (!plan) return;
    try {
      await updatePlan.mutateAsync({
        templateId: plan.trainingPlanTemplateId,
        body: {
          name: values.name,
          goal: values.goal,
          description: values.description,
          level:
            values.level === NO_LEVEL ? null : (values.level as PLAN_LEVEL),
        },
      });
      toast.success(m.training_plans_saved());
      onClose();
    } catch {
      toast.error(m.training_plans_failed());
    }
  });

  return (
    <Dialog open={plan !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{m.training_plans_edit_title()}</DialogTitle>
        </DialogHeader>
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <div className="space-y-4">
            <RHFTextField
              name="name"
              label={m.name()}
              maxLength={120}
              required
            />
            <RHFTextField
              name="goal"
              label={m.training_plans_goal()}
              maxLength={200}
            />
            <RHFTextarea
              name="description"
              label={m.description()}
              maxLength={5000}
            />
            <RHFSelect name="level" label={m.training_plans_level()}>
              <SelectItem value={NO_LEVEL}>
                {m.training_plans_level_none()}
              </SelectItem>
              {Object.values(PLAN_LEVEL).map((level) => (
                <SelectItem key={level} value={level}>
                  {planLevelLabel(level)}
                </SelectItem>
              ))}
            </RHFSelect>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {m.cancel()}
              </Button>
              <Button type="submit" isLoading={updatePlan.isPending}>
                {m.save()}
              </Button>
            </div>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
