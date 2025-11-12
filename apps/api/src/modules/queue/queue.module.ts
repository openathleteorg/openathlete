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
        // Handle IPv6 addresses and URL-encoded passwords manually
        // Format: redis://[:password]@[host]:port[/db] or redis://:password@ipv6:port/db
        try {
          // Manual parsing to handle IPv6 without brackets and URL-encoded passwords
          // Pattern: redis://(:password@)?host:port(/db)?
          // For IPv6 without brackets, we need to find the last : before / or end
          const urlMatch = redisUrl.match(/^redis:\/\/(?::([^@]+)@)?(.+)$/);
          if (!urlMatch) {
            throw new Error('Invalid Redis URL format');
          }

          const [, password, hostPortDb] = urlMatch;

          // Extract password (decode if URL-encoded)
          let decodedPassword: string | undefined;
          if (password) {
            try {
              decodedPassword = decodeURIComponent(password);
            } catch {
              decodedPassword = password;
            }
          }

          // Parse host:port/db
          // Handle IPv6 in brackets: [host]:port/db
          // Handle IPv6 without brackets: host:port/db (find last : before / or end)
          // Handle IPv4: host:port/db
          let host: string;
          let port: number;
          let db: number | undefined;

          // Check if IPv6 is in brackets
          const bracketedMatch = hostPortDb.match(
            /^\[([^\]]+)\](?::(\d+))?(?:\/(\d+))?$/,
          );
          if (bracketedMatch) {
            host = bracketedMatch[1];
            port = bracketedMatch[2] ? parseInt(bracketedMatch[2], 10) : 6379;
            db = bracketedMatch[3]
              ? parseInt(bracketedMatch[3], 10)
              : undefined;
          } else {
            // No brackets - need to find last : before / or end
            // Format: host:port/db or host:port
            const lastColonIndex = hostPortDb.lastIndexOf(':');
            const slashIndex = hostPortDb.indexOf('/', lastColonIndex);

            if (lastColonIndex !== -1) {
              // Extract port (between last : and / or end)
              const portStr =
                slashIndex !== -1
                  ? hostPortDb.substring(lastColonIndex + 1, slashIndex)
                  : hostPortDb.substring(lastColonIndex + 1);

              port = parseInt(portStr, 10);
              if (isNaN(port)) {
                port = 6379; // Default port
                host = hostPortDb; // No port found, entire string is host
              } else {
                host = hostPortDb.substring(0, lastColonIndex);
                // Extract db if present
                if (slashIndex !== -1) {
                  const dbStr = hostPortDb.substring(slashIndex + 1);
                  const dbNum = parseInt(dbStr, 10);
                  if (!isNaN(dbNum)) {
                    db = dbNum;
                  }
                }
              }
            } else {
              // No colon found, entire string is host
              host = hostPortDb;
              port = 6379;
            }
          }

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
            host,
            port,
            ...redisOptions,
          };

          if (decodedPassword) {
            config.password = decodedPassword;
          }

          if (db !== undefined) {
            config.db = db;
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
            `Could not parse REDIS_URL, using as-is. Some connection options may not apply.`,
          );
          logger.debug(
            `REDIS_URL value (first 50 chars): ${redisUrl.substring(0, 50)}...`,
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
