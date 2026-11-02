import { useAiAccessQuery } from '@/api/ai-settings';
import { Button } from '@/components/ui/button';
import { SparklesIcon } from '@/components/ui/sparkles-icon';
import { m } from '@/paraglide/messages';
import { purchaseChannel } from '@/utils/capacitor';
import { useSearchParams } from 'react-router-dom';

import { SettingsPanel, SettingsRow } from '../settings-section';
import { AiDataSharingSection } from './ai-data-sharing-section';
import { AiKeysSection } from './ai-keys-section';
import { AiModelsSection } from './ai-models-section';
import { AiUsageSection } from './ai-usage-section';

export function AiTab() {
  const { data: access } = useAiAccessQuery();
  const [, setSearchParams] = useSearchParams();

  return (
    <div className="space-y-8">
      {access?.hostedAccess && (
        <SettingsPanel>
          <SettingsRow
            leading={<SparklesIcon className="size-5" />}
            title={m.ai_hosted_included_title()}
            description={m.ai_hosted_included_description()}
          />
        </SettingsPanel>
      )}

      {access?.upgradeUnlocksHosted && purchaseChannel() !== null && (
        <SettingsPanel>
          <SettingsRow
            stacked
            leading={<SparklesIcon className="size-5" />}
            title={m.ai_upgrade_title()}
            description={m.ai_upgrade_description()}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchParams({ tab: 'subscription' })}
            >
              {m.ai_setup_view_plans()}
            </Button>
          </SettingsRow>
        </SettingsPanel>
      )}

      <AiDataSharingSection />

      {access && <AiUsageSection access={access} />}

      <AiKeysSection />
      <AiModelsSection />
    </div>
  );
}
