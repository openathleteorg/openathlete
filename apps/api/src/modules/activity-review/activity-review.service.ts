import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';

import { Prisma } from '@openathlete/database';
import {
  ActivityReviewItem,
  ActivityReviewPage,
  ResolveActivityReview,
  activityReviewIdSchema,
  activityReviewSummarySchema,
} from '@openathlete/shared';

import { ActivityReconciliationService } from '../core/services/activity-reconciliation.service';
import { PrismaService } from '../prisma/services/prisma.service';
import { GarminPersonalService } from '../providers-sync/garmin-personal/garmin-personal-service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class ActivityReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly garmin: GarminPersonalService,
    private readonly reconciliation: ActivityReconciliationService,
    @Inject(forwardRef(() => QueueService))
    private readonly queue: QueueService,
  ) {}

  private async athlete(userId: number) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { userId },
      select: { athleteId: true },
    });
    if (!athlete) throw new ForbiddenException();
    return athlete.athleteId;
  }
  private id(value: string) {
    const parsed = activityReviewIdSchema.safeParse(value);
    if (!parsed.success)
      throw new BadRequestException('Invalid review identity');
    const [kind, id] = parsed.data.split(':');
    return { kind, id: Number(id) };
  }
  async list(userId: number, cursor?: string): Promise<ActivityReviewPage> {
    const athleteId = await this.athlete(userId);
    const position =
      cursor === 'source'
        ? { kind: 'source', id: 0 }
        : cursor
          ? this.id(cursor)
          : { kind: 'garmin-personal', id: 0 };
    const where: Prisma.ActivitySourceWhereInput = {
      athleteId,
      eventActivityId: null,
      reviewDecision: { equals: Prisma.DbNull },
      NOT: [
        { candidates: { equals: Prisma.AnyNull } },
        { candidates: { equals: [] } },
      ],
    };
    const [personalTotal, groups, connection] = await Promise.all([
      this.prisma.garminPersonalItem.count({
        where: { connection: { athleteId }, needsReview: true },
      }),
      this.prisma.activitySource.groupBy({
        by: ['provider'],
        where,
        _count: true,
      }),
      this.prisma.garminPersonalConnection.findUnique({
        where: { athleteId },
        select: { activities: true, encryptedCredentials: true, status: true },
      }),
    ]);
    const counts: Record<string, number> = {
      GARMIN_PERSONAL: personalTotal,
      STRAVA: 0,
      APPLE_HEALTH: 0,
      GARMIN: 0,
    };
    for (const group of groups) counts[group.provider] = group._count;
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const items: ActivityReviewItem[] = [];
    if (position.kind === 'garmin-personal') {
      const personal = await this.garmin.reviews(
        userId,
        position.id || undefined,
      );
      items.push(
        ...personal.items.map((item) => ({
          ...item,
          id: `garmin-personal:${item.id}`,
          revision: 1,
          provider: 'GARMIN_PERSONAL',
          canImport:
            !!connection?.activities &&
            !!connection.encryptedCredentials &&
            connection.status !== 'key_required',
          canLoadDetails:
            !!connection?.activities &&
            !!connection.encryptedCredentials &&
            connection.status !== 'key_required',
        })),
      );
      if (personal.nextCursor)
        return {
          total,
          counts,
          items,
          nextCursor: `garmin-personal:${personal.nextCursor}`,
        };
    }
    const remaining = 20 - items.length;
    if (!remaining)
      return {
        total,
        counts,
        items,
        nextCursor: groups.length ? 'source' : null,
      };
    const sources = await this.prisma.activitySource.findMany({
      where: {
        ...where,
        ...(position.kind === 'source' && position.id
          ? { activitySourceId: { gt: position.id } }
          : {}),
      },
      orderBy: { activitySourceId: 'asc' },
      take: remaining + 1,
      select: {
        activitySourceId: true,
        revision: true,
        provider: true,
        externalId: true,
        candidates: true,
      },
    });
    // Project comparison metadata in PostgreSQL instead of loading potentially large sensor/GPS payloads for an entire page.
    const summaries = sources.length
      ? await this.prisma.$queryRaw<
          {
            id: number;
            summary: {
              name?: string;
              sport?: string;
              distance?: number;
              startDate?: string;
              endDate?: string;
            };
          }[]
        >(
          Prisma.sql`SELECT activity_source_id AS id, jsonb_build_object('name', payload->'name', 'sport', payload->'values'->'sport', 'distance', payload->'values'->'distance', 'startDate', payload->'startDate', 'endDate', payload->'endDate') AS summary FROM activity_source WHERE athlete_id = ${athleteId} AND activity_source_id IN (${Prisma.join(sources.map((source) => source.activitySourceId))})`,
        )
      : [];
    for (const source of sources.slice(0, remaining)) {
      const recording =
        summaries.find((summary) => summary.id === source.activitySourceId)
          ?.summary ?? {};
      const parsed = activityReviewSummarySchema.safeParse({
        name: recording.name,
        sport: recording.sport,
        distance: recording.distance,
        startDate: this.iso(recording.startDate),
        endDate: this.iso(recording.endDate),
      });
      const candidateIds = Array.isArray(source.candidates)
        ? source.candidates
            .filter(
              (id): id is number =>
                typeof id === 'number' && Number.isSafeInteger(id) && id > 0,
            )
            .slice(0, 100)
        : [];
      const candidates = await this.prisma.eventActivity.findMany({
        where: {
          eventActivityId: { in: candidateIds },
          event: { athleteId, type: 'ACTIVITY' },
        },
        orderBy: { eventActivityId: 'asc' },
        select: {
          eventActivityId: true,
          provider: true,
          sport: true,
          distance: true,
          event: {
            select: {
              eventId: true,
              name: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      });
      items.push({
        id: `source:${source.activitySourceId}`,
        revision: source.revision,
        provider: source.provider,
        externalId: source.externalId,
        summary: parsed.success ? parsed.data : null,
        canImport: parsed.success,
        canLoadDetails: false,
        candidates: candidates.map(({ event, ...activity }) => ({
          ...activity,
          ...event,
          sport: activityReviewSummarySchema.shape.sport.parse(activity.sport),
          startDate: event.startDate.toISOString(),
          endDate: event.endDate.toISOString(),
        })),
      });
    }
    return {
      total,
      counts,
      items,
      nextCursor:
        sources.length > remaining
          ? `source:${sources[remaining - 1].activitySourceId}`
          : null,
    };
  }
  private iso(value: unknown) {
    const date = typeof value === 'string' ? new Date(value) : null;
    return date && Number.isFinite(date.getTime()) ? date.toISOString() : null;
  }
  async prepare(userId: number, reviewId: string) {
    const { kind, id } = this.id(reviewId);
    if (kind !== 'garmin-personal')
      throw new BadRequestException('Recording details are already stored');
    return this.garmin.previewReview(userId, id);
  }
  async resolve(userId: number, reviewId: string, body: ResolveActivityReview) {
    const { kind, id } = this.id(reviewId);
    if (kind === 'garmin-personal') {
      if (body.revision !== 1)
        throw new BadRequestException('Invalid review revision');
      const { revision: _revision, ...decision } = body;
      return this.garmin.resolveReview(userId, id, decision);
    }
    const result = await this.reconciliation.resolveReview(
      await this.athlete(userId),
      id,
      body,
    );
    let pending = result.processingPending;
    if (pending && result.activity) {
      try {
        await this.queue.addActivityProcessingJob(
          result.activity.eventActivityId,
          result.activity.eventId,
          true,
          `source-${result.receiptId}-${result.revision}`,
        );
        await this.reconciliation.markDispatched(
          result.receiptId,
          result.revision,
        );
        pending = false;
      } catch {
        /* The durable pending flag is retried by the same decision or the next provider upload. */
      }
    }
    return { resolved: true, pending };
  }
}
