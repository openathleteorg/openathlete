import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ImportHealthkitWorkoutDto,
  ImportHealthkitWorkoutResponseDto,
} from '@openathlete/shared';

import { AuthUser } from '../../auth/decorators/user.decorator';
import { PrismaService } from '../../prisma/services/prisma.service';
import { QueueService } from '../../queue/queue.service';
import { healthkitRecording } from '../helpers/activity-recording';
import {
  ActivityReconciliationService,
  ReconciledActivity,
} from './activity-reconciliation.service';

@Injectable()
export class HealthkitWorkoutImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reconciliation: ActivityReconciliationService,
    private readonly queue: QueueService,
  ) {}

  private async athlete(user: AuthUser) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { userId: user.userId },
    });
    if (!athlete)
      throw new ForbiddenException('An athlete profile is required');
    return athlete;
  }

  async import(
    user: AuthUser,
    workout: ImportHealthkitWorkoutDto,
  ): Promise<ImportHealthkitWorkoutResponseDto> {
    const athlete = await this.athlete(user);
    const result = await this.reconciliation.reconcile(
      athlete.athleteId,
      'APPLE_HEALTH',
      workout.workoutUuid,
      healthkitRecording(workout),
      workout.revision,
    );
    return this.dispatch(result);
  }

  private async dispatch(
    result: ReconciledActivity,
  ): Promise<ImportHealthkitWorkoutResponseDto> {
    if (result.processingPending && result.activity) {
      // A durable pending bit survives enqueue failures. An exact HTTP retry
      // submits the same job ID before acknowledging dispatch in PostgreSQL.
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
    }
    return {
      receiptId: result.receiptId,
      revision: result.revision,
      status: result.status,
      eventActivityId: result.activity?.eventActivityId ?? null,
      eventId: result.activity?.eventId ?? null,
      processing: result.processingPending ? 'queued' : 'not_required',
    };
  }

  async status(user: AuthUser, receiptId: number) {
    const athlete = await this.athlete(user);
    const source = await this.prisma.activitySource.findFirst({
      where: {
        activitySourceId: receiptId,
        athleteId: athlete.athleteId,
        provider: 'APPLE_HEALTH',
      },
      include: { eventActivity: true },
    });
    if (!source) throw new NotFoundException();
    return {
      receiptId,
      revision: source.revision,
      eventActivityId: source.eventActivityId,
      eventId: source.eventActivity?.eventId ?? null,
      status: source.eventActivityId
        ? 'accepted'
        : source.reviewDecision
          ? 'ignored'
          : 'needs_review',
      processing: source.processingPending
        ? 'pending_dispatch'
        : 'dispatched_or_not_required',
      candidateActivityIds: source.candidates ?? [],
    };
  }
}
