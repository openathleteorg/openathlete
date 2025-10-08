import client, { routes } from '@/utils/axios';

import {
  ActivityStream,
  CreateEventDto,
  Event,
  GetEventWeatherResponseDto,
} from '@openathlete/shared';

export type GetEventNormalizationResponseDto = {
  averageNormalizedSpeed: number | null;
  factors: { factor: string; timeSeconds: number; percent: number }[];
};

const mapEvent = (event: Event): Event => {
  return {
    ...event,
    startDate: new Date(event.startDate),
    endDate: new Date(event.endDate),
  };
};

export class EventService {
  static async createEvent(body: CreateEventDto): Promise<Event> {
    const res = await client.post(routes.event.create, body);
    return mapEvent(res.data);
  }

  static async updateEvent({
    eventId,
    body,
  }: {
    eventId: Event['eventId'];
    body: Partial<CreateEventDto>;
  }): Promise<Event> {
    const res = await client.patch(routes.event.update(eventId), body);
    return mapEvent(res.data);
  }

  static async getMyEvents(
    isCoach?: boolean,
    athleteId?: number,
  ): Promise<Event[]> {
    const res = await client.get(routes.event.getMyEvents, {
      params: { coach: isCoach, athleteId },
    });
    const data = res.data as Event[];
    return data.map((event) => mapEvent(event));
  }

  static async getEvent(eventId: Event['eventId']): Promise<Event> {
    const res = await client.get(routes.event.getEvent(eventId));
    return mapEvent(res.data);
  }

  static async getEventStream(
    eventId: Event['eventId'],
    resolution: number,
    keys?: string[],
  ): Promise<ActivityStream> {
    const res = await client.get(routes.event.getEventStream(eventId), {
      params: { resolution, keys: keys?.join(',') },
    });
    return res.data;
  }

  static async getEventWeather(
    eventId: Event['eventId'],
  ): Promise<GetEventWeatherResponseDto> {
    const res = await client.get(routes.event.getEventWeather(eventId));
    return res.data;
  }

  static async getEventNormalization(
    eventId: Event['eventId'],
  ): Promise<GetEventNormalizationResponseDto> {
    const res = await client.get(routes.event.getEventNormalization(eventId));
    return res.data;
  }

  static async deleteEvent(eventId: Event['eventId']): Promise<void> {
    await client.delete(routes.event.deleteEvent(eventId));
  }

  static async setRelatedActivity({
    eventId,
    activityId,
  }: {
    eventId: Event['eventId'];
    activityId: Event['eventId'];
  }): Promise<void> {
    await client.post(routes.event.setRelatedActivity(eventId, activityId));
  }

  static async unsetRelatedActivity(eventId: Event['eventId']): Promise<void> {
    await client.delete(routes.event.unsetRelatedActivity(eventId));
  }

  static async getMyIcalCalendarSecret(): Promise<string> {
    const res = await client.get(routes.event.getMyIcalCalendarSecret);
    return res.data;
  }
}
