import { sendHealthWorkouts } from '@/api/activity/healthkit-workout-import';
import { sendHealthSummaries } from '@/api/metric/health-metric-import';
import { getApiBaseUrl } from '@/utils/capacitor';
import {
  type HealthKitBinding,
  type HealthSyncKind,
  type HealthSyncOverview,
  localHealthKit,
} from '@/utils/healthkit';

/** Manual sync uses the saved scope, and never grants permission as a side effect. */
export async function syncApprovedHealth({
  binding,
  kind,
  signal,
  isCurrent,
}: {
  binding: HealthKitBinding;
  kind: HealthSyncKind;
  signal: AbortSignal;
  isCurrent: () => boolean;
}): Promise<{ count: number; complete: boolean }> {
  const check = () => {
    if (
      signal.aborted ||
      !isCurrent() ||
      getApiBaseUrl() !== binding.apiBaseURL
    )
      throw new Error('HEALTH_IMPORT_SESSION_CHANGED');
  };
  check();
  const initial = await localHealthKit.syncOverview(binding);
  check();
  const approved = initial[kind];
  if (!approved?.read || !approved.upload)
    throw new Error('HEALTH_IMPORT_NOT_AUTHORIZED');
  if (initial.busy) throw new Error('HEALTH_SYNC_BUSY');
  const canonical = (value: HealthSyncOverview[typeof kind]) => {
    if (!value) return '';
    const scope = value.selection;
    return JSON.stringify(
      'types' in scope
        ? [scope.historyDays, scope.timeZone, [...scope.types].sort()]
        : [scope.historyDays, scope.includeSensors, scope.includeRoute],
    );
  };
  const expected = canonical(approved);
  const authorize = async () => {
    check();
    const current = (await localHealthKit.syncOverview(binding))[kind];
    check();
    if (!current?.read || !current.upload || canonical(current) !== expected)
      throw new Error('HEALTH_IMPORT_NOT_AUTHORIZED');
  };
  const { lease } = await localHealthKit.beginManualSync(binding);
  try {
    check();
    // Read bounded native pages until history is complete. Never upload a partial
    // daily aggregation. A very large first import can be continued by another tap.
    for (let page = 0; page < 100; page++) {
      await authorize();
      if (kind === 'workouts' && initial.workouts) {
        const status = await localHealthKit.readWorkouts({
          ...binding,
          ...initial.workouts.selection,
          localConsent: true,
        });
        check();
        if (status.hasMore) continue;
        await authorize();
        if (!status.workouts.length) return { count: 0, complete: true };
        const counts = await sendHealthWorkouts({
          binding,
          consent: true,
          signal,
          isCurrent,
          uuids: status.workouts.map((item) => item.uuid),
        });
        check();
        return {
          count: Object.values(counts).reduce((a, b) => a + b, 0),
          complete: true,
        };
      }
      if (kind === 'measurements' && initial.measurements) {
        const status = await localHealthKit.read({
          ...binding,
          ...initial.measurements.selection,
          localConsent: true,
        });
        check();
        if (status.hasMore) continue;
        await authorize();
        if (!status.summaryCount) return { count: 0, complete: true };
        const counts = await sendHealthSummaries({
          binding,
          consent: true,
          signal,
          isCurrent,
        });
        check();
        return { count: counts.imported + counts.skipped, complete: true };
      }
    }
    return { count: 0, complete: false };
  } finally {
    // Release only our lease, even after navigation; no new permission is granted.
    await localHealthKit.endManualSync({ ...binding, lease });
  }
}
