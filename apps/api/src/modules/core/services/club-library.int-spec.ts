import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ClubRole } from '@openathlete/database';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { AccountDeletionService } from 'src/modules/auth/services/account-deletion.service';
import { accessibleBy } from 'src/modules/auth/services/casl-prisma';
import { ClubService } from 'src/modules/club/club.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { StripeService } from 'src/modules/subscription/services/stripe.service';

import { EventTemplateFolderService } from './event-template-folder.service';
import { EventTemplateService } from './event-template.service';
import { EventService } from './event.service';

// An ESM package Jest cannot load, pulled in by the FIT import; unused here
jest.mock('@garmin/fitsdk', () => ({}));

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

describe("a club's library of templates (PostgreSQL)", () => {
  let prisma: PrismaService;
  let templates: EventTemplateService;
  let folders: EventTemplateFolderService;
  let clubs: ClubService;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    const abilities = new CaslAbilityFactory();
    const events = new EventService(
      prisma,
      abilities,
      new EventEmitter2(),
      {} as never,
      {} as never,
      { deleteExportsForWorkout: jest.fn() } as never,
      {} as never,
    );
    templates = new EventTemplateService(prisma, events, abilities);
    folders = new EventTemplateFolderService(prisma);
    clubs = new ClubService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> '_prisma_migrations'`;
    await prisma.$executeRawUnsafe(
      `TRUNCATE ${tables.map((t) => `"${t.table_name}"`).join(', ')} RESTART IDENTITY CASCADE`,
    );
  });

  /** A user and the session the API would build for them */
  const person = async (name: string) => {
    const user = await prisma.user.create({
      data: {
        email: `${name}@example.com`,
        password: 'hash',
        firstName: name,
        lastName: 'Test',
        roles: ['ATHLETE', 'COACH'],
        athlete: { create: {} },
      },
      select: { userId: true, athlete: { select: { athleteId: true } } },
    });
    const session = async (): Promise<AuthUser> =>
      ({
        userId: user.userId,
        email: `${name}@example.com`,
        athlete: { athleteId: user.athlete!.athleteId },
        coachAthletes: [],
        clubMemberships: await prisma.clubMember.findMany({
          where: { userId: user.userId },
          select: { clubId: true, role: true },
        }),
      }) as AuthUser;
    return { userId: user.userId, athleteId: user.athlete!.athleteId, session };
  };

  const template = (userId: number, name: string, clubId: number | null) =>
    prisma.eventTemplate.create({
      data: {
        user: { connect: { userId } },
        ...(clubId && { club: { connect: { clubId } } }),
        event: {
          create: {
            name,
            type: 'NOTE',
            startDate: new Date('2026-01-01T07:00:00Z'),
            endDate: new Date('2026-01-01T08:00:00Z'),
            note: { create: { description: '' } },
          },
        },
      },
      select: { eventTemplateId: true },
    });

  /** Olga owns the club, Carl coaches in it, Ada assists, Sam is outside */
  const setUp = async () => {
    const [olga, carl, ada, sam] = await Promise.all(
      ['olga', 'carl', 'ada', 'sam'].map(person),
    );
    const { clubId } = await clubs.create(olga.userId, { name: 'Club' });
    await prisma.clubMember.createMany({
      data: [
        { clubId, userId: carl.userId, role: ClubRole.COACH },
        { clubId, userId: ada.userId, role: ClubRole.ASSISTANT },
      ],
    });
    return { clubId, olga, carl, ada, sam };
  };

  const names = async (user: AuthUser, clubId: number | null = null) =>
    (await templates.getMyEventTemplates(user, undefined, clubId))
      .map((t) => t.event.name)
      .sort();

  it("keeps the club's library apart from each coach's own", async () => {
    const { clubId, olga, carl } = await setUp();
    await template(carl.userId, 'Mine', null);
    await template(carl.userId, 'Shared', clubId);

    expect(await names(await carl.session())).toEqual(['Mine']);
    expect(await names(await carl.session(), clubId)).toEqual(['Shared']);
    expect(await names(await olga.session(), clubId)).toEqual(['Shared']);
  });

  it('lets its coaches edit it, its assistants use it, and nobody else see it', async () => {
    const { clubId, olga, ada, sam } = await setUp();
    const shared = await template(olga.userId, 'Shared', clubId);

    expect(await names(await ada.session(), clubId)).toEqual(['Shared']);
    await expect(
      templates.deleteEventTemplate(
        await ada.session(),
        shared.eventTemplateId,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      folders.createFolder(await ada.session(), { name: 'Mine', clubId }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    // An assistant plans from it: its event is readable to them, not
    // writable
    const ability = await new CaslAbilityFactory().getFor({
      user: await ada.session(),
    });
    const reach = (action: 'read' | 'update') =>
      prisma.event.count({
        where: {
          AND: [
            {
              templates: {
                some: { eventTemplateId: shared.eventTemplateId },
              },
            },
            accessibleBy(ability, action).Event,
          ],
        },
      });
    expect(await reach('read')).toBe(1);
    expect(await reach('update')).toBe(0);

    await expect(names(await sam.session(), clubId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      templates.deleteEventTemplate(
        await sam.session(),
        shared.eventTemplateId,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('never files a template in a folder of another library', async () => {
    const { clubId, carl } = await setUp();
    const own = await folders.createFolder(await carl.session(), {
      name: 'Own',
    });
    const shared = await template(carl.userId, 'Shared', clubId);

    await expect(
      templates.updateEventTemplate(
        await carl.session(),
        shared.eventTemplateId,
        { folderId: own.eventTemplateFolderId },
      ),
    ).rejects.toThrow('The folder is not in this library');
  });

  it('gives each template back to its author when the club goes', async () => {
    const { clubId, olga, carl } = await setUp();
    const folder = await folders.createFolder(await carl.session(), {
      name: 'Intervals',
      clubId,
    });
    const shared = await template(carl.userId, 'Shared', clubId);
    await prisma.eventTemplate.update({
      where: { eventTemplateId: shared.eventTemplateId },
      data: { folderId: folder.eventTemplateFolderId },
    });

    await clubs.delete(olga.userId, clubId);
    expect(await names(await carl.session())).toEqual(['Shared']);
    expect(await prisma.eventTemplateFolder.count()).toBe(0);
  });

  it("keeps an author's club templates in the club when their account goes", async () => {
    const { clubId, olga, carl } = await setUp();
    await template(carl.userId, 'Shared', clubId);
    await template(carl.userId, 'Mine', null);

    await new AccountDeletionService(prisma, {
      cancelSubscriptionNow: jest.fn(),
    } as unknown as StripeService).deleteAccount(carl.userId);

    expect(await names(await olga.session(), clubId)).toEqual(['Shared']);
    expect(await prisma.eventTemplate.count()).toBe(1);
  });
});
