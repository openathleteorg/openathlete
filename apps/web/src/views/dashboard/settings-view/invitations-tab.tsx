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
import { SkeletonTableRow } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useUserRoles } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import { toast } from 'sonner';

import { SettingsSection } from './settings-section';

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

  if (isLoading) {
    return (
      <SettingsSection
        title={m.invitations()}
        description={m.pending_invitations_description()}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{m.coach()}</TableHead>
              <TableHead>{m.email()}</TableHead>
              <TableHead className="text-right">{m.actions()}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 2 }).map((_, i) => (
              <SkeletonTableRow key={i} colCount={3} />
            ))}
          </TableBody>
        </Table>
      </SettingsSection>
    );
  }

  if (!hasInvitations) {
    return (
      <SettingsSection
        title={m.invitations()}
        description={m.pending_invitations_description()}
      >
        <div className="text-center text-sm text-muted-foreground">
          {m.no_pending_invitations()}
        </div>
      </SettingsSection>
    );
  }

  return (
    <div className="space-y-6">
      {isAthlete && athleteInvitations && athleteInvitations.length > 0 && (
        <SettingsSection
          title={m.invitations_from_coaches()}
          description={m.invitations_from_coaches_description()}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{m.coach()}</TableHead>
                <TableHead>{m.email()}</TableHead>
                <TableHead className="text-right">{m.actions()}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {athleteInvitations.map((invitation) => (
                <TableRow key={invitation.athleteInvitationId}>
                  <TableCell>
                    {invitation.user.firstName} {invitation.user.lastName}
                  </TableCell>
                  <TableCell>{invitation.user.email}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          rejectAthleteInvitation.mutate(
                            invitation.athleteInvitationId,
                          );
                        }}
                        disabled={rejectAthleteInvitation.isPending}
                      >
                        {m.reject()}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          acceptAthleteInvitation.mutate(
                            invitation.athleteInvitationId,
                          );
                        }}
                        disabled={acceptAthleteInvitation.isPending}
                      >
                        {m.accept()}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SettingsSection>
      )}

      {isCoach && coachInvitations && coachInvitations.length > 0 && (
        <SettingsSection
          title={m.invitations_from_athletes()}
          description={m.invitations_from_athletes_description()}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{m.athlete()}</TableHead>
                <TableHead>{m.email()}</TableHead>
                <TableHead className="text-right">{m.actions()}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coachInvitations.map((invitation) => (
                <TableRow key={invitation.coachInvitationId}>
                  <TableCell>
                    {invitation.athleteUser.firstName}{' '}
                    {invitation.athleteUser.lastName}
                  </TableCell>
                  <TableCell>{invitation.athleteUser.email}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          rejectCoachInvitation.mutate(
                            invitation.coachInvitationId,
                          );
                        }}
                        disabled={rejectCoachInvitation.isPending}
                      >
                        {m.reject()}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          acceptCoachInvitation.mutate(
                            invitation.coachInvitationId,
                          );
                        }}
                        disabled={acceptCoachInvitation.isPending}
                      >
                        {m.accept()}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SettingsSection>
      )}
    </div>
  );
}
