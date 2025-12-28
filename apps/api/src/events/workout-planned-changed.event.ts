type WorkoutPlannedChangedPayload = {
  eventId: number;
  athleteId: number;
  workoutId?: number | null; // null if workout was deleted
  startDate: Date;
  sport: string; // SportType enum value
};

export class WorkoutPlannedChangedEvent {
  static SLUG = 'workout.planned-changed';

  constructor(public readonly payload: WorkoutPlannedChangedPayload) {}
}
