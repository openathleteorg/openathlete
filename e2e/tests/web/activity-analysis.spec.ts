import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { apiHeaders, createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

// A synthetic 10-minute run with heart rate and altitude, on 2 May 2024
const GPX = readFileSync(
  path.join(import.meta.dirname, '../../fixtures/synthetic-run.gpx'),
);

test('reads an activity against its plan, step by step and part by part', async ({
  page,
  request,
}) => {
  test.setTimeout(60_000);
  const athlete = await createAthlete(request);
  const headers = apiHeaders(undefined, athlete.accessToken);
  const imported = await request.post(`${API_URL}/activity-import/gpx`, {
    headers,
    multipart: {
      file: {
        name: 'run.gpx',
        mimeType: 'application/octet-stream',
        buffer: GPX,
      },
      name: 'Morning run',
      sport: 'RUNNING',
    },
  });
  expect(imported.status(), await imported.text()).toBe(201);
  const { eventId: activityId } = (await imported.json()) as {
    eventId: number;
  };

  const session = await request.post(`${API_URL}/event`, {
    headers,
    data: {
      type: 'TRAINING',
      name: 'Steady run',
      sport: 'RUNNING',
      description: '',
      goalDuration: 10 * 60,
      startDate: '2024-05-02T06:00:00.000Z',
      endDate: '2024-05-02T07:00:00.000Z',
      workout: {
        steps: [
          { stepType: 'WARMUP', durationType: 'TIME', durationValue: 300 },
          {
            stepType: 'STEADY',
            durationType: 'TIME',
            durationValue: 300,
            targets: [
              { targetType: 'HEARTRATE', targetMin: 135, targetMax: 155 },
            ],
          },
        ],
      },
    },
  });
  expect(session.status(), await session.text()).toBe(201);
  const { eventId: sessionId } = (await session.json()) as { eventId: number };
  const link = await request.post(
    `${API_URL}/event/${sessionId}/related-activity/${activityId}`,
    { headers },
  );
  expect(link.ok(), await link.text()).toBe(true);

  await signIn(page, athlete);
  const problems = trackPageProblems(page);
  await page.goto(`/dashboard/activity/${activityId}`);

  // The session it was planned as, graded like its calendar card
  const banner = page.locator('[data-plan-banner]');
  await expect(banner).toContainText('Planned as Steady run');
  await expect(banner).toHaveAttribute('data-plan-banner', 'complete');
  await expect(banner).toContainText('1 of 1 work steps on target');

  // Each planned step, against its target
  const laps = page.locator('[data-laps-card="plan"]');
  await expect(laps.locator('[data-lap-row]')).toHaveCount(2);
  await expect(laps.locator('[data-step-compliance="in"]')).toContainText(
    '135–155 bpm',
  );

  // Time in the athlete's zones: the default heart rate zones here
  const zones = page.locator('[data-zones-card="heartrate"]');
  await expect(zones.locator('[data-zone]')).toHaveCount(5);
  await expect(zones.locator('[data-zones-selection]')).toHaveCount(0);

  // A step selects its part on the charts, and the zones follow it
  await laps.locator('[data-lap-row]').nth(1).click();
  const selection = page.locator('[data-selection-stats]');
  await expect(selection).toBeVisible();
  await expect(selection).toContainText('5:00');
  await expect(zones.locator('[data-zones-selection]')).toBeVisible();
  await selection
    .getByRole('button', { name: 'Show the whole activity' })
    .click();
  await expect(selection).toBeHidden();

  // So does a drag across the charts, on either axis
  const chart = page.locator('[data-activity-streams-chart]');
  await chart.getByRole('button', { name: 'Time', exact: true }).click();
  await expect(
    chart.getByRole('button', { name: 'Time', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  const plot = chart.locator('[data-chart-plot]');
  const box = (await plot.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.5, box.y + 30);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 1, box.y + 30, { steps: 5 });
  await page.mouse.up();
  await expect(selection).toContainText(/Selection\s*5:00/);

  // The Conditions tab needs weather or normalization factors. This run has no
  // weather, so the reload below must wait for the worker's factors
  await expect
    .poll(
      async () => {
        const response = await request.get(
          `${API_URL}/event/${activityId}/normalization`,
          { headers },
        );
        expect(response.ok(), await response.text()).toBe(true);
        const { factors } = (await response.json()) as { factors: unknown[] };
        return factors.length;
      },
      { timeout: 20_000 },
    )
    .toBeGreaterThan(0);

  // Hidden tracks stay hidden the next time
  await chart.locator('[data-track-toggle="altitude"]').click();
  await expect(chart.locator('[data-track="altitude"]')).toHaveCount(0);
  await page.reload();
  await expect(
    page.locator('[data-activity-streams-chart] [data-track="heartrate"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-activity-streams-chart] [data-track="altitude"]'),
  ).toHaveCount(0);

  // What the conditions cost, on their own tab
  await page.getByRole('tab', { name: 'Conditions' }).click();
  await expect(page.locator('[data-normalization]')).toBeVisible();

  expect(problems).toEqual([]);
});
