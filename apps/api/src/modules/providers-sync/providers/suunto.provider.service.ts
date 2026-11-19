import axios, { isAxiosError } from 'axios';
import { createHmac, timingSafeEqual } from 'node:crypto';

import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import {
  ActivitySegmentType,
  ConnectorProvider,
  EventActivity,
  EventType,
  MetricType,
  Prisma,
  ProviderAccount,
} from '@openathlete/database';
import { ActivityStream, ApiEnvSchemaType } from '@openathlete/shared';

import { streamUpdate } from 'src/modules/core/helpers/activity-corrections';

import { ActivityFileParserService } from '../../core/helpers/activity-file-parser.service';
import { FitFileSegment } from '../../core/helpers/activity-parser.interface';
import {
  calculateSegmentMetrics,
  toSegmentColumns,
} from '../../core/helpers/activity-segment';
import { compressActivityStream } from '../../core/helpers/activity-stream';
import {
  roundCadence,
  roundDistance,
  roundElevation,
  roundEnergy,
  roundHeartrate,
  roundMetricValue,
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
  FullImportOptions,
  FullImportResult,
  OAuthConfig,
  OAuthTokenResponse,
} from '../base';
import {
  ImportOptions,
  ImportResult,
  ImportedActivity,
  ProviderImportCapability,
} from '../base/provider-import.interface';
import { providerRedirectUri } from '../base/provider-urls';
import { InvalidRefreshTokenError } from '../errors/invalid-refresh-token.error';
import { ProviderRateLimitError } from '../errors/provider-rate-limit.error';
import {
  SuuntoMetricRecord,
  mapSuuntoActivitySamples,
  mapSuuntoDailyStatistics,
  mapSuuntoRecovery,
  mapSuuntoSleep,
} from '../mapping/suunto-health.mapper';

const DAY_MS = 24 * 60 * 60 * 1000;
const SUUNTO_RATE_LIMIT_RETRY_MS = 60_000;

/** Suunto error bodies come as JSON, text, or bytes for file downloads */
function suuntoErrorBody(data: unknown): string {
  if (data === undefined || data === null) return '';
  if (Buffer.isBuffer(data)) return data.toString('utf8');
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString('utf8');
  if (typeof data === 'string') return data;
  return JSON.stringify(data);
}

/**
 * How long to wait when Suunto refused a request for quota, or null. Its
 * gateway answers a spent quota with 401 "General auth Error" and a
 * "Rate limit is exceeded" body as often as with a 429: refreshing the token
 * cannot help, and doing it for every activity of an import makes it worse.
 */
export function suuntoRateLimitDelayMs(error: unknown): number | null {
  if (!isAxiosError(error) || !error.response) return null;
  const { status, headers, data } = error.response;
  const body = suuntoErrorBody(data);
  if (status !== 429 && !/rate ?limit/i.test(body)) return null;
  const retryAfter = Number.parseInt(
    String(headers?.['retry-after'] ?? ''),
    10,
  );
  if (Number.isFinite(retryAfter) && retryAfter > 0) return retryAfter * 1000;
  const inBody = /try again in (\d+) seconds?/i.exec(body);
  return inBody ? Number(inBody[1]) * 1000 : SUUNTO_RATE_LIMIT_RETRY_MS;
}

@Injectable()
export class SuuntoProviderService
  extends BaseProviderService
  implements ProviderImportCapability
{
  protected readonly provider = ConnectorProvider.SUUNTO;
  private readonly importWindowMs = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly metricsSyncWindowDays = 28; // Maximum fetch interval per Suunto API
  private static readonly workoutKeyAllowlist = /^[A-Za-z0-9_-]{1,128}$/;

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
   * Validate Suunto workoutKey used in outbound requests.
   * This prevents request manipulation / SSRF-style issues from untrusted input (e.g. webhook payloads).
   */
  private normalizeWorkoutKey(workoutKey: string): string {
    const normalized = workoutKey.trim();
    if (!SuuntoProviderService.workoutKeyAllowlist.test(normalized)) {
      throw new BadRequestException('Invalid Suunto workoutKey');
    }
    return normalized;
  }

  private getSuuntoWorkoutUrl(workoutKey: string): string {
    const key = this.normalizeWorkoutKey(workoutKey);
    return new URL(
      `/v3/workouts/${encodeURIComponent(key)}`,
      'https://cloudapi.suunto.com',
    ).toString();
  }

  private getSuuntoWorkoutFitUrl(workoutKey: string): string {
    const key = this.normalizeWorkoutKey(workoutKey);
    return new URL(
      `/v3/workouts/${encodeURIComponent(key)}/fit`,
      'https://cloudapi.suunto.com',
    ).toString();
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
    account: ProviderAccount,
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
      redirectUri: providerRedirectUri(
        this.configService.get('SUUNTO_REDIRECT_URI'),
        this.configService.get('APP_URL'),
        'suunto',
      ),
      scopes: [], // Suunto OAuth2 doesn't use scopes in authorization URL
    };
  }

  constructor(
    prisma: PrismaService,
    configService: ConfigService<ApiEnvSchemaType, true>,
    @Inject(forwardRef(() => QueueService))
    private readonly queueService: QueueService,
    private readonly activityFileParserService: ActivityFileParserService,
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
        // If it's a 401, the refresh token is invalid - let BaseProviderService.handle it
        // by throwing the error so it can mark the account as revoked
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
          payload.replaceAll('-', '+').replaceAll('_', '/'),
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
          payload.replaceAll('-', '+').replaceAll('_', '/'),
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
      // Suunto names the user, as its webhooks do, in the "user" claim
      const username =
        decoded.user ||
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
    account: ProviderAccount,
    requestFn: (accessToken: string) => Promise<T>,
  ): Promise<T> {
    // Always get fresh token from DB to ensure we have the latest
    const freshAccount = await this.prisma.providerAccount.findUnique({
      where: { providerAccountId: account.providerAccountId },
    });

    if (!freshAccount) {
      throw new Error(
        `Provider account ${account.providerAccountId} not found`,
      );
    }

    let accessToken: string;
    try {
      accessToken = await this.getValidAccessToken(freshAccount);
    } catch (error) {
      // If refresh token is invalid, don't retry the request
      if (error instanceof InvalidRefreshTokenError) {
        this.logger.error(
          `Cannot make authenticated request: refresh token invalid for Suunto account ${freshAccount.providerAccountId}`,
        );
        throw error;
      }
      throw error;
    }

    try {
      return await requestFn(accessToken);
    } catch (error) {
      // If it's an InvalidRefreshTokenError from refresh attempt, don't retry
      if (error instanceof InvalidRefreshTokenError) {
        throw error;
      }

      const rateLimitDelay = suuntoRateLimitDelayMs(error);
      if (rateLimitDelay !== null) {
        throw new ProviderRateLimitError('Suunto', rateLimitDelay);
      }

      if (
        isAxiosError(error) &&
        error.response?.status === 401 &&
        freshAccount.refreshToken &&
        freshAccount.status === 'active'
      ) {
        this.logger.debug(
          `Suunto token expired, refreshing for account ${freshAccount.providerAccountId}`,
        );

        let tokenResponse: OAuthTokenResponse;
        try {
          tokenResponse = await this.refreshAccessToken(
            freshAccount.refreshToken,
          );
        } catch (refreshError) {
          // If refresh fails with 401, mark account as revoked
          if (
            isAxiosError(refreshError) &&
            refreshError.response?.status === 401 &&
            freshAccount.status === 'active'
          ) {
            this.logger.warn(
              `Refresh token invalid for Suunto account ${freshAccount.providerAccountId} (athlete ${freshAccount.athleteId}), marking as revoked`,
            );

            await this.prisma.providerAccount.update({
              where: {
                providerAccountId: freshAccount.providerAccountId,
              },
              data: {
                status: 'revoked',
              },
            });

            throw new InvalidRefreshTokenError(
              'SUUNTO',
              freshAccount.providerAccountId,
              freshAccount.athleteId,
            );
          }
          throw refreshError;
        }

        // Suunto tokens are JWT, decode to get expiration
        const expiresAtMs = tokenResponse.expires_in
          ? Date.now() + (tokenResponse.expires_in - 600) * 1000
          : this.decodeJwtExpiration(tokenResponse.access_token);

        const expiresAt = expiresAtMs ? new Date(expiresAtMs) : null;

        const updatedAccount = await this.prisma.providerAccount.update({
          where: {
            providerAccountId: freshAccount.providerAccountId,
          },
          data: {
            accessToken: tokenResponse.access_token,
            refreshToken:
              tokenResponse.refresh_token ?? freshAccount.refreshToken,
            expiresAt: expiresAt,
          },
        });

        // Update the account object passed in
        account.accessToken = updatedAccount.accessToken;
        account.refreshToken = updatedAccount.refreshToken;
        account.expiresAt = updatedAccount.expiresAt;

        // Verify token format (should be a JWT with 3 parts separated by dots)
        const tokenParts = tokenResponse.access_token.split('.');
        if (tokenParts.length !== 3) {
          this.logger.error(
            `Suunto token format invalid: expected JWT format (3 parts), got ${tokenParts.length} parts`,
          );
        }

        this.logger.debug(
          `Suunto token refreshed successfully for account ${freshAccount.providerAccountId}, retrying request with new token (length: ${tokenResponse.access_token.length}, format: ${tokenParts.length === 3 ? 'JWT' : 'INVALID'})`,
        );

        // Small delay to ensure token is propagated (some APIs need a moment)
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Use the new access token from the refresh response
        try {
          const result = await requestFn(tokenResponse.access_token);
          this.logger.debug(
            `Suunto request succeeded after token refresh for account ${freshAccount.providerAccountId}`,
          );
          return result;
        } catch (retryError) {
          const retryDelay = suuntoRateLimitDelayMs(retryError);
          if (retryDelay !== null) {
            throw new ProviderRateLimitError('Suunto', retryDelay);
          }
          if (isAxiosError(retryError)) {
            this.logger.error(
              `Suunto request failed after token refresh: ${retryError.response?.status} ${retryError.response?.statusText} - ${suuntoErrorBody(retryError.response?.data).slice(0, 300)}`,
            );
          }
          throw retryError;
        }
      }

      // Log error details for debugging
      if (isAxiosError(error)) {
        this.logger.error(
          `Suunto API request failed: ${error.response?.status} ${error.response?.statusText} - ${suuntoErrorBody(error.response?.data).slice(0, 300)}`,
        );
      }

      throw error;
    }
  }

  /**
   * Import activities from Suunto
   */
  async importActivities(
    account: ProviderAccount,
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
              // 403 (a revoked access, a wrong subscription key) is an
              // error to see, not an empty history
              if (isAxiosError(error) && error.response?.status === 400) {
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

        const activity = this.toImportedActivity(workout);

        // Listed by modification time: keep those that started in range
        if (options?.startDate && activity.startDate < options.startDate) {
          continue;
        }
        if (options?.endDate && activity.startDate > options.endDate) continue;

        activities.push(activity);
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
    account: ProviderAccount,
    activity: ImportedActivity,
  ): Promise<ImportResult> {
    const workout = activity.raw as SuuntoLimitedWorkout;
    const existing = await this.prisma.eventActivity.findFirst({
      where: {
        provider: ConnectorProvider.SUUNTO,
        externalId: activity.externalId,
      },
    });
    // Saved, but its FIT file failed last time: try the file again
    const missingStream =
      existing &&
      (!existing.stream || Object.keys(existing.stream as object).length === 0);
    if (existing && !missingStream) {
      return { activity: existing, created: false };
    }

    const savedActivity =
      existing ??
      (await this.saveSuuntoActivity(account.athleteId, activity, workout));

    try {
      await this.processActivityFile(
        account,
        savedActivity,
        workout.workoutKey,
      );
    } catch (error) {
      // Out of quota: the job waits and tries the file again, since a saved
      // activity without streams is retried by its next import
      if (error instanceof ProviderRateLimitError) throw error;
      // The summary is saved: the activity shows without its streams
      this.logger.warn(
        `Failed to import the FIT file of Suunto workout ${workout.workoutKey}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return { activity: savedActivity, created: !existing };
  }

  /**
   * Fetch and save Suunto activity data
   */
  private async saveSuuntoActivity(
    athleteId: number,
    activity: ImportedActivity,
    workout: SuuntoLimitedWorkout,
  ): Promise<EventActivity> {
    const activityStream: ActivityStream = {};
    const compressedActivityStream = compressActivityStream(activityStream);
    const sport = mapSuuntoWorkoutToSportType(workout);

    // Suunto avgSpeed and maxSpeed are already in m/s (not km/h)
    // If not available, calculate from distance and time
    let avgSpeedMps: number | undefined = workout.avgSpeed;
    const maxSpeedMps: number | undefined = workout.maxSpeed;

    // Fallback: calculate average speed from distance and time if not provided
    if (
      !avgSpeedMps &&
      workout.totalDistance &&
      workout.totalTime &&
      workout.totalTime > 0
    ) {
      avgSpeedMps = workout.totalDistance / workout.totalTime;
    }

    // If avgPace is available (in min/km), convert to m/s as fallback
    if (!avgSpeedMps && workout.avgPace && workout.avgPace > 0) {
      // Convert min/km to m/s: pace (min/km) -> speed (m/s) = 1000 / (pace * 60)
      avgSpeedMps = 1000 / (workout.avgPace * 60);
    }

    // Extract cadence (could be in extensions)
    let averageCadence: number | undefined;
    if (workout.cadence?.avg !== undefined) {
      averageCadence = roundCadence(workout.cadence.avg) ?? undefined;
    }

    const savedActivity = await this.prisma.eventActivity.create({
      data: {
        provider: ConnectorProvider.SUUNTO,
        distance: roundDistance(workout.totalDistance || 0),
        elevationGain: roundElevation(workout.totalAscent || 0),
        // Suunto counts seconds with decimals; the column holds whole ones
        movingTime: Math.round(workout.totalTime || 0),
        averageSpeed: avgSpeedMps ? (roundSpeed(avgSpeedMps) ?? 0) : 0,
        maxSpeed: maxSpeedMps ? (roundSpeed(maxSpeedMps) ?? 0) : 0,
        averageCadence: averageCadence,
        averageHeartrate: workout.hrdata
          ? roundHeartrate(workout.hrdata.workoutAvgHR)
          : undefined,
        maxHeartrate: workout.hrdata
          ? roundHeartrate(workout.hrdata.workoutMaxHR)
          : undefined,
        kilojoules: workout.energyConsumption
          ? roundEnergy(workout.energyConsumption * 4.184)
          : undefined,
        sport,
        stream: compressedActivityStream as object,
        externalId: workout.workoutKey,
        // Created with the activity, so a failure leaves no empty event
        event: {
          create: {
            athleteId,
            name: activity.name,
            type: EventType.ACTIVITY,
            startDate: activity.startDate,
            endDate: activity.endDate,
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
    account: ProviderAccount,
    activity: EventActivity,
    workoutKey: string,
  ): Promise<void> {
    try {
      const response = await this.makeAuthenticatedRequest(
        account,
        async (accessToken) => {
          const headers = this.getWorkoutApiHeaders(accessToken);
          headers.Accept = 'application/octet-stream';

          return axios.get<ArrayBuffer>(
            this.getSuuntoWorkoutFitUrl(workoutKey),
            {
              headers,
              responseType: 'arraybuffer',
              timeout: 60000,
            },
          );
        },
      );

      const parseResult = await this.activityFileParserService.parseByFileType(
        response.data,
        'FIT',
      );
      if (!parseResult.stream) {
        return;
      }

      const compressedStream = compressActivityStream(parseResult.stream);

      await this.prisma.eventActivity.update({
        where: {
          eventActivityId: activity.eventActivityId,
        },
        // A corrected activity keeps its corrections over the new recording
        data: await streamUpdate(
          this.prisma,
          activity.eventActivityId,
          compressedStream,
        ),
      });

      // Sync segments from FIT file if available
      if (
        parseResult.segments?.length &&
        Object.keys(parseResult.stream).length > 0
      ) {
        await this.syncSegmentsFromFit(
          activity.eventActivityId,
          parseResult.segments,
          parseResult.stream,
        );
      }
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        // FIT file not available, skip
        return;
      }
      throw error;
    }
  }

  /**
   * Sync activity segments from FIT file parsing results
   * Similar to Garmin's implementation
   */
  private async syncSegmentsFromFit(
    eventActivityId: number,
    segments: FitFileSegment[],
    stream: ActivityStream,
  ): Promise<void> {
    if (!segments.length || !stream?.time?.length) {
      return;
    }

    const segmentsData: Prisma.ActivitySegmentCreateManyInput[] = [];

    segments.forEach((segment, index) => {
      if (segment.endTimeSeconds <= segment.startTimeSeconds) {
        return;
      }

      const metrics = calculateSegmentMetrics(
        stream,
        segment.startTimeSeconds,
        segment.endTimeSeconds,
      );

      segmentsData.push({
        segmentType: ActivitySegmentType.LAP,
        name: segment.name ?? `Lap ${index + 1}`,
        orderIndex: index,
        startTimeSeconds: Math.round(segment.startTimeSeconds),
        endTimeSeconds: Math.round(segment.endTimeSeconds),
        ...toSegmentColumns(metrics),
        eventActivityId: eventActivityId,
      });
    });

    if (!segmentsData.length) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.activitySegment.deleteMany({
        where: { eventActivityId: eventActivityId },
      });
      await tx.activitySegment.createMany({
        data: segmentsData,
      });
    });
  }

  /**
   * Queue activities for import
   */
  private async enqueueActivities(
    account: ProviderAccount,
    activities: ImportedActivity[],
  ): Promise<number> {
    if (activities.length === 0) {
      return 0;
    }

    const existingExternalIds = await this.prisma.eventActivity.findMany({
      where: {
        externalId: {
          in: activities.map((a) => a.externalId),
        },
      },
      select: {
        externalId: true,
      },
    });

    const existingIdsSet = new Set(
      existingExternalIds.map((a) => a.externalId),
    );

    const newActivities = activities.filter(
      (a) => !existingIdsSet.has(a.externalId),
    );

    if (newActivities.length === 0) {
      this.logger.log(
        `No new Suunto activities to queue for account ${account.providerAccountId}`,
      );
      return 0;
    }

    await this.queueService.addActivityImportJobs(account, newActivities, true);
    return newActivities.length;
  }

  /**
   * Queue the import of the activity history: all of it, as the workout
   * list has no time limit (`since` defaults to 0), or the activities since
   * `since` when the user asked for the last months only.
   */
  async queueFullImport(
    account: ProviderAccount,
    { since }: FullImportOptions = {},
  ): Promise<FullImportResult> {
    const endDate = new Date();
    const startDate = since ?? new Date(0);
    const partial = since ? { partial: true } : {};

    if (account.importMetricsEnabled) {
      // The 24/7 history Suunto serves, from the day after the first, which
      // the sync leaves out as incomplete
      await this.queueService.addSuuntoMetricsJob(
        account.providerAccountId,
        endDate.getTime() - this.metricsSyncWindowDays * DAY_MS,
        0,
      );
    }

    try {
      const activities = await this.importActivities(account, {
        startDate,
        endDate,
      });

      if (activities.length === 0) {
        return { queuedActivities: 0, ...partial };
      }

      const queued = await this.enqueueActivities(account, activities);

      return {
        queuedActivities: queued,
        backfillRequested: false,
        ...partial,
      };
    } catch (error) {
      const errorName =
        error instanceof Error ? error.constructor.name : 'Unknown';
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error in queueFullImport for account ${account.providerAccountId}: ${errorName}: ${errorMessage}`,
      );
      throw new BadRequestException(
        `Failed to queue Suunto activities: ${errorMessage}`,
      );
    }
  }

  /**
   * Whether a webhook comes from Suunto: its X-HMAC-SHA256-Signature header
   * is the hex HMAC-SHA256 of the body, keyed with the app's notification
   * secret. Without SUUNTO_WEBHOOK_SECRET nothing can be checked, and the
   * webhook is accepted as before.
   */
  verifyWebhookSignature(
    rawBody: Buffer | undefined,
    signature: string | undefined,
  ): boolean {
    const secret = this.configService.get('SUUNTO_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.warn(
        'SUUNTO_WEBHOOK_SECRET is not set: Suunto webhook accepted unverified',
      );
      return true;
    }
    if (!rawBody || !signature) return false;
    const expected = createHmac('sha256', secret).update(rawBody).digest();
    const received = Buffer.from(signature.trim(), 'hex');
    return (
      received.length === expected.length && timingSafeEqual(received, expected)
    );
  }

  /**
   * Handle a Suunto webhook. Suunto waits 2 seconds for the answer and pauses
   * every notification of the app after too many failures, so the work is
   * queued.
   */
  async handleWebhook(payload: SuuntoWebhookPayload): Promise<void> {
    const username = payload.username?.trim() || null;

    if (payload.type?.startsWith('SUUNTO_247_')) {
      if (!username) return;
      const account = await this.findAccountByUsername(username);
      if (!account?.importMetricsEnabled) return;
      const times = (payload.samples ?? [])
        .map((sample) => Date.parse(sample.timestamp))
        .filter(Number.isFinite);
      if (times.length === 0) return;
      // The samples are a part of a day: sync the whole days they belong
      // to, from the day before, which the sync leaves out as incomplete
      const from = Math.max(
        Date.now() - this.metricsSyncWindowDays * DAY_MS,
        Math.min(...times) - DAY_MS,
      );
      await this.queueService.addSuuntoMetricsJob(
        account.providerAccountId,
        from,
      );
      return;
    }

    // JSON notifications carry the workout, legacy form ones its key
    const workoutKey = (
      payload.workout?.workoutKey ??
      payload.workoutKey ??
      payload.workoutid
    )?.trim();
    // Route notifications have none
    if (!workoutKey) return;
    if (!SuuntoProviderService.workoutKeyAllowlist.test(workoutKey)) {
      this.logger.warn('Suunto webhook with an invalid workout key, ignored');
      return;
    }
    await this.queueService.addSuuntoWorkoutJob(username, workoutKey);
  }

  /** Queue the import of a workout a webhook announced */
  async processWorkoutNotification(
    username: string | null,
    workoutKey: string,
  ): Promise<void> {
    const account = username
      ? await this.findAccountByUsername(username)
      : null;
    if (!account) {
      this.logger.warn(
        `Suunto workout ${workoutKey}: no active account for its user`,
      );
      return;
    }
    if (!account.importActivitiesEnabled) return;

    const existing = await this.prisma.eventActivity.findFirst({
      where: { provider: ConnectorProvider.SUUNTO, externalId: workoutKey },
      select: { eventActivityId: true },
    });
    if (existing) return;

    const { payload: workout, error } =
      await this.makeAuthenticatedRequest<SuuntoWorkoutResponse>(
        account,
        async (accessToken) => {
          const { data } = await axios.get<SuuntoWorkoutResponse>(
            this.getSuuntoWorkoutUrl(workoutKey),
            {
              headers: this.getWorkoutApiHeaders(accessToken),
              timeout: 15000,
            },
          );
          return data;
        },
      );
    if (error || !workout) {
      throw new Error(
        `Suunto workout ${workoutKey} could not be fetched: ${error?.description ?? 'no workout'}`,
      );
    }

    await this.queueService.addActivityImportJobs(
      account,
      [this.toImportedActivity(workout)],
      false,
    );
  }

  private toImportedActivity(workout: SuuntoLimitedWorkout): ImportedActivity {
    const startDate = new Date(workout.startTime);
    return {
      externalId: workout.workoutKey,
      name: workout.workoutName || `Suunto Workout ${workout.workoutKey}`,
      startDate,
      endDate: workout.stopTime
        ? new Date(workout.stopTime)
        : new Date(startDate.getTime() + workout.totalTime * 1000),
      sport: mapSuuntoWorkoutToSportType(workout).toString(),
      distance: workout.totalDistance,
      duration: workout.totalTime,
      raw: workout,
    };
  }

  /**
   * The active account of a Suunto username. Accounts connected before the
   * username was read from the token's "user" claim saved another value or
   * none: their token still names the user, and the username is saved once
   * found.
   */
  private async findAccountByUsername(
    username: string,
  ): Promise<ProviderAccount | null> {
    const account = await this.prisma.providerAccount.findFirst({
      where: {
        provider: ConnectorProvider.SUUNTO,
        externalUserId: username,
        status: 'active',
      },
    });
    if (account) return account;

    const candidates = await this.prisma.providerAccount.findMany({
      where: { provider: ConnectorProvider.SUUNTO, status: 'active' },
    });
    const owner = candidates.find(
      (candidate) =>
        this.decodeJwtUserInfo(candidate.accessToken).username === username,
    );
    if (!owner) return null;
    return this.prisma.providerAccount.update({
      where: { providerAccountId: owner.providerAccountId },
      data: { externalUserId: username },
    });
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
    account: ProviderAccount,
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
    account: ProviderAccount,
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
    account: ProviderAccount,
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
    account: ProviderAccount,
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
   * Save metrics to database
   */
  private async saveMetrics(
    athleteId: number,
    metrics: SuuntoMetricRecord[],
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
        this.prisma.athleteMetric.upsert({
          where: {
            athleteId_type_date: {
              athleteId: athleteId,
              type: metric.type as unknown as MetricType,
              date: metric.date,
            },
          },
          create: {
            athleteId: athleteId,
            type: metric.type as unknown as MetricType,
            date: metric.date,
            value: roundMetricValue(metric.value),
            source: 'SUUNTO',
          },
          update: {
            value: roundMetricValue(metric.value),
            source: 'SUUNTO',
          },
        }),
      ),
    );
  }

  /** Sync an account's 24/7 data from a day up to now */
  async syncAccountMetrics(providerAccountId: number, from: Date) {
    const account = await this.prisma.providerAccount.findUnique({
      where: { providerAccountId },
    });
    if (account?.status !== 'active') return;
    await this.syncMetrics(account, from);
  }

  /**
   * Sync the 24/7 data from Suunto. The day "start" falls in is left out as
   * incomplete. Suunto serves 28 days per request at most.
   */
  async syncMetrics(
    account: ProviderAccount,
    startDate?: Date,
    endDate?: Date,
  ): Promise<void> {
    if (!account.importMetricsEnabled) return;

    const end = endDate ?? new Date();
    const earliest = end.getTime() - this.metricsSyncWindowDays * DAY_MS;
    const start = new Date(
      Math.max(startDate?.getTime() ?? earliest, earliest),
    );
    const from = start.getTime();

    // One failing endpoint (a watch without sleep tracking...) leaves the
    // others; a failure of them all, like an expired account, is retried
    const failures: unknown[] = [];
    const safely = <T>(request: Promise<T[]>): Promise<T[]> =>
      request.catch((error: unknown) => {
        failures.push(error);
        this.logger.warn(
          `Suunto 24/7 request failed for account ${account.providerAccountId}: ${error instanceof Error ? error.message : String(error)}`,
        );
        return [];
      });

    const [statistics, samples, sleep, recovery] = await Promise.all([
      safely(this.fetchDailyActivityStatistics(account, start, end)),
      safely(this.fetchDailyActivitySamples(account, start, end)),
      safely(this.fetchSleepData(account, start, end)),
      safely(this.fetchRecoveryData(account, start, end)),
    ]);
    if (failures.length === 4) throw failures[0];

    const metrics = [
      ...mapSuuntoDailyStatistics(statistics, from),
      ...mapSuuntoActivitySamples(samples, from),
      ...mapSuuntoSleep(sleep),
      ...mapSuuntoRecovery(recovery, from),
    ];
    await this.saveMetrics(account.athleteId, metrics);
    this.logger.log(
      `Synced ${metrics.length} Suunto metrics for account ${account.providerAccountId}`,
    );
  }

  /**
   * Suunto sends 24/7 webhooks only for what a watch syncs: a daily pass
   * catches the rest, as Suunto advises.
   */
  @Cron('40 4 * * *', { timeZone: 'UTC' })
  async queueDailyMetricsSync(): Promise<void> {
    // The API and the worker run the same image: one of them queues
    if (this.configService.get('ENABLE_ACTIVITY_IMPORT') !== true) return;
    const accounts = await this.prisma.providerAccount.findMany({
      where: {
        provider: ConnectorProvider.SUUNTO,
        status: 'active',
        importMetricsEnabled: true,
      },
      select: { providerAccountId: true },
    });
    const from = Date.now() - 3 * DAY_MS;
    for (const [index, account] of accounts.entries()) {
      // Spread the requests over an hour
      await this.queueService.addSuuntoMetricsJob(
        account.providerAccountId,
        from,
        Math.round((index / Math.max(1, accounts.length)) * 3_600_000) + 60_000,
      );
    }
  }
}
