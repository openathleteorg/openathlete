import { createHash } from 'node:crypto';

import { ConflictException, Injectable } from '@nestjs/common';

import {
  ConnectorProvider,
  EventActivity,
  Prisma,
} from '@openathlete/database';
import {
  ActivityImportStatus,
  CompressedActivityStream,
} from '@openathlete/shared';

import { PrismaService } from '../../prisma/services/prisma.service';
import {
  ActivityRecording,
  enrichRecordingStream,
  recordingMatch,
} from '../helpers/activity-recording';
import {
  compressActivityStream,
  uncompressActivityStream,
} from '../helpers/activity-stream';
import { buildFitActivityDetails } from '../helpers/fit-activity-details';

const json = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value));
// JSON object key order must not turn an exact retry into a changed revision.
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`)
      .join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}
const hash = (value: unknown) =>
  createHash('sha256').update(stable(value)).digest('hex');

export interface ReconciledActivity {
  activity: EventActivity | null;
  created: boolean;
  status: ActivityImportStatus;
  receiptId: number;
  revision: number;
  processingPending: boolean;
}

@Injectable()
export class ActivityReconciliationService {
  constructor(private readonly prisma: PrismaService) {}

  async findSource(
    athleteId: number,
    provider: ConnectorProvider,
    externalId: string,
  ) {
    return this.prisma.activitySource.findUnique({
      where: {
        athleteId_provider_externalId: { athleteId, provider, externalId },
      },
      include: { eventActivity: true },
    });
  }

  fromActivity(
    activity: EventActivity & {
      event: { name: string; startDate: Date; endDate: Date };
    },
  ): ActivityRecording {
    return {
      name: activity.event.name,
      startDate: activity.event.startDate.toISOString(),
      endDate: activity.event.endDate.toISOString(),
      values: {
        sport: activity.sport,
        distance: activity.distance,
        elevationGain: activity.elevationGain,
        movingTime: activity.movingTime,
        averageSpeed: activity.averageSpeed,
        maxSpeed: activity.maxSpeed,
        averageCadence: activity.averageCadence,
        averageWatts: activity.averageWatts,
        maxWatts: activity.maxWatts,
        weightedAverageWatts: activity.weightedAverageWatts,
        averageHeartrate: activity.averageHeartrate,
        maxHeartrate: activity.maxHeartrate,
        kilojoules: activity.kilojoules,
        description: activity.description,
      },
      stream: activity.stream
        ? uncompressActivityStream(
            activity.stream as unknown as CompressedActivityStream,
          )
        : {},
      original: activity.provider !== 'STRAVA',
      recordingKind: 'single',
    };
  }

  /** All cooperating imports serialize per athlete before looking for matches. */
  async reconcile(
    athleteId: number,
    provider: ConnectorProvider,
    externalId: string,
    recording: ActivityRecording,
    revision?: number,
  ): Promise<ReconciledActivity> {
    const payload = json(recording);
    const payloadHash = hash(payload);
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(61742, ${athleteId}::integer)`;
        const key = { athleteId, provider, externalId };
        let source = await tx.activitySource.findUnique({
          where: { athleteId_provider_externalId: key },
        });
        const nextRevision =
          revision ??
          (source?.payloadHash === payloadHash
            ? source.revision
            : (source?.revision ?? 0) + 1);
        if (source && nextRevision <= source.revision) {
          const observed = await tx.activitySourceObservation.findUnique({
            where: {
              activitySourceId_revision: {
                activitySourceId: source.activitySourceId,
                revision: nextRevision,
              },
            },
          });
          if (nextRevision > 0 && observed?.payloadHash !== payloadHash)
            throw new ConflictException('ACTIVITY_SOURCE_REVISION_CONFLICT');
          return {
            activity: source.eventActivityId
              ? await tx.eventActivity.findUnique({
                  where: { eventActivityId: source.eventActivityId },
                })
              : null,
            created: false,
            status: source.eventActivityId ? 'unchanged' : 'needs_review',
            receiptId: source.activitySourceId,
            revision: source.revision,
            processingPending: source.processingPending,
          };
        }
        if (source && !source.eventActivityId && source.revision > 0) {
          // An ambiguous receipt stays uncounted, including on subsequent revisions.
          // Resolution requires a separate explicit review decision.
          source = await tx.activitySource.update({
            where: { activitySourceId: source.activitySourceId },
            data: {
              revision: nextRevision,
              payloadHash,
              payload,
              observations: {
                create: { revision: nextRevision, payloadHash, payload },
              },
            },
          });
          return {
            activity: null,
            created: false,
            status: 'needs_review',
            receiptId: source.activitySourceId,
            revision: nextRevision,
            processingPending: false,
          };
        }
        let target = source?.eventActivityId
          ? await tx.eventActivity.findUnique({
              where: { eventActivityId: source.eventActivityId },
              include: { event: true, sources: true },
            })
          : null;
        if (!target && !source) {
          // Upgrade legacy activities lazily as well as honoring migrated links.
          target = await tx.eventActivity.findFirst({
            where: { provider, externalId, event: { athleteId } },
            include: { event: true, sources: true },
          });
        }
        const candidates: number[] = [];
        if (!target) {
          const overlapping = await tx.eventActivity.findMany({
            where: {
              event: {
                athleteId,
                startDate: { lt: new Date(recording.endDate) },
                endDate: { gt: new Date(recording.startDate) },
              },
            },
            include: { event: true, sources: true },
          });
          const strong: typeof overlapping = [];
          for (const candidate of overlapping) {
            // Two distinct recordings from the same provider are not silently merged.
            const sameProvider =
              candidate.provider === provider ||
              candidate.sources.some((item) => item.provider === provider);
            const candidateRecording = this.fromActivity(candidate);
            if (
              candidate.sources.some(
                (item) =>
                  (item.payload as unknown as ActivityRecording)
                    .recordingKind === 'multisport_leg',
              )
            )
              candidateRecording.recordingKind = 'multisport_leg';
            const match = recordingMatch(recording, candidateRecording);
            if (match !== 'none') candidates.push(candidate.eventActivityId);
            if (match === 'strong' && !sameProvider) strong.push(candidate);
          }
          if (strong.length === 1 && candidates.length === 1)
            target = strong[0];
        }
        const ambiguous = !target && candidates.length > 0;
        const created = !target && !ambiguous;
        const oldSource = source;
        source = await tx.activitySource.upsert({
          where: { athleteId_provider_externalId: key },
          create: {
            ...key,
            revision: nextRevision,
            payloadHash,
            payload,
            candidates: ambiguous ? candidates : undefined,
          },
          update: { revision: nextRevision, payloadHash, payload },
        });
        await tx.activitySourceObservation.create({
          data: {
            activitySourceId: source.activitySourceId,
            revision: nextRevision,
            payloadHash,
            payload,
          },
        });
        if (ambiguous)
          return {
            activity: null,
            created: false,
            status: 'needs_review',
            receiptId: source.activitySourceId,
            revision: nextRevision,
            processingPending: false,
          };

        let changed = created;
        type Resolution = {
          fields?: Record<string, string>;
          channels?: Record<string, string>;
        };
        const ownership: Resolution = oldSource?.resolution
          ? (json(oldSource.resolution) as Resolution)
          : {};
        ownership.fields ??= {};
        ownership.channels ??= {};
        if (!target) {
          const event = await tx.event.create({
            data: {
              athleteId,
              name: recording.name,
              type: 'ACTIVITY',
              startDate: new Date(recording.startDate),
              endDate: new Date(recording.endDate),
              activity: {
                create: {
                  ...recording.values,
                  provider,
                  sourceAthleteId: athleteId,
                  externalId,
                  stream: json(compressActivityStream(recording.stream)),
                },
              },
            },
            include: { activity: { include: { event: true, sources: true } } },
          });
          target = event.activity!;
          for (const [field, value] of Object.entries(recording.values)) {
            if (value !== undefined && value !== null)
              ownership.fields[field] = hash(value);
          }
          for (const [key, value] of Object.entries(recording.stream)) {
            if (key !== 'time' && value?.length)
              ownership.channels[key] = hash(value);
          }
        } else {
          const current = this.fromActivity(target);
          const quality = (candidate: ActivityRecording, channel?: string) => {
            const values = channel
              ? candidate.stream?.[channel as keyof typeof candidate.stream]
              : undefined;
            const length = values?.length ?? 0;
            const times = candidate.stream?.time;
            const coverage =
              times?.length && length === times.length
                ? Math.min(
                    1,
                    ((times.at(-1) ?? 0) - times[0]) /
                      Math.max(
                        1,
                        (Date.parse(candidate.endDate) -
                          Date.parse(candidate.startDate)) /
                          1000,
                      ),
                  )
                : 0;
            return [candidate.original ? 1 : 0, coverage, length];
          };
          const prefer = (
            kind: 'fields' | 'channels',
            key: string,
            existing: unknown,
            channel?: string,
          ) => {
            const owner = target!.sources.find(
              (item) =>
                (item.resolution as Resolution | null)?.[kind]?.[key] ===
                hash(existing),
            );
            if (!owner) return false; // Legacy data and user edits have precedence.
            if (owner.activitySourceId === source!.activitySourceId)
              return true;
            const previous = owner.payload as unknown as ActivityRecording;
            if (!previous.values) return false;
            const a = quality(recording, channel),
              b = quality(previous, channel);
            for (let i = 0; i < a.length; i++)
              if (a[i] !== b[i]) return a[i] > b[i];
            return provider.localeCompare(owner.provider) < 0;
          };
          const primary = target.sources.find(
            (item) =>
              item.provider === target!.provider &&
              item.externalId === target!.externalId,
          );
          const primaryRecording = primary?.payload as unknown as
            ActivityRecording | undefined;
          const missing = primaryRecording?.missing ?? [];
          const patch: Record<string, unknown> = {};
          for (const [field, value] of Object.entries(recording.values)) {
            if (field === 'sport' || value === undefined || value === null)
              continue;
            const existing = (
              current.values as unknown as Record<string, unknown>
            )[field];
            // Preserve user-owned descriptions and every existing conflicting value.
            // Missing mandatory quantities are filled only when provenance says absent.
            const channel = field.includes('Heartrate')
              ? 'heartrate'
              : field.includes('Watts')
                ? 'watts'
                : field === 'averageCadence'
                  ? 'cadence'
                  : undefined;
            const mayReplaceSensor =
              channel !== undefined &&
              prefer('fields', field, existing, channel);
            if (
              (existing == null ||
                (missing.includes(field) && existing === 0) ||
                (field === 'description' && existing === '') ||
                mayReplaceSensor) &&
              value !== existing
            ) {
              patch[field] = value;
              ownership.fields[field] = hash(value);
            }
          }
          // Keep distance, speed and route on the canonical timeline. If distance
          // disagrees, preserve the alternate route in its raw source only.
          const comparableDistance =
            !current.values.distance ||
            !recording.values.distance ||
            Math.abs(current.values.distance - recording.values.distance) <=
              Math.max(100, current.values.distance * 0.05);
          const incoming = comparableDistance
            ? recording.stream
            : {
                ...recording.stream,
                latlng: undefined,
                distance: undefined,
                altitude: undefined,
              };
          const base = { ...current.stream };
          const preferred: string[] = [];
          for (const channel of ['heartrate', 'watts', 'cadence']) {
            if (
              incoming[channel as keyof typeof incoming]?.length &&
              current.stream[channel as keyof typeof current.stream]?.length &&
              prefer(
                'channels',
                channel,
                current.stream[channel as keyof typeof current.stream],
                channel,
              )
            ) {
              delete base[channel as keyof typeof base];
              preferred.push(channel);
            }
          }
          const stream = enrichRecordingStream(
            base,
            incoming,
            current.startDate,
            recording.startDate,
          );
          for (const channel of preferred) {
            if (!stream[channel as keyof typeof stream])
              (stream as Record<string, unknown>)[channel] =
                current.stream[channel as keyof typeof current.stream];
          }
          for (const [channel, values] of Object.entries(stream)) {
            if (
              channel !== 'time' &&
              hash(values) !==
                hash(
                  current.stream[channel as keyof typeof current.stream] ??
                    null,
                )
            )
              ownership.channels[channel] = hash(values);
          }
          if (hash(stream) !== hash(current.stream))
            patch.stream = json(compressActivityStream(stream));
          changed = Object.keys(patch).length > 0;
          if (changed)
            target = await tx.eventActivity.update({
              where: { eventActivityId: target.eventActivityId },
              data: patch as Prisma.EventActivityUpdateInput,
              include: { event: true, sources: true },
            });
        }
        if (
          recording.laps?.length &&
          (await tx.activitySegment.count({
            where: { eventActivityId: target.eventActivityId },
          })) === 0
        ) {
          const shift = Date.parse(target.event.startDate.toISOString());
          const end = target.event.endDate.getTime();
          // Keep segment coordinates inside the retained canonical recording.
          const laps = recording.laps.filter(
            (lap) =>
              Date.parse(lap.startDate) >= shift &&
              Date.parse(lap.endDate) <= end,
          );
          if (laps.length) {
            const details = buildFitActivityDetails({
              stream: target.stream
                ? uncompressActivityStream(
                    target.stream as unknown as CompressedActivityStream,
                  )
                : {},
              segments: laps.map((lap, orderIndex) => ({
                orderIndex,
                name: lap.name,
                startTimeSeconds: Math.round(
                  (Date.parse(lap.startDate) - shift) / 1000,
                ),
                endTimeSeconds: Math.round(
                  (Date.parse(lap.endDate) - shift) / 1000,
                ),
              })),
            });
            await tx.activitySegment.createMany({
              data: details.segments.map((segment) => ({
                ...segment,
                eventActivityId: target!.eventActivityId,
              })),
            });
            changed = true;
          }
        }
        await tx.activitySource.update({
          where: { activitySourceId: source.activitySourceId },
          data: {
            eventActivityId: target.eventActivityId,
            processingPending: changed || oldSource?.processingPending || false,
            // Record exactly which values this source supplied; raw observations
            // are immutable and available for a later explicit resolution policy.
            resolution: json(ownership),
          },
        });
        return {
          activity: target,
          created,
          status: created ? 'created' : changed ? 'enriched' : 'matched',
          receiptId: source.activitySourceId,
          revision: nextRevision,
          processingPending: changed || oldSource?.processingPending || false,
        };
      },
      { timeout: 30000 },
    );
  }

  async markDispatched(receiptId: number, revision: number) {
    await this.prisma.activitySource.updateMany({
      where: { activitySourceId: receiptId, revision },
      data: { processingPending: false },
    });
  }
}
