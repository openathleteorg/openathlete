import { NotFoundException } from '@nestjs/common';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { TrainingLoadService } from './training-load.service';

const athlete: AuthUser = {
  userId: 2,
  email: 'athlete@example.test',
  athlete: { athleteId: 12 },
  coachAthletes: [],
};
const coach: AuthUser = {
  userId: 1,
  email: 'coach@example.test',
  athlete: null,
  coachAthletes: [{ athleteId: 12 }],
};
const stranger: AuthUser = {
  userId: 3,
  email: 'stranger@example.test',
  athlete: { athleteId: 99 },
  coachAthletes: [{ athleteId: 13 }],
};

function setup() {
  const activity = {
    eventId: 50,
    athleteId: 12,
    type: 'ACTIVITY',
    activity: { eventActivityId: 101 },
  };
  const entries = [{ value: 48.6, calculation: { type: 'TRIMP' } }];
  // Stand-in for the database: the stored activity matches when the query
  // names it and, if the query restricts athletes, allows its athlete.
  const findFirst = jest.fn(async ({ where }: { where: unknown }) => {
    const query = JSON.stringify(where);
    const athletes = [...query.matchAll(/"athleteId":(\d+)/g)].map(([, id]) =>
      Number(id),
    );
    return query.includes('"eventId":50') &&
      (!athletes.length || athletes.includes(activity.athleteId))
      ? activity
      : null;
  });
  const prisma = {
    event: { findFirst },
    trainingLoadEntry: { findMany: jest.fn().mockResolvedValue(entries) },
  };
  const service = new TrainingLoadService(
    prisma as unknown as PrismaService,
    new CaslAbilityFactory(),
  );
  return { prisma, service, entries };
}

describe('TrainingLoadService.getActivityTrainingLoads', () => {
  it.each([
    ['the athlete', athlete],
    ['a linked coach', coach],
  ])('returns the saved loads to %s', async (_who, user) => {
    const { prisma, service, entries } = setup();
    await expect(service.getActivityTrainingLoads(user, 50)).resolves.toBe(
      entries,
    );
    expect(prisma.trainingLoadEntry.findMany).toHaveBeenCalledWith({
      where: { activityId: 101 },
      include: { calculation: true },
    });
  });

  it('hides activities of athletes the user is not linked to', async () => {
    const { prisma, service } = setup();
    await expect(
      service.getActivityTrainingLoads(stranger, 50),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.trainingLoadEntry.findMany).not.toHaveBeenCalled();
  });
});
