import { HttpException, HttpStatus } from '@nestjs/common';

import { AiErrorCode, AiTask } from '@openathlete/shared';

/** Body of AI errors: the web app switches on `code`. */
function body(status: HttpStatus, code: AiErrorCode, message: string) {
  return { statusCode: status, code, message };
}

/** Neither a key of the user's nor hosted AI is available for the task. */
export class AiNotConfiguredException extends HttpException {
  constructor(readonly task: AiTask) {
    super(
      body(
        HttpStatus.FORBIDDEN,
        AiErrorCode.NOT_CONFIGURED,
        'Add an AI provider key in Settings > AI to use this feature',
      ),
      HttpStatus.FORBIDDEN,
    );
  }
}

/** The user's monthly allowance on the instance keys is used up. */
export class AiHostedQuotaExceededException extends HttpException {
  constructor() {
    super(
      body(
        HttpStatus.FORBIDDEN,
        AiErrorCode.HOSTED_QUOTA_EXCEEDED,
        'The AI included in your plan is used up for this month. Add your own key in Settings > AI to keep going',
      ),
      HttpStatus.FORBIDDEN,
    );
  }
}

/**
 * The user has not allowed their data to be sent to AI providers (App Store
 * guideline 5.1.2(i) and GDPR): the web app asks for it, then retries.
 */
export class AiConsentRequiredException extends HttpException {
  constructor() {
    super(
      body(
        HttpStatus.FORBIDDEN,
        AiErrorCode.CONSENT_REQUIRED,
        'Allow your data to be sent to the AI provider in Settings > AI to use this feature',
      ),
      HttpStatus.FORBIDDEN,
    );
  }
}

/** The provider refused the call; `code` says whether the key is at fault. */
export class AiProviderException extends HttpException {
  constructor(
    readonly code: AiErrorCode,
    message: string,
    readonly providerStatus?: number,
  ) {
    super(
      body(HttpStatus.UNPROCESSABLE_ENTITY, code, message),
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

/** Finds the HTTP status a provider answered with, through wrapped errors. */
export function providerStatusOf(error: unknown): number | undefined {
  let current: unknown = error;
  for (let depth = 0; current && depth < 6; depth++) {
    if (typeof current === 'object') {
      const candidate = current as {
        statusCode?: unknown;
        status?: unknown;
        cause?: unknown;
        details?: { statusCode?: unknown };
      };
      for (const value of [
        candidate.statusCode,
        candidate.status,
        candidate.details?.statusCode,
      ]) {
        if (typeof value === 'number' && value >= 400 && value < 600) {
          return value;
        }
      }
      current = candidate.cause;
    } else {
      break;
    }
  }
  return undefined;
}

/** Translates a failed model call into an error safe to show the user. */
export function toAiProviderException(error: unknown): AiProviderException {
  if (error instanceof AiProviderException) return error;
  const status = providerStatusOf(error);
  if (status === 401 || status === 403) {
    return new AiProviderException(
      AiErrorCode.CREDENTIAL_REJECTED,
      'The AI provider rejected the API key',
      status,
    );
  }
  if (status === 402 || status === 429) {
    return new AiProviderException(
      AiErrorCode.QUOTA_EXCEEDED,
      'The AI provider quota is exhausted or rate limited',
      status,
    );
  }
  if (status === 404) {
    return new AiProviderException(
      AiErrorCode.PROVIDER_ERROR,
      'The AI provider does not know this model',
      status,
    );
  }
  return new AiProviderException(
    AiErrorCode.PROVIDER_ERROR,
    'The AI provider could not complete the request',
    status,
  );
}

/**
 * Whether a failed generation is worth another try: invalid answers (wrong
 * structure, failed validation) are. Provider errors were already retried by
 * the SDK, and a rejected key or exhausted quota won't recover anyway.
 */
export function isRetryableAiError(error: unknown): boolean {
  return (
    !(error instanceof AiProviderException) ||
    error.code === AiErrorCode.INVALID_OUTPUT ||
    (error.code === AiErrorCode.PROVIDER_ERROR &&
      error.providerStatus === undefined)
  );
}
