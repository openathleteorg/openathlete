import { expect, test } from '@playwright/test';

import { createAthlete } from '../../support/api';
import { signIn } from '../../support/browser';
import { trackPageProblems } from '../../support/page-health';

// A fresh user: the shared athlete must not get AI keys
test.use({ storageState: { cookies: [], origins: [] } });

test('adds an AI key and runs features on it', async ({ page, request }) => {
  const athlete = await createAthlete(request);
  await signIn(page, athlete);

  const problems = trackPageProblems(page);
  await page.goto('/dashboard/settings?tab=ai');
  await expect(
    page.getByText('Connect an API key from the AI provider of your choice'),
  ).toBeVisible();
  await expect(
    page.getByText('No key yet. Add one to start using AI features.'),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Add a key' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Provider' }).click();
  await page.getByPlaceholder('Search providers…').fill('OpenAI-compatible');
  await page
    .getByRole('option', { name: 'OpenAI-compatible endpoint' })
    .click();
  await dialog.getByLabel('Endpoint URL').fill('http://fake-llm:8080/v1');
  await dialog.getByLabel('API key (optional)').fill('e2e-browser-key-4321');
  await dialog.getByLabel('Model to test the key with').fill('fake-coach');
  await dialog.getByRole('button', { name: 'Save the key' }).click();

  await expect(page.getByText('The key works with fake-coach.')).toBeVisible();
  await expect(dialog).toBeHidden();

  const keys = page.getByRole('list', { name: 'API keys' });
  await expect(keys.getByText('fake-llm:8080', { exact: true })).toBeVisible();
  await expect(keys).toContainText('••••4321');
  await expect(keys).not.toContainText('e2e-browser-key');

  // The first key became the default model of every feature
  await expect(page.getByText('fake-coach').first()).toBeVisible();
  await expect(page.getByText('Your key').first()).toBeVisible();

  // Nothing is sent to the provider until the user allows it, and the page
  // says what would be sent and to whom
  const sharing = page.locator('[data-ai-data-sharing]');
  await expect(
    page.getByText('Not allowed: AI features are off', { exact: false }),
  ).toBeVisible();
  await expect(sharing).toContainText('Your custom endpoint (your key)');
  await page.getByRole('button', { name: 'Allow', exact: true }).click();
  await expect(page.getByText('AI features are on.')).toBeVisible();
  await page.getByRole('button', { name: 'Withdraw permission' }).click();
  await expect(page.getByText('AI features are off.')).toBeVisible();
  expect(problems).toEqual([]);
});

test('leads to the AI settings from an AI action without a key', async ({
  page,
  request,
}) => {
  const athlete = await createAthlete(request);
  await signIn(page, athlete);

  await page.goto('/dashboard/calendar');
  await page.locator('[data-calendar-day]').first().click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Create with AI' }).click();

  const dialog = page.getByRole('dialog', { name: 'Set up AI' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Open AI settings' }).click();

  await expect(page).toHaveURL(/\/dashboard\/settings\?tab=ai/);
  await expect(page.getByText('Not set up').first()).toBeVisible();
  // This instance has no AI keys of its own: nothing is "included"
  await expect(page.getByText('AI included')).toHaveCount(0);
});
