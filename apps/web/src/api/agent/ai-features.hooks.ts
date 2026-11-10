import { useMutation } from '@tanstack/react-query';

import {
  CreateEventDto,
  GenerateEventResponseDto,
  ModifyEventResponseDto,
} from '@openathlete/shared';

import { AIFeaturesAPI } from './ai-features.api';

export function useGenerateEventMutation() {
  return useMutation<
    GenerateEventResponseDto,
    Error,
    { prompt: string; date: Date; athleteId?: number | null }
  >({
    mutationFn: ({ prompt, date, athleteId }) =>
      AIFeaturesAPI.generateEvent(prompt, date, athleteId),
  });
}

export function useModifyEventMutation() {
  return useMutation<
    ModifyEventResponseDto,
    Error,
    { prompt: string; eventData: CreateEventDto }
  >({
    mutationFn: ({ prompt, eventData }) =>
      AIFeaturesAPI.modifyEvent(prompt, eventData),
  });
}
