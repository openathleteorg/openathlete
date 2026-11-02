import { Job, UnrecoverableError } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PrismaService } from '../../prisma/services/prisma.service';
import { GarminPersonalError } from './garmin-personal-client';
import {
  GarminPersonalService,
  PERSONAL_QUEUE,
  PersonalJob,
} from './garmin-personal-service';

@Processor(PERSONAL_QUEUE, { concurrency: 2 })
export class GarminPersonalProcessor extends WorkerHost {
  constructor(private readonly personal: GarminPersonalService) {
    super();
  }
  async process(job: Job<PersonalJob>) {
    try {
      return await this.personal.run(job.data);
    } catch (error) {
      if (error instanceof GarminPersonalError && error.code === 'key_required')
        throw new UnrecoverableError('key_required');
      throw error;
    }
  }
}

@Injectable()
export class GarminPersonalScheduler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly personal: GarminPersonalService,
  ) {}
  @Cron('17 * * * *')
  async sync() {
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 6 * 86400000)
      .toISOString()
      .slice(0, 10);
    const accounts = await this.prisma.garminPersonalConnection.findMany({
      where: {
        automatic: true,
        activities: true,
        encryptedCredentials: { not: null },
        status: { not: 'key_required' },
      },
      select: { athlete: { select: { userId: true } } },
    });
    for (const account of accounts) {
      try {
        await this.personal.enqueue(account.athlete.userId, {
          startDate,
          endDate,
        });
      } catch {
        /* A disconnected account or temporarily unavailable queue is retried next hour. */
      }
    }
  }
}
