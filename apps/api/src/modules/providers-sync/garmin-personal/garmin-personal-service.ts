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
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { GarminPersonalConnection, Prisma } from '@openathlete/database';
import {
  ApiEnvSchemaType,
  ConnectGarminPersonal,
  GarminPersonalPreferences,
  GarminPersonalResult,
  GarminPersonalReviewPage,
  GarminPersonalReviewSummary,
  GarminPersonalStatus,
  GarminPersonalSync,
  MAX_ACTIVITY_FILE_BYTES,
  ResolveGarminPersonalReview,
  garminPersonalReviewSummarySchema,
  resolveGarminPersonalReviewSchema,
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
    config: ConfigService<ApiEnvSchemaType, true>,
    @InjectQueue(PERSONAL_QUEUE) private readonly jobs: Queue<PersonalJob>,
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
    return {
      connected: !!c?.encryptedCredentials,
      preferences: c
        ? { activities: c.activities, automatic: c.automatic }
        : defaults,
      status: (c?.status ?? 'disconnected') as GarminPersonalStatus['status'],
      error: c?.error ?? null,
      lastSyncedAt: c?.lastSyncedAt?.toISOString() ?? null,
      result: (c?.result as unknown as GarminPersonalResult | null) ?? null,
    };
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
      if (!c?.encryptedCredentials)
        throw new BadRequestException('key_required');
      await tx.garminPersonalConnection.update({
        where: { id: c.id },
        data: {
          ...preferences,
          version: { increment: 1 },
          leaseId: null,
          leaseUntil: null,
          status: 'idle',
          error: null,
        },
      });
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
    if (!c?.encryptedCredentials) throw new BadRequestException('key_required');
    if (!c.activities) throw new BadRequestException('imports_disabled');
    const jobId = `personal-${c.id}-${c.version}-${range.startDate}-${range.endDate}-${Math.floor(Date.now() / 60000)}`;
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
    return this.prisma.$transaction(async (tx) => {
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
        activity = await this.createImportedActivity(
          tx,
          c,
          externalId,
          name,
          fit,
        );
        created = true;
      }
      const item = await tx.garminPersonalItem.create({
        data: {
          ...identity,
          eventActivityId: activity?.eventActivityId,
          processingPending: created,
          needsReview,
          reviewSummary: needsReview
            ? json(this.reviewSummary(name, fit))
            : Prisma.DbNull,
        },
      });
      return { item, created };
    });
  }
  private reviewSummary(
    name: string,
    fit: ReturnType<typeof prepareManualFit>,
  ): GarminPersonalReviewSummary {
    return {
      name: name.trim() || 'Garmin',
      sport: fit.activity.sport,
      startDate: fit.startDate.toISOString(),
      endDate: fit.endDate.toISOString(),
      distance: fit.activity.distance,
    };
  }
  private async createImportedActivity(
    tx: Prisma.TransactionClient,
    c: GarminPersonalConnection,
    externalId: string,
    name: string,
    fit: ReturnType<typeof prepareManualFit>,
  ) {
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
    return event.activity!;
  }
  async reviews(
    userId: number,
    cursor?: number,
  ): Promise<GarminPersonalReviewPage> {
    const athleteId = await this.athlete(userId);
    const where = { connection: { athleteId }, needsReview: true };
    const [total, rows] = await Promise.all([
      this.prisma.garminPersonalItem.count({ where }),
      this.prisma.garminPersonalItem.findMany({
        where: { ...where, ...(cursor ? { id: { gt: cursor } } : {}) },
        orderBy: { id: 'asc' },
        take: 21,
      }),
    ]);
    const items = await Promise.all(
      rows.slice(0, 20).map(async (row) => {
        const parsed = garminPersonalReviewSummarySchema.safeParse(
          row.reviewSummary,
        );
        const summary = parsed.success ? parsed.data : null;
        const candidates = summary
          ? await this.prisma.event.findMany({
              where: {
                athleteId,
                type: 'ACTIVITY',
                startDate: {
                  gte: new Date(Date.parse(summary.startDate) - 30000),
                  lte: new Date(Date.parse(summary.startDate) + 30000),
                },
              },
              orderBy: { eventId: 'asc' },
              take: 20,
              select: {
                eventId: true,
                name: true,
                startDate: true,
                endDate: true,
                activity: {
                  select: {
                    eventActivityId: true,
                    provider: true,
                    sport: true,
                    distance: true,
                  },
                },
              },
            })
          : [];
        return {
          id: row.id,
          externalId: row.externalId,
          summary,
          candidates: candidates.flatMap((event) =>
            event.activity
              ? [
                  {
                    eventId: event.eventId,
                    name: event.name,
                    startDate: event.startDate.toISOString(),
                    endDate: event.endDate.toISOString(),
                    ...event.activity,
                    sport: garminPersonalReviewSummarySchema.shape.sport.parse(
                      event.activity.sport,
                    ),
                  },
                ]
              : [],
          ),
        };
      }),
    );
    return { total, items, nextCursor: rows.length > 20 ? rows[19].id : null };
  }
  private async ownedReview(userId: number, id: number) {
    const athleteId = await this.athlete(userId);
    const item = await this.prisma.garminPersonalItem.findFirst({
      where: { id, connection: { athleteId } },
      include: { connection: true },
    });
    if (!item) throw new NotFoundException();
    return item;
  }
  private async reviewFit(c: GarminPersonalConnection, externalId: string) {
    if (!c.encryptedCredentials || !c.activities)
      throw new BadRequestException('imports_disabled');
    try {
      let credentials = JSON.parse(
        this.cipher.decrypt(c.athleteId, c.encryptedCredentials),
      ) as PersonalCredentials;
      const renew = async () => {
        credentials = await this.client.authorize(credentials.apiKey);
        const updated = await this.prisma.garminPersonalConnection.updateMany({
          where: {
            id: c.id,
            version: c.version,
            encryptedCredentials: { not: null },
            activities: true,
          },
          data: {
            encryptedCredentials: this.cipher.encrypt(
              c.athleteId,
              JSON.stringify(credentials),
            ),
          },
        });
        if (!updated.count) throw new GarminPersonalError('key_required');
      };
      if (credentials.expiresAt <= Date.now() + 3600000) await renew();
      let bytes: Buffer;
      try {
        bytes = await this.client.download(credentials, externalId);
      } catch (error) {
        if (
          !(error instanceof GarminPersonalError) ||
          error.code !== 'key_required'
        )
          throw error;
        await renew();
        bytes = await this.client.download(credentials, externalId);
      }
      return prepareManualFit(
        await new FitParserStrategy().parse(
          Uint8Array.from(extractPersonalFit(bytes)).buffer,
        ),
      );
    } catch (error) {
      if (
        error instanceof GarminPersonalError &&
        error.code === 'key_required'
      ) {
        await this.prisma.garminPersonalConnection.updateMany({
          where: {
            id: c.id,
            version: c.version,
            encryptedCredentials: { not: null },
          },
          data: { status: 'key_required', error: 'key_required' },
        });
      }
      throw new BadRequestException(
        error instanceof GarminPersonalError ? error.code : 'invalid_response',
      );
    }
  }
  private async currentReview(
    tx: Prisma.TransactionClient,
    c: GarminPersonalConnection,
  ) {
    try {
      await this.current(tx, c, 'activities');
    } catch (error) {
      if (error instanceof GarminPersonalError)
        throw new ConflictException(
          'Connection changed; refresh before reviewing',
        );
      throw error;
    }
  }
  async previewReview(userId: number, id: number) {
    const item = await this.ownedReview(userId, id);
    if (!item.needsReview)
      throw new ConflictException('Review already resolved');
    if (garminPersonalReviewSummarySchema.safeParse(item.reviewSummary).success)
      return { loaded: true };
    const fit = await this.reviewFit(item.connection, item.externalId);
    await this.prisma.$transaction(async (tx) => {
      await this.currentReview(tx, item.connection);
      await tx.garminPersonalItem.updateMany({
        where: { id, needsReview: true },
        data: {
          reviewSummary: json(
            this.reviewSummary(`Garmin ${item.externalId}`, fit),
          ),
        },
      });
    });
    return { loaded: true };
  }
  async resolveReview(
    userId: number,
    id: number,
    decision: ResolveGarminPersonalReview,
  ) {
    const item = await this.ownedReview(userId, id);
    // Fetch outside the transaction. Recheck ownership, consent and version under the same import lock before writing.
    const fit =
      item.needsReview && decision.action === 'import'
        ? await this.reviewFit(item.connection, item.externalId)
        : null;
    const saved = await this.prisma.$transaction(async (tx) => {
      await this.lock(tx, item.connection.athleteId);
      const current = await tx.garminPersonalItem.findUniqueOrThrow({
        where: { id },
      });
      if (!current.needsReview) {
        const previous = resolveGarminPersonalReviewSchema.safeParse(
          current.reviewDecision,
        );
        if (
          !previous.success ||
          previous.data.action !== decision.action ||
          (decision.action === 'link' &&
            previous.data.action === 'link' &&
            previous.data.eventActivityId !== decision.eventActivityId)
        )
          throw new ConflictException('Review already resolved');
        return current;
      }
      let eventActivityId: number | null = null;
      if (decision.action === 'link') {
        const target = await tx.eventActivity.findFirst({
          where: {
            eventActivityId: decision.eventActivityId,
            event: { athleteId: item.connection.athleteId },
          },
          select: { eventActivityId: true },
        });
        if (!target) throw new NotFoundException();
        eventActivityId = target.eventActivityId;
      } else if (decision.action === 'import') {
        await this.currentReview(tx, item.connection);
        const summary = garminPersonalReviewSummarySchema.safeParse(
          current.reviewSummary,
        );
        eventActivityId = (
          await this.createImportedActivity(
            tx,
            item.connection,
            item.externalId,
            summary.success ? summary.data.name : `Garmin ${item.externalId}`,
            fit!,
          )
        ).eventActivityId;
      }
      // Linking changes only the receipt, preserving all edits, streams and training links on the existing activity.
      return tx.garminPersonalItem.update({
        where: { id },
        data: {
          eventActivityId,
          needsReview: false,
          reviewDecision: json(decision),
          processingPending: decision.action === 'import',
        },
      });
    });
    let pending = saved.processingPending;
    if (pending && saved.eventActivityId) {
      try {
        const activity = await this.prisma.eventActivity.findUniqueOrThrow({
          where: { eventActivityId: saved.eventActivityId },
        });
        await this.processing.addActivityProcessingJob(
          activity.eventActivityId,
          activity.eventId,
          true,
        );
        await this.prisma.garminPersonalItem.update({
          where: { id },
          data: { processingPending: false },
        });
        pending = false;
      } catch {
        /* A retry resumes processing without creating another activity. */
      }
    }
    return { resolved: true, pending };
  }
  async run(job: PersonalJob) {
    const c = await this.prisma.garminPersonalConnection.findUnique({
      where: { id: job.connectionId },
    });
    if (!c?.encryptedCredentials || c.version !== job.version || !c.activities)
      return;
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
    if (!claim.count) throw new ConflictException('Sync already running');
    const result = emptyResult();
    try {
      let credentials = JSON.parse(
        this.cipher.decrypt(c.athleteId, c.encryptedCredentials),
      ) as PersonalCredentials;
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
                : await this.storeActivity(
                    c,
                    activity.activityId,
                    activity.activityName ?? 'Garmin',
                    prepareManualFit(
                      await new FitParserStrategy().parse(
                        Uint8Array.from(
                          extractPersonalFit(
                            await request(() =>
                              this.client.download(
                                credentials,
                                activity.activityId,
                              ),
                            ),
                          ),
                        ).buffer,
                      ),
                    ),
                  );
              if (saved.item.needsReview) result.needsReview++;
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
                error.code !== 'invalid_response'
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
