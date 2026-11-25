import { AiErrorCode } from '@openathlete/shared';

import {
  AiNotConfiguredException,
  AiProviderException,
  isRetryableAiError,
  providerStatusOf,
  toAiProviderException,
} from './ai.errors';

describe('providerStatusOf', () => {
  it('finds the status through wrapped causes', () => {
    const apiError = Object.assign(new Error('Unauthorized'), {
      statusCode: 401,
    });
    const wrapped = Object.assign(new Error('Agent failed'), {
      cause: Object.assign(new Error('Model failed'), { cause: apiError }),
    });

    expect(providerStatusOf(wrapped)).toBe(401);
  });

  it('ignores non-HTTP values', () => {
    expect(providerStatusOf(new Error('timeout'))).toBeUndefined();
    expect(providerStatusOf({ status: 'failed' })).toBeUndefined();
    expect(providerStatusOf('boom')).toBeUndefined();
  });
});

describe('toAiProviderException', () => {
  it.each([
    [401, AiErrorCode.CREDENTIAL_REJECTED],
    [403, AiErrorCode.CREDENTIAL_REJECTED],
    [402, AiErrorCode.QUOTA_EXCEEDED],
    [429, AiErrorCode.QUOTA_EXCEEDED],
    [404, AiErrorCode.PROVIDER_ERROR],
    [500, AiErrorCode.PROVIDER_ERROR],
  ])('maps provider status %s to %s', (status, code) => {
    const error = toAiProviderException({ statusCode: status });

    expect(error.code).toBe(code);
    expect(error.getStatus()).toBe(422);
    expect(error.getResponse()).toMatchObject({ code });
  });

  it('never leaks the provider message to users', () => {
    const error = toAiProviderException(
      Object.assign(new Error('Incorrect API key provided: sk-abc***xyz'), {
        statusCode: 401,
      }),
    );

    expect(error.message).not.toContain('sk-');
  });

  it('keeps errors that are already translated', () => {
    const original = new AiProviderException(
      AiErrorCode.QUOTA_EXCEEDED,
      'quota',
    );

    expect(toAiProviderException(original)).toBe(original);
  });
});

describe('AiNotConfiguredException', () => {
  it('is a 403 with the AI_NOT_CONFIGURED code', () => {
    const error = new AiNotConfiguredException('EVENT_GENERATION' as never);

    expect(error.getStatus()).toBe(403);
    expect(error.getResponse()).toMatchObject({
      code: AiErrorCode.NOT_CONFIGURED,
    });
  });
});

describe('isRetryableAiError', () => {
  it('retries invalid answers and unrelated errors', () => {
    expect(isRetryableAiError(new Error('Nested repeat blocks'))).toBe(true);
    expect(
      isRetryableAiError(
        new AiProviderException(AiErrorCode.PROVIDER_ERROR, 'no valid result'),
      ),
    ).toBe(true);
    expect(
      isRetryableAiError(
        new AiProviderException(AiErrorCode.INVALID_OUTPUT, 'no valid result'),
      ),
    ).toBe(true);
  });

  it('does not retry provider failures the SDK already retried', () => {
    expect(isRetryableAiError(toAiProviderException({ statusCode: 500 }))).toBe(
      false,
    );
    expect(isRetryableAiError(toAiProviderException({ statusCode: 401 }))).toBe(
      false,
    );
    expect(isRetryableAiError(toAiProviderException({ statusCode: 429 }))).toBe(
      false,
    );
  });
});
