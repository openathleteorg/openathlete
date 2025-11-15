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
        const isWorker =
          process.env.ENABLE_ACTIVITY_IMPORT === 'true' ||
          process.env.ENABLE_ACTIVITY_PROCESSING === 'true';

        const redisOptions = {
          retryStrategy: (times: number) => {
            const maxRetries = isWorker ? 20 : 3;
            if (times > maxRetries) {
              logger.error(
                `Redis connection failed after ${times} attempts, giving up`,
              );
              return null; // Stop retrying
            }
            const baseDelay = isWorker ? 500 : 200;
            const delay = Math.min(times * baseDelay, isWorker ? 5000 : 2000);
            logger.warn(
              `Redis connection attempt ${times} failed, retrying in ${delay}ms`,
            );
            return delay;
          },
          lazyConnect: false,
          connectTimeout: isWorker ? 30000 : 10000,
          // Workers need longer timeout for long-running operations (activity imports can take 30+ minutes)
          // API only needs short timeout for quick queue operations
          commandTimeout: isWorker ? 60000 : 5000, // 60 seconds for workers, 5 seconds for API
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

        try {
          let hostPortDbToParse: string;
          let decodedPasswordToUse: string | undefined;
          let usernameToUse: string | undefined;

          const urlMatchWithUser = redisUrl.match(
            /^redis:\/\/([^:]+):([^@]+)@(.+)$/,
          );
          if (urlMatchWithUser) {
            const [, username, password, hostPortDb] = urlMatchWithUser;
            usernameToUse = username;

            try {
              decodedPasswordToUse = decodeURIComponent(password);
            } catch {
              decodedPasswordToUse = password;
            }

            hostPortDbToParse = hostPortDb;
          } else {
            const urlMatchNoUser = redisUrl.match(
              /^redis:\/\/(?::([^@]+)@)?(.+)$/,
            );
            if (!urlMatchNoUser) {
              throw new Error('Invalid Redis URL format');
            }
            const [, password, hostPortDb] = urlMatchNoUser;

            if (password) {
              try {
                decodedPasswordToUse = decodeURIComponent(password);
              } catch {
                decodedPasswordToUse = password;
              }
            }

            hostPortDbToParse = hostPortDb;
          }

          let host: string;
          let port: number;
          let db: number | undefined;

          const bracketedMatch = hostPortDbToParse.match(
            /^\[([^\]]+)\](?::(\d+))?(?:\/(\d+))?$/,
          );
          if (bracketedMatch) {
            host = bracketedMatch[1];
            port = bracketedMatch[2] ? parseInt(bracketedMatch[2], 10) : 6379;
            db = bracketedMatch[3]
              ? parseInt(bracketedMatch[3], 10)
              : undefined;
          } else {
            const lastColonIndex = hostPortDbToParse.lastIndexOf(':');
            const slashIndex = hostPortDbToParse.indexOf('/', lastColonIndex);

            if (lastColonIndex !== -1) {
              const portStr =
                slashIndex !== -1
                  ? hostPortDbToParse.substring(lastColonIndex + 1, slashIndex)
                  : hostPortDbToParse.substring(lastColonIndex + 1);

              port = parseInt(portStr, 10);
              if (isNaN(port)) {
                port = 6379; // Default port
                host = hostPortDbToParse; // No port found, entire string is host
              } else {
                host = hostPortDbToParse.substring(0, lastColonIndex);
                if (slashIndex !== -1) {
                  const dbStr = hostPortDbToParse.substring(slashIndex + 1);
                  const dbNum = parseInt(dbStr, 10);
                  if (!isNaN(dbNum)) {
                    db = dbNum;
                  }
                }
              }
            } else {
              host = hostPortDbToParse;
              port = 6379;
            }
          }

          const config: {
            host: string;
            port: number;
            username?: string;
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

          if (usernameToUse) {
            config.username = usernameToUse;
          }

          if (decodedPasswordToUse) {
            config.password = decodedPasswordToUse;
          }

          if (db !== undefined) {
            config.db = db;
          }

          // Check if host is IPv6 (contains colons and no dots)
          const isIPv6 =
            config.host.includes(':') && !config.host.includes('.');
          if (isIPv6) {
            logger.warn(
              `Redis host is IPv6 (${config.host}). Ensure IPv6 is enabled and routable in your container environment.`,
            );
          }

          logger.log(
            `Configuring Redis connection to ${config.host}:${config.port} (db: ${config.db ?? 0})${isWorker ? ' [WORKER MODE: extended retries]' : ''}`,
          );
          logger.debug(
            `Redis connection details: host=${config.host}, port=${config.port}, isIPv6=${isIPv6}, hasPassword=${!!config.password}, db=${config.db ?? 0}, lazyConnect=${config.lazyConnect}`,
          );

          return {
            redis: config,
          };
        } catch (parseError) {
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
          stalledInterval: 30000, // Check for stalled jobs every 30 seconds (also acts as polling fallback if pub/sub fails)
          maxStalledCount: 5, // Max number of times a job can be stalled before failing (increased tolerance for very long activities)
          lockDuration: 1800000, // 30 minutes - time a job is locked for processing (increased for very long activities with API calls)
          // IMPORTANT: Only workers should process jobs, not the API
          // If ENABLE_ACTIVITY_IMPORT is false, the processor won't be registered,
          // but we also need to ensure Bull doesn't create a worker on the API side
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
    // Only register ActivityImportProcessor if ENABLE_ACTIVITY_IMPORT is true
    // This allows only specific instances to process import jobs
    ...(process.env.ENABLE_ACTIVITY_IMPORT === 'true'
      ? (() => {
          const logger = new Logger('QueueModule');
          logger.log(
            '✅ ActivityImportProcessor will be registered (ENABLE_ACTIVITY_IMPORT=true)',
          );
          return [ActivityImportProcessor];
        })()
      : (() => {
          const logger = new Logger('QueueModule');
          logger.debug(
            'ActivityImportProcessor NOT registered (ENABLE_ACTIVITY_IMPORT is not true)',
          );
          return [];
        })()),
    // Only register ActivityProcessingProcessor if ENABLE_ACTIVITY_PROCESSING is true
    // This allows only specific instances to process activity processing jobs
    ...(process.env.ENABLE_ACTIVITY_PROCESSING === 'true'
      ? (() => {
          const logger = new Logger('QueueModule');
          logger.log(
            '✅ ActivityProcessingProcessor will be registered (ENABLE_ACTIVITY_PROCESSING=true)',
          );
          return [ActivityProcessingProcessor];
        })()
      : (() => {
          const logger = new Logger('QueueModule');
          logger.debug(
            'ActivityProcessingProcessor NOT registered (ENABLE_ACTIVITY_PROCESSING is not true)',
          );
          return [];
        })()),
  ],
  exports: [QueueService],
})
export class QueueModule {}
