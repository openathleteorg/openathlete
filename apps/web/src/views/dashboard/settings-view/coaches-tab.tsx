import {
  useCancelCoachInvitationMutation,
  useGetMyCoachesQuery,
  useGetSentCoachInvitationsQuery,
  useRemoveCoachMutation,
} from '@/api/athlete';
import { ConfirmAction } from '@/components/confirm-action';
import { InviteCoachDialog } from '@/components/invite-coach-dialog/invite-coach.dialog';
import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import { useState } from 'react';
import { toast } from 'sonner';

import { SentInvitationsSection } from './sent-invitations-section';
import {
  SettingsEmpty,
  SettingsPanel,
  SettingsRow,
  SettingsRowsSkeleton,
  SettingsSection,
} from './settings-section';

export function CoachesTab() {
  const { data: coaches, isPending: isLoadingCoaches } = useGetMyCoachesQuery();
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
  return (
    <div className="space-y-8">
      <SettingsSection
        action={
          <Button
            size="sm"
            onClick={() => {
              setInviteCoachDialogOpen(true);
            }}
          >
            {m.invite_a_coach()}
          </Button>
        }
      >
        {isLoadingCoaches ? (
          <SettingsRowsSkeleton />
        ) : !coaches?.length ? (
          <SettingsEmpty>{m.no_coaches_yet()}</SettingsEmpty>
        ) : (
          <SettingsPanel>
            {coaches.map((coach) => (
              <SettingsRow
                key={coach.userId}
                title={`${coach.firstName} ${coach.lastName}`}
                description={coach.email}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDeleteEventDialog(coach.userId);
                  }}
                >
                  {m.delete_()}
                </Button>
              </SettingsRow>
            ))}
          </SettingsPanel>
        )}
      </SettingsSection>
      <InviteCoachDialog
        open={inviteCoachDialogOpen}
        onClose={() => setInviteCoachDialogOpen(false)}
      />
      <SentInvitationsSection
        title={m.sent_invitations_to_coaches()}
        description={m.sent_invitations_to_coaches_description()}
        invitations={sentInvitations?.map((invitation) => ({
          id: invitation.coachInvitationId,
          email: invitation.email,
          createdAt: invitation.createdAt,
        }))}
        isLoading={sentInvitationsLoading}
        isCancelling={cancelInvitationMutation.isPending}
        onCancel={(id) => cancelInvitationMutation.mutate(id)}
      />
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
    </div>
  );
}
