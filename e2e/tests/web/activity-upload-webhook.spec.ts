import { expect, test } from '@playwright/test';

import { trackPageProblems } from '../../support/page-health';

test('shows webhook credentials once and lets the athlete replace or revoke them', async ({
  page,
}) => {
  const problems = trackPageProblems(page);
  await page.goto('/dashboard/settings?tab=connectors');
  const section = page.locator('[data-connector-provider="WEBHOOK"]');
  const options = section.getByRole('button', { name: 'Upload by webhook' });
  await expect(options).toHaveAttribute('aria-expanded', 'false');
  await options.click();
  const signing = section.getByRole('checkbox', {
    name: /Require a RunGap signature/,
  });
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

  await signing.check();
  await generate.click();
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
  await expect(options).toHaveAttribute('aria-expanded', 'false');
  await options.click();
  await expect(signing).toBeChecked();
  await expect(url).toHaveCount(0);
  await signing.uncheck();
  await replace.click();
  await expect(
    section.getByText('Upload token', { exact: true }),
  ).toBeVisible();
  await expect(passkey).toHaveCount(0);

  await revoke.click();
  await expect(generate).toBeVisible();
  await expect(url).toHaveCount(0);
  expect(problems).toEqual([]);
});
