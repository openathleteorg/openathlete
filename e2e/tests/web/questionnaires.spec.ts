import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

import { apiHeaders, createCoachWithAthlete } from '../../support/api';
import { pageAs, signIn } from '../../support/browser';
import { API_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';

test.use({ storageState: { cookies: [], origins: [] } });

/** A day as the calendar names its cell, in the browser's time zone */
function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

test('a coach writes a questionnaire, sends it, and reads the answers', async ({
  page,
  browser,
  request,
}) => {
  const { coach, athlete, athleteId } = await createCoachWithAthlete(request);
  await signIn(page, coach);
  const problems = trackPageProblems(page);

  // From the Hooper template, in the library
  await page.goto('/dashboard/questionnaires');
  await page.getByRole('button', { name: 'New questionnaire' }).first().click();
  await page.getByRole('dialog').locator('[data-template="hooper"]').click();
  await expect(page).toHaveURL(
    /\/dashboard\/questionnaires\/new\?template=hooper$/,
  );
  await expect(page.getByLabel('Title')).toHaveValue('Hooper index');
  await expect(page.locator('[data-question-editor]')).toHaveCount(4);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/\/dashboard\/questionnaires$/);
  await expect(page.locator('[data-questionnaire]')).toContainText(
    'Hooper index',
  );

  // Sent from yesterday in the athlete's calendar: it opened at 8:00 and
  // stays open, whatever the time the test runs
  await page.goto(`/dashboard/calendar/${athleteId}?view=month`);
  const yesterday = new Date(Date.now() - 86_400_000);
  const day = page.locator(`[data-calendar-day="${dayKey(yesterday)}"]`);
  if (yesterday.getDate() > new Date().getDate()) {
    // Today is the first of the month: yesterday is in the previous one
    await page.getByRole('button', { name: 'Previous month' }).click();
  }
  await day.click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Send a questionnaire' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Questionnaire' }).click();
  await page.getByRole('option', { name: 'Hooper index' }).click();
  await dialog.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText('Questionnaire sent')).toBeVisible();
  await expect(day.getByText('Hooper index')).toBeVisible();

  // The athlete answers from their calendar
  const athletePage = await pageAs(browser, athlete);
  const athleteProblems = trackPageProblems(athletePage);
  await athletePage.goto('/dashboard/calendar');
  await athletePage.locator('[data-pending-questionnaire]').first().click();
  const form = athletePage.getByRole('dialog');
  // Fatigue 3, stress 4, soreness 2, sleep 5: a score of 14
  for (const [question, value] of [
    ['Fatigue', '3'],
    ['Stress', '4'],
    ['Muscle soreness', '2'],
    ['Sleep quality', '5'],
  ] as const) {
    await form
      .getByRole('group', { name: question })
      .getByRole('radio', { name: value, exact: true })
      .click();
  }
  await form.getByRole('button', { name: 'Send my answers' }).click();
  await expect(
    athletePage.getByText('Answers sent to your coach'),
  ).toBeVisible();
  await expect(form.getByText('Answered', { exact: false })).toBeVisible();
  await expect(athletePage.locator('[data-pending-questionnaire]')).toHaveCount(
    0,
  );

  // They find it again among their questionnaires
  await athletePage.goto('/dashboard/my-questionnaires');
  const mine = athletePage.locator('[data-occurrence]').first();
  await expect(mine).toContainText('Hooper index');
  await expect(mine).toContainText('Answered');
  await expect(mine).toContainText('14');
  expect(athleteProblems).toEqual([]);
  await athletePage.close();

  // The score filled the athlete's Hooper index
  const metrics = await request.get(
    `${API_URL}/metric/latest?athleteId=${athleteId}`,
    { headers: apiHeaders(undefined, coach.accessToken) },
  );
  expect(JSON.stringify(await metrics.json())).toContain('HOOPER_INDEX');

  // The coach reads them week by week, then as charts
  await page.goto(`/dashboard/questionnaires/${athleteId}`);
  const occurrence = page.locator('[data-occurrence]').first();
  await expect(occurrence).toContainText('Hooper index');
  await expect(occurrence).toContainText('Answered');
  await expect(occurrence).toContainText('14');
  await page.getByRole('tab', { name: 'By questionnaire' }).click();
  await expect(page.getByText('Answered: 1 of 1 (100 %)')).toBeVisible();
  await expect(page.locator('[data-question-widget]')).toHaveCount(4);
  await expect(
    page.getByRole('img', { name: 'Answers to “Fatigue” over time' }),
  ).toBeVisible();

  // and take them to a spreadsheet
  const download = page.waitForEvent('download');
  await page.locator('[data-export-answers]').click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('openathlete-hooper-index.csv');
  const csv = await readFile(await file.path(), 'utf8');
  const [header, row] = csv.replace(/^\uFEFF/, '').split('\n');
  expect(header).toContain('Score');
  expect(header).toContain('Fatigue (1–7)');
  expect(row).toContain('Answered');
  expect(row).toMatch(/,14,3,4,2,5$/);

  // A coach cannot delete what the athlete answered
  const placed = await request.get(
    `${API_URL}/questionnaires/responses?athleteId=${athleteId}&from=${new Date(Date.now() - 86_400_000).toISOString()}&to=${new Date(Date.now() + 86_400_000).toISOString()}`,
    { headers: apiHeaders(undefined, coach.accessToken) },
  );
  const { occurrences } = (await placed.json()) as {
    occurrences: { eventId: number }[];
  };
  const removal = await request.delete(
    `${API_URL}/event/${occurrences[0].eventId}`,
    { headers: apiHeaders(undefined, coach.accessToken) },
  );
  expect(removal.status()).toBe(403);

  expect(problems).toEqual([]);
});
