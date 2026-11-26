import { createHmac } from 'node:crypto';

import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { ResendContactsService } from '../services/resend-contacts.service';
import { ResendWebhookController } from './resend-webhook.controller';

const SECRET = 'whsec_c2VjcmV0';

function setup(secret: string | undefined = SECRET) {
  const prisma = {
    user: {
      findFirst: jest.fn().mockResolvedValue({ userId: 7 }),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const analytics = { capture: jest.fn() };
  const contacts = { sync: jest.fn().mockResolvedValue(true) };
  const controller = new ResendWebhookController(
    prisma as unknown as PrismaService,
    { get: () => secret } as unknown as ConfigService<never, true>,
    analytics as unknown as AnalyticsService,
    contacts as unknown as ResendContactsService,
  );
  return { controller, prisma, analytics, contacts };
}

/** A request signed like Resend does */
function signed(event: object) {
  const rawBody = Buffer.from(JSON.stringify(event));
  const id = 'msg_1';
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac('sha256', Buffer.from('c2VjcmV0', 'base64'))
    .update(`${id}.${timestamp}.`)
    .update(rawBody)
    .digest('base64');
  return {
    req: { rawBody } as never,
    id,
    timestamp,
    signature: `v1,${signature}`,
  };
}

const handle = (controller: ResendWebhookController, event: object) => {
  const { req, id, timestamp, signature } = signed(event);
  return controller.handle(req, id, timestamp, signature);
};

describe('ResendWebhookController', () => {
  it('answers 503 without a secret', async () => {
    const { controller } = setup('');
    await expect(handle(controller, {})).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('answers 400 to a wrong signature', async () => {
    const { controller, prisma } = setup();
    const { req, id, timestamp } = signed({ type: 'email.complained' });
    await expect(
      controller.handle(req, id, timestamp, 'v1,AAAA'),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('turns every optional list off after a complaint', async () => {
    const { controller, prisma, analytics, contacts } = setup();
    await handle(controller, {
      type: 'email.complained',
      data: { to: ['Ana@example.com'] },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { userId: 7 },
      data: {
        emailTips: false,
        emailRecap: false,
        emailWeekly: false,
        emailCoachWeekly: false,
        emailNewsConsentAt: null,
      },
    });
    expect(analytics.capture).toHaveBeenCalledWith(7, 'email_complained');
    // The Resend contact follows the cleared consent
    expect(contacts.sync).toHaveBeenCalledWith(7);
  });

  it('records a permanent bounce and ignores a temporary one', async () => {
    const { controller, analytics } = setup();
    await handle(controller, {
      type: 'email.bounced',
      data: { to: ['ana@example.com'], bounce: { type: 'Transient' } },
    });
    expect(analytics.capture).not.toHaveBeenCalled();

    await handle(controller, {
      type: 'email.bounced',
      data: { to: ['ana@example.com'], bounce: { type: 'Permanent' } },
    });
    expect(analytics.capture).toHaveBeenCalledWith(7, 'email_bounced', {
      bounce_type: 'Permanent',
    });
  });

  it('clears the news consent of an unsubscribed contact', async () => {
    const { controller, prisma } = setup();
    await handle(controller, {
      type: 'contact.updated',
      data: { email: 'ana@example.com', unsubscribed: true },
    });
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: {
        email: { equals: 'ana@example.com', mode: 'insensitive' },
        emailNewsConsentAt: { not: null },
      },
      data: { emailNewsConsentAt: null },
    });
  });

  it('leaves a contact that stays subscribed alone', async () => {
    const { controller, prisma } = setup();
    await handle(controller, {
      type: 'contact.updated',
      data: { email: 'ana@example.com', unsubscribed: false },
    });
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });
});
