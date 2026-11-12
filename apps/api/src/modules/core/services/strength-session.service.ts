import { randomUUID } from 'node:crypto';

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EventType, Prisma } from '@openathlete/database';
import type { CompleteStrengthSessionDto } from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { accessibleBy } from 'src/modules/auth/services/casl-prisma';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { QueueService } from 'src/modules/queue/queue.service';

import { EventService } from './event.service';

/**
 * A planned session played to the end in the app's session player: it
 * becomes the activity done for it, with the sets as they were done.
 */
@Injectable()
export class StrengthSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
    private readonly events: EventService,
    private readonly queue: QueueService,
  ) {}

  async complete(
    user: AuthUser,
    eventId: number,
    dto: CompleteStrengthSessionDto,
  ) {
    const ability = await this.abilities.getFor({ user });
    const planned = await this.prisma.event.findFirst({
      where: {
        AND: [
          { eventId, type: EventType.TRAINING },
          accessibleBy(ability, 'update').Event,
        ],
      },
      select: {
        eventId: true,
        name: true,
        athleteId: true,
        training: { select: { sport: true, relatedActivityId: true } },
      },
    });
    if (!planned?.training || !planned.athleteId) {
      throw new NotFoundException();
    }
    if (planned.training.relatedActivityId) {
      throw new ConflictException('The session is already done');
    }

    const startDate = dto.startedAt;
    const endDate = new Date(startDate.getTime() + dto.durationSeconds * 1000);
    const created = await this.prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          type: EventType.ACTIVITY,
          name: planned.name,
          startDate,
          endDate,
          athleteId: planned.athleteId,
          activity: {
            create: {
              // Recorded in OpenAthlete, by no provider
              externalId: `player-${randomUUID()}`,
              sport: planned.training!.sport,
              description: dto.comment?.trim() ?? '',
              distance: 0,
              elevationGain: 0,
              movingTime: dto.durationSeconds,
              averageSpeed: 0,
              maxSpeed: 0,
              // Activities keep RPE on a 0-1 scale
              rpe: dto.rpe === null ? null : dto.rpe / 10,
              strengthLog: dto.log as unknown as Prisma.InputJsonValue,
            },
          },
        },
        select: {
          eventId: true,
          activity: { select: { eventActivityId: true } },
        },
      });
      // Only if still free: two devices finishing together link once
      const linked = await tx.eventTraining.updateMany({
        where: { eventId: planned.eventId, relatedActivityId: null },
        data: { relatedActivityId: event.activity!.eventActivityId },
      });
      if (linked.count === 0) {
        throw new ConflictException('The session is already done');
      }
      return event;
    });

    // Load and the rest of the processing; the activity is saved either way
    await this.queue
      .addActivityProcessingJob(
        created.activity!.eventActivityId,
        created.eventId,
      )
      .catch(() => undefined);
    return this.events.getEventById(user, created.eventId);
  }
}
