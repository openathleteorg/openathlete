import axios, { isAxiosError } from 'axios';
import Redis from 'ioredis';
import { createHash, randomBytes } from 'node:crypto';

import {
  BadRequestException,
  Inject,
  Injectable,
  OnModuleDestroy,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ConnectorProvider,
  EventActivity,
  EventType,
  MetricType,
  ProviderAccount,
} from '@openathlete/database';
import { ApiEnvSchemaType } from '@openathlete/shared';

import { streamUpdate } from 'src/modules/core/helpers/activity-corrections';

import { ActivityFileParserService } from '../../core/helpers/activity-file-parser.service';
import { compressActivityStream } from '../../core/helpers/activity-stream';
import { buildFitActivityDetails } from '../../core/helpers/fit-activity-details';
import { mapGarminActivityType } from '../../core/helpers/garmin';
import {
  roundCadence,
  roundDistance,
  roundElevation,
  roundEnergy,
  roundHeartrate,
  roundMetricValue,
  roundSpeed,
} from '../../core/helpers/round-activity-values';
import type {
  GarminActivityFileNotification,
  GarminActivitySummary,
  GarminBloodPressureSummary,
  GarminBodyCompositionSummary,
  GarminDailySummary,
  GarminDeregistration,
  GarminHealthSnapshotSummary,
  GarminHrvSummary,
  GarminPulseOxSummary,
  GarminRespirationSummary,
  GarminSkinTempSummary,
  GarminSleepSummary,
  GarminUserMetricsSummary,
  GarminUserPermissionsChange,
} from '../../core/types/connector';
import { PrismaService } from '../../prisma/services/prisma.service';
import {
  GarminNotificationJobData,
  QueueService,
} from '../../queue/queue.service';
import {
  BaseProviderService,
  FullImportResult,
  OAuthConfig,
  OAuthTokenResponse,
  isRefreshTokenRejected,
} from '../base';
import {
  ImportResult,
  ImportedActivity,
  ProviderImportCapability,
} from '../base';
import { providerRedirectUri } from '../base/provider-urls';
import { InvalidRefreshTokenError } from '../errors/invalid-refresh-token.error';
import { ProviderRateLimitError } from '../errors/provider-rate-limit.error';
import {
  GarminDailyPartial,
  GarminMetricRecord,
  aggregateGarminPartials,
  garminPulseOxPartials,
  garminRespirationPartials,
  mapGarminBloodPressures,
  mapGarminBodyComps,
  mapGarminDailies,
  mapGarminHealthSnapshots,
  mapGarminHrv,
  mapGarminSkinTemps,
  mapGarminSleeps,
  mapGarminUserMetrics,
} from '../mapping/garmin-health.mapper';

const GARMIN_API_HOST = 'apis.garmin.com';
const GARMIN_USER_API = `https://${GARMIN_API_HOST}/partner-gateway/rest/user`;

/** Permissions a Garmin user grants, stored in `scopes` with this prefix */
const PERMISSIONS_PREFIX = 'permissions:';

/** Activity summary types: both carry activity summaries */
const ACTIVITY_SUMMARY_TYPES = new Set([
  'activities',
  'manuallyUpdatedActivities',
]);

/**
 * Summary types that are answered (pulled) without being saved: epochs are
 * already aggregated in dailies, activity details duplicate the activity
 * file, and Move IQ events are not workouts. Their pushed data is dropped
 * before queueing, as it can weigh megabytes.
 */
const ANSWER_ONLY_TYPES = new Set([
  'epochs',
  'activityDetails',
  'moveIQActivities',
  'stressDetails',
  'mct',
]);

/** Daily partials stay long enough for Garmin's late updates */
const DAILY_PARTIALS_TTL_SECONDS = 14 * 24 * 3600;

interface Summary {
  [field: string]: unknown;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Garmin explains its 4xx in { errorMessage } */
function garminErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) return String(error);
  const data: unknown = error.response?.data;
  if (isObject(data) && typeof data.errorMessage === 'string') {
    return data.errorMessage;
  }
  // OAuth errors: invalid_grant says more than the status
  if (isObject(data) && typeof data.error === 'string') {
    return `${error.message}: ${data.error}`;
  }
  // Activity files are requested as binary, so is their error body
  if (data instanceof ArrayBuffer || Buffer.isBuffer(data)) {
    return Buffer.from(data as ArrayBuffer)
      .toString('utf8')
      .slice(0, 300);
  }
  return error.message;
}

/**
 * Reads the end timestamp (in seconds) of the conflicting backfill window
 * from Garmin's 409 message:
 * `[<uuid>]duplicate backfill processed at ... [<start> to <end>]`
 */
function parseBackfillConflictEnd(message: string): number | null {
  const match = message.match(
    /\bto\s+(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/i,
  );
  if (!match) return null;
  const parsed = Date.parse(match[1]);
  return Number.isNaN(parsed) ? null : Math.floor(parsed / 1000);
}

export function parseGarminPermissions(
  scopes?: string | null,
): string[] | null {
  if (!scopes?.startsWith(PERMISSIONS_PREFIX)) return null;
  return scopes.slice(PERMISSIONS_PREFIX.length).split(' ').filter(Boolean);
}

export function formatGarminPermissions(permissions: string[]): string {
  return `${PERMISSIONS_PREFIX}${permissions.join(' ')}`;
}

/**
 * Splits a Garmin webhook body into one job per entry. Garmin sends every
 * summary type to its configured URL, as `{ "<summaryType>": [entries] }`,
 * with a callback URL (ping) or the data itself (push).
 */
export function parseGarminNotifications(
  body: unknown,
): GarminNotificationJobData[] {
  if (!isObject(body)) return [];
  const notifications: GarminNotificationJobData[] = [];
  for (const [summaryType, entries] of Object.entries(body)) {
    if (
      !Array.isArray(entries) ||
      summaryType === 'deregistrations' ||
      summaryType === 'userPermissionsChange'
    ) {
      continue;
    }
    for (const entry of entries) {
      if (!isObject(entry) || typeof entry.userId !== 'string') continue;
      const callbackURL =
        typeof entry.callbackURL === 'string' ? entry.callbackURL : undefined;
      notifications.push({
        summaryType,
        userId: entry.userId,
        callbackURL,
        entry: callbackURL || !ANSWER_ONLY_TYPES.has(summaryType) ? entry : {},
      });
    }
  }
  return notifications;
}

/** Garmin activity summary to the activity the import job saves */
export function toImportedGarminActivity(
  activity: GarminActivitySummary,
): ImportedActivity | null {
  const externalId = activity.activityId ?? activity.summaryId;
  if (
    externalId === undefined ||
    externalId === null ||
    !Number.isFinite(activity.startTimeInSeconds)
  ) {
    return null;
  }
  // Timestamps are UTC; startTimeOffsetInSeconds only gives the device's
  // local time, which the app derives from the athlete's time zone
  const startDate = new Date(activity.startTimeInSeconds * 1000);
  return {
    externalId: String(externalId),
    name: activity.activityName || '',
    startDate,
    endDate: new Date(
      startDate.getTime() + (activity.durationInSeconds ?? 0) * 1000,
    ),
    sport: mapGarminActivityType(activity.activityType),
    distance: activity.distanceInMeters,
    duration: activity.durationInSeconds,
    raw: activity,
  };
}

function activityMetrics(summary: GarminActivitySummary) {
  const cadence =
    summary.averageBikeCadenceInRoundsPerMinute ??
    summary.averageRunCadenceInStepsPerMinute ??
    summary.averageSwimCadenceInStrokesPerMinute;
  return {
    distance: roundDistance(summary.distanceInMeters || 0),
    elevationGain: roundElevation(summary.totalElevationGainInMeters || 0),
    movingTime: summary.durationInSeconds ?? 0,
    averageSpeed: roundSpeed(summary.averageSpeedInMetersPerSecond || 0) ?? 0,
    maxSpeed: roundSpeed(summary.maxSpeedInMetersPerSecond || 0) ?? 0,
    averageCadence:
      cadence === undefined ? undefined : (roundCadence(cadence) ?? undefined),
    averageHeartrate: roundHeartrate(summary.averageHeartRateInBeatsPerMinute),
    maxHeartrate: roundHeartrate(summary.maxHeartRateInBeatsPerMinute),
    kilojoules: summary.activeKilocalories
      ? roundEnergy(summary.activeKilocalories * 4.184)
      : undefined,
    sport: mapGarminActivityType(summary.activityType),
  };
}

@Injectable()
export class GarminProviderService
  extends BaseProviderService
  implements ProviderImportCapability, OnModuleDestroy
{
  protected readonly provider = ConnectorProvider.GARMIN;
  private readonly backfillWindowMs = 30 * 24 * 60 * 60 * 1000;
  private redis: Redis | null = null;

  constructor(
    prisma: PrismaService,
    configService: ConfigService<ApiEnvSchemaType, true>,
    @Inject(forwardRef(() => QueueService))
    private readonly queueService: QueueService,
    private readonly activityFileParserService: ActivityFileParserService,
  ) {
    super(prisma, configService);
  }

  async onModuleDestroy() {
    await this.redis?.quit().catch(() => undefined);
  }

  protected get oauthConfig(): OAuthConfig {
    return {
      authorizationUrl: 'https://connect.garmin.com/oauth2Confirm',
      tokenUrl: 'https://diauth.garmin.com/di-oauth2-service/oauth/token',
      clientId: this.configService.get('GARMIN_CLIENT_ID') || '',
      clientSecret: this.configService.get('GARMIN_CLIENT_SECRET') || '',
      redirectUri: providerRedirectUri(
        this.configService.get('GARMIN_REDIRECT_URI'),
        this.configService.get('APP_URL'),
        'garmin',
      ),
      scopes: [],
    };
  }

  private getRedis(): Redis {
    if (!this.redis) {
      const redisUrl = this.configService.get('REDIS_URL');
      this.redis = redisUrl
        ? new Redis(redisUrl, { maxRetriesPerRequest: null })
        : new Redis({
            host: 'localhost',
            port: 6379,
            maxRetriesPerRequest: null,
          });
    }
    return this.redis;
  }

  // ---------------------------------------------------------------------------
  // OAuth 2.0 with PKCE
  // ---------------------------------------------------------------------------

  getAuthorizationUriWithPKCE(state?: string): {
    uri: string;
    codeVerifier: string;
  } {
    const codeVerifier = randomBytes(32).toString('base64url');
    const challenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.oauthConfig.clientId,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      ...(this.oauthConfig.redirectUri && {
        redirect_uri: this.oauthConfig.redirectUri,
      }),
      ...(state && { state }),
    });
    return {
      uri: `${this.oauthConfig.authorizationUrl}?${params.toString()}`,
      codeVerifier,
    };
  }

  override getAuthorizationUri(state?: string): string {
    return this.getAuthorizationUriWithPKCE(state).uri;
  }

  override async exchangeCodeForTokens(
    code: string,
    codeVerifier?: string,
  ): Promise<OAuthTokenResponse> {
    if (!codeVerifier) {
      throw new BadRequestException(
        'PKCE code_verifier is required for Garmin OAuth token exchange',
      );
    }
    return this.requestToken({
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
      ...(this.oauthConfig.redirectUri && {
        redirect_uri: this.oauthConfig.redirectUri,
      }),
    });
  }

  override async refreshAccessToken(
    refreshToken: string,
  ): Promise<OAuthTokenResponse> {
    return this.requestToken({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
  }

  private async requestToken(
    params: Record<string, string>,
  ): Promise<OAuthTokenResponse> {
    const { data } = await axios.post<OAuthTokenResponse>(
      this.oauthConfig.tokenUrl,
      new URLSearchParams({
        client_id: this.oauthConfig.clientId,
        client_secret: this.oauthConfig.clientSecret,
        ...params,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000,
      },
    );
    return data;
  }

  /**
   * Garmin access tokens last 24 hours. They are refreshed ten minutes early,
   * so a request never fails on an expired token: a 401 followed by a retry
   * would count as an extra, unprompted pull.
   */
  private expiryFromNow(expiresIn?: number): Date | null {
    return expiresIn
      ? new Date(Date.now() + Math.max(0, expiresIn - 600) * 1000)
      : null;
  }

  override async saveProviderAccount(params: {
    athleteId: number;
    accessToken: string;
    refreshToken: string;
    expiresIn?: number;
    scopes?: string;
    externalUserId?: string;
  }): Promise<ProviderAccount> {
    return super.saveProviderAccount({
      ...params,
      expiresIn: params.expiresIn
        ? Math.max(0, params.expiresIn - 600)
        : undefined,
    });
  }

  override async getValidAccessToken(
    account: ProviderAccount,
  ): Promise<string> {
    if (
      account.accessToken &&
      account.expiresAt &&
      Date.now() < account.expiresAt.getTime() - 60_000
    ) {
      return account.accessToken;
    }

    // Another job may have refreshed it meanwhile: Garmin rotates refresh
    // tokens, so refreshing again with the old one would fail
    const stored = await this.prisma.providerAccount.findUnique({
      where: { providerAccountId: account.providerAccountId },
    });
    if (
      stored?.accessToken &&
      stored.expiresAt &&
      Date.now() < stored.expiresAt.getTime() - 60_000
    ) {
      Object.assign(account, stored);
      return stored.accessToken;
    }

    const refreshToken = stored?.refreshToken ?? account.refreshToken;
    if (!refreshToken) {
      throw new Error(`No refresh token available for ${this.provider}`);
    }

    const tokenResponse = await this.refreshAccessToken(refreshToken);
    const updated = await this.prisma.providerAccount.update({
      where: { providerAccountId: account.providerAccountId },
      data: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token ?? refreshToken,
        expiresAt: this.expiryFromNow(tokenResponse.expires_in),
      },
    });
    Object.assign(account, updated);
    return tokenResponse.access_token;
  }

  // ---------------------------------------------------------------------------
  // User endpoints
  // ---------------------------------------------------------------------------

  async getUserId(accessToken: string): Promise<string | null> {
    try {
      const { data } = await axios.get<{ userId?: string }>(
        `${GARMIN_USER_API}/id`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 15000,
        },
      );
      return data.userId || null;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getUserPermissions(accessToken: string): Promise<string[]> {
    const { data } = await axios.get<unknown>(
      `${GARMIN_USER_API}/permissions`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 15000,
      },
    );
    if (Array.isArray(data)) {
      return data.filter((item): item is string => typeof item === 'string');
    }
    if (isObject(data) && Array.isArray(data.permissions)) {
      return data.permissions.filter(
        (item): item is string => typeof item === 'string',
      );
    }
    return [];
  }

  /**
   * The user's Garmin permissions. They are stored at connection and kept
   * up to date by the user permissions webhook, so exports don't spend an
   * API call on them each time.
   */
  async getAccountPermissions(account: ProviderAccount): Promise<string[]> {
    const stored = parseGarminPermissions(account.scopes);
    if (stored) return stored;

    const permissions = await this.getUserPermissions(
      await this.getValidAccessToken(account),
    );
    await this.prisma.providerAccount.update({
      where: { providerAccountId: account.providerAccountId },
      data: { scopes: formatGarminPermissions(permissions) },
    });
    account.scopes = formatGarminPermissions(permissions);
    return permissions;
  }

  /**
   * Removes the user's registration, so Garmin stops sending their data.
   * Garmin requires it whenever the user disconnects or deletes their
   * account here.
   */
  async deleteUserRegistration(account: ProviderAccount): Promise<void> {
    // getValidAccessToken refuses a revoked account, which stays registered
    // at Garmin until this call
    const accessToken =
      account.status !== 'active' && account.refreshToken
        ? (await this.refreshAccessToken(account.refreshToken)).access_token
        : await this.getValidAccessToken(account);
    try {
      await axios.delete(`${GARMIN_USER_API}/registration`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 15000,
      });
    } catch (error) {
      // Already deregistered
      if (isAxiosError(error) && error.response?.status === 404) return;
      throw error;
    }
  }

  /**
   * Disconnects the account here and at Garmin. A failure at Garmin keeps the
   * refresh token, the only way to deregister: the next notification or
   * account deletion tries again. Otherwise the tokens are forgotten.
   */
  async disconnect(account: ProviderAccount): Promise<void> {
    let keepRefreshToken = false;
    try {
      await this.deleteUserRegistration(account);
    } catch (error) {
      this.logger.error(
        `Failed to delete Garmin user registration for account ${account.providerAccountId}: ${garminErrorMessage(error)}`,
      );
      keepRefreshToken =
        !(error instanceof InvalidRefreshTokenError) &&
        !isRefreshTokenRejected(error);
    }
    await this.revokeLocally(account.providerAccountId, keepRefreshToken);
  }

  private revokeLocally(providerAccountId: number, keepRefreshToken = false) {
    return this.prisma.providerAccount.update({
      where: { providerAccountId },
      data: {
        status: 'revoked',
        accessToken: '',
        ...(keepRefreshToken ? {} : { refreshToken: null }),
        expiresAt: null,
      },
    });
  }

  async connect(
    code: string,
    codeVerifier: string,
    athleteId: number,
  ): Promise<ProviderAccount> {
    const tokenResponse = await this.exchangeCodeForTokens(code, codeVerifier);

    // Notifications only name the Garmin user id: without it none of this
    // user's data could be matched to the athlete
    const userId = await this.getUserId(tokenResponse.access_token);
    if (!userId) {
      throw new BadRequestException(
        'Garmin did not complete the authorization. Please connect again.',
      );
    }

    let permissions: string[] | null = null;
    try {
      permissions = await this.getUserPermissions(tokenResponse.access_token);
    } catch (error) {
      this.logger.warn(
        `Could not read Garmin permissions at connection: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // A Garmin user connected to another athlete moves here: notifications
    // would otherwise be matched to whichever account was found first
    await this.prisma.providerAccount.updateMany({
      where: {
        provider: ConnectorProvider.GARMIN,
        externalUserId: userId,
        athleteId: { not: athleteId },
        status: 'active',
      },
      data: { status: 'revoked', accessToken: '', refreshToken: null },
    });

    return this.saveProviderAccount({
      athleteId,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token || '',
      expiresIn: tokenResponse.expires_in,
      scopes: permissions ? formatGarminPermissions(permissions) : undefined,
      externalUserId: userId,
    });
  }

  // ---------------------------------------------------------------------------
  // Historical import
  // ---------------------------------------------------------------------------

  /**
   * Garmin forbids pulling data outside of its notifications. History comes
   * from a backfill request: Garmin then sends the past activities through
   * the usual pings.
   */
  async queueFullImport(account: ProviderAccount): Promise<FullImportResult> {
    const permissions = await this.getAccountPermissions(account);
    if (permissions.length > 0 && !permissions.includes('ACTIVITY_EXPORT')) {
      throw new BadRequestException(
        'Garmin does not allow exporting activities for this account. Please allow activity sharing in Garmin Connect.',
      );
    }

    const end = Math.floor(Date.now() / 1000);
    const start = end - Math.floor(this.backfillWindowMs / 1000);
    const accessToken = await this.getValidAccessToken(account);
    await this.requestActivitiesBackfill(accessToken, start, end);
    return { queuedActivities: 0, backfillRequested: true };
  }

  private async requestActivitiesBackfill(
    accessToken: string,
    start: number,
    end: number,
    retryOnConflict = true,
  ): Promise<void> {
    try {
      await axios.get(
        `https://${GARMIN_API_HOST}/wellness-api/rest/backfill/activities`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            summaryStartTimeInSeconds: start,
            summaryEndTimeInSeconds: end,
          },
          timeout: 15000,
        },
      );
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      // Garmin rejects the whole window with 409 if part of it overlaps an
      // earlier backfill (`{"errorMessage":"... [<start> to <end>]"}`):
      // advance past the conflicting window to backfill the remaining gap
      if (status === 409) {
        const conflictEnd = retryOnConflict
          ? parseBackfillConflictEnd(garminErrorMessage(error))
          : null;
        if (conflictEnd && conflictEnd > start && conflictEnd < end) {
          await this.requestActivitiesBackfill(
            accessToken,
            conflictEnd,
            end,
            false,
          );
        }
        return;
      }
      if (status === 429) {
        const retryAfter = Number(
          isAxiosError(error) ? error.response?.headers['retry-after'] : NaN,
        );
        throw new ProviderRateLimitError(
          'Garmin',
          Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : undefined,
        );
      }
      // The user does not share their history with us (412), or Garmin
      // refuses the request (400): retrying would not change it
      if (status === 412) {
        throw new BadRequestException(
          'This Garmin user does not share their history with OpenAthlete',
        );
      }
      if (status === 400) {
        throw new BadRequestException(
          `Garmin refused the backfill: ${garminErrorMessage(error)}`,
        );
      }
      throw error;
    }
  }

  /** Not used: Garmin only allows pulls answering its notifications. */
  async importActivities(): Promise<ImportedActivity[]> {
    return [];
  }

  // ---------------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------------

  /**
   * Accepts any Garmin webhook body. Deregistrations and permission changes
   * are applied at once; data notifications are queued, so the webhook
   * answers within Garmin's 30 seconds.
   */
  async handleWebhook(body: unknown): Promise<void> {
    if (!isObject(body)) return;

    if (Array.isArray(body.deregistrations)) {
      await this.handleDeregistrations(
        body.deregistrations as GarminDeregistration[],
      );
    }
    if (Array.isArray(body.userPermissionsChange)) {
      await this.handlePermissionChanges(
        body.userPermissionsChange as GarminUserPermissionsChange[],
      );
    }
    await this.queueService.addGarminNotificationJobs(
      parseGarminNotifications(body),
    );
  }

  private async handleDeregistrations(entries: GarminDeregistration[]) {
    for (const entry of entries) {
      if (!entry?.userId) continue;
      const { count } = await this.prisma.providerAccount.updateMany({
        where: {
          provider: ConnectorProvider.GARMIN,
          externalUserId: entry.userId,
          status: 'active',
        },
        data: {
          status: 'revoked',
          accessToken: '',
          refreshToken: null,
          expiresAt: null,
        },
      });
      this.logger.log(
        `Garmin user ${entry.userId} deregistered (${count} account(s) revoked)`,
      );
    }
  }

  private async handlePermissionChanges(
    entries: GarminUserPermissionsChange[],
  ) {
    for (const entry of entries) {
      if (!entry?.userId || !Array.isArray(entry.permissions)) continue;
      const { count } = await this.prisma.providerAccount.updateMany({
        where: {
          provider: ConnectorProvider.GARMIN,
          externalUserId: entry.userId,
        },
        data: { scopes: formatGarminPermissions(entry.permissions) },
      });
      this.logger.log(
        `Garmin permissions of user ${entry.userId} changed to [${entry.permissions.join(', ')}] (${count} account(s))`,
      );
    }
  }

  private async findAccount(userId: string): Promise<ProviderAccount | null> {
    const accounts = await this.prisma.providerAccount.findMany({
      where: { provider: ConnectorProvider.GARMIN, externalUserId: userId },
      orderBy: { updatedAt: 'desc' },
    });
    return (
      accounts.find((account) => account.status === 'active') ??
      accounts[0] ??
      null
    );
  }

  /**
   * Answers one notification. Garmin counts every ping whose callback URL is
   * not pulled as unanswered, so it is pulled even when nothing is saved:
   * import turned off, or a user disconnected here.
   */
  async processNotification(
    notification: GarminNotificationJobData,
    { lastAttempt }: { lastAttempt: boolean },
  ): Promise<void> {
    const { summaryType, userId, callbackURL } = notification;
    const stored = await this.findAccount(userId);
    const account = stored?.status === 'active' ? stored : null;

    if (stored && !account && stored.refreshToken) {
      // Still registered at Garmin though disconnected here (the disconnect
      // could not reach Garmin): deregister so its data stops coming
      await this.disconnect(stored);
    }

    if (summaryType === 'activityFiles') {
      await this.processActivityFile(notification, account, lastAttempt);
      return;
    }

    const summaries = callbackURL
      ? await this.pullSummaries(callbackURL, account, summaryType)
      : [notification.entry];

    if (!account) {
      this.logger.debug(
        `Garmin ${summaryType} notification answered for ${stored ? 'disconnected' : 'unknown'} user ${userId}; nothing saved`,
      );
      return;
    }

    if (ACTIVITY_SUMMARY_TYPES.has(summaryType)) {
      await this.saveActivitySummaries(
        account,
        summaries as unknown as GarminActivitySummary[],
        summaryType === 'manuallyUpdatedActivities',
      );
    } else if (!ANSWER_ONLY_TYPES.has(summaryType)) {
      await this.saveHealthSummaries(account, summaryType, summaries);
    }
  }

  private getSafeGarminCallbackUrl(callbackURL: string): string {
    let url: URL;
    try {
      url = new URL(callbackURL);
    } catch {
      throw new BadRequestException('Invalid Garmin callbackURL');
    }
    // Callback URLs come from unauthenticated webhook bodies and may be
    // fetched with the user's token: only ever send requests to Garmin
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      (url.port && url.port !== '443') ||
      url.hostname !== GARMIN_API_HOST
    ) {
      throw new BadRequestException('Invalid Garmin callbackURL');
    }
    return `https://${GARMIN_API_HOST}${url.pathname}${url.search}`;
  }

  /**
   * Pulls a callback URL as Garmin built it, `token` parameter included,
   * authorized with the user's access token: Garmin answers 400 to a pull
   * carrying the pull token alone. Without an account (a user unknown
   * here), the pull token is all there is to answer the ping with.
   */
  private async pullCallback<T>(
    callbackURL: string,
    account: ProviderAccount | null,
    responseType: 'json' | 'arraybuffer',
  ): Promise<T> {
    const url = this.getSafeGarminCallbackUrl(callbackURL);
    const headers: Record<string, string> = account
      ? { Authorization: `Bearer ${await this.getValidAccessToken(account)}` }
      : {};
    const { data } = await axios.get<T>(url, {
      headers,
      responseType,
      timeout: responseType === 'arraybuffer' ? 120_000 : 45_000,
    });
    return data;
  }

  private async pullSummaries(
    callbackURL: string,
    account: ProviderAccount | null,
    summaryType: string,
  ): Promise<Summary[]> {
    try {
      const data = await this.pullCallback<unknown>(
        callbackURL,
        account,
        'json',
      );
      if (Array.isArray(data)) return data.filter(isObject);
      return isObject(data) ? [data] : [];
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      // A refused request (400, 401) is a fault on our side: the job fails
      // loudly and retries while the callback lasts (7 days), instead of
      // dropping the data unseen
      if (account && (status === 400 || status === 401)) throw error;
      // Other 4xx won't change on retry: the summary type is not shared
      // (412), the user is gone (403), the data expired (410)...
      if (status && status >= 400 && status < 500 && status !== 429) {
        // Without an account Garmin always refuses the pull: its pings for
        // users unknown here are routine, not a fault worth a warning
        this.logger[account ? 'warn' : 'debug'](
          `Garmin ${summaryType} callback answered ${status}${account ? ` for account ${account.providerAccountId}` : ''}: ${garminErrorMessage(error)}`,
        );
        return [];
      }
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Activities
  // ---------------------------------------------------------------------------

  private async saveActivitySummaries(
    account: ProviderAccount,
    summaries: GarminActivitySummary[],
    manuallyUpdated: boolean,
  ): Promise<void> {
    if (!account.importActivitiesEnabled) return;

    // A multisport parent repeats its legs, which come as their own
    // activities: importing it would count the training twice
    const activities = summaries
      .filter((summary) => !summary.isParent)
      .map(toImportedGarminActivity)
      .filter((activity): activity is ImportedActivity => activity !== null);
    if (activities.length === 0) return;

    const existing = await this.prisma.eventActivity.findMany({
      where: {
        provider: ConnectorProvider.GARMIN,
        externalId: { in: activities.map((activity) => activity.externalId) },
        event: { athleteId: account.athleteId },
      },
      select: { externalId: true, eventActivityId: true, eventId: true },
    });
    const existingById = new Map(
      existing.map((activity) => [activity.externalId, activity]),
    );

    if (manuallyUpdated) {
      for (const activity of activities) {
        const saved = existingById.get(activity.externalId);
        if (saved?.eventId) {
          await this.updateActivityFromSummary(
            saved.eventActivityId,
            saved.eventId,
            activity,
          );
        }
      }
    }

    const newActivities = activities.filter(
      (activity) => !existingById.has(activity.externalId),
    );
    await this.queueService.addActivityImportJobs(
      account,
      newActivities,
      false,
    );
  }

  /** An activity edited in Garmin Connect: its new summary replaces ours */
  private async updateActivityFromSummary(
    eventActivityId: number,
    eventId: number,
    activity: ImportedActivity,
  ) {
    const summary = activity.raw as GarminActivitySummary;
    await this.prisma.$transaction([
      this.prisma.event.update({
        where: { eventId },
        data: {
          ...(activity.name && { name: activity.name }),
          startDate: activity.startDate,
          endDate: activity.endDate,
        },
      }),
      this.prisma.eventActivity.update({
        where: { eventActivityId },
        data: activityMetrics(summary),
      }),
    ]);
    await this.queueService.addActivityProcessingJob(eventActivityId, eventId);
  }

  async importActivity(
    account: ProviderAccount,
    activity: ImportedActivity,
  ): Promise<ImportResult> {
    const existing = await this.prisma.eventActivity.findFirst({
      where: {
        provider: ConnectorProvider.GARMIN,
        externalId: activity.externalId,
        event: { athleteId: account.athleteId },
      },
    });
    if (existing) {
      return { activity: existing, created: false };
    }

    const summary = activity.raw as GarminActivitySummary;
    const metrics = activityMetrics(summary);
    const saved = await this.prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          athleteId: account.athleteId,
          name: activity.name || summary.activityType || 'Activity',
          type: EventType.ACTIVITY,
          startDate: new Date(activity.startDate),
          endDate: new Date(activity.endDate),
        },
      });
      return tx.eventActivity.create({
        data: {
          provider: ConnectorProvider.GARMIN,
          ...metrics,
          // The activity file brings the stream, in its own notification
          stream: compressActivityStream({}) as object,
          externalId: activity.externalId,
          event: { connect: { eventId: event.eventId } },
        },
      });
    });

    return { activity: saved, created: true };
  }

  /**
   * Activity files can be downloaded once, within 24 hours (a second
   * download answers 410). The file often arrives before its activity is
   * saved: the job is then retried until it is.
   */
  private async processActivityFile(
    notification: GarminNotificationJobData,
    account: ProviderAccount | null,
    lastAttempt: boolean,
  ): Promise<void> {
    const entry =
      notification.entry as unknown as Partial<GarminActivityFileNotification>;
    const { callbackURL } = notification;
    if (!callbackURL) return;

    const fileType = String(entry.fileType ?? '').toUpperCase();
    const parsable = fileType === 'FIT' || fileType === 'GPX';
    const activityId =
      entry.activityId === undefined ? null : String(entry.activityId);

    let activity: EventActivity | null = null;
    if (account?.importActivitiesEnabled && parsable && activityId) {
      activity = await this.prisma.eventActivity.findFirst({
        where: {
          provider: ConnectorProvider.GARMIN,
          externalId: activityId,
          event: { athleteId: account.athleteId },
        },
      });
      if (!activity && !lastAttempt) {
        throw new Error(
          `Garmin activity ${activityId} is not saved yet; its file will be fetched on the next attempt`,
        );
      }
    }

    let file: ArrayBuffer;
    try {
      file = await this.pullCallback<ArrayBuffer>(
        callbackURL,
        account,
        'arraybuffer',
      );
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      if (status === 410 || status === 404 || status === 412) {
        this.logger.warn(
          `Garmin activity file ${activityId ?? ''} answered ${status}: ${garminErrorMessage(error)}`,
        );
        return;
      }
      // Without an account there is no token to pull with: a retry can't help
      if (!account && (status === 400 || status === 401)) {
        this.logger.debug(
          `Garmin activity file ${activityId ?? ''} answered ${status} for a user without an account`,
        );
        return;
      }
      // The file is requested as binary: axios' message hides Garmin's reason
      if (status === 400 || status === 401) {
        this.logger.warn(
          `Garmin activity file ${activityId ?? ''} answered ${status}: ${garminErrorMessage(error)}`,
        );
      }
      throw error;
    }

    if (!activity || !account) return;

    const parsed = await this.activityFileParserService.parseByFileType(
      file,
      fileType as 'FIT' | 'GPX',
    );
    const details = buildFitActivityDetails(parsed);
    const { eventActivityId } = activity;

    await this.prisma.$transaction(async (tx) => {
      await tx.eventActivity.update({
        where: { eventActivityId },
        // A corrected activity keeps its corrections over the new recording
        data: await streamUpdate(tx, eventActivityId, details.stream),
      });
      if (details.segments.length > 0) {
        await tx.activitySegment.deleteMany({ where: { eventActivityId } });
        await tx.activitySegment.createMany({
          data: details.segments.map((segment) => ({
            ...segment,
            eventActivityId,
          })),
        });
      }
    });

    if (activity.eventId) {
      await this.queueService.addActivityProcessingJob(
        eventActivityId,
        activity.eventId,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Health
  // ---------------------------------------------------------------------------

  private async saveHealthSummaries(
    account: ProviderAccount,
    summaryType: string,
    summaries: Summary[],
  ): Promise<void> {
    if (!account.importMetricsEnabled || summaries.length === 0) return;

    let metrics: GarminMetricRecord[];
    switch (summaryType) {
      case 'dailies':
        metrics = mapGarminDailies(
          summaries as unknown as GarminDailySummary[],
        );
        break;
      case 'sleeps':
        metrics = mapGarminSleeps(summaries as unknown as GarminSleepSummary[]);
        break;
      case 'bodyComps':
        metrics = mapGarminBodyComps(
          summaries as unknown as GarminBodyCompositionSummary[],
        );
        break;
      case 'userMetrics':
        metrics = mapGarminUserMetrics(
          summaries as unknown as GarminUserMetricsSummary[],
        );
        break;
      case 'healthSnapshot':
        metrics = mapGarminHealthSnapshots(
          summaries as unknown as GarminHealthSnapshotSummary[],
        );
        break;
      case 'hrv':
        metrics = mapGarminHrv(summaries as unknown as GarminHrvSummary[]);
        break;
      case 'bloodPressures':
        metrics = mapGarminBloodPressures(
          summaries as unknown as GarminBloodPressureSummary[],
        );
        break;
      case 'skinTemp':
        metrics = mapGarminSkinTemps(
          summaries as unknown as GarminSkinTempSummary[],
        );
        break;
      case 'allDayRespiration':
        metrics = await this.mergeDailyPartials(
          account.athleteId,
          garminRespirationPartials(
            summaries as unknown as GarminRespirationSummary[],
          ),
        );
        break;
      case 'pulseox':
        metrics = await this.mergeDailyPartials(
          account.athleteId,
          garminPulseOxPartials(summaries as unknown as GarminPulseOxSummary[]),
        );
        break;
      default:
        this.logger.debug(`Garmin ${summaryType} summaries are not saved`);
        return;
    }

    await this.saveMetrics(account.athleteId, metrics);
  }

  /**
   * Keeps each summary of a day in Redis, replaced by its updates, and
   * averages the whole day: a ping only carries the summaries synced since
   * the previous one.
   */
  private async mergeDailyPartials(
    athleteId: number,
    partials: GarminDailyPartial[],
  ): Promise<GarminMetricRecord[]> {
    const days = new Map<string, { type: MetricType; day: string }>();
    const redis = this.getRedis();
    for (const partial of partials) {
      const key = `garmin:daily:${athleteId}:${partial.type}:${partial.day}`;
      await redis.hset(
        key,
        partial.key,
        JSON.stringify({
          sum: partial.sum,
          count: partial.count,
          min: partial.min,
        }),
      );
      await redis.expire(key, DAILY_PARTIALS_TTL_SECONDS);
      days.set(key, { type: partial.type, day: partial.day });
    }

    const metrics: GarminMetricRecord[] = [];
    for (const [key, { type, day }] of days) {
      const parts = Object.values(await redis.hgetall(key)).map(
        (value) =>
          JSON.parse(value) as { sum: number; count: number; min: number },
      );
      const metric = aggregateGarminPartials(type, day, parts);
      if (metric) metrics.push(metric);
    }
    return metrics;
  }

  private async saveMetrics(
    athleteId: number,
    metrics: GarminMetricRecord[],
  ): Promise<void> {
    const valid = metrics.filter(
      (metric) =>
        !Number.isNaN(metric.date.getTime()) && Number.isFinite(metric.value),
    );
    if (valid.length === 0) return;

    await this.prisma.$transaction(
      valid.map((metric) =>
        this.prisma.athleteMetric.upsert({
          where: {
            athleteId_type_date: {
              athleteId,
              type: metric.type,
              date: metric.date,
            },
          },
          create: {
            athleteId,
            type: metric.type,
            date: metric.date,
            value: roundMetricValue(metric.value),
          },
          update: { value: roundMetricValue(metric.value) },
        }),
      ),
    );
  }
}
