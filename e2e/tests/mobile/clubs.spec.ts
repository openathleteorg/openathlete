import { expect, test } from '@playwright/test';

import { createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { trackPageProblems } from '../../support/page-health';

test('a club fits the phone, from the Me tab to its groups', async ({
  page,
  request,
}) => {
  const coach = await createAthlete(request, {
    roles: ['ATHLETE', 'COACH'],
    firstName: 'Olga',
  });
  await signIn(page, coach);
  const problems = trackPageProblems(page);

  await page.goto('/dashboard/profile');
  await page.getByRole('link', { name: 'Clubs' }).click();
  await page.getByRole('button', { name: 'Create a club' }).tap();
  await page.getByLabel('Club name').fill('Athletics Club of a Long Name');
  await page.getByRole('button', { name: 'Create', exact: true }).tap();
  await expect(
    page.locator('[data-club-detail="Athletics Club of a Long Name"]'),
  ).toBeVisible();

  await page.getByRole('button', { name: 'New group' }).tap();
  await page.getByLabel('Group name').fill('Juniors');
  await page.getByRole('button', { name: 'Create', exact: true }).tap();
  await page.getByRole('button', { name: 'Cancel' }).tap();
  await expect(page.locator('[data-athlete-group="Juniors"]')).toBeVisible();

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(problems).toEqual([]);
});
