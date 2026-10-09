import client, { routes } from '@/utils/axios';

import {
  ActivityStream,
  CreateEventDto,
  DuplicateEventDto,
  DuplicateWorkoutDto,
  Event,
  EventNormalizationFactorDto,
  GetEventWeatherResponseDto,
  ReorderWorkoutStepsDto,
  RepeatEventDto,
  ShiftEventsDto,
  UpdateEventDto,
} from '@openathlete/shared';

export type GetEventNormalizationResponseDto = {
  averageNormalizedSpeed: number | null;
  factors: EventNormalizationFactorDto[];
};

const mapEvent = (event: Event): Event => {
  return {
    ...event,
    startDate: new Date(event.startDate),
    endDate: new Date(event.endDate),
  };
};

export class EventAPI {
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
    startDate?: Date,
    endDate?: Date,
  ): Promise<Event[]> {
    const params: Record<string, unknown> = { coach: isCoach, athleteId };

    if (startDate) {
      params.startDate = startDate.toISOString();
    }
    if (endDate) {
      params.endDate = endDate.toISOString();
    }

    const res = await client.get(routes.event.getMyEvents, { params });
    const data = res.data as Event[];
    return data.map((event) => mapEvent(event));
  }

  static async getUpcomingCompetitions(
    isCoach?: boolean,
    athleteId?: number,
  ): Promise<Event[]> {
    const params: Record<string, unknown> = { coach: isCoach, athleteId };

    const res = await client.get(routes.event.getUpcomingCompetitions, {
      params,
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
  ): Promise<GetEventWeatherResponseDto | null> {
    const res = await client.get(routes.event.getEventWeather(eventId));
    // An activity without weather answers an empty body
    return res.data || null;
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

  /** A new feed token: the previous feed URL stops working */
  static async regenerateMyIcalCalendarSecret(): Promise<string> {
    const res = await client.post(routes.event.getMyIcalCalendarSecret);
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

  /** Repeats a planned event every few weeks; returns the new occurrences */
  static async repeatEvent(
    eventId: Event['eventId'],
    body: RepeatEventDto,
  ): Promise<Event[]> {
    const res = await client.post(routes.event.repeatEvent(eventId), body);
    return (res.data as Event[]).map(mapEvent);
  }

  /** Applies an edit to an occurrence and the following ones */
  static async updateEventSeries({
    eventId,
    body,
  }: {
    eventId: Event['eventId'];
    body: UpdateEventDto;
  }): Promise<Event[]> {
    const res = await client.patch(routes.event.eventSeries(eventId), body);
    return (res.data as Event[]).map(mapEvent);
  }

  /** Deletes an occurrence and the following ones still to do */
  static async deleteEventSeries(
    eventId: Event['eventId'],
  ): Promise<{ deleted: number }> {
    const res = await client.delete(routes.event.eventSeries(eventId));
    return res.data;
  }

  /** Copies planned events by whole days; returns the copies */
  static async copyEvents(body: ShiftEventsDto): Promise<Event[]> {
    const res = await client.post(routes.event.copyEvents, body);
    return (res.data as Event[]).map(mapEvent);
  }

  /** Moves planned events by whole days; returns them moved */
  static async moveEvents(body: ShiftEventsDto): Promise<Event[]> {
    const res = await client.post(routes.event.moveEvents, body);
    return (res.data as Event[]).map(mapEvent);
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
