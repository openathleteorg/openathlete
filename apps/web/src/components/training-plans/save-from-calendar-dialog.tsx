import { useCreateTrainingPlanFromCalendarMutation } from '@/api/training-plan';
import { FormProvider, RHFDatePicker } from '@/components/hook-form';
import { RHFSelect } from '@/components/hook-form/rhf-select';
import { RHFTextField } from '@/components/hook-form/rhf-text-field';
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

import { toDateKey } from './plan-format';
import { usePlanAthletes } from './use-plan-athletes';

const formSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    goal: z.string().max(200),
    athlete: z.string().min(1),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
  })
  .refine(
    (values) => toDateKey(values.startDate) <= toDateKey(values.endDate),
    {
      path: ['endDate'],
    },
  );

type FormValues = z.infer<typeof formSchema>;

interface P {
  open: boolean;
  onClose: () => void;
}

/** Turns a stretch of a calendar into a plan of the library */
export function SaveFromCalendarDialog({ open, onClose }: P) {
  const athletes = usePlanAthletes();
  const createPlan = useCreateTrainingPlanFromCalendarMutation();
  const methods = useForm<FormValues>({ resolver: zodResolver(formSchema) });
  const firstAthlete = athletes[0]?.athleteId;

  useEffect(() => {
    if (!open) return;
    methods.reset({
      name: '',
      goal: '',
      athlete: firstAthlete ? String(firstAthlete) : '',
      startDate: '',
      endDate: '',
    });
  }, [open, firstAthlete, methods]);

  const onSubmit = methods.handleSubmit(async (values) => {
    try {
      const plan = await createPlan.mutateAsync({
        name: values.name,
        goal: values.goal,
        description: '',
        athleteId: Number.parseInt(values.athlete, 10),
        startDate: toDateKey(values.startDate),
        endDate: toDateKey(values.endDate),
      });
      toast.success(m.training_plans_from_calendar_saved({ name: plan.name }));
      onClose();
    } catch {
      toast.error(m.training_plans_failed());
    }
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{m.training_plans_from_calendar_title()}</DialogTitle>
          <DialogDescription>
            {m.training_plans_from_calendar_hint()}
          </DialogDescription>
        </DialogHeader>
        {athletes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {m.training_plans_no_athlete()}
          </p>
        ) : (
          <FormProvider methods={methods} onSubmit={onSubmit}>
            <div className="space-y-4">
              <RHFTextField
                name="name"
                label={m.name()}
                maxLength={120}
                required
                autoFocus
              />
              <RHFTextField
                name="goal"
                label={m.training_plans_goal()}
                maxLength={200}
              />
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
              <div className="grid gap-4 sm:grid-cols-2">
                <RHFDatePicker
                  name="startDate"
                  label={m.start_date()}
                  required
                />
                <RHFDatePicker name="endDate" label={m.end_date()} required />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  {m.cancel()}
                </Button>
                <Button type="submit" isLoading={createPlan.isPending}>
                  {m.save()}
                </Button>
              </div>
            </div>
          </FormProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}
