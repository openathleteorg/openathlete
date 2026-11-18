import { Queue } from 'bullmq';

import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import {
  WeeklyEmailJob,
  WeeklyEmailService,
} from 'src/modules/notification/weekly/weekly-email.service';

/**
 * Every quarter of an hour, queues the Monday emails due by now: 7:00 in
 * each time zone, half-hour ones included. The job id is the person and
 * the week, so a run that finds them again queues nothing more.
 */
@Injectable()
export class WeeklyEmailScheduler {
  private readonly logger = new Logger(WeeklyEmailScheduler.name);

  constructor(
    private readonly weeklyEmail: WeeklyEmailService,
    @InjectQueue('weekly-email')
    private readonly queue: Queue<WeeklyEmailJob>,
  ) {}

  @Cron('*/15 * * * *')
  async queueWeeklyEmails(now = new Date()): Promise<number> {
    const due = await this.weeklyEmail.dueRecipients(now);
    if (due.length === 0) return 0;
    await this.queue.addBulk(
      due.map((job) => ({
        name: 'weekly-email',
        data: job,
        opts: { jobId: `weekly-${job.userId}-${job.monday}` },
      })),
    );
    this.logger.log(`Queued ${due.length} weekly emails`);
    return due.length;
  }
}
