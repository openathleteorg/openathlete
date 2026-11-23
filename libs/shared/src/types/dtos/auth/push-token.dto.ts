import { z } from 'zod';

// Firebase registration tokens are URL-safe base64 around a colon. Anything
// else is a device token decoded the wrong way, which PostgreSQL may not
// even store (a NUL byte)
export const PUSH_TOKEN_PATTERN = /^[A-Za-z0-9_:-]+$/;

export const updatePushTokenDtoSchema = z.object({
  pushToken: z.string().min(1).max(4096).regex(PUSH_TOKEN_PATTERN),
});

export type UpdatePushTokenDto = z.infer<typeof updatePushTokenDtoSchema>;
