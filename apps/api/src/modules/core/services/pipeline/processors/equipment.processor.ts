import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { ActivityPipelineContext, ActivityProcessor } from '../types';

/**
 * Attaches the athlete's default equipment for the activity's sport, such
 * as the shoes set as default for running, so its distance adds up. An
 * activity that already has equipment keeps it.
 */
@Injectable()
export class EquipmentProcessor implements ActivityProcessor {
  name = 'equipment';
  private readonly logger = new Logger(EquipmentProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(ctx: ActivityPipelineContext) {
    const activity = await this.prisma.eventActivity.findUnique({
      where: { eventActivityId: ctx.eventActivityId },
      select: {
        equipmentId: true,
        sport: true,
        event: { select: { athleteId: true } },
      },
    });
    if (!activity?.event.athleteId || activity.equipmentId) return;

    const equipment = await this.prisma.equipment.findFirst({
      where: {
        athleteId: activity.event.athleteId,
        isDefault: true,
        sports: { has: activity.sport },
      },
      orderBy: { createdAt: 'asc' },
      select: { equipmentId: true },
    });
    if (!equipment) return;

    // Only if still without equipment: the athlete may have chosen one meanwhile
    await this.prisma.eventActivity.updateMany({
      where: { eventActivityId: ctx.eventActivityId, equipmentId: null },
      data: { equipmentId: equipment.equipmentId },
    });
    this.logger.debug(
      `Equipment ${equipment.equipmentId} attached to activity ${ctx.eventActivityId}`,
    );
  }
}
