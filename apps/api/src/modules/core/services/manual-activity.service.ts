import { subject } from '@casl/ability';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { Event, SportType } from '@openathlete/database';
import { activityEventSchema } from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { QueueService } from 'src/modules/queue/queue.service';

import { EventService } from './event.service';

type ManualActivityDto = z.infer<typeof activityEventSchema>;

const MAX_DURATION_S = 48 * 3600;

/**
 * Activities logged by hand: a swim without a watch, a strength session.
 * They go through the same processing as imported ones (default equipment,
 * matching a planned session, load).
 */
@Injectable()
export class ManualActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
    private readonly events: EventService,
    private readonly queue: QueueService,
  ) {}

  async create(user: AuthUser, dto: ManualActivityDto) {
    const athleteId = dto.athleteId ?? user.athlete?.athleteId;
    if (!athleteId) {
      throw new BadRequestException('athleteId is required');
    }
    const ability = await this.abilities.getFor({ user });
    if (!ability.can('create', subject('Event', { athleteId } as Event))) {
      throw new ForbiddenException('You are not allowed to create this event');
    }
    const movingTime = Math.round(
      (dto.endDate.getTime() - dto.startDate.getTime()) / 1000,
    );
    if (movingTime <= 0 || movingTime > MAX_DURATION_S) {
      throw new BadRequestException(
        'The end must come after the start, within 48 hours',
      );
    }
    if (dto.equipmentId) {
      const equipment = await this.prisma.equipment.findFirst({
        where: { equipmentId: dto.equipmentId, athleteId },
      });
      if (!equipment) {
        throw new BadRequestException(
          "The equipment does not belong to the activity's athlete",
        );
      }
    }

    const distance = dto.distance ?? 0;
    const speed = distance / movingTime;
    const created = await this.prisma.event.create({
      data: {
        type: 'ACTIVITY',
        name: dto.name,
        startDate: dto.startDate,
        endDate: dto.endDate,
        athleteId,
        activity: {
          create: {
            // No provider: logged in OpenAthlete
            externalId: `manual-${randomUUID()}`,
            sport: dto.sport as SportType,
            description: dto.description ?? '',
            distance,
            elevationGain: dto.elevationGain ?? 0,
            movingTime,
            averageSpeed: speed,
            maxSpeed: speed,
            rpe: dto.rpe ?? null,
            isRace: dto.isRace ?? false,
            equipmentId: dto.equipmentId ?? null,
          },
        },
      },
      select: {
        eventId: true,
        activity: { select: { eventActivityId: true } },
      },
    });
    // Best effort: the activity is saved either way
    await this.queue
      .addActivityProcessingJob(
        created.activity!.eventActivityId,
        created.eventId,
      )
      .catch(() => undefined);
    return this.events.getEventById(user, created.eventId);
  }
}
