import { z } from 'zod';

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

/** What an uploaded image is for, which decides who may see it */
export enum STORED_FILE_PURPOSE {
  /** The uploader's private notes and notebook: only them */
  COACH_NOTE = 'COACH_NOTE',
  /** A conversation: its participants */
  MESSAGE = 'MESSAGE',
}

export const uploadImageDtoSchema = z.object({
  purpose: z.nativeEnum(STORED_FILE_PURPOSE),
  /** The conversation, for a MESSAGE image */
  messageThreadId: z.coerce.number().int().positive().optional(),
});

export type UploadImageDto = z.infer<typeof uploadImageDtoSchema>;

export interface UploadedImageDto {
  fileId: string;
}
