import { z } from 'zod';

import { ENV } from '../environment.enum';
import { NODE_ENV } from '../node-environment.enum';

// Secrets that were shipped as defaults in docker-compose.yml. Instances
// must not run with them since they are public.
const PUBLIC_JWT_SECRETS = [
  'dev-jwt-secret-key-change-in-production-min-32-chars-long',
];

/**
 * Environment variable validation schema for the API application.
 * This schema ensures all required environment variables are present and valid
 * before the application starts. Missing or invalid variables will cause
 * the application to fail with clear error messages.
 */
export const ApiEnvSchema = z
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
      .refine((value) => !PUBLIC_JWT_SECRETS.includes(value), {
        message:
          'JWT_SECRET_KEY is a publicly known default: anyone could forge sessions. Generate one with `openssl rand -base64 48`',
      })
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
      .optional()
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

    TRUST_PROXY: z
      .string()
      .optional()
      .describe(
        'Express "trust proxy" setting: a hop count or comma-separated addresses/presets. Defaults to private-network proxies',
      ),

    // Strava OAuth (optional)
    STRAVA_CLIENT_ID: z
      .string()
      .optional()
      .describe('Strava OAuth client ID (optional)'),

    STRAVA_CLIENT_SECRET: z
      .string()
      .optional()
      .describe('Strava OAuth client secret (optional)'),

    STRAVA_REDIRECT_URI: z
      .string()
      .url('STRAVA_REDIRECT_URI must be a valid URL')
      .optional()
      .describe('Strava OAuth redirect URI (optional)'),

    STRAVA_WEBHOOK_TOKEN: z
      .string()
      .optional()
      .describe('Token for verifying Strava webhook requests (optional)'),

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
    // COROS_CLIENT_ID: z
    //   .string()
    //   .optional()
    //   .describe('Coros OAuth client ID (optional)'),

    // COROS_CLIENT_SECRET: z
    //   .string()
    //   .optional()
    //   .describe('Coros OAuth client secret (optional)'),

    // COROS_REDIRECT_URI: z
    //   .string()
    //   .url('COROS_REDIRECT_URI must be a valid URL')
    //   .optional()
    //   .describe('Coros OAuth redirect URI (optional)'),

    // Polar OAuth (optional)
    POLAR_CLIENT_ID: z
      .string()
      .optional()
      .describe('Polar OAuth client ID (optional)'),

    POLAR_CLIENT_SECRET: z
      .string()
      .optional()
      .describe('Polar OAuth client secret (optional)'),

    POLAR_REDIRECT_URI: z
      .string()
      .url('POLAR_REDIRECT_URI must be a valid URL')
      .optional()
      .describe('Polar OAuth redirect URI (optional)'),

    POLAR_WEBHOOK_URL: z
      .string()
      .url('POLAR_WEBHOOK_URL must be a valid URL')
      .optional()
      .describe('URL where Polar webhooks will be received (optional)'),

    POLAR_WEBHOOK_SECRET_KEY: z
      .string()
      .optional()
      .describe('Secret key for verifying Polar webhook requests (optional)'),

    // Email service (Brevo, optional)
    BREVO_API_KEY: z
      .string()
      .optional()
      .describe(
        'Brevo (formerly Sendinblue) API key for email service (optional)',
      ),

    BREVO_FROM_EMAIL: z
      .string()
      .email('BREVO_FROM_EMAIL must be a valid email address')
      .optional()
      .describe('Default sender email address for Brevo emails (optional)'),

    // Who may create an account
    SIGNUP_MODE: z
      .enum(['open', 'invite', 'closed'])
      .default('open')
      .describe(
        'open: anyone can sign up; invite: only with an invitation from a coach or athlete; closed: nobody, except the first account of the instance',
      ),

    // Where the hosted instance hears about new accounts (optional)
    SIGNUP_NOTIFICATION_EMAIL: z
      .string()
      .email('SIGNUP_NOTIFICATION_EMAIL must be a valid email address')
      .optional()
      .describe(
        'Receives an email for each new account (optional, needs Brevo)',
      ),

    // AI Services (optional)
    OPENAI_API_KEY: z
      .string()
      .optional()
      .describe('OpenAI API key for AI-powered features (optional)'),

    GOOGLE_GENERATIVE_AI_API_KEY: z
      .string()
      .optional()
      .describe('Google Generative AI API key (optional)'),

    // Instance AI keys (above, and any provider's standard variable such as
    // ANTHROPIC_API_KEY) are "hosted AI". Users can always use their own keys.
    AI_HOSTED_ACCESS: z
      .enum(['subscribers', 'everyone', 'none'])
      .optional()
      .describe(
        'Who may use the instance AI keys: subscribers (paid plan with AI), everyone, or none. Default: subscribers when Stripe is configured, everyone otherwise',
      ),

    AI_HOSTED_MONTHLY_BUDGET_USD: z
      .string()
      .regex(/^\d+(\.\d+)?$/, 'AI_HOSTED_MONTHLY_BUDGET_USD must be a number')
      .optional()
      .transform((val) => (val === undefined ? undefined : Number(val)))
      .describe(
        "What each user may spend per month on the instance AI keys, in US dollars at the providers' prices (e.g. 3). Unset: no limit",
      ),

    AI_ALLOW_CUSTOM_ENDPOINTS: z
      .enum(['true', 'false'])
      .optional()
      .transform((val) => (val === undefined ? undefined : val === 'true'))
      .describe(
        'Let users add OpenAI-compatible endpoints by URL (Ollama, vLLM...) and providers on local URLs. The server calls these URLs, so keep it off on public instances. Default: on without Stripe, off with Stripe',
      ),

    // Models used with the instance keys, as provider/model. Users with their
    // own keys pick their models in the settings.
    AI_MODEL_DEFAULT: z
      .string()
      .optional()
      .describe(
        'Instance model for every AI feature without its own variable (e.g. openai/gpt-5.1, anthropic/claude-sonnet-4-5)',
      ),
    AI_MODEL_FEEDBACK_EXTRACTION: z
      .string()
      .optional()
      .describe(
        'Instance model extracting RPE and injuries from athlete feedback',
      ),
    AI_MODEL_EVENT_GENERATION: z
      .string()
      .optional()
      .describe('AI model for event generation agent (e.g., gpt-4o, gpt-5.1)'),
    AI_MODEL_EVENT_MODIFICATION: z
      .string()
      .optional()
      .describe(
        'AI model for event modification agent (e.g., gpt-4o, gpt-5.1)',
      ),
    AI_MODEL_EXTRACT_INJURY: z
      .string()
      .optional()
      .describe('Deprecated: use AI_MODEL_FEEDBACK_EXTRACTION'),
    AI_MODEL_EXTRACT_RPE: z
      .string()
      .optional()
      .describe('Deprecated: use AI_MODEL_FEEDBACK_EXTRACTION'),
    AI_MODEL_POST_ACTIVITY_FEEDBACK: z
      .string()
      .optional()
      .describe(
        'AI model for post-activity feedback questions (e.g. google/gemini-2.5-flash)',
      ),
    AI_MODEL_TRIMP_ESTIMATION: z
      .string()
      .optional()
      .describe('AI model for TRIMP estimation agent (e.g., gpt-4o, gpt-5.1)'),

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

    STRIPE_PRICE_SUPPORTER_MONTHLY: z
      .string()
      .optional()
      .describe('Stripe price ID of the monthly Supporter subscription'),

    STRIPE_PRICE_SUPPORTER_YEARLY: z
      .string()
      .optional()
      .describe('Stripe price ID of the yearly Supporter subscription'),

    STRIPE_WEBHOOK_SECRET: z
      .string()
      .optional()
      .describe(
        'Stripe webhook secret for verifying webhook requests (optional)',
      ),

    // App Store in-app purchases (optional, hosted iOS app only)
    APPLE_IAP_APP_ID: z
      .string()
      .regex(
        /^\d+$/,
        'APPLE_IAP_APP_ID must be the numeric Apple ID of the app',
      )
      .optional()
      .describe(
        'Apple ID of the iOS app (App Store Connect > App Information); enables Supporter subscriptions bought in the iOS app (optional)',
      ),

    // Firebase
    FIREBASE_FUNCTIONS_URL: z
      .string()
      .url('FIREBASE_FUNCTIONS_URL must be a valid URL')
      .optional()
      .describe('Firebase Cloud Functions URL (optional)'),

    FIREBASE_SERVICE_ACCOUNT_JSON: z
      .string()
      .optional()
      .describe(
        'Firebase Admin service account JSON as a string (optional, required for Firebase Auth ID token verification)',
      ),

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

    // Monitoring & Error Tracking
    BETTER_STACK_DSN: z
      .string()
      .url('BETTER_STACK_DSN must be a valid URL')
      .optional()
      .describe('Better Stack (Sentry) DSN for error tracking and monitoring'),

    // Normalization processor configuration (optional)
    NORMALIZATION_MIN_MOVING_SPEED_MS: z
      .string()
      .optional()
      .describe('Minimum moving speed in m/s for normalization processor'),
    NORMALIZATION_MIN_SPEED_DEN_MS: z
      .string()
      .optional()
      .describe('Minimum speed denominator in m/s for normalization processor'),
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

export type ApiEnvSchemaType = z.infer<typeof ApiEnvSchema>;
