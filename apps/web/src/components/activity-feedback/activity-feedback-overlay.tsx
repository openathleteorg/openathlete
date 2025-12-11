import {
  useGetActivityFeedbackQuestionsQuery,
  useSkipFeedbackMutation,
} from '@/api/activity-feedback';
import { useGetMyAthleteQuery } from '@/api/athlete';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { m } from '@/paraglide/messages';
import { useEffect, useMemo, useState } from 'react';

import { ActivityEvent } from '@openathlete/shared';

import { ActivityFeedbackFlow } from './activity-feedback-flow';

interface P {
  event: ActivityEvent;
  onSkip: () => void;
  isEditMode?: boolean; // If true, skip intro screen and show flow directly
  skipIntroScreen?: boolean; // If true, skip the "ready" intro screen and go directly to flow
}

export function ActivityFeedbackOverlay({
  event,
  onSkip,
  isEditMode = false,
  skipIntroScreen = false,
}: P) {
  const { data: athlete } = useGetMyAthleteQuery();
  const isMyActivity = athlete?.athleteId === event.athleteId;
  const { data: feedbackData, isLoading } =
    useGetActivityFeedbackQuestionsQuery(event.eventId, isMyActivity);
  const skipMutation = useSkipFeedbackMutation(event.eventId);
  const [showFlow, setShowFlow] = useState(isEditMode || skipIntroScreen);

  const questions = useMemo(
    () => feedbackData?.questions ?? [],
    [feedbackData],
  );
  const feedbackSkipped = feedbackData?.feedbackSkipped ?? false;

  useEffect(() => {
    if (!isLoading && !isEditMode && !skipIntroScreen) {
      if (!questions || questions.length === 0) {
        onSkip();
        return;
      }
      if (feedbackSkipped) {
        onSkip();
        return;
      }
      const allAnswered = questions.every((q) => q.answerText !== null);
      if (allAnswered) {
        onSkip();
      }
    }
  }, [
    questions,
    feedbackSkipped,
    isLoading,
    onSkip,
    isEditMode,
    skipIntroScreen,
  ]);

  const handleSkip = async () => {
    try {
      await skipMutation.mutateAsync();
      onSkip();
    } catch (error) {
      console.error('Failed to skip feedback:', error);
      // Still call onSkip to hide overlay
      onSkip();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-140px)] inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader size="lg" />
          <p className="text-sm text-muted-foreground">
            {m.loading_feedback_questions()}
          </p>
        </div>
      </div>
    );
  }

  if (isEditMode) {
    if (questions.length > 0) {
      return (
        <ActivityFeedbackFlow
          eventId={event.eventId}
          questions={questions}
          onComplete={onSkip}
          isEditMode={true}
        />
      );
    }
    return (
      <div className="min-h-[calc(100vh-140px)] inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader size="lg" />
          <p className="text-sm text-muted-foreground">
            {m.loading_feedback_questions()}
          </p>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0 || feedbackSkipped) {
    return null;
  }

  const allAnswered = questions.every((q) => q.answerText !== null);
  if (allAnswered) {
    return null;
  }

  if (!showFlow) {
    return (
      <div className="min-h-[calc(100vh-140px)] inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center gap-6 p-8 text-center max-w-md">
          <h2 className="text-2xl font-semibold">
            {m.activity_feedback_ready()}
          </h2>
          <div className="flex flex-col gap-3 w-full">
            <Button onClick={() => setShowFlow(true)} size="lg">
              {m.activity_feedback_start()}
            </Button>
            <Button
              onClick={handleSkip}
              variant="outline"
              size="lg"
              disabled={skipMutation.isPending}
            >
              {skipMutation.isPending
                ? m.activity_feedback_skipping()
                : m.activity_feedback_skip()}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ActivityFeedbackFlow
      eventId={event.eventId}
      questions={questions}
      onComplete={onSkip}
    />
  );
}
