import { Job } from 'bull';

import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Inject, Logger, OnModuleInit, forwardRef } from '@nestjs/common';

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
export class ActivityImportProcessor implements OnModuleInit {
  private readonly logger = new Logger(ActivityImportProcessor.name);
  private stravaProviderService?: StravaProviderService;
  private garminProviderService?: GarminProviderService;
  private suuntoProviderService?: SuuntoProviderService;
  private corosProviderService?: CorosProviderService;

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
  ) {
    // Store providers for later use (they might not be available immediately due to circular deps)
    this.stravaProviderService = stravaProviderService;
    this.garminProviderService = garminProviderService;
    this.suuntoProviderService = suuntoProviderService;
    this.corosProviderService = corosProviderService;
    this.logger.log('ActivityImportProcessor constructor called');
  }

  async onModuleInit() {
    if (process.env.ENABLE_ACTIVITY_IMPORT !== 'true') {
      this.logger.warn(
        'ActivityImportProcessor disabled (ENABLE_ACTIVITY_IMPORT not set to true)',
      );
      return;
    }

    this.logger.log(
      'ActivityImportProcessor initialized and ready to process jobs',
    );
    this.logger.log(
      `StravaProviderService available: ${!!this.stravaProviderService}`,
    );
  }

  @OnQueueActive()
  onActive(job: Job<ActivityImportJobData>) {
    this.logger.log(
      `[ON_ACTIVE] Job ${job.id} (${job.data.activity.externalId}) is now active`,
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

  @Process({ name: 'import', concurrency: 3 })
  async handleActivityImport(job: Job<ActivityImportJobData>) {
    const { providerAccountId, activity, skipWeather } = job.data;
    const startTime = Date.now();

    this.logger.log(
      `[PROCESS] Processing activity import job ${job.id} for activity ${activity.externalId}`,
    );

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

      // Update progress after import (before potentially long operations)
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
