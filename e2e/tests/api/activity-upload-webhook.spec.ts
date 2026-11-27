import { type APIRequestContext, expect, test } from '@playwright/test';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { apiHeaders, createAthlete, randomClientIp } from '../../support/api';
import { API_URL, WEB_URL } from '../../support/env';

const FIT = readFileSync(
  path.join(import.meta.dirname, '../../fixtures/synthetic-run.fit'),
);
const connection = `${API_URL}/activity-import/webhook/connection`;
const uploadUrl = `${WEB_URL}/api/activity-import/webhook/upload`;
const calendar = `${API_URL}/event?startDate=2024-05-01&endDate=2024-05-02`;
const boundary = 'rungap-e2e-boundary';

async function generate(
  request: APIRequestContext,
  accessToken: string,
  connector: 'generic' | 'rungap',
) {
  const response = await request.post(`${connection}/${connector}`, {
    headers: apiHeaders(undefined, accessToken),
  });
  expect(response.status(), await response.text()).toBe(200);
  expect(response.headers()['cache-control']).toBe('no-store');
  return (await response.json()) as {
    url: string;
    token: string;
    passkey: string | null;
  };
}

function signedDelivery(passkey: string) {
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="activity"; filename="morning.fit"\r\nContent-Type: application/octet-stream\r\n\r\n`,
    ),
    FIT,
    Buffer.from(
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="metadata"; filename="activity.json"\r\nContent-Type: application/json\r\n\r\n{"title":"Morning run from RunGap"}\r\n--${boundary}--\r\n`,
    ),
  ]);
  return {
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'X-RunGap-HMAC-SHA256': createHmac('sha256', passkey)
        .update(body)
        .digest('hex'),
    },
    data: body,
  };
}

function rawDelivery(token: string, data = FIT) {
  return {
    headers: {
      ...apiHeaders(undefined, token),
      'Content-Type': 'application/octet-stream',
    },
    data,
  };
}

test('queues signed RunGap deliveries for the token owner once', async ({
  request,
}) => {
  const [athlete, other] = await Promise.all([
    createAthlete(request),
    createAthlete(request),
  ]);
  const headers = apiHeaders(undefined, athlete.accessToken);
  expect((await request.get(`${connection}/rungap`)).status()).toBe(401);
  expect(
    await (await request.get(`${connection}/rungap`, { headers })).json(),
  ).toEqual({
    enabled: false,
    lastUploadAt: null,
  });

  const { url, token, passkey } = await generate(
    request,
    athlete.accessToken,
    'rungap',
  );
  expect(url).toBe(`${uploadUrl}/${token}`);
  expect(passkey).toBeTruthy();
  const status = await request.get(`${connection}/rungap`, { headers });
  expect(status.headers()['cache-control']).toBe('no-store');
  expect(await status.json()).toEqual({ enabled: true, lastUploadAt: null });

  const signed = signedDelivery(passkey!);
  const tampered = Buffer.from(signed.data);
  tampered[0] ^= 1;
  const badSignature = await request.post(url, { ...signed, data: tampered });
  const unsigned = await request.post(uploadUrl, rawDelivery(token));
  const invalidToken = await request.post(`${uploadUrl}/expired`, signed);
  for (const rejected of [badSignature, unsigned, invalidToken]) {
    expect(rejected.status()).toBe(401);
    expect(await rejected.json()).toEqual(await invalidToken.json());
  }
  expect(
    await (await request.get(`${connection}/rungap`, { headers })).json(),
  ).toEqual({ enabled: true, lastUploadAt: null });

  const deliveries = await Promise.all([
    request.post(url, signed),
    request.post(url, signed),
  ]);
  for (const delivery of deliveries) {
    expect(delivery.status(), await delivery.text()).toBe(200);
    expect(await delivery.json()).toEqual({ queued: true });
  }
  const receivedStatus = await (
    await request.get(`${connection}/rungap`, { headers })
  ).json();
  expect(receivedStatus).toEqual({
    enabled: true,
    lastUploadAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.*Z$/),
  });
  await expect
    .poll(async () => (await request.get(calendar, { headers })).json())
    .toMatchObject([
      {
        name: 'Morning run from RunGap',
        startDate: '2024-05-01T07:00:00.000Z',
      },
    ]);
  expect(
    await (
      await request.get(calendar, {
        headers: apiHeaders(undefined, other.accessToken),
      })
    ).json(),
  ).toEqual([]);

  const rotated = await generate(request, athlete.accessToken, 'rungap');
  expect(rotated.token).not.toBe(token);
  expect(rotated.passkey).not.toBe(passkey);
  expect((await request.post(url, signed)).status()).toBe(401);
  expect(
    await (await request.get(`${connection}/rungap`, { headers })).json(),
  ).toEqual(receivedStatus);
  expect(
    (await request.delete(`${connection}/rungap`, { headers })).status(),
  ).toBe(204);
  expect(
    (
      await request.post(rotated.url, signedDelivery(rotated.passkey!))
    ).status(),
  ).toBe(401);
  expect(
    await (await request.get(`${connection}/rungap`, { headers })).json(),
  ).toEqual({ enabled: false, lastUploadAt: null });
});

test('queues raw FIT with a bearer token and enforces the file size cap', async ({
  request,
}) => {
  const { accessToken } = await createAthlete(request);
  const { token, passkey } = await generate(request, accessToken, 'generic');
  expect(passkey).toBeNull();

  for (const size of [20 * 1024 * 1024 + 1, 22 * 1024 * 1024]) {
    const large = await request.post(
      uploadUrl,
      rawDelivery(token, Buffer.alloc(size)),
    );
    expect(large.status(), await large.text()).toBe(413);
  }
  const delivery = await request.post(uploadUrl, rawDelivery(token));
  expect(delivery.status(), await delivery.text()).toBe(200);
  await expect
    .poll(async () =>
      (
        await request.get(calendar, {
          headers: apiHeaders(undefined, accessToken),
        })
      ).json(),
    )
    .toMatchObject([
      { name: 'FIT activity', startDate: '2024-05-01T07:00:00.000Z' },
    ]);
});

test('rotates and revokes each connector independently', async ({
  request,
}) => {
  const { accessToken } = await createAthlete(request);
  const headers = apiHeaders(undefined, accessToken);
  const generic = await generate(request, accessToken, 'generic');
  const rungap = await generate(request, accessToken, 'rungap');
  const signed = signedDelivery(rungap.passkey!);
  const nextGeneric = await generate(request, accessToken, 'generic');
  expect(
    (await request.post(uploadUrl, rawDelivery(generic.token))).status(),
  ).toBe(401);
  expect((await request.post(rungap.url, signed)).status()).toBe(200);
  expect(
    (await request.delete(`${connection}/generic`, { headers })).status(),
  ).toBe(204);
  expect(
    (await request.post(uploadUrl, rawDelivery(nextGeneric.token))).status(),
  ).toBe(401);
  expect((await request.post(rungap.url, signed)).status()).toBe(200);

  const activeGeneric = await generate(request, accessToken, 'generic');
  const nextRunGap = await generate(request, accessToken, 'rungap');
  expect((await request.post(rungap.url, signed)).status()).toBe(401);
  expect(
    (await request.post(uploadUrl, rawDelivery(activeGeneric.token))).status(),
  ).toBe(200);
  expect(
    (await request.delete(`${connection}/rungap`, { headers })).status(),
  ).toBe(204);
  expect(
    (
      await request.post(nextRunGap.url, signedDelivery(nextRunGap.passkey!))
    ).status(),
  ).toBe(401);
  expect(
    (await request.post(uploadUrl, rawDelivery(activeGeneric.token))).status(),
  ).toBe(200);
});

test('rate limits the upload endpoint', async ({ request }) => {
  const ip = randomClientIp();
  const url = `${API_URL}/activity-import/webhook/upload`;
  for (let attempt = 0; attempt < 30; attempt++) {
    expect(
      (await request.post(url, { headers: apiHeaders(ip) })).status(),
    ).toBe(401);
  }
  expect((await request.post(url, { headers: apiHeaders(ip) })).status()).toBe(
    429,
  );
});
