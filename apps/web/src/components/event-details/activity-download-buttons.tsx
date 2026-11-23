import { useGetEventStreamQuery } from '@/api/event';
import { EventAPI } from '@/api/event/event.api';
import { m } from '@/paraglide/messages';
import { isCapacitor } from '@/utils/capacitor';
import { downloadFile } from '@/utils/csv';
import { cn } from '@/utils/shadcn';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

import { ActivityEvent } from '@openathlete/shared';

import { Button } from '../ui/button';
import { activityFileName } from './activity-file-name';
import {
  ACTIVITY_STREAM_KEYS,
  ACTIVITY_STREAM_RESOLUTION,
} from './activity-stream-keys';

/**
 * Saves an activity as a file: its GPS track as GPX, to follow it again, and
 * the whole recording as FIT, for analysis tools such as WKO. Each shows only
 * when the activity has what the file needs, read from the stream the details
 * already load, with no extra request. Not in the iOS and Android apps, whose
 * web view has no download folder.
 */
export function ActivityDownloadButtons({
  event,
  className,
}: {
  event: ActivityEvent;
  className?: string;
}) {
  const native = isCapacitor();
  const { data: stream } = useGetEventStreamQuery(
    event.eventId,
    ACTIVITY_STREAM_RESOLUTION,
    ACTIVITY_STREAM_KEYS,
    !native,
  );
  if (native || !stream?.time?.length) return null;
  const hasRoute = !!stream.latlng?.some((point) => point.length === 2);

  const download = async (format: 'gpx' | 'fit') => {
    try {
      downloadFile(
        activityFileName(event, format),
        format === 'gpx'
          ? await EventAPI.getEventGpx(event.eventId)
          : await EventAPI.getEventFit(event.eventId),
      );
    } catch {
      toast.error(
        format === 'gpx'
          ? m.activity_gpx_download_failed()
          : m.activity_fit_download_failed(),
      );
    }
  };

  return (
    <div className={cn('flex gap-2', className)}>
      {hasRoute && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => download('gpx')}
          aria-label={m.activity_gpx_download()}
          title={m.activity_gpx_download()}
          data-gpx-download
        >
          <Download className="size-4" />
          GPX
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => download('fit')}
        aria-label={m.activity_fit_download()}
        title={m.activity_fit_download()}
        data-fit-download
      >
        <Download className="size-4" />
        FIT
      </Button>
    </div>
  );
}
