import { athleteKeys } from '@/api/athlete/athlete.keys';
import { coachKeys } from '@/api/coach/coach.keys';
import { useAuthContext } from '@/contexts/auth';
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  ClubJoinLinkKind,
  CreateAthleteGroupDto,
  CreateClubDto,
  InviteToClubDto,
  UpdateClubDto,
  UpdateClubJoinLinksDto,
} from '@openathlete/shared';

import { AthleteGroupAPI, ClubAPI } from './club.api';
import { athleteGroupKeys, clubKeys } from './club.keys';

/**
 * Who coaches whom follows the club's members, roles and groups: every list
 * of athletes and coaches may have changed.
 */
export const invalidateAfterClubChange = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: clubKeys.all }),
    queryClient.invalidateQueries({ queryKey: athleteGroupKeys.all }),
    queryClient.invalidateQueries({ queryKey: [athleteKeys.getMyCoaches] }),
    queryClient.invalidateQueries({
      queryKey: [athleteKeys.getCoachedAthletes],
    }),
    queryClient.invalidateQueries({ queryKey: coachKeys.all }),
  ]);

/** Changes that touch the club's access, then refresh everything it shows */
const useClubMutation = <TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>,
  { refreshUser = false }: { refreshUser?: boolean } = {},
) => {
  const queryClient = useQueryClient();
  const { initialize } = useAuthContext();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      // Creating or joining a club as staff makes a coach of the user
      if (refreshUser) await initialize();
      await invalidateAfterClubChange(queryClient);
    },
  });
};

export const useMyClubsQuery = ({
  enabled = true,
}: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: clubKeys.mine,
    queryFn: ClubAPI.listMine,
    enabled,
  });

export const useClubQuery = (clubId: number | null) =>
  useQuery({
    queryKey: clubKeys.detail(clubId ?? 0),
    queryFn: () => ClubAPI.get(clubId as number),
    enabled: clubId !== null,
    retry: false,
  });

export const useCreateClubMutation = () =>
  useClubMutation((body: CreateClubDto) => ClubAPI.create(body), {
    refreshUser: true,
  });

export const useUpdateClubMutation = (clubId: number) =>
  useClubMutation((body: UpdateClubDto) => ClubAPI.update(clubId, body));

export const useDeleteClubMutation = () =>
  useClubMutation((clubId: number) => ClubAPI.delete(clubId));

export const useUpdateClubMemberMutation = (clubId: number) =>
  useClubMutation(
    ({
      userId,
      role,
    }: {
      userId: number;
      role: 'ADMIN' | 'COACH' | 'ASSISTANT' | 'ATHLETE';
    }) => ClubAPI.updateMember(clubId, userId, { role }),
  );

export const useRemoveClubMemberMutation = (clubId: number) =>
  useClubMutation((userId: number) => ClubAPI.removeMember(clubId, userId));

export const useTransferClubMutation = (clubId: number) =>
  useClubMutation((userId: number) => ClubAPI.transfer(clubId, userId));

export const useClubJoinLinksQuery = (clubId: number, enabled: boolean) =>
  useQuery({
    queryKey: clubKeys.joinLinks(clubId),
    queryFn: () => ClubAPI.getJoinLinks(clubId),
    enabled,
    staleTime: Infinity,
  });

export const useRotateClubJoinLinkMutation = (clubId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (kind: ClubJoinLinkKind) =>
      ClubAPI.rotateJoinLink(clubId, kind),
    onSuccess: (links) =>
      queryClient.setQueryData(clubKeys.joinLinks(clubId), links),
  });
};

export const useUpdateClubJoinLinksMutation = (clubId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateClubJoinLinksDto) =>
      ClubAPI.updateJoinLinks(clubId, body),
    onSuccess: (links) =>
      queryClient.setQueryData(clubKeys.joinLinks(clubId), links),
  });
};

export const useClubInvitationsQuery = (clubId: number, enabled: boolean) =>
  useQuery({
    queryKey: clubKeys.invitations(clubId),
    queryFn: () => ClubAPI.getInvitations(clubId),
    enabled,
  });

export const useInviteToClubMutation = (clubId: number) =>
  useClubMutation((body: InviteToClubDto) => ClubAPI.invite(clubId, body));

export const useResendClubInvitationMutation = (clubId: number) =>
  useClubMutation((id: number) => ClubAPI.resendInvitation(clubId, id));

export const useRevokeClubInvitationMutation = (clubId: number) =>
  useClubMutation((id: number) => ClubAPI.revokeInvitation(clubId, id));

export const useClubJoinInfoQuery = (token: string | undefined) =>
  useQuery({
    queryKey: clubKeys.joinInfo(token ?? ''),
    queryFn: () => ClubAPI.getJoinInfo(token as string),
    enabled: !!token,
    retry: false,
  });

export const useAcceptClubJoinMutation = () =>
  useClubMutation((token: string) => ClubAPI.acceptJoin(token), {
    refreshUser: true,
  });

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

/** A club's groups, or the coach's own when clubId is null */
export const useAthleteGroupsQuery = (
  clubId: number | null,
  { enabled = true }: { enabled?: boolean } = {},
) =>
  useQuery({
    queryKey: athleteGroupKeys.list(clubId),
    queryFn: () => AthleteGroupAPI.list(clubId ?? undefined),
    enabled,
  });

export const useCreateAthleteGroupMutation = () =>
  useClubMutation((body: CreateAthleteGroupDto) =>
    AthleteGroupAPI.create(body),
  );

export const useRenameAthleteGroupMutation = () =>
  useClubMutation(({ groupId, name }: { groupId: number; name: string }) =>
    AthleteGroupAPI.rename(groupId, name),
  );

export const useDeleteAthleteGroupMutation = () =>
  useClubMutation((groupId: number) => AthleteGroupAPI.delete(groupId));

export const useAddGroupAthletesMutation = () =>
  useClubMutation(
    ({ groupId, athleteIds }: { groupId: number; athleteIds: number[] }) =>
      AthleteGroupAPI.addAthletes(groupId, athleteIds),
  );

export const useRemoveGroupAthleteMutation = () =>
  useClubMutation(
    ({ groupId, athleteId }: { groupId: number; athleteId: number }) =>
      AthleteGroupAPI.removeAthlete(groupId, athleteId),
  );

export const useSetGroupStaffMutation = () =>
  useClubMutation(
    ({ groupId, userIds }: { groupId: number; userIds: number[] }) =>
      AthleteGroupAPI.setStaff(groupId, userIds),
  );
