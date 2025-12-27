import * as Sentry from '@sentry/nestjs';

// Ensure to call this before requiring any other modules!
Sentry.init({
  dsn: process.env.BETTER_STACK_DSN,
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  environment: process.env.NODE_ENV || 'production',
});
