import client, { routes } from '@/utils/axios';
import { deviceTimeZone, localDateKey } from '@/utils/time-zone';

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
    /** The session's athlete: the workout uses their zones */
    athleteId?: number | null,
  ): Promise<GenerateEventResponseDto> {
    // A calendar day is not an instant: send the local day, plus the zone
    // that makes noon on that day unambiguous for the API
    const timeZone = deviceTimeZone();

    const res = await client.post<GenerateEventResponseDto>(
      routes.aiFeatures.generateEvent,
      {
        prompt,
        date: localDateKey(date),
        ...(timeZone ? { timeZone } : {}),
        ...(athleteId ? { athleteId } : {}),
      } satisfies GenerateEventDto,
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
