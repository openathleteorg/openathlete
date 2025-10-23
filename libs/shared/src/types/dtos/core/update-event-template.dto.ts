import { z } from 'zod';

export const updateEventTemplateSchema = z.object({
  folderId: z.number().int().optional().nullable(),
});

export type UpdateEventTemplateDto = z.infer<typeof updateEventTemplateSchema>;
