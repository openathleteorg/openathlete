import {
  useGetMyIcalCalendarSecretQuery,
  useRegenerateIcalCalendarSecretMutation,
} from '@/api/event';
import { ConfirmAction } from '@/components/confirm-action';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { API_BASE_URL } from '@/config';
import { m } from '@/paraglide/messages';
import { Copy, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { SettingsSection } from './settings-section';

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
    ? `${API_BASE_URL}/event/ical?calendar=${encodeURIComponent(token)}`
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
        <Skeleton className="h-12 w-full" />
      ) : (
        <div className="space-y-3" data-calendar-feed>
          <div className="break-all rounded-sm border bg-muted p-3 font-mono text-sm text-muted-foreground select-all">
            {url}
          </div>
          <p className="text-xs text-muted-foreground">
            {m.calendar_feed_private_hint()}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={copy}>
              <Copy className="size-4" />
              {m.copy()}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmOpen(true)}>
              <RefreshCw className="size-4" />
              {m.calendar_feed_regenerate()}
            </Button>
          </div>
        </div>
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
