import { BullModule } from '@nestjs/bullmq';
import { Logger, Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { CalendarModule } from '../calendar/calendar.module';
import { CoreModule } from '../core';
import { PrismaService } from '../prisma/services/prisma.service';
import { ProvidersSyncModule } from '../providers-sync/providers-sync.module';
import { ActivityImportProcessor } from './processors/activity-import.processor';
import { ActivityProcessingProcessor } from './processors/activity-processing.processor';
import { TrainingLoadEstimationProcessor } from './processors/training-load-estimation.processor';
import { QueueService } from './queue.service';
import { TrainingLoadEstimationService } from './services/training-load-estimation.service';

function parseRedisUrl(redisUrl: string): {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db?: number;
} {
  let hostPortDbToParse: string;
  let decodedPasswordToUse: string | undefined;
  let usernameToUse: string | undefined;

  const urlMatchWithUser = redisUrl.match(/^redis:\/\/([^:]+):([^@]+)@(.+)$/);
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
    const urlMatchNoUser = redisUrl.match(/^redis:\/\/(?::([^@]+)@)?(.+)$/);
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
    db = bracketedMatch[3] ? parseInt(bracketedMatch[3], 10) : undefined;
    return {
      host,
      port,
      db,
      username: usernameToUse,
      password: decodedPasswordToUse,
    };
  }

  const lastColonIndex = hostPortDbToParse.lastIndexOf(':');
  const slashIndex = hostPortDbToParse.indexOf('/', lastColonIndex);

  if (lastColonIndex === -1) {
    return {
      host: hostPortDbToParse,
      port: 6379,
      username: usernameToUse,
      password: decodedPasswordToUse,
    };
  }

  const portStr =
    slashIndex !== -1
      ? hostPortDbToParse.substring(lastColonIndex + 1, slashIndex)
      : hostPortDbToParse.substring(lastColonIndex + 1);

  port = parseInt(portStr, 10);
  if (isNaN(port)) {
    return {
      host: hostPortDbToParse,
      port: 6379,
      username: usernameToUse,
      password: decodedPasswordToUse,
    };
  }

  host = hostPortDbToParse.substring(0, lastColonIndex);
  if (slashIndex !== -1) {
    const dbStr = hostPortDbToParse.substring(slashIndex + 1);
    const dbNum = parseInt(dbStr, 10);
    if (!isNaN(dbNum)) {
      db = dbNum;
    }
  }

  return {
    host,
    port,
    db,
    username: usernameToUse,
    password: decodedPasswordToUse,
  };
}

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule,
    forwardRef(() => CoreModule),
    forwardRef(() => ProvidersSyncModule),
    forwardRef(() => CalendarModule),
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
            const maxRetries = 3;
            if (times > maxRetries) {
              logger.error(
                `Redis connection failed after ${times} attempts, giving up`,
              );
              return null;
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
          commandTimeout: isWorker ? 60000 : 15000,
          enableReadyCheck: true,
          maxRetriesPerRequest: null,
          maxListeners: 20,
        };

        if (!redisUrl) {
          logger.warn(
            'REDIS_URL not set, using default Redis connection (localhost:6379)',
          );
          return {
            connection: {
              host: 'localhost',
              port: 6379,
              ...redisOptions,
            },
          };
        }

        try {
          const parsed = parseRedisUrl(redisUrl);
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
            maxRetriesPerRequest: null;
          } = {
            host: parsed.host,
            port: parsed.port,
            ...redisOptions,
          };

          if (parsed.username) {
            config.username = parsed.username;
          }

          if (parsed.password) {
            config.password = parsed.password;
          }

          if (parsed.db !== undefined) {
            config.db = parsed.db;
          }

          return {
            connection: config,
          };
        } catch {
          logger.warn(
            `Could not parse REDIS_URL, using as-is. Some connection options may not apply.`,
          );
          return {
            connection: {
              host: 'localhost',
              port: 6379,
              ...redisOptions,
            },
          };
        }
      },
    }),
    BullModule.registerQueue({
      name: 'activity-import',
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
    }),
    BullModule.registerQueue({
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
    }),
    BullModule.registerQueue({
      name: 'training-load-estimation',
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
    }),
  ],
  providers: [
    PrismaService,
    QueueService,
    TrainingLoadEstimationService,
    ...(process.env.ENABLE_ACTIVITY_IMPORT === 'true'
      ? [ActivityImportProcessor]
      : []),
    ...(process.env.ENABLE_ACTIVITY_PROCESSING === 'true'
      ? [ActivityProcessingProcessor]
      : []),
    ...(process.env.ENABLE_TRAINING_LOAD_ESTIMATION === 'true'
      ? [TrainingLoadEstimationProcessor]
      : []),
  ],
  exports: [QueueService, TrainingLoadEstimationService],
})
export class QueueModule {}
