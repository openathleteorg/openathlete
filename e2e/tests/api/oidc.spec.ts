import { type APIRequestContext, expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';

import { apiHeaders } from '../../support/api';
import { WEB_URL } from '../../support/env';

// Through the web app's /api, the redirect URI registered at the provider
const OIDC_URL = `${WEB_URL}/api/auth/oidc`;

/** Runs a sign-in through fake-oidc and returns where the API sent the user */
async function signInThroughProvider(
  request: APIRequestContext,
  email: string,
) {
  const start = await request.get(
    `${OIDC_URL}?attempt=551694c1-9c83-4c1e-bbf9-9a191f33b2fb`,
    {
      maxRedirects: 0,
    },
  );
  expect(start.status()).toBe(302);
  const authorize = new URL(start.headers().location);
  expect(authorize.origin).toBe('http://localhost:19000');
  expect(authorize.searchParams.get('code_challenge_method')).toBe('S256');

  const approve = await request.post(`${authorize.origin}/authorize`, {
    form: { ...Object.fromEntries(authorize.searchParams), email },
    maxRedirects: 0,
  });
  const callback = approve.headers().location;
  expect(callback).toBe(
    `${OIDC_URL}/callback?${new URL(callback).searchParams}`,
  );

  // The request context sends the state cookie set at the start
  const back = await request.get(callback, { maxRedirects: 0 });
  expect(back.status()).toBe(302);
  const target = new URL(back.headers().location);
  expect(`${target.origin}${target.pathname}`).toBe(`${WEB_URL}/auth/sso`);
  expect(new URLSearchParams(target.hash.slice(1)).get('attempt')).toBe(
    '551694c1-9c83-4c1e-bbf9-9a191f33b2fb',
  );
  return new URLSearchParams(target.hash.slice(1));
}

test('exchanges a one-time code for a session, once', async ({ request }) => {
  const result = await signInThroughProvider(
    request,
    `sso-${randomUUID()}@example.com`,
  );
  const code = result.get('code');
  expect(code).toBeTruthy();

  const headers = apiHeaders();
  const first = await request.post(`${OIDC_URL}/exchange`, {
    headers,
    data: { code },
  });
  expect(first.status()).toBe(200);
  expect(await first.json()).toEqual({
    accessToken: expect.any(String),
    refreshToken: expect.any(String),
  });

  const again = await request.post(`${OIDC_URL}/exchange`, {
    headers,
    data: { code },
  });
  expect(again.status()).toBe(401);
});

test('refuses a callback without the state of its sign-in', async ({
  playwright,
}) => {
  // A fresh context: no state cookie
  const request = await playwright.request.newContext();
  const back = await request.get(`${OIDC_URL}/callback?code=x&state=y`, {
    maxRedirects: 0,
  });
  expect(back.status()).toBe(302);
  expect(new URL(back.headers().location).hash).toBe('#error=failed');
  await request.dispose();
});
