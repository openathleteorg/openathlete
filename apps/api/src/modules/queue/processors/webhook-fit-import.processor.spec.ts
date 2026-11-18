import { Job } from 'bullmq';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

import { AnalyticsService } from '../../analytics/analytics.service';
import { RefusedJobError } from '../../analytics/job-failure';
import { ManualFitImportService } from '../../core/services/manual-fit-import.service';
import { QueueService, WebhookFitImportJobData } from '../queue.service';
import { WebhookFitImportProcessor } from './webhook-fit-import.processor';

jest.mock('../../core/services/manual-fit-import.service', () => ({
  ManualFitImportService: class {},
}));

const upload = { file: Buffer.from('FIT fixture'), name: 'Morning run' };
const job = {
  data: { uploadId: 'staged-upload', userId: 17 },
  opts: { attempts: 3 },
  attemptsMade: 1,
} as Job<WebhookFitImportJobData>;

function setup() {
  const queue = {
    getWebhookFitUpload: jest.fn().mockResolvedValue(upload),
    deleteWebhookFitUpload: jest.fn().mockResolvedValue(undefined),
  };
  const importer = {
    import: jest.fn().mockResolvedValue({ processingQueued: true }),
  };
  const analytics = { captureException: jest.fn() };
  const processor = new WebhookFitImportProcessor(
    queue as unknown as QueueService,
    importer as unknown as ManualFitImportService,
    analytics as unknown as AnalyticsService,
  );
  return { processor, queue, importer, analytics };
}

describe('WebhookFitImportProcessor', () => {
  it('uses the manual FIT path and removes the staged file', async () => {
    const { processor, importer, queue } = setup();
    await processor.process(job);
    expect(importer.import).toHaveBeenCalledWith(
      { userId: 17 },
      {
        buffer: upload.file,
        size: upload.file.length,
        originalname: 'activity.fit',
      },
      'Morning run',
    );
    expect(queue.deleteWebhookFitUpload).toHaveBeenCalledWith('staged-upload');
  });

  it('acknowledges a provider or same-start duplicate without retrying', async () => {
    const { processor, importer, queue } = setup();
    importer.import.mockRejectedValue(
      new ConflictException('FIT_DUPLICATE_TIME'),
    );
    await expect(processor.process(job)).resolves.toBeUndefined();
    expect(queue.deleteWebhookFitUpload).toHaveBeenCalledWith('staged-upload');
  });

  it.each([new BadRequestException(), new ForbiddenException()])(
    'removes a terminal upload without reporting request data',
    async (error) => {
      const { processor, importer, queue, analytics } = setup();
      importer.import.mockRejectedValue(error);
      await expect(processor.process(job)).rejects.toBeInstanceOf(
        RefusedJobError,
      );
      await processor.onFailed(
        job,
        new RefusedJobError('FIT upload cannot be imported'),
      );
      expect(queue.deleteWebhookFitUpload).toHaveBeenCalledWith(
        'staged-upload',
      );
      expect(analytics.captureException).not.toHaveBeenCalled();
    },
  );

  it('keeps the upload for retry if activity processing could not be enqueued', async () => {
    const { processor, importer, queue } = setup();
    importer.import.mockResolvedValueOnce({ processingQueued: false });
    await expect(processor.process(job)).rejects.toThrow(
      'Queued FIT import failed',
    );
    await processor.onFailed(job, new Error('Queued FIT import failed'));
    expect(queue.deleteWebhookFitUpload).not.toHaveBeenCalled();
    await processor.process(job);
    expect(queue.deleteWebhookFitUpload).toHaveBeenCalledWith('staged-upload');
  });
});
