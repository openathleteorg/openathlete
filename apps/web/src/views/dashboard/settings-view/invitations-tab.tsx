import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { m } from '@/paraglide/messages';
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
import { useUserRoles } from '@/contexts/auth';
import { toast } from 'sonner';

interface P {}

export function InvitationsTab({}: P) {
  const roles = useUserRoles();
  const isAthlete = roles?.includes('ATHLETE');
  const isCoach = roles?.includes('COACH');

  // Athlete invitations (invitations from coaches)
  const {
    data: athleteInvitations,
    isLoading: athleteInvitationsLoading,
  } = useGetPendingInvitationsQuery({
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
  const {
    data: coachInvitations,
    isLoading: coachInvitationsLoading,
  } = useCoachGetPendingInvitationsQuery({
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

  if (athleteInvitationsLoading || coachInvitationsLoading) {
    return <div>{m.loading()}</div>;
  }

  const hasInvitations =
    (athleteInvitations && athleteInvitations.length > 0) ||
    (coachInvitations && coachInvitations.length > 0);

  if (!hasInvitations) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {m.no_pending_invitations()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isAthlete && athleteInvitations && athleteInvitations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {m.invitations_from_coaches()}
          </h2>
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
        </div>
      )}

      {isCoach && coachInvitations && coachInvitations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {m.invitations_from_athletes()}
          </h2>
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
        </div>
      )}
    </div>
  );
}

