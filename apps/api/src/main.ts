import { NestFactory } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';

import { AppModule } from './modules/app.module';

const BETTER_STACK_DSN =
  'https://3CmX3V4wttrQRY78VKQ3ASWm@eu-nbg-2.betterstackdata.com/1604511';

// Initialize Sentry before creating the NestJS app
if (process.env.NODE_ENV !== 'development') {
  Sentry.init({
    dsn: BETTER_STACK_DSN,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: 0.25,
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Add Sentry exception filter and interceptor if not in development
  if (process.env.NODE_ENV !== 'development') {
    app.useGlobalFilters(new Sentry.NestExceptionFilter());
    app.useGlobalInterceptors(new Sentry.NestInterceptor());
  }

  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
