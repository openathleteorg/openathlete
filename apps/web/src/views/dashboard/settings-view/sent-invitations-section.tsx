import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';

import {
  SettingsPanel,
  SettingsRow,
  SettingsRowsSkeleton,
  SettingsSection,
} from './settings-section';

type SentInvitation = { id: number; email: string; createdAt: string | Date };

const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

/** Invitations still waiting for an answer; nothing when there are none. */
export function SentInvitationsSection({
  title,
  description,
  invitations,
  isLoading,
  isCancelling,
  onCancel,
}: {
  title: string;
  description: string;
  invitations?: SentInvitation[];
  isLoading: boolean;
  isCancelling: boolean;
  onCancel: (id: number) => void;
}) {
  if (!isLoading && !invitations?.length) return null;

  return (
    <SettingsSection title={title} description={description}>
      {isLoading ? (
        <SettingsRowsSkeleton />
      ) : (
        <SettingsPanel>
          {invitations?.map((invitation) => (
            <SettingsRow
              key={invitation.id}
              stacked
              title={invitation.email}
              description={formatDate(invitation.createdAt)}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel(invitation.id)}
                disabled={isCancelling}
              >
                {m.cancel_invitation()}
              </Button>
            </SettingsRow>
          ))}
        </SettingsPanel>
      )}
    </SettingsSection>
  );
}
