import { expect, test } from '@playwright/test';

import { WEB_URL } from '../../support/env';
import { trackPageProblems } from '../../support/page-health';

test('shows webhook credentials once and lets the athlete replace or revoke them', async ({
  page,
}) => {
  const problems = trackPageProblems(page);
  await page.goto('/dashboard/settings?tab=connectors');
  const section = page.locator('[data-connector-provider="rungap"]');
  const options = section.getByRole('button', {
    name: 'Webhook – RunGap',
    exact: true,
  });
  await expect(options).toHaveAttribute('aria-expanded', 'false');
  await options.click();
  const generate = section.getByRole('button', {
    name: 'Generate upload token',
  });
  const replace = section.getByRole('button', { name: 'Replace upload token' });
  const revoke = section.getByRole('button', { name: 'Revoke upload token' });
  const url = section.getByText('Webhook URL', { exact: true });
  const passkey = section.getByText('Passkey', { exact: true });
  // A previous failed run may have left the shared athlete's token active.
  await expect(generate.or(revoke)).toBeVisible();
  if (await revoke.isVisible()) await revoke.click();

  await expect(section.getByText('Inactive', { exact: true })).toBeVisible();
  await generate.click();
  await expect(section.getByText('Active', { exact: true })).toBeVisible();
  await expect(url).toBeVisible();
  await expect(passkey).toBeVisible();
  await expect(
    section.getByRole('button', { name: 'Copy', exact: true }),
  ).toHaveCount(2);
  await options.click();
  await options.click();
  await expect(passkey).toHaveCount(0);
  await expect(replace).toBeVisible();

  await page.reload();
  await expect(section.getByText('Active', { exact: true })).toBeVisible();
  await expect(options).toHaveAttribute('aria-expanded', 'false');
  await options.click();
  await expect(url).toHaveCount(0);
  const generic = page.locator('[data-connector-provider="generic"]');
  await expect(generic.getByText('Inactive', { exact: true })).toBeVisible();
  await generic
    .getByRole('button', { name: 'Webhook – Generic', exact: true })
    .click();
  await generic.getByRole('button', { name: 'Generate upload token' }).click();
  await expect(
    generic.getByText(`${WEB_URL}/api/activity-import/webhook/upload`, {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    generic.getByText('Upload token', { exact: true }),
  ).toBeVisible();
  await expect(generic.getByText('Passkey', { exact: true })).toHaveCount(0);
  await replace.click();
  await expect(passkey).toBeVisible();
  await revoke.click();
  await expect(generate).toBeVisible();
  await expect(url).toHaveCount(0);
  await expect(section.getByText('Inactive', { exact: true })).toBeVisible();
  await expect(generic.getByText('Active', { exact: true })).toBeVisible();
  await generic.getByRole('button', { name: 'Revoke upload token' }).click();
  await expect(
    generic.getByRole('button', { name: 'Generate upload token' }),
  ).toBeVisible();
  await expect(generic.getByText('Inactive', { exact: true })).toBeVisible();
  expect(problems).toEqual([]);
});
