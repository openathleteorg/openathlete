import { m } from '@/paraglide/messages';
import { isAxiosError } from 'axios';

import { AiErrorCode } from '@openathlete/shared';

/** The AI error code the API returned, if the error is one. */
export function aiErrorCode(error: unknown): AiErrorCode | null {
  if (!isAxiosError(error)) return null;
  const code = (error.response?.data as { code?: unknown } | undefined)?.code;
  return Object.values(AiErrorCode).includes(code as AiErrorCode)
    ? (code as AiErrorCode)
    : null;
}

/** A user-facing explanation of an AI failure, or null for other errors. */
export function aiErrorMessage(errorOrCode: unknown): string | null {
  const code =
    typeof errorOrCode === 'string' &&
    Object.values(AiErrorCode).includes(errorOrCode as AiErrorCode)
      ? (errorOrCode as AiErrorCode)
      : aiErrorCode(errorOrCode);
  switch (code) {
    case AiErrorCode.NOT_CONFIGURED:
      return m.ai_error_not_configured();
    case AiErrorCode.CREDENTIAL_REJECTED:
      return m.ai_error_credential_rejected();
    case AiErrorCode.QUOTA_EXCEEDED:
      return m.ai_error_quota_exceeded();
    case AiErrorCode.HOSTED_QUOTA_EXCEEDED:
      return m.ai_error_hosted_quota_exceeded();
    case AiErrorCode.PROVIDER_ERROR:
      return m.ai_error_provider();
    case AiErrorCode.INVALID_OUTPUT:
      return m.ai_error_invalid_output();
    case AiErrorCode.CONSENT_REQUIRED:
      return m.ai_error_consent_required();
    default:
      return null;
  }
}
