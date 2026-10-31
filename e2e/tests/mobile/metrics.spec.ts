import { expect, test } from '@playwright/test';

import { apiHeaders, createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

test('opens a metric as a full screen, without sideways scrolling', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  for (let index = 0; index < 20; index += 1) {
    const date = new Date(Date.now() - (index + 2) * 86_400_000);
    const response = await request.post(`${API_URL}/metric`, {
      headers: apiHeaders(undefined, athlete.accessToken),
      data: {
        type: 'SLEEP_DURATION',
        value: 7 + (index % 3) * 0.5,
        date: date.toISOString().slice(0, 10),
      },
    });
    expect(response.status(), await response.text()).toBe(201);
  }
  await signIn(page, athlete);
  const problems = trackPageProblems(page);

  await page.goto('/dashboard/metrics');
  await page.locator('[data-metric-row="SLEEP_DURATION"]').click();

  const detail = page.locator('[data-metric-detail="SLEEP_DURATION"]');
  await expect(detail.locator('svg.recharts-surface').first()).toBeVisible();
  await expect
    .poll(async () => (await page.getByRole('dialog').boundingBox())?.y)
    .toBe(0);
  const overflow = await detail.evaluate(
    (element) => element.scrollWidth - element.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  expect(problems).toEqual([]);
});
