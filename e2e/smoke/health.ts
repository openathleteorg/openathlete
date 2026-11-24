import type { Page } from '@playwright/test';

/** Third-party noise that says nothing about the app itself. */
const IGNORED = [/favicon/i, /ERR_BLOCKED_BY_CLIENT/, /posthog|\/ingest\//i];

/**
 * What a user would see as broken on a live page: uncaught errors, console
 * errors and 5xx answers. A 4xx can be expected in production (an expired
 * token refreshed, a missing optional resource): only the server failing
 * counts here.
 */
export function trackLiveProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('pageerror', (error) =>
    problems.push(`page error: ${error.message.slice(0, 300)}`),
  );
  page.on('console', (message) => {
    const text = message.text();
    if (
      message.type() === 'error' &&
      !text.startsWith('Failed to load resource') &&
      !IGNORED.some((pattern) => pattern.test(text))
    ) {
      problems.push(`console error: ${text.slice(0, 300)}`);
    }
  });
  page.on('response', (response) => {
    if (
      response.status() >= 500 &&
      !IGNORED.some((pattern) => pattern.test(response.url()))
    ) {
      problems.push(
        `HTTP ${response.status()} ${response.request().method()} ${new URL(response.url()).pathname}`,
      );
    }
  });
  return problems;
}

export const ERROR_BOUNDARY_TEXT =
  /something went wrong|unexpected application error/i;
