import { useGetEventStreamQuery } from '@/api/event';
import { EventAPI } from '@/api/event/event.api';
import { m } from '@/paraglide/messages';
import { isCapacitor } from '@/utils/capacitor';
import { downloadFile } from '@/utils/csv';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

import { ActivityEvent } from '@openathlete/shared';

import { Button } from '../ui/button';
import {
  ACTIVITY_STREAM_KEYS,
  ACTIVITY_STREAM_RESOLUTION,
} from './activity-stream-keys';
import { gpxFileName } from './gpx-file-name';

/**
 * Saves the GPS track of an activity as GPX, to follow it again. Shown only
 * when the activity has a route: the stream the details read already says
 * so, no extra request. Not in the iOS and Android apps, whose web view has
 * no download folder.
 */
export function GpxDownloadButton({
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
  if (native || !stream?.latlng?.some((point) => point.length === 2)) {
    return null;
  }

  const download = async () => {
    try {
      downloadFile(
        gpxFileName(event),
        await EventAPI.getEventGpx(event.eventId),
      );
    } catch {
      toast.error(m.activity_gpx_download_failed());
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={className}
      onClick={download}
      aria-label={m.activity_gpx_download()}
      title={m.activity_gpx_download()}
      data-gpx-download
    >
      <Download className="size-4" />
    </Button>
  );
}
