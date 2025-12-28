import axios, { isAxiosError } from 'axios';

import { Injectable, Logger } from '@nestjs/common';

import { ConnectorProvider, ProviderAccount } from '@openathlete/database';
import { mapPrismaWorkoutToDto } from '@openathlete/shared';

import { PrismaService } from '../../prisma/services/prisma.service';
import { createSuuntoGuideZip } from '../mapping/suunto-guide-zip';
import { mapWorkoutDtoToSuuntoGuide } from '../mapping/suunto-guide.mapper';
import type { SuuntoGuideResponse } from '../mapping/suunto-guide.types';
import type {
  DeletePlannedWorkoutInput,
  ProviderAdapter,
  UpsertPlannedWorkoutInput,
  UpsertPlannedWorkoutResult,
} from '../provider-adapter.interface';
import { SuuntoProviderService } from '../providers/suunto.provider.service';

const GUIDES_API_BASE_URL = 'https://cloudapi.suunto.com/v2/guides';

@Injectable()
export class SuuntoAdapter implements ProviderAdapter {
  private readonly logger = new Logger(SuuntoAdapter.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly suuntoProviderService: SuuntoProviderService,
  ) {}

  getProvider(): 'suunto' {
    return 'suunto';
  }

  /**
   * Get latest metrics for an athlete
   */
  private async getLatestMetricsMap(
    athleteId: number,
  ): Promise<Record<string, { value: number }>> {
    const metrics = await this.prisma.athleteMetric.findMany({
      where: { athleteId: athleteId },
      orderBy: [{ date: 'desc' }],
    });

    const latest: Record<string, { value: number }> = {};
    for (const metric of metrics) {
      if (!latest[metric.type]) {
        latest[metric.type] = { value: metric.value };
      }
    }

    return latest;
  }

  async upsertPlannedWorkout(
    input: UpsertPlannedWorkoutInput,
  ): Promise<UpsertPlannedWorkoutResult> {
    const account = await this.prisma.providerAccount.findFirst({
      where: {
        athleteId: input.athleteId,
        provider: ConnectorProvider.SUUNTO,
        status: 'active',
      },
    });

    if (!account) {
      throw new Error('No active Suunto account found for athlete');
    }

    // Fetch workout with full structure (including repeat blocks)
    // This preserves the repeat structure for proper Suunto RepeatStep mapping
    const workoutRecord = await this.prisma.workout.findUnique({
      where: { workoutId: input.workoutId },
      include: {
        steps: {
          include: {
            targets: true,
            repeatBlock: {
              include: {
                childSteps: {
                  include: {
                    targets: true,
                  },
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!workoutRecord) {
      throw new Error('Workout not found');
    }

    // Get metrics for target calculations
    const metrics = await this.getLatestMetricsMap(input.athleteId);

    // Convert to DTO format
    const workoutDto = mapPrismaWorkoutToDto(workoutRecord);

    // Map workout to Suunto Guide format (preserving repeat structure)
    const guide = mapWorkoutDtoToSuuntoGuide(
      workoutDto,
      input.normalized.sport,
      input.normalized.title ?? null,
      input.normalized.description ?? null,
      input.date,
      input.workoutId,
      metrics,
    );

    // Validate guide has at least one step (Suunto API requirement)
    if (!guide.steps || guide.steps.length === 0) {
      throw new Error('Workout must have at least one step');
    }

    // Create ZIP file
    const zipBuffer = createSuuntoGuideZip(guide);

    // Create or update guide via API
    const guideId = input.previousExternalId
      ? await this.updateGuide(account, input.previousExternalId, zipBuffer)
      : await this.createGuide(account, zipBuffer);

    return { externalId: guideId };
  }

  /**
   * Create a new guide via Suunto Guides API
   */
  private async createGuide(
    account: ProviderAccount,
    zipBuffer: Buffer,
  ): Promise<string> {
    return this.suuntoProviderService.makeGuidesApiRequest(
      account,
      async (accessToken: string) => {
        try {
          const headers =
            this.suuntoProviderService.getGuidesApiHeaders(accessToken);
          headers['Content-Type'] = 'application/zip';

          const { data } = await axios.post<SuuntoGuideResponse>(
            `${GUIDES_API_BASE_URL}/files`,
            zipBuffer,
            {
              headers,
              maxBodyLength: Infinity,
              maxContentLength: Infinity,
            },
          );

          if (data.error) {
            throw new Error(
              `Suunto Guides API error: ${data.error.description || data.error.code}`,
            );
          }

          if (!data.payload?.id) {
            throw new Error('Suunto Guides API returned no guide ID');
          }

          this.logger.debug(
            `Created Suunto guide ${data.payload.id} for account ${account.providerAccountId}`,
          );

          return data.payload.id;
        } catch (error) {
          if (isAxiosError(error)) {
            this.logger.error(
              `Failed to create Suunto guide: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`,
            );
          }
          throw error;
        }
      },
    );
  }

  /**
   * Update an existing guide via Suunto Guides API
   */
  private async updateGuide(
    account: ProviderAccount,
    guideId: string,
    zipBuffer: Buffer,
  ): Promise<string> {
    return this.suuntoProviderService.makeGuidesApiRequest(
      account,
      async (accessToken: string) => {
        try {
          const headers =
            this.suuntoProviderService.getGuidesApiHeaders(accessToken);
          headers['Content-Type'] = 'application/zip';

          const { data } = await axios.put<SuuntoGuideResponse>(
            `${GUIDES_API_BASE_URL}/files/${guideId}`,
            zipBuffer,
            {
              headers,
              maxBodyLength: Infinity,
              maxContentLength: Infinity,
            },
          );

          if (data.error) {
            throw new Error(
              `Suunto Guides API error: ${data.error.description || data.error.code}`,
            );
          }

          if (!data.payload?.id) {
            throw new Error('Suunto Guides API returned no guide ID');
          }

          this.logger.debug(
            `Updated Suunto guide ${data.payload.id} for account ${account.providerAccountId}`,
          );

          return data.payload.id;
        } catch (error) {
          if (isAxiosError(error)) {
            // If guide not found, create a new one
            if (error.response?.status === 404) {
              this.logger.warn(
                `Guide ${guideId} not found, creating new guide instead`,
              );
              return this.createGuide(account, zipBuffer);
            }

            this.logger.error(
              `Failed to update Suunto guide: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`,
            );
          }
          throw error;
        }
      },
    );
  }

  async deletePlannedWorkout(input: DeletePlannedWorkoutInput): Promise<void> {
    if (!input.externalId) {
      this.logger.debug(
        `No external ID provided for deletion, skipping for athlete ${input.athleteId}`,
      );
      return;
    }

    const account = await this.prisma.providerAccount.findFirst({
      where: {
        athleteId: input.athleteId,
        provider: ConnectorProvider.SUUNTO,
        status: 'active',
      },
    });

    if (!account) {
      this.logger.warn(
        `No active Suunto account found for athlete ${input.athleteId}, skipping deletion`,
      );
      return;
    }

    await this.suuntoProviderService.makeGuidesApiRequest(
      account,
      async (accessToken: string) => {
        try {
          const headers =
            this.suuntoProviderService.getGuidesApiHeaders(accessToken);

          await axios.delete(
            `${GUIDES_API_BASE_URL}/files/${input.externalId}`,
            {
              headers,
            },
          );

          this.logger.debug(
            `Deleted Suunto guide ${input.externalId} for account ${account.providerAccountId}`,
          );
        } catch (error) {
          if (isAxiosError(error)) {
            // If guide not found, that's okay - it's already deleted
            if (error.response?.status === 404) {
              this.logger.debug(
                `Guide ${input.externalId} not found, already deleted`,
              );
              return;
            }

            this.logger.error(
              `Failed to delete Suunto guide ${input.externalId}: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`,
            );
          }
          throw error;
        }
      },
    );
  }
}
