import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Event } from '@openathlete/shared';

import { ActivityFeedbackAPI } from './activity-feedback.api';
import { activityFeedbackKeys } from './activity-feedback.keys';

export function useGetActivityFeedbackQuestionsQuery(
  eventId: Event['eventId'],
) {
  return useQuery({
    queryKey: activityFeedbackKeys.getFeedbackQuestions(eventId),
    queryFn: () => ActivityFeedbackAPI.getFeedbackQuestions(eventId),
    enabled: !!eventId,
  });
}

export function useSubmitQuestionAnswerMutation(eventId: Event['eventId']) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      questionId,
      answerText,
    }: {
      questionId: number;
      answerText: string;
    }) => ActivityFeedbackAPI.submitAnswer(eventId, questionId, answerText),
    onSuccess: () => {
      // Invalidate questions query to refresh answers
      queryClient.invalidateQueries({
        queryKey: activityFeedbackKeys.getFeedbackQuestions(eventId),
      });
    },
  });
}

export function useSkipFeedbackMutation(eventId: Event['eventId']) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => ActivityFeedbackAPI.skipFeedback(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: activityFeedbackKeys.getFeedbackQuestions(eventId),
      });
    },
  });
}

export function useUnskipFeedbackMutation(eventId: Event['eventId']) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => ActivityFeedbackAPI.unskipFeedback(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: activityFeedbackKeys.getFeedbackQuestions(eventId),
      });
    },
  });
}
