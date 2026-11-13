import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { messageThreadNotificationSubject } from 'src/modules/notification/emails/templates/message-thread-notification.template';
import { EmailTransportService } from 'src/modules/notification/services/email-transport.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { MessageNotificationScheduler } from './message-notification.scheduler';

// A thread with one unread message, old enough to be notified
const participant = (userId: number, email: string, language: string) => ({
  messageThreadParticipantId: userId,
  messageThreadId: 5,
  lastNotificationAt: null,
  user: { userId, email, firstName: 'Ana', lastName: 'Lopez', language },
  thread: {
    title: null,
    messages: [
      {
        senderId: 99,
        content: 'See you at the track',
        createdAt: new Date(Date.now() - 20 * 60 * 1000),
        sender: { firstName: 'Coach', lastName: 'Bob' },
        readReceipts: [],
      },
    ],
  },
});

function setup(participants: ReturnType<typeof participant>[]) {
  const transport = { isEnabled: () => true, send: jest.fn() };
  const prisma = {
    messageThreadParticipant: {
      findMany: jest.fn().mockResolvedValue(participants),
      update: jest.fn(),
    },
  };
  const scheduler = new MessageNotificationScheduler(
    prisma as unknown as PrismaService,
    {
      get: (key: string) =>
        key === 'APP_URL' ? 'http://localhost' : undefined,
    } as unknown as ConfigService<ApiEnvSchemaType, true>,
    transport as unknown as EmailTransportService,
  );
  const sentTo = (to: string) =>
    transport.send.mock.calls
      .map(([email]) => email as { to: string; subject: string; html: string })
      .find((email) => email.to === to)!;
  return { scheduler, sentTo };
}

describe('MessageNotificationScheduler language', () => {
  it("writes each new-messages email in its recipient's language", async () => {
    const { scheduler, sentTo } = setup([
      participant(1, 'ana@example.com', 'ES'),
      participant(2, 'lea@example.com', 'EN'),
      participant(3, 'bia@example.com', 'PT_BR'),
      participant(4, 'jonas@example.com', 'DE'),
    ]);

    await scheduler.sendBatchedMessageNotifications();

    const spanish = sentTo('ana@example.com');
    expect(spanish.subject).toBe(messageThreadNotificationSubject('ES'));
    expect(spanish.html).toContain('<html lang="es">');
    expect(spanish.html).toContain('Abrir bandeja de entrada');

    const english = sentTo('lea@example.com');
    expect(english.subject).toBe('New messages in your OpenAthlete inbox');
    expect(english.html).toContain('<html lang="en">');

    const portuguese = sentTo('bia@example.com');
    expect(portuguese.subject).toBe(messageThreadNotificationSubject('PT_BR'));
    expect(portuguese.html).toContain('<html lang="pt-BR">');
    expect(portuguese.html).toContain('Abrir caixa de entrada');

    const german = sentTo('jonas@example.com');
    expect(german.subject).toBe(messageThreadNotificationSubject('DE'));
    expect(german.html).toContain('<html lang="de">');
    expect(german.html).toContain('Postfach öffnen');
  });
});
