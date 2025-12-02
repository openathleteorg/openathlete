import {
  useGetActivityFeedbackQuestionsQuery,
  useUnskipFeedbackMutation,
} from '@/api/activity-feedback';
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
  onEditFeedback?: () => void;
  onReopenFeedback?: () => void;
}

export function ActivityQuickEditCard({
  event,
  onEditFeedback,
  onReopenFeedback,
}: P) {
  const { data: feedbackData } = useGetActivityFeedbackQuestionsQuery(
    event.eventId,
  );
  const unskipMutation = useUnskipFeedbackMutation(event.eventId);

  const questions = feedbackData?.questions ?? [];
  const feedbackSkipped = feedbackData?.feedbackSkipped ?? false;
  const allAnswered =
    questions.length > 0 && questions.every((q) => q.answerText !== null);
  const hasQuestions = questions.length > 0;

  const handleReopenFeedback = async () => {
    try {
      await unskipMutation.mutateAsync();
      onReopenFeedback?.();
    } catch (error) {
      console.error('Failed to reopen feedback:', error);
      toast.error(m.failed_to_reopen_feedback());
    }
  };

  const handleEditFeedback = () => {
    onEditFeedback?.();
  };
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
        {hasQuestions && (
          <div className="mb-4 pb-4 border-b">
            {feedbackSkipped ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {m.activity_feedback_skipped()}
                </p>
                <Button
                  onClick={handleReopenFeedback}
                  variant="outline"
                  size="sm"
                  disabled={unskipMutation.isPending}
                >
                  {m.activity_feedback_reopen()}
                </Button>
              </div>
            ) : allAnswered ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {m.activity_feedback_completed_via_questions()}
                </p>
                <Button
                  onClick={handleEditFeedback}
                  variant="outline"
                  size="sm"
                >
                  {m.activity_feedback_edit()}
                </Button>
              </div>
            ) : null}
          </div>
        )}

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
