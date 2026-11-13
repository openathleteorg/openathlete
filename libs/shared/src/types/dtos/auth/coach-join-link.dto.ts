import { z } from 'zod';

/**
 * Token of a coach's shareable join link: 16 random bytes in base64url (22
 * characters). The bounds only reject garbage before it reaches the database.
 */
export const coachJoinTokenSchema = z
  .string()
  .min(16)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/);

export const coachJoinTokenParamsSchema = z.object({
  token: coachJoinTokenSchema,
});

export type CoachJoinTokenParamsDto = z.infer<
  typeof coachJoinTokenParamsSchema
>;

/** The coach's own link, as they copy and share it. */
export const coachJoinLinkSchema = z.object({
  token: z.string(),
  url: z.string(),
});

export type CoachJoinLinkDto = z.infer<typeof coachJoinLinkSchema>;

/** What anyone holding the link may see of the coach: never the email. */
export const coachJoinLinkInfoSchema = z.object({
  /** First name and last initial, such as "Ana L." */
  coachName: z.string(),
});

export type CoachJoinLinkInfoDto = z.infer<typeof coachJoinLinkInfoSchema>;

export const acceptCoachJoinLinkResponseSchema = z.object({
  coachName: z.string(),
  /** True when the athlete was already coached by them: nothing changed */
  alreadyLinked: z.boolean(),
});

export type AcceptCoachJoinLinkResponseDto = z.infer<
  typeof acceptCoachJoinLinkResponseSchema
>;
