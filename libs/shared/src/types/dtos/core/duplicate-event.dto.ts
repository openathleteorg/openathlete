import { z } from 'zod';

export const duplicateEventDtoSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type DuplicateEventDto = z.infer<typeof duplicateEventDtoSchema>;
