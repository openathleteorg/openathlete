import { z } from 'zod';

import { ENV, NODE_ENV } from '@openathlete/shared';

/**
 * Environment variable validation schema for the API application.
 * This schema ensures all required environment variables are present and valid
 * before the application starts. Missing or invalid variables will cause
 * the application to fail with clear error messages.
 */
export const envValidationSchema = z
  .object({
    // Core application configuration
    ENV: z
      .nativeEnum(ENV, {
        required_error:
          'ENV is required. Must be one of: development, staging, production',
        invalid_type_error: 'ENV must be a valid environment enum value',
      })
      .describe('Application environment (development, staging, production)'),

    NODE_ENV: z
      .nativeEnum(NODE_ENV, {
        required_error:
          'NODE_ENV is required. Must be one of: development, test, production',
        invalid_type_error:
          'NODE_ENV must be a valid Node.js environment enum value',
      })
      .describe('Node.js environment'),

    PORT: z
      .string()
      .regex(/^\d+$/, 'PORT must be a valid port number')
      .optional()
      .default('3000')
      .describe('Port number on which the server will listen'),

    SERVER_PORT: z
      .string()
      .regex(/^\d+$/, 'SERVER_PORT must be a valid port number')
      .optional()
      .describe('Server port (alternative to PORT)'),

    // Security & Authentication
    HASH_PEPPER: z
      .string()
      .min(1, 'HASH_PEPPER is required for password hashing security')
      .describe('Secret pepper value used for password hashing'),

    JWT_SECRET_KEY: z
      .string()
      .min(
        32,
        'JWT_SECRET_KEY must be at least 32 characters long for security',
      )
      .describe('Secret key used to sign and verify JWT tokens'),

    // Database
    DATABASE_URL: z
      .string()
      .url('DATABASE_URL must be a valid database connection URL')
      .min(1, 'DATABASE_URL is required for database connectivity')
      .describe('PostgreSQL database connection URL'),

    // Application URLs
    APP_URL: z
      .string()
      .url('APP_URL must be a valid URL')
      .min(1, 'APP_URL is required for generating absolute URLs')
      .describe(
        'Base URL of the application (e.g., https://app.openathlete.org)',
      ),

    FRONTEND_URL: z
      .string()
      .url('FRONTEND_URL must be a valid URL')
      .optional()
      .default('http://localhost:5173')
      .describe('Frontend application URL for redirects'),

    CORS_ORIGINS: z
      .string()
      .optional()
      .describe('Comma-separated list of allowed CORS origins'),

    // Strava OAuth
    STRAVA_CLIENT_ID: z
      .string()
      .min(1, 'STRAVA_CLIENT_ID is required for Strava integration')
      .describe('Strava OAuth client ID'),

    STRAVA_CLIENT_SECRET: z
      .string()
      .min(1, 'STRAVA_CLIENT_SECRET is required for Strava integration')
      .describe('Strava OAuth client secret'),

    STRAVA_REDIRECT_URI: z
      .string()
      .url('STRAVA_REDIRECT_URI must be a valid URL')
      .min(1, 'STRAVA_REDIRECT_URI is required for Strava OAuth callback')
      .describe('Strava OAuth redirect URI'),

    STRAVA_WEBHOOK_TOKEN: z
      .string()
      .min(
        1,
        'STRAVA_WEBHOOK_TOKEN is required for Strava webhook verification',
      )
      .describe('Token for verifying Strava webhook requests'),

    // Garmin OAuth (optional)
    GARMIN_CLIENT_ID: z
      .string()
      .optional()
      .describe('Garmin OAuth client ID (optional)'),

    GARMIN_CLIENT_SECRET: z
      .string()
      .optional()
      .describe('Garmin OAuth client secret (optional)'),

    GARMIN_REDIRECT_URI: z
      .string()
      .url('GARMIN_REDIRECT_URI must be a valid URL')
      .optional()
      .describe('Garmin OAuth redirect URI (optional)'),

    // Suunto OAuth (optional)
    SUUNTO_CLIENT_ID: z
      .string()
      .optional()
      .describe('Suunto OAuth client ID (optional)'),

    SUUNTO_CLIENT_SECRET: z
      .string()
      .optional()
      .describe('Suunto OAuth client secret (optional)'),

    SUUNTO_REDIRECT_URI: z
      .string()
      .url('SUUNTO_REDIRECT_URI must be a valid URL')
      .optional()
      .describe('Suunto OAuth redirect URI (optional)'),

    SUUNTO_SUBSCRIPTION_KEY: z
      .string()
      .optional()
      .describe('Suunto subscription key for API access (optional)'),

    // Coros OAuth (optional)
    COROS_CLIENT_ID: z
      .string()
      .optional()
      .describe('Coros OAuth client ID (optional)'),

    COROS_CLIENT_SECRET: z
      .string()
      .optional()
      .describe('Coros OAuth client secret (optional)'),

    COROS_REDIRECT_URI: z
      .string()
      .url('COROS_REDIRECT_URI must be a valid URL')
      .optional()
      .describe('Coros OAuth redirect URI (optional)'),

    // Polar OAuth
    POLAR_CLIENT_ID: z
      .string()
      .min(1, 'POLAR_CLIENT_ID is required for Polar integration')
      .describe('Polar OAuth client ID'),

    POLAR_CLIENT_SECRET: z
      .string()
      .min(1, 'POLAR_CLIENT_SECRET is required for Polar integration')
      .describe('Polar OAuth client secret'),

    POLAR_REDIRECT_URI: z
      .string()
      .url('POLAR_REDIRECT_URI must be a valid URL')
      .min(1, 'POLAR_REDIRECT_URI is required for Polar OAuth callback')
      .describe('Polar OAuth redirect URI'),

    POLAR_WEBHOOK_URL: z
      .string()
      .url('POLAR_WEBHOOK_URL must be a valid URL')
      .min(1, 'POLAR_WEBHOOK_URL is required for Polar webhook configuration')
      .describe('URL where Polar webhooks will be received'),

    POLAR_WEBHOOK_SECRET_KEY: z
      .string()
      .min(
        1,
        'POLAR_WEBHOOK_SECRET_KEY is required for Polar webhook verification',
      )
      .describe('Secret key for verifying Polar webhook requests'),

    // Email service (Brevo)
    BREVO_API_KEY: z
      .string()
      .min(1, 'BREVO_API_KEY is required for sending emails')
      .describe('Brevo (formerly Sendinblue) API key for email service'),

    BREVO_FROM_EMAIL: z
      .string()
      .email('BREVO_FROM_EMAIL must be a valid email address')
      .min(1, 'BREVO_FROM_EMAIL is required for sending emails')
      .describe('Default sender email address for Brevo emails'),

    // AI Services
    OPENAI_API_KEY: z
      .string()
      .min(1, 'OPENAI_API_KEY is required for AI features')
      .describe('OpenAI API key for AI-powered features'),

    GOOGLE_GENERATIVE_AI_API_KEY: z
      .string()
      .min(1, 'GOOGLE_GENERATIVE_AI_API_KEY is required for Google AI features')
      .describe('Google Generative AI API key'),

    // Redis
    REDIS_URL: z
      .string()
      .url('REDIS_URL must be a valid Redis connection URL')
      .optional()
      .default('redis://localhost:6379/0')
      .describe('Redis connection URL for queue and caching'),

    // Stripe (optional, required for subscription features)
    STRIPE_SECRET_KEY: z
      .string()
      .optional()
      .describe('Stripe secret key for payment processing (optional)'),

    STRIPE_PRICE_IDS: z
      .string()
      .optional()
      .describe(
        'JSON string of Stripe price IDs mapped to subscription plans (optional)',
      ),

    STRIPE_WEBHOOK_SECRET: z
      .string()
      .optional()
      .describe(
        'Stripe webhook secret for verifying webhook requests (optional)',
      ),

    // Firebase
    FIREBASE_FUNCTIONS_URL: z
      .string()
      .url('FIREBASE_FUNCTIONS_URL must be a valid URL')
      .optional()
      .describe('Firebase Cloud Functions URL (optional)'),

    // Feature flags
    ENABLE_ACTIVITY_IMPORT: z
      .string()
      .optional()
      .default('false')
      .transform((val) => val === 'true')
      .describe('Enable activity import queue processing'),

    ENABLE_ACTIVITY_PROCESSING: z
      .string()
      .optional()
      .default('false')
      .transform((val) => val === 'true')
      .describe('Enable activity processing queue'),

    ENABLE_TRAINING_LOAD_ESTIMATION: z
      .string()
      .optional()
      .default('false')
      .transform((val) => val === 'true')
      .describe('Enable training load estimation processing'),
  })
  .refine(
    (data) => {
      // Ensure either PORT or SERVER_PORT is provided (PORT has a default, so this should always pass)
      return data.PORT || data.SERVER_PORT;
    },
    {
      message: 'Either PORT or SERVER_PORT must be provided',
      path: ['PORT'],
    },
  );

export type EnvValidationSchemaType = z.infer<typeof envValidationSchema>;
