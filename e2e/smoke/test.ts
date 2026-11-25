import { test as base } from '@playwright/test';

import { bypassVercelChallenge } from './bypass';

/** Playwright's test, with every context past Vercel's Security Checkpoint. */
export const test = base.extend({
  context: async ({ context }, use) => {
    await bypassVercelChallenge(context);
    await use(context);
  },
});

export { expect } from '@playwright/test';
