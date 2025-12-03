import { useAthleteFeatureAccess } from '@/api/subscription';
import { PaywallDialog } from '@/components/paywall';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SparklesIcon } from '@/components/ui/sparkles-icon';
import { m } from '@/paraglide/messages';
import { useState } from 'react';

import {
  ActivityEvent,
  ActivityFeedbackQuestion,
  FeatureName,
} from '@openathlete/shared';

interface P {
  event: ActivityEvent;
}

export function ActivityFeedbackDisplayCard({ event }: P) {
  const questions = event.feedbackQuestions ?? [];
  const answeredQuestions = questions.filter(
    (q: ActivityFeedbackQuestion) =>
      q.answerText !== null && q.answerText !== '',
  );
  const { data: featureAccess } = useAthleteFeatureAccess(
    event.athleteId ?? undefined,
    FeatureName.AI_RPE_QUESTIONS,
  );
  const [paywallOpen, setPaywallOpen] = useState(false);

  // Check if athlete or coach has access and no questions were generated
  const hasNoAccess = featureAccess?.hasAccess === false;
  const hasNoQuestions = questions.length === 0;
  const showPaywallAlert = hasNoAccess && hasNoQuestions;

  return (
    <>
      <Card className="col-span-1 flex flex-col">
        <CardHeader>
          <CardTitle>{m.activity_feedback_completed_via_questions()}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
          {answeredQuestions.map((question: ActivityFeedbackQuestion) => (
            <div
              key={question.activityFeedbackQuestionId}
              className="space-y-2"
            >
              <p className="text-sm font-medium">{question.questionText}</p>
              <p className="text-sm text-muted-foreground">
                {question.answerText}
              </p>
            </div>
          ))}
          {answeredQuestions.length === 0 && !showPaywallAlert && (
            <p className="text-sm text-muted-foreground">
              {m.activity_feedback_no_feedback()}
            </p>
          )}
          {event.description && event.description.trim() !== '' && (
            <div className="space-y-2 pt-4 border-t">
              <p className="text-sm font-medium">{m.comment()}</p>
              <p className="text-sm text-muted-foreground">
                {event.description}
              </p>
            </div>
          )}
          {event.rpe !== null && event.rpe !== undefined && (
            <div className="space-y-2 pt-4 border-t">
              <p className="text-sm font-medium">{m.rpe()}</p>
              <p className="text-sm text-muted-foreground">
                {Math.round(event.rpe * 10)}
              </p>
            </div>
          )}
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
