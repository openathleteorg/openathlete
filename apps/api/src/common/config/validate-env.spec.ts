import { validateEnv } from './validate-env';

const required = {
  ENV: 'production',
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/openathlete',
  HASH_PEPPER: 'pepper',
  JWT_SECRET_KEY: 'a-random-secret-that-is-long-enough-0123456789',
};

describe('validateEnv', () => {
  it('treats empty optional variables as unset', () => {
    const env = validateEnv({
      ...required,
      GARMIN_REDIRECT_URI: '',
      BREVO_FROM_EMAIL: '',
      POSTHOG_PROJECT_TOKEN: '',
    });

    expect(env.GARMIN_REDIRECT_URI).toBeUndefined();
    expect(env.BREVO_FROM_EMAIL).toBeUndefined();
  });

  it('removes empty variables from process.env, which ConfigService reads first', () => {
    process.env.TRUST_PROXY = '';
    try {
      validateEnv({ ...required, TRUST_PROXY: '' });

      expect('TRUST_PROXY' in process.env).toBe(false);
    } finally {
      delete process.env.TRUST_PROXY;
    }
  });

  it('still rejects invalid non-empty values', () => {
    expect(() =>
      validateEnv({ ...required, GARMIN_REDIRECT_URI: 'not a url' }),
    ).toThrow('GARMIN_REDIRECT_URI');
  });

  it('still requires mandatory variables, even when passed empty', () => {
    expect(() => validateEnv({ ...required, JWT_SECRET_KEY: '' })).toThrow(
      'JWT_SECRET_KEY',
    );
  });

  it('rejects the JWT secret formerly shipped in docker-compose.yml', () => {
    expect(() =>
      validateEnv({
        ...required,
        JWT_SECRET_KEY:
          'dev-jwt-secret-key-change-in-production-min-32-chars-long',
      }),
    ).toThrow('publicly known default');
  });
});
