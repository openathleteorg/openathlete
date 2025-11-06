import { BullModule } from '@nestjs/bull';
import { Logger, Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { CoreModule } from '../core';
import { PrismaService } from '../prisma/services/prisma.service';
import { ProvidersSyncModule } from '../providers-sync/providers-sync.module';
import { ActivityImportProcessor } from './processors/activity-import.processor';
import { ActivityProcessingProcessor } from './processors/activity-processing.processor';
import { QueueService } from './queue.service';

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule,
    CoreModule,
    forwardRef(() => ProvidersSyncModule),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL;
        const logger = new Logger('QueueModule');

        if (!redisUrl) {
          logger.warn(
            'REDIS_URL not set, using default Redis connection (localhost:6379)',
          );
          return {
            redis: {
              host: 'localhost',
              port: 6379,
            },
          };
        }

        return {
          redis: redisUrl,
        };
      },
    }),
    BullModule.registerQueue(
      {
        name: 'activity-import',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: {
            age: 24 * 3600, // Keep completed jobs for 24 hours
            count: 1000, // Keep max 1000 completed jobs
          },
          removeOnFail: {
            age: 7 * 24 * 3600, // Keep failed jobs for 7 days
          },
        },
        settings: {
          stalledInterval: 30000, // Check for stalled jobs every 30 seconds
          maxStalledCount: 1, // Max number of times a job can be stalled before failing
          lockDuration: 300000, // 5 minutes - time a job is locked for processing
        },
      },
      {
        name: 'activity-processing',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: {
            age: 24 * 3600,
            count: 1000,
          },
          removeOnFail: {
            age: 7 * 24 * 3600,
          },
        },
        settings: {
          stalledInterval: 30000,
          maxStalledCount: 1,
          lockDuration: 300000, // 5 minutes
        },
      },
    ),
  ],
  providers: [
    PrismaService,
    QueueService,
    ActivityImportProcessor,
    ActivityProcessingProcessor,
  ],
  exports: [QueueService],
})
export class QueueModule {}
