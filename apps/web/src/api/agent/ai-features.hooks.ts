import { useMutation } from '@tanstack/react-query';

import { GenerateEventResponseDto } from '@openathlete/shared';

import { agentKeys } from './agent.keys';
import { AIFeaturesAPI } from './ai-features.api';

export function useGenerateEventMutation() {
  return useMutation<
    GenerateEventResponseDto,
    Error,
    { prompt: string; date: Date }
  >({
    mutationFn: ({ prompt, date }) => AIFeaturesAPI.generateEvent(prompt, date),
    mutationKey: agentKeys.generateEvent(),
  });
}
