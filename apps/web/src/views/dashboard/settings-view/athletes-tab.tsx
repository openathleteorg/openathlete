import {
  useCancelAthleteInvitationMutation,
  useGetMyCoachedAthletesQuery,
  useGetSentAthleteInvitationsQuery,
  useInviteAthleteMutation,
  useRemoveAthleteMutation,
} from '@/api/athlete';
import { ConfirmAction } from '@/components/confirm-action';
import { InviteAthleteDialog } from '@/components/invite-athlete-dialog/invite-athlete.dialog';
import { PaywallDialog } from '@/components/paywall';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAthleteLimit } from '@/hooks/use-feature-access';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { SettingsSection } from './settings-section';

export function AthletesTab() {
  const { data: athletes } = useGetMyCoachedAthletesQuery();
  const nav = useNavigate();
  const { data: sentInvitations, isLoading: sentInvitationsLoading } =
    useGetSentAthleteInvitationsQuery({ enabled: true });
  const [deleteAthleteDialog, setDeleteAthleteDialog] = useState<number | null>(
    null,
  );
  const [inviteAthleteDialog, setInviteAthleteDialog] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const { maxAthletes } = useAthleteLimit();
  const currentAthleteCount = athletes?.length || 0;
  const canAddAthlete = useMemo(() => {
    if (maxAthletes === null) return true; // Unlimited
    return currentAthleteCount < maxAthletes;
  }, [maxAthletes, currentAthleteCount]);
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
    <div className="space-y-6">
      <SettingsSection
        title={m.athletes()}
        description={m.athletes_tab_description()}
        action={
          <Button
            size="sm"
            onClick={() => {
              if (canAddAthlete) {
                setInviteAthleteDialog(true);
              } else {
                setPaywallOpen(true);
              }
            }}
          >
            {m.invite_athlete()}
          </Button>
        }
      >
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
                  <div className="flex justify-end gap-2">
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
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SettingsSection>
      {sentInvitationsLoading ? (
        <SettingsSection
          title={m.sent_invitations_to_athletes()}
          description={m.sent_invitations_to_athletes_description()}
        >
          <div className="text-sm text-muted-foreground">{m.loading()}</div>
        </SettingsSection>
      ) : sentInvitations && sentInvitations.length > 0 ? (
        <SettingsSection
          title={m.sent_invitations_to_athletes()}
          description={m.sent_invitations_to_athletes_description()}
        >
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
        </SettingsSection>
      ) : null}

      <InviteAthleteDialog
        open={inviteAthleteDialog}
        onClose={() => setInviteAthleteDialog(false)}
        onInvite={(email) => inviteAthleteMutation.mutate({ email })}
        isLoading={inviteAthleteMutation.isPending}
      />
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
      <PaywallDialog
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        reason="athlete-limit"
      />
    </div>
  );
}
