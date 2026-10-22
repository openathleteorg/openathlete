import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import { Link } from 'react-router-dom';

import { type Event } from '@openathlete/shared';

import { useZwiftUpload } from './use-zwift-upload';

export function ZwiftWorkoutAction({ event }: { event: Event }) {
  const upload = useZwiftUpload();
  if (!upload.available || !upload.ownsWorkout(event)) return null;
  return (
    <div className="ph-no-capture ph-mask space-y-2" data-cs-mask="true">
      {upload.query.data?.connected ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={upload.busy !== null}
          onClick={() => void upload.send(event.eventId)}
        >
          {upload.busy === event.eventId ? m.zwift_busy() : m.zwift_send()}
        </Button>
      ) : (
        <Link
          className="inline-flex min-h-11 items-center underline"
          to="/dashboard/settings?tab=connectors"
        >
          {m.zwift_setup()}
        </Link>
      )}
      {upload.messages[event.eventId] && (
        <p role="status" className="text-sm">
          {upload.messages[event.eventId]}
        </p>
      )}
    </div>
  );
}
