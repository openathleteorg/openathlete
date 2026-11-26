import { expect, test } from '@playwright/test';

import { apiHeaders, createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';

test.use({ storageState: { cookies: [], origins: [] } });

test('the profile keeps the unit system the user chose', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  await signIn(page, athlete);
  await page.goto('/dashboard/settings?tab=profile');

  await page.getByRole('combobox', { name: 'Unit system' }).click();
  await page.getByRole('option', { name: 'Imperial (mi, lb)' }).click();
  const saved = page.waitForResponse(
    (response) =>
      response.url().endsWith('/user') &&
      response.request().method() === 'PATCH',
  );
  await page.getByRole('button', { name: 'Update', exact: true }).click();
  expect((await saved).ok()).toBe(true);

  const headers = apiHeaders(undefined, athlete.accessToken);
  const me = await (
    await request.get(`${API_URL}/user/me`, { headers })
  ).json();
  expect(me.unitSystem).toBe('IMPERIAL');

  // Back on the profile: the choice is what the form shows, not the session's
  await page.reload();
  await expect(
    page.getByRole('combobox', { name: 'Unit system' }),
  ).toContainText('Imperial');
});

interface StoredStep {
  durationType: string;
  durationValue: number | null;
  orderIndex: number;
  targets: { targetType: string; targetValue: number | null }[];
  repeatBlock?: { childSteps: StoredStep[] } | null;
}

test('an imperial athlete plans and logs in miles, stored in metres', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  const headers = apiHeaders(undefined, athlete.accessToken);
  const updated = await request.patch(`${API_URL}/user`, {
    headers,
    data: { unitSystem: 'IMPERIAL' },
  });
  expect(updated.ok()).toBe(true);
  await signIn(page, athlete);
  await page.goto('/dashboard/calendar');
  const openDay = async (index: number, item: string) => {
    const day = page.locator('[data-calendar-day]').nth(index);
    await day.hover();
    await day.locator('[data-calendar-day-plan]').click();
    await page.getByRole('menuitem', { name: item }).click();
    return page.getByRole('dialog');
  };

  // An activity logged by hand: the distance is typed in miles
  let form = await openDay(9, 'Add an activity');
  await form.getByLabel('Event Name').fill('Easy run');
  await form.getByLabel('Distance').fill('5');
  await form.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(
    page.locator('.calendar-event', { hasText: 'Easy run' }),
  ).toContainText('5 mi');

  // A session typed in miles and per-mile paces, with 400 m track reps
  form = await openDay(10, 'Plan a training');
  const quick = form.locator('[data-quick-add]');
  for (const line of ["15' Z2", "4x(1mi 7:30/mi / 2' Z1)", "4x(400m / 1')"]) {
    await quick.fill(line);
    await quick.press('Enter');
  }
  await expect(form.locator('[data-session-name]')).toHaveValue(
    '4 × 1 mi · 4 × 400 m',
  );
  // The text reads back as typed: nothing turned into 437 yd or 4:40/km
  await form.locator('[data-builder-mode="text"]').click();
  await expect(form.getByLabel('Session as text')).toHaveValue(
    '- 15m Z2\n\n4x\n- 1mi 7:30/mi\n- 2m Z1\n\n4x\n- 400m\n- 1m',
  );
  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname.endsWith('/event'),
  );
  await form.getByRole('button', { name: 'Create', exact: true }).click();
  expect((await saved).ok()).toBe(true);

  const events = (await (
    await request.get(`${API_URL}/event`, { headers })
  ).json()) as { eventId: number; name: string; distance: number | null }[];
  const run = events.find((event) => event.name === 'Easy run')!;
  expect(run.distance).toBeCloseTo(5 * 1609.344, 0);

  const session = events.find((event) => event.name !== 'Easy run')!;
  const stored = (await (
    await request.get(`${API_URL}/event/${session.eventId}`, { headers })
  ).json()) as { workout: { steps: StoredStep[] } };
  const sets = stored.workout.steps
    .filter((step) => step.repeatBlock)
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((step) =>
      [...step.repeatBlock!.childSteps].sort(
        (a, b) => a.orderIndex - b.orderIndex,
      ),
    );
  expect(sets[0][0].durationValue).toBeCloseTo(1609.34, 2);
  // 7:30/mi in metres per second
  expect(sets[0][0].targets[0].targetValue).toBeCloseTo(1609.344 / 450, 4);
  expect(sets[1][0].durationValue).toBe(400);
});
