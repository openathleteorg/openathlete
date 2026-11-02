import { SportType } from '@openathlete/database';
import type { WorkoutDto } from '@openathlete/shared';

import { mapWorkoutToCorosCourse } from './coros-course.mapper';

const step = (overrides: object, orderIndex = 0) => ({
  orderIndex,
  stepType: 'STEADY',
  durationType: 'TIME',
  durationValue: 600,
  targets: [],
  ...overrides,
});

const workout = (steps: object[]) => ({ steps }) as unknown as WorkoutDto;

const heartRate = { targetType: 'HEARTRATE', targetMin: 137, targetMax: 149 };

describe('COROS course mapping', () => {
  it('maps the pushed course COROS reads back identically', () => {
    const course = mapWorkoutToCorosCourse(
      workout([
        step({ durationValue: 2400, targets: [heartRate] }),
        step(
          {
            stepType: 'REPEAT',
            repeatBlock: {
              repetitions: 4,
              childSteps: [
                step({
                  stepType: 'INTERVAL_ACTIVE',
                  durationType: 'DISTANCE',
                  durationValue: 100,
                }),
                step({ stepType: 'INTERVAL_REST', durationValue: 60 }, 1),
              ],
            },
          },
          1,
        ),
      ]),
      SportType.RUNNING,
      'Endurance 40 min + 4 strides',
      'Easy, then strides',
    );

    expect(course).toEqual({
      sportType: 1,
      courseName: 'Endurance 40 min + 4 strides',
      courseDescription: 'Easy, then strides',
      sections: [
        {
          sectionType: 2,
          targetType: 2,
          targetValue: 2400,
          intensityType: 1,
          intensityValueStart: 137,
          intensityValueEnd: 149,
        },
        {
          intervalGroup: true,
          repeats: 4,
          sets: [
            { sectionType: 2, targetType: 1, targetValue: 100 },
            { sectionType: 3, targetType: 2, targetValue: 60 },
          ],
        },
      ],
    });
  });

  it('writes pace ranges slow to fast, in whole seconds per km', () => {
    const course = mapWorkoutToCorosCourse(
      workout([
        step({
          targets: [{ targetType: 'PACE', targetMin: 2.5, targetMax: 4 }],
        }),
      ]),
      SportType.RUNNING,
      'Tempo',
      null,
    );
    expect(course?.sections[0]).toMatchObject({
      intensityType: 2,
      intensityValueStart: 400,
      intensityValueEnd: 250,
    });
  });

  it('leaves out of the sections what COROS refuses', () => {
    const course = mapWorkoutToCorosCourse(
      workout([
        step({ targets: [{ targetType: 'PACE', targetMin: 8, targetMax: 9 }] }),
      ]),
      SportType.CYCLING,
      'Ride',
      null,
    );
    expect(course?.sections[0]).toEqual({
      sectionType: 2,
      targetType: 2,
      targetValue: 600,
    });
    expect(course?.courseDescription).toContain('km/h');
  });

  it('sends a timed trail session as a run: trail has no time target', () => {
    const timed = mapWorkoutToCorosCourse(
      workout([step({})]),
      SportType.TRAIL_RUNNING,
      'Hills',
      null,
    );
    expect(timed?.sportType).toBe(1);

    const measured = mapWorkoutToCorosCourse(
      workout([step({ durationType: 'DISTANCE', durationValue: 5000 })]),
      SportType.TRAIL_RUNNING,
      'Hills',
      null,
    );
    expect(measured?.sportType).toBe(5);
  });

  it('ends a step with no measure on the lap button', () => {
    const course = mapWorkoutToCorosCourse(
      workout([step({ durationType: 'OPEN', durationValue: null })]),
      SportType.RUNNING,
      'Free',
      null,
    );
    expect(course?.sections[0]).toEqual({ sectionType: 2, targetType: 4 });
  });

  it('splits repeats past the limit of 20', () => {
    const course = mapWorkoutToCorosCourse(
      workout([
        step({
          stepType: 'REPEAT',
          repeatBlock: { repetitions: 45, childSteps: [step({})] },
        }),
      ]),
      SportType.RUNNING,
      'Hundreds',
      null,
    );
    expect(
      course?.sections.map(
        (section) => 'repeats' in section && section.repeats,
      ),
    ).toEqual([20, 20, 5]);
  });

  it('has no course for a sport COROS cannot create', () => {
    expect(
      mapWorkoutToCorosCourse(
        workout([step({})]),
        SportType.SWIMMING,
        'Swim',
        null,
      ),
    ).toBeNull();
  });
});
