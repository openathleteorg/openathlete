import path from 'node:path';

/** Ports of docker-compose.yml; override to test another deployment. */
export const WEB_URL = process.env.E2E_WEB_URL ?? 'http://localhost:18080';
export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:13000';

/**
 * The same images with billing on (stripe-mock), on the same database: the
 * hosted instance, for the Supporter perks tests.
 */
export const BILLING_WEB_URL =
  process.env.E2E_BILLING_WEB_URL ?? 'http://localhost:18081';
export const BILLING_API_URL =
  process.env.E2E_BILLING_API_URL ?? 'http://localhost:13001';

/** Browser session of the shared test athlete, written by auth.setup.ts. */
export const AUTH_FILE = path.join(
  import.meta.dirname,
  '../.auth/athlete.json',
);
