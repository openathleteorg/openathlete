import { useCreateEventMutation } from '@/api/event';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { sportTypeLabelMap } from '@/utils/label-map/core';
import { CalendarPlus } from 'lucide-react';
import { FormEvent, useRef, useState } from 'react';

import { EVENT_TYPE, SPORT_TYPE } from '@openathlete/shared';

import { IcsSession, parseIcsSessions } from './ics-plan';

/** Calendar files of a plan are small; anything bigger is not one */
const MAX_ICS_BYTES = 2 * 1024 * 1024;

/**
 * Adds the sessions of an iCalendar file (a plan exported from a training
 * site, a coach's calendar) to the athlete's calendar as planned sessions,
 * without AI. The file is read in the browser; each session is created like
 * one added by hand, in the sport the athlete picks.
 */
export function ImportIcsPlanDialog() {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<IcsSession[] | null>(null);
  const [sport, setSport] = useState<SPORT_TYPE>(SPORT_TYPE.RUNNING);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ added: number; failed: number }>();
  const running = useRef(false);
  const createEvent = useCreateEventMutation();

  const sports = Object.entries(sportTypeLabelMap).sort(([, a], [, b]) =>
    a.localeCompare(b, getLocale()),
  );
  const day = (date: Date) =>
    date.toLocaleDateString(getLocale(), { dateStyle: 'medium' });

  const reset = () => {
    setSessions(null);
    setResult(undefined);
    setProgress(0);
  };

  const choose = async (file: File | undefined) => {
    setResult(undefined);
    if (!file) return setSessions(null);
    const text =
      file.size <= MAX_ICS_BYTES ? await file.text().catch(() => '') : '';
    setSessions(parseIcsSessions(text));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!sessions?.length || running.current) return;
    running.current = true;
    setBusy(true);
    let added = 0;
    let failed = 0;
    // One at a time, like sessions added by hand: the calendar stays in order
    for (const session of sessions) {
      try {
        await createEvent.mutateAsync({
          type: EVENT_TYPE.TRAINING,
          sport,
          name: session.name || m.plan_import_untitled(),
          description: session.description,
          startDate: session.start,
          endDate: session.end,
          goalDuration: session.allDay
            ? null
            : Math.round(
                (session.end.getTime() - session.start.getTime()) / 1000,
              ),
        });
        added++;
      } catch {
        failed++;
      }
      setProgress(added + failed);
    }
    setResult({ added, failed });
    setBusy(false);
    running.current = false;
  };

  return (
    <>
      <Button
        variant="outline"
        className="min-h-11"
        data-import-plan-trigger
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        <CalendarPlus className="size-4" />
        {m.plan_import_open()}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!running.current) setOpen(value);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{m.plan_import_title()}</DialogTitle>
            <DialogDescription>{m.plan_import_help()}</DialogDescription>
          </DialogHeader>
          {result ? (
            <div className="space-y-4">
              <p role="status" className="text-sm">
                {m.plan_import_done({ count: result.added })}
              </p>
              {result.failed > 0 && (
                <p role="alert" className="text-sm text-destructive">
                  {m.plan_import_failed({ count: result.failed })}
                </p>
              )}
              <DialogFooter>
                <Button onClick={() => setOpen(false)}>
                  {m.plan_import_close()}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <label className="block space-y-2 text-sm font-medium">
                <span>{m.plan_import_file()}</span>
                <Input
                  type="file"
                  accept=".ics,text/calendar"
                  required
                  disabled={busy}
                  onChange={(event) => choose(event.target.files?.[0])}
                />
              </label>
              {sessions &&
                (sessions.length ? (
                  <p role="status" className="text-sm" data-plan-sessions>
                    {m.plan_import_found({
                      count: sessions.length,
                      from: day(sessions[0].start),
                      to: day(sessions[sessions.length - 1].start),
                    })}
                  </p>
                ) : (
                  <p role="alert" className="text-sm text-destructive">
                    {m.plan_import_none()}
                  </p>
                ))}
              <label className="block space-y-2 text-sm font-medium">
                <span>{m.sport()}</span>
                <select
                  name="sport"
                  className="min-h-11 w-full rounded-md border bg-background px-3 text-base text-foreground md:text-sm"
                  value={sport}
                  onChange={(event) =>
                    setSport(event.target.value as SPORT_TYPE)
                  }
                  disabled={busy}
                >
                  {sports.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {busy && (
                <p role="status" className="text-sm">
                  {m.plan_import_progress({
                    done: progress,
                    total: sessions?.length ?? 0,
                  })}
                </p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setOpen(false)}
                >
                  {m.cancel()}
                </Button>
                <Button
                  type="submit"
                  disabled={!sessions?.length || busy}
                  isLoading={busy}
                >
                  {m.plan_import_submit()}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
