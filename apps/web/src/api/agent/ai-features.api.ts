import client, { routes } from '@/utils/axios';

import {
  CreateEventDto,
  GenerateEventDto,
  GenerateEventResponseDto,
  ModifyEventResponseDto,
  TrainingEvent,
  UpdateEventDto,
} from '@openathlete/shared';

export class AIFeaturesAPI {
  static async generateEvent(
    prompt: string,
    date: Date,
  ): Promise<GenerateEventResponseDto> {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const res = await client.post<GenerateEventResponseDto>(
      routes.aiFeatures.generateEvent,
      {
        prompt,
        date: normalizedDate.toISOString(),
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
    eventData: CreateEventDto,
  ): Promise<ModifyEventResponseDto> {
    const payload = {
      prompt,
      eventData: {
        ...eventData,
        startDate:
          eventData.startDate instanceof Date
            ? eventData.startDate.toISOString()
            : (eventData.startDate as string),
        endDate:
          eventData.endDate instanceof Date
            ? eventData.endDate.toISOString()
            : (eventData.endDate as string),
      },
    };

    const res = await client.post<ModifyEventResponseDto>(
      routes.aiFeatures.modifyEvent,
      payload,
    );
    const event = res.data;
    const workout =
      'workout' in event && event.type === 'TRAINING'
        ? (event as TrainingEvent).workout
        : undefined;

    const mappedEvent: UpdateEventDto = {
      ...event,
      startDate: event.startDate ? new Date(event.startDate) : new Date(),
      endDate: event.endDate ? new Date(event.endDate) : new Date(),
      ...(workout ? { workout } : {}),
    } as UpdateEventDto;

    return mappedEvent;
  }
}
