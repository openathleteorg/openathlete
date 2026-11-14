import { z } from 'zod';

export const createEventTemplateSchema = z.object({
  eventId: z.number().int(),
  folderId: z.number().int().optional().nullable(),
  /** Saved in this club's library; absent for the user's own */
  clubId: z.number().int().positive().optional().nullable(),
});

export type CreateEventTemplateDto = z.infer<typeof createEventTemplateSchema>;
