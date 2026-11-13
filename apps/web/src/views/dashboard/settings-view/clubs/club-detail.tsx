import {
  useClubQuery,
  useDeleteClubMutation,
  useRemoveClubMemberMutation,
  useTransferClubMutation,
  useUpdateClubMemberMutation,
  useUpdateClubMutation,
} from '@/api/club';
import { clubRoleLabel } from '@/components/clubs/club-role';
import { GroupsManager } from '@/components/clubs/groups-manager';
import { NameDialog } from '@/components/clubs/name-dialog';
import { ConfirmAction } from '@/components/confirm-action';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthContext } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
  CLUB_NAME_MAX,
  ClubMemberDto,
  ClubRole,
  isClubAdmin,
  isClubCoach,
  isClubStaff,
} from '@openathlete/shared';

import {
  SettingsEmpty,
  SettingsPanel,
  SettingsRow,
  SettingsRowsSkeleton,
  SettingsSection,
} from '../settings-section';
import { ClubInvitationsSection } from './club-invitations-section';
import { ClubJoinLinksSection } from './club-join-links-section';

const clubsTab = `${getPath(['dashboard', 'settings'])}?tab=clubs`;

type Assignable = Exclude<ClubRole, 'OWNER'>;

const fullName = (member: ClubMemberDto) =>
  `${member.firstName} ${member.lastName}`;

type Pending =
  | { kind: 'remove'; member: ClubMemberDto }
  | { kind: 'transfer'; member: ClubMemberDto }
  | { kind: 'leave' }
  | { kind: 'delete' }
  | { kind: 'rename' }
  | null;

export function ClubDetail({ clubId }: { clubId: number }) {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { data: club, isPending, isError } = useClubQuery(clubId);
  const [pending, setPending] = useState<Pending>(null);
  const close = () => setPending(null);

  const updateMember = useUpdateClubMemberMutation(clubId);
  const removeMember = useRemoveClubMemberMutation(clubId);
  const transfer = useTransferClubMutation(clubId);
  const update = useUpdateClubMutation(clubId);
  const deleteClub = useDeleteClubMutation();
  const failed = () => toast.error(m.club_save_failed());

  const role = club?.role;
  const staff = useMemo(
    () => club?.members.filter((member) => isClubStaff(member.role)) ?? [],
    [club],
  );
  const athletes = useMemo(
    () => club?.members.filter((member) => member.role === 'ATHLETE') ?? [],
    [club],
  );

  if (isPending) return <SettingsRowsSkeleton count={4} />;
  if (isError || !club) {
    return (
      <div className="space-y-4">
        <SettingsEmpty>{m.club_not_found()}</SettingsEmpty>
        <Button asChild variant="outline">
          <Link to={clubsTab}>{m.club_back_to_clubs()}</Link>
        </Button>
      </div>
    );
  }

  const isMe = (member: ClubMemberDto) => member.userId === user?.userId;
  const canManage = (member: ClubMemberDto) =>
    !isMe(member) &&
    isClubAdmin(role) &&
    member.role !== 'OWNER' &&
    (member.role !== 'ADMIN' || role === 'OWNER');
  const rolesFor = (member: ClubMemberDto): Assignable[] =>
    (['ADMIN', 'COACH', 'ASSISTANT', 'ATHLETE'] as const).filter(
      (next) =>
        next !== member.role &&
        (next !== 'ADMIN' || role === 'OWNER') &&
        (next !== 'ATHLETE' || member.athleteId !== null),
    );

  const memberRow = (member: ClubMemberDto) => (
    <SettingsRow
      key={member.userId}
      data-club-member={member.email ?? fullName(member)}
      title={
        <span className="flex flex-wrap items-center gap-2">
          {fullName(member)}
          {isMe(member) && (
            <span className="text-muted-foreground">{m.club_you()}</span>
          )}
          <Badge variant="secondary">{clubRoleLabel(member.role)}</Badge>
        </span>
      }
      description={member.email ?? undefined}
    >
      {member.role === 'ATHLETE' && member.athleteId && isClubStaff(role) && (
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex"
          asChild
        >
          <Link
            to={`${getPath(['dashboard', 'calendar'])}/${member.athleteId}`}
          >
            {m.view_calendar()}
          </Link>
        </Button>
      )}
      {(canManage(member) ||
        (role === 'OWNER' && isClubStaff(member.role) && !isMe(member))) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="max-md:w-11"
              aria-label={`${m.actions()} ${fullName(member)}`}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canManage(member) &&
              rolesFor(member).map((next) => (
                <DropdownMenuItem
                  key={next}
                  onClick={() =>
                    updateMember.mutate(
                      { userId: member.userId, role: next },
                      {
                        onSuccess: () =>
                          toast.success(
                            m.club_role_changed({
                              name: fullName(member),
                              role: clubRoleLabel(next),
                            }),
                          ),
                        onError: failed,
                      },
                    )
                  }
                >
                  {m.club_make_role({ role: clubRoleLabel(next) })}
                </DropdownMenuItem>
              ))}
            {role === 'OWNER' && isClubStaff(member.role) && (
              <DropdownMenuItem
                onClick={() => setPending({ kind: 'transfer', member })}
              >
                {m.club_transfer()}
              </DropdownMenuItem>
            )}
            {canManage(member) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setPending({ kind: 'remove', member })}
                >
                  {m.club_remove_member()}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </SettingsRow>
  );

  return (
    <div className="space-y-8" data-club-detail={club.name}>
      <div className="space-y-2 px-1">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to={clubsTab}>
            <ArrowLeft className="size-4" />
            {m.club_back_to_clubs()}
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">{club.name}</h2>
          {role && <Badge variant="outline">{clubRoleLabel(role)}</Badge>}
        </div>
        {club.description && (
          <p className="text-sm text-muted-foreground">{club.description}</p>
        )}
      </div>

      <SettingsSection
        title={m.club_staff_title()}
        description={
          role === 'ATHLETE' ? m.club_staff_athlete_description() : undefined
        }
      >
        <SettingsPanel>{staff.map(memberRow)}</SettingsPanel>
      </SettingsSection>

      {isClubStaff(role) && (
        <SettingsSection
          title={m.club_athletes_title({ count: athletes.length })}
          description={
            role === 'ASSISTANT'
              ? m.club_athletes_assistant_description()
              : undefined
          }
        >
          {athletes.length === 0 ? (
            <SettingsEmpty>{m.club_no_athletes()}</SettingsEmpty>
          ) : (
            <SettingsPanel>{athletes.map(memberRow)}</SettingsPanel>
          )}
        </SettingsSection>
      )}

      {isClubStaff(role) && (
        <GroupsManager
          clubId={clubId}
          canManage={isClubCoach(role)}
          description={m.club_groups_description()}
          athletes={athletes
            .filter((member) => member.athleteId !== null)
            .map((member) => ({
              id: member.athleteId as number,
              name: fullName(member),
              detail: member.email ?? undefined,
            }))}
          assistants={staff
            .filter((member) => member.role === 'ASSISTANT')
            .map((member) => ({ id: member.userId, name: fullName(member) }))}
        />
      )}

      {isClubAdmin(role) && <ClubJoinLinksSection clubId={clubId} />}
      {isClubAdmin(role) && <ClubInvitationsSection clubId={clubId} />}

      <SettingsSection title={m.club_settings_title()}>
        <SettingsPanel>
          {isClubAdmin(role) && (
            <SettingsRow
              title={m.club_rename()}
              description={m.club_rename_description()}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPending({ kind: 'rename' })}
              >
                {m.rename()}
              </Button>
            </SettingsRow>
          )}
          {role === 'OWNER' ? (
            <SettingsRow
              title={m.club_delete()}
              description={m.club_delete_description()}
            >
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setPending({ kind: 'delete' })}
              >
                {m.delete_()}
              </Button>
            </SettingsRow>
          ) : (
            <SettingsRow
              title={m.club_leave()}
              description={m.club_leave_description()}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPending({ kind: 'leave' })}
              >
                {m.club_leave()}
              </Button>
            </SettingsRow>
          )}
        </SettingsPanel>
      </SettingsSection>

      <NameDialog
        open={pending?.kind === 'rename'}
        onClose={close}
        title={m.club_rename()}
        label={m.club_name()}
        submitLabel={m.save()}
        maxLength={CLUB_NAME_MAX}
        defaultValue={club.name}
        isLoading={update.isPending}
        onSubmit={(name) =>
          update.mutate({ name }, { onSuccess: close, onError: failed })
        }
      />
      <ConfirmAction
        open={pending?.kind === 'remove'}
        onClose={close}
        title={m.club_remove_member()}
        message={m.club_remove_member_message({
          name: pending?.kind === 'remove' ? fullName(pending.member) : '',
        })}
        isLoading={removeMember.isPending}
        onConfirm={() =>
          pending?.kind === 'remove' &&
          removeMember.mutate(pending.member.userId, {
            onSuccess: close,
            onError: failed,
          })
        }
      />
      <ConfirmAction
        open={pending?.kind === 'transfer'}
        onClose={close}
        title={m.club_transfer()}
        message={m.club_transfer_message({
          name: pending?.kind === 'transfer' ? fullName(pending.member) : '',
        })}
        isLoading={transfer.isPending}
        onConfirm={() =>
          pending?.kind === 'transfer' &&
          transfer.mutate(pending.member.userId, {
            onSuccess: close,
            onError: failed,
          })
        }
      />
      <ConfirmAction
        open={pending?.kind === 'leave'}
        onClose={close}
        title={m.club_leave()}
        message={m.club_leave_message({ club: club.name })}
        isLoading={removeMember.isPending}
        onConfirm={() =>
          user &&
          removeMember.mutate(user.userId, {
            onSuccess: () => navigate(clubsTab, { replace: true }),
            onError: failed,
          })
        }
      />
      <ConfirmAction
        open={pending?.kind === 'delete'}
        onClose={close}
        title={m.club_delete()}
        message={m.club_delete_message({ club: club.name })}
        confirmText={m.delete_()}
        isLoading={deleteClub.isPending}
        onConfirm={() =>
          deleteClub.mutate(clubId, {
            onSuccess: () => navigate(clubsTab, { replace: true }),
            onError: failed,
          })
        }
      />
    </div>
  );
}
