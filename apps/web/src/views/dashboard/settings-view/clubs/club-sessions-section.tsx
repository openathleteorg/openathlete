import {
  useAthleteGroupsQuery,
  useCancelClubSessionOccurrenceMutation,
  useClubSessionsQuery,
  useDeleteClubSessionMutation,
  useSaveClubSessionMutation,
} from '@/api/club';
import { useGetMyEventTemplatesQuery } from '@/api/event-template';
import { ConfirmAction } from '@/components/confirm-action';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { addDays, format } from 'date-fns';
import { MapPin, MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { ClubSessionDto, CreateClubSessionDto } from '@openathlete/shared';

import {
  SettingsEmpty,
  SettingsPanel,
  SettingsSection,
} from '../settings-section';

const NONE = 'none';

/** "Tuesday 18 Nov" in the user's language, from a YYYY-MM-DD */
const dayLabel = (day: string) =>
  new Date(`${day}T12:00:00`).toLocaleDateString(getLocale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
const weekday = (day: string) =>
  new Date(`${day}T12:00:00`).toLocaleDateString(getLocale(), {
    weekday: 'long',
  });

function blank(): CreateClubSessionDto {
  return {
    title: '',
    location: '',
    notes: '',
    templateId: null,
    groupId: null,
    firstDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    startTime: '19:00',
    durationMinutes: 60,
    weekly: true,
    untilDate: null,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

function SessionDialog({
  clubId,
  editing,
  open,
  onClose,
}: {
  clubId: number;
  editing: ClubSessionDto | null;
  open: boolean;
  onClose: () => void;
}) {
  const save = useSaveClubSessionMutation(clubId);
  const { data: groups } = useAthleteGroupsQuery(clubId);
  const { data: templates } = useGetMyEventTemplatesQuery(
    undefined,
    undefined,
    clubId,
  );
  const [form, setForm] = useState<CreateClubSessionDto>(blank);
  useEffect(() => {
    if (!open) return;
    setForm(
      editing
        ? {
            title: editing.title,
            location: editing.location ?? '',
            notes: editing.notes ?? '',
            templateId: editing.templateId,
            groupId: editing.groupId,
            firstDate: editing.firstDate,
            startTime: editing.startTime,
            durationMinutes: editing.durationMinutes,
            weekly: editing.weekly,
            untilDate: editing.untilDate,
            timeZone: editing.timeZone,
          }
        : blank(),
    );
  }, [open, editing]);
  const set = <K extends keyof CreateClubSessionDto>(
    key: K,
    value: CreateClubSessionDto[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const invalid =
    !form.title.trim() ||
    !form.firstDate ||
    !form.startTime ||
    form.durationMinutes < 5 ||
    (!!form.untilDate && form.untilDate < form.firstDate);

  const submit = () =>
    save.mutate(
      { id: editing?.clubSessionId, body: form },
      {
        onSuccess: () => {
          onClose();
          toast.success(m.club_sessions_saved());
        },
        onError: () => toast.error(m.club_save_failed()),
      },
    );

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="sm:max-w-lg"
        mobileFullscreen
        data-club-session-dialog
      >
        <DialogHeader>
          <DialogTitle>
            {editing ? m.club_sessions_edit() : m.club_sessions_new()}
          </DialogTitle>
        </DialogHeader>
        <div className="grid min-h-0 gap-3 overflow-y-auto">
          <div className="grid gap-1.5">
            <Label htmlFor="club-session-title">{m.club_sessions_name()}</Label>
            <Input
              id="club-session-title"
              value={form.title}
              maxLength={80}
              onChange={(event) => set('title', event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="club-session-location">
              {m.club_sessions_location()}
            </Label>
            <Input
              id="club-session-location"
              value={form.location ?? ''}
              maxLength={120}
              onChange={(event) => set('location', event.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>{m.club_sessions_for()}</Label>
              <Select
                value={form.groupId ? String(form.groupId) : NONE}
                onValueChange={(value) =>
                  set('groupId', value === NONE ? null : Number(value))
                }
              >
                <SelectTrigger aria-label={m.club_sessions_for()}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>
                    {m.club_sessions_all_athletes()}
                  </SelectItem>
                  {(groups ?? []).map((group) => (
                    <SelectItem
                      key={group.athleteGroupId}
                      value={String(group.athleteGroupId)}
                    >
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{m.club_sessions_content()}</Label>
              <Select
                value={form.templateId ? String(form.templateId) : NONE}
                onValueChange={(value) =>
                  set('templateId', value === NONE ? null : Number(value))
                }
              >
                <SelectTrigger aria-label={m.club_sessions_content()}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>
                    {m.club_sessions_no_template()}
                  </SelectItem>
                  {(templates ?? []).map((template) => (
                    <SelectItem
                      key={template.eventTemplateId}
                      value={String(template.eventTemplateId)}
                    >
                      {template.event?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* On a phone the date takes a row: three fields cut the time */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="col-span-2 grid gap-1.5 sm:col-span-1">
              <Label htmlFor="club-session-date">
                {m.club_sessions_first_day()}
              </Label>
              <Input
                id="club-session-date"
                type="date"
                value={form.firstDate}
                onChange={(event) => set('firstDate', event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="club-session-time">
                {m.plan_for_athletes_time()}
              </Label>
              <Input
                id="club-session-time"
                type="time"
                value={form.startTime}
                onChange={(event) => set('startTime', event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="club-session-duration">
                {m.club_sessions_duration()}
              </Label>
              <Input
                id="club-session-duration"
                type="number"
                min={5}
                step={5}
                value={form.durationMinutes}
                onChange={(event) =>
                  set('durationMinutes', Number(event.target.value))
                }
              />
            </div>
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <Checkbox
              checked={form.weekly}
              onCheckedChange={(checked) => set('weekly', checked === true)}
            />
            {m.club_sessions_weekly()}
          </label>
          {form.weekly && (
            <div className="grid gap-1.5">
              <Label htmlFor="club-session-until">
                {m.club_sessions_until()}
              </Label>
              <Input
                id="club-session-until"
                type="date"
                value={form.untilDate ?? ''}
                onChange={(event) =>
                  set('untilDate', event.target.value || null)
                }
              />
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="club-session-notes">
              {m.club_sessions_notes()}
            </Label>
            <Textarea
              id="club-session-notes"
              rows={3}
              value={form.notes ?? ''}
              maxLength={2000}
              onChange={(event) => set('notes', event.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {m.cancel()}
          </Button>
          <Button
            onClick={submit}
            isLoading={save.isPending}
            disabled={invalid || save.isPending}
          >
            {m.save()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Sessions the club holds at a place and time: each occurrence goes to
 * the calendars of its athletes, who say whether they come.
 */
export function ClubSessionsSection({
  clubId,
  canManage,
}: {
  clubId: number;
  canManage: boolean;
}) {
  const { data: sessions } = useClubSessionsQuery(clubId, true);
  const cancel = useCancelClubSessionOccurrenceMutation(clubId);
  const remove = useDeleteClubSessionMutation(clubId);
  const [dialog, setDialog] = useState<ClubSessionDto | 'new' | null>(null);
  const [stopping, setStopping] = useState<ClubSessionDto | null>(null);
  const failed = () => toast.error(m.club_save_failed());

  return (
    <SettingsSection
      title={m.club_sessions_title()}
      description={m.club_sessions_description()}
      action={
        canManage ? (
          <Button
            size="sm"
            onClick={() => setDialog('new')}
            data-club-session-new
          >
            {m.club_sessions_new()}
          </Button>
        ) : undefined
      }
    >
      {!sessions?.length ? (
        <SettingsEmpty>{m.club_sessions_none()}</SettingsEmpty>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <SettingsPanel
              key={session.clubSessionId}
              data-club-session={session.title}
            >
              <div className="flex items-start justify-between gap-2 px-4 py-3">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium">{session.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {session.weekly
                      ? m.club_sessions_every({
                          day: weekday(session.firstDate),
                          time: session.startTime,
                        })
                      : `${dayLabel(session.firstDate)} · ${session.startTime}`}
                    {' · '}
                    {session.groupName ?? m.club_sessions_all_athletes()}
                    {session.templateName && ` · ${session.templateName}`}
                  </p>
                  {session.location && (
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" />
                      {session.location}
                    </p>
                  )}
                </div>
                {canManage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="max-md:w-11"
                        aria-label={`${m.actions()} ${session.title}`}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDialog(session)}>
                        {m.edit()}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setStopping(session)}
                      >
                        {m.club_sessions_stop()}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              {session.upcoming.length > 0 && (
                <ul className="border-t">
                  {session.upcoming.map((occurrence) => (
                    <li
                      key={occurrence.date}
                      className="flex min-h-11 items-center justify-between gap-2 px-4 py-1.5 text-sm"
                      data-club-session-occurrence={occurrence.date}
                    >
                      <span className="capitalize">
                        {dayLabel(occurrence.date)}
                      </span>
                      <span className="flex items-center gap-3">
                        <span
                          className="tabular-nums text-muted-foreground"
                          data-club-session-going
                        >
                          {m.club_sessions_going({
                            going: occurrence.going,
                            invited: occurrence.invited,
                          })}
                        </span>
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={cancel.isPending}
                            onClick={() =>
                              cancel.mutate(
                                {
                                  id: session.clubSessionId,
                                  date: occurrence.date,
                                },
                                {
                                  onSuccess: () =>
                                    toast.success(m.club_sessions_called_off()),
                                  onError: failed,
                                },
                              )
                            }
                          >
                            {m.club_sessions_call_off()}
                          </Button>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SettingsPanel>
          ))}
        </div>
      )}
      <SessionDialog
        clubId={clubId}
        open={dialog !== null}
        editing={dialog === 'new' ? null : dialog}
        onClose={() => setDialog(null)}
      />
      <ConfirmAction
        open={stopping !== null}
        onClose={() => setStopping(null)}
        title={m.club_sessions_stop()}
        message={m.club_sessions_stop_message({ title: stopping?.title ?? '' })}
        isLoading={remove.isPending}
        onConfirm={() =>
          stopping &&
          remove.mutate(stopping.clubSessionId, {
            onSuccess: () => setStopping(null),
            onError: failed,
          })
        }
      />
    </SettingsSection>
  );
}
