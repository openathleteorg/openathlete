import { cycleKeys } from '@/api/cycle/cycle.keys';
import { eventKeys } from '@/api/event/event.keys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { TrainingPlanAPI } from './training-plan.api';
import { trainingPlanKeys } from './training-plan.keys';

export const useTrainingPlanTemplatesQuery = () =>
  useQuery({
    queryKey: trainingPlanKeys.templates,
    queryFn: TrainingPlanAPI.listTemplates,
  });

export const useTrainingPlanTemplateQuery = (templateId: number | null) =>
  useQuery({
    queryKey: trainingPlanKeys.template(templateId ?? 0),
    queryFn: () => TrainingPlanAPI.getTemplate(templateId as number),
    enabled: templateId !== null,
  });

export const useAppliedTrainingPlansQuery = (includeArchived: boolean) =>
  useQuery({
    queryKey: trainingPlanKeys.applied(includeArchived),
    queryFn: () => TrainingPlanAPI.listApplied(includeArchived),
  });

const useInvalidatePlans = () => {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: [trainingPlanKeys.root] });
};

/** A plan put on, moved on or taken off a calendar changes its sessions */
const useInvalidateCalendars = () => {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [trainingPlanKeys.root] }),
      queryClient.invalidateQueries({ queryKey: [eventKeys.getMyEvents] }),
      queryClient.invalidateQueries({ queryKey: [cycleKeys.getMyCycles] }),
    ]);
};

export const useUpdateTrainingPlanTemplateMutation = () => {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: TrainingPlanAPI.updateTemplate,
    onSuccess: invalidate,
  });
};

export const useDeleteTrainingPlanTemplateMutation = () => {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: TrainingPlanAPI.deleteTemplate,
    onSuccess: invalidate,
  });
};

export const useCreateTrainingPlanFromCalendarMutation = () => {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: TrainingPlanAPI.createFromCalendar,
    onSuccess: invalidate,
  });
};

export const useImportTrainingPlanMutation = () => {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: TrainingPlanAPI.importTemplate,
    onSuccess: invalidate,
  });
};

export const usePreviewTrainingPlanMutation = () =>
  useMutation({ mutationFn: TrainingPlanAPI.previewApply });

export const useApplyTrainingPlanMutation = () => {
  const invalidate = useInvalidateCalendars();
  return useMutation({
    mutationFn: TrainingPlanAPI.apply,
    onSuccess: invalidate,
  });
};

export const useShiftAppliedTrainingPlanMutation = () => {
  const invalidate = useInvalidateCalendars();
  return useMutation({
    mutationFn: TrainingPlanAPI.shiftApplied,
    onSuccess: invalidate,
  });
};

export const useRemoveAppliedTrainingPlanMutation = () => {
  const invalidate = useInvalidateCalendars();
  return useMutation({
    mutationFn: TrainingPlanAPI.removeApplied,
    onSuccess: invalidate,
  });
};
