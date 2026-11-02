import { Job, UnrecoverableError } from 'bullmq';

import { AnalyticsService } from './analytics.service';
import { reportJobFailure } from './job-failure';

const job = (attemptsMade: number) =>
  ({
    attemptsMade,
    name: 'import',
    queueName: 'activity-import',
    opts: { attempts: 3 },
  }) as Job;

describe('reportJobFailure', () => {
  const captureException = jest.fn();
  const analytics = { captureException } as unknown as AnalyticsService;

  beforeEach(() => jest.clearAllMocks());

  it('stays quiet while retries remain', () => {
    reportJobFailure(analytics, job(1), new Error('boom'));
    expect(captureException).not.toHaveBeenCalled();
  });

  it('reports the last attempt', () => {
    reportJobFailure(analytics, job(3), new Error('boom'));
    expect(captureException).toHaveBeenCalledTimes(1);
  });

  it('reports an error no retry can fix at once', () => {
    reportJobFailure(analytics, job(1), new UnrecoverableError('boom'));
    expect(captureException).toHaveBeenCalledTimes(1);
  });

  it('reports a job BullMQ lost', () => {
    reportJobFailure(analytics, undefined, new Error('stalled'));
    expect(captureException).toHaveBeenCalledTimes(1);
  });
});
