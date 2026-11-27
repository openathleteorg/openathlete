import { createHash, createHmac } from 'node:crypto';

import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType, WebhookConnector } from '@openathlete/shared';

import { PrismaService } from '../../prisma/services/prisma.service';
import { QueueService } from '../../queue/queue.service';
import { ActivityUploadWebhookService } from './activity-upload-webhook.service';

const userId = 17;
const file = Buffer.from('FIT fixture bytes');
const contentType = 'application/octet-stream';

function setup() {
  type Credential = {
    userId: number;
    connector: WebhookConnector;
    tokenHash: string;
    encryptedPasskey: string | null;
  };
  const rows = new Map<WebhookConnector, Credential>();
  const webhook = {
    findUnique: jest.fn(
      async ({
        where,
      }: {
        where: {
          userId_connector?: { userId: number; connector: WebhookConnector };
          tokenHash?: string;
        };
      }) =>
        where.userId_connector
          ? rows.get(where.userId_connector.connector)
          : [...rows.values()].find((row) => row.tokenHash === where.tokenHash),
    ),
    upsert: jest.fn(async ({ create }: { create: Credential }) => {
      rows.set(create.connector, create);
    }),
    updateMany: jest.fn(),
    deleteMany: jest.fn(
      async ({ where }: { where: { connector: WebhookConnector } }) => {
        rows.delete(where.connector);
      },
    ),
  };
  const prisma = {
    activityUploadWebhook: webhook,
    athlete: { findUnique: jest.fn().mockResolvedValue({ athleteId: 41 }) },
  };
  const queue = { addWebhookFitImportJob: jest.fn() };
  const config = new ConfigService<ApiEnvSchemaType, true>({
    HASH_PEPPER: 'pepper-for-the-test-instance',
    APP_URL: 'https://app.example',
  });
  const service = new ActivityUploadWebhookService(
    prisma as unknown as PrismaService,
    config,
    queue as unknown as QueueService,
  );
  return { service, webhook, queue };
}

describe('ActivityUploadWebhookService', () => {
  it('returns credentials on generation and stores a hash and encrypted passkey', async () => {
    const { service, webhook } = setup();
    expect(await service.status(userId, 'rungap')).toEqual({
      enabled: false,
      lastUploadAt: null,
    });
    const { url, token, passkey } = await service.generate(userId, 'rungap');
    expect(url).toBe(
      `https://app.example/api/activity-import/webhook/upload/${token}`,
    );
    const [{ create }] = webhook.upsert.mock.calls[0];
    expect(create.tokenHash).toBe(
      createHash('sha256').update(token).digest('hex'),
    );
    expect(create.encryptedPasskey).toMatch(/^v1:/);
    expect(create.encryptedPasskey).not.toContain(passkey);
    expect(await service.status(userId, 'rungap')).toEqual({
      enabled: true,
      lastUploadAt: null,
    });
  });

  it('looks up only the hash and rejects rotated and revoked credentials', async () => {
    const { service, webhook, queue } = setup();
    const first = await service.generate(userId, 'generic');
    const replacement = await service.generate(userId, 'generic');
    expect(replacement.token).not.toBe(first.token);
    await expect(
      service.receive(first.token, file, contentType, undefined),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      service.receive(replacement.token, file, contentType, undefined),
    ).resolves.toEqual({ queued: true });
    expect(webhook.findUnique).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          tokenHash: createHash('sha256')
            .update(replacement.token)
            .digest('hex'),
        },
      }),
    );
    expect(queue.addWebhookFitImportJob).toHaveBeenCalledWith(
      userId,
      file,
      'FIT activity',
    );
    await service.revoke(userId, 'generic');
    await expect(
      service.receive(replacement.token, file, contentType, undefined),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(queue.addWebhookFitImportJob).toHaveBeenCalledTimes(1);
  });

  it('requires a signature over the exact bytes when a passkey is set', async () => {
    const { service, queue } = setup();
    const { token, passkey } = await service.generate(userId, 'rungap');
    const signature = createHmac('sha256', passkey!).update(file).digest('hex');
    const wrongKey = createHmac('sha256', 'wrong-key')
      .update(file)
      .digest('hex');
    for (const invalid of [undefined, 'abcd', wrongKey]) {
      await expect(
        service.receive(token, file, contentType, invalid),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    }
    await expect(
      service.receive(
        token,
        Buffer.from('changed bytes'),
        contentType,
        signature,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(queue.addWebhookFitImportJob).not.toHaveBeenCalled();
    await expect(
      service.receive(token, file, contentType, signature),
    ).resolves.toEqual({ queued: true });
  });

  it('returns a safe retryable response if the queue cannot accept the upload', async () => {
    const { service, webhook, queue } = setup();
    const { token } = await service.generate(userId, 'generic');
    queue.addWebhookFitImportJob.mockRejectedValue(
      new Error('Redis command details'),
    );
    await expect(
      service.receive(token, file, contentType, undefined),
    ).rejects.toThrow(
      new ServiceUnavailableException('Could not queue the FIT upload'),
    );
    expect(webhook.updateMany).not.toHaveBeenCalled();
  });

  it('acknowledges the queued upload if recording its timestamp fails', async () => {
    const { service, webhook } = setup();
    const { token } = await service.generate(userId, 'generic');
    webhook.updateMany.mockRejectedValue(new Error('Database unavailable'));

    await expect(
      service.receive(token, file, contentType, undefined),
    ).resolves.toEqual({ queued: true });
  });
});
