import { expect, test } from '@playwright/test';

import { apiHeaders, createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

const dayAgo = (days: number) =>
  new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

test('follows a metric, then adds, edits and deletes its values', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  const headers = apiHeaders(undefined, athlete.accessToken);
  // Twenty nights: enough for a baseline
  for (let index = 0; index < 20; index += 1) {
    const response = await request.post(`${API_URL}/metric`, {
      headers,
      data: {
        type: 'HRV_LAST_NIGHT_AVG',
        value: 100 + (index % 2) * 4,
        date: dayAgo(index + 2),
      },
    });
    expect(response.status(), await response.text()).toBe(201);
  }

  const recent = await request.get(
    `${API_URL}/metric?type=HRV_LAST_NIGHT_AVG&from=${dayAgo(5)}`,
    { headers },
  );
  expect(await recent.json()).toHaveLength(4);
  const invalid = await request.get(`${API_URL}/metric?from=soon`, { headers });
  expect(invalid.status()).toBe(400);

  await signIn(page, athlete);
  const problems = trackPageProblems(page);
  await page.goto('/dashboard/metrics');

  // The first pinned metric with data opens at once, against its usual range
  const hrv = page.locator('[data-metric-detail="HRV_LAST_NIGHT_AVG"]');
  await expect(hrv.locator('svg.recharts-surface').first()).toBeVisible();
  await expect(hrv.locator('[data-metric-status="usual"]')).toBeVisible();

  // Several values at once from the quick entry
  await page.getByRole('button', { name: 'Enter my values' }).click();
  const quickEntry = page.getByRole('dialog');
  await quickEntry.getByLabel('Weight (kg)').fill('61,5');
  await quickEntry.getByRole('button', { name: 'Save' }).click();
  await expect(quickEntry).toBeHidden();

  const weightRow = page.locator('[data-metric-row="WEIGHT"]');
  await expect(weightRow).toContainText('61.5');
  await weightRow.click();
  const weight = page.locator('[data-metric-detail="WEIGHT"]');

  await weight.getByRole('button', { name: /^Edit the value/ }).click();
  await expect(weight.getByRole('button', { name: 'Cancel' })).toBeVisible();
  await weight.getByLabel(/^Value/).fill('62');
  await weight.getByRole('button', { name: 'Save' }).click();
  await expect(weightRow).toContainText('62');
  const entries = await request.get(`${API_URL}/metric?type=WEIGHT`, {
    headers,
  });
  expect(await entries.json()).toHaveLength(1);

  // Pinning survives a reload
  await page.locator('[data-metric-row="WEIGHT"]').click();
  await weight.getByRole('button', { name: 'Unpin' }).click();
  await page.reload();
  await expect(hrv).toBeVisible();
  await page.locator('[data-metric-row="WEIGHT"]').click();
  await expect(weight.getByRole('button', { name: 'Pin' })).toBeVisible();

  await weight.getByRole('button', { name: /^Delete the value/ }).click();
  await weight.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(weight.getByText('No value yet')).toBeVisible();

  await page.getByRole('tab', { name: 'Injury Logs' }).click();
  await expect(page.getByText('Injury Logs').nth(1)).toBeVisible();

  expect(problems).toEqual([]);
});
