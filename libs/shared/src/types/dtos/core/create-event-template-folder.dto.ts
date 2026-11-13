import { z } from 'zod';

export const createEventTemplateFolderSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  description: z.string().optional(),
  parentFolderId: z.number().int().optional().nullable(),
  /** Created in this club's library; absent for the user's own */
  clubId: z.number().int().positive().optional().nullable(),
});

export type CreateEventTemplateFolderDto = z.infer<
  typeof createEventTemplateFolderSchema
>;
