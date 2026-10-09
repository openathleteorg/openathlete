import {
  useAddEventCommentMutation,
  useEventCommentsQuery,
  useMarkEventCommentsReadMutation,
} from '@/api/event-comments';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { cn } from '@/utils/shadcn';
import { MessageCircle, Send } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Event } from '@openathlete/shared';

/**
 * The conversation between the athlete and their coaches about one session
 * or activity. Opening it marks it read; it also shows in Messages.
 */
export function EventComments({ eventId }: { eventId: Event['eventId'] }) {
  const { data, isPending } = useEventCommentsQuery(eventId);
  const add = useAddEventCommentMutation(eventId);
  const markRead = useMarkEventCommentsReadMutation(eventId);
  const [draft, setDraft] = useState('');
  const unread = data?.unread ?? 0;

  useEffect(() => {
    if (unread > 0) markRead.mutate();
    // Once per arrival of unread comments
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unread]);

  const send = async (event?: FormEvent) => {
    event?.preventDefault();
    const content = draft.trim();
    if (!content || add.isPending) return;
    try {
      await add.mutateAsync(content);
      setDraft('');
    } catch {
      toast.error(m.event_comments_failed());
    }
  };

  return (
    <section
      className="space-y-3 rounded-lg border p-4"
      aria-labelledby={`event-comments-${eventId}`}
      data-event-comments
    >
      <h3
        id={`event-comments-${eventId}`}
        className="flex items-center gap-2 text-sm font-semibold"
      >
        <MessageCircle className="size-4" />
        {m.event_comments_title()}
      </h3>
      {isPending ? (
        <Skeleton className="h-12 w-full" />
      ) : data?.comments.length ? (
        <ol className="space-y-2">
          {data.comments.map((comment) => (
            <li
              key={comment.messageId}
              className={cn(
                'max-w-[85%] space-y-0.5 rounded-lg px-3 py-2 text-sm',
                comment.mine ? 'ml-auto bg-primary/10' : 'mr-auto bg-muted',
              )}
            >
              <p className="text-xs text-muted-foreground">
                {comment.mine
                  ? m.event_comments_you()
                  : `${comment.sender.firstName} ${comment.sender.lastName}`}
                {' · '}
                {comment.createdAt.toLocaleString(getLocale(), {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">
          {m.event_comments_empty()}
        </p>
      )}
      <form onSubmit={send} className="flex items-end gap-2">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Ctrl or ⌘ + Enter sends; Enter alone starts a new line
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              void send();
            }
          }}
          placeholder={m.event_comments_placeholder()}
          aria-label={m.event_comments_placeholder()}
          maxLength={5000}
          rows={2}
          className="min-h-11 resize-y"
        />
        <Button
          type="submit"
          size="icon"
          className="size-11 shrink-0"
          disabled={!draft.trim() || add.isPending}
          aria-label={m.event_comments_send()}
        >
          <Send className="size-4" />
        </Button>
      </form>
    </section>
  );
}
