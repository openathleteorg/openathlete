import { ConfigService } from '@nestjs/config';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { ResendContactsService } from './resend-contacts.service';

const fetchMock = jest.fn();
beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

const ok = () => new Response('{}', { status: 200 });
const notFound = () => new Response('{}', { status: 404 });

function setup(
  user: object | null,
  env: Record<string, string> = {
    RESEND_API_KEY: 'k',
    RESEND_NEWS_SEGMENT_ID: 'seg_1',
  },
) {
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue(user),
      findMany: jest.fn().mockResolvedValue([{ userId: 1 }, { userId: 2 }]),
    },
  };
  const service = new ResendContactsService(
    prisma as unknown as PrismaService,
    { get: (key: string) => env[key] } as unknown as ConfigService<never, true>,
  );
  return { service, prisma };
}

const consenting = {
  email: 'ana@example.com',
  language: 'FR',
  firstName: 'Ana',
  emailNewsConsentAt: new Date(),
  coachAthletes: [],
};

const call = (n: number) => {
  const [url, init] = fetchMock.mock.calls[n] as [string, RequestInit];
  return {
    url,
    method: init.method,
    body: init.body ? JSON.parse(init.body as string) : undefined,
  };
};

describe('ResendContactsService', () => {
  it('does nothing without the key or the segment', async () => {
    const { service } = setup(consenting, { RESEND_API_KEY: 'k' });
    await expect(service.sync(1)).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('creates the contact of a person who gave consent', async () => {
    fetchMock.mockResolvedValueOnce(notFound()).mockResolvedValueOnce(ok());
    const { service } = setup({
      ...consenting,
      coachAthletes: [{ athleteId: 3 }],
    });

    await expect(service.sync(1)).resolves.toBe(true);

    expect(call(1)).toEqual({
      url: 'https://api.resend.com/contacts',
      method: 'POST',
      body: {
        email: 'ana@example.com',
        unsubscribed: false,
        first_name: 'Ana',
        properties: { language: 'FR', role: 'coach' },
        segments: [{ id: 'seg_1' }],
      },
    });
  });

  it('updates a known contact and keeps it in the segment', async () => {
    fetchMock.mockResolvedValue(ok());
    const { service } = setup(consenting);
    await service.sync(1);
    expect(call(0).method).toBe('PATCH');
    expect(call(0).body).toMatchObject({
      unsubscribed: false,
      properties: { language: 'FR', role: 'athlete' },
    });
    expect(call(1).url).toBe(
      'https://api.resend.com/contacts/ana%40example.com/segments/seg_1',
    );
  });

  it('unsubscribes the contact when the consent is withdrawn', async () => {
    fetchMock.mockResolvedValue(ok());
    const { service } = setup({ ...consenting, emailNewsConsentAt: null });
    await service.sync(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(call(0)).toMatchObject({
      method: 'PATCH',
      body: { unsubscribed: true },
    });
  });

  it('deletes the contact of a deleted account, and ignores an unknown one', async () => {
    fetchMock.mockResolvedValue(notFound());
    const { service } = setup(null);
    await service.remove('ana@example.com');
    expect(call(0)).toMatchObject({
      method: 'DELETE',
      url: 'https://api.resend.com/contacts/ana%40example.com',
    });
  });

  it('never throws when Resend fails', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 500 }));
    const { service } = setup(consenting);
    await expect(service.sync(1)).resolves.toBe(false);
    await expect(service.remove('ana@example.com')).resolves.toBeUndefined();
  });

  it('syncs every consenting account, and counts the failures', async () => {
    fetchMock.mockResolvedValue(ok());
    const { service } = setup(consenting);
    await expect(service.syncAll()).resolves.toEqual({
      total: 2,
      synced: 2,
      failed: 0,
    });
  });
});
