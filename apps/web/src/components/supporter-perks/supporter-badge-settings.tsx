import { useUpdateSupporterBadge } from '@/api/subscription';
import { Switch } from '@/components/ui/switch';
import { m } from '@/paraglide/messages';
import {
  SettingsPanel,
  SettingsRow,
  SettingsSection,
} from '@/views/dashboard/settings-view/settings-section';
import { toast } from 'sonner';

import { SupporterBadge } from './supporter-badge';

/** Whether coaches, athletes and club mates see the Supporter badge */
export function SupporterBadgeSettings({ show }: { show: boolean }) {
  const update = useUpdateSupporterBadge();
  return (
    <SettingsSection title={m.supporter_badge_title()}>
      <SettingsPanel>
        <SettingsRow
          title={
            <span className="inline-flex items-center gap-1.5">
              {m.supporter_badge_show()}
              <SupporterBadge show />
            </span>
          }
          description={m.supporter_badge_description()}
        >
          <Switch
            checked={show}
            disabled={update.isPending}
            aria-label={m.supporter_badge_show()}
            data-supporter-badge-switch
            onCheckedChange={(next) =>
              update.mutate(next, {
                onError: () => toast.error(m.supporter_badge_save_failed()),
              })
            }
          />
        </SettingsRow>
      </SettingsPanel>
    </SettingsSection>
  );
}
