import { useUpdateEventMutation } from '@/api/event';
import { FormProvider, RHFRpe, RHFTextarea } from '@/components/hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { m } from '@/paraglide/messages';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { ActivityEvent } from '@openathlete/shared';

const quickEditSchema = z.object({
  description: z.string().optional(),
  rpe: z.number().min(0).max(1).optional().nullable(),
});

type QuickEditFormValues = z.infer<typeof quickEditSchema>;

interface P {
  event: ActivityEvent;
}

export function ActivityQuickEditCard({ event }: P) {
  const updateEventMutation = useUpdateEventMutation({
    onSuccess: () => {
      toast.success(m.activity_updated_successfully());
    },
    onError: () => {
      toast.error(m.failed_to_update_activity());
    },
  });

  const methods = useForm<QuickEditFormValues>({
    resolver: zodResolver(quickEditSchema),
    defaultValues: {
      description: event.description ?? '',
      rpe: event.rpe ?? undefined,
    },
  });

  const onSubmit = (values: QuickEditFormValues) => {
    updateEventMutation.mutate({
      eventId: event.eventId,
      body: {
        type: event.type,
        description: values.description,
        rpe: values.rpe,
      },
    });
  };

  return (
    <Card className="col-span-1 flex flex-col">
      <CardHeader>
        <CardTitle>{m.quick_edit()}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <FormProvider
          methods={methods}
          onSubmit={methods.handleSubmit(onSubmit)}
          className="flex-1 flex flex-col"
        >
          <div className="space-y-4 flex-1 flex flex-col">
            <RHFTextarea
              name="description"
              label={m.comment()}
              placeholder={m.description()}
              rows={3}
              className="min-h-[70px]"
            />
            <RHFRpe name="rpe" label={m.rpe()} />
            <div className="flex justify-end mt-auto">
              <Button type="submit" disabled={updateEventMutation.isPending}>
                {updateEventMutation.isPending ? m.save() + '...' : m.submit()}
              </Button>
            </div>
          </div>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
