import { z } from 'zod';

export const updateEventTemplateFolderSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  description: z.string().optional(),
  parentFolderId: z.number().int().optional().nullable(),
});

export type UpdateEventTemplateFolderDto = z.infer<
  typeof updateEventTemplateFolderSchema
>;
