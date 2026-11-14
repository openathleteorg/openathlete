import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { HeartRateProfileChangedEvent } from 'src/events';

import { QueueService } from '../modules/queue/queue.service';

/**
 * Queues the TRIMP recalculation when HR max or resting HR change. It runs in
 * the API, where metrics are written; the worker does the recalculation.
 */
@Injectable()
export class TrainingLoadRecalcListener {
  private readonly logger = new Logger(TrainingLoadRecalcListener.name);

  constructor(private readonly queue: QueueService) {}

  @OnEvent(HeartRateProfileChangedEvent.SLUG, { async: true })
  async handle(event: HeartRateProfileChangedEvent) {
    try {
      await this.queue.addTrainingLoadRecalcJob(event.payload.athleteId);
    } catch (error) {
      // Redis down: the loads stay as they are, saving the metric still works
      this.logger.error(
        `Could not queue the training load recalculation for athlete ${event.payload.athleteId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
