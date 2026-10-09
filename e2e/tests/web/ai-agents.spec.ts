import { expect, test } from '@playwright/test';
import { createHash, randomBytes } from 'node:crypto';

import { apiHeaders, createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL, WEB_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

test('a personal token is created once, listed, then revoked', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  await signIn(page, athlete);
  const problems = trackPageProblems(page);

  await page.goto('/dashboard/settings?tab=agents');
  await expect(page.locator('[data-mcp-url]')).toHaveText(`${WEB_URL}/api/mcp`);
  await expect(page.getByText('No agent is connected yet.')).toBeVisible();

  await page.getByRole('button', { name: 'Create a token' }).click();
  const dialog = page.locator('[data-create-token-dialog]');
  await dialog.getByLabel('Name').fill('Training script');
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  const token = (await dialog.locator('[data-created-token]').textContent())!;
  expect(token).toMatch(/^oa_pat_/);
  await dialog.getByRole('button', { name: 'Done' }).click();

  const row = page.locator('[data-mcp-connection="Training script"]');
  await expect(row).toContainText('Read and write');
  await expect(row).toContainText(`••••${token.slice(-4)}`);
  await expect(row).toContainText('Never used');

  // The token works until it is revoked
  const tools = () =>
    request.post(`${API_URL}/mcp`, {
      headers: {
        ...apiHeaders(undefined, token),
        Accept: 'application/json, text/event-stream',
      },
      data: { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} },
    });
  expect((await tools()).status()).toBe(200);

  await row.getByRole('button', { name: 'Revoke Training script' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('Access revoked')).toBeVisible();
  await expect(row).toHaveCount(0);
  expect((await tools()).status()).toBe(401);
  expect(problems).toEqual([]);
});

test('an agent asking for access is approved on the consent page', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  const redirect = 'http://127.0.0.1:33419/callback';
  const client = await (
    await request.post(`${API_URL}/oauth/register`, {
      headers: apiHeaders(),
      data: {
        client_name: 'Coach Bot',
        client_uri: 'https://coach-bot.example',
        redirect_uris: [redirect],
      },
    })
  ).json();
  const verifier = randomBytes(32).toString('base64url');
  const query = new URLSearchParams({
    response_type: 'code',
    client_id: client.client_id,
    redirect_uri: redirect,
    code_challenge: createHash('sha256').update(verifier).digest('base64url'),
    code_challenge_method: 'S256',
    scope: 'read write',
    state: 'browser-state',
  });

  await signIn(page, athlete);
  const problems = trackPageProblems(page);
  // The agent's callback, which would be the agent's own server
  let callback: URL | null = null;
  await page.route(`${redirect}**`, (route) => {
    callback = new URL(route.request().url());
    return route.fulfill({ status: 200, body: 'Connected' });
  });

  // The agent opens the authorization endpoint; the API hands over to the app
  await page.goto(`${WEB_URL}/api/oauth/authorize?${query}`);
  await expect(page).toHaveURL(/\/oauth\/authorize\?/);
  const consent = page.locator('[data-oauth-consent]');
  await expect(consent).toContainText(
    'Coach Bot wants to access your OpenAthlete account',
  );
  await expect(consent).toContainText('coach-bot.example');
  await expect(consent.locator('[data-oauth-permissions] li')).toHaveCount(2);
  await expect(consent).toContainText('127.0.0.1:33419');

  await page.getByRole('button', { name: 'Allow' }).click();
  await expect
    .poll(() => callback?.searchParams.get('state'))
    .toBe('browser-state');
  const code = callback!.searchParams.get('code')!;

  const tokens = await request.post(`${API_URL}/oauth/token`, {
    headers: apiHeaders(),
    form: {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirect,
      client_id: client.client_id,
      code_verifier: verifier,
    },
  });
  expect(tokens.status()).toBe(200);

  // The agent shows in the settings
  await page.unroute(`${redirect}**`);
  await page.goto('/dashboard/settings?tab=agents');
  await expect(page.locator('[data-mcp-connection="Coach Bot"]')).toContainText(
    'coach-bot.example',
  );
  expect(problems).toEqual([]);
});

test('an invalid authorization request is shown, never redirected', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  await signIn(page, athlete);

  await page.goto(
    '/oauth/authorize?client_id=unknown&redirect_uri=https://evil.example/cb&response_type=code',
  );
  await expect(page.locator('[data-oauth-invalid]')).toContainText(
    'Invalid connection request',
  );
  await expect(page).toHaveURL(/\/oauth\/authorize/);
});
