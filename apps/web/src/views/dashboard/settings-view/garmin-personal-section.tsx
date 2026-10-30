import { eventKeys } from '@/api/event/event.keys';
import { GarminPersonalAPI } from '@/api/garmin-personal/garmin-personal.api';
import { useGarminPersonalStatus } from '@/api/garmin-personal/garmin-personal.hooks';
import { garminPersonalKeys } from '@/api/garmin-personal/garmin-personal.keys';
import { useGetMeQuery } from '@/api/user';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { m } from '@/paraglide/messages';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  GarminPersonalStatus,
  garminPersonalSyncSchema,
} from '@openathlete/shared';

import { SettingsSection } from './settings-section';

function statusLabel(status: GarminPersonalStatus['status']) {
  switch (status) {
    case 'disconnected':
      return m.garmin_personal_disconnected();
    case 'idle':
      return m.garmin_personal_idle();
    case 'queued':
      return m.garmin_personal_queued();
    case 'running':
      return m.garmin_personal_running();
    case 'completed':
      return m.garmin_personal_completed();
    case 'partial':
      return m.garmin_personal_partial();
    case 'key_required':
      return m.garmin_personal_key_required();
    default:
      return m.garmin_personal_failed();
  }
}

export function GarminPersonalSection() {
  const { data: user } = useGetMeQuery();
  return user ? (
    <PersonalConnection key={user.userId} userId={user.userId} />
  ) : null;
}

function PersonalConnection({ userId }: { userId: number }) {
  const cache = useQueryClient();
  const key = garminPersonalKeys.status(userId);
  const [apiKey, setApiKey] = useState('');
  const [activities, setActivities] = useState(false);
  const [automatic, setAutomatic] = useState(false);
  const [startDate, setStartDate] = useState(() =>
    new Date(Date.now() - 27 * 86400000).toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const status = useGarminPersonalStatus(userId);
  const update = (value: GarminPersonalStatus) => {
    cache.setQueryData(key, value);
  };
  const failed = () => toast.error(m.garmin_personal_request_failed());
  const importFailed = () =>
    toast.error(m.garmin_personal_import_request_failed());
  const connect = useMutation({
    mutationFn: GarminPersonalAPI.connect,
    onSuccess: (value) => {
      setApiKey('');
      update(value);
    },
    onError: (error) => {
      setApiKey('');
      if (
        isAxiosError(error) &&
        error.response?.data?.message === 'key_required'
      )
        toast.error(m.garmin_personal_key_required());
      else failed();
    },
  });
  const preferences = useMutation({
    mutationFn: GarminPersonalAPI.preferences,
    onSuccess: update,
    onError: failed,
  });
  const disconnect = useMutation({
    mutationFn: GarminPersonalAPI.disconnect,
    onSuccess: (value) => {
      setApiKey('');
      update(value);
    },
    onError: failed,
  });
  const sync = useMutation({
    mutationFn: GarminPersonalAPI.sync,
    onSuccess: () => {
      status.restartPolling();
      void cache.invalidateQueries({ queryKey: key });
    },
    onError: importFailed,
  });
  const value = status.data;
  useEffect(() => {
    if (value?.lastSyncedAt && (value.result?.imported ?? 0) > 0) {
      void cache.invalidateQueries({ queryKey: [eventKeys.getMyEvents] });
    }
  }, [cache, value?.lastSyncedAt, value?.result?.imported]);
  const busy =
    connect.isPending ||
    preferences.isPending ||
    disconnect.isPending ||
    sync.isPending;
  const running = value?.status === 'queued' || value?.status === 'running';
  const selected = value?.connected
    ? value.preferences
    : { activities, automatic };
  const setPreference = (
    name: 'activities' | 'automatic',
    checked: boolean,
  ) => {
    if (value?.connected)
      preferences.mutate({ ...value.preferences, [name]: checked });
    else if (name === 'activities') setActivities(checked);
    else setAutomatic(checked);
  };
  const pull = () => {
    const range = garminPersonalSyncSchema.safeParse({ startDate, endDate });
    if (!range.success) {
      toast.error(m.garmin_personal_date_invalid());
      return;
    }
    sync.mutate(range.data);
  };
  return (
    <SettingsSection
      title={m.garmin_personal_title()}
      description={m.garmin_personal_description()}
      contentClassName="space-y-4 pt-4"
    >
      <a
        className="text-sm underline"
        href="https://developer.garmin.com/gc-developer-program/personal/personal-api/"
        target="_blank"
        rel="noreferrer"
      >
        {m.garmin_personal_instructions()}
      </a>
      {status.isPending ? (
        <p>{m.garmin_personal_loading()}</p>
      ) : status.isError ? (
        <p role="alert">{m.garmin_personal_request_failed()}</p>
      ) : (
        <>
          {value?.connected && value.status !== 'key_required' && (
            <p>{m.garmin_personal_key_accepted()}</p>
          )}
          <p role="status">{statusLabel(value?.status ?? 'disconnected')}</p>
          <div className="flex items-center gap-2">
            <Checkbox
              id="garmin-personal-activities"
              disabled={busy || running}
              checked={selected.activities}
              onCheckedChange={(v) => setPreference('activities', v === true)}
            />
            <Label htmlFor="garmin-personal-activities">
              {m.garmin_personal_consent()}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="garmin-personal-automatic"
              disabled={busy || running}
              checked={selected.automatic}
              onCheckedChange={(v) => setPreference('automatic', v === true)}
            />
            <Label htmlFor="garmin-personal-automatic">
              {m.garmin_personal_automatic()}
            </Label>
          </div>
          {running && (
            <p className="text-sm text-muted-foreground">
              {m.garmin_personal_preferences_locked()}
            </p>
          )}
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              connect.mutate({ apiKey, ...selected });
            }}
          >
            <Label htmlFor="garmin-personal-key">
              {m.garmin_personal_key()}
            </Label>
            <Input
              id="garmin-personal-key"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              maxLength={4096}
              disabled={busy}
            />
            <Button type="submit" disabled={busy || apiKey.trim().length < 8}>
              {m.garmin_personal_save()}
            </Button>
          </form>
          {value?.connected && (
            <>
              <div className="flex flex-wrap gap-3">
                <div>
                  <Label htmlFor="garmin-personal-start">
                    {m.garmin_personal_start()}
                  </Label>
                  <Input
                    id="garmin-personal-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="garmin-personal-end">
                    {m.garmin_personal_end()}
                  </Label>
                  <Input
                    id="garmin-personal-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {m.garmin_personal_range_hint()}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={pull}
                  disabled={busy || running || !selected.activities}
                >
                  {m.garmin_personal_sync()}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => disconnect.mutate()}
                  disabled={busy}
                >
                  {m.garmin_personal_disconnect()}
                </Button>
              </div>
              {value.error && (
                <p role="alert">
                  {value.error === 'rate_limited'
                    ? m.garmin_personal_rate_limited()
                    : value.status === 'key_required'
                      ? m.garmin_personal_key_required()
                      : m.garmin_personal_import_failed()}
                </p>
              )}
              {value.result && (
                <p>
                  {m.garmin_personal_result({
                    imported: String(value.result.imported),
                    existing: String(value.result.matched),
                    review: String(value.result.needsReview),
                    failed: String(value.result.failed),
                    pending: String(value.result.pending),
                  })}
                  {(value.result.skipped ?? 0) > 0
                    ? ` ${m.garmin_personal_skipped({ count: String(value.result.skipped) })}`
                    : ''}
                  {value.result.truncated
                    ? ` ${m.garmin_personal_truncated()}`
                    : ''}
                </p>
              )}
            </>
          )}
        </>
      )}
    </SettingsSection>
  );
}
