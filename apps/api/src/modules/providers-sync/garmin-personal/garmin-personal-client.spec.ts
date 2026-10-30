import axios from 'axios';

import {
  GarminPersonalClient,
  activityListSchema,
} from './garmin-personal-client';

jest.mock('axios');
const request = axios.request as jest.Mock;
const jwt = (exp = Math.floor(Date.now() / 1000) + 86400) =>
  `header.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.signature`;
const credentials = {
  apiKey: 'synthetic-personal-key',
  token: 'synthetic-token',
  expiresAt: Date.now() + 86400000,
};

describe('Garmin documented Personal API transport', () => {
  const client = new GarminPersonalClient();
  beforeEach(() => {
    jest.resetAllMocks();
    (axios.isAxiosError as unknown as jest.Mock).mockImplementation(
      (e) => e?.isAxiosError === true,
    );
  });
  it('exchanges the key for the raw JWT returned by Garmin, without OAuth refresh', async () => {
    const token = jwt();
    request.mockResolvedValue({ data: token });
    expect(await client.authorize(credentials.apiKey)).toMatchObject({
      apiKey: credentials.apiKey,
      token,
    });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: 'https://personal.connectapi.garmin.com/personalapitoken-service/personal-api/personal-api-key/token',
        headers: expect.objectContaining({
          Authorization: `ApiKey ${credentials.apiKey}`,
        }),
        maxRedirects: 0,
      }),
    );
  });
  it.each(['not-a-token', jwt(1), JSON.stringify({ access_token: jwt() })])(
    'rejects malformed/expired token responses',
    async (data) => {
      request.mockResolvedValue({ data });
      await expect(client.authorize(credentials.apiKey)).rejects.toMatchObject({
        code: 'invalid_response',
      });
    },
  );
  it('uses documented date filters and pagination with Bearer authentication', async () => {
    request.mockResolvedValue({
      data: JSON.stringify([
        { activityId: 123, activityName: 'Synthetic ride' },
      ]),
    });
    expect(
      await client.activities(credentials, '2026-01-01', '2026-01-28', 100),
    ).toEqual([{ activityId: '123', activityName: 'Synthetic ride' }]);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          start: 100,
          limit: 100,
          startDate: '2026-01-01',
          endDate: '2026-01-28',
          excludeChildren: 'true',
        }),
        headers: expect.objectContaining({
          Authorization: 'Bearer synthetic-token',
        }),
      }),
    );
  });
  it('returns ZIP bytes and rejects unsafe or imprecise IDs', async () => {
    request.mockResolvedValue({ data: Buffer.from('synthetic zip') });
    expect(await client.download(credentials, '123')).toEqual(
      Buffer.from('synthetic zip'),
    );
    expect(request.mock.calls[0][0].responseType).toBe('arraybuffer');
    // Garmin returns application/x-zip-compressed and rejects application/zip-only requests.
    expect(request.mock.calls[0][0].headers.Accept).toBe('*/*');
    await expect(client.download(credentials, '../profile')).rejects.toThrow();
    expect(
      activityListSchema.safeParse([
        { activityId: Number.MAX_SAFE_INTEGER + 1 },
      ]).success,
    ).toBe(false);
  });
  it.each([
    [401, 'key_required'],
    [403, 'access_denied'],
    [429, 'rate_limited'],
    [500, 'unavailable'],
  ])(
    'sanitizes upstream HTTP %s without exposing credentials or body',
    async (status, code) => {
      request.mockRejectedValue({
        isAxiosError: true,
        response: { status, data: credentials.apiKey },
        config: { headers: { Authorization: credentials.apiKey } },
      });
      try {
        await client.get(
          credentials,
          '/userprofile-service/userprofile/settings',
        );
        throw new Error('Expected failure');
      } catch (error) {
        expect(error).toMatchObject({ code });
        expect(JSON.stringify(error)).not.toContain(credentials.apiKey);
      }
    },
  );
  it('treats a rejected key exchange as a key problem but not a forbidden activity download', async () => {
    request.mockRejectedValue({
      isAxiosError: true,
      response: { status: 403 },
    });
    await expect(client.authorize(credentials.apiKey)).rejects.toMatchObject({
      code: 'key_required',
    });
    await expect(client.download(credentials, '123')).rejects.toMatchObject({
      code: 'access_denied',
    });
    expect(request).toHaveBeenCalledTimes(2);
  });
  it('rejects unexpected pagination envelopes and oversized pages', async () => {
    request.mockResolvedValueOnce({ data: '{}' }).mockResolvedValueOnce({
      data: JSON.stringify(
        Array.from({ length: 101 }, (_, i) => ({ activityId: i + 1 })),
      ),
    });
    await expect(
      client.activities(credentials, '2026-01-01', '2026-01-02', 0),
    ).rejects.toMatchObject({ code: 'invalid_response' });
    await expect(
      client.activities(credentials, '2026-01-01', '2026-01-02', 0),
    ).rejects.toMatchObject({ code: 'invalid_response' });
  });
});
