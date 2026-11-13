import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { SportType } from '@openathlete/database';

import type { CaslAbilityFactory } from 'src/modules/auth';
import type { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import type { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  buildTrainingProfileContext,
  buildZonesContext,
  normalizeGoalDuration,
  repsAsPoolLengths,
  resolveSessionAthleteId,
} from './event-ai-helpers';

// The heart-rate zones every new athlete gets, which apply to every sport.
const defaultZones = [
  ['Zone 1', 'Recovery', 0, 131],
  ['Zone 2', 'Endurance', 132, 142],
  ['Zone 3', 'Tempo', 143, 152],
  ['Zone 4', 'Threshold', 153, 163],
  ['Zone 5', 'VO2 Max', 164, 220],
].map(([name, description, min, max], index) => ({
  trainingZoneId: 10 + index,
  type: 'HEARTRATE',
  index,
  name: name as string,
  description: description as string,
  values: [
    {
      min: min as number,
      max: max as number,
      sports: Object.values(SportType),
    },
  ],
}));

describe('buildZonesContext', () => {
  test('does not list sports for zones that apply to every sport', () => {
    const context = buildZonesContext({ HEARTRATE: defaultZones } as never);
    expect(context).not.toContain('sports:');
    expect(context).not.toContain(SportType.RUNNING);
    expect(context).toContain('Zone ID 11: Zone 2 - Endurance');
    expect(context).toContain('Values: 132-142\n');
  });

  test('lists the sports of zones that only apply to some', () => {
    const zone = {
      ...defaultZones[1],
      values: [
        { min: 132, max: 142, sports: ['RUNNING', 'TRAIL_RUNNING'] },
        { min: 120, max: 135, sports: Object.values(SportType) },
      ],
    };
    const context = buildZonesContext({ HEARTRATE: [zone] } as never);
    expect(context).toContain(
      'Values: 132-142 (sports: RUNNING, TRAIL_RUNNING), 120-135\n',
    );
  });
});

describe('buildTrainingProfileContext', () => {
  it('describes what the athlete told at sign-up', () => {
    expect(
      buildTrainingProfileContext({
        practicedSports: ['RUNNING', 'CYCLING'],
        trainingGoal: 'RACE',
        weeklyTrainingHours: 'FROM_3_TO_6',
      }),
    ).toBe(
      [
        '  Sports practised: RUNNING, CYCLING',
        '  Goal: preparing a race',
        '  Time available per week: 3 to 6 hours',
      ].join('\n'),
    );
  });

  it('is empty when every question was skipped', () => {
    expect(
      buildTrainingProfileContext({
        practicedSports: [],
        trainingGoal: null,
        weeklyTrainingHours: null,
      }),
    ).toBe('');
  });
});

describe('normalizeGoalDuration', () => {
  test('keeps seconds and reads a short figure as minutes', () => {
    expect(normalizeGoalDuration(2700)).toBe(2700);
    // "45" for 45 minutes would plan a 45-second session
    expect(normalizeGoalDuration(45)).toBe(2700);
    expect(normalizeGoalDuration(2700.4)).toBe(2700);
  });

  test('leaves no duration alone', () => {
    expect(normalizeGoalDuration(undefined)).toBeUndefined();
    expect(normalizeGoalDuration(null)).toBeNull();
    expect(normalizeGoalDuration(0)).toBeNull();
  });
});

describe('repsAsPoolLengths', () => {
  const lengths = () => ({
    steps: [
      { durationType: 'TIME', durationValue: 900 },
      {
        durationType: 'OPEN',
        durationValue: null,
        repeatBlock: {
          childSteps: [
            { durationType: 'REPS', durationValue: 8 },
            { durationType: 'TIME', durationValue: 60 },
          ],
        },
      },
    ],
  });

  test('turns swim repetitions into 25 m lengths', () => {
    const workout = lengths();
    repsAsPoolLengths(workout, SportType.SWIMMING);
    expect(workout.steps[1].repeatBlock?.childSteps[0]).toEqual({
      durationType: 'DISTANCE',
      durationValue: 200,
    });
    expect(workout.steps[0]).toEqual({
      durationType: 'TIME',
      durationValue: 900,
    });
  });

  test('leaves the repetitions of other sports', () => {
    const workout = lengths();
    repsAsPoolLengths(workout, SportType.STRENGTH);
    expect(workout).toEqual(lengths());
  });
});

describe('resolveSessionAthleteId', () => {
  const coach: AuthUser = {
    userId: 1,
    email: 'coach@example.com',
    athlete: { athleteId: 100 },
  };
  const athletes = [
    { athleteId: 100, userId: 1 },
    { athleteId: 200, userId: 2 },
    { athleteId: 300, userId: 3 },
  ];
  const prisma = {
    athlete: {
      findUnique: ({ where }: { where: { athleteId: number } }) =>
        Promise.resolve(
          athletes.find((a) => a.athleteId === where.athleteId) ?? null,
        ),
    },
  } as unknown as PrismaService;
  // The coach coaches athlete 200, not 300
  const abilities = {
    getFor: () =>
      Promise.resolve({
        can: (_action: string, athlete: { athleteId: number }) =>
          athlete.athleteId === 200,
      }),
  } as unknown as CaslAbilityFactory;

  test("uses the coached athlete's id, whose zones the preview shows", async () => {
    await expect(
      resolveSessionAthleteId(prisma, abilities, coach, 200),
    ).resolves.toBe(200);
  });

  test("defaults to the user's own athlete", async () => {
    await expect(
      resolveSessionAthleteId(prisma, abilities, coach, undefined),
    ).resolves.toBe(100);
    await expect(
      resolveSessionAthleteId(prisma, abilities, coach, 100),
    ).resolves.toBe(100);
  });

  test('refuses an athlete the user does not coach', async () => {
    await expect(
      resolveSessionAthleteId(prisma, abilities, coach, 300),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      resolveSessionAthleteId(prisma, abilities, coach, 999),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  test('needs an athlete when the user has no profile of their own', async () => {
    await expect(
      resolveSessionAthleteId(
        prisma,
        abilities,
        { ...coach, athlete: null },
        undefined,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
