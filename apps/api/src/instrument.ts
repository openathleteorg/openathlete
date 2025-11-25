import * as Sentry from '@sentry/nestjs';

const BETTER_STACK_DSN =
  'https://3CmX3V4wttrQRY78VKQ3ASWm@eu-nbg-2.betterstackdata.com/1604511';

// Ensure to call this before requiring any other modules!
Sentry.init({
  dsn: BETTER_STACK_DSN,
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  environment: process.env.NODE_ENV || 'production',
});
