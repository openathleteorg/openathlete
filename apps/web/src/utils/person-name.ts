import { m } from '@/paraglide/messages';
import { z } from 'zod';

import {
  PERSON_NAME_MAX_LENGTH,
  isPlausiblePersonName,
} from '@openathlete/shared';

/** Same rules as the API's personNameSchema, with a translated message. */
export function localizedPersonNameSchema() {
  const message = m.person_name_invalid({ max: PERSON_NAME_MAX_LENGTH });
  return z
    .string()
    .trim()
    .min(1, message)
    .max(PERSON_NAME_MAX_LENGTH, message)
    .refine(isPlausiblePersonName, message);
}
