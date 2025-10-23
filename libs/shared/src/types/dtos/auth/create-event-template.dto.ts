import { z } from 'zod';

export const createEventTemplateSchema = z.object({
  eventId: z.number().int(),
  folderId: z.number().int().optional().nullable(),
});

export type CreateEventTemplateDto = z.infer<typeof createEventTemplateSchema>;
