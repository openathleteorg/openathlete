import {
  useCancelCoachInvitationMutation,
  useGetMyCoachesQuery,
  useGetSentCoachInvitationsQuery,
  useRemoveCoachMutation,
} from '@/api/athlete';
import { ConfirmAction } from '@/components/confirm-action';
import { InviteCoachDialog } from '@/components/invite-coach-dialog/invite-coach.dialog';
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
import { useState } from 'react';
import { toast } from 'sonner';

export function CoachesTab() {
  const { data: coaches } = useGetMyCoachesQuery();
  const { data: sentInvitations, isLoading: sentInvitationsLoading } =
    useGetSentCoachInvitationsQuery({ enabled: true });
  const [inviteCoachDialogOpen, setInviteCoachDialogOpen] =
    useState<boolean>(false);
  const [deleteCoachDialog, setDeleteEventDialog] = useState<number | null>(
    null,
  );
  const removeCoachMutation = useRemoveCoachMutation();
  const cancelInvitationMutation = useCancelCoachInvitationMutation({
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
        <div className="text-lg font-semibold mb-4">{m.coaches()}</div>
        <Button
          size="sm"
          onClick={() => {
            setInviteCoachDialogOpen(true);
          }}
        >
          {m.invite_a_coach()}
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
          {coaches?.map((coach) => (
            <TableRow key={coach.userId}>
              <TableCell>
                {coach.firstName} {coach.lastName}
              </TableCell>
              <TableCell>{coach.email}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDeleteEventDialog(coach.userId);
                  }}
                >
                  {m.delete_()}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <InviteCoachDialog
        open={inviteCoachDialogOpen}
        onClose={() => setInviteCoachDialogOpen(false)}
      />
      {sentInvitationsLoading ? (
        <div className="mt-12 text-sm text-muted-foreground">{m.loading()}</div>
      ) : (
        sentInvitations &&
        sentInvitations.length > 0 && (
          <div className="mt-12">
            <h3 className="text-md font-semibold mb-3">
              {m.sent_invitations_to_coaches()}
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
                  <TableRow key={invitation.coachInvitationId}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>{formatDate(invitation.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          cancelInvitationMutation.mutate(
                            invitation.coachInvitationId,
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
        open={!!deleteCoachDialog}
        onClose={() => setDeleteEventDialog(null)}
        onConfirm={() => {
          if (deleteCoachDialog) {
            removeCoachMutation.mutate(deleteCoachDialog);
          }
          setDeleteEventDialog(null);
        }}
        title={m.delete_coach()}
        message={m.confirm_delete_coach()}
        isLoading={removeCoachMutation.isPending}
      />
    </>
  );
}
