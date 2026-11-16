import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { MessageBroadcastService } from './message-broadcast.service';
import { MessageThreadService } from './message-thread.service';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

describe('messages to several people (PostgreSQL)', () => {
  let prisma: PrismaService;
  let broadcasts: MessageBroadcastService;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    broadcasts = new MessageBroadcastService(
      prisma,
      new MessageThreadService(prisma),
    );
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

  const person = async (name: string) => {
    const user = await prisma.user.create({
      data: {
        email: `${name}@example.com`,
        password: 'hash',
        firstName: name,
        lastName: 'Test',
        athlete: { create: {} },
      },
      select: { userId: true, athlete: { select: { athleteId: true } } },
    });
    return { userId: user.userId, athleteId: user.athlete!.athleteId };
  };

  /** A coach of Ana and Ben; Sam is a stranger */
  const setUp = async () => {
    const coach = await person('coach');
    const [ana, ben, sam] = await Promise.all(
      ['ana', 'ben', 'sam'].map(person),
    );
    for (const athlete of [ana, ben]) {
      await prisma.coachAthlete.create({
        data: { userId: coach.userId, athleteId: athlete.athleteId },
      });
    }
    const user = { userId: coach.userId } as AuthUser;
    return { user, coach, ana, ben, sam };
  };

  /** Each conversation, as its participants and its messages */
  const conversations = async () =>
    (
      await prisma.messageThread.findMany({
        orderBy: { messageThreadId: 'asc' },
        include: {
          participants: { select: { userId: true } },
          messages: { select: { content: true } },
        },
      })
    ).map((thread) => ({
      people: thread.participants.map((p) => p.userId).sort(),
      messages: thread.messages.map((m) => m.content),
    }));

  it('writes to each athlete in their own conversation, reusing it', async () => {
    const { user, coach, ana, ben } = await setUp();
    // Ana and her coach already talk
    const existing = await prisma.messageThread.create({
      data: {
        title: 'Ana',
        participants: {
          create: [{ userId: coach.userId }, { userId: ana.userId }],
        },
      },
    });

    const { messageThreadIds, scheduledMessageId } = await broadcasts.send(
      user,
      {
        recipientUserIds: [ana.userId, ben.userId],
        content: 'Sunday: long run at 9',
        mode: 'INDIVIDUAL',
      },
    );

    expect(scheduledMessageId).toBeNull();
    expect(messageThreadIds[0]).toBe(existing.messageThreadId);
    expect(await conversations()).toEqual([
      {
        people: [coach.userId, ana.userId].sort(),
        messages: ['Sunday: long run at 9'],
      },
      {
        people: [coach.userId, ben.userId].sort(),
        messages: ['Sunday: long run at 9'],
      },
    ]);
  });

  it('opens one conversation for the group when asked', async () => {
    const { user, coach, ana, ben } = await setUp();
    await broadcasts.send(user, {
      recipientUserIds: [ana.userId, ben.userId],
      content: 'Welcome to the group',
      mode: 'GROUP',
      title: 'Marathon group',
    });

    const [thread] = await prisma.messageThread.findMany({
      include: { participants: true },
    });
    expect(thread.title).toBe('Marathon group');
    expect(thread.participants.map((p) => p.userId).sort()).toEqual(
      [coach.userId, ana.userId, ben.userId].sort(),
    );
  });

  it('writes to nobody unless it may write to everybody', async () => {
    const { user, ana, sam } = await setUp();
    await expect(
      broadcasts.send(user, {
        recipientUserIds: [ana.userId, sam.userId],
        content: 'Hello',
        mode: 'INDIVIDUAL',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(await prisma.message.count()).toBe(0);
  });

  it('sends a scheduled message once, at its time, to those still coached', async () => {
    const { user, coach, ana, ben } = await setUp();
    const sendAt = new Date(Date.now() + 3 * 3600_000);
    const { scheduledMessageId } = await broadcasts.send(user, {
      recipientUserIds: [ana.userId, ben.userId],
      content: 'Good luck tomorrow!',
      mode: 'INDIVIDUAL',
      sendAt,
    });
    expect(scheduledMessageId).not.toBeNull();
    expect(await prisma.message.count()).toBe(0);
    expect(
      (await broadcasts.listScheduled(user)).map((m) => m.content),
    ).toEqual(['Good luck tomorrow!']);

    // Not yet; then Ben leaves his coach
    expect(await broadcasts.sendDue(new Date())).toBe(0);
    await prisma.coachAthlete.deleteMany({
      where: { userId: coach.userId, athleteId: ben.athleteId },
    });

    // Two instances run the scheduler at once: it goes out once
    const later = new Date(sendAt.getTime() + 60_000);
    const runs = await Promise.all([
      broadcasts.sendDue(later),
      broadcasts.sendDue(later),
    ]);
    expect(runs.sort()).toEqual([0, 1]);
    expect(await conversations()).toEqual([
      {
        people: [coach.userId, ana.userId].sort(),
        messages: ['Good luck tomorrow!'],
      },
    ]);
    expect(await broadcasts.listScheduled(user)).toEqual([]);
  });

  it('lets the sender change or cancel a message until it is sent', async () => {
    const { user, ana, sam } = await setUp();
    const { scheduledMessageId } = await broadcasts.send(user, {
      recipientUserIds: [ana.userId],
      content: 'Draft',
      mode: 'INDIVIDUAL',
      sendAt: new Date(Date.now() + 3600_000),
    });
    const id = scheduledMessageId!;

    await broadcasts.updateScheduled(user, id, { content: 'Final' });
    expect((await broadcasts.listScheduled(user))[0].content).toBe('Final');
    // Someone else's message does not exist for them
    await expect(
      broadcasts.cancelScheduled({ userId: sam.userId } as AuthUser, id),
    ).rejects.toBeInstanceOf(NotFoundException);

    await broadcasts.cancelScheduled(user, id);
    expect(await broadcasts.sendDue(new Date(Date.now() + 7200_000))).toBe(0);
    expect(await prisma.message.count()).toBe(0);
  });
});
