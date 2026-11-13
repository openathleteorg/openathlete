import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { FeatureAccessService } from 'src/modules/subscription';

import {
  CoachJoinLinkService,
  coachDisplayName,
} from './coach-join-link.service';

const COACH = { userId: 7, firstName: 'Ana', lastName: 'lopez' };
const ATHLETE_USER_ID = 20;
const ATHLETE_ID = 200;

function setup({
  roles = ['COACH'],
  coachJoinToken = null as string | null,
  linked = false,
  canAdd = true,
} = {}) {
  const tx = {
    $executeRaw: jest.fn().mockResolvedValue(1),
    coachAthlete: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
    },
  };
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue({ roles, coachJoinToken }),
      findFirst: jest.fn().mockResolvedValue(COACH),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      update: jest.fn().mockResolvedValue({}),
    },
    athlete: {
      findUnique: jest.fn().mockResolvedValue({ athleteId: ATHLETE_ID }),
    },
    coachAthlete: {
      findFirst: jest
        .fn()
        .mockResolvedValue(linked ? { coachAthleteId: 1 } : null),
    },
    $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
  };
  const featureAccess = {
    checkAthleteLimit: jest.fn().mockResolvedValue(canAdd),
  };
  const analytics = {
    capture: jest.fn(),
    captureForAthlete: jest.fn(),
  };
  const config = {
    get: (key: string) =>
      key === 'APP_URL' ? 'https://app.example.com' : undefined,
  } as unknown as ConfigService<ApiEnvSchemaType, true>;
  const service = new CoachJoinLinkService(
    prisma as unknown as PrismaService,
    config,
    featureAccess as unknown as FeatureAccessService,
    analytics as unknown as AnalyticsService,
  );
  return { service, prisma, tx, featureAccess, analytics };
}

describe('coachDisplayName', () => {
  it('keeps the first name and the last initial', () => {
    expect(coachDisplayName('Ana', 'lopez')).toBe('Ana L.');
    expect(coachDisplayName(' Ana ', '')).toBe('Ana');
  });
});

describe('CoachJoinLinkService', () => {
  describe('the coach link', () => {
    it('is created on first request, unguessable and in the app URL', async () => {
      const { service, prisma } = setup();
      const link = await service.getOrCreateLink(COACH.userId);
      expect(link.token).toMatch(/^[A-Za-z0-9_-]{22}$/);
      expect(link.url).toBe(`https://app.example.com/join/${link.token}`);
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { userId: COACH.userId, coachJoinToken: null },
        data: { coachJoinToken: link.token },
      });
    });

    it('is the same on the next request', async () => {
      const { service, prisma } = setup({
        coachJoinToken: 'existing-token-123',
      });
      const link = await service.getOrCreateLink(COACH.userId);
      expect(link.token).toBe('existing-token-123');
      expect(prisma.user.updateMany).not.toHaveBeenCalled();
    });

    it('ends the same for two first requests at once', async () => {
      const { service, prisma } = setup();
      prisma.user.updateMany.mockResolvedValueOnce({ count: 0 });
      prisma.user.findUnique
        .mockResolvedValueOnce({ roles: ['COACH'], coachJoinToken: null })
        .mockResolvedValueOnce({ coachJoinToken: 'winner-token-12345' });
      expect((await service.getOrCreateLink(COACH.userId)).token).toBe(
        'winner-token-12345',
      );
    });

    it('is refused to someone who is not a coach', async () => {
      const { service } = setup({ roles: ['ATHLETE'] });
      await expect(service.getOrCreateLink(COACH.userId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.rotateLink(COACH.userId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('is replaced on rotation', async () => {
      const { service, prisma } = setup({
        coachJoinToken: 'old-token-1234567',
      });
      const link = await service.rotateLink(COACH.userId);
      expect(link.token).not.toBe('old-token-1234567');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { userId: COACH.userId },
        data: { coachJoinToken: link.token },
      });
    });
  });

  describe('the public page', () => {
    it("shows the coach's name, never their email", async () => {
      const { service, prisma } = setup();
      expect(await service.getPublicInfo('some-token-123456')).toEqual({
        coachName: 'Ana L.',
      });
      expect(prisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            coachJoinToken: 'some-token-123456',
            roles: { has: 'COACH' },
          },
        }),
      );
    });

    it('is a 404 for an unknown link', async () => {
      const { service, prisma } = setup();
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(service.getPublicInfo('unknown-token-1234')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('joining', () => {
    it('links the athlete to the coach and reports it', async () => {
      const { service, tx, analytics } = setup();
      expect(await service.accept(ATHLETE_USER_ID, 'tok')).toEqual({
        coachName: 'Ana L.',
        alreadyLinked: false,
      });
      expect(tx.$executeRaw).toHaveBeenCalled();
      expect(tx.coachAthlete.create).toHaveBeenCalledWith({
        data: { userId: COACH.userId, athleteId: ATHLETE_ID },
      });
      expect(analytics.capture).toHaveBeenCalledWith(
        COACH.userId,
        'athlete_linked',
        { invited_by: 'join_link' },
      );
      expect(analytics.captureForAthlete).toHaveBeenCalledWith(
        ATHLETE_ID,
        'coach_linked',
        { invited_by: 'join_link' },
      );
    });

    it('succeeds without change when already linked', async () => {
      const { service, prisma, featureAccess, analytics } = setup({
        linked: true,
        canAdd: false,
      });
      expect(await service.accept(ATHLETE_USER_ID, 'tok')).toEqual({
        coachName: 'Ana L.',
        alreadyLinked: true,
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(featureAccess.checkAthleteLimit).not.toHaveBeenCalled();
      expect(analytics.capture).not.toHaveBeenCalled();
    });

    it('links once when a double submit reaches the lock second', async () => {
      const { service, tx, analytics } = setup();
      tx.coachAthlete.findFirst.mockResolvedValue({ coachAthleteId: 1 });
      expect(await service.accept(ATHLETE_USER_ID, 'tok')).toMatchObject({
        alreadyLinked: true,
      });
      expect(tx.coachAthlete.create).not.toHaveBeenCalled();
      expect(analytics.capture).not.toHaveBeenCalled();
    });

    it('refuses the coach their own link', async () => {
      const { service } = setup();
      await expect(service.accept(COACH.userId, 'tok')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('is a 404 for an unknown link', async () => {
      const { service, prisma } = setup();
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(service.accept(ATHLETE_USER_ID, 'tok')).rejects.toThrow(
        NotFoundException,
      );
    });

    it("respects the coach's athlete limit", async () => {
      const { service, tx } = setup({ canAdd: false });
      await expect(service.accept(ATHLETE_USER_ID, 'tok')).rejects.toThrow(
        'Coach has reached the maximum number of athletes for their subscription plan',
      );
      expect(tx.coachAthlete.create).not.toHaveBeenCalled();
    });
  });
});
