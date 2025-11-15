import { useMutation } from '@tanstack/react-query';

import {
  CreateEventDto,
  GenerateEventResponseDto,
  ModifyEventResponseDto,
} from '@openathlete/shared';

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

export function useModifyEventMutation() {
  return useMutation<
    ModifyEventResponseDto,
    Error,
    { prompt: string; eventId?: number; eventData?: CreateEventDto }
  >({
    mutationFn: ({ prompt, eventId, eventData }) =>
      AIFeaturesAPI.modifyEvent(prompt, eventId, eventData),
    mutationKey: agentKeys.modifyEvent(),
  });
}
