import { z } from 'zod';

import { isTimeZone } from '../../../utils/date';
import { calendarDisplaySchema } from '../core/calendar-display.dto';
import { hiddenActivityTracksSchema } from '../core/hidden-activity-tracks.dto';
import { unitSystemSchema } from '../core/unit-system.dto';

export const updateAccountDtoSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  /** The device's IANA time zone, which the app keeps up to date */
  timeZone: z.string().refine(isTimeZone, 'Unknown time zone').optional(),
  /** Push the evening before planned training sessions */
  trainingReminders: z.boolean().optional(),
  /** What the calendar shows */
  calendarDisplay: calendarDisplaySchema.optional(),
  /** Tracks hidden from activity charts, per sport */
  hiddenActivityTracks: hiddenActivityTracksSchema.optional(),
  /** The server dates the dismissal: there is no way back from it */
  supportReminderDismissed: z.literal(true).optional(),
  /** Units the app shows distances, weights and speeds in */
  unitSystem: unitSystemSchema.optional(),
});

export type UpdateAccountDto = z.infer<typeof updateAccountDtoSchema>;
