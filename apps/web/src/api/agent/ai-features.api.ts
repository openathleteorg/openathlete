import client, { routes } from '@/utils/axios';

import {
  CreateEventDto,
  GenerateEventDto,
  GenerateEventResponseDto,
  ModifyEventDto,
  ModifyEventResponseDto,
  UpdateEventDto,
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

  static async modifyEvent(
    prompt: string,
    eventId?: number,
    eventData?: CreateEventDto,
  ): Promise<ModifyEventResponseDto> {
    const payload: ModifyEventDto = {
      prompt,
      ...(eventId ? { eventId } : {}),
      ...(eventData
        ? {
            eventData: {
              ...eventData,
              startDate:
                eventData.startDate instanceof Date
                  ? eventData.startDate.toISOString()
                  : eventData.startDate,
              endDate:
                eventData.endDate instanceof Date
                  ? eventData.endDate.toISOString()
                  : eventData.endDate,
            },
          }
        : {}),
    };

    const res = await client.post<ModifyEventResponseDto>(
      routes.aiFeatures.modifyEvent,
      payload,
    );
    const event = res.data;
    const trainingEvent = event as Extract<typeof event, { type: 'TRAINING' }>;
    const workout =
      'workout' in trainingEvent ? trainingEvent.workout : undefined;

    const mappedEvent: UpdateEventDto = {
      ...event,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      ...(workout ? { workout } : {}),
    } as UpdateEventDto;

    return mappedEvent;
  }
}
