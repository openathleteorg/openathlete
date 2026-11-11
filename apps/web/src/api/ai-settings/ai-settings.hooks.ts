import { AnalyticsEvent } from '@/utils/analytics-events';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import posthog from 'posthog-js';

import {
  AiAccessDto,
  AiFeatureTask,
  AiTask,
  CreateAiCredentialDto,
  UpdateAiCustomInstructionsDto,
  UpdateAiModelPreferencesDto,
} from '@openathlete/shared';

import { AiSettingsAPI } from './ai-settings.api';
import { aiSettingsKeys } from './ai-settings.keys';

export function useAiProvidersQuery() {
  return useQuery({
    queryKey: aiSettingsKeys.providers(),
    queryFn: AiSettingsAPI.getProviders,
    // The model registry only changes with API deployments
    staleTime: 60 * 60 * 1000,
  });
}

export function useAiCredentialsQuery() {
  return useQuery({
    queryKey: aiSettingsKeys.credentials(),
    queryFn: AiSettingsAPI.getCredentials,
  });
}

export function useAiModelPreferencesQuery() {
  return useQuery({
    queryKey: aiSettingsKeys.models(),
    queryFn: AiSettingsAPI.getModelPreferences,
  });
}

export function useAiCustomInstructionsQuery() {
  return useQuery({
    queryKey: aiSettingsKeys.instructions(),
    queryFn: AiSettingsAPI.getCustomInstructions,
  });
}

/** Instructions change nothing else: no need to refetch access or models */
export function useUpdateAiCustomInstructionsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateAiCustomInstructionsDto) =>
      AiSettingsAPI.updateCustomInstructions(body),
    onSuccess: (instructions, body) => {
      // Which features people tune, never what they write
      posthog.capture(AnalyticsEvent.ai_custom_instructions_saved, {
        tasks: body.instructions
          .filter((item) => item.instructions.trim())
          .map((item) => item.task),
      });
      queryClient.setQueryData(aiSettingsKeys.instructions(), instructions);
    },
  });
}

/**
 * Which AI features can run for the user, and on which model. With an
 * athlete, background features consider the athlete and their coaches.
 */
export function useAiAccessQuery(athleteId?: number) {
  return useQuery({
    queryKey: aiSettingsKeys.access(athleteId),
    queryFn: () => AiSettingsAPI.getAccess(athleteId),
  });
}

/**
 * Whether the user can run an AI feature they trigger themselves: a model is
 * set up and they allowed their data to be sent to it. Otherwise the feature
 * opens AiSetupDialog, which asks for whichever is missing.
 */
export function useAiTaskAvailable(task: Exclude<AiTask, AiTask.DEFAULT>): {
  available: boolean;
  isLoading: boolean;
} {
  const { data, isLoading } = useAiAccessQuery();
  return {
    available: Boolean(data?.tasks[task].available && data.dataSharingConsent),
    isLoading,
  };
}

/**
 * Whether a background feature runs on an athlete's activities (access
 * fetched with their athleteId): a model is set up for them or a coach, and
 * the athlete allowed their data to be sent to it. Undefined while loading.
 */
export function athleteAiTaskUsable(
  access: AiAccessDto | undefined,
  task: AiFeatureTask,
): boolean | undefined {
  if (!access) return undefined;
  return (
    access.tasks[task].available && access.athleteDataSharingConsent !== false
  );
}

/** Keys, model choices and access all change together. */
function useInvalidateAiSettings() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: aiSettingsKeys.all });
}

export function useCreateAiCredentialMutation() {
  const invalidate = useInvalidateAiSettings();
  return useMutation({
    mutationFn: (body: CreateAiCredentialDto) =>
      AiSettingsAPI.createCredential(body),
    onSuccess: invalidate,
  });
}

export function useDeleteAiCredentialMutation() {
  const invalidate = useInvalidateAiSettings();
  return useMutation({
    mutationFn: (aiCredentialId: number) =>
      AiSettingsAPI.deleteCredential(aiCredentialId),
    onSuccess: invalidate,
  });
}

export function useTestAiCredentialMutation() {
  const invalidate = useInvalidateAiSettings();
  return useMutation({
    mutationFn: ({
      aiCredentialId,
      modelId,
    }: {
      aiCredentialId: number;
      modelId: string;
    }) => AiSettingsAPI.testCredential(aiCredentialId, modelId),
    // The test records the key's status (last error, last use)
    onSettled: invalidate,
  });
}

export function useUpdateAiModelPreferencesMutation() {
  const invalidate = useInvalidateAiSettings();
  return useMutation({
    mutationFn: (body: UpdateAiModelPreferencesDto) =>
      AiSettingsAPI.updateModelPreferences(body),
    onSuccess: invalidate,
  });
}

/** Allows or withdraws sending the user's data to AI providers */
export function useAiDataSharingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (allow: boolean) =>
      allow
        ? AiSettingsAPI.allowDataSharing()
        : AiSettingsAPI.withdrawDataSharing(),
    // Access per athlete depends on it too
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: aiSettingsKeys.all }),
  });
}
