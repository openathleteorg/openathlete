import { m } from '@/paraglide/messages';
import {
  useCreateCycleMutation,
  useUpdateCycleMutation,
} from '@/services/cycle';
import { cn } from '@/utils/shadcn';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Cycle } from '@openathlete/shared';

import {
  CYCLE_COLORS,
  DEFAULT_CYCLE_COLOR,
} from '../calendar/constants/cycle-colors';
import { useCalendarContext } from '../calendar/hooks/use-calendar-context';
import { FormProvider, RHFTextField } from '../hook-form';
import { RHFTextarea } from '../hook-form/rhf-textarea';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

// Form schema with string dates for date inputs
const cycleFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  color: z.string().optional(),
});

type CycleFormValues = z.infer<typeof cycleFormSchema>;

type P =
  | {
      open: boolean;
      onClose: () => void;
      startDate?: Date;
      endDate?: Date;
    }
  | {
      open: boolean;
      onClose: () => void;
      cycle?: Cycle;
    };

export function CreateCycleDialog({ open, onClose, ...rest }: P) {
  const { athleteId } = useCalendarContext();
  const edit = 'cycle' in rest;
  const create = 'startDate' in rest && 'endDate' in rest;

  const initialStartDate = useMemo(() => {
    if (create && rest.startDate) {
      const d = new Date(rest.startDate);
      d.setHours(0, 0, 0, 0);
      return d;
    } else if (edit && rest.cycle) {
      return new Date(rest.cycle.startDate);
    }
    return new Date();
  }, [rest]);

  const initialEndDate = useMemo(() => {
    if (create && rest.endDate) {
      const d = new Date(rest.endDate);
      d.setHours(23, 59, 59, 999);
      return d;
    } else if (edit && rest.cycle) {
      return new Date(rest.cycle.endDate);
    }
    return new Date();
  }, [rest]);

  // Convert Date to string format for date inputs (YYYY-MM-DD)
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const createCycleMutation = useCreateCycleMutation({
    onSuccess: () => {
      onClose();
      toast.success(m.cycle_created_successfully());
    },
    onError: () => {
      toast.error(m.failed_to_create_cycle());
    },
  });

  const updateCycleMutation = useUpdateCycleMutation({
    onSuccess: () => {
      onClose();
      toast.success(m.cycle_updated_successfully());
    },
    onError: () => {
      toast.error(m.failed_to_update_cycle());
    },
  });

  const methods = useForm<CycleFormValues>({
    resolver: zodResolver(cycleFormSchema, undefined),
    defaultValues:
      edit && rest.cycle
        ? {
            name: rest.cycle.name,
            description: rest.cycle.description || '',
            startDate: formatDateForInput(initialStartDate),
            endDate: formatDateForInput(initialEndDate),
            color: rest.cycle.color || '#3b82f6',
          }
        : {
            name: '',
            description: '',
            startDate: formatDateForInput(initialStartDate),
            endDate: formatDateForInput(initialEndDate),
            color: DEFAULT_CYCLE_COLOR,
          },
  });

  const { handleSubmit, register, watch } = methods;

  const onSubmit = handleSubmit(async (data) => {
    // Convert string dates back to Date objects for submission
    const submitData = {
      name: data.name,
      description: data.description || '',
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      color: data.color,
    };

    if (create) {
      createCycleMutation.mutate({ ...submitData, athleteId });
    }
    if (edit && rest.cycle) {
      updateCycleMutation.mutate({
        cycleId: rest.cycle.cycleId,
        body: submitData,
      });
    }
  });

  const colorValue = watch('color');

  if ((create && (!rest.startDate || !rest.endDate)) || (edit && !rest.cycle)) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{edit ? m.edit_cycle() : m.create_cycle()}</DialogTitle>
        </DialogHeader>
        <FormProvider
          methods={methods}
          onSubmit={onSubmit}
          className="flex flex-col gap-4 pt-3"
        >
          <RHFTextField
            name="name"
            type="text"
            placeholder={m.cycle_name_placeholder()}
            label={m.cycle_name()}
            required
          />

          <RHFTextarea
            name="description"
            placeholder={m.cycle_description_placeholder()}
            label={m.description()}
            className="min-h-[80px]"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startDate">{m.start_date()}</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="endDate">{m.end_date()}</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="color">{m.color()}</Label>
            <div className="grid grid-cols-10 gap-2">
              {CYCLE_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => methods.setValue('color', color.value)}
                  className={cn(
                    'h-10 rounded-md border-2 transition-all hover:scale-105',
                    colorValue === color.value
                      ? 'border-gray-900 ring-gray-900 border-3'
                      : 'border-gray-200',
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {m.cancel()}
            </Button>
            <Button type="submit">{edit ? m.save() : m.create()}</Button>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
