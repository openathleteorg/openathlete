import {
  useCancelScheduledMessageMutation,
  useScheduledMessagesQuery,
  useUpdateScheduledMessageMutation,
} from '@/api/messages';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { m } from '@/paraglide/messages';
import { format } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  BROADCAST_CONTENT_MAX,
  ScheduledMessageDto,
} from '@openathlete/shared';

function Editor({
  message,
  onDone,
}: {
  message: ScheduledMessageDto;
  onDone: () => void;
}) {
  const update = useUpdateScheduledMessageMutation();
  const sendAt = new Date(message.sendAt);
  const [content, setContent] = useState(message.content);
  const [date, setDate] = useState(format(sendAt, 'yyyy-MM-dd'));
  const [time, setTime] = useState(format(sendAt, 'HH:mm'));
  const next = new Date(`${date}T${time}`);
  const invalid =
    !content.trim() || Number.isNaN(next.getTime()) || next <= new Date();

  return (
    <div className="space-y-2">
      <Textarea
        value={content}
        rows={3}
        maxLength={BROADCAST_CONTENT_MAX}
        aria-label={m.broadcast_message()}
        onChange={(event) => setContent(event.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="date"
          value={date}
          aria-label={m.plan_for_athletes_date()}
          onChange={(event) => setDate(event.target.value)}
        />
        <Input
          type="time"
          value={time}
          aria-label={m.plan_for_athletes_time()}
          onChange={(event) => setTime(event.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDone}>
          {m.cancel()}
        </Button>
        <Button
          size="sm"
          disabled={invalid || update.isPending}
          isLoading={update.isPending}
          onClick={() =>
            update.mutate(
              {
                scheduledMessageId: message.scheduledMessageId,
                body: { content: content.trim(), sendAt: next },
              },
              {
                onSuccess: onDone,
                onError: () => toast.error(m.broadcast_failed()),
              },
            )
          }
        >
          {m.save()}
        </Button>
      </div>
    </div>
  );
}

/** The coach's messages waiting for their time: change or cancel them. */
export function ScheduledMessagesDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: scheduled } = useScheduledMessagesQuery({ enabled: open });
  const cancel = useCancelScheduledMessageMutation();
  const [editing, setEditing] = useState<number | null>(null);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg" data-scheduled-messages>
        <DialogHeader>
          <DialogTitle>{m.scheduled_messages_title()}</DialogTitle>
          <DialogDescription>
            {m.scheduled_messages_description()}
          </DialogDescription>
        </DialogHeader>
        {!scheduled?.length ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {m.scheduled_messages_empty()}
          </p>
        ) : (
          <ul className="max-h-[60vh] divide-y overflow-y-auto rounded-xl border">
            {scheduled.map((message) => (
              <li
                key={message.scheduledMessageId}
                className="space-y-2 p-3"
                data-scheduled-message
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium">
                      {new Date(message.sendAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {message.mode === 'GROUP'
                        ? m.broadcast_mode_group()
                        : m.broadcast_mode_individual()}
                      {' · '}
                      {message.recipients
                        .map((person) => person.firstName)
                        .join(', ')}
                    </p>
                  </div>
                  {editing !== message.scheduledMessageId && (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(message.scheduledMessageId)}
                      >
                        {m.edit()}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        disabled={cancel.isPending}
                        onClick={() =>
                          cancel.mutate(message.scheduledMessageId, {
                            onSuccess: () =>
                              toast.success(m.scheduled_messages_canceled()),
                            onError: () => toast.error(m.broadcast_failed()),
                          })
                        }
                      >
                        {m.scheduled_messages_cancel()}
                      </Button>
                    </div>
                  )}
                </div>
                {editing === message.scheduledMessageId ? (
                  <Editor message={message} onDone={() => setEditing(null)} />
                ) : (
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
