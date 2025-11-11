import client, { routes } from '@/utils/axios';

import {
  CreateEventDto,
  GenerateEventDto,
  GenerateEventResponseDto,
} from '@openathlete/shared';

export class AIFeaturesAPI {
  static async generateEvent(
    prompt: string,
    date: Date,
  ): Promise<GenerateEventResponseDto> {
    const res = await client.post<GenerateEventResponseDto>(
      routes.aiFeatures.generateEvent,
      {
        prompt,
        date: date.toISOString(),
      } as GenerateEventDto,
    );
    const event = res.data;
    const trainingEvent = event as Extract<typeof event, { type: 'TRAINING' }>;
    const workout =
      'workout' in trainingEvent ? trainingEvent.workout : undefined;

    const mappedEvent: CreateEventDto = {
      ...event,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      ...(workout ? { workout } : {}),
    } as CreateEventDto;

    return mappedEvent;
  }
}
