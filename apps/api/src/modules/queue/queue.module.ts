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

        // Common Redis connection options for better error handling
        // Note: Bull doesn't allow enableReadyCheck or maxRetriesPerRequest
        // See: https://github.com/OptimalBits/bull/issues/1873
        const redisOptions = {
          retryStrategy: (times: number) => {
            if (times > 3) {
              logger.error(
                `Redis connection failed after ${times} attempts, giving up`,
              );
              return null; // Stop retrying
            }
            const delay = Math.min(times * 200, 2000);
            logger.warn(
              `Redis connection attempt ${times} failed, retrying in ${delay}ms`,
            );
            return delay;
          },
          lazyConnect: false,
          connectTimeout: 10000, // 10 seconds timeout
          commandTimeout: 5000, // 5 seconds command timeout
        };

        if (!redisUrl) {
          logger.warn(
            'REDIS_URL not set, using default Redis connection (localhost:6379)',
          );
          return {
            redis: {
              host: 'localhost',
              port: 6379,
              ...redisOptions,
            },
          };
        }

        // Try to parse the URL to extract connection details
        // If parsing fails, use the URL string directly (ioredis supports both)
        try {
          const url = new URL(redisUrl);
          const config: {
            host: string;
            port: number;
            password?: string;
            db?: number;
            retryStrategy: (times: number) => number | null;
            lazyConnect: boolean;
            connectTimeout: number;
            commandTimeout: number;
          } = {
            host: url.hostname,
            port: parseInt(url.port || '6379', 10),
            ...redisOptions,
          };

          // Extract password if present (format: redis://:password@host:port/db)
          if (url.password) {
            config.password = decodeURIComponent(url.password);
          }

          // Extract database number if present (format: redis://host:port/0)
          if (url.pathname && url.pathname.length > 1) {
            const db = parseInt(url.pathname.slice(1), 10);
            if (!isNaN(db)) {
              config.db = db;
            }
          }

          logger.log(
            `Configuring Redis connection to ${config.host}:${config.port} (db: ${config.db ?? 0})`,
          );

          return {
            redis: config,
          };
        } catch (parseError) {
          // If URL parsing fails, use the string directly
          // ioredis will handle the URL string, but we can't add custom options
          logger.warn(
            `Could not parse REDIS_URL (${redisUrl}), using as-is. Some connection options may not apply.`,
          );
          logger.warn(
            'Consider using format: redis://[:password]@host:port[/db] for better error handling',
          );

          return {
            redis: redisUrl,
          };
        }
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
