import { Job, UnrecoverableError } from 'bullmq';

import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  PayloadTooLargeException,
} from '@nestjs/common';

import { AnalyticsService } from '../../analytics/analytics.service';
import { RefusedJobError, reportJobFailure } from '../../analytics/job-failure';
import { ManualFitImportService } from '../../core/services/manual-fit-import.service';
import {
  QueueService,
  WEBHOOK_FIT_IMPORT_QUEUE,
  WebhookFitImportJobData,
} from '../queue.service';

@Processor(WEBHOOK_FIT_IMPORT_QUEUE, { concurrency: 2 })
export class WebhookFitImportProcessor extends WorkerHost {
  constructor(
    private readonly queue: QueueService,
    private readonly importer: ManualFitImportService,
    private readonly analytics: AnalyticsService,
  ) {
    super();
  }

  async process(job: Job<WebhookFitImportJobData>) {
    const { uploadId, userId } = job.data;
    try {
      const upload = await this.queue.getWebhookFitUpload(uploadId);
      if (!upload) throw new RefusedJobError('FIT upload expired');
      const result = await this.importer.import(
        { userId },
        {
          buffer: upload.file,
          size: upload.file.length,
          originalname: 'activity.fit',
        },
        upload.name,
      );
      if (!result.processingQueued)
        throw new Error('Activity processing unavailable');
    } catch (error) {
      if (error instanceof RefusedJobError) throw error;
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException ||
        error instanceof PayloadTooLargeException
      ) {
        throw new RefusedJobError('FIT upload cannot be imported');
      }
      if (!(
        error instanceof ConflictException &&
        error.message === 'FIT_DUPLICATE_TIME'
      ))
        throw new Error('Queued FIT import failed');
    }
    await this.cleanup(uploadId);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<WebhookFitImportJobData> | undefined, error: Error) {
    reportJobFailure(this.analytics, job, error);
    if (
      job &&
      (error instanceof UnrecoverableError ||
        job.attemptsMade >= (job.opts.attempts ?? 1))
    )
      await this.cleanup(job.data.uploadId);
  }

  private async cleanup(uploadId: string) {
    // An unreachable Redis still expires the staged file when it comes back.
    await this.queue.deleteWebhookFitUpload(uploadId).catch(() => undefined);
  }
}
