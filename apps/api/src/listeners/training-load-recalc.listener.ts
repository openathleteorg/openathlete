import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { HeartRateProfileChangedEvent } from 'src/events';

import { QueueService } from '../modules/queue/queue.service';

/**
 * Queues the TRIMP recalculation when HR max or resting HR change. It runs in
 * the API, where metrics are written; the worker does the recalculation.
 */
@Injectable()
export class TrainingLoadRecalcListener {
  constructor(private readonly queue: QueueService) {}

  @OnEvent(HeartRateProfileChangedEvent.SLUG, { async: true })
  async handle(event: HeartRateProfileChangedEvent) {
    await this.queue.addTrainingLoadRecalcJob(event.payload.athleteId);
  }
}
