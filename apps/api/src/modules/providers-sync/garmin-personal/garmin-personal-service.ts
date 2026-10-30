import AdmZip from 'adm-zip';
import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';

import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Optional,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { GarminPersonalConnection, Prisma } from '@openathlete/database';
import {
  ApiEnvSchemaType,
  ConnectGarminPersonal,
  GarminPersonalPreferences,
  GarminPersonalResult,
  GarminPersonalStatus,
  GarminPersonalSync,
  MAX_ACTIVITY_FILE_BYTES,
  garminPersonalStatusSchema,
} from '@openathlete/shared';

import { prepareManualFit } from '../../core/helpers/manual-fit-import';
import { FitParserStrategy } from '../../core/helpers/strategies/fit-parser.strategy';
import { PrismaService } from '../../prisma/services/prisma.service';
import { QueueService } from '../../queue/queue.service';
import { GarminPersonalCipher } from './garmin-personal-cipher';
import {
  GarminPersonalClient,
  GarminPersonalError,
  PersonalCredentials,
} from './garmin-personal-client';

export const PERSONAL_QUEUE = 'garmin-personal-sync';
export interface PersonalJob extends GarminPersonalSync {
  connectionId: number;
  version: number;
}
const emptyResult = (): GarminPersonalResult => ({
  imported: 0,
  matched: 0,
  skipped: 0,
  needsReview: 0,
  failed: 0,
  pending: 0,
  truncated: false,
});
const defaults = { activities: false, automatic: false };
const json = (value: unknown) => value as Prisma.InputJsonValue;

export function extractPersonalFit(zipBytes: Buffer): Buffer {
  try {
    const entries = new AdmZip(zipBytes)
      .getEntries()
      .filter((v) => !v.isDirectory);
    const fits = entries.filter((v) => /\.fit$/i.test(v.entryName));
    if (
      entries.length > 16 ||
      fits.length !== 1 ||
      fits[0].header.size > MAX_ACTIVITY_FILE_BYTES
    )
      throw new Error();
    // No filesystem extraction, no trusting archive paths, bounded uncompressed FIT size.
    const fit = fits[0].getData();
    if (!fit.length || fit.length > MAX_ACTIVITY_FILE_BYTES) throw new Error();
    return fit;
  } catch {
    throw new GarminPersonalError('invalid_response');
  }
}

@Injectable()
export class GarminPersonalService {
  private readonly cipher: GarminPersonalCipher;
  constructor(
    private readonly prisma: PrismaService,
    private readonly client: GarminPersonalClient,
    private readonly config: ConfigService<ApiEnvSchemaType, true>,
    @Optional()
    @InjectQueue(PERSONAL_QUEUE)
    private readonly jobs: Queue<PersonalJob> | undefined,
    @Inject(forwardRef(() => QueueService))
    private readonly processing: QueueService,
  ) {
    this.cipher = new GarminPersonalCipher(config.getOrThrow('HASH_PEPPER'));
  }

  private async athlete(userId: number) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { userId },
      select: { athleteId: true },
    });
    if (!athlete) throw new ForbiddenException();
    return athlete.athleteId;
  }
  private statusOf(c: GarminPersonalConnection | null): GarminPersonalStatus {
    return garminPersonalStatusSchema.parse({
      connected: !!c?.encryptedCredentials,
      preferences: c
        ? { activities: c.activities, automatic: c.automatic }
        : defaults,
      status: c?.status ?? 'disconnected',
      error: c?.error ?? null,
      lastSyncedAt: c?.lastSyncedAt?.toISOString() ?? null,
      result: c?.result ?? null,
    });
  }
  async status(userId: number) {
    return this.statusOf(
      await this.prisma.garminPersonalConnection.findUnique({
        where: { athleteId: await this.athlete(userId) },
      }),
    );
  }
  async connect(userId: number, dto: ConnectGarminPersonal) {
    const athleteId = await this.athlete(userId);
    let credentials: PersonalCredentials;
    try {
      credentials = await this.client.authorize(dto.apiKey);
      // Validate data access as well as the token; never accept an arbitrary pasted bearer token.
      const profile = await this.client.get(
        credentials,
        '/userprofile-service/userprofile/settings',
      );
      if (!profile || typeof profile !== 'object' || Array.isArray(profile))
        throw new GarminPersonalError('invalid_response');
    } catch (error) {
      throw new BadRequestException(
        error instanceof GarminPersonalError ? error.code : 'unavailable',
      );
    }
    return this.prisma.$transaction(async (tx) => {
      await this.lock(tx, athleteId);
      const values = {
        encryptedCredentials: this.cipher.encrypt(
          athleteId,
          JSON.stringify(credentials),
        ),
        activities: dto.activities,
        automatic: dto.automatic,
        status: 'idle',
        error: null,
        result: Prisma.DbNull,
        leaseId: null,
        leaseUntil: null,
      };
      const c = await tx.garminPersonalConnection.upsert({
        where: { athleteId },
        create: { athleteId, ...values },
        update: { ...values, version: { increment: 1 } },
      });
      return this.statusOf(c);
    });
  }
  async preferences(userId: number, preferences: GarminPersonalPreferences) {
    const athleteId = await this.athlete(userId);
    await this.prisma.$transaction(async (tx) => {
      await this.lock(tx, athleteId);
      const c = await tx.garminPersonalConnection.findUnique({
        where: { athleteId },
      });
      if (!c?.encryptedCredentials || c.status === 'key_required')
        throw new BadRequestException('key_required');
      // The conditional write also covers a worker acquiring its lease after
      // this transaction read the connection. Do not invalidate an active job.
      const changed = await tx.garminPersonalConnection.updateMany({
        where: {
          id: c.id,
          version: c.version,
          status: { notIn: ['queued', 'running'] },
          OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }],
        },
        data: {
          ...preferences,
          version: { increment: 1 },
          leaseId: null,
          leaseUntil: null,
          status: 'idle',
          error: null,
        },
      });
      if (!changed.count) throw new ConflictException('sync_in_progress');
    });
    return this.status(userId);
  }
  async disconnect(userId: number) {
    const athleteId = await this.athlete(userId);
    await this.prisma.$transaction(async (tx) => {
      await this.lock(tx, athleteId);
      await tx.garminPersonalConnection.updateMany({
        where: { athleteId },
        data: {
          encryptedCredentials: null,
          ...defaults,
          status: 'disconnected',
          version: { increment: 1 },
          leaseId: null,
          leaseUntil: null,
          error: null,
        },
      });
    });
    return this.status(userId);
  }
  async enqueue(userId: number, range: GarminPersonalSync) {
    const c = await this.prisma.garminPersonalConnection.findUnique({
      where: { athleteId: await this.athlete(userId) },
    });
    if (!c?.encryptedCredentials || c.status === 'key_required')
      throw new BadRequestException('key_required');
    if (!c.activities) throw new BadRequestException('imports_disabled');
    const jobId = `personal-${c.id}-${c.version}-${range.startDate}-${range.endDate}-${Math.floor(Date.now() / 60000)}`;
    if (!this.jobs) throw new BadRequestException('PROVIDER_NOT_CONFIGURED');
    const existing = await this.jobs.getJob(jobId);
    if (existing)
      return {
        queued: !['completed', 'failed'].includes(await existing.getState()),
      };
    await this.prisma.garminPersonalConnection.updateMany({
      where: { id: c.id, version: c.version, status: { not: 'running' } },
      data: { status: 'queued', error: null },
    });
    try {
      await this.jobs.add(
        'pull',
        { connectionId: c.id, version: c.version, ...range },
        {
          jobId,
          attempts: 3,
          backoff: { type: 'exponential', delay: 60000 },
          removeOnComplete: { age: 86400, count: 1000 },
          removeOnFail: { age: 604800, count: 1000 },
        },
      );
    } catch {
      await this.prisma.garminPersonalConnection.updateMany({
        where: { id: c.id, version: c.version, status: 'queued' },
        data: { status: 'failed', error: 'unavailable' },
      });
      throw new BadRequestException('unavailable');
    }
    return { queued: true };
  }
  private lock(tx: Prisma.TransactionClient, athleteId: number) {
    return tx.$executeRaw`SELECT pg_advisory_xact_lock(72468, ${athleteId}::integer)`;
  }
  private async current(
    tx: Prisma.TransactionClient,
    c: GarminPersonalConnection,
    kind: 'activities',
  ) {
    await this.lock(tx, c.athleteId);
    const current = await tx.garminPersonalConnection.findUnique({
      where: { id: c.id },
    });
    if (
      !current?.encryptedCredentials ||
      current.version !== c.version ||
      !current[kind]
    )
      throw new GarminPersonalError('key_required');
  }
  private async storeActivity(
    c: GarminPersonalConnection,
    externalId: string,
    name: string,
    fit: ReturnType<typeof prepareManualFit>,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        await this.current(tx, c, 'activities');
        const identity = { connectionId: c.id, externalId };
        const existing = await tx.garminPersonalItem.findUnique({
          where: { connectionId_externalId: identity },
        });
        if (existing) return { item: existing, created: false };
        const original = await tx.eventActivity.findFirst({
          where: {
            provider: 'GARMIN',
            externalId,
            event: { athleteId: c.athleteId },
          },
        });
        const near = original
          ? []
          : await tx.event.findMany({
              where: {
                athleteId: c.athleteId,
                type: 'ACTIVITY',
                startDate: {
                  gte: new Date(fit.startDate.getTime() - 30000),
                  lte: new Date(fit.startDate.getTime() + 30000),
                },
              },
              include: { activity: true },
            });
        // Only a unique close recording with comparable sport, time and distance can match.
        // An edited or ambiguous candidate is left untouched and uncounted for review.
        const matches = near.filter(
          (v) =>
            v.activity?.sport === fit.activity.sport &&
            Math.abs(
              v.endDate.getTime() -
                v.startDate.getTime() -
                (fit.endDate.getTime() - fit.startDate.getTime()),
            ) <= 30000 &&
            fit.activity.distance > 0 &&
            Math.abs(v.activity.distance - fit.activity.distance) <=
              Math.max(50, fit.activity.distance * 0.01),
        );
        let activity =
          original ??
          (near.length === 1 && matches.length === 1
            ? matches[0].activity
            : null);
        const needsReview = !activity && near.length > 0;
        let created = false;
        if (!activity && !needsReview) {
          const event = await tx.event.create({
            data: {
              athleteId: c.athleteId,
              type: 'ACTIVITY',
              name,
              startDate: fit.startDate,
              endDate: fit.endDate,
              activity: {
                create: {
                  ...fit.activity,
                  provider: 'GARMIN',
                  externalId: `garmin-personal:${c.athleteId}:${externalId}`,
                  stream: json(fit.details.stream),
                  segments: { create: fit.details.segments },
                },
              },
            },
            include: { activity: true },
          });
          activity = event.activity;
          created = true;
        }
        const item = await tx.garminPersonalItem.create({
          data: {
            ...identity,
            eventActivityId: activity?.eventActivityId,
            processingPending: created,
            needsReview,
          },
        });
        return { item, created };
      },
      { timeout: 15000 },
    );
  }

  private async storeSkippedActivity(
    c: GarminPersonalConnection,
    externalId: string,
    reason: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.current(tx, c, 'activities');
      // Preserve existing matches, local-deletion tombstones and review receipts.
      return tx.garminPersonalItem.upsert({
        where: { connectionId_externalId: { connectionId: c.id, externalId } },
        create: { connectionId: c.id, externalId, skipReason: reason },
        update: {},
      });
    });
  }

  private async importDownloadedActivity(
    c: GarminPersonalConnection,
    externalId: string,
    name: string,
    download: () => Promise<Buffer>,
  ) {
    const archive = await download();
    let fit: ReturnType<typeof prepareManualFit>;
    try {
      fit = prepareManualFit(
        await new FitParserStrategy().parse(
          Uint8Array.from(extractPersonalFit(archive)).buffer,
        ),
      );
    } catch (error) {
      // Only explicit policy rejections are permanent. Corrupt/truncated files,
      // failed downloads, parse errors and database errors remain retryable.
      if (
        error instanceof BadRequestException &&
        [
          'FIT_MULTISPORT_UNSUPPORTED',
          'FIT_NOT_ACTIVITY',
          'FIT_LIMIT',
        ].includes(error.message)
      ) {
        return {
          item: await this.storeSkippedActivity(c, externalId, error.message),
          created: false,
        };
      }
      throw error;
    }
    return this.storeActivity(c, externalId, name, fit);
  }
  async run(job: PersonalJob) {
    if (this.config.get('GARMIN_PERSONAL_API_ENABLED') !== true) return;
    const c = await this.prisma.garminPersonalConnection.findUnique({
      where: { id: job.connectionId },
    });
    if (!c?.encryptedCredentials || c.version !== job.version || !c.activities)
      return;
    if (c.status === 'key_required')
      throw new GarminPersonalError('key_required');
    const leaseId = randomUUID();
    const claim = await this.prisma.garminPersonalConnection.updateMany({
      where: {
        id: c.id,
        version: c.version,
        OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }],
      },
      data: {
        leaseId,
        leaseUntil: new Date(Date.now() + 1200000),
        status: 'running',
        error: null,
      },
    });
    if (!claim.count) return;
    const result = emptyResult();
    try {
      let credentials: PersonalCredentials;
      try {
        credentials = JSON.parse(
          this.cipher.decrypt(c.athleteId, c.encryptedCredentials),
        ) as PersonalCredentials;
        if (
          !credentials?.apiKey ||
          !credentials.token ||
          !Number.isFinite(credentials.expiresAt)
        )
          throw new Error();
      } catch {
        // A restored database with a different pepper or corrupt ciphertext
        // cannot recover without a new key. Never keep retrying it hourly.
        throw new GarminPersonalError('key_required');
      }
      const persist = async () => {
        const updated = await this.prisma.garminPersonalConnection.updateMany({
          where: { id: c.id, version: c.version, leaseId },
          data: {
            encryptedCredentials: this.cipher.encrypt(
              c.athleteId,
              JSON.stringify(credentials),
            ),
            leaseUntil: new Date(Date.now() + 1200000),
          },
        });
        if (!updated.count) throw new GarminPersonalError('key_required');
      };
      const request = async <T>(get: () => Promise<T>): Promise<T> => {
        if (credentials.expiresAt <= Date.now() + 3600000) {
          credentials = await this.client.authorize(credentials.apiKey);
          await persist();
        }
        try {
          return await get();
        } catch (error) {
          if (
            !(error instanceof GarminPersonalError) ||
            error.code !== 'key_required'
          )
            throw error;
          credentials = await this.client.authorize(credentials.apiKey);
          await persist();
          return get();
        }
      };
      if (c.activities) {
        for (let start = 0; start < 1000; start += 100) {
          const activities = await request(() =>
            this.client.activities(
              credentials,
              job.startDate,
              job.endDate,
              start,
            ),
          );
          for (const activity of activities) {
            await persist();
            try {
              const identity = {
                connectionId: c.id,
                externalId: activity.activityId,
              };
              const old = await this.prisma.garminPersonalItem.findUnique({
                where: { connectionId_externalId: identity },
              });
              const saved = old
                ? { item: old, created: false }
                : await this.importDownloadedActivity(
                    c,
                    activity.activityId,
                    activity.activityName ?? 'Garmin',
                    () =>
                      request(() =>
                        this.client.download(credentials, activity.activityId),
                      ),
                  );
              if (saved.item.skipReason) result.skipped++;
              else if (saved.item.needsReview) result.needsReview++;
              else if (saved.created) result.imported++;
              else result.matched++;
              if (saved.item.processingPending && saved.item.eventActivityId) {
                try {
                  const a = await this.prisma.eventActivity.findUniqueOrThrow({
                    where: { eventActivityId: saved.item.eventActivityId },
                  });
                  await this.processing.addActivityProcessingJob(
                    a.eventActivityId,
                    a.eventId,
                    true,
                  );
                  await this.prisma.garminPersonalItem.update({
                    where: { id: saved.item.id },
                    data: { processingPending: false },
                  });
                } catch {
                  result.pending++;
                }
              }
            } catch (error) {
              if (
                error instanceof GarminPersonalError &&
                error.code !== 'invalid_response' &&
                error.code !== 'access_denied'
              )
                throw error;
              result.failed++;
            }
          }
          if (activities.length < 100) break;
          if (start === 900) result.truncated = true;
        }
      }
      const partial =
        result.failed > 0 ||
        result.needsReview > 0 ||
        result.pending > 0 ||
        result.truncated;
      await this.prisma.garminPersonalConnection.updateMany({
        where: { id: c.id, version: c.version, leaseId },
        data: {
          status: partial ? 'partial' : 'completed',
          result: json(result),
          lastSyncedAt: new Date(),
          leaseId: null,
          leaseUntil: null,
        },
      });
      return result;
    } catch (error) {
      const code =
        error instanceof GarminPersonalError ? error.code : 'unavailable';
      await this.prisma.garminPersonalConnection.updateMany({
        where: { id: c.id, version: c.version, leaseId },
        data: {
          status: code === 'key_required' ? 'key_required' : 'failed',
          error: code,
          result: json(result),
          leaseId: null,
          leaseUntil: null,
        },
      });
      throw new GarminPersonalError(code);
    }
  }
}
