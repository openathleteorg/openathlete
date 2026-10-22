import { routes } from '@/utils/axios';
import { type HealthKitBinding, localHealthKit } from '@/utils/healthkit';
import axios from 'axios';

import {
  type ImportHealthMetricsResponseDto,
  importHealthMetricsDtoSchema,
  importedHealthMetricSchema,
} from '@openathlete/shared';

import { healthImportSession } from './health-import-session';

// No shared request interceptor: a delayed request must never adopt another
// account's token or a newly selected server. Each manual action pins both.
const transport = axios.create({ timeout: 30_000 });

export async function sendHealthSummaries({
  binding,
  consent,
  isCurrent,
  signal,
}: {
  binding: HealthKitBinding;
  consent: boolean;
  isCurrent: () => boolean;
  signal: AbortSignal;
}): Promise<ImportHealthMetricsResponseDto> {
  const { token, assertCurrent, url } = await healthImportSession({
    binding,
    consent,
    isCurrent,
    signal,
  });
  const snapshot = await localHealthKit.summaries(binding);
  assertCurrent();
  if (
    new URL(snapshot.apiBaseURL).href.replace(/\/+$/, '') !==
      url.href.replace(/\/+$/, '') ||
    snapshot.accountID !== binding.accountID
  )
    throw new Error('HEALTH_IMPORT_WRONG_ACCOUNT');
  const metrics = snapshot.metrics.map((metric) =>
    importedHealthMetricSchema.parse(metric),
  );
  const keys = new Set(
    metrics.map((metric) => `${metric.type}:${metric.date}`),
  );
  if (!metrics.length || keys.size !== metrics.length)
    throw new Error('HEALTH_IMPORT_INVALID_SUMMARIES');
  const result = { imported: 0, skipped: 0 };
  for (let start = 0; start < metrics.length; start += 500) {
    assertCurrent();
    const body = importHealthMetricsDtoSchema.parse({
      source: 'APPLE_HEALTH',
      timeZone: snapshot.timeZone,
      metrics: metrics.slice(start, start + 500),
    });
    const response = await transport.post<ImportHealthMetricsResponseDto>(
      `${binding.apiBaseURL.replace(/\/+$/, '')}${routes.metric.importHealthMetrics}`,
      body,
      { headers: { Authorization: `Bearer ${token}` }, signal },
    );
    assertCurrent();
    const { imported, skipped } = response.data;
    if (
      !Number.isInteger(imported) ||
      !Number.isInteger(skipped) ||
      imported < 0 ||
      skipped < 0 ||
      imported + skipped !== body.metrics.length
    )
      throw new Error('HEALTH_IMPORT_INVALID_RESPONSE');
    result.imported += imported;
    result.skipped += skipped;
  }
  return result;
}
