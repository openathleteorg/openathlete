import { useAiAccessQuery } from '@/api/ai-settings';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SparklesIcon } from '@/components/ui/sparkles-icon';
import { m } from '@/paraglide/messages';
import { purchaseChannel } from '@/utils/capacitor';
import { ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { AiKeysSection } from './ai-keys-section';
import { AiModelsSection } from './ai-models-section';
import { AiUsageSection } from './ai-usage-section';

export function AiTab() {
  const { data: access } = useAiAccessQuery();
  const [, setSearchParams] = useSearchParams();

  return (
    <div className="space-y-6">
      <Alert>
        <ShieldCheck className="size-4" />
        <AlertTitle>{m.ai_settings_title()}</AlertTitle>
        <AlertDescription>{m.ai_settings_description()}</AlertDescription>
      </Alert>

      {access?.hostedAccess && (
        <Alert>
          <SparklesIcon className="size-4" />
          <AlertTitle>{m.ai_hosted_included_title()}</AlertTitle>
          <AlertDescription>
            {m.ai_hosted_included_description()}
          </AlertDescription>
        </Alert>
      )}

      {access?.upgradeUnlocksHosted && purchaseChannel() !== null && (
        <Alert>
          <SparklesIcon className="size-4" />
          <AlertTitle>{m.ai_upgrade_title()}</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <span>{m.ai_upgrade_description()}</span>
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => setSearchParams({ tab: 'subscription' })}
            >
              {m.ai_setup_view_plans()}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {access && <AiUsageSection access={access} />}

      <AiKeysSection />
      <AiModelsSection />
    </div>
  );
}
