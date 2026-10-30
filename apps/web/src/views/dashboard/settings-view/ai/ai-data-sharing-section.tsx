import { useAiAccessQuery } from '@/api/ai-settings';
import {
  AiDataSharingDetails,
  useSaveAiDataSharingChoice,
} from '@/components/ai-settings';
import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';

import { SettingsPanel, SettingsSection } from '../settings-section';

/** Settings > AI: what is shared, with whom, and the switch to stop it */
export function AiDataSharingSection() {
  const { data: access } = useAiAccessQuery();
  const { save, isPending } = useSaveAiDataSharingChoice();
  if (!access) return null;

  return (
    <SettingsSection
      title={m.ai_sharing_title()}
      description={
        access.dataSharingConsent
          ? m.ai_sharing_allowed()
          : m.ai_sharing_not_allowed()
      }
      action={
        <Button
          variant={access.dataSharingConsent ? 'outline' : 'default'}
          onClick={() => save(!access.dataSharingConsent)}
          disabled={isPending}
        >
          {access.dataSharingConsent
            ? m.ai_sharing_withdraw()
            : m.ai_sharing_allow()}
        </Button>
      }
    >
      <SettingsPanel padded className="divide-y-0">
        <AiDataSharingDetails access={access} />
      </SettingsPanel>
    </SettingsSection>
  );
}
