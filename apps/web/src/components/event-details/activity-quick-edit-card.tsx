import {
  useGetActivityFeedbackQuestionsQuery,
  useUnskipFeedbackMutation,
} from '@/api/activity-feedback';
import { useUpdateEventMutation } from '@/api/event';
import { useAthleteFeatureAccess } from '@/api/subscription';
import { FormProvider, RHFRpe, RHFTextarea } from '@/components/hook-form';
import { PaywallDialog } from '@/components/paywall';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SparklesIcon } from '@/components/ui/sparkles-icon';
import { m } from '@/paraglide/messages';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { ActivityEvent, FeatureName } from '@openathlete/shared';

const quickEditSchema = z.object({
  description: z.string().optional(),
  rpe: z.number().min(0).max(1).optional().nullable(),
});

type QuickEditFormValues = z.infer<typeof quickEditSchema>;

interface P {
  event: ActivityEvent;
  isMyActivity?: boolean;
  onEditFeedback?: () => void;
  onReopenFeedback?: () => void;
}

export function ActivityQuickEditCard({
  event,
  isMyActivity = false,
  onEditFeedback,
  onReopenFeedback,
}: P) {
  const { data: feedbackData } = useGetActivityFeedbackQuestionsQuery(
    event.eventId,
    isMyActivity,
  );
  const unskipMutation = useUnskipFeedbackMutation(event.eventId);
  const { data: featureAccess } = useAthleteFeatureAccess(
    event.athleteId ?? undefined,
    FeatureName.AI_RPE_QUESTIONS,
  );
  const [paywallOpen, setPaywallOpen] = useState(false);

  const questions = feedbackData?.questions ?? [];
  const feedbackSkipped = feedbackData?.feedbackSkipped ?? false;
  const allAnswered =
    questions.length > 0 && questions.every((q) => q.answerText !== null);
  const hasQuestions = questions.length > 0;

  // Check if athlete or coach has access and no questions were generated
  const hasNoAccess = featureAccess?.hasAccess === false;
  const hasNoQuestions = questions.length === 0;
  const showPaywallAlert = hasNoAccess && hasNoQuestions;

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
    <>
      <Card className="col-span-1 flex flex-col">
        <CardHeader>
          <CardTitle>{m.quick_edit()}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {showPaywallAlert && (
            <Alert className="mb-4">
              <SparklesIcon className="h-4 w-4" />
              <AlertTitle>{m.rpe_questions_paywall_title()}</AlertTitle>
              <AlertDescription className="mt-2 flex flex-col gap-3">
                <span>{m.rpe_questions_paywall_description()}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => setPaywallOpen(true)}
                >
                  {m.upgrade_now()}
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {isMyActivity && hasQuestions && (
            <div className="mb-4 pb-4 border-b">
              {feedbackSkipped ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    {m.activity_feedback_skipped()}
                  </p>
                  <Button
                    onClick={handleReopenFeedback}
                    variant="outline"
                    size="sm"
                    disabled={unskipMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {m.activity_feedback_reopen()}
                  </Button>
                </div>
              ) : allAnswered ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    {m.activity_feedback_completed_via_questions()}
                  </p>
                  <Button
                    onClick={handleEditFeedback}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
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
                  {updateEventMutation.isPending
                    ? m.save() + '...'
                    : m.submit()}
                </Button>
              </div>
            </div>
          </FormProvider>
        </CardContent>
      </Card>
      <PaywallDialog
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        reason="ai-feature"
      />
    </>
  );
}
