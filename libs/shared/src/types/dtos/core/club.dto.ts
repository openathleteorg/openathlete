import { z } from 'zod';

import { coachJoinTokenSchema } from '../auth/coach-join-link.dto';

export const CLUB_NAME_MAX = 80;
export const CLUB_DESCRIPTION_MAX = 500;
export const ATHLETE_GROUP_NAME_MAX = 60;
/** More than a club of a few hundred members ever selects at once */
export const ATHLETE_GROUP_BATCH_MAX = 500;

export const CLUB_ROLES = [
  'OWNER',
  'ADMIN',
  'COACH',
  'ASSISTANT',
  'ATHLETE',
] as const;
export const clubRoleSchema = z.enum(CLUB_ROLES);
export type ClubRole = z.infer<typeof clubRoleSchema>;

/** Roles that coach athletes of the club */
export const CLUB_STAFF_ROLES: readonly ClubRole[] = [
  'OWNER',
  'ADMIN',
  'COACH',
  'ASSISTANT',
];
/** Roles that run the club: members, roles, links, settings */
export const CLUB_ADMIN_ROLES: readonly ClubRole[] = ['OWNER', 'ADMIN'];
/** Roles that coach every athlete of the club and manage its groups */
export const CLUB_COACH_ROLES: readonly ClubRole[] = [
  'OWNER',
  'ADMIN',
  'COACH',
];

export const isClubStaff = (role: ClubRole | null | undefined) =>
  !!role && CLUB_STAFF_ROLES.includes(role);
export const isClubAdmin = (role: ClubRole | null | undefined) =>
  !!role && CLUB_ADMIN_ROLES.includes(role);
export const isClubCoach = (role: ClubRole | null | undefined) =>
  !!role && CLUB_COACH_ROLES.includes(role);

// ---------------------------------------------------------------------------
// Clubs
// ---------------------------------------------------------------------------

export const createClubDtoSchema = z.object({
  name: z.string().trim().min(1).max(CLUB_NAME_MAX),
  description: z
    .string()
    .trim()
    .max(CLUB_DESCRIPTION_MAX)
    .nullable()
    .optional(),
});
export type CreateClubDto = z.infer<typeof createClubDtoSchema>;

export const updateClubDtoSchema = createClubDtoSchema.partial();
export type UpdateClubDto = z.infer<typeof updateClubDtoSchema>;

/** A club in the list of the clubs the user belongs to */
export const clubSummarySchema = z.object({
  clubId: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  role: clubRoleSchema,
  /** Members of every role; only counted for the staff */
  memberCount: z.number().nullable(),
});
export type ClubSummaryDto = z.infer<typeof clubSummarySchema>;

/**
 * A member as the club shows them. Athletes of the club only ever see the
 * staff, never the other athletes, and nobody but the staff sees emails.
 */
export const clubMemberSchema = z.object({
  userId: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable(),
  role: clubRoleSchema,
  /** Set for members with an athlete profile, to open their calendar */
  athleteId: z.number().nullable(),
  /** Groups the assistant is entrusted with */
  groupIds: z.array(z.number()),
  joinedAt: z.coerce.date(),
});
export type ClubMemberDto = z.infer<typeof clubMemberSchema>;

export const clubDetailSchema = clubSummarySchema.extend({
  members: z.array(clubMemberSchema),
});
export type ClubDetailDto = z.infer<typeof clubDetailSchema>;

export const updateClubMemberDtoSchema = z.object({
  /** OWNER moves through a transfer, never through a role change */
  role: clubRoleSchema.exclude(['OWNER']),
});
export type UpdateClubMemberDto = z.infer<typeof updateClubMemberDtoSchema>;

export const transferClubDtoSchema = z.object({
  userId: z.number().int().positive(),
});
export type TransferClubDto = z.infer<typeof transferClubDtoSchema>;

export const clubIdParamsSchema = z.object({
  clubId: z.coerce.number().int().positive(),
});
export type ClubIdParamsDto = z.infer<typeof clubIdParamsSchema>;

export const clubMemberParamsSchema = clubIdParamsSchema.extend({
  userId: z.coerce.number().int().positive(),
});
export type ClubMemberParamsDto = z.infer<typeof clubMemberParamsSchema>;

// ---------------------------------------------------------------------------
// Join links
// ---------------------------------------------------------------------------

export const CLUB_JOIN_LINK_KINDS = ['athlete', 'staff'] as const;
export const clubJoinLinkKindSchema = z.enum(CLUB_JOIN_LINK_KINDS);
export type ClubJoinLinkKind = z.infer<typeof clubJoinLinkKindSchema>;

export const clubJoinLinkSchema = z.object({
  token: z.string(),
  url: z.string(),
});
export const clubJoinLinksSchema = z.object({
  athlete: clubJoinLinkSchema.extend({
    /** The same link as a short code, to type in the app */
    code: z.string(),
    expiresAt: z.coerce.date().nullable(),
    /** The group athletes joining through it land in */
    groupId: z.number().nullable(),
  }),
  staff: clubJoinLinkSchema.extend({
    expiresAt: z.coerce.date().nullable(),
  }),
});
export type ClubJoinLinksDto = z.infer<typeof clubJoinLinksSchema>;

export const rotateClubJoinLinkDtoSchema = z.object({
  kind: clubJoinLinkKindSchema,
});
export type RotateClubJoinLinkDto = z.infer<typeof rotateClubJoinLinkDtoSchema>;

export const updateClubJoinLinksDtoSchema = z.object({
  /** null: the link never expires */
  athleteExpiresAt: z.coerce.date().nullable().optional(),
  staffExpiresAt: z.coerce.date().nullable().optional(),
  /** null: athletes land in no group */
  athleteGroupId: z.number().int().positive().nullable().optional(),
});
export type UpdateClubJoinLinksDto = z.infer<
  typeof updateClubJoinLinksDtoSchema
>;

/** 8 letters and digits, without those read alike (0/O, 1/I/L) */
export const CLUB_JOIN_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const clubJoinCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{8}$/);
export const clubJoinCodeParamsSchema = z.object({ code: clubJoinCodeSchema });
export type ClubJoinCodeParamsDto = z.infer<typeof clubJoinCodeParamsSchema>;

export const clubJoinTokenParamsSchema = z.object({
  token: coachJoinTokenSchema,
});
export type ClubJoinTokenParamsDto = z.infer<typeof clubJoinTokenParamsSchema>;

/**
 * What anyone holding a link sees before joining: the club, the role they
 * will have, and, for an athlete, who will see their training. Staff names
 * are a first name and last initial, never an email.
 */
export const clubJoinLinkInfoSchema = z.object({
  clubName: z.string(),
  role: z.enum(['ATHLETE', 'COACH']),
  staff: z.array(z.object({ name: z.string(), role: clubRoleSchema })),
});
export type ClubJoinLinkInfoDto = z.infer<typeof clubJoinLinkInfoSchema>;

export const acceptClubJoinLinkResponseSchema = z.object({
  clubId: z.number(),
  clubName: z.string(),
  role: clubRoleSchema,
  /** True when the user was already a member: nothing changed */
  alreadyMember: z.boolean(),
});
export type AcceptClubJoinLinkResponseDto = z.infer<
  typeof acceptClubJoinLinkResponseSchema
>;

// ---------------------------------------------------------------------------
// Athlete groups
// ---------------------------------------------------------------------------

export const athleteGroupSchema = z.object({
  athleteGroupId: z.number(),
  name: z.string(),
  parentId: z.number().nullable(),
  clubId: z.number().nullable(),
  athleteIds: z.array(z.number()),
  /** Assistants entrusted with the group (club groups only) */
  staffUserIds: z.array(z.number()),
});
export type AthleteGroupDto = z.infer<typeof athleteGroupSchema>;

export const athleteGroupsQuerySchema = z.object({
  /** A club's groups; absent for the coach's own */
  clubId: z.coerce.number().int().positive().optional(),
});
export type AthleteGroupsQueryDto = z.infer<typeof athleteGroupsQuerySchema>;

export const createAthleteGroupDtoSchema = z.object({
  name: z.string().trim().min(1).max(ATHLETE_GROUP_NAME_MAX),
  /** A sub-group of this group, which must be a top-level group */
  parentId: z.number().int().positive().nullable().optional(),
  /** Created in this club; absent for one of the coach's own groups */
  clubId: z.number().int().positive().nullable().optional(),
});
export type CreateAthleteGroupDto = z.infer<typeof createAthleteGroupDtoSchema>;

export const updateAthleteGroupDtoSchema = z.object({
  name: z.string().trim().min(1).max(ATHLETE_GROUP_NAME_MAX),
});
export type UpdateAthleteGroupDto = z.infer<typeof updateAthleteGroupDtoSchema>;

export const athleteGroupIdParamsSchema = z.object({
  athleteGroupId: z.coerce.number().int().positive(),
});
export type AthleteGroupIdParamsDto = z.infer<
  typeof athleteGroupIdParamsSchema
>;

export const athleteGroupAthletesDtoSchema = z.object({
  athleteIds: z
    .array(z.number().int().positive())
    .min(1)
    .max(ATHLETE_GROUP_BATCH_MAX),
});
export type AthleteGroupAthletesDto = z.infer<
  typeof athleteGroupAthletesDtoSchema
>;

export const athleteGroupStaffDtoSchema = z.object({
  /** Every assistant entrusted with the group: replaces the previous list */
  userIds: z.array(z.number().int().positive()).max(ATHLETE_GROUP_BATCH_MAX),
});
export type AthleteGroupStaffDto = z.infer<typeof athleteGroupStaffDtoSchema>;

// ---------------------------------------------------------------------------
// Personal invitations
// ---------------------------------------------------------------------------

/** A club's whole membership list, at most, in one import */
export const CLUB_INVITATIONS_MAX = 500;

export const clubInvitationPersonSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  firstName: z.string().trim().max(50).optional(),
  lastName: z.string().trim().max(50).optional(),
  /** Group to land in, by name; created when the club has none by it */
  group: z.string().trim().max(ATHLETE_GROUP_NAME_MAX).optional(),
});
export type ClubInvitationPerson = z.infer<typeof clubInvitationPersonSchema>;

export const inviteToClubDtoSchema = z.object({
  people: z.array(clubInvitationPersonSchema).min(1).max(CLUB_INVITATIONS_MAX),
  role: z.enum(['ATHLETE', 'COACH']).default('ATHLETE'),
});
export type InviteToClubDto = z.infer<typeof inviteToClubDtoSchema>;

export const inviteToClubResultSchema = z.object({
  invited: z.number(),
  /** Left out: already members, already invited, or twice in the list */
  skipped: z.array(
    z.object({
      email: z.string(),
      reason: z.enum(['MEMBER', 'INVITED', 'DUPLICATE']),
    }),
  ),
  /** Groups the list named that did not exist */
  groupsCreated: z.array(z.string()),
});
export type InviteToClubResultDto = z.infer<typeof inviteToClubResultSchema>;

export const clubInvitationSchema = z.object({
  clubInvitationId: z.number(),
  email: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  role: clubRoleSchema,
  groupName: z.string().nullable(),
  sentAt: z.coerce.date(),
});
export type ClubInvitationDto = z.infer<typeof clubInvitationSchema>;

export const clubInvitationParamsSchema = clubIdParamsSchema.extend({
  clubInvitationId: z.coerce.number().int().positive(),
});
export type ClubInvitationParamsDto = z.infer<
  typeof clubInvitationParamsSchema
>;
