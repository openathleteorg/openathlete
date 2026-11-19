import { isGeneratedSuuntoName, suuntoWorkoutName } from './suunto';

describe('suuntoWorkoutName', () => {
  it('names a workout after its sport, as the Suunto app does', () => {
    expect(suuntoWorkoutName({ activityId: 52 })).toBe('Indoor cycling');
    expect(suuntoWorkoutName({ activityId: 23 })).toBe('Gym');
    expect(suuntoWorkoutName({ activityId: 1, workoutName: '  ' })).toBe(
      'Running',
    );
  });

  it('keeps the name the athlete gave the workout', () => {
    expect(
      suuntoWorkoutName({ activityId: 1, workoutName: 'Lunch tempo' }),
    ).toBe('Lunch tempo');
  });

  it('falls back to a plain name for a sport Suunto does not list', () => {
    expect(suuntoWorkoutName({ activityId: 89 })).toBe('Suunto activity');
    expect(suuntoWorkoutName({})).toBe('Suunto activity');
  });
});

describe('isGeneratedSuuntoName', () => {
  it('recognises only the names generated from a workout key', () => {
    expect(
      isGeneratedSuuntoName('Suunto Workout 6af1bb4e14c9cd039d286c8c'),
    ).toBe(true);
    expect(isGeneratedSuuntoName('Suunto Workout with friends')).toBe(false);
    expect(isGeneratedSuuntoName('Indoor cycling')).toBe(false);
  });
});
