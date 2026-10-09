import {
  COMPETITION_PRIORITY,
  CreateEventDto,
  EVENT_TYPE,
  Event,
} from '@openathlete/shared';

import { cleanWorkoutSteps } from '../../create-event-dialog/utils/workout-helpers';

/**
 * What re-creates a deleted planned event as it was, to undo a deletion: the
 * same dates, goals and workout. Not its comments nor its watch export (a
 * new export follows), and never activities, which come from devices.
 */
export function toRecreateDto(event: Event): CreateEventDto | null {
  const base = {
    name: event.name,
    startDate: new Date(event.startDate),
    endDate: new Date(event.endDate),
    athleteId: event.athleteId,
  };
  switch (event.type) {
    case EVENT_TYPE.TRAINING:
      return {
        ...base,
        type: EVENT_TYPE.TRAINING,
        sport: event.sport,
        description: event.description ?? '',
        goalDistance: event.goalDistance,
        goalDuration: event.goalDuration,
        goalElevationGain: event.goalElevationGain,
        goalRpe: event.goalRpe,
        workout: { steps: cleanWorkoutSteps(event.workout?.steps ?? []) },
      };
    case EVENT_TYPE.COMPETITION:
      return {
        ...base,
        type: EVENT_TYPE.COMPETITION,
        sport: event.sport,
        description: event.description ?? '',
        goalDistance: event.goalDistance,
        goalDuration: event.goalDuration,
        goalElevationGain: event.goalElevationGain,
        goalRpe: event.goalRpe,
        // The same letters in Prisma's enum and the shared one
        priority: event.priority as COMPETITION_PRIORITY | null,
      };
    case EVENT_TYPE.NOTE:
      return {
        ...base,
        type: EVENT_TYPE.NOTE,
        description: event.description || event.name,
      };
    default:
      return null;
  }
}
