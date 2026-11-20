import { Job } from 'bullmq';

import { NotFoundException } from '@nestjs/common';

import { Prisma } from '@openathlete/database';

import { TrainingPlanLibraryService } from '../../core/services/training-plan-library.service';
import { TrainingPlanApplyJobData } from '../queue.service';
import { TrainingPlanApplyProcessor } from './training-plan-apply.processor';

// The FIT SDK, reached through the library service, is ESM, which Jest
// cannot load
jest.mock('@garmin/fitsdk', () => ({}));

const result = (athleteId: number) => ({
  athleteId,
  trainingPlanId: athleteId * 10,
  sessions: 3,
  replaced: 0,
});

const jobOf = (data: Partial<TrainingPlanApplyJobData>) => {
  const job = {
    id: '42',
    data: {
      userId: 1,
      plan: {} as TrainingPlanApplyJobData['plan'],
      targets: [
        { athleteId: 1, date: '2030-03-04' },
        { athleteId: 2, date: '2030-03-04' },
        { athleteId: 3, date: '2030-03-04' },
      ],
      options: {} as TrainingPlanApplyJobData['options'],
      results: [],
      ...data,
    },
    updateData: jest.fn(async (next: TrainingPlanApplyJobData) => {
      job.data = next;
    }),
  };
  return job;
};

describe('TrainingPlanApplyProcessor', () => {
  const applyToAthlete = jest.fn();
  const processor = new TrainingPlanApplyProcessor({
    applyToAthlete,
  } as unknown as TrainingPlanLibraryService);

  beforeEach(() => applyToAthlete.mockReset());

  it('applies to the athletes not done yet, under the job id', async () => {
    applyToAthlete.mockImplementation(async (_plan, target) =>
      result(target.athleteId),
    );
    const job = jobOf({ results: [result(1)] });

    const output = await processor.process(
      job as unknown as Job<TrainingPlanApplyJobData>,
    );

    expect(applyToAthlete.mock.calls.map((call) => call[1].athleteId)).toEqual([
      2, 3,
    ]);
    expect(applyToAthlete.mock.calls[0][3]).toBe('42');
    expect(output).toEqual({
      results: [result(1), result(2), result(3)],
      failures: [],
    });
  });

  it('records a lasting refusal for that athlete and goes on', async () => {
    applyToAthlete.mockImplementation(async (_plan, target) => {
      if (target.athleteId === 2) throw new NotFoundException('Race not found');
      return result(target.athleteId);
    });
    const job = jobOf({});

    const output = await processor.process(
      job as unknown as Job<TrainingPlanApplyJobData>,
    );

    expect(output.failures).toEqual([
      { athleteId: 2, error: 'Race not found' },
    ]);
    expect(output.results.map((entry) => entry.athleteId)).toEqual([1, 3]);
    expect(job.data.failures).toEqual(output.failures);
  });

  it('records an athlete deleted since queueing and goes on', async () => {
    applyToAthlete.mockImplementation(async (_plan, target) => {
      if (target.athleteId === 2) {
        throw new Prisma.PrismaClientKnownRequestError('No record found', {
          code: 'P2025',
          clientVersion: 'test',
        });
      }
      return result(target.athleteId);
    });
    const job = jobOf({});

    const output = await processor.process(
      job as unknown as Job<TrainingPlanApplyJobData>,
    );

    expect(output.failures).toEqual([
      { athleteId: 2, error: 'No record found' },
    ]);
    expect(output.results.map((entry) => entry.athleteId)).toEqual([1, 3]);
  });

  it('lets other errors fail the job, keeping who is done for the retry', async () => {
    applyToAthlete
      .mockResolvedValueOnce(result(1))
      .mockRejectedValueOnce(new Error('connection lost'));
    const job = jobOf({});

    await expect(
      processor.process(job as unknown as Job<TrainingPlanApplyJobData>),
    ).rejects.toThrow('connection lost');
    expect(job.data.results).toEqual([result(1)]);
  });
});
