import { useSendBroadcastMutation } from '@/api/messages';
import { AthletePicker } from '@/components/clubs/athlete-picker';
import { useCoachedAthletes } from '@/components/clubs/use-coached-athletes';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { addDays, format } from 'date-fns';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { BROADCAST_CONTENT_MAX, BroadcastMode } from '@openathlete/shared';

type Props = { open: boolean; onClose: () => void };

/**
 * One message to several athletes: each in their own conversation (their
 * answers stay private), or one group conversation. Now, or at a time the
 * server sends it.
 */
export function BroadcastMessageDialog({ open, onClose }: Props) {
  const athletes = useCoachedAthletes();
  const send = useSendBroadcastMutation();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<BroadcastMode>('INDIVIDUAL');
  const [title, setTitle] = useState('');
  const [later, setLater] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('18:00');

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setContent('');
    setMode('INDIVIDUAL');
    setTitle('');
    setLater(false);
    setDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
    setTime('18:00');
  }, [open]);

  // The coach's own clock: what they type is when it goes
  const sendAt = later && date && time ? new Date(`${date}T${time}`) : null;
  const inPast = sendAt !== null && sendAt.getTime() <= Date.now();

  const submit = () => {
    const recipientUserIds = athletes
      .filter((athlete) => selected.has(athlete.athleteId))
      .map((athlete) => athlete.userId);
    send.mutate(
      {
        recipientUserIds,
        content,
        mode,
        ...(mode === 'GROUP' && title.trim() && { title: title.trim() }),
        ...(sendAt && { sendAt }),
      },
      {
        onSuccess: (result) => {
          onClose();
          toast.success(
            result.scheduledMessageId
              ? m.broadcast_scheduled({
                  date: sendAt!.toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }),
                })
              : m.broadcast_sent({ count: recipientUserIds.length }),
          );
        },
        onError: () => toast.error(m.broadcast_failed()),
      },
    );
  };

  const modes: { value: BroadcastMode; title: string; text: string }[] = [
    {
      value: 'INDIVIDUAL',
      title: m.broadcast_mode_individual(),
      text: m.broadcast_mode_individual_description(),
    },
    {
      value: 'GROUP',
      title: m.broadcast_mode_group(),
      text: m.broadcast_mode_group_description(),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="sm:max-w-lg"
        mobileFullscreen
        data-broadcast-dialog
      >
        <DialogHeader>
          <DialogTitle>{m.broadcast_title()}</DialogTitle>
          <DialogDescription>{m.broadcast_description()}</DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
          <AthletePicker
            athletes={athletes}
            selected={selected}
            onChange={setSelected}
          />

          <div className="grid gap-2" role="radiogroup">
            {modes.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={mode === option.value}
                onClick={() => setMode(option.value)}
                className={cn(
                  'rounded-xl border p-3 text-left transition-colors',
                  mode === option.value
                    ? 'border-primary bg-accent'
                    : 'hover:bg-accent/60',
                )}
              >
                <span className="block text-sm font-medium">
                  {option.title}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {option.text}
                </span>
              </button>
            ))}
          </div>
          {mode === 'GROUP' && (
            <div className="grid gap-2">
              <Label htmlFor="broadcast-title">
                {m.broadcast_group_title()}
              </Label>
              <Input
                id="broadcast-title"
                value={title}
                maxLength={120}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="broadcast-content">{m.broadcast_message()}</Label>
            <Textarea
              id="broadcast-content"
              value={content}
              rows={4}
              maxLength={BROADCAST_CONTENT_MAX}
              onChange={(event) => setContent(event.target.value)}
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between gap-3 text-sm font-medium">
              {m.broadcast_send_later()}
              <Switch checked={later} onCheckedChange={setLater} />
            </label>
            {later && (
              <div className="grid grid-cols-2 gap-3">
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
            )}
            {inPast && (
              <p role="alert" className="text-sm text-destructive">
                {m.broadcast_in_past()}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {m.cancel()}
          </Button>
          <Button
            onClick={submit}
            isLoading={send.isPending}
            disabled={
              send.isPending ||
              selected.size === 0 ||
              !content.trim() ||
              (later && (!sendAt || inPast))
            }
          >
            {later ? m.broadcast_schedule() : m.broadcast_send()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
