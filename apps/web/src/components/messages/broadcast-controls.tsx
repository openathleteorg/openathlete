import { useScheduledMessagesQuery } from '@/api/messages';
import { useCoachedAthletes } from '@/components/clubs/use-coached-athletes';
import { useFeaturePaywall } from '@/components/supporter-perks/feature-paywall';
import { Button } from '@/components/ui/button';
import { useFeature } from '@/hooks/use-feature';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { Clock, Lock, Megaphone } from 'lucide-react';
import { useState } from 'react';

import { Feature } from '@openathlete/shared';

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
  const broadcast = useFeature(Feature.COACH_BROADCAST);
  const paywall = useFeaturePaywall();
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
      {!broadcast.hidden && (
        <Button
          variant={compact ? 'ghost' : 'outline'}
          size="icon"
          className={cn('relative', size)}
          aria-label={m.broadcast_title()}
          title={m.broadcast_title()}
          onClick={() =>
            broadcast.available
              ? setWriting(true)
              : paywall.open(Feature.COACH_BROADCAST, 'messages')
          }
          data-broadcast-button
        >
          <Megaphone className="size-5" />
          {broadcast.locked && (
            <Lock
              aria-hidden
              data-supporter-lock
              className="absolute right-1 bottom-1 size-3 text-muted-foreground"
            />
          )}
        </Button>
      )}
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
