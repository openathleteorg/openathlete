import {
  useGetMyIcalCalendarSecretQuery,
  useRegenerateIcalCalendarSecretMutation,
} from '@/api/event';
import { ConfirmAction } from '@/components/confirm-action';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';
import { getApiBaseUrl } from '@/utils/capacitor';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  SettingsCopyField,
  SettingsPanel,
  SettingsSection,
} from './settings-section';

/**
 * The athlete's calendar feed URL, for Google or Apple Calendar. It stays the
 * same until regenerated, which revokes the previous one.
 */
export function CalendarFeedSection() {
  const { data: token, isLoading } = useGetMyIcalCalendarSecretQuery();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const regenerate = useRegenerateIcalCalendarSecretMutation({
    onSuccess: () => {
      setConfirmOpen(false);
      toast.success(m.calendar_feed_regenerated());
    },
    onError: () => toast.error(m.calendar_feed_regenerate_failed()),
  });

  if (!isLoading && !token) return null;
  const url = token
    ? `${getApiBaseUrl()}/event/ical?calendar=${encodeURIComponent(token)}`
    : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(m.calendar_feed_copied());
    } catch {
      // Clipboard denied (insecure context, permissions): the URL stays
      // selectable on screen
      toast.error(m.calendar_feed_copy_failed());
    }
  };

  return (
    <SettingsSection
      title={m.icalendar_feed()}
      description={m.subscribe_calendar_feed()}
    >
      {isLoading ? (
        <Skeleton className="h-28 w-full rounded-2xl" />
      ) : (
        <SettingsPanel padded className="divide-y-0">
          <div className="space-y-3" data-calendar-feed>
            <SettingsCopyField value={url} onCopy={copy} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {m.calendar_feed_private_hint()}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmOpen(true)}
              >
                <RefreshCw className="size-4" />
                {m.calendar_feed_regenerate()}
              </Button>
            </div>
          </div>
        </SettingsPanel>
      )}
      <ConfirmAction
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => regenerate.mutate()}
        title={m.calendar_feed_regenerate()}
        message={m.calendar_feed_regenerate_confirm()}
        isLoading={regenerate.isPending}
      />
    </SettingsSection>
  );
}
