import { m } from '@/paraglide/messages';
import { isAxiosError } from 'axios';

/** The code the questionnaire endpoints put in the error's message */
export function questionnaireErrorCode(error: unknown): string | null {
  if (!isAxiosError(error)) return null;
  const message = (error.response?.data as { message?: unknown } | undefined)
    ?.message;
  return typeof message === 'string' ? message : null;
}

/** A user-facing explanation of a refused change, or null for others */
export function questionnaireErrorMessage(error: unknown): string | null {
  switch (questionnaireErrorCode(error)) {
    case 'QUESTIONNAIRE_ANSWERED':
      return m.questionnaire_error_answered();
    case 'QUESTIONNAIRE_CLOSED':
      return m.questionnaire_error_closed();
    case 'QUESTIONNAIRE_HAS_ANSWERS':
      return m.questionnaire_error_has_answers();
    case 'INVALID_ANSWERS':
      return m.questionnaire_error_invalid();
    default:
      return null;
  }
}
