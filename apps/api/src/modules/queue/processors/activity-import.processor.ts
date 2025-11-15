import { Job, Queue } from 'bull';

import {
  InjectQueue,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import {
  Inject,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  forwardRef,
} from '@nestjs/common';

import { connector_provider, sport_type } from '@openathlete/database';
import { CompressedActivityStream } from '@openathlete/shared';

import { uncompressActivityStream } from '../../core/helpers/activity-stream';
import { computeRecords } from '../../core/helpers/record';
import { roundDistance } from '../../core/helpers/round-activity-values';
import { PrismaService } from '../../prisma/services/prisma.service';
import {
  CorosProviderService,
  GarminProviderService,
  StravaProviderService,
  SuuntoProviderService,
} from '../../providers-sync/providers';
import { ActivityImportJobData, QueueService } from '../queue.service';

@Processor('activity-import')
export class ActivityImportProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ActivityImportProcessor.name);
  private stravaProviderService?: StravaProviderService;
  private garminProviderService?: GarminProviderService;
  private suuntoProviderService?: SuuntoProviderService;
  private corosProviderService?: CorosProviderService;
  private pollingInterval?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => StravaProviderService))
    stravaProviderService: StravaProviderService,
    @Inject(forwardRef(() => GarminProviderService))
    garminProviderService: GarminProviderService,
    @Inject(forwardRef(() => SuuntoProviderService))
    suuntoProviderService: SuuntoProviderService,
    @Inject(forwardRef(() => CorosProviderService))
    corosProviderService: CorosProviderService,
    private readonly queueService: QueueService,
    @InjectQueue('activity-import')
    private readonly activityImportQueue: Queue<ActivityImportJobData>,
  ) {
    // Store providers for later use (they might not be available immediately due to circular deps)
    this.stravaProviderService = stravaProviderService;
    this.garminProviderService = garminProviderService;
    this.suuntoProviderService = suuntoProviderService;
    this.corosProviderService = corosProviderService;
    this.logger.log('ActivityImportProcessor constructor called');
    this.logger.log(
      `ENABLE_ACTIVITY_IMPORT=${process.env.ENABLE_ACTIVITY_IMPORT}`,
    );
  }

  async onModuleInit() {
    if (process.env.ENABLE_ACTIVITY_IMPORT !== 'true') {
      this.logger.warn(
        'ActivityImportProcessor disabled (ENABLE_ACTIVITY_IMPORT not set to true)',
      );
      return;
    }

    this.logger.log('Initializing ActivityImportProcessor...');

    // Force Redis connection by accessing the queue
    // Bull listens continuously once the processor is registered and Redis is connected
    // We need to ensure Redis is connected so Bull can start listening
    try {
      // Access the queue's Redis client to force connection
      const client = (this.activityImportQueue as any).client;
      if (client) {
        // Check if already connected
        if (client.status === 'ready') {
          this.logger.log('Redis already connected for activity-import queue');
        } else {
          // Force connection attempt (will use retryStrategy if it fails)
          this.logger.log('Attempting to connect to Redis...');
          await client.connect();
          this.logger.log(
            'Redis connection established for activity-import queue',
          );
        }
      } else {
        this.logger.warn(
          'Redis client not available yet, Bull will connect automatically',
        );
      }

      // Verify queue is ready by checking its state
      // This also ensures Bull has initialized the queue properly
      try {
        const waiting = await this.activityImportQueue.getWaitingCount();
        const active = await this.activityImportQueue.getActiveCount();
        const completed = await this.activityImportQueue.getCompletedCount();
        const failed = await this.activityImportQueue.getFailedCount();

        this.logger.log(
          `Queue status - Waiting: ${waiting}, Active: ${active}, Completed: ${completed}, Failed: ${failed}`,
        );

        // Check if there are waiting jobs that should be processed
        if (waiting > 0) {
          this.logger.warn(
            `⚠️ Found ${waiting} waiting job(s) in queue. If jobs are not being processed, check: 1) Processor is registered, 2) Redis connection is stable, 3) Worker has ENABLE_ACTIVITY_IMPORT=true`,
          );
        }

        // Check for stuck active jobs (jobs that are active but not being processed)
        if (active > 0) {
          this.logger.warn(
            `⚠️ Found ${active} active job(s) - these may be stuck from a previous worker instance. They will be automatically moved to failed after lockDuration expires.`,
          );

          // Try to get active jobs to see their state
          try {
            const activeJobs = await this.activityImportQueue.getActive();
            for (const job of activeJobs) {
              const jobAge = Date.now() - (job.processedOn || 0);
              this.logger.warn(
                `Active job ${job.id} (${job.data?.activity?.externalId || 'unknown'}) - age: ${jobAge}ms, processedOn: ${job.processedOn ? new Date(job.processedOn).toISOString() : 'never'}`,
              );
            }
          } catch (error) {
            this.logger.debug(
              `Could not get active jobs details: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }

        // Verify the processor is actually registered by checking if Bull has the process handler
        // This is a sanity check to ensure the @Process decorator was processed
        const queueName = this.activityImportQueue.name;

        // Check if Bull has registered the processor handlers
        try {
          const queue = this.activityImportQueue as any;
          // Bull stores processors in queue.processors array
          const processors = queue.processors || [];
          const handlers = queue.handlers || {};

          // Check all possible locations where Bull might store handlers
          const allKeys = Object.keys(queue);
          const handlerKeys = allKeys.filter(
            (key) =>
              key.toLowerCase().includes('handler') ||
              key.toLowerCase().includes('process'),
          );

          this.logger.log(
            `Queue '${queueName}' initialized. Found ${processors.length} processor(s), ${Object.keys(handlers).length} handler(s)`,
          );
          this.logger.debug(
            `Queue object keys related to processing: ${handlerKeys.join(', ') || 'none'}`,
          );

          if (processors.length === 0 && Object.keys(handlers).length === 0) {
            this.logger.error(
              '❌ CRITICAL: No processors or handlers found on queue! The @Process decorator may not have been registered correctly.',
            );
            this.logger.error(
              'This means Bull will NOT process any jobs. The @Process decorator must be properly registered by NestJS/Bull.',
            );
          } else {
            this.logger.log(
              `✅ Processor registered with @Process({ name: 'import', concurrency: 3 })`,
            );
            this.logger.log(
              `Handlers: ${Object.keys(handlers).join(', ') || 'none'}`,
            );

            // CRITICAL FIX: Bull v4 requires queue.process() to be called to create the worker
            // NestJS/Bull should do this automatically, but it seems it's not happening
            // We need to manually ensure the worker is created
            try {
              // Check if process() was already called by checking if worker exists
              const existingWorker = queue.worker || queue.workers?.[0];

              if (!existingWorker) {
                this.logger.error(
                  '❌ CRITICAL: Handler registered but no worker found!',
                );
                this.logger.error(
                  'NestJS/Bull should have called queue.process() automatically, but it did not.',
                );
                this.logger.error(
                  'This is likely a bug in @nestjs/bull or a configuration issue.',
                );

                // Check Bull's internal state to understand why worker wasn't created
                try {
                  const isInitializing = queue._initializingProcess;
                  const processing = queue.processing;
                  const processJob = queue.processJob;

                  this.logger.warn(
                    `Bull internal state: _initializingProcess=${isInitializing}, processing=${processing}, processJob=${!!processJob}`,
                  );

                  // Check if there's a processing promise that might be stuck
                  if (isInitializing) {
                    this.logger.warn(
                      '⚠️ Bull appears to be initializing worker (but taking too long or stuck)',
                    );
                  }

                  // The handler is registered but worker not created
                  // This suggests NestJS/Bull registered the handler but didn't call queue.process()
                  // OR queue.process() was called but failed silently

                  // Check if we can access the actual process method
                  if (typeof queue.process === 'function') {
                    this.logger.warn(
                      'queue.process() method exists - but worker was not created',
                    );
                    this.logger.warn(
                      'This suggests queue.process() was never called, or was called but failed silently',
                    );
                  }

                  // Check if there's an error in the processing chain
                  if (processing && typeof processing.catch === 'function') {
                    processing.catch((error: any) => {
                      this.logger.error(
                        `Processing promise rejected: ${error instanceof Error ? error.message : String(error)}`,
                        error instanceof Error ? error.stack : undefined,
                      );
                    });
                  }
                } catch (stateError) {
                  this.logger.warn(
                    `Could not check Bull internal state: ${stateError instanceof Error ? stateError.message : String(stateError)}`,
                  );
                }

                this.logger.error(
                  '❌ SOLUTION NEEDED: NestJS/Bull registered the handler but did not create the worker.',
                );
                this.logger.error(
                  'This is likely a bug in @nestjs/bull v11.0.4 or a configuration issue.',
                );
                this.logger.error(
                  'Possible solutions: 1) Update @nestjs/bull, 2) Check if there are circular dependencies, 3) Verify module loading order',
                );
              } else {
                this.logger.log(
                  '✅ Worker exists - Bull should process jobs automatically',
                );
              }
            } catch (workerCheckError) {
              this.logger.warn(
                `Could not check worker creation: ${workerCheckError instanceof Error ? workerCheckError.message : String(workerCheckError)}`,
              );
            }
          }
        } catch (error) {
          this.logger.error(
            `Could not check processor registration: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error.stack : undefined,
          );
        }

        this.logger.log(
          'ActivityImportProcessor is now listening for jobs (Bull listens continuously)',
        );
      } catch (queueError) {
        this.logger.error(
          `❌ Could not check queue status: ${queueError instanceof Error ? queueError.message : String(queueError)}. Queue may not be properly initialized.`,
          queueError instanceof Error ? queueError.stack : undefined,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Failed to force Redis connection: ${error instanceof Error ? error.message : String(error)}. Will retry automatically.`,
      );
      // Don't throw - connection will be retried automatically via retryStrategy
      // Bull will start listening once Redis connection is established
    }

    this.logger.log(
      'ActivityImportProcessor initialized and ready to process jobs',
    );
    this.logger.log(
      `StravaProviderService available: ${!!this.stravaProviderService}`,
    );

    // IMPORTANT: Wait a bit for Bull to fully initialize the worker
    // Sometimes Bull creates the worker asynchronously after module init
    setTimeout(async () => {
      try {
        const queue = this.activityImportQueue as any;
        const worker = queue.worker || queue.workers?.[0];

        if (!worker) {
          this.logger.error(
            '❌ CRITICAL: Still no worker found after 2 seconds! Bull has not created a worker.',
          );
          this.logger.error(
            'This means the @Process decorator was not properly processed by NestJS/Bull.',
          );
          this.logger.error(
            'Possible causes: 1) Module not properly loaded, 2) Bull version incompatibility, 3) Decorator not processed',
          );
        } else {
          this.logger.log(
            `✅ Worker found after delay - Bull worker is active`,
          );
        }
      } catch (error) {
        this.logger.warn(
          `Could not check worker after delay: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }, 2000); // Check after 2 seconds

    // Start periodic polling as fallback if Redis pub/sub doesn't work
    // This ensures jobs are detected even if pub/sub fails
    // Bull's stalledInterval also acts as a polling mechanism, but we add an extra check
    this.startPollingFallback();
  }

  async onModuleDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
      this.logger.log('Stopped polling fallback for activity-import queue');
    }
  }

  /**
   * Start periodic polling as fallback mechanism
   * This ensures jobs are detected even if Redis pub/sub doesn't work properly
   * Note: Bull should automatically process jobs, but this helps diagnose issues
   */
  private startPollingFallback() {
    // Poll every 5 seconds to check for waiting jobs and log status
    // This helps diagnose if jobs are stuck in waiting state
    this.pollingInterval = setInterval(async () => {
      try {
        const waiting = await this.activityImportQueue.getWaitingCount();
        const active = await this.activityImportQueue.getActiveCount();
        const completed = await this.activityImportQueue.getCompletedCount();
        const failed = await this.activityImportQueue.getFailedCount();

        // Log status every time to see if jobs appear
        if (waiting > 0 || active > 0) {
          this.logger.warn(
            `⚠️ Polling check: ${waiting} waiting, ${active} active, ${completed} completed, ${failed} failed - Bull should process them automatically`,
          );

          // Try to manually trigger processing by accessing the queue
          // This might help if Bull's internal mechanism isn't working
          // Note: Bull should handle this automatically, but this is a diagnostic aid
          try {
            // Access the queue's worker to ensure it's active
            const queue = this.activityImportQueue as any;
            const worker = queue.worker;

            // Bull v4 stores worker differently - check multiple possible locations
            if (!worker) {
              // Try alternative locations where Bull might store the worker
              const workers = queue.workers || [];
              if (workers.length > 0) {
                this.logger.log(
                  `Found ${workers.length} worker(s) in workers array`,
                );
                for (let i = 0; i < workers.length; i++) {
                  const w = workers[i];
                  const isRunning = w?.isRunning?.() ?? 'unknown';
                  this.logger.log(`Worker ${i} status: isRunning=${isRunning}`);
                }
              } else {
                this.logger.error(
                  '❌ CRITICAL: No worker found on queue! Bull may not have created a worker even though processor is registered. This is why jobs are not being processed.',
                );
                this.logger.error(
                  'This usually means the @Process decorator was not properly registered by NestJS/Bull.',
                );
              }
            } else {
              const isRunning = worker.isRunning?.() ?? 'unknown';
              this.logger.log(
                `Worker status: isRunning=${isRunning}, waiting=${waiting}, active=${active}`,
              );

              if (worker.isRunning && !worker.isRunning()) {
                this.logger.error(
                  '❌ Bull worker is not running! This is the problem - jobs cannot be processed.',
                );
              }
            }
          } catch (workerError) {
            // Worker check failed, but that's okay - Bull might handle it differently
            this.logger.warn(
              `Could not check worker status: ${workerError instanceof Error ? workerError.message : String(workerError)}`,
              workerError instanceof Error ? workerError.stack : undefined,
            );
          }
        } else {
          // Log debug info periodically even when no jobs
          this.logger.debug(
            `Polling check: No jobs (waiting: ${waiting}, active: ${active})`,
          );
        }

        // Check Redis connection status
        try {
          const client = (this.activityImportQueue as any).client;
          if (client) {
            const status = client.status;
            if (status !== 'ready') {
              this.logger.warn(
                `⚠️ Redis connection status: ${status} (should be 'ready')`,
              );
            }
          }
        } catch (redisError) {
          this.logger.warn(
            `Could not check Redis status: ${redisError instanceof Error ? redisError.message : String(redisError)}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Polling fallback error: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }, 5000); // Check every 5 seconds for faster detection

    this.logger.log(
      'Started polling fallback (checks every 5s) - diagnostic aid to ensure job detection',
    );
  }

  @OnQueueActive()
  onActive(job: Job<ActivityImportJobData>) {
    this.logger.log(
      `✅ [ON_ACTIVE] Job ${job.id} (${job.data.activity.externalId}) is now active - processor is working!`,
    );
  }

  @OnQueueCompleted()
  onCompleted(job: Job<ActivityImportJobData>) {
    this.logger.log(
      `[ON_COMPLETED] Job ${job.id} (${job.data.activity.externalId}) has been completed`,
    );
  }

  @OnQueueFailed()
  onFailed(job: Job<ActivityImportJobData> | undefined, error: Error) {
    this.logger.error(
      `Job ${job?.id || 'unknown'} failed: ${error.message}`,
      error.stack,
    );
  }

  /**
   * Helper to keep job alive during long operations by updating progress periodically
   * This renews the lock and prevents the job from being marked as stalled
   * @returns Cleanup function to stop the heartbeat
   */
  private keepJobAlive(
    job: Job<ActivityImportJobData>,
    currentProgress: number,
    intervalMs = 600000, // Update every 10 minutes (lockDuration is 30 minutes, so we renew well before expiry)
  ): () => void {
    let isActive = true;
    let interval: NodeJS.Timeout | null = null;

    const heartbeat = async () => {
      if (!isActive || !interval) {
        return;
      }
      try {
        // Update progress to renew the lock (Bull automatically renews lock on progress update)
        await job.progress(currentProgress);
        this.logger.debug(
          `Job ${job.id} heartbeat - lock renewed (progress: ${currentProgress}%)`,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to renew lock for job ${job.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
        // If we can't renew, stop trying
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      }
    };

    interval = setInterval(heartbeat, intervalMs);

    // Return cleanup function
    return () => {
      isActive = false;
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
  }

  @Process({ name: 'import', concurrency: 3 })
  async handleActivityImport(job: Job<ActivityImportJobData>) {
    const { providerAccountId, activity, skipWeather } = job.data;
    const startTime = Date.now();

    this.logger.log(
      `🚀 [PROCESS] Processing activity import job ${job.id} for activity ${activity.externalId} (providerAccountId: ${providerAccountId})`,
    );

    let keepAliveCleanup: (() => void) | undefined;
    // Only enable heartbeat if job is expected to take longer than 10 minutes
    // This prevents unnecessary overhead for quick jobs
    const enableHeartbeat = process.env.ENABLE_JOB_HEARTBEAT !== 'false';

    try {
      // Update job progress to prevent stalling
      await job.progress(10);
      // Get provider account
      const account = await this.prisma.provider_account.findUnique({
        where: {
          provider_account_id: providerAccountId,
        },
      });

      if (!account) {
        throw new Error(`Provider account ${providerAccountId} not found`);
      }

      if (account.status !== 'active') {
        throw new Error(
          `Provider account ${providerAccountId} is not active (status: ${account.status})`,
        );
      }

      // Check if provider supports import (only Strava currently implements importActivity)
      if (account.provider !== connector_provider.STRAVA) {
        throw new Error(
          `Provider ${account.provider} does not support activity import yet`,
        );
      }

      if (!this.stravaProviderService) {
        throw new Error('StravaProviderService not available');
      }

      // Update job progress
      await job.progress(30);

      // Start heartbeat to keep job alive during long API calls
      if (enableHeartbeat) {
        keepAliveCleanup = this.keepJobAlive(job, 30);
        this.logger.debug(`Heartbeat enabled for job ${job.id}`);
      }

      // Import the activity (this can take time due to API calls)
      const importStart = Date.now();
      this.logger.log(
        `Starting import of activity ${activity.externalId} from Strava API...`,
      );
      const savedActivity = await this.stravaProviderService.importActivity(
        account,
        activity,
      );
      const importTime = Date.now() - importStart;

      this.logger.log(
        `Successfully imported activity ${activity.externalId} (eventActivityId: ${savedActivity.event_activity_id}) in ${importTime}ms`,
      );

      // Stop heartbeat and update progress after import
      if (keepAliveCleanup) {
        keepAliveCleanup();
        keepAliveCleanup = undefined;
      }
      await job.progress(50);

      // Get minimal activity data needed for records and equipment handling
      const fullActivity = await this.prisma.event_activity.findUnique({
        where: {
          event_activity_id: savedActivity.event_activity_id,
        },
        select: {
          event_activity_id: true,
          sport: true,
          distance: true,
          stream: true,
          event: {
            select: {
              athlete_id: true,
              start_date: true,
            },
          },
        },
      });

      if (!fullActivity || !fullActivity.event?.athlete_id) {
        throw new Error(
          `Activity ${savedActivity.event_activity_id} not found or has no athlete after import`,
        );
      }

      // Update progress before records and equipment handling
      await job.progress(60);

      // Handle records and equipment in parallel (they are independent)
      // Note: These operations can take significant time for large activities
      // Start heartbeat again for potentially long operations
      if (enableHeartbeat) {
        keepAliveCleanup = this.keepJobAlive(job, 60);
        this.logger.debug(
          `Heartbeat enabled for records/equipment processing on job ${job.id}`,
        );
      }
      const recordsEquipmentStart = Date.now();
      await Promise.all([
        this.handleEquipment(
          fullActivity.event_activity_id,
          fullActivity.event.athlete_id,
          fullActivity.sport,
          fullActivity.distance,
        ),
        fullActivity.stream && typeof fullActivity.stream === 'object'
          ? this.handleRecords(
              fullActivity.event_activity_id,
              fullActivity.event.athlete_id,
              fullActivity.stream as object,
              fullActivity.event.start_date,
            )
          : Promise.resolve(),
      ]);
      const recordsEquipmentTime = Date.now() - recordsEquipmentStart;
      if (recordsEquipmentTime > 5000) {
        this.logger.warn(
          `Records and equipment handling took ${recordsEquipmentTime}ms for activity ${fullActivity.event_activity_id}`,
        );
      }

      // Stop heartbeat
      if (keepAliveCleanup) {
        keepAliveCleanup();
        keepAliveCleanup = undefined;
      }
      await job.progress(85);

      // Queue the activity processing job
      await this.queueService.addActivityProcessingJob(
        savedActivity.event_activity_id,
        savedActivity.event_id,
        skipWeather,
      );

      await job.progress(100);

      const duration = Date.now() - startTime;
      this.logger.log(
        `Completed activity import job ${job.id} in ${duration}ms`,
      );

      return {
        success: true,
        eventActivityId: savedActivity.event_activity_id,
        eventId: savedActivity.event_id,
      };
    } catch (error) {
      // Make sure to cleanup heartbeat on error
      if (keepAliveCleanup) {
        keepAliveCleanup();
      }
      this.logger.error(
        `Failed to import activity ${activity.externalId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Handle equipment assignment and distance update
   */
  private async handleEquipment(
    eventActivityId: number,
    athleteId: number,
    sport: sport_type,
    distance: number | null,
  ): Promise<void> {
    if (!distance || distance === 0) {
      return;
    }

    // Determine equipment type based on sport
    const equipmentType =
      sport === sport_type.RUNNING || sport === sport_type.TRAIL_RUNNING
        ? 'SHOE'
        : 'BIKE';

    // Find default equipment
    const defaultEquipment = await this.prisma.equipment.findFirst({
      where: {
        athlete_id: athleteId,
        type: equipmentType,
        is_default: true,
      },
    });

    if (defaultEquipment) {
      // Update activity with equipment
      await this.prisma.event_activity.update({
        where: {
          event_activity_id: eventActivityId,
        },
        data: {
          equipment: {
            connect: {
              equipment_id: defaultEquipment.equipment_id,
            },
          },
        },
      });

      // Update equipment total distance
      await this.prisma.equipment.update({
        where: {
          equipment_id: defaultEquipment.equipment_id,
        },
        data: {
          total_distance: {
            increment: roundDistance(distance),
          },
        },
      });

      this.logger.debug(
        `Assigned equipment ${defaultEquipment.equipment_id} to activity ${eventActivityId}`,
      );
    }
  }

  /**
   * Handle records computation and creation
   */
  private async handleRecords(
    eventActivityId: number,
    athleteId: number,
    compressedStream: object,
    activityStartDate: Date,
  ): Promise<void> {
    try {
      // Uncompress stream (can take time for large activities)
      const uncompressStart = Date.now();
      const stream = uncompressActivityStream(
        compressedStream as CompressedActivityStream,
      );
      const uncompressTime = Date.now() - uncompressStart;
      if (uncompressTime > 1000) {
        this.logger.debug(
          `Stream uncompression took ${uncompressTime}ms for activity ${eventActivityId}`,
        );
      }

      // Compute records (can take time for large activities)
      const computeStart = Date.now();
      const records = computeRecords(stream);
      const computeTime = Date.now() - computeStart;
      if (computeTime > 2000) {
        this.logger.warn(
          `Records computation took ${computeTime}ms for activity ${eventActivityId} (${records.length} records)`,
        );
      }

      if (records.length > 0) {
        // Create records (skip duplicates to allow re-import)
        await this.prisma.record.createMany({
          data: records.map((record) => ({
            ...record,
            date: activityStartDate,
            event_activity_id: eventActivityId,
            athlete_id: athleteId,
          })),
          skipDuplicates: true,
        });

        this.logger.debug(
          `Created ${records.length} records for activity ${eventActivityId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to create records for activity ${eventActivityId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private getProviderService(provider: connector_provider) {
    switch (provider) {
      case connector_provider.STRAVA:
        return this.stravaProviderService;
      case connector_provider.GARMIN:
        return this.garminProviderService;
      case connector_provider.SUUNTO:
        return this.suuntoProviderService;
      case connector_provider.COROS:
        return this.corosProviderService;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
}
