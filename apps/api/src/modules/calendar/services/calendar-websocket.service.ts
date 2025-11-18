import { Injectable, Logger } from '@nestjs/common';

import { CalendarGateway } from '../gateways/calendar.gateway';

@Injectable()
export class CalendarWebSocketService {
  private readonly logger = new Logger(CalendarWebSocketService.name);

  constructor(private readonly calendarGateway: CalendarGateway) {}

  notifyWeeklyLoadUpdated(
    athleteId: number,
    context?: { eventId?: number; reason?: 'event_deleted' | 'event_updated' },
  ): void {
    try {
      this.calendarGateway.broadcastToAthlete(
        athleteId,
        'weekly_load_updated',
        {
          athleteId,
          ...context,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to notify weekly load updated: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  notifyTrainingLoadEstimationStarted(
    eventId: number,
    athleteId: number,
  ): void {
    try {
      this.calendarGateway.broadcastToAthlete(
        athleteId,
        'training_load_estimation_started',
        {
          eventId,
          athleteId,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to notify training load estimation started: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  notifyTrainingLoadEstimationCompleted(
    eventId: number,
    athleteId: number,
    estimatedLoad: number,
  ): void {
    try {
      this.calendarGateway.broadcastToAthlete(
        athleteId,
        'training_load_estimation_completed',
        {
          eventId,
          athleteId,
          estimatedLoad,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to notify training load estimation completed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  notifyTrainingLoadEstimationFailed(
    eventId: number,
    athleteId: number,
    error: string,
  ): void {
    try {
      this.calendarGateway.broadcastToAthlete(
        athleteId,
        'training_load_estimation_failed',
        {
          eventId,
          athleteId,
          error,
        },
      );
    } catch (err) {
      this.logger.error(
        `Failed to notify training load estimation failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  notifyActivityProcessed(eventId: number, athleteId: number): void {
    try {
      this.calendarGateway.broadcastToAthlete(athleteId, 'activity_processed', {
        eventId,
        athleteId,
      });
    } catch (error) {
      this.logger.error(
        `Failed to notify activity processed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
