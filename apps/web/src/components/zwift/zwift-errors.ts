import { m } from '@/paraglide/messages';
import { ZwiftWorkoutError } from '@/utils/zwift-workout';

export function zwiftFailure(error: unknown): string {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? error.message
      : '';
  const reference =
    typeof message === 'string'
      ? message.match(/\[(zwift-[a-z0-9-]{1,80})\]/)?.[1]
      : undefined;
  return failureText(error) + (reference ? ` [${reference}]` : '');
}

function failureText(error: unknown): string {
  if (error instanceof ZwiftWorkoutError)
    return error.reason === 'ftp'
      ? m.zwift_ftp_required()
      : m.zwift_unsupported();
  const code =
    error && typeof error === 'object' && 'code' in error ? error.code : '';
  if (code === 'ZWIFT_LOGIN_REQUIRED') return m.zwift_login_required();
  if (code === 'ZWIFT_BUSY') return m.zwift_busy();
  if (code === 'ZWIFT_VERIFY_FAILED') return m.zwift_verify_failed();
  return m.zwift_failed();
}
