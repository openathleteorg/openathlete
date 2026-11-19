import { eventKeys } from '@/api/event/event.keys';
import { metricKeys } from '@/api/metric/metric.keys';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { QuestionnaireAPI, type ResponsesQuery } from './questionnaire.api';
import { questionnaireKeys } from './questionnaire.keys';

/**
 * Coaches send questionnaires and athletes answer them from other devices:
 * these reads never trust a cached copy when a screen opens.
 */
const FRESH = { staleTime: 0, refetchOnMount: 'always' } as const;

export const useQuestionnairesQuery = ({
  archived = false,
  enabled = true,
} = {}) =>
  useQuery({
    queryKey: questionnaireKeys.list(archived),
    queryFn: () => QuestionnaireAPI.list(archived),
    enabled,
    // Its counts move as athletes answer
    ...FRESH,
  });

export const useQuestionnaireQuery = (questionnaireId?: number) =>
  useQuery({
    queryKey: questionnaireKeys.detail(questionnaireId ?? 0),
    queryFn: () => QuestionnaireAPI.get(questionnaireId!),
    enabled: questionnaireId !== undefined,
  });

/** What waits for the athlete's answer, for the Today page */
export const usePendingQuestionnairesQuery = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: questionnaireKeys.pending,
    queryFn: QuestionnaireAPI.pending,
    enabled,
    ...FRESH,
  });

export const useQuestionnaireOfEventQuery = (eventId?: number) =>
  useQuery({
    queryKey: questionnaireKeys.ofEvent(eventId ?? 0),
    queryFn: () => QuestionnaireAPI.ofEvent(eventId!),
    enabled: eventId !== undefined,
    ...FRESH,
  });

export const useQuestionnaireResponsesQuery = (
  query: ResponsesQuery,
  { enabled = true } = {},
) =>
  useQuery({
    queryKey: questionnaireKeys.responses(query),
    queryFn: () => QuestionnaireAPI.responses(query),
    enabled,
    ...FRESH,
    // Moving the span keeps the charts on screen until the next one loads
    placeholderData: keepPreviousData,
  });

/** The library, the questionnaires of events and their answers */
const useInvalidateQuestionnaires = () => {
  const queryClient = useQueryClient();
  // Screens not open now refetch too: the app does not refetch on mount
  return () =>
    queryClient.invalidateQueries({
      queryKey: [questionnaireKeys.root],
      refetchType: 'all',
    });
};

export const useCreateQuestionnaireMutation = () => {
  const invalidate = useInvalidateQuestionnaires();
  return useMutation({
    mutationFn: QuestionnaireAPI.create,
    onSuccess: invalidate,
  });
};

export const useUpdateQuestionnaireMutation = () => {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateQuestionnaires();
  return useMutation({
    mutationFn: QuestionnaireAPI.update,
    onSuccess: () => {
      invalidate();
      // Coming occurrences take the new title
      queryClient.invalidateQueries({ queryKey: [eventKeys.getMyEvents] });
    },
  });
};

/** Archiving and deleting both take occurrences out of the calendars */
const useLibraryChange = <T, V>(mutationFn: (variables: V) => Promise<T>) => {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateQuestionnaires();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: [eventKeys.getMyEvents] });
    },
  });
};

export const useArchiveQuestionnaireMutation = () =>
  useLibraryChange(QuestionnaireAPI.archive);
export const useRestoreQuestionnaireMutation = () =>
  useLibraryChange(QuestionnaireAPI.restore);
export const useDeleteQuestionnaireMutation = () =>
  useLibraryChange(QuestionnaireAPI.remove);

export const useSubmitQuestionnaireAnswersMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: QuestionnaireAPI.submit,
    onSuccess: (form) => {
      queryClient.setQueryData(
        questionnaireKeys.ofEvent(form.occurrence.eventId),
        form,
      );
      queryClient.invalidateQueries({ queryKey: questionnaireKeys.pending });
      queryClient.invalidateQueries({
        queryKey: ['QuestionnaireAPI', 'responses'],
      });
      // Numbers that fill a metric show in the metrics
      for (const key of [
        metricKeys.getMetrics,
        metricKeys.getLatestMetrics,
        metricKeys.getMetricHistory,
      ]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
      // The calendar card shows it answered
      queryClient.invalidateQueries({ queryKey: [eventKeys.getMyEvents] });
      queryClient.invalidateQueries({
        queryKey: [eventKeys.getEvent, form.occurrence.eventId],
      });
    },
  });
};
