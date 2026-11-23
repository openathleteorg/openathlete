import { expect, test } from '@playwright/test';

import { apiHeaders, createAthlete } from '../../support/api';
import { API_URL } from '../../support/env';

// The E2E stack runs like a self-hosted instance: no Stripe
test('an instance without billing sells nothing and limits nobody', async ({
  request,
}) => {
  const athlete = await createAthlete(request);
  const headers = apiHeaders(undefined, athlete.accessToken);

  const current = await request.get(`${API_URL}/subscription/current`, {
    headers,
  });
  expect(await current.json()).toMatchObject({
    plan: 'FREE',
    billingEnabled: false,
    maxAthletes: null,
  });

  const checkout = (acceptTerms?: true) =>
    request.post(`${API_URL}/subscription/checkout`, {
      headers,
      data: {
        interval: 'year',
        acceptTerms,
        successUrl: 'https://example.com/ok',
        cancelUrl: 'https://example.com/ko',
      },
    });
  // The terms of sale come first, then there is nothing to sell
  const withoutTerms = await checkout();
  expect(withoutTerms.status()).toBe(400);
  expect(await withoutTerms.json()).toMatchObject({
    message: 'TERMS_NOT_ACCEPTED',
  });
  expect((await checkout(true)).status()).toBe(503);
});

// The transparency page belongs to the hosted instance: a self-hosted one
// publishes no funding figures, and keeps the wall choice private
test('an instance without billing publishes no funding figures', async ({
  request,
}) => {
  const transparency = await request.get(`${API_URL}/transparency`);
  expect(transparency.status()).toBe(503);

  const athlete = await createAthlete(request);
  const headers = apiHeaders(undefined, athlete.accessToken);
  const wall = await request.patch(`${API_URL}/subscription/wall`, {
    headers,
    data: { show: true, name: 'Trail Fox' },
  });
  expect(wall.status(), await wall.text()).toBe(200);
  expect(await wall.json()).toMatchObject({
    showOnSupporterWall: true,
    wallName: 'Trail Fox',
  });
  const tooLong = await request.patch(`${API_URL}/subscription/wall`, {
    headers,
    data: { show: true, name: 'x'.repeat(31) },
  });
  expect(tooLong.status()).toBe(400);
});
