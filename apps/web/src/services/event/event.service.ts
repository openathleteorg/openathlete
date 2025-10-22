import client, { routes } from '@/utils/axios';

import {
  ActivityStream,
  CreateEventDto,
  DuplicateEventDto,
  DuplicateWorkoutDto,
  Event,
  GetEventWeatherResponseDto,
  ReorderWorkoutStepsDto,
  UpdateEventDto,
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
    body: UpdateEventDto;
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

  /**
   * Duplicate an event with optional date override
   * @param eventId - The ID of the event to duplicate
   * @param body - Optional dates for the duplicated event
   * @returns The duplicated event
   */
  static async duplicateEvent({
    eventId,
    body,
  }: {
    eventId: Event['eventId'];
    body?: DuplicateEventDto;
  }): Promise<Event> {
    const res = await client.post(routes.event.duplicate(eventId), body || {});
    return mapEvent(res.data);
  }

  // ============================================================================
  // Workout-related methods (now integrated with events)
  // ============================================================================

  /**
   * Reorder workout steps for a training event
   * @param eventId - The ID of the training event
   * @param body - The reorder data with step IDs and their new order
   * @returns The updated event with reordered workout steps
   */
  static async reorderWorkoutSteps({
    eventId,
    body,
  }: {
    eventId: Event['eventId'];
    body: ReorderWorkoutStepsDto;
  }): Promise<Event> {
    const res = await client.patch(routes.workout.reorder(eventId), body);
    return mapEvent(res.data);
  }

  /**
   * Duplicate a workout from one training event to another
   * @param sourceEventId - The ID of the source training event with the workout to copy
   * @param body - The target training event ID
   * @returns The updated target event with the duplicated workout
   */
  static async duplicateWorkout({
    sourceEventId,
    body,
  }: {
    sourceEventId: Event['eventId'];
    body: DuplicateWorkoutDto;
  }): Promise<Event> {
    const res = await client.post(
      routes.workout.duplicate(sourceEventId),
      body,
    );
    return mapEvent(res.data);
  }
}
