import { execFileSync } from 'node:child_process';
import path from 'node:path';

const COMPOSE_FILE = path.join(import.meta.dirname, '../docker-compose.yml');

/**
 * Makes a test account a running Supporter, or free again. Payments go
 * through Stripe or the App Store, which the E2E stack only mocks, so the
 * subscription is written in the stack's database.
 */
export function setPlan(email: string, plan: 'free' | 'supporter'): void {
  const supporter = plan === 'supporter';
  const sql = `
    INSERT INTO subscription (user_id, plan, status, provider, billing_interval,
      amount_cents, current_period_end, updated_at)
    SELECT user_id, '${supporter ? 'SUPPORTER' : 'FREE'}', 'active',
      ${supporter ? "'stripe'" : 'NULL'}, ${supporter ? "'month'" : 'NULL'},
      ${supporter ? 800 : 'NULL'},
      ${supporter ? "now() + interval '30 days'" : 'NULL'}, now()
    FROM "user" WHERE email = '${email.replace(/'/g, "''")}'
    ON CONFLICT (user_id) DO UPDATE SET plan = EXCLUDED.plan,
      status = EXCLUDED.status, provider = EXCLUDED.provider,
      billing_interval = EXCLUDED.billing_interval,
      amount_cents = EXCLUDED.amount_cents,
      current_period_end = EXCLUDED.current_period_end, updated_at = now();`;
  execFileSync(
    'docker',
    [
      'compose',
      '-f',
      COMPOSE_FILE,
      'exec',
      '-T',
      'postgres',
      'psql',
      '-U',
      'oa',
      '-d',
      'oa',
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      sql,
    ],
    { stdio: 'pipe' },
  );
}
