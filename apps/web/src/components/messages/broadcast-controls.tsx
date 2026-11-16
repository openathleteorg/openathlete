import { useScheduledMessagesQuery } from '@/api/messages';
import { useCoachedAthletes } from '@/components/clubs/use-coached-athletes';
import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { Clock, Megaphone } from 'lucide-react';
import { useState } from 'react';

import { BroadcastMessageDialog } from './broadcast-message-dialog';
import { ScheduledMessagesDialog } from './scheduled-messages-dialog';

/**
 * A coach's buttons in the messages page: write to several athletes, and
 * the messages waiting for their time. Nothing for someone who coaches no
 * one.
 */
export function BroadcastControls({ compact = false }: { compact?: boolean }) {
  const athletes = useCoachedAthletes();
  const coaches = athletes.length > 0;
  const { data: scheduled } = useScheduledMessagesQuery({ enabled: coaches });
  const [writing, setWriting] = useState(false);
  const [listing, setListing] = useState(false);
  if (!coaches) return null;

  const size = compact ? 'size-11 rounded-full' : '';
  return (
    <>
      {!!scheduled?.length && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(size)}
          aria-label={m.scheduled_messages_title()}
          title={m.scheduled_messages_title()}
          onClick={() => setListing(true)}
          data-scheduled-messages-button
        >
          <Clock className="size-5" />
        </Button>
      )}
      <Button
        variant={compact ? 'ghost' : 'outline'}
        size="icon"
        className={cn(size)}
        aria-label={m.broadcast_title()}
        title={m.broadcast_title()}
        onClick={() => setWriting(true)}
        data-broadcast-button
      >
        <Megaphone className="size-5" />
      </Button>
      <BroadcastMessageDialog
        open={writing}
        onClose={() => setWriting(false)}
      />
      <ScheduledMessagesDialog
        open={listing}
        onClose={() => setListing(false)}
      />
    </>
  );
}
