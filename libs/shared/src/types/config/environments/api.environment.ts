import { z } from 'zod';

import { ENV } from '../environment.enum';
import { NODE_ENV } from '../node-environment.enum';

export const ApiEnvSchema = z.object({
  ENV: z.nativeEnum(ENV),
  NODE_ENV: z.nativeEnum(NODE_ENV),
  SERVER_PORT: z.string().nonempty(),
  HASH_PEPPER: z.string().nonempty(),
  JWT_SECRET_KEY: z.string().nonempty(),
  DATABASE_URL: z.string().nonempty(),
  APP_URL: z.string().nonempty(),

  STRAVA_CLIENT_ID: z.string().nonempty(),
  STRAVA_CLIENT_SECRET: z.string().nonempty(),
  STRAVA_REDIRECT_URI: z.string().nonempty(),
  STRAVA_WEBHOOK_TOKEN: z.string().nonempty(),

  GARMIN_CLIENT_ID: z.string().optional(),
  GARMIN_CLIENT_SECRET: z.string().optional(),
  GARMIN_REDIRECT_URI: z.string().optional(),

  SUUNTO_CLIENT_ID: z.string().optional(),
  SUUNTO_CLIENT_SECRET: z.string().optional(),
  SUUNTO_REDIRECT_URI: z.string().optional(),
  SUUNTO_SUBSCRIPTION_KEY: z.string().optional(),

  COROS_CLIENT_ID: z.string().optional(),
  COROS_CLIENT_SECRET: z.string().optional(),
  COROS_REDIRECT_URI: z.string().optional(),

  BREVO_API_KEY: z.string().nonempty(),
  BREVO_FROM_EMAIL: z.string().email().nonempty(),

  POLAR_CLIENT_ID: z.string().nonempty(),
  POLAR_CLIENT_SECRET: z.string().nonempty(),
  POLAR_REDIRECT_URI: z.string().nonempty(),
  POLAR_WEBHOOK_URL: z.string().nonempty(),
  POLAR_WEBHOOK_SECRET_KEY: z.string().nonempty(),

  GOOGLE_GENERATIVE_AI_API_KEY: z.string().nonempty(),

  NOTION_TOKEN: z.string().nonempty(),
  NOTION_DATABASE_ID: z.string().nonempty(),

  OPENAI_API_KEY: z.string().nonempty(),

  REDIS_URL: z.string().default('redis://localhost:6379/0'),
});

export type ApiEnvSchemaType = z.infer<typeof ApiEnvSchema>;
