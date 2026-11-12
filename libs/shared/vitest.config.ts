import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // dist holds the build, not tests to run twice
    include: ['src/**/*.spec.ts'],
  },
});
