import {
  useCancelAthleteInvitationMutation,
  useGetMyCoachedAthletesQuery,
  useGetSentAthleteInvitationsQuery,
  useInviteAthleteMutation,
  useRemoveAthleteMutation,
} from '@/api/athlete';
import { ConfirmAction } from '@/components/confirm-action';
import { InviteAthleteDialog } from '@/components/invite-athlete-dialog/invite-athlete.dialog';
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
import { getPath } from '@/routes/paths';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function AthletesTab() {
  const { data: athletes } = useGetMyCoachedAthletesQuery();
  const nav = useNavigate();
  const { data: sentInvitations, isLoading: sentInvitationsLoading } =
    useGetSentAthleteInvitationsQuery({ enabled: true });
  const [deleteAthleteDialog, setDeleteAthleteDialog] = useState<number | null>(
    null,
  );
  const [inviteAthleteDialog, setInviteAthleteDialog] = useState(false);
  const removeAthleteMutation = useRemoveAthleteMutation();
  const inviteAthleteMutation = useInviteAthleteMutation({
    onSuccess: () => {
      setInviteAthleteDialog(false);
      toast.success(m.athlete_invited_successfully());
    },
  });
  const cancelInvitationMutation = useCancelAthleteInvitationMutation({
    onSuccess: () => {
      toast.success(m.invitation_cancelled());
    },
    onError: () => {
      toast.error(m.failed_to_cancel_invitation());
    },
  });
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <>
      <div className="my-4 flex justify-between">
        <div className="text-lg font-semibold mb-4">{m.athletes()}</div>
        <Button size="sm" onClick={() => setInviteAthleteDialog(true)}>
          {m.invite_athlete()}
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{m.name()}</TableHead>
            <TableHead>{m.email()}</TableHead>
            <TableHead className="text-right">{m.actions()}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {athletes?.map((athlete) => (
            <TableRow key={athlete.athleteId}>
              <TableCell>
                {athlete.user?.firstName} {athlete.user?.lastName}
              </TableCell>
              <TableCell>{athlete.user?.email}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() =>
                    nav(
                      getPath(['dashboard', 'calendar']) +
                        `/${athlete.athleteId}`,
                    )
                  }
                >
                  {m.view_calendar()}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDeleteAthleteDialog(athlete.athleteId);
                  }}
                >
                  {m.delete_()}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <InviteAthleteDialog
        open={inviteAthleteDialog}
        onClose={() => setInviteAthleteDialog(false)}
        onInvite={(email) => inviteAthleteMutation.mutate({ email })}
        isLoading={inviteAthleteMutation.isPending}
      />
      {sentInvitationsLoading ? (
        <div className="mt-12 text-sm text-muted-foreground">{m.loading()}</div>
      ) : (
        sentInvitations &&
        sentInvitations.length > 0 && (
          <div className="mt-12">
            <h3 className="text-md font-semibold mb-3">
              {m.sent_invitations_to_athletes()}
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{m.email()}</TableHead>
                  <TableHead>{m.invitation_sent_at()}</TableHead>
                  <TableHead className="text-right">{m.actions()}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sentInvitations.map((invitation) => (
                  <TableRow key={invitation.athleteInvitationId}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>{formatDate(invitation.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          cancelInvitationMutation.mutate(
                            invitation.athleteInvitationId,
                          )
                        }
                        disabled={cancelInvitationMutation.isPending}
                      >
                        {m.cancel_invitation()}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      )}
      <ConfirmAction
        open={!!deleteAthleteDialog}
        onClose={() => setDeleteAthleteDialog(null)}
        onConfirm={() => {
          if (deleteAthleteDialog) {
            removeAthleteMutation.mutate(deleteAthleteDialog);
          }
          setDeleteAthleteDialog(null);
        }}
        title={m.delete_athlete()}
        message={m.confirm_delete_athlete()}
        isLoading={removeAthleteMutation.isPending}
      />
    </>
  );
}
