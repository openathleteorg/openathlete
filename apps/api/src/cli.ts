import { Queue } from 'bullmq';
import Redis from 'ioredis';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { CliDeps, runCommand } from './cli/commands';
import { validateEnv } from './common/config/validate-env';
import { AccountDeletionService } from './modules/auth/services/account-deletion.service';
import { TokenService } from './modules/auth/services/token.service';
import { PrismaService } from './modules/prisma/services/prisma.service';
import { StripeService } from './modules/subscription/services/stripe.service';

/** Only what the commands need: no HTTP server, queues or listeners. */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      validationOptions: { allowUnknown: false, abortEarly: false },
    }),
  ],
  providers: [
    PrismaService,
    TokenService,
    StripeService,
    AccountDeletionService,
  ],
})
class CliModule {}

async function main() {
  const app = await NestFactory.createApplicationContext(CliModule, {
    // Startup notices ("billing is disabled"...) would mix with the output
    logger: ['error'],
  });
  const config = app.get<ConfigService<ApiEnvSchemaType, true>>(ConfigService);
  const deps: CliDeps = {
    prisma: app.get(PrismaService),
    tokens: app.get(TokenService),
    accountDeletion: app.get(AccountDeletionService),
    appUrl: config.get('APP_URL'),
    queueFullImports: (ids) => queueFullImports(config.get('REDIS_URL'), ids),
    readInput,
  };
  try {
    process.exitCode = await runCommand(process.argv.slice(2), deps, (line) =>
      process.stdout.write(`${line}\n`),
    );
  } finally {
    await app.close();
  }
}

/** Same jobs as QueueService.addFullImportJob, run by the worker */
async function queueFullImports(
  redisUrl: string | undefined,
  providerAccountIds: number[],
) {
  const connection = redisUrl
    ? new Redis(redisUrl, { maxRetriesPerRequest: null })
    : new Redis({ maxRetriesPerRequest: null });
  const queue = new Queue('provider-full-import', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60_000,
      },
      removeOnComplete: {
        age: 7 * 24 * 3600,
      },
      removeOnFail: {
        age: 7 * 24 * 3600,
      },
    },
  });
  try {
    for (const providerAccountId of providerAccountIds) {
      const jobId = `full-import-${providerAccountId}`;
      const existing = await queue.getJob(jobId);
      if (existing) {
        const state = await existing.getState();
        if (state !== 'completed' && state !== 'failed') continue;
        await existing.remove();
      }
      // Recovers lost notifications: the older history was already requested
      await queue.add(
        'full-import',
        { providerAccountId, recoverOnly: true },
        { jobId },
      );
    }
  } finally {
    await queue.close();
    await connection.quit();
  }
}

async function readInput(): Promise<string> {
  // Nothing piped in: an interactive terminal would wait forever
  if (process.stdin.isTTY) return '';
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

void main();
