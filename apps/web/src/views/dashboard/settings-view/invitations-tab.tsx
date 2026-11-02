import {
  useAcceptInvitationMutation,
  useGetPendingInvitationsQuery,
  useRejectInvitationMutation,
} from '@/api/athlete';
import {
  useAcceptInvitationMutation as useCoachAcceptInvitationMutation,
  useGetPendingInvitationsQuery as useCoachGetPendingInvitationsQuery,
  useRejectInvitationMutation as useCoachRejectInvitationMutation,
} from '@/api/coach';
import { Button } from '@/components/ui/button';
import { useUserRoles } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import { toast } from 'sonner';

import {
  SettingsEmpty,
  SettingsPanel,
  SettingsRow,
  SettingsRowsSkeleton,
  SettingsSection,
} from './settings-section';

type Invitation = {
  id: number;
  name: string;
  email: string;
};

function InvitationRows({
  invitations,
  isPending,
  onAccept,
  onReject,
}: {
  invitations: Invitation[];
  isPending: boolean;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
}) {
  return (
    <SettingsPanel>
      {invitations.map((invitation) => (
        <SettingsRow
          key={invitation.id}
          stacked
          title={invitation.name}
          description={invitation.email}
        >
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => onReject(invitation.id)}
            disabled={isPending}
          >
            {m.reject()}
          </Button>
          <Button
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => onAccept(invitation.id)}
            disabled={isPending}
          >
            {m.accept()}
          </Button>
        </SettingsRow>
      ))}
    </SettingsPanel>
  );
}

export function InvitationsTab() {
  const roles = useUserRoles();
  const isAthlete = roles?.includes('ATHLETE');
  const isCoach = roles?.includes('COACH');

  // Athlete invitations (invitations from coaches)
  const { data: athleteInvitations, isLoading: athleteInvitationsLoading } =
    useGetPendingInvitationsQuery({
      enabled: isAthlete,
    });

  const acceptAthleteInvitation = useAcceptInvitationMutation({
    onSuccess: () => {
      toast.success(m.invitation_accepted());
    },
    onError: () => {
      toast.error(m.failed_to_accept_invitation());
    },
  });

  const rejectAthleteInvitation = useRejectInvitationMutation({
    onSuccess: () => {
      toast.success(m.invitation_rejected());
    },
    onError: () => {
      toast.error(m.failed_to_reject_invitation());
    },
  });

  // Coach invitations (invitations from athletes)
  const { data: coachInvitations, isLoading: coachInvitationsLoading } =
    useCoachGetPendingInvitationsQuery({
      enabled: isCoach,
    });

  const acceptCoachInvitation = useCoachAcceptInvitationMutation({
    onSuccess: () => {
      toast.success(m.invitation_accepted());
    },
    onError: () => {
      toast.error(m.failed_to_accept_invitation());
    },
  });

  const rejectCoachInvitation = useCoachRejectInvitationMutation({
    onSuccess: () => {
      toast.success(m.invitation_rejected());
    },
    onError: () => {
      toast.error(m.failed_to_reject_invitation());
    },
  });

  const isLoading = athleteInvitationsLoading || coachInvitationsLoading;
  const hasInvitations =
    (athleteInvitations && athleteInvitations.length > 0) ||
    (coachInvitations && coachInvitations.length > 0);

  if (isLoading) return <SettingsRowsSkeleton />;

  if (!hasInvitations) {
    return <SettingsEmpty>{m.no_pending_invitations()}</SettingsEmpty>;
  }

  return (
    <div className="space-y-8">
      {isAthlete && athleteInvitations && athleteInvitations.length > 0 && (
        <SettingsSection
          title={m.invitations_from_coaches()}
          description={m.invitations_from_coaches_description()}
        >
          <InvitationRows
            invitations={athleteInvitations.map((invitation) => ({
              id: invitation.athleteInvitationId,
              name: `${invitation.user.firstName} ${invitation.user.lastName}`,
              email: invitation.user.email,
            }))}
            isPending={
              acceptAthleteInvitation.isPending ||
              rejectAthleteInvitation.isPending
            }
            onAccept={(id) => acceptAthleteInvitation.mutate(id)}
            onReject={(id) => rejectAthleteInvitation.mutate(id)}
          />
        </SettingsSection>
      )}

      {isCoach && coachInvitations && coachInvitations.length > 0 && (
        <SettingsSection
          title={m.invitations_from_athletes()}
          description={m.invitations_from_athletes_description()}
        >
          <InvitationRows
            invitations={coachInvitations.map((invitation) => ({
              id: invitation.coachInvitationId,
              name: `${invitation.athleteUser.firstName} ${invitation.athleteUser.lastName}`,
              email: invitation.athleteUser.email,
            }))}
            isPending={
              acceptCoachInvitation.isPending || rejectCoachInvitation.isPending
            }
            onAccept={(id) => acceptCoachInvitation.mutate(id)}
            onReject={(id) => rejectCoachInvitation.mutate(id)}
          />
        </SettingsSection>
      )}
    </div>
  );
}
