import axios, { AxiosRequestConfig, isAxiosError } from 'axios';
import * as crypto from 'node:crypto';

import {
  BadRequestException,
  ForbiddenException,
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
  Prisma,
  ProviderAccount,
} from '@openathlete/database';
import { ActivityStream, ApiEnvSchemaType } from '@openathlete/shared';

import { streamUpdate } from 'src/modules/core/helpers/activity-corrections';

import { ActivityFileParserService } from '../../core/helpers/activity-file-parser.service';
import { compressActivityStream } from '../../core/helpers/activity-stream';
import {
  roundDistance,
  roundEnergy,
  roundHeartrate,
  roundMetricValue,
  roundSpeed,
} from '../../core/helpers/round-activity-values';
import {
  PolarCreatedWebhook,
  PolarDailyActivity,
  PolarExercise,
  PolarNightlyRecharge,
  PolarOAuthTokenResponse,
  PolarPhysicalInfo,
  PolarSleep,
  PolarUser,
  PolarWebhook,
  PolarWebhookPayload,
} from '../../core/types/connector';
import { PrismaService } from '../../prisma/services/prisma.service';
import { QueueService } from '../../queue/queue.service';
import { BaseProviderService, OAuthConfig, OAuthTokenResponse } from '../base';
import {
  ImportOptions,
  ImportResult,
  ImportedActivity,
  ProviderImportCapability,
} from '../base/provider-import.interface';
import { providerRedirectUri, providerWebhookUrl } from '../base/provider-urls';
import { ProviderRateLimitError } from '../errors/provider-rate-limit.error';
import {
  PolarMetricRecord,
  mapPolarDailyActivity,
  mapPolarNightlyRecharge,
  mapPolarPhysicalInfo,
  mapPolarSleep,
  mapPolarSport,
  parsePolarDuration,
  polarActivityName,
  polarStartDate,
} from '../mapping/polar.mapper';

const POLAR_API_BASE = 'https://www.polaraccesslink.com/v3';
const POLAR_OAUTH_AUTHORIZE = 'https://flow.polar.com/oauth2/authorization';
const POLAR_OAUTH_TOKEN = 'https://polarremote.com/v2/oauth2/token';

// Nightly Recharge has no event of its own: SLEEP brings it along
const POLAR_WEBHOOK_EVENTS = [
  'EXERCISE',
  'SLEEP',
  'ACTIVITY_SUMMARY',
  'PHYSICAL_INFORMATION',
];

const KCAL_TO_KJ = 4.184;

@Injectable()
export class PolarProviderService
  extends BaseProviderService
  implements ProviderImportCapability
{
  protected readonly provider = ConnectorProvider.POLAR;

  protected get oauthConfig(): OAuthConfig {
    return {
      authorizationUrl: POLAR_OAUTH_AUTHORIZE,
      tokenUrl: POLAR_OAUTH_TOKEN,
      clientId: this.configService.get('POLAR_CLIENT_ID') || '',
      clientSecret: this.configService.get('POLAR_CLIENT_SECRET') || '',
      redirectUri: providerRedirectUri(
        this.configService.get('POLAR_REDIRECT_URI'),
        this.configService.get('APP_URL'),
        'polar',
      ),
      scopes: ['accesslink.read_all'],
    };
  }

  private get clientAuthorization(): string {
    const { clientId, clientSecret } = this.oauthConfig;
    const credentials = Buffer.from(`${clientId}:${clientSecret}`);
    return `Basic ${credentials.toString('base64')}`;
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

  /** Polar expects a space-separated scope and a response_type first */
  override getAuthorizationUri(state?: string): string {
    const { authorizationUrl, clientId, redirectUri, scopes } =
      this.oauthConfig;
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      ...(redirectUri && { redirect_uri: redirectUri }),
      scope: scopes.join(' '),
      ...(state && { state }),
    });
    return `${authorizationUrl}?${params.toString()}`;
  }

  /** Polar's token endpoint takes the client as Basic auth, and a form */
  override async exchangeCodeForTokens(
    code: string,
  ): Promise<OAuthTokenResponse & { x_user_id?: number }> {
    const { tokenUrl, redirectUri } = this.oauthConfig;
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      ...(redirectUri && { redirect_uri: redirectUri }),
    });

    try {
      const { data } = await axios.post<PolarOAuthTokenResponse>(
        tokenUrl,
        params.toString(),
        {
          headers: {
            Authorization: this.clientAuthorization,
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json;charset=UTF-8',
          },
          timeout: 30_000,
        },
      );

      return {
        access_token: data.access_token,
        token_type: data.token_type || 'bearer',
        expires_in: data.expires_in,
        // Polar has no refresh token: access tokens don't expire
        refresh_token: '',
        scope: 'accesslink.read_all',
        x_user_id: data.x_user_id,
      };
    } catch (error) {
      if (isAxiosError(error)) {
        this.logger.error(
          `Polar token exchange failed (${error.response?.status}): ${JSON.stringify(error.response?.data)}`,
        );
      }
      throw error;
    }
  }

  /**
   * Register the user with our client, which AccessLink requires before any
   * data access. Polar starts keeping exercises for us from this moment on.
   * @returns the user's AccessLink id
   */
  async registerUser(
    accessToken: string,
    athleteId: number,
    knownUserId?: number,
  ): Promise<number> {
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<register>
  <member-id>oa_athlete_${athleteId}</member-id>
</register>`;

    const response = await axios.post<PolarUser>(
      `${POLAR_API_BASE}/users`,
      body,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/xml',
          Accept: 'application/json',
        },
        timeout: 30_000,
        validateStatus: () => true,
      },
    );

    if (response.status === 403) {
      throw new ForbiddenException('POLAR_CONSENT_REQUIRED');
    }

    // A reconnecting user is already registered: the token names them
    const registered = response.status === 200 || response.status === 201;
    const userId = registered
      ? (response.data?.['polar-user-id'] ?? knownUserId)
      : response.status === 409
        ? knownUserId
        : undefined;
    if (!userId) {
      throw new Error(
        `Polar user registration failed with status ${response.status}`,
      );
    }
    return userId;
  }

  async connect(code: string, athleteId: number): Promise<ProviderAccount> {
    const tokens = await this.exchangeCodeForTokens(code);
    const userId = await this.registerUser(
      tokens.access_token,
      athleteId,
      tokens.x_user_id,
    );

    const account = await this.saveProviderAccount({
      athleteId,
      accessToken: tokens.access_token,
      refreshToken: '',
      expiresIn: tokens.expires_in,
      scopes: tokens.scope,
      externalUserId: userId.toString(),
    });
    this.logger.log(
      `Polar account ${account.providerAccountId} connected for athlete ${athleteId}`,
    );

    await this.ensureWebhook();
    await this.queueService.addPolarSyncJob(account.providerAccountId);
    return account;
  }

  /**
   * Stop Polar from keeping this user's data for us. Failing (a token they
   * revoked at Polar already) doesn't keep them from disconnecting.
   */
  async disconnect(account: ProviderAccount): Promise<void> {
    try {
      await axios.delete(`${POLAR_API_BASE}/users/${account.externalUserId}`, {
        headers: { Authorization: `Bearer ${account.accessToken}` },
        timeout: 30_000,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to deregister Polar account ${account.providerAccountId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Bring the single webhook of our Polar client to the wanted state. Polar
   * deactivates a webhook after 7 days of failed deliveries, and shows the
   * signing key only once, so a client whose key was lost starts over.
   */
  async ensureWebhook(): Promise<void> {
    const url = providerWebhookUrl(
      this.configService.get('POLAR_WEBHOOK_URL'),
      this.configService.get('APP_URL'),
      'polar',
    );
    // Polar can't reach a local instance, which relies on the hourly sync
    if (!url.startsWith('https://')) {
      this.logger.debug('Polar webhook skipped: no public HTTPS URL');
      return;
    }

    try {
      const headers = {
        Authorization: this.clientAuthorization,
        Accept: 'application/json',
      };
      const { data } = await axios.get<{ data?: PolarWebhook[] }>(
        `${POLAR_API_BASE}/webhooks`,
        { headers, timeout: 30_000 },
      );
      let webhook = data?.data?.[0];

      if (webhook && (await this.webhookSecrets()).length === 0) {
        this.logger.warn('Polar webhook has no known key: recreating it');
        await axios.delete(`${POLAR_API_BASE}/webhooks/${webhook.id}`, {
          headers,
          timeout: 30_000,
        });
        webhook = undefined;
      }

      if (!webhook) {
        const created = await axios.post<PolarCreatedWebhook>(
          `${POLAR_API_BASE}/webhooks`,
          { events: POLAR_WEBHOOK_EVENTS, url },
          { headers, timeout: 30_000 },
        );
        await this.queueService.setPolarWebhookSecret(
          created.data.data.signature_secret_key,
        );
        this.logger.log(`Polar webhook ${created.data.data.id} created`);
        return;
      }

      const eventsMatch =
        POLAR_WEBHOOK_EVENTS.length === webhook.events.length &&
        POLAR_WEBHOOK_EVENTS.every((event) => webhook.events.includes(event));
      if (webhook.url !== url || !eventsMatch) {
        await axios.patch(
          `${POLAR_API_BASE}/webhooks/${webhook.id}`,
          { events: POLAR_WEBHOOK_EVENTS, url },
          { headers, timeout: 30_000 },
        );
        this.logger.log(`Polar webhook ${webhook.id} updated`);
      }
      if (webhook.active === false) {
        await axios.post(`${POLAR_API_BASE}/webhooks/activate`, null, {
          headers,
          timeout: 30_000,
        });
        this.logger.warn(`Polar webhook ${webhook.id} was off: reactivated`);
      }
    } catch (error) {
      // Imports go on through the hourly sync
      this.logger.error(
        `Polar webhook setup failed (${isAxiosError(error) ? error.response?.status : 'no response'}): ${isAxiosError(error) ? JSON.stringify(error.response?.data) : String(error)}`,
      );
    }
  }

  /** The key of a webhook this instance created, then the configured one */
  private async webhookSecrets(): Promise<string[]> {
    const secrets = [
      await this.queueService.getPolarWebhookSecret(),
      this.configService.get('POLAR_WEBHOOK_SECRET_KEY'),
    ];
    return secrets.filter((secret): secret is string => Boolean(secret));
  }

  /** The signature covers the bytes Polar sent, not their parsed JSON */
  verifyWebhookSignature(
    rawBody: Buffer | undefined,
    signature: string | undefined,
    secrets: string[],
  ): boolean {
    if (!rawBody || !signature) return false;
    const received = Buffer.from(signature);
    return secrets.some((secret) => {
      const expected = Buffer.from(
        crypto.createHmac('sha256', secret).update(rawBody).digest('hex'),
      );
      return (
        expected.length === received.length &&
        crypto.timingSafeEqual(expected, received)
      );
    });
  }

  /** Answers at once: the work happens in the polar-notification queue */
  async handleWebhook(
    payload: PolarWebhookPayload,
    rawBody?: Buffer,
    signature?: string,
  ): Promise<void> {
    // Sent while the webhook is created, before we can know its key
    if (payload.event === 'PING') return;

    const secrets = await this.webhookSecrets();
    if (!this.verifyWebhookSignature(rawBody, signature, secrets)) {
      this.logger.warn(
        `Polar webhook refused: bad signature on ${payload.event} (${secrets.length} keys known)`,
      );
      throw new BadRequestException('Invalid webhook signature');
    }

    if (!payload.user_id) return;
    const account = await this.prisma.providerAccount.findFirst({
      where: {
        provider: ConnectorProvider.POLAR,
        externalUserId: payload.user_id.toString(),
        status: 'active',
      },
    });
    if (!account) {
      this.logger.debug(`No Polar account for user ${payload.user_id}`);
      return;
    }

    if (payload.event === 'EXERCISE') {
      if (account.importActivitiesEnabled && payload.entity_id) {
        await this.queueService.addPolarExerciseJob(
          account.providerAccountId,
          payload.entity_id,
        );
      }
    } else if (account.importMetricsEnabled) {
      await this.queueService.addPolarMetricsJob(account.providerAccountId);
    }
  }

  /**
   * GET a user resource.
   * @returns null on 204 and 404, which Polar answers when there is no data
   */
  private async request<T>(
    account: ProviderAccount,
    path: string,
    config: AxiosRequestConfig = {},
  ): Promise<T | null> {
    try {
      const response = await axios.get<T>(`${POLAR_API_BASE}${path}`, {
        ...config,
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          Accept: config.responseType ? '*/*' : 'application/json',
        },
        timeout: config.timeout ?? 30_000,
      });
      return response.status === 204 ? null : response.data;
    } catch (error) {
      if (!isAxiosError(error)) throw error;
      const status = error.response?.status;
      if (status === 404) return null;
      if (status === 401) {
        // Polar tokens only stop working when the user revokes them
        this.logger.warn(
          `Polar refused account ${account.providerAccountId}: marking it revoked`,
        );
        await this.prisma.providerAccount.update({
          where: { providerAccountId: account.providerAccountId },
          data: { status: 'revoked' },
        });
      }
      if (status === 429) {
        const reset = String(
          error.response?.headers?.['ratelimit-reset'] ?? '',
        );
        const seconds = Number.parseInt(reset.split(',')[0], 10);
        throw new ProviderRateLimitError(
          'Polar',
          Number.isFinite(seconds) ? seconds * 1000 : undefined,
        );
      }
      if (status === 403) {
        this.logger.warn(
          `Polar account ${account.providerAccountId} is missing mandatory consents`,
        );
      }
      throw error;
    }
  }

  private toImportedActivity(exercise: PolarExercise): ImportedActivity {
    const startDate = polarStartDate(exercise);
    const duration = parsePolarDuration(exercise.duration);
    return {
      externalId: exercise.id,
      name: polarActivityName(exercise),
      startDate,
      endDate: new Date(startDate.getTime() + duration * 1000),
      sport: mapPolarSport(exercise),
      distance: exercise.distance,
      duration,
      raw: exercise,
    };
  }

  /**
   * Exercises Polar holds for this account: those uploaded to Flow in the
   * last 30 days and after the user connected. Polar offers nothing older.
   */
  async importActivities(
    account: ProviderAccount,
    options?: ImportOptions,
  ): Promise<ImportedActivity[]> {
    const exercises =
      (await this.request<PolarExercise[]>(account, '/exercises')) ?? [];
    return exercises
      .filter((exercise) => exercise?.id && exercise.start_time)
      .map((exercise) => this.toImportedActivity(exercise))
      .filter(
        ({ startDate }) =>
          (!options?.startDate || startDate >= options.startDate) &&
          (!options?.endDate || startDate <= options.endDate),
      )
      .slice(0, options?.limit);
  }

  /** Import a session a webhook announced */
  async processExerciseNotification(
    providerAccountId: number,
    exerciseId: string,
  ): Promise<void> {
    const account = await this.activeAccount(providerAccountId);
    if (!account?.importActivitiesEnabled) return;

    const exercise = await this.request<PolarExercise>(
      account,
      `/exercises/${encodeURIComponent(exerciseId)}`,
    );
    if (!exercise?.id) {
      this.logger.warn(`Polar exercise ${exerciseId} not found`);
      return;
    }
    await this.queueService.addActivityImportJobs(account, [
      this.toImportedActivity(exercise),
    ]);
  }

  /** Catch up on the sessions no webhook brought */
  async syncAccount(providerAccountId: number): Promise<void> {
    const account = await this.activeAccount(providerAccountId);
    if (!account?.importActivitiesEnabled) return;

    const activities = await this.importActivities(account);
    if (activities.length === 0) return;

    const known = await this.prisma.eventActivity.findMany({
      where: {
        provider: ConnectorProvider.POLAR,
        externalId: { in: activities.map((activity) => activity.externalId) },
      },
      select: { externalId: true },
    });
    const knownIds = new Set(known.map((activity) => activity.externalId));
    const missing = activities.filter(
      (activity) => !knownIds.has(activity.externalId),
    );
    if (missing.length === 0) return;

    this.logger.log(
      `Importing ${missing.length} Polar activities for account ${providerAccountId}`,
    );
    await this.queueService.addActivityImportJobs(account, missing);
  }

  private async activeAccount(
    providerAccountId: number,
  ): Promise<ProviderAccount | null> {
    const account = await this.prisma.providerAccount.findUnique({
      where: { providerAccountId },
    });
    return account?.status === 'active' ? account : null;
  }

  async importActivity(
    account: ProviderAccount,
    activity: ImportedActivity,
  ): Promise<ImportResult> {
    const existing = await this.prisma.eventActivity.findFirst({
      where: {
        provider: ConnectorProvider.POLAR,
        externalId: activity.externalId,
      },
    });
    if (existing) return { activity: existing, created: false };

    const exercise = activity.raw as PolarExercise;
    const duration = activity.duration ?? 0;

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
            provider: ConnectorProvider.POLAR,
            externalId: exercise.id,
            distance: roundDistance(exercise.distance ?? 0) ?? 0,
            movingTime: duration,
            averageSpeed:
              duration > 0 && exercise.distance
                ? (roundSpeed(exercise.distance / duration) ?? 0)
                : 0,
            maxSpeed: 0,
            elevationGain: 0,
            kilojoules: exercise.calories
              ? roundEnergy(exercise.calories * KCAL_TO_KJ)
              : null,
            averageHeartrate: exercise.heart_rate?.average
              ? roundHeartrate(exercise.heart_rate.average)
              : null,
            maxHeartrate: exercise.heart_rate?.maximum
              ? roundHeartrate(exercise.heart_rate.maximum)
              : null,
            sport: mapPolarSport(exercise),
          },
        });
      });
    } catch (error) {
      // A webhook and the hourly sync can race for the same exercise
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const winner = await this.prisma.eventActivity.findFirst({
          where: { externalId: activity.externalId },
        });
        if (winner) return { activity: winner, created: false };
      }
      throw error;
    }

    await this.importActivityFile(account, saved);
    return { activity: saved, created: true };
  }

  /**
   * Attach the recording. FIT carries every sensor; GPX, for what FIT can't
   * give, has the route. An activity without one keeps its summary.
   */
  private async importActivityFile(
    account: ProviderAccount,
    activity: EventActivity,
  ): Promise<void> {
    const exerciseId = encodeURIComponent(activity.externalId ?? '');
    let stream: ActivityStream | null = null;

    for (const type of ['fit', 'gpx'] as const) {
      try {
        const file = await this.request<ArrayBuffer>(
          account,
          `/exercises/${exerciseId}/${type}`,
          { responseType: 'arraybuffer', timeout: 60_000 },
        );
        if (!file) continue;
        const parsed = await this.activityFileParserService.parseByFileType(
          file,
          type === 'fit' ? 'FIT' : 'GPX',
        );
        stream = parsed.stream;
        break;
      } catch (error) {
        if (error instanceof ProviderRateLimitError) throw error;
        this.logger.warn(
          `Polar ${type} failed for activity ${activity.eventActivityId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    if (!stream) return;

    await this.prisma.eventActivity.update({
      where: { eventActivityId: activity.eventActivityId },
      // A corrected activity keeps its corrections over the new recording
      data: await streamUpdate(
        this.prisma,
        activity.eventActivityId,
        compressActivityStream(stream),
      ),
    });
  }

  /** Sync what Polar holds: 28 days of each kind, its longest list */
  async syncAccountMetrics(providerAccountId: number): Promise<void> {
    const account = await this.activeAccount(providerAccountId);
    if (!account?.importMetricsEnabled) return;

    // One failing endpoint leaves the others; all failing is worth a retry
    const failures: unknown[] = [];
    const safely = async <T>(path: string): Promise<T | null> => {
      try {
        return await this.request<T>(account, path);
      } catch (error) {
        if (error instanceof ProviderRateLimitError) throw error;
        failures.push(error);
        this.logger.warn(
          `Polar ${path} failed for account ${providerAccountId}: ${error instanceof Error ? error.message : String(error)}`,
        );
        return null;
      }
    };

    const days = await safely<PolarDailyActivity[]>('/users/activities');
    const sleep = await safely<{ nights?: PolarSleep[] }>('/users/sleep');
    const recharge = await safely<{ recharges?: PolarNightlyRecharge[] }>(
      '/users/nightly-recharge',
    );
    const physical = await safely<PolarPhysicalInfo>('/users/physical-info');
    if (failures.length === 4) throw failures[0];

    const metrics = [
      ...mapPolarDailyActivity(days ?? []),
      ...mapPolarSleep(sleep?.nights ?? []),
      ...mapPolarNightlyRecharge(recharge?.recharges ?? []),
      ...(physical ? mapPolarPhysicalInfo(physical, new Date()) : []),
    ];
    await this.saveMetrics(account.athleteId, metrics);
    this.logger.log(
      `Synced ${metrics.length} Polar metrics for account ${providerAccountId}`,
    );
  }

  private async saveMetrics(
    athleteId: number,
    metrics: PolarMetricRecord[],
  ): Promise<void> {
    for (const { type, date, value } of metrics) {
      const rounded = roundMetricValue(value);
      await this.prisma.athleteMetric.upsert({
        where: { athleteId_type_date: { athleteId, type, date } },
        create: { athleteId, type, date, value: rounded },
        update: { value: rounded },
      });
    }
  }

  /**
   * Webhooks are the fast path, this the safety net: a lost delivery, or a
   * webhook Polar turned off, delays a session by an hour at most. Polar
   * keeps exercises for 30 days, so none is lost.
   */
  @Cron('20 * * * *', { timeZone: 'UTC' })
  async queueHourlySync(): Promise<void> {
    if (!this.isSchedulingInstance()) return;
    await this.ensureWebhook();

    const accounts = await this.activeAccountIds({
      importActivitiesEnabled: true,
    });
    for (const [index, id] of accounts.entries()) {
      // Spread the requests over ten minutes
      await this.queueService.addPolarSyncJob(
        id,
        Math.round((index / accounts.length) * 600_000),
      );
    }
  }

  /** Daily: ACTIVITY_SUMMARY and SLEEP may not cover every watch */
  @Cron('50 4 * * *', { timeZone: 'UTC' })
  async queueDailyMetricsSync(): Promise<void> {
    if (!this.isSchedulingInstance()) return;
    const accounts = await this.activeAccountIds({
      importMetricsEnabled: true,
    });
    for (const [index, id] of accounts.entries()) {
      // Spread the requests over an hour
      await this.queueService.addPolarMetricsJob(
        id,
        Math.round((index / accounts.length) * 3_600_000) + 60_000,
      );
    }
  }

  /** The API and the worker run the same image: one of them queues */
  private isSchedulingInstance(): boolean {
    return (
      this.configService.get('ENABLE_ACTIVITY_IMPORT') === true &&
      Boolean(this.configService.get('POLAR_CLIENT_ID'))
    );
  }

  private async activeAccountIds(
    where: Prisma.ProviderAccountWhereInput,
  ): Promise<number[]> {
    const accounts = await this.prisma.providerAccount.findMany({
      where: { ...where, provider: ConnectorProvider.POLAR, status: 'active' },
      select: { providerAccountId: true },
    });
    return accounts.map((account) => account.providerAccountId);
  }
}
