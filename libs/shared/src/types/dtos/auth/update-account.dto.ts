import { z } from 'zod';

import { isTimeZone } from '../../../utils/date';
import { calendarDisplaySchema } from '../core/calendar-display.dto';
import { hiddenActivityTracksSchema } from '../core/hidden-activity-tracks.dto';
import { personNameSchema } from './person-name';

export const updateAccountDtoSchema = z.object({
  firstName: personNameSchema.optional(),
  lastName: personNameSchema.optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  /** The device's IANA time zone, which the app keeps up to date */
  timeZone: z.string().refine(isTimeZone, 'Unknown time zone').optional(),
  /** Push the evening before planned training sessions */
  trainingReminders: z.boolean().optional(),
  /** What the calendar shows */
  calendarDisplay: calendarDisplaySchema.optional(),
  /** Tracks hidden from activity charts, per sport */
  hiddenActivityTracks: hiddenActivityTracksSchema.optional(),
  /** Onboarding tips and alerts about the account, by email */
  emailTips: z.boolean().optional(),
  /** Monthly recap by email */
  emailRecap: z.boolean().optional(),
  /** News about the project, Supporter included: the server dates the consent */
  emailNews: z.boolean().optional(),
  /** The server dates and counts the dismissal: there is no way back from it */
  supportReminderDismissed: z.literal(true).optional(),
  /** The app just showed a Supporter mention in context: the server dates it */
  supporterNudgeSeen: z.literal(true).optional(),
});

export type UpdateAccountDto = z.infer<typeof updateAccountDtoSchema>;
