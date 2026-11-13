import axios, { isAxiosError } from 'axios';
import * as crypto from 'node:crypto';

import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import {
  ConnectorProvider,
  EventActivity,
  EventType,
  MetricType,
  Prisma,
  ProviderAccount,
} from '@openathlete/database';
import {
  ApiEnvSchemaType,
  COROS_REGIONS,
  CorosRegion,
} from '@openathlete/shared';

import { streamUpdate } from 'src/modules/core/helpers/activity-corrections';

import { ActivityFileParserService } from '../../core/helpers/activity-file-parser.service';
import { ActivityParseResult } from '../../core/helpers/activity-parser.interface';
import { compressActivityStream } from '../../core/helpers/activity-stream';
import { mapCorosSportType } from '../../core/helpers/coros';
import {
  roundDistance,
  roundEnergy,
  roundHeartrate,
  roundMetricValue,
  roundSpeed,
} from '../../core/helpers/round-activity-values';
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
  CorosFormatError,
  CorosMetricRecord,
  CorosSportRecord,
  corosExcerpt,
  parseDailyValues,
  parseFitUrl,
  parseSleepOverview,
  parseSportRecords,
  parseVo2Max,
} from '../mapping/coros-text.parser';

const OAUTH_SCOPE = 'openid mcp.tools offline_access';
const MCP_PROTOCOL_VERSION = '2025-06-18';
const MCP_TIMEOUT_MS = 60_000;

const DAY_MS = 24 * 3_600_000;
const KCAL_TO_KJ = 4.184;

/** All sports, in `querySportRecords` */
const ALL_SPORTS_CODE = 65535;
const SYNC_WINDOW_DAYS = 7;
const RECORDS_PER_REQUEST = 200;

/** COROS serves 50 FIT files per user over a fixed 24 hours */
const QUOTA_RETRY_MS = 3_600_000;
const HISTORY_BATCH_SIZE = 40; // leaves room for the new activities of the day
const HISTORY_BATCH_DELAY_MS = 25 * 3_600_000;
const HISTORY_WINDOW_DAYS = 30;
const HISTORY_EMPTY_WINDOWS_LIMIT = 12;

const METRICS_WINDOW_DAYS = 7;
const MAX_FIT_BYTES = 64 * 1024 * 1024;

const COROS_ISSUERS: Record<CorosRegion, string> = {
  eu: 'https://mcpeu.coros.com',
  us: 'https://mcpus.coros.com',
  cn: 'https://mcpcn.coros.com',
};

/** Fixed hosts only: a stored region is never spliced into a URL */
export const corosIssuer = (region: string): string =>
  Object.prototype.hasOwnProperty.call(COROS_ISSUERS, region)
    ? COROS_ISSUERS[region as CorosRegion]
    : COROS_ISSUERS.eu;

/** What the client keeps between leaving for COROS and coming back */
interface CorosPendingLogin {
  region: CorosRegion;
  clientId: string;
  verifier: string;
}

interface McpToolResult {
  content?: { type?: string; text?: string }[];
  isError?: boolean;
}

interface McpResponse {
  result?: McpToolResult;
  error?: { code?: number; message?: string };
}

const base64Url = (bytes: Buffer) => bytes.toString('base64url');

const compactDate = (date: Date) =>
  date.toISOString().slice(0, 10).replaceAll('-', '');

/** A JSON body, or the last event of a stream, which holds the answer */
export function parseMcpBody(body: unknown): McpResponse {
  if (typeof body !== 'string') return (body ?? {}) as McpResponse;
  const events = [...body.matchAll(/^data:\s?(.*)$/gm)];
  const payload = events.length > 0 ? events[events.length - 1][1] : body;
  return JSON.parse(payload) as McpResponse;
}

/** Some tools encode their text a second time as a JSON string */
export function toolText(result: McpToolResult | undefined): string {
  const text = (result?.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('\n');
  if (!text.trim().startsWith('"')) return text;
  try {
    const decoded: unknown = JSON.parse(text);
    return typeof decoded === 'string' ? decoded : text;
  } catch {
    return text;
  }
}

const isQuotaMessage = (text: string) => /quota|limit|exceed|额度/i.test(text);

/**
 * COROS also reports failures in a successful answer, without isError: a
 * guard against what it takes for a runaway AI client.
 */
export function isCorosErrorText(text: string): boolean {
  return /tool call anomalies|session context pollution|resolution strategy:|LLM capability boundary/i.test(
    text,
  );
}

/**
 * COROS refusing the token in a successful answer: "Client authentication
 * credentials missing, expired, or identity mismatched…"
 */
export function isCorosAuthText(text: string): boolean {
  return /authentication credentials|identity mismatch|token expired|invalid_grant/i.test(
    text,
  );
}

function sessionNumber(
  parsed: ActivityParseResult | null,
  ...keys: string[]
): number | null {
  const session = parsed?.fit?.sessions?.[0];
  for (const key of keys) {
    const value = session?.[key];
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value;
    }
  }
  return null;
}

@Injectable()
export class CorosProviderService
  extends BaseProviderService
  implements ProviderImportCapability
{
  protected readonly provider = ConnectorProvider.COROS;

  private get redirectUri(): string {
    return providerRedirectUri(
      this.configService.get('COROS_REDIRECT_URI'),
      this.configService.get('APP_URL'),
      'coros',
    );
  }

  /** Each connection has its client and region: see the methods below */
  protected get oauthConfig(): OAuthConfig {
    return {
      authorizationUrl: `${corosIssuer('eu')}/oauth2/authorize`,
      tokenUrl: `${corosIssuer('eu')}/oauth2/token`,
      clientId: '',
      clientSecret: '',
      redirectUri: this.redirectUri,
      scopes: OAUTH_SCOPE.split(' '),
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
   * COROS offers no shared client: anyone registers one, without a secret.
   * The global mcp.coros.com picks a region from the caller's address, here
   * our server's, so the user names theirs instead.
   */
  async getAuthorizationUriForRegion(
    region: CorosRegion,
  ): Promise<{ uri: string; codeVerifier: string }> {
    const issuer = corosIssuer(region);
    const { data } = await axios.post<{ client_id: string }>(
      `${issuer}/connect/register`,
      {
        client_name: 'OpenAthlete',
        redirect_uris: [this.redirectUri],
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        scope: OAUTH_SCOPE,
        token_endpoint_auth_method: 'none',
      },
      { timeout: 30_000 },
    );

    const verifier = base64Url(crypto.randomBytes(32));
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: data.client_id,
      redirect_uri: this.redirectUri,
      scope: OAUTH_SCOPE,
      code_challenge: base64Url(
        crypto.createHash('sha256').update(verifier).digest(),
      ),
      code_challenge_method: 'S256',
      resource: `${issuer}/mcp`,
    });

    const pending: CorosPendingLogin = {
      region,
      clientId: data.client_id,
      verifier,
    };
    return {
      uri: `${issuer}/oauth2/authorize?${params.toString()}`,
      // The client hands it back as is: nothing to keep on this side
      codeVerifier: base64Url(Buffer.from(JSON.stringify(pending))),
    };
  }

  private parsePendingLogin(codeVerifier: string): CorosPendingLogin {
    let pending: Partial<CorosPendingLogin>;
    try {
      pending = JSON.parse(
        Buffer.from(codeVerifier, 'base64url').toString('utf8'),
      ) as Partial<CorosPendingLogin>;
    } catch {
      throw new BadRequestException('Invalid COROS code verifier');
    }
    const { region, clientId, verifier } = pending;
    if (!region || !COROS_REGIONS.includes(region) || !clientId || !verifier) {
      throw new BadRequestException('Invalid COROS code verifier');
    }
    return { region, clientId, verifier };
  }

  private async requestToken(
    region: string,
    form: Record<string, string>,
  ): Promise<OAuthTokenResponse> {
    const { data } = await axios.post<OAuthTokenResponse>(
      `${corosIssuer(region)}/oauth2/token`,
      new URLSearchParams(form).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        timeout: 30_000,
      },
    );
    return data;
  }

  async connect(
    code: string,
    codeVerifier: string,
    athleteId: number,
  ): Promise<ProviderAccount> {
    const { region, clientId, verifier } = this.parsePendingLogin(codeVerifier);
    let tokens: OAuthTokenResponse;
    try {
      tokens = await this.requestToken(region, {
        grant_type: 'authorization_code',
        client_id: clientId,
        code,
        code_verifier: verifier,
        redirect_uri: this.redirectUri,
        resource: `${corosIssuer(region)}/mcp`,
      });
    } catch (error) {
      if (isAxiosError(error)) {
        this.logger.error(
          `COROS token exchange failed (${error.response?.status}): ${JSON.stringify(error.response?.data)}`,
        );
      }
      throw error;
    }

    const account = await this.saveProviderAccount({
      athleteId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      expiresIn: tokens.expires_in,
      scopes: tokens.scope,
      oauthClientId: clientId,
      region,
    });
    await this.queueService.addCorosSyncJob(account.providerAccountId);
    return account;
  }

  /** The client that got the token refreshes it, at the server that issued it */
  override async refreshAccessToken(
    refreshToken: string,
    account?: ProviderAccount,
  ): Promise<OAuthTokenResponse> {
    if (!account?.oauthClientId || !account.region) {
      throw new Error('COROS account without OAuth client or region');
    }
    return this.requestToken(account.region, {
      grant_type: 'refresh_token',
      client_id: account.oauthClientId,
      refresh_token: refreshToken,
    });
  }

  /**
   * Call a tool of the COROS MCP server. It is stateless: a tools/call and
   * its bearer are all it needs, without the usual initialize handshake.
   * Errors come back in a 200, and their text is logged, never interpreted:
   * some are instructions meant for an AI model.
   */
  async callTool(
    account: ProviderAccount,
    name: string,
    args: Record<string, unknown> = {},
    retried = false,
  ): Promise<string> {
    const accessToken = await this.getValidAccessToken(account);
    let body: McpResponse;
    try {
      const response = await axios.post<unknown>(
        `${corosIssuer(account.region ?? 'eu')}/mcp`,
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: { name, arguments: args },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
            'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
          },
          timeout: MCP_TIMEOUT_MS,
          // Label ids don't fit in a number: parse this ourselves, from text
          responseType: 'text',
          transformResponse: (data: unknown) => data,
        },
      );
      body = parseMcpBody(response.data);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 429) {
        throw new ProviderRateLimitError('COROS', QUOTA_RETRY_MS);
      }
      if (isAxiosError(error) && error.response?.status === 401) {
        // Have the next call refresh it, which tells a revoked account
        await this.prisma.providerAccount.update({
          where: { providerAccountId: account.providerAccountId },
          data: { expiresAt: new Date(0) },
        });
      }
      throw error;
    }

    if (body.error) {
      throw new Error(`COROS ${name} failed: ${body.error.message}`);
    }
    const text = toolText(body.result);
    if (isCorosAuthText(text)) {
      if (!retried) {
        // A refreshed token may be all it takes; refreshing also tells a
        // revoked grant, which marks the account for reconnection
        return this.callTool(
          { ...account, expiresAt: new Date(0) },
          name,
          args,
          true,
        );
      }
      // Still refused with a fresh token: the athlete must connect again
      this.logger.warn(
        `COROS refused the credentials of account ${account.providerAccountId}, marking it as revoked: ${corosExcerpt(text)}`,
      );
      await this.prisma.providerAccount.update({
        where: { providerAccountId: account.providerAccountId },
        data: { status: 'revoked' },
      });
      throw new InvalidRefreshTokenError(
        'COROS',
        account.providerAccountId,
        account.athleteId,
      );
    }
    if (body.result?.isError || isCorosErrorText(text)) {
      this.logger.warn(
        `COROS ${name} failed for account ${account.providerAccountId}: ${corosExcerpt(text)}`,
      );
      if (isQuotaMessage(text)) {
        throw new ProviderRateLimitError('COROS', QUOTA_RETRY_MS);
      }
      throw new Error(`COROS ${name} failed`);
    }
    return text;
  }

  private async listRecords(
    account: ProviderAccount,
    startDate: Date,
    endDate: Date,
  ): Promise<CorosSportRecord[]> {
    const text = await this.callTool(account, 'querySportRecords', {
      startDate: compactDate(startDate),
      endDate: compactDate(endDate),
      sportTypeCodes: [ALL_SPORTS_CODE],
      limit: RECORDS_PER_REQUEST,
    });
    try {
      return parseSportRecords(text);
    } catch (error) {
      // The format is undocumented: what it looked like is what fixes it
      if (error instanceof CorosFormatError) {
        this.logger.warn(
          `COROS querySportRecords unreadable for account ${account.providerAccountId}: ${corosExcerpt(text)}`,
        );
      }
      throw error;
    }
  }

  private toImportedActivity(record: CorosSportRecord): ImportedActivity {
    const startDate = record.startTimestamp
      ? new Date(record.startTimestamp * 1000)
      : new Date(`${record.date}T12:00:00.000Z`);
    const endDate = record.endTimestamp
      ? new Date(record.endTimestamp * 1000)
      : new Date(startDate.getTime() + record.durationSeconds * 1000);
    return {
      externalId: record.labelId,
      name: record.location || record.sportLabel,
      startDate,
      endDate,
      sport: mapCorosSportType(record.sportType),
      distance: record.distanceMeters,
      duration: record.durationSeconds,
      raw: record,
    };
  }

  async importActivities(
    account: ProviderAccount,
    options?: ImportOptions,
  ): Promise<ImportedActivity[]> {
    const endDate = options?.endDate ?? new Date();
    const startDate =
      options?.startDate ??
      new Date(endDate.getTime() - SYNC_WINDOW_DAYS * DAY_MS);
    const records = await this.listRecords(account, startDate, endDate);
    return records
      .map((record) => this.toImportedActivity(record))
      .slice(0, options?.limit);
  }

  private async withoutKnown(
    activities: ImportedActivity[],
  ): Promise<ImportedActivity[]> {
    if (activities.length === 0) return [];
    const known = await this.prisma.eventActivity.findMany({
      where: {
        provider: ConnectorProvider.COROS,
        externalId: { in: activities.map((activity) => activity.externalId) },
      },
      select: { externalId: true },
    });
    const knownIds = new Set(known.map((activity) => activity.externalId));
    return activities.filter((activity) => !knownIds.has(activity.externalId));
  }

  /** Bring the recent activities, which also retries any that failed */
  async syncAccount(providerAccountId: number): Promise<void> {
    const account = await this.activeAccount(providerAccountId);
    if (!account?.importActivitiesEnabled) return;

    const activities = await this.importActivities(account, {
      startDate: new Date(Date.now() - SYNC_WINDOW_DAYS * DAY_MS),
    });
    const missing = await this.withoutKnown(activities);
    if (missing.length > 0) {
      this.logger.log(
        `Importing ${missing.length} COROS activities for account ${providerAccountId}`,
      );
      await this.queueService.addActivityImportJobs(account, missing);
    }
  }

  /**
   * Queue the whole history. At 50 files a day it can't all arrive at once,
   * and an activity past the quota would be lost: it goes out in daily
   * batches. The window walks back until a year without any activity, or
   * until `since` when only the recent months are asked for.
   */
  async queueFullImport(
    account: ProviderAccount,
    { since }: FullImportOptions = {},
  ): Promise<FullImportResult> {
    if (account.importMetricsEnabled) {
      await this.queueService.addCorosMetricsJob(account.providerAccountId);
    }

    const activities: ImportedActivity[] = [];
    let endDate = new Date();
    let emptyWindows = 0;
    while (
      emptyWindows < HISTORY_EMPTY_WINDOWS_LIMIT &&
      (!since || endDate > since)
    ) {
      const windowStart = endDate.getTime() - HISTORY_WINDOW_DAYS * DAY_MS;
      const startDate = new Date(
        since ? Math.max(windowStart, since.getTime()) : windowStart,
      );
      const found = await this.importActivities(account, {
        startDate,
        endDate,
      });
      activities.push(...found);
      emptyWindows = found.length === 0 ? emptyWindows + 1 : 0;
      endDate = new Date(startDate.getTime() - DAY_MS);
    }

    const missing = await this.withoutKnown(activities);
    for (let batch = 0; batch * HISTORY_BATCH_SIZE < missing.length; batch++) {
      await this.queueService.addCorosHistoryBatchJob(
        account.providerAccountId,
        missing.slice(
          batch * HISTORY_BATCH_SIZE,
          (batch + 1) * HISTORY_BATCH_SIZE,
        ),
        batch * HISTORY_BATCH_DELAY_MS,
      );
    }
    return {
      queuedActivities: missing.length,
      ...(since && { partial: true }),
    };
  }

  async importHistoryBatch(
    providerAccountId: number,
    activities: ImportedActivity[],
  ): Promise<void> {
    const account = await this.activeAccount(providerAccountId);
    if (!account?.importActivitiesEnabled) return;
    await this.queueService.addActivityImportJobs(account, activities, true);
  }

  private async activeAccount(
    providerAccountId: number,
  ): Promise<ProviderAccount | null> {
    const account = await this.prisma.providerAccount.findUnique({
      where: { providerAccountId },
    });
    return account?.status === 'active' ? account : null;
  }

  /** The recording, when COROS gives one its parser can read */
  private async fetchRecording(
    account: ProviderAccount,
    record: CorosSportRecord,
  ): Promise<ActivityParseResult | null> {
    try {
      const text = await this.callTool(
        account,
        'queryActivityFitFileDownloadUrls',
        { labelId: record.labelId, sportType: record.sportType },
      );
      const url = parseFitUrl(text);
      if (!url) {
        if (isQuotaMessage(text)) {
          throw new ProviderRateLimitError('COROS', QUOTA_RETRY_MS);
        }
        throw new CorosFormatError('no FIT file address');
      }
      // A temporary address to COROS' storage, which takes no token
      const { data } = await axios.get<ArrayBuffer>(url, {
        responseType: 'arraybuffer',
        timeout: MCP_TIMEOUT_MS,
        maxContentLength: MAX_FIT_BYTES,
      });
      return await this.activityFileParserService.parseByFileType(data, 'FIT');
    } catch (error) {
      if (error instanceof ProviderRateLimitError) throw error;
      this.logger.warn(
        `COROS recording of activity ${record.labelId} unavailable: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * The file comes first: past the daily quota the job fails, and the next
   * sync queues the activity again rather than leaving it without recording.
   */
  async importActivity(
    account: ProviderAccount,
    activity: ImportedActivity,
  ): Promise<ImportResult> {
    const existing = await this.prisma.eventActivity.findFirst({
      where: {
        provider: ConnectorProvider.COROS,
        externalId: activity.externalId,
      },
    });
    if (existing) return { activity: existing, created: false };

    const record = activity.raw as CorosSportRecord;
    const parsed = await this.fetchRecording(account, record);

    const duration =
      sessionNumber(parsed, 'totalTimerTime') ?? activity.duration ?? 0;
    const distance =
      sessionNumber(parsed, 'totalDistance') ?? activity.distance ?? 0;
    const calories =
      sessionNumber(parsed, 'totalCalories') ?? record.calories ?? null;
    const averageHeartrate =
      sessionNumber(parsed, 'avgHeartRate') ?? record.averageHeartrate;
    const maxHeartrate = sessionNumber(parsed, 'maxHeartRate');

    let saved: EventActivity;
    try {
      saved = await this.prisma.$transaction(async (tx) => {
        const event = await tx.event.create({
          data: {
            athleteId: account.athleteId,
            name: activity.name,
            type: EventType.ACTIVITY,
            // A queued activity comes back with its dates as strings
            startDate: new Date(activity.startDate),
            endDate: new Date(activity.endDate),
          },
        });
        return tx.eventActivity.create({
          data: {
            eventId: event.eventId,
            provider: ConnectorProvider.COROS,
            externalId: activity.externalId,
            distance: roundDistance(distance) ?? 0,
            movingTime: Math.round(duration),
            averageSpeed:
              duration > 0 ? (roundSpeed(distance / duration) ?? 0) : 0,
            maxSpeed:
              roundSpeed(
                sessionNumber(parsed, 'enhancedMaxSpeed', 'maxSpeed') ?? 0,
              ) ?? 0,
            elevationGain: sessionNumber(parsed, 'totalAscent') ?? 0,
            kilojoules: calories ? roundEnergy(calories * KCAL_TO_KJ) : null,
            averageHeartrate: averageHeartrate
              ? roundHeartrate(averageHeartrate)
              : null,
            maxHeartrate: maxHeartrate ? roundHeartrate(maxHeartrate) : null,
            sport: mapCorosSportType(record.sportType),
          },
        });
      });
    } catch (error) {
      // A sync and a history batch can race for the same activity
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const winner = await this.prisma.eventActivity.findFirst({
          where: {
            provider: ConnectorProvider.COROS,
            externalId: activity.externalId,
          },
        });
        if (winner) return { activity: winner, created: false };
      }
      throw error;
    }

    if (parsed?.stream && Object.keys(parsed.stream).length > 0) {
      await this.prisma.eventActivity.update({
        where: { eventActivityId: saved.eventActivityId },
        data: await streamUpdate(
          this.prisma,
          saved.eventActivityId,
          compressActivityStream(parsed.stream),
        ),
      });
    }
    return { activity: saved, created: true };
  }

  /** One failing tool leaves the others; all failing is worth a retry */
  async syncAccountMetrics(providerAccountId: number): Promise<void> {
    const account = await this.activeAccount(providerAccountId);
    if (!account?.importMetricsEnabled) return;

    const today = new Date().toISOString().slice(0, 10);
    const days = { days: METRICS_WINDOW_DAYS };
    const sources: [
      string,
      Record<string, unknown>,
      (text: string) => CorosMetricRecord[],
    ][] = [
      ['querySleepOverview', days, parseSleepOverview],
      [
        'queryRestingHeartRate',
        days,
        (text) => parseDailyValues(text, MetricType.HR_REST, 'bpm'),
      ],
      [
        'querySleepHrv',
        days,
        (text) => parseDailyValues(text, MetricType.HRV_LAST_NIGHT_AVG, 'ms'),
      ],
      [
        'queryFitnessAssessmentOverview',
        {},
        (text) => parseVo2Max(text, today),
      ],
    ];

    const metrics: CorosMetricRecord[] = [];
    const failures: unknown[] = [];
    for (const [tool, args, parse] of sources) {
      try {
        const found = parse(await this.callTool(account, tool, args));
        if (found.length === 0) {
          this.logger.debug(`COROS ${tool}: nothing for ${providerAccountId}`);
        }
        metrics.push(...found);
      } catch (error) {
        if (error instanceof ProviderRateLimitError) throw error;
        failures.push(error);
        this.logger.warn(
          `COROS ${tool} failed for account ${providerAccountId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    if (failures.length === sources.length) throw failures[0];

    for (const { type, date, value } of metrics) {
      const rounded = roundMetricValue(value);
      await this.prisma.athleteMetric.upsert({
        where: {
          athleteId_type_date: { athleteId: account.athleteId, type, date },
        },
        create: { athleteId: account.athleteId, type, date, value: rounded },
        update: { value: rounded },
      });
    }
  }

  /** COROS has no webhooks: activities arrive with this poll */
  @Cron('*/30 * * * *', { timeZone: 'UTC' })
  async queuePeriodicSync(): Promise<void> {
    if (this.configService.get('ENABLE_ACTIVITY_IMPORT') !== true) return;
    const accounts = await this.activeAccountIds({
      importActivitiesEnabled: true,
    });
    for (const [index, id] of accounts.entries()) {
      // Spread the requests over ten minutes
      await this.queueService.addCorosSyncJob(
        id,
        Math.round((index / accounts.length) * 600_000),
      );
    }
  }

  @Cron('35 5 * * *', { timeZone: 'UTC' })
  async queueDailyMetricsSync(): Promise<void> {
    if (this.configService.get('ENABLE_ACTIVITY_IMPORT') !== true) return;
    const accounts = await this.activeAccountIds({
      importMetricsEnabled: true,
    });
    for (const [index, id] of accounts.entries()) {
      // Spread the requests over an hour
      await this.queueService.addCorosMetricsJob(
        id,
        Math.round((index / accounts.length) * 3_600_000),
      );
    }
  }

  private async activeAccountIds(
    where: Prisma.ProviderAccountWhereInput,
  ): Promise<number[]> {
    const accounts = await this.prisma.providerAccount.findMany({
      where: { provider: ConnectorProvider.COROS, status: 'active', ...where },
      select: { providerAccountId: true },
    });
    return accounts.map((account) => account.providerAccountId);
  }
}
