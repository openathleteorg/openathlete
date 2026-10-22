import { healthImportFailure } from '@/api/metric/health-import-session';
import { sendHealthSummaries } from '@/api/metric/health-metric-import';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthContext } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import { getApiBaseUrl } from '@/utils/capacitor';
import {
  type HealthKitStatus,
  type HealthKitType,
  hasLocalHealthKit,
  healthKitTypes,
  localHealthKit,
} from '@/utils/healthkit';
import { useHealthKitConsent } from '@/utils/use-healthkit-consent';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { SettingsSection } from './settings-section';

export function HealthKitSection() {
  const { user } = useAuthContext();
  const [status, setStatus] = useState<HealthKitStatus>();
  const [types, setTypes] = useState<HealthKitType[]>(
    healthKitTypes.slice(0, 3),
  );
  const [historyDays, setHistoryDays] = useState(30);
  const [confirmClear, setConfirmClear] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [uploadResult, setUploadResult] = useState('');
  const uploadController = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();
  const session = useRef(0);
  const native = hasLocalHealthKit();
  const apiBaseURL = getApiBaseUrl();
  const accountID = user ? String(user.userId) : '';

  const remembered = useHealthKitConsent(
    { apiBaseURL, accountID },
    'measurements',
    {
      types,
      historyDays,
      timeZone:
        status?.selection?.timeZone ??
        Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    native && !!accountID && !!status,
  );
  const consent = remembered.read;
  const uploadConsent = remembered.upload;

  useEffect(() => {
    const effectSession = ++session.current;
    const controller = new AbortController();
    uploadController.current = controller;
    if (!native || !accountID) return;
    let active = true;
    setStatus(undefined);
    setBusy(false);
    setError('');
    setConfirmClear(false);
    setUploadResult('');
    localHealthKit
      .status({ apiBaseURL, accountID })
      .then((value) => {
        if (!active) return;
        setStatus(value);
        if (value.selection) {
          setTypes(
            value.selection.types.filter((type) =>
              value.supportedTypes.includes(type),
            ),
          );
          setHistoryDays(value.selection.historyDays);
        }
      })
      .catch(() => {
        if (active) setError(m.healthkit_read_failed());
      });
    return () => {
      active = false;
      controller.abort();
      session.current = effectSession + 1;
    };
  }, [native, apiBaseURL, accountID]);

  if (!native || !user) return null;

  const loadedSelection = status?.selection;
  const scopeMatches =
    loadedSelection?.historyDays === historyDays &&
    loadedSelection.types.length === types.length &&
    types.every((type) => loadedSelection.types.includes(type));

  const labels: Record<HealthKitType, string> = {
    heartRateVariabilitySDNN: m.healthkit_sdnn(),
    restingHeartRate: m.healthkit_resting_hr(),
    sleepAnalysis: m.healthkit_sleep(),
    respiratoryRate: m.healthkit_respiration(),
    oxygenSaturation: m.healthkit_oxygen(),
    appleSleepingWristTemperature: m.healthkit_temperature(),
    bodyMass: m.metric_weight(),
    bodyFatPercentage: m.metric_body_fat(),
  };
  const metricLabels: Record<string, string> = {
    HRV_SDNN: labels.heartRateVariabilitySDNN,
    HR_REST: labels.restingHeartRate,
    SLEEP_DURATION: m.healthkit_main_sleep(),
    RESPIRATION_RATE_AVG: labels.respiratoryRate,
    PULSE_OX_AVG: labels.oxygenSaturation,
    WRIST_TEMPERATURE: labels.appleSleepingWristTemperature,
    WEIGHT: labels.bodyMass,
    BODY_FAT: labels.bodyFatPercentage,
  };

  const run = async (action: () => Promise<HealthKitStatus>) => {
    const startedInSession = session.current;
    setBusy(true);
    setError('');
    setUploadResult('');
    try {
      const value = await action();
      if (session.current === startedInSession) setStatus(value);
    } catch (reason) {
      if (session.current !== startedInSession) return;
      const code =
        reason && typeof reason === 'object' && 'code' in reason
          ? reason.code
          : '';
      setError(
        code === 'HEALTHKIT_LOCKED'
          ? m.healthkit_unlock()
          : code === 'HEALTHKIT_STORAGE_LIMIT'
            ? m.healthkit_storage_limit()
            : m.healthkit_read_failed(),
      );
    } finally {
      if (session.current === startedInSession) setBusy(false);
    }
  };

  const upload = async () => {
    const startedInSession = session.current;
    const signal = uploadController.current?.signal;
    if (!signal || !uploadConsent || !scopeMatches) return;
    setBusy(true);
    setError('');
    setUploadResult('');
    try {
      const result = await sendHealthSummaries({
        binding: { apiBaseURL, accountID },
        consent: true,
        signal,
        isCurrent: () => session.current === startedInSession,
      });
      if (session.current !== startedInSession) return;
      setUploadResult(m.healthkit_sent(result));
      await queryClient.invalidateQueries();
    } catch (reason) {
      if (session.current === startedInSession)
        setError(
          healthImportFailure(reason) === 'login'
            ? m.healthkit_upload_login()
            : m.healthkit_send_failed(),
        );
    } finally {
      if (session.current === startedInSession) setBusy(false);
    }
  };

  return (
    <SettingsSection
      title={m.healthkit_title()}
      description={m.healthkit_local_only()}
      contentClassName="space-y-4"
    >
      <p className="text-sm text-muted-foreground">
        {m.healthkit_account({ server: apiBaseURL, account: accountID })}
      </p>
      <p className="text-sm text-muted-foreground">
        {m.healthkit_scope_help()}
      </p>
      {status?.available === false ? (
        <p>{m.healthkit_unavailable()}</p>
      ) : (
        <>
          <fieldset disabled={busy} className="space-y-2">
            <legend className="mb-2 font-medium">
              {m.healthkit_categories()}
            </legend>
            {healthKitTypes
              .filter((type) => !status || status.supportedTypes.includes(type))
              .map((type) => (
                <label key={type} className="flex items-center gap-2">
                  <Checkbox
                    checked={types.includes(type)}
                    onCheckedChange={(checked) => {
                      setTypes((previous) =>
                        checked === true
                          ? [...previous, type]
                          : previous.filter((item) => item !== type),
                      );
                    }}
                  />
                  {labels[type]}
                </label>
              ))}
            <label className="flex items-center gap-3 pt-2">
              {m.healthkit_history()}
              <select
                aria-label={m.healthkit_history()}
                className="rounded-md border bg-background p-2"
                value={historyDays}
                onChange={(event) => {
                  setHistoryDays(Number(event.target.value));
                }}
              >
                {[7, 30, 90, 365].map((days) => (
                  <option value={days} key={days}>
                    {m.healthkit_days({ days })}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              className="mt-1"
              checked={consent}
              disabled={busy}
              onCheckedChange={(value) =>
                remembered.update({ read: value === true })
              }
            />
            {m.healthkit_local_consent()}
          </label>
          <Button
            disabled={busy || !consent || types.length === 0 || !status}
            isLoading={busy}
            onClick={() => {
              void run(() =>
                localHealthKit.read({
                  apiBaseURL,
                  accountID,
                  types,
                  historyDays,
                  localConsent: true,
                  timeZone:
                    status?.selection?.timeZone ??
                    Intl.DateTimeFormat().resolvedOptions().timeZone,
                }),
              );
            }}
          >
            {status?.hasMore ? m.healthkit_continue() : m.healthkit_read()}
          </Button>
        </>
      )}
      <p className="text-sm text-muted-foreground">
        {m.healthkit_auto_remember()}
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {status && status.sampleCount === 0 && status.lastRead && (
        <p>{m.healthkit_no_readable_data()}</p>
      )}
      {!!status?.sampleCount && (
        <div className="ph-no-capture ph-mask space-y-4" data-cs-mask="true">
          <p className="text-sm">
            {m.healthkit_stored({ count: status.sampleCount })}
          </p>
          {status.lastRead && (
            <p className="text-sm">
              {m.healthkit_last_read({
                date: new Date(status.lastRead).toLocaleString(),
              })}
            </p>
          )}
          {status.hasMore && <p className="text-sm">{m.healthkit_more()}</p>}
          <p className="text-sm text-muted-foreground">
            {m.healthkit_preview_policy()}
          </p>
          <p className="text-sm">
            {m.healthkit_zone({
              zone:
                status.selection?.timeZone ??
                Intl.DateTimeFormat().resolvedOptions().timeZone,
            })}
          </p>
          {types.map((type) => {
            const sources = status.sources.filter(
              (source) => source.type === type,
            );
            if (sources.length < 2) return null;
            return (
              <label className="flex flex-col gap-1 text-sm" key={type}>
                {m.healthkit_source({ type: labels[type] })}
                <select
                  aria-label={m.healthkit_source({ type: labels[type] })}
                  disabled={busy}
                  className="rounded-md border bg-background p-2"
                  value={sources.find((source) => source.selected)?.id}
                  onChange={(event) => {
                    void run(() =>
                      localHealthKit.selectSource({
                        apiBaseURL,
                        accountID,
                        type,
                        sourceID: event.target.value,
                      }),
                    );
                  }}
                >
                  {sources.map((source) => (
                    <option value={source.id} key={source.id}>
                      {source.name}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <caption className="mb-2 text-left">
                {m.healthkit_preview()}
              </caption>
              <thead>
                <tr>
                  <th className="p-2">{m.healthkit_date()}</th>
                  <th className="p-2">{m.healthkit_measurement()}</th>
                  <th className="p-2">{m.healthkit_value()}</th>
                  <th className="p-2">{m.healthkit_count()}</th>
                </tr>
              </thead>
              <tbody>
                {status.metrics.slice(0, 30).map((metric) => (
                  <tr
                    className="border-t"
                    key={`${metric.type}:${metric.date}`}
                  >
                    <td className="p-2">{metric.date}</td>
                    <td className="p-2">
                      {metricLabels[metric.type] ?? metric.type}
                    </td>
                    <td className="p-2">
                      {metric.value.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}{' '}
                      {metric.unit}
                    </td>
                    <td className="p-2">{metric.sampleCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {status.sleep.slice(0, 7).map((night) => (
            <p className="text-sm" key={night.date}>
              {m.healthkit_stages({
                date: night.date,
                core: night.core.toFixed(2),
                deep: night.deep.toFixed(2),
                rem: night.rem.toFixed(2),
                unspecified: night.unspecified.toFixed(2),
                awake: night.awake.toFixed(2),
              })}
            </p>
          ))}
        </div>
      )}
      {status?.lastRead && status.summaryExportAvailable && (
        <div className="space-y-3 rounded-md border p-3">
          <p className="text-sm">{m.healthkit_send_help()}</p>
          <p className="text-sm text-muted-foreground">
            {m.healthkit_send_limitations()}
          </p>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              className="mt-1"
              checked={uploadConsent}
              disabled={busy || !scopeMatches}
              onCheckedChange={(value) =>
                remembered.update({ upload: value === true })
              }
            />
            {m.healthkit_send_consent({ server: apiBaseURL })}
          </label>
          <Button
            disabled={
              busy ||
              !uploadConsent ||
              status.hasMore ||
              !status.summaryCount ||
              !scopeMatches
            }
            onClick={() => {
              void upload();
            }}
          >
            {m.healthkit_send()}
          </Button>
          {uploadResult && (
            <p role="status" className="text-sm">
              {uploadResult}
            </p>
          )}
        </div>
      )}
      {status?.lastRead && (
        <div className="space-y-2 rounded-md border p-3">
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <Checkbox
              checked={remembered.automatic}
              disabled={busy || !consent || !uploadConsent || !scopeMatches}
              onCheckedChange={(value) =>
                remembered.update({ automatic: value === true })
              }
            />
            {m.healthkit_auto_enable()}
          </label>
          <p className="text-sm text-muted-foreground">
            {m.healthkit_auto_help()}
          </p>
          {remembered.lastSuccess && (
            <p className="text-sm">
              {m.healthkit_auto_last({
                date: new Date(remembered.lastSuccess).toLocaleString(),
              })}
            </p>
          )}
          {remembered.failure && (
            <p className="text-sm">{m.healthkit_auto_pending()}</p>
          )}
        </div>
      )}
      {(!!status?.sampleCount || !!error) && (
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => setConfirmClear(true)}
        >
          {m.healthkit_clear()}
        </Button>
      )}
      {confirmClear && (
        <div className="space-y-2 rounded-md border p-3">
          <p>{m.healthkit_clear_help()}</p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => {
                setConfirmClear(false);
                void run(() => localHealthKit.clear({ apiBaseURL, accountID }));
              }}
            >
              {m.healthkit_clear_confirm()}
            </Button>
            <Button variant="outline" onClick={() => setConfirmClear(false)}>
              {m.cancel()}
            </Button>
          </div>
        </div>
      )}
    </SettingsSection>
  );
}
