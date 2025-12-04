import axios, { isAxiosError } from 'axios';

import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  connector_provider,
  event_activity,
  event_type,
  metric_type,
  provider_account,
} from '@openathlete/database';
import {
  ActivityStream,
  ApiEnvSchemaType,
  METRIC_TYPE,
} from '@openathlete/shared';

import { compressActivityStream } from '../../core/helpers/activity-stream';
import { parseFitFile } from '../../core/helpers/garmin-file-parser';
import {
  roundCadence,
  roundDistance,
  roundElevation,
  roundEnergy,
  roundHeartrate,
  roundSpeed,
} from '../../core/helpers/round-activity-values';
import { mapSuuntoWorkoutToSportType } from '../../core/helpers/suunto';
import {
  SuuntoAggregatedActivityData,
  SuuntoDailyActivityEntry,
  SuuntoLimitedWorkout,
  SuuntoRecoveryEntry,
  SuuntoSleepEntry,
  SuuntoWebhookPayload,
  SuuntoWorkoutListResponse,
  SuuntoWorkoutResponse,
} from '../../core/types/connector';
import { PrismaService } from '../../prisma/services/prisma.service';
import { QueueService } from '../../queue/queue.service';
import {
  BaseProviderService,
  FullImportResult,
  OAuthConfig,
  OAuthTokenResponse,
} from '../base/base-provider.service';
import {
  ImportOptions,
  ImportedActivity,
  ProviderImportCapability,
} from '../base/provider-import.interface';

type MetricRecord = {
  type: METRIC_TYPE;
  date: Date;
  value: number;
};

@Injectable()
export class SuuntoProviderService
  extends BaseProviderService
  implements ProviderImportCapability
{
  protected readonly provider = connector_provider.SUUNTO;
  private readonly importWindowMs = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly metricsSyncWindowDays = 28; // Maximum fetch interval per Suunto API

  private get subscriptionKey(): string {
    return this.configService.get('SUUNTO_SUBSCRIPTION_KEY') || '';
  }

  /**
   * Get headers for Suunto Workout API requests
   * Includes Authorization and Subscription Key
   */
  private getWorkoutApiHeaders(accessToken: string): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
    };

    // Add subscription key if available (required for Workout API)
    if (this.subscriptionKey) {
      headers['Ocp-Apim-Subscription-Key'] = this.subscriptionKey;
    }

    return headers;
  }

  /**
   * Get headers for Suunto Guides API requests
   * Includes Authorization and Subscription Key (can be in header or query)
   */
  getGuidesApiHeaders(accessToken: string): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
    };

    // Add subscription key if available (required for Guides API)
    if (this.subscriptionKey) {
      headers['Ocp-Apim-Subscription-Key'] = this.subscriptionKey;
    }

    return headers;
  }

  /**
   * Make authenticated request to Suunto Guides API with automatic token refresh
   */
  async makeGuidesApiRequest<T>(
    account: provider_account,
    requestFn: (accessToken: string) => Promise<T>,
  ): Promise<T> {
    return this.makeAuthenticatedRequest(account, requestFn);
  }

  protected get oauthConfig(): OAuthConfig {
    return {
      // Note: Use cloudapi-oauth.suunto.com instead of cloudapi.suunto.com
      // as specified in Suunto API documentation
      authorizationUrl: 'https://cloudapi-oauth.suunto.com/oauth/authorize',
      tokenUrl: 'https://cloudapi-oauth.suunto.com/oauth/token',
      clientId: this.configService.get('SUUNTO_CLIENT_ID') || '',
      clientSecret: this.configService.get('SUUNTO_CLIENT_SECRET') || '',
      redirectUri: this.configService.get('SUUNTO_REDIRECT_URI') || '',
      scopes: [], // Suunto OAuth2 doesn't use scopes in authorization URL
    };
  }

  constructor(
    prisma: PrismaService,
    configService: ConfigService<ApiEnvSchemaType, true>,
    @Inject(forwardRef(() => QueueService))
    private readonly queueService: QueueService,
  ) {
    super(prisma, configService);
  }

  /**
   * Generate OAuth authorization URL for Suunto
   * Suunto OAuth2 doesn't use scopes in the authorization request
   */
  override getAuthorizationUri(state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.oauthConfig.clientId,
      redirect_uri: this.oauthConfig.redirectUri,
      ...(state && { state }),
    });

    return `${this.oauthConfig.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   * Suunto uses Basic Auth (client_id:client_secret) and query parameters
   */
  override async exchangeCodeForTokens(
    code: string,
  ): Promise<OAuthTokenResponse> {
    try {
      // Create Basic Auth header: Base64(client_id:client_secret)
      const credentials = Buffer.from(
        `${this.oauthConfig.clientId}:${this.oauthConfig.clientSecret}`,
      ).toString('base64');

      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.oauthConfig.redirectUri,
      });

      const { data } = await axios.post<OAuthTokenResponse>(
        `${this.oauthConfig.tokenUrl}?${params.toString()}`,
        null, // No body, all params in query string
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return data;
    } catch (error) {
      if (isAxiosError(error)) {
        this.logger.error(
          `Suunto OAuth token exchange failed: ${JSON.stringify(error.response?.data)}`,
        );
      }
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * Suunto uses Basic Auth (client_id:client_secret) and query parameters
   */
  override async refreshAccessToken(
    refreshToken: string,
  ): Promise<OAuthTokenResponse> {
    try {
      // Create Basic Auth header: Base64(client_id:client_secret)
      const credentials = Buffer.from(
        `${this.oauthConfig.clientId}:${this.oauthConfig.clientSecret}`,
      ).toString('base64');

      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });

      const { data } = await axios.post<OAuthTokenResponse>(
        `${this.oauthConfig.tokenUrl}?${params.toString()}`,
        null, // No body, all params in query string
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      // Log token response for debugging (without exposing the actual token)
      this.logger.debug(
        `Suunto token refresh response: expires_in=${data.expires_in}, token_type=${data.token_type}`,
      );

      return data;
    } catch (error) {
      if (isAxiosError(error)) {
        this.logger.error(
          `Suunto token refresh failed: ${JSON.stringify(error.response?.data)}`,
        );
      }
      throw error;
    }
  }

  /**
   * Deauthorize user from Suunto
   * Calls the /oauth/deauthorize endpoint to disconnect user from partner service
   */
  async deauthorize(accessToken: string): Promise<void> {
    try {
      const params = new URLSearchParams({
        client_id: this.oauthConfig.clientId,
      });

      await axios.get(
        `https://cloudapi-oauth.suunto.com/oauth/deauthorize?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
    } catch (error) {
      if (isAxiosError(error)) {
        this.logger.error(
          `Suunto deauthorize failed: ${JSON.stringify(error.response?.data)}`,
        );
      }
      // Don't throw - deauthorization failure shouldn't block account revocation
      this.logger.warn(
        'Suunto deauthorize failed, continuing with account revocation',
      );
    }
  }

  /**
   * Decode JWT token to get expiration time
   */
  private decodeJwtExpiration(token: string): number | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = parts[1];
      const decoded = JSON.parse(
        Buffer.from(
          payload.replace(/-/g, '+').replace(/_/g, '/'),
          'base64',
        ).toString(),
      );
      return decoded.exp ? decoded.exp * 1000 : null; // Convert to milliseconds
    } catch {
      return null;
    }
  }

  /**
   * Decode JWT token to extract user ID or username
   */
  private decodeJwtUserInfo(token: string): {
    userId?: string | null;
    username?: string | null;
  } {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return { userId: null, username: null };

      const payload = parts[1];
      const decoded = JSON.parse(
        Buffer.from(
          payload.replace(/-/g, '+').replace(/_/g, '/'),
          'base64',
        ).toString(),
      );

      // Log decoded token for debugging (remove sensitive data)
      this.logger.debug(
        `Suunto JWT decoded fields: ${Object.keys(decoded).join(', ')}`,
      );

      // Suunto JWT might contain user_id, sub, username, or other fields
      const userId =
        decoded.user_id || decoded.sub || decoded.userId || decoded.uid || null;
      const username =
        decoded.username ||
        decoded.user_name ||
        decoded.preferred_username ||
        decoded.name ||
        null;

      return {
        userId: userId ? userId.toString() : null,
        username: username ? username.toString() : null,
      };
    } catch (error) {
      this.logger.warn(
        `Failed to decode Suunto JWT: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { userId: null, username: null };
    }
  }

  /**
   * Get user ID or username from access token (decode JWT)
   * Returns username if available, otherwise userId
   */
  async getUserId(accessToken: string): Promise<string | null> {
    // Try to decode from JWT token
    const userInfo = this.decodeJwtUserInfo(accessToken);

    // Prefer username over userId as webhooks use username
    if (userInfo.username) {
      this.logger.debug(
        `Extracted username from Suunto JWT: ${userInfo.username}`,
      );
      return userInfo.username;
    }

    if (userInfo.userId) {
      this.logger.debug(`Extracted userId from Suunto JWT: ${userInfo.userId}`);
      return userInfo.userId;
    }

    // If JWT doesn't contain user info, try API endpoint (if available)
    // Note: Suunto API might not have a user info endpoint
    // In that case, we'll need to rely on webhook payload or workout ownership
    this.logger.warn('No user ID or username found in Suunto JWT token');
    return null;
  }

  /**
   * Make authenticated request with automatic token refresh
   */
  private async makeAuthenticatedRequest<T>(
    account: provider_account,
    requestFn: (accessToken: string) => Promise<T>,
  ): Promise<T> {
    // Always get fresh token from DB to ensure we have the latest
    const freshAccount = await this.prisma.provider_account.findUnique({
      where: { provider_account_id: account.provider_account_id },
    });

    if (!freshAccount) {
      throw new Error(
        `Provider account ${account.provider_account_id} not found`,
      );
    }

    const accessToken = await this.getValidAccessToken(freshAccount);

    try {
      return await requestFn(accessToken);
    } catch (error) {
      if (
        isAxiosError(error) &&
        error.response?.status === 401 &&
        freshAccount.refresh_token
      ) {
        this.logger.debug(
          `Suunto token expired, refreshing for account ${freshAccount.provider_account_id}`,
        );

        const tokenResponse = await this.refreshAccessToken(
          freshAccount.refresh_token,
        );

        // Suunto tokens are JWT, decode to get expiration
        const expiresAtMs = tokenResponse.expires_in
          ? Date.now() + (tokenResponse.expires_in - 600) * 1000
          : this.decodeJwtExpiration(tokenResponse.access_token);

        const expiresAt = expiresAtMs ? new Date(expiresAtMs) : null;

        const updatedAccount = await this.prisma.provider_account.update({
          where: {
            provider_account_id: freshAccount.provider_account_id,
          },
          data: {
            access_token: tokenResponse.access_token,
            refresh_token:
              tokenResponse.refresh_token ?? freshAccount.refresh_token,
            expires_at: expiresAt,
          },
        });

        // Update the account object passed in
        account.access_token = updatedAccount.access_token;
        account.refresh_token = updatedAccount.refresh_token;
        account.expires_at = updatedAccount.expires_at;

        // Verify token format (should be a JWT with 3 parts separated by dots)
        const tokenParts = tokenResponse.access_token.split('.');
        if (tokenParts.length !== 3) {
          this.logger.error(
            `Suunto token format invalid: expected JWT format (3 parts), got ${tokenParts.length} parts`,
          );
        }

        this.logger.debug(
          `Suunto token refreshed successfully for account ${freshAccount.provider_account_id}, retrying request with new token (length: ${tokenResponse.access_token.length}, format: ${tokenParts.length === 3 ? 'JWT' : 'INVALID'})`,
        );

        // Small delay to ensure token is propagated (some APIs need a moment)
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Use the new access token from the refresh response
        try {
          const result = await requestFn(tokenResponse.access_token);
          this.logger.debug(
            `Suunto request succeeded after token refresh for account ${freshAccount.provider_account_id}`,
          );
          return result;
        } catch (retryError) {
          if (isAxiosError(retryError)) {
            this.logger.error(
              `Suunto request failed after token refresh: ${retryError.response?.status} ${retryError.response?.statusText} - ${JSON.stringify(retryError.response?.data)}`,
            );
            this.logger.error(
              `Token used: length=${tokenResponse.access_token.length}, starts with: ${tokenResponse.access_token.substring(0, 30)}...`,
            );
          }
          throw retryError;
        }
      }

      // Log error details for debugging
      if (isAxiosError(error)) {
        this.logger.error(
          `Suunto API request failed: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`,
        );
      }

      throw error;
    }
  }

  /**
   * Import activities from Suunto
   */
  async importActivities(
    account: provider_account,
    options?: ImportOptions,
  ): Promise<ImportedActivity[]> {
    const limit = options?.limit ?? Number.POSITIVE_INFINITY;
    const activities: ImportedActivity[] = [];

    const endTime = options?.endDate ? options.endDate.getTime() : Date.now();
    const startTime = options?.startDate
      ? options.startDate.getTime()
      : endTime - this.importWindowMs;

    if (startTime >= endTime) {
      return [];
    }

    let offset = 0;
    const pageSize = 50; // Suunto API default limit

    while (activities.length < limit) {
      this.logger.debug(
        `Fetching Suunto workouts: offset=${offset}, since=${startTime}, until=${endTime}`,
      );

      const response =
        await this.makeAuthenticatedRequest<SuuntoWorkoutListResponse>(
          account,
          async (accessToken) => {
            try {
              const { data } = await axios.get<SuuntoWorkoutListResponse>(
                'https://cloudapi.suunto.com/v3/workouts',
                {
                  headers: this.getWorkoutApiHeaders(accessToken),
                  params: {
                    since: startTime,
                    until: endTime,
                    limit: pageSize,
                    offset,
                    'filter-by-modification-time': true,
                  },
                  timeout: 15000,
                },
              );
              this.logger.debug(
                `Suunto API response: ${data.payload?.length || 0} workouts, error=${data.error?.code || 'none'}`,
              );
              return data;
            } catch (error) {
              if (
                isAxiosError(error) &&
                (error.response?.status === 403 ||
                  error.response?.status === 400)
              ) {
                this.logger.debug(
                  `Suunto API returned ${error.response?.status}, returning empty result`,
                );
                return { error: null, payload: [], metadata: {} };
              }
              throw error;
            }
          },
        );

      if (
        response.error ||
        !response.payload ||
        response.payload.length === 0
      ) {
        break;
      }

      for (const workout of response.payload) {
        if (activities.length >= limit) break;

        const startDate = new Date(workout.startTime);
        const endDate = workout.stopTime
          ? new Date(workout.stopTime)
          : new Date(startDate.getTime() + workout.totalTime * 1000);

        // Apply date filters if provided
        if (options?.startDate && startDate < options.startDate) continue;
        if (options?.endDate && startDate > options.endDate) continue;

        activities.push({
          externalId: workout.workoutKey,
          name: workout.workoutName || `Suunto Workout ${workout.workoutKey}`,
          startDate,
          endDate,
          sport: mapSuuntoWorkoutToSportType(workout).toString(),
          distance: workout.totalDistance,
          duration: workout.totalTime,
          raw: workout,
        });
      }

      if (response.payload.length < pageSize) {
        break;
      }

      offset += pageSize;
    }

    return activities;
  }

  /**
   * Import and save a single activity
   */
  async importActivity(
    account: provider_account,
    activity: ImportedActivity,
  ): Promise<event_activity> {
    const existing = await this.prisma.event_activity.findFirst({
      where: {
        external_id: activity.externalId,
      },
    });

    if (existing) {
      return existing;
    }

    const athlete = await this.prisma.athlete.findUnique({
      where: { athlete_id: account.athlete_id },
      select: { athlete_id: true },
    });

    if (!athlete) {
      throw new Error('Athlete not found');
    }

    const event = await this.prisma.event.create({
      data: {
        athlete_id: athlete.athlete_id,
        name: activity.name,
        type: event_type.ACTIVITY,
        start_date: activity.startDate,
        end_date: activity.endDate,
      },
    });

    const suuntoWorkout = activity.raw as SuuntoLimitedWorkout;
    const savedActivity = await this.fetchSuuntoActivityData(
      account,
      event,
      suuntoWorkout,
    );

    // Try to fetch FIT file for stream data
    try {
      await this.processActivityFile(
        account,
        savedActivity,
        suuntoWorkout.workoutKey,
      );
    } catch (error) {
      // Log but don't fail - stream data is optional
      this.logger.debug(
        `Failed to fetch FIT file for workout ${suuntoWorkout.workoutKey}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return savedActivity;
  }

  /**
   * Fetch and save Suunto activity data
   */
  private async fetchSuuntoActivityData(
    account: provider_account,
    event: { event_id: number },
    workout: SuuntoLimitedWorkout,
  ): Promise<event_activity> {
    const activityStream: ActivityStream = {};
    const compressedActivityStream = compressActivityStream(activityStream);
    const sport = mapSuuntoWorkoutToSportType(workout);

    // Convert avgSpeed from km/h to m/s
    const avgSpeedMps = workout.avgSpeed
      ? (workout.avgSpeed * 1000) / 3600
      : undefined;
    const maxSpeedMps = workout.maxSpeed
      ? (workout.maxSpeed * 1000) / 3600
      : undefined;

    // Extract cadence (could be in extensions)
    let averageCadence: number | undefined;
    if (workout.cadence?.avg !== undefined) {
      averageCadence = roundCadence(workout.cadence.avg) ?? undefined;
    }

    const savedActivity = await this.prisma.event_activity.create({
      data: {
        provider: connector_provider.SUUNTO,
        distance: roundDistance(workout.totalDistance || 0),
        elevation_gain: roundElevation(workout.totalAscent || 0),
        moving_time: workout.totalTime,
        average_speed: avgSpeedMps ? (roundSpeed(avgSpeedMps) ?? 0) : 0,
        max_speed: maxSpeedMps ? (roundSpeed(maxSpeedMps) ?? 0) : 0,
        average_cadence: averageCadence,
        average_heartrate: workout.hrdata
          ? roundHeartrate(workout.hrdata.workoutAvgHR)
          : undefined,
        max_heartrate: workout.hrdata
          ? roundHeartrate(workout.hrdata.workoutMaxHR)
          : undefined,
        kilojoules: workout.energyConsumption
          ? roundEnergy(workout.energyConsumption * 4.184)
          : undefined,
        sport,
        stream: compressedActivityStream as object,
        external_id: workout.workoutKey,
        event: {
          connect: {
            event_id: event.event_id,
          },
        },
      },
    });

    return savedActivity;
  }

  /**
   * Process activity file (FIT format) and update stream data
   */
  private async processActivityFile(
    account: provider_account,
    activity: event_activity,
    workoutKey: string,
  ): Promise<void> {
    try {
      const response = await this.makeAuthenticatedRequest(
        account,
        async (accessToken) => {
          const headers = this.getWorkoutApiHeaders(accessToken);
          headers.Accept = 'application/octet-stream';

          return axios.get<ArrayBuffer>(
            `https://cloudapi.suunto.com/v3/workouts/${workoutKey}/fit`,
            {
              headers,
              responseType: 'arraybuffer',
              timeout: 60000,
            },
          );
        },
      );

      const fitParseResult = await parseFitFile(response.data);
      if (!fitParseResult.stream) {
        return;
      }

      const compressedStream = compressActivityStream(fitParseResult.stream);

      await this.prisma.event_activity.update({
        where: {
          event_activity_id: activity.event_activity_id,
        },
        data: {
          stream: compressedStream as object,
        },
      });
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        // FIT file not available, skip
        return;
      }
      throw error;
    }
  }

  /**
   * Queue activities for import
   */
  private async enqueueActivities(
    account: provider_account,
    activities: ImportedActivity[],
  ): Promise<number> {
    if (activities.length === 0) {
      return 0;
    }

    const existingExternalIds = await this.prisma.event_activity.findMany({
      where: {
        external_id: {
          in: activities.map((a) => a.externalId),
        },
      },
      select: {
        external_id: true,
      },
    });

    const existingIdsSet = new Set(
      existingExternalIds.map((a) => a.external_id),
    );

    const newActivities = activities.filter(
      (a) => !existingIdsSet.has(a.externalId),
    );

    if (newActivities.length === 0) {
      this.logger.log(
        `No new Suunto activities to queue for account ${account.provider_account_id}`,
      );
      return 0;
    }

    await this.queueService.addActivityImportJobs(account, newActivities, true);
    return newActivities.length;
  }

  /**
   * Queue full import of activities
   */
  async queueFullImport(account: provider_account): Promise<FullImportResult> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - this.importWindowMs);

    try {
      const activities = await this.importActivities(account, {
        startDate,
        endDate,
      });

      if (activities.length === 0) {
        return { queuedActivities: 0 };
      }

      const queued = await this.enqueueActivities(account, activities);

      return {
        queuedActivities: queued,
        backfillRequested: false,
      };
    } catch (error) {
      const errorName =
        error instanceof Error ? error.constructor.name : 'Unknown';
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error in queueFullImport for account ${account.provider_account_id}: ${errorName}: ${errorMessage}`,
      );
      throw new BadRequestException(
        `Failed to queue Suunto activities: ${errorMessage}`,
      );
    }
  }

  /**
   * Handle webhook from Suunto
   */
  async handleWebhook(payload: SuuntoWebhookPayload): Promise<void> {
    // Extract workoutKey from nested structure or root level
    const workoutKey = payload.workout?.workoutKey || payload.workoutKey;
    if (!workoutKey) {
      this.logger.warn(
        `Suunto webhook missing workoutKey. Payload: ${JSON.stringify(payload)}`,
      );
      return;
    }

    // Find account by external_user_id if provided
    // Suunto webhooks may use userId or username
    let account: provider_account | null = null;

    const userId = payload.userId || payload.username;
    if (userId) {
      this.logger.debug(
        `Suunto webhook: Looking for account with external_user_id: ${userId}`,
      );
      account = await this.prisma.provider_account.findFirst({
        where: {
          provider: connector_provider.SUUNTO,
          external_user_id: userId,
          status: 'active',
        },
        include: {
          athlete: {
            include: {
              user: true,
            },
          },
        },
      });

      if (account) {
        this.logger.debug(
          `Suunto webhook: Found account ${account.provider_account_id} for userId/username ${userId}`,
        );
      } else {
        this.logger.warn(
          `Suunto webhook: No account found with external_user_id: ${userId}. Make sure the username was saved during OAuth connection.`,
        );
      }
    }

    // If no account found by userId/username, try to find owner by testing workout access
    // This works by fetching the workout with each active account to see which one can access it
    if (!account) {
      this.logger.debug(
        `Suunto webhook: No account found for userId/username ${userId || 'unknown'}, trying to find owner by testing workout access for workoutKey ${workoutKey}`,
      );

      // Get all active Suunto accounts with import enabled
      const activeAccounts = await this.prisma.provider_account.findMany({
        where: {
          provider: connector_provider.SUUNTO,
          status: 'active',
          import_activities_enabled: true,
        },
        include: {
          athlete: {
            include: {
              user: true,
            },
          },
        },
      });

      // Try each account to see if it can access the workout
      for (const testAccount of activeAccounts) {
        try {
          const workoutResponse =
            await this.makeAuthenticatedRequest<SuuntoWorkoutResponse>(
              testAccount,
              async (accessToken) => {
                const { data } = await axios.get<SuuntoWorkoutResponse>(
                  `https://cloudapi.suunto.com/v3/workouts/${workoutKey}`,
                  {
                    headers: this.getWorkoutApiHeaders(accessToken),
                    timeout: 5000, // Short timeout for quick check
                  },
                );
                return data;
              },
            );

          // If we can fetch the workout without error, this account owns it
          if (workoutResponse.payload && !workoutResponse.error) {
            account = testAccount;
            this.logger.debug(
              `Suunto webhook: Found workout owner - account ${account.provider_account_id} (athlete ${account.athlete_id}) for workoutKey ${workoutKey}`,
            );
            break;
          }
        } catch {
          // This account doesn't own the workout, try next
          continue;
        }
      }
    }

    if (!account) {
      this.logger.warn(
        `Suunto webhook: No account found for workoutKey ${workoutKey}. userId/username: ${userId || 'not provided'}`,
      );
      return;
    }

    if (!account.import_activities_enabled) {
      this.logger.debug(
        `Import disabled for Suunto account ${account.provider_account_id}, skipping webhook`,
      );
      return;
    }

    // Check if activity already imported
    const existingActivity = await this.prisma.event_activity.findFirst({
      where: {
        external_id: workoutKey,
      },
    });

    if (existingActivity) {
      this.logger.debug(`Activity ${workoutKey} already imported, skipping`);
      return;
    }

    try {
      // Fetch workout details
      const workoutResponse =
        await this.makeAuthenticatedRequest<SuuntoWorkoutResponse>(
          account,
          async (accessToken) => {
            const { data } = await axios.get<SuuntoWorkoutResponse>(
              `https://cloudapi.suunto.com/v3/workouts/${workoutKey}`,
              {
                headers: this.getWorkoutApiHeaders(accessToken),
                timeout: 15000,
              },
            );
            return data;
          },
        );

      if (workoutResponse.error || !workoutResponse.payload) {
        this.logger.warn(
          `Failed to fetch Suunto workout ${workoutKey}: ${workoutResponse.error?.description || 'Unknown error'}`,
        );
        return;
      }

      const workout = workoutResponse.payload;
      const startDate = new Date(workout.startTime);
      const endDate = workout.stopTime
        ? new Date(workout.stopTime)
        : new Date(startDate.getTime() + workout.totalTime * 1000);

      const importedActivity: ImportedActivity = {
        externalId: workout.workoutKey,
        name: workout.workoutName || `Suunto Workout ${workout.workoutKey}`,
        startDate,
        endDate,
        sport: mapSuuntoWorkoutToSportType(workout).toString(),
        distance: workout.totalDistance,
        duration: workout.totalTime,
        raw: workout,
      };

      // Queue for import
      await this.queueService.addActivityImportJobs(
        account,
        [importedActivity],
        false,
      );
    } catch (error) {
      this.logger.error(
        `Error processing Suunto webhook for workoutKey ${workoutKey}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get headers for Suunto 247 Data API requests
   */
  private get247ApiHeaders(accessToken: string): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // Add subscription key if available
    if (this.subscriptionKey) {
      headers['Ocp-Apim-Subscription-Key'] = this.subscriptionKey;
    }

    return headers;
  }

  /**
   * Fetch daily activity statistics (aggregated steps and energy)
   */
  private async fetchDailyActivityStatistics(
    account: provider_account,
    startDate: Date,
    endDate: Date,
  ): Promise<SuuntoAggregatedActivityData[]> {
    return this.makeAuthenticatedRequest<SuuntoAggregatedActivityData[]>(
      account,
      async (accessToken) => {
        const startDateISO = startDate.toISOString();
        const endDateISO = endDate.toISOString();

        const { data } = await axios.get<SuuntoAggregatedActivityData[]>(
          `https://cloudapi.suunto.com/247samples/daily-activity-statistics`,
          {
            headers: this.get247ApiHeaders(accessToken),
            params: {
              startdate: startDateISO,
              enddate: endDateISO,
            },
            timeout: 30000,
          },
        );
        return data;
      },
    );
  }

  /**
   * Fetch daily activity samples (steps, energy, HR, SpO2)
   */
  private async fetchDailyActivitySamples(
    account: provider_account,
    startDate: Date,
    endDate: Date,
  ): Promise<SuuntoDailyActivityEntry[]> {
    return this.makeAuthenticatedRequest<SuuntoDailyActivityEntry[]>(
      account,
      async (accessToken) => {
        const from = startDate.getTime();
        const to = endDate.getTime();

        const { data } = await axios.get<SuuntoDailyActivityEntry[]>(
          `https://cloudapi.suunto.com/247samples/activity`,
          {
            headers: this.get247ApiHeaders(accessToken),
            params: {
              from,
              to,
            },
            timeout: 30000,
          },
        );
        return data;
      },
    );
  }

  /**
   * Fetch sleep data
   */
  private async fetchSleepData(
    account: provider_account,
    startDate: Date,
    endDate: Date,
  ): Promise<SuuntoSleepEntry[]> {
    return this.makeAuthenticatedRequest<SuuntoSleepEntry[]>(
      account,
      async (accessToken) => {
        const from = startDate.getTime();
        const to = endDate.getTime();

        const { data } = await axios.get<SuuntoSleepEntry[]>(
          `https://cloudapi.suunto.com/247samples/sleep`,
          {
            headers: this.get247ApiHeaders(accessToken),
            params: {
              from,
              to,
            },
            timeout: 30000,
          },
        );
        return data;
      },
    );
  }

  /**
   * Fetch recovery data
   */
  private async fetchRecoveryData(
    account: provider_account,
    startDate: Date,
    endDate: Date,
  ): Promise<SuuntoRecoveryEntry[]> {
    return this.makeAuthenticatedRequest<SuuntoRecoveryEntry[]>(
      account,
      async (accessToken) => {
        const from = startDate.getTime();
        const to = endDate.getTime();

        const { data } = await axios.get<SuuntoRecoveryEntry[]>(
          `https://cloudapi.suunto.com/247samples/recovery`,
          {
            headers: this.get247ApiHeaders(accessToken),
            params: {
              from,
              to,
            },
            timeout: 30000,
          },
        );
        return data;
      },
    );
  }

  /**
   * Parse ISO8601 date string to Date object
   */
  private parseISO8601Date(dateString: string): Date | null {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date;
    } catch {
      return null;
    }
  }

  /**
   * Convert seconds to hours
   */
  private secondsToHours(seconds?: number | null): number | undefined {
    if (seconds === undefined || seconds === null) {
      return undefined;
    }
    return seconds / 3600;
  }

  /**
   * Convert joules to kilocalories
   */
  private joulesToKilocalories(joules?: number | null): number | undefined {
    if (joules === undefined || joules === null) {
      return undefined;
    }
    // 1 kcal = 4184 J
    return joules / 4184;
  }

  /**
   * Convert SpO2 from 0..1 to percentage (0..100)
   */
  private spo2ToPercentage(spo2?: number | null): number | undefined {
    if (spo2 === undefined || spo2 === null) {
      return undefined;
    }
    return spo2 * 100;
  }

  /**
   * Add metric if value is defined and finite
   */
  private pushMetric(
    target: MetricRecord[],
    type: METRIC_TYPE,
    date: Date | null,
    value: number | undefined | null,
    defaultValue = 0,
  ): void {
    if (!date || date instanceof Date === false || isNaN(date.getTime())) {
      return;
    }

    const numValue =
      value !== undefined && value !== null
        ? Number(value)
        : defaultValue !== undefined
          ? defaultValue
          : undefined;

    if (numValue === undefined || !Number.isFinite(numValue)) {
      return;
    }

    // Set time to midnight UTC for date-only metrics
    const dateOnly = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );

    target.push({
      type,
      date: dateOnly,
      value: numValue,
    });
  }

  /**
   * Map aggregated activity statistics to metrics
   */
  private mapAggregatedActivityToMetrics(
    data: SuuntoAggregatedActivityData[],
  ): MetricRecord[] {
    const metrics: MetricRecord[] = [];
    const dailyStats = new Map<string, { steps?: number; energy?: number }>();

    for (const aggregated of data) {
      if (
        aggregated.Name === 'stepcount' ||
        aggregated.Name === 'energyconsumption'
      ) {
        for (const source of aggregated.Sources) {
          for (const sample of source.Samples) {
            const date = this.parseISO8601Date(sample.TimeISO8601);
            if (!date) continue;

            const dateKey = date.toISOString().split('T')[0];
            const stats = dailyStats.get(dateKey) || {};

            if (sample.Value !== null && sample.Value !== undefined) {
              const numValue = Number(sample.Value);
              if (Number.isFinite(numValue)) {
                if (aggregated.Name === 'stepcount') {
                  stats.steps = (stats.steps || 0) + numValue;
                } else if (aggregated.Name === 'energyconsumption') {
                  stats.energy = (stats.energy || 0) + numValue;
                }
              }
            }

            dailyStats.set(dateKey, stats);
          }
        }
      }
    }

    for (const [dateKey, stats] of dailyStats.entries()) {
      const date = new Date(dateKey + 'T00:00:00.000Z');
      this.pushMetric(metrics, METRIC_TYPE.DAILY_STEPS, date, stats.steps);
      if (stats.energy !== undefined) {
        const kcal = this.joulesToKilocalories(stats.energy);
        this.pushMetric(metrics, METRIC_TYPE.DAILY_CALORIES, date, kcal);
      }
    }

    return metrics;
  }

  /**
   * Map daily activity entries to metrics
   */
  private mapDailyActivityEntriesToMetrics(
    entries: SuuntoDailyActivityEntry[],
  ): MetricRecord[] {
    const metrics: MetricRecord[] = [];
    const dailyStats = new Map<
      string,
      {
        hrSum: number;
        hrCount: number;
        hrMin?: number;
        hrMax?: number;
        steps?: number;
        energy?: number;
        spo2Sum: number;
        spo2Count: number;
        hrvSum: number;
        hrvCount: number;
      }
    >();

    for (const entry of entries) {
      const date = this.parseISO8601Date(entry.timestamp);
      if (!date) continue;

      const dateKey = date.toISOString().split('T')[0];
      const stats = dailyStats.get(dateKey) || {
        hrSum: 0,
        hrCount: 0,
        spo2Sum: 0,
        spo2Count: 0,
        hrvSum: 0,
        hrvCount: 0,
      };

      const data = entry.entryData;

      if (data.HR !== undefined && data.HR !== null) {
        stats.hrSum += data.HR;
        stats.hrCount += 1;
        if (stats.hrMin === undefined || data.HR < stats.hrMin) {
          stats.hrMin = data.HR;
        }
        if (stats.hrMax === undefined || data.HR > stats.hrMax) {
          stats.hrMax = data.HR;
        }
      }

      if (data.StepCount !== undefined && data.StepCount !== null) {
        stats.steps = (stats.steps || 0) + data.StepCount;
      }

      if (
        data.EnergyConsumption !== undefined &&
        data.EnergyConsumption !== null
      ) {
        stats.energy = (stats.energy || 0) + data.EnergyConsumption;
      }

      if (data.SpO2 !== undefined && data.SpO2 !== null) {
        stats.spo2Sum += data.SpO2;
        stats.spo2Count += 1;
      }

      if (data.HRV !== undefined && data.HRV !== null) {
        stats.hrvSum += data.HRV;
        stats.hrvCount += 1;
      }

      dailyStats.set(dateKey, stats);
    }

    for (const [dateKey, stats] of dailyStats.entries()) {
      const date = new Date(dateKey + 'T00:00:00.000Z');

      if (stats.hrCount > 0) {
        this.pushMetric(
          metrics,
          METRIC_TYPE.HR_AVG_DAILY,
          date,
          stats.hrSum / stats.hrCount,
        );
        this.pushMetric(metrics, METRIC_TYPE.HR_MIN_DAILY, date, stats.hrMin);
        this.pushMetric(metrics, METRIC_TYPE.HR_MAX_DAILY, date, stats.hrMax);
      }

      this.pushMetric(metrics, METRIC_TYPE.DAILY_STEPS, date, stats.steps);

      if (stats.energy !== undefined) {
        const kcal = this.joulesToKilocalories(stats.energy);
        this.pushMetric(metrics, METRIC_TYPE.DAILY_CALORIES, date, kcal);
      }

      if (stats.spo2Count > 0) {
        const spo2Avg = stats.spo2Sum / stats.spo2Count;
        const spo2Percent = this.spo2ToPercentage(spo2Avg);
        this.pushMetric(metrics, METRIC_TYPE.PULSE_OX_AVG, date, spo2Percent);
      }

      if (stats.hrvCount > 0) {
        const hrvAvg = stats.hrvSum / stats.hrvCount;
        this.pushMetric(metrics, METRIC_TYPE.HRV_LAST_NIGHT_AVG, date, hrvAvg);
      }
    }

    return metrics;
  }

  /**
   * Map sleep entries to metrics
   */
  private mapSleepEntriesToMetrics(
    entries: SuuntoSleepEntry[],
  ): MetricRecord[] {
    const metrics: MetricRecord[] = [];

    for (const entry of entries) {
      const date = this.parseISO8601Date(entry.timestamp);
      if (!date) continue;

      const data = entry.entryData;

      // Use DateTime if available, otherwise use timestamp
      const sleepDate = data.DateTime
        ? this.parseISO8601Date(data.DateTime)
        : date;
      if (!sleepDate) continue;

      this.pushMetric(
        metrics,
        METRIC_TYPE.SLEEP_DURATION,
        sleepDate,
        this.secondsToHours(data.Duration),
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.SLEEP_DEEP_DURATION,
        sleepDate,
        this.secondsToHours(data.DeepSleepDuration),
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.SLEEP_LIGHT_DURATION,
        sleepDate,
        this.secondsToHours(data.LightSleepDuration),
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.SLEEP_REM_DURATION,
        sleepDate,
        this.secondsToHours(data.REMSleepDuration),
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.SLEEP_AWAKE_DURATION,
        sleepDate,
        this.secondsToHours(
          (data.SleepOnsetLatencyDuration || 0) +
            (data.WakeAfterSleepOnsetDuration || 0) +
            (data.WakeBeforeOffBedDuration || 0),
        ),
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.NAP_DURATION,
        sleepDate,
        data.IsNap ? this.secondsToHours(data.Duration) : undefined,
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.SLEEP_SCORE,
        sleepDate,
        data.SleepQualityScore,
      );
      this.pushMetric(metrics, METRIC_TYPE.HR_AVG_DAILY, sleepDate, data.HRAvg);
      this.pushMetric(metrics, METRIC_TYPE.HR_MIN_DAILY, sleepDate, data.HRMin);
      this.pushMetric(
        metrics,
        METRIC_TYPE.PULSE_OX_AVG,
        sleepDate,
        this.spo2ToPercentage(data.MaxSpo2),
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.HRV_LAST_NIGHT_AVG,
        sleepDate,
        data.AvgHRV,
      );
    }

    return metrics;
  }

  /**
   * Map recovery entries to metrics
   */
  private mapRecoveryEntriesToMetrics(
    entries: SuuntoRecoveryEntry[],
  ): MetricRecord[] {
    const metrics: MetricRecord[] = [];

    for (const entry of entries) {
      const date = this.parseISO8601Date(entry.timestamp);
      if (!date) continue;

      const data = entry.entryData;

      // Map Balance (0.0-1.0) to a percentage-like metric
      // Suunto Balance is similar to Body Battery, so we can map it
      if (data.Balance !== undefined && data.Balance !== null) {
        // Convert 0.0-1.0 to 0-100 scale
        const balancePercent = data.Balance * 100;
        // We don't have a direct equivalent, but we can use BODY_BATTERY_CHARGED as approximation
        this.pushMetric(
          metrics,
          METRIC_TYPE.BODY_BATTERY_CHARGED,
          date,
          balancePercent,
        );
      }

      // Map StressState (0=Invalid, 1=Relaxing, 2=Active, 3=Passive, 4=Stressful)
      // We can map this to stress metrics, but Suunto doesn't provide stress levels like Garmin
      // So we'll skip stress mapping for now
    }

    return metrics;
  }

  /**
   * Save metrics to database
   */
  private async saveMetrics(
    athleteId: number,
    metrics: MetricRecord[],
  ): Promise<void> {
    const validMetrics = metrics.filter(
      (metric) =>
        metric.date instanceof Date &&
        !Number.isNaN(metric.date.getTime()) &&
        Number.isFinite(metric.value),
    );

    if (validMetrics.length === 0) {
      return;
    }

    await this.prisma.$transaction(
      validMetrics.map((metric) =>
        this.prisma.athlete_metric.upsert({
          where: {
            athlete_id_type_date: {
              athlete_id: athleteId,
              type: metric.type as unknown as metric_type,
              date: metric.date,
            },
          },
          create: {
            athlete_id: athleteId,
            type: metric.type as unknown as metric_type,
            date: metric.date,
            value: metric.value,
          },
          update: {
            value: metric.value,
          },
        }),
      ),
    );
  }

  /**
   * Sync metrics from Suunto 247 Data API
   */
  async syncMetrics(
    account: provider_account,
    startDate?: Date,
    endDate?: Date,
  ): Promise<void> {
    if (!account.import_metrics_enabled) {
      this.logger.debug(
        `Metrics import disabled for Suunto account ${account.provider_account_id}`,
      );
      return;
    }

    const end = endDate || new Date();
    const start =
      startDate ||
      new Date(
        end.getTime() - this.metricsSyncWindowDays * 24 * 60 * 60 * 1000,
      );

    this.logger.log(
      `Syncing Suunto metrics for account ${account.provider_account_id} from ${start.toISOString()} to ${end.toISOString()}`,
    );

    try {
      // Fetch all metric types in parallel
      const [aggregatedStats, activitySamples, sleepData, recoveryData] =
        await Promise.all([
          this.fetchDailyActivityStatistics(account, start, end).catch(
            (err) => {
              this.logger.warn(
                `Failed to fetch aggregated activity statistics: ${err instanceof Error ? err.message : String(err)}`,
              );
              return [];
            },
          ),
          this.fetchDailyActivitySamples(account, start, end).catch((err) => {
            this.logger.warn(
              `Failed to fetch activity samples: ${err instanceof Error ? err.message : String(err)}`,
            );
            return [];
          }),
          this.fetchSleepData(account, start, end).catch((err) => {
            this.logger.warn(
              `Failed to fetch sleep data: ${err instanceof Error ? err.message : String(err)}`,
            );
            return [];
          }),
          this.fetchRecoveryData(account, start, end).catch((err) => {
            this.logger.warn(
              `Failed to fetch recovery data: ${err instanceof Error ? err.message : String(err)}`,
            );
            return [];
          }),
        ]);

      // Map all data to metrics
      const allMetrics: MetricRecord[] = [
        ...this.mapAggregatedActivityToMetrics(aggregatedStats),
        ...this.mapDailyActivityEntriesToMetrics(activitySamples),
        ...this.mapSleepEntriesToMetrics(sleepData),
        ...this.mapRecoveryEntriesToMetrics(recoveryData),
      ];

      // Save metrics
      await this.saveMetrics(account.athlete_id, allMetrics);

      this.logger.log(
        `Successfully synced ${allMetrics.length} Suunto metrics for account ${account.provider_account_id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error syncing Suunto metrics for account ${account.provider_account_id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
