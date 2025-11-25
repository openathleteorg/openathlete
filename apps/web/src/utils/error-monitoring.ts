import * as Sentry from '@sentry/react';

let isInitialized = false;

const BETTER_STACK_DSN =
  'https://vv9qofwSfFvUHfR346XTyk81@eu-nbg-2.betterstackdata.com/1604505';

export function initErrorMonitoring() {
  if (isInitialized || import.meta.env.DEV) {
    return;
  }

  Sentry.init({
    dsn: BETTER_STACK_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 0.25,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });

  isInitialized = true;
}
