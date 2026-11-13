import { type Page, expect, test } from '@playwright/test';

import { apiHeaders, createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

async function planTraining(page: Page) {
  await page.goto('/dashboard/calendar');
  const day = page.locator('[data-calendar-day]').nth(9);
  await day.hover();
  await day.locator('[data-calendar-day-plan]').click();
  await page.getByRole('menuitem', { name: 'Plan a training' }).click();
  return page.getByRole('dialog');
}

interface StoredStep {
  stepType: string;
  durationType: string;
  durationValue: number | null;
  exerciseRef?: string | null;
  repeatBlock?: { repetitions: number; kind: string; childSteps: StoredStep[] };
}

test('a structured run is typed in a few seconds and saved as written', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  await signIn(page, athlete);
  const problems = trackPageProblems(page);
  const form = await planTraining(page);

  const quick = form.locator('[data-quick-add]');
  for (const line of ["15' Z2", "6x(1km Z4 / 2' Z1)", "10' Z1"]) {
    await quick.fill(line);
    await quick.press('Enter');
  }

  // Warm-up and cool-down come from their place around the efforts
  const rows = form.locator('[data-step-row]');
  await expect(rows).toHaveCount(4);
  await expect(rows.first().locator('[data-step-type]')).toHaveText('Warm-up');
  await expect(rows.last().locator('[data-step-type]')).toHaveText('Cool-down');
  await expect(form.locator('[data-repeat-count]')).toHaveValue('6');
  // The session is named after its main set until the coach names it
  await expect(form.locator('[data-session-name]')).toHaveValue('6 × 1 km');

  // The repeat count edits in place; undo takes it back
  await form.getByRole('button', { name: 'One more' }).click();
  await expect(form.locator('[data-repeat-count]')).toHaveValue('7');
  await form.getByRole('button', { name: 'Undo' }).click();
  await expect(form.locator('[data-repeat-count]')).toHaveValue('6');

  // The same session, as text
  await form.locator('[data-builder-mode="text"]').click();
  await expect(form.getByLabel('Session as text')).toHaveValue(
    '- 15m Z2\n\n6x\n- 1km Z4\n- 2m Z1\n\n- 10m Z1',
  );

  // The calendar shows the session before the API answers: wait for the save
  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname.endsWith('/event'),
  );
  await form.getByRole('button', { name: 'Create', exact: true }).click();
  expect((await saved).ok()).toBe(true);
  await expect(
    page.locator('.calendar-event', { hasText: '6 × 1 km' }),
  ).toBeVisible();

  const events = (await (
    await request.get(`${API_URL}/event`, {
      headers: apiHeaders(undefined, athlete.accessToken),
    })
  ).json()) as { eventId: number }[];
  const stored = (await (
    await request.get(`${API_URL}/event/${events[0].eventId}`, {
      headers: apiHeaders(undefined, athlete.accessToken),
    })
  ).json()) as { workout: { steps: StoredStep[] } };
  const steps = [...stored.workout.steps].sort(
    (a, b) =>
      (a as never as { orderIndex: number }).orderIndex -
      (b as never as { orderIndex: number }).orderIndex,
  );
  expect(steps.map((step) => step.stepType)).toEqual([
    'WARMUP',
    'REPEAT',
    'COOLDOWN',
  ]);
  expect(steps[1].repeatBlock).toMatchObject({ repetitions: 6 });
  expect(problems).toEqual([]);
});

test('a session written as text comes back as blocks', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  await signIn(page, athlete);
  const problems = trackPageProblems(page);
  const form = await planTraining(page);

  await form.locator('[data-builder-mode="text"]').click();
  const text = form.getByLabel('Session as text');
  await text.fill('- 10m Z1\n- 4x(3m Z4 / 90s Z1)\n- vite');
  // The line it cannot read is pointed at, the blocks wait for a clean text
  await expect(form.getByText('Line 3')).toBeVisible();
  await text.fill('- 10m Z1\n- 4x(3m Z4 / 90s Z1)\n- 5m Z1');
  await expect(
    form.getByText('One step per line', { exact: false }),
  ).toBeVisible();

  await form.locator('[data-builder-mode="blocks"]').click();
  await expect(form.locator('[data-step-row]')).toHaveCount(4);
  await expect(form.locator('[data-repeat-count]')).toHaveValue('4');
  await expect(form.locator('[data-builder-total]')).toHaveText('33 min');
  expect(problems).toEqual([]);
});

test('a strength session is built from the exercise library', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  await signIn(page, athlete);
  const problems = trackPageProblems(page);
  const form = await planTraining(page);

  await form.getByRole('radio', { name: /Strength/ }).click();
  const quick = form.locator('[data-strength-quick]');
  await quick.fill("barbell squat 3x5 @80kg r2'");
  await expect(
    form.getByText('→ Barbell full squat', { exact: false }),
  ).toBeVisible();
  await quick.press('Enter');

  // A superset of two exercises picked in the library
  await form.locator('[data-add-group]').click();
  await page.getByRole('menuitem', { name: /Superset/ }).click();
  const picker = page.locator('[data-exercise-picker]');
  await picker.locator('[data-exercise-search]').fill('pull-up');
  await picker.locator('[data-exercise-option="c:pull-up"]').click();
  await picker.locator('[data-exercise-search]').fill('push-up');
  await picker.locator('[data-exercise-option="c:push-up"]').click();
  await picker.locator('[data-exercise-picker-done]').click();

  await expect(
    form.locator('[data-strength-block="exercise"] [data-set-row]'),
  ).toHaveCount(3);
  await expect(form.locator('[data-group-member]')).toHaveCount(2);
  await expect(form.locator('[data-session-name]')).toHaveValue(
    'Barbell full squat, Pull-up, Push-up',
  );
  // The calendar shows the session before the API answers: wait for the save
  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname.endsWith('/event'),
  );
  await form.getByRole('button', { name: 'Create', exact: true }).click();
  expect((await saved).ok()).toBe(true);
  await expect(
    page.locator('.calendar-event', { hasText: 'Barbell full squat' }),
  ).toBeVisible();

  const headers = apiHeaders(undefined, athlete.accessToken);
  const [event] = (await (
    await request.get(`${API_URL}/event`, { headers })
  ).json()) as {
    eventId: number;
  }[];
  const stored = (await (
    await request.get(`${API_URL}/event/${event.eventId}`, { headers })
  ).json()) as { sport: string; workout: { steps: StoredStep[] } };
  expect(stored.sport).toBe('STRENGTH');
  const repeats = stored.workout.steps.map((step) => step.repeatBlock);
  expect(repeats).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        repetitions: 3,
        kind: 'REPEAT',
        childSteps: expect.arrayContaining([
          expect.objectContaining({
            exerciseRef: 'c:barbell-full-squat',
            durationType: 'REPS',
            durationValue: 5,
          }),
        ]),
      }),
      expect.objectContaining({ kind: 'SUPERSET', repetitions: 3 }),
    ]),
  );
  expect(problems).toEqual([]);
});

test('a step is dragged after a repeat, or into it when pushed right', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  await signIn(page, athlete);
  const problems = trackPageProblems(page);
  const form = await planTraining(page);

  const quick = form.locator('[data-quick-add]');
  for (const line of ["10' Z1", "6x(1km Z4 / 2' Z1)"]) {
    await quick.fill(line);
    await quick.press('Enter');
  }
  const levels = () =>
    form
      .locator('[data-step-row]')
      .evaluateAll((rows) =>
        rows.map(
          (row) =>
            `${row.closest('[role="listitem"]')?.className.includes('border-x') ? 'in' : 'top'} ${row.querySelector('[data-step-length]')?.textContent}`,
        ),
      );
  const drag = async (row: number, toY: number, dx: number) => {
    const handle = form
      .locator('[data-step-row]')
      .nth(row)
      .getByRole('button', { name: 'Drag to move' });
    const box = (await handle.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= 12; i += 1) {
      await page.mouse.move(x + (dx * i) / 12, y + ((toY - y) * i) / 12);
    }
    await page.mouse.up();
  };

  // Below the repeat that ends the session: after it, not in it
  const addInside = (await form
    .getByRole('button', { name: 'Add a step' })
    .boundingBox())!;
  await drag(0, addInside.y + addInside.height + 12, 0);
  await expect.poll(levels).toEqual(['in 1 km', "in 2'", "top 10'"]);
  // It now ends the session: the cool-down
  await expect(
    form.locator('[data-step-row]').last().locator('[data-step-type]'),
  ).toHaveText('Cool-down');

  // Pushed right, it goes in the repeat above
  const last = (await form.locator('[data-step-row]').last().boundingBox())!;
  await drag(2, last.y - 20, 40);
  await expect.poll(levels).toEqual(['in 1 km', "in 2'", "in 10'"]);
  expect(problems).toEqual([]);
});
