import axios, { isAxiosError } from 'axios';
import * as crypto from 'node:crypto';

import {
  BadRequestException,
  Inject,
  Injectable,
  OnModuleInit,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  connector_provider,
  event_activity,
  event_type,
  metric_type,
  provider_account,
  sport_type,
} from '@openathlete/database';
import {
  ActivityStream,
  ApiEnvSchemaType,
  METRIC_TYPE,
} from '@openathlete/shared';

import { compressActivityStream } from '../../core/helpers/activity-stream';
import {
  parseFitFile,
  parseGpxFile,
} from '../../core/helpers/garmin-file-parser';
import {
  roundDistance,
  roundEnergy,
  roundHeartrate,
  roundMetricValue,
} from '../../core/helpers/round-activity-values';
import {
  PolarActivitySummary,
  PolarActivityTransaction,
  PolarActivityTransactionResponse,
  PolarExercise,
  PolarExerciseTransaction,
  PolarExerciseTransactionResponse,
  PolarOAuthTokenResponse,
  PolarSleep,
  PolarUser,
  PolarWebhookCreateRequest,
  PolarWebhookCreateResponse,
  PolarWebhookPayload,
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

const POLAR_API_BASE = 'https://www.polaraccesslink.com/v3';
const POLAR_OAUTH_AUTHORIZE = 'https://flow.polar.com/oauth2/authorization';
const POLAR_OAUTH_TOKEN = 'https://polarremote.com/v2/oauth2/token';

type MetricRecord = {
  type: METRIC_TYPE;
  date: Date;
  value: number;
};

@Injectable()
export class PolarProviderService
  extends BaseProviderService
  implements ProviderImportCapability, OnModuleInit
{
  protected readonly provider = connector_provider.POLAR;
  private readonly importWindowMs = 30 * 24 * 60 * 60 * 1000;
  private webhookSecretKey: string | null = null;

  protected get oauthConfig(): OAuthConfig {
    return {
      authorizationUrl: POLAR_OAUTH_AUTHORIZE,
      tokenUrl: POLAR_OAUTH_TOKEN,
      clientId: this.configService.get('POLAR_CLIENT_ID') || '',
      clientSecret: this.configService.get('POLAR_CLIENT_SECRET') || '',
      redirectUri: this.configService.get('POLAR_REDIRECT_URI') || '',
      scopes: ['accesslink.read_all'],
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

  async onModuleInit() {
    // Load webhook secret key from config if available
    const configSecret = this.configService.get('POLAR_WEBHOOK_SECRET_KEY');
    if (configSecret) {
      this.webhookSecretKey = configSecret;
      this.logger.log(
        'Polar webhook secret key loaded from environment config',
      );
    } else {
      this.logger.warn(
        'POLAR_WEBHOOK_SECRET_KEY not configured. Webhook signature verification will be skipped until webhook is created.',
      );
    }
  }

  /**
   * Polar uses Basic auth for token exchange (not standard OAuth)
   */
  override getAuthorizationUri(state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.oauthConfig.clientId,
      ...(this.oauthConfig.redirectUri && {
        redirect_uri: this.oauthConfig.redirectUri,
      }),
      ...(this.oauthConfig.scopes.length > 0 && {
        scope: this.oauthConfig.scopes.join(' '),
      }),
      ...(state && { state }),
    });

    return `${this.oauthConfig.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Polar token exchange uses Basic auth (client_id:client_secret)
   */
  override async exchangeCodeForTokens(
    code: string,
  ): Promise<OAuthTokenResponse> {
    this.logger.log('Starting Polar OAuth token exchange');
    try {
      const auth = Buffer.from(
        `${this.oauthConfig.clientId}:${this.oauthConfig.clientSecret}`,
      ).toString('base64');

      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        ...(this.oauthConfig.redirectUri && {
          redirect_uri: this.oauthConfig.redirectUri,
        }),
      });

      this.logger.debug(
        `Polar token exchange URL: ${this.oauthConfig.tokenUrl}`,
      );

      const { data } = await axios.post<PolarOAuthTokenResponse>(
        this.oauthConfig.tokenUrl,
        params.toString(),
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json;charset=UTF-8',
          },
        },
      );

      this.logger.log(
        `Polar OAuth token exchange successful. Token expires in: ${data.expires_in}s, x_user_id: ${data.x_user_id}`,
      );

      // Convert Polar response to standard OAuthTokenResponse
      // Note: x_user_id is Polar Ecosystem user id, not AccessLink user id
      // AccessLink user id is obtained after registration
      return {
        access_token: data.access_token,
        token_type: data.token_type || 'bearer',
        expires_in: data.expires_in,
        // Polar doesn't provide refresh_token, tokens don't expire
        refresh_token: '',
        scope: 'accesslink.read_all',
      };
    } catch (error) {
      if (isAxiosError(error)) {
        this.logger.error(
          `Polar OAuth token exchange failed: ${JSON.stringify(error.response?.data)}`,
        );
        this.logger.error(
          `Polar OAuth token exchange error status: ${error.response?.status}`,
        );
      }
      throw error;
    }
  }

  /**
   * Register user in Polar AccessLink (required before accessing data)
   * @param accessToken - Polar access token
   * @param athleteId - Our athlete ID to generate stable member-id
   */
  async registerUser(
    accessToken: string,
    athleteId: number,
  ): Promise<PolarUser> {
    this.logger.log(
      `Starting Polar user registration for athlete ${athleteId}`,
    );
    try {
      // Polar requires XML body for user registration
      // According to Polar API docs, the body must contain <register> with <member-id>
      // member-id is a partner's custom identifier for the user
      // Use stable member-id based on athlete_id so we can reuse it
      const memberId = `oa_athlete_${athleteId}`;
      const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<register>
  <member-id>${memberId}</member-id>
</register>`;

      this.logger.debug(`Polar user registration - member-id: ${memberId}`);
      this.logger.debug(`Polar user registration XML body: ${xmlBody}`);

      const response = await axios.post(`${POLAR_API_BASE}/users`, xmlBody, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/xml',
          Accept: 'application/json',
        },
        validateStatus: () => true, // Don't throw on any status
      });

      // Log full response for debugging
      this.logger.debug(
        `Polar user registration response: ${response.status} - ${JSON.stringify(response.data)}`,
      );
      this.logger.debug(
        `Polar user registration headers: ${JSON.stringify(response.headers)}`,
      );

      if (response.status === 200 || response.status === 201) {
        this.logger.log(
          `Polar user registration successful! Status: ${response.status}`,
        );
        // Success - parse response
        if (typeof response.data === 'string') {
          // XML response - try to parse or extract from Location header
          const location = response.headers.location;
          this.logger.debug(
            `Polar user registration Location header: ${location}`,
          );
          if (location) {
            const match = location.match(/\/users\/(\d+)/);
            if (match) {
              const userId = parseInt(match[1], 10);
              this.logger.log(
                `Polar user registered with AccessLink user-id: ${userId}`,
              );
              // Return minimal user object with the ID
              return {
                'polar-user-id': userId,
                'member-id': memberId,
                'registration-date': new Date().toISOString(),
                'polar-user-id-uri': location,
              } as PolarUser;
            }
          }
          // If we can't parse, try to get user info
          throw new Error('Could not parse Polar user registration response');
        }
        const userData = response.data as PolarUser;
        this.logger.log(
          `Polar user registered with AccessLink user-id: ${userData['polar-user-id']}`,
        );
        return userData;
      }

      // Handle error responses
      const errorData = response.data;
      const errorText =
        typeof errorData === 'string' ? errorData : JSON.stringify(errorData);

      if (response.status === 400) {
        this.logger.error(`Polar user registration 400 error: ${errorText}`);
        this.logger.error(`Request body was: ${xmlBody}`);
        this.logger.error(`Request URL: ${POLAR_API_BASE}/users`);
        throw new Error(
          `Polar user registration failed with 400: ${errorText || 'Bad Request - check XML format'}`,
        );
      }

      if (response.status === 409) {
        this.logger.warn(`Polar user already registered (409): ${errorText}`);
        // Try to extract userid from error message
        // Format: "User userid:63661436 with membertag ..."
        const userIdMatch = errorText.match(/userid:(\d+)/i);
        if (userIdMatch) {
          const userId = parseInt(userIdMatch[1], 10);
          this.logger.log(
            `Extracted Polar AccessLink user-id from 409 error: ${userId}`,
          );
          // Return user info with extracted ID
          return {
            'polar-user-id': userId,
            'member-id': memberId,
            'registration-date': new Date().toISOString(),
          } as PolarUser;
        }
        // If we can't extract, throw error - will be handled in connect()
        throw new Error(
          `Polar user already registered (409) but could not extract user-id from: ${errorText}`,
        );
      }

      throw new Error(
        `Polar user registration failed with status ${response.status}: ${errorText}`,
      );
    } catch (error) {
      if (isAxiosError(error)) {
        const errorData = error.response?.data;
        const errorText =
          typeof errorData === 'string' ? errorData : JSON.stringify(errorData);
        this.logger.error(`Polar user registration failed: ${errorText}`);
        this.logger.error(
          `Polar user registration error details: ${error.response?.status} - ${error.response?.statusText}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get user info
   */
  async getUserInfo(accessToken: string, userId: number): Promise<PolarUser> {
    try {
      const { data } = await axios.get<PolarUser>(
        `${POLAR_API_BASE}/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        },
      );

      return data;
    } catch (error) {
      if (isAxiosError(error)) {
        this.logger.error(
          `Polar get user info failed: ${JSON.stringify(error.response?.data)}`,
        );
      }
      throw error;
    }
  }

  /**
   * Connect user: exchange code, register user, save account
   */
  async connect(code: string, athleteId: number): Promise<provider_account> {
    this.logger.log(`Starting Polar connection flow for athlete ${athleteId}`);

    this.logger.log('Step 1: Exchanging OAuth code for token');
    const tokenResponse = await this.exchangeCodeForTokens(code);
    this.logger.log('Step 1 completed: Token obtained');

    // Register user in AccessLink
    // If registration fails (user already registered), try to get user info
    let userInfo: PolarUser;
    let accessLinkUserId: number;

    this.logger.log('Step 2: Registering user in Polar AccessLink');
    try {
      userInfo = await this.registerUser(tokenResponse.access_token, athleteId);
      accessLinkUserId = userInfo['polar-user-id'];
      this.logger.log(
        `Step 2 completed: User registered with AccessLink user-id ${accessLinkUserId}`,
      );
    } catch (error) {
      // If registration fails, check if we have an existing account
      if (isAxiosError(error) && error.response?.status === 409) {
        this.logger.log(
          'User already registered (409), checking for existing account in database',
        );

        // Check if we have an existing account for this athlete
        const existingAccount = await this.prisma.provider_account.findFirst({
          where: {
            athlete_id: athleteId,
            provider: connector_provider.POLAR,
            status: 'active',
          },
        });

        if (existingAccount?.external_user_id) {
          // Use existing external_user_id (which should be the AccessLink user-id)
          accessLinkUserId = parseInt(existingAccount.external_user_id, 10);
          this.logger.log(
            `Found existing Polar account with AccessLink user-id: ${accessLinkUserId}`,
          );
          // Create minimal userInfo object
          userInfo = {
            'polar-user-id': accessLinkUserId,
            'member-id': `oa_athlete_${athleteId}`,
            'registration-date': existingAccount.created_at.toISOString(),
          } as PolarUser;
        } else {
          // Try to extract from error message (registerUser should have done this, but just in case)
          const errorMessage =
            error.message || JSON.stringify(error.response?.data || {});
          const userIdMatch = errorMessage.match(/userid:(\d+)/i);
          if (userIdMatch) {
            accessLinkUserId = parseInt(userIdMatch[1], 10);
            this.logger.log(
              `Extracted AccessLink user-id from error message: ${accessLinkUserId}`,
            );
            userInfo = {
              'polar-user-id': accessLinkUserId,
              'member-id': `oa_athlete_${athleteId}`,
              'registration-date': new Date().toISOString(),
            } as PolarUser;
          } else {
            this.logger.error(
              'Cannot determine AccessLink user-id from 409 error',
            );
            throw new Error(
              'Polar user already registered but cannot determine user-id. Please disconnect and reconnect.',
            );
          }
        }
      } else {
        this.logger.error('Step 2 failed: User registration error');
        throw error;
      }
    }

    // Save provider account
    this.logger.log('Step 3: Saving provider account to database');
    const account = await this.saveProviderAccount({
      athleteId,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token || '',
      expiresIn: tokenResponse.expires_in,
      scopes: tokenResponse.scope,
      externalUserId: accessLinkUserId.toString(),
    });
    this.logger.log(
      `Step 3 completed: Provider account saved with ID ${account.provider_account_id}, external_user_id: ${account.external_user_id}`,
    );

    // Create webhook if not exists (one per client)
    this.logger.log('Step 4: Ensuring webhook is configured');
    await this.ensureWebhook();
    this.logger.log('Step 4 completed: Webhook check completed');

    this.logger.log(
      `Polar connection flow completed successfully for athlete ${athleteId}, account ${account.provider_account_id}`,
    );

    return account;
  }

  /**
   * Ensure webhook exists (one per client)
   */
  private async ensureWebhook(): Promise<void> {
    this.logger.log('Checking Polar webhook configuration');

    // Try to load webhook secret from config first
    const configSecret = this.configService.get('POLAR_WEBHOOK_SECRET_KEY');
    if (configSecret) {
      this.webhookSecretKey = configSecret;
      this.logger.log('Polar webhook secret key loaded from config');
    }

    if (this.webhookSecretKey) {
      this.logger.log(
        'Polar webhook secret key already available, skipping creation',
      );
      return;
    }

    const webhookUrl = this.configService.get('POLAR_WEBHOOK_URL');
    if (!webhookUrl) {
      this.logger.warn(
        'POLAR_WEBHOOK_URL not configured, skipping webhook creation. Webhooks will not work until configured.',
      );
      return;
    }

    this.logger.log(`Creating Polar webhook with URL: ${webhookUrl}`);

    try {
      const auth = Buffer.from(
        `${this.oauthConfig.clientId}:${this.oauthConfig.clientSecret}`,
      ).toString('base64');

      const request: PolarWebhookCreateRequest = {
        events: [
          'EXERCISE',
          'ACTIVITY_SUMMARY',
          'CONTINUOUS_HEART_RATE',
          'SLEEP',
          'PHYSICAL_INFORMATION',
          'NIGHTLY_RECHARGE',
          'SLEEPWISE',
        ],
        url: webhookUrl,
      };

      this.logger.debug(
        `Polar webhook creation request: ${JSON.stringify(request)}`,
      );

      const { data } = await axios.post<PolarWebhookCreateResponse>(
        `${POLAR_API_BASE}/webhooks`,
        request,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );

      // IMPORTANT: Save signature_secret_key - only returned once
      this.webhookSecretKey = data['signature-secret-key'];
      this.logger.log(
        `✅ Polar webhook created successfully! Webhook ID: ${data['webhook-id']}`,
      );
      this.logger.warn(
        `⚠️  IMPORTANT: Save this signature_secret_key to POLAR_WEBHOOK_SECRET_KEY env var: ${this.webhookSecretKey}`,
      );
      this.logger.log(`Polar webhook events: ${data.events.join(', ')}`);
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response?.status === 409) {
          // Webhook already exists
          this.logger.warn(
            'Polar webhook already exists (409). Make sure POLAR_WEBHOOK_SECRET_KEY is configured.',
          );
        } else {
          this.logger.error(
            `Failed to create Polar webhook: ${JSON.stringify(error.response?.data)}`,
          );
          this.logger.error(
            `Polar webhook creation error status: ${error.response?.status}`,
          );
        }
      } else {
        this.logger.error(
          `Polar webhook creation failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  /**
   * Verify webhook HMAC signature
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expected = hmac.digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
  }

  /**
   * Handle webhook from Polar
   */
  async handleWebhook(
    payload: PolarWebhookPayload,
    signature?: string,
  ): Promise<void> {
    this.logger.log(
      `Received Polar webhook: event=${payload.event}, user_id=${payload.user_id || 'N/A'}, entity_id=${payload.entity_id || 'N/A'}`,
    );

    // Handle PING event (webhook verification)
    if (payload.event === 'PING') {
      this.logger.log('Polar webhook PING received - responding with 200 OK');
      return;
    }

    // After PING check, TypeScript knows event is not PING
    // Verify signature if provided
    if (signature && this.webhookSecretKey) {
      const payloadString = JSON.stringify(payload);
      if (
        !this.verifyWebhookSignature(
          payloadString,
          signature,
          this.webhookSecretKey,
        )
      ) {
        this.logger.warn(
          `Polar webhook signature verification failed for event ${payload.event}`,
        );
        throw new BadRequestException('Invalid webhook signature');
      }
      this.logger.debug('Polar webhook signature verified successfully');
    } else if (signature && !this.webhookSecretKey) {
      this.logger.warn(
        'Polar webhook signature provided but secret key not configured',
      );
    }

    // Non-PING events should have user_id
    if (!payload.user_id) {
      this.logger.warn('Polar webhook payload missing user_id');
      return;
    }

    const account = await this.prisma.provider_account.findFirst({
      where: {
        provider: connector_provider.POLAR,
        external_user_id: payload.user_id.toString(),
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

    if (!account || !account.athlete || !account.athlete.user) {
      this.logger.warn(
        `No active Polar account found for user_id ${payload.user_id}`,
      );
      return;
    }

    this.logger.log(
      `Processing Polar webhook for account ${account.provider_account_id}, athlete ${account.athlete_id}`,
    );

    switch (payload.event) {
      case 'EXERCISE':
        this.logger.log(
          `Handling EXERCISE webhook for exercise_id: ${payload.entity_id}`,
        );
        if (account.import_activities_enabled && payload.entity_id) {
          await this.handleExerciseWebhook(account, payload.entity_id);
        } else {
          this.logger.debug(
            `Skipping EXERCISE webhook: import_activities_enabled=${account.import_activities_enabled}, entity_id=${payload.entity_id}`,
          );
        }
        break;
      case 'ACTIVITY_SUMMARY':
        this.logger.log('Handling ACTIVITY_SUMMARY webhook');
        if (account.import_metrics_enabled) {
          await this.handleActivitySummaryWebhook(account);
        } else {
          this.logger.debug(
            'Skipping ACTIVITY_SUMMARY webhook: import_metrics_enabled=false',
          );
        }
        break;
      case 'CONTINUOUS_HEART_RATE':
        this.logger.log('Handling CONTINUOUS_HEART_RATE webhook');
        if (account.import_metrics_enabled) {
          await this.handleContinuousHeartRateWebhook();
        } else {
          this.logger.debug(
            'Skipping CONTINUOUS_HEART_RATE webhook: import_metrics_enabled=false',
          );
        }
        break;
      case 'SLEEP':
        this.logger.log('Handling SLEEP webhook');
        if (account.import_metrics_enabled) {
          await this.handleSleepWebhook(account);
        } else {
          this.logger.debug(
            'Skipping SLEEP webhook: import_metrics_enabled=false',
          );
        }
        break;
      default:
        this.logger.debug(`Unhandled Polar webhook event: ${payload.event}`);
    }

    this.logger.log(
      `Polar webhook processing completed for event ${payload.event}`,
    );
  }

  private async handleExerciseWebhook(
    account: provider_account,
    exerciseId: string,
  ): Promise<void> {
    this.logger.log(
      `Processing EXERCISE webhook for exercise_id: ${exerciseId}, account: ${account.provider_account_id}`,
    );

    // Check if already imported
    const existing = await this.prisma.event_activity.findFirst({
      where: {
        external_id: exerciseId,
        provider: connector_provider.POLAR,
      },
    });

    if (existing) {
      this.logger.debug(`Exercise ${exerciseId} already imported, skipping`);
      return;
    }

    // Import the exercise
    try {
      this.logger.log(`Fetching Polar exercise ${exerciseId} from API`);
      const exercise = await this.fetchExercise(account, exerciseId);
      if (exercise) {
        this.logger.log(
          `Exercise ${exerciseId} fetched successfully, mapping to ImportedActivity`,
        );
        const importedActivity = this.mapExerciseToImportedActivity(exercise);
        this.logger.log(
          `Importing activity: ${importedActivity.name}, start: ${importedActivity.startDate.toISOString()}`,
        );
        await this.importActivity(account, importedActivity);
        this.logger.log(`Exercise ${exerciseId} imported successfully`);
      } else {
        this.logger.warn(`Exercise ${exerciseId} not found in Polar API`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to import Polar exercise ${exerciseId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async handleActivitySummaryWebhook(
    account: provider_account,
  ): Promise<void> {
    this.logger.log(
      `Processing ACTIVITY_SUMMARY webhook for account ${account.provider_account_id}`,
    );
    // Fetch latest activity summaries
    try {
      await this.importActivitySummaries(account);
      this.logger.log('Activity summaries imported successfully');
    } catch (error) {
      this.logger.error(
        `Failed to import Polar activity summaries: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async handleContinuousHeartRateWebhook(): Promise<void> {
    // Fetch latest continuous heart rate data
    try {
      await this.importContinuousHeartRate();
    } catch (error) {
      this.logger.error(
        `Failed to import Polar continuous heart rate: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async handleSleepWebhook(account: provider_account): Promise<void> {
    this.logger.log(
      `Processing SLEEP webhook for account ${account.provider_account_id}`,
    );
    // Fetch latest sleep data
    try {
      await this.importSleep(account);
      this.logger.log('Sleep data imported successfully');
    } catch (error) {
      this.logger.error(
        `Failed to import Polar sleep: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Make authenticated request with automatic token refresh
   */
  private async makeAuthenticatedRequest<T>(
    account: provider_account,
    requestFn: (accessToken: string) => Promise<{ data: T }>,
  ): Promise<T> {
    const accessToken = account.access_token;
    if (!accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await requestFn(accessToken);
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        // Polar tokens don't expire, but handle 401 anyway
        this.logger.error('Polar access token invalid');
        throw error;
      }
      throw error;
    }
  }

  /**
   * Import activities using transactions
   */
  async importActivities(
    account: provider_account,
    options?: ImportOptions,
  ): Promise<ImportedActivity[]> {
    this.logger.log(
      `Starting Polar activities import for account ${account.provider_account_id}`,
    );

    const userId = parseInt(account.external_user_id || '0', 10);
    if (!userId) {
      this.logger.error(`Invalid Polar user ID: ${account.external_user_id}`);
      throw new Error('Invalid Polar user ID');
    }

    this.logger.log(`Using Polar AccessLink user-id: ${userId}`);

    const activities: ImportedActivity[] = [];

    try {
      // Create exercise transaction
      this.logger.log('Creating Polar exercise transaction');
      const transaction = await this.createExerciseTransaction(account, userId);
      if (!transaction) {
        this.logger.log(
          'No new exercises available (transaction returned null/204)',
        );
        return activities;
      }

      this.logger.log(
        `Exercise transaction created: transaction-id=${transaction['transaction-id']}`,
      );

      // Get transaction details
      this.logger.log(
        `Fetching exercise transaction details for transaction-id=${transaction['transaction-id']}`,
      );
      const transactionDetails = await this.getExerciseTransaction(
        account,
        userId,
        transaction['transaction-id'],
      );

      if (!transactionDetails || !transactionDetails.exercises) {
        this.logger.log('No exercises found in transaction');
        return activities;
      }

      this.logger.log(
        `Found ${transactionDetails.exercises.length} exercises in transaction`,
      );

      // Fetch each exercise
      for (const exerciseUrl of transactionDetails.exercises) {
        if (activities.length >= (options?.limit ?? Number.POSITIVE_INFINITY)) {
          this.logger.log(`Reached limit of ${options?.limit} activities`);
          break;
        }

        try {
          this.logger.debug(`Fetching exercise from URL: ${exerciseUrl}`);
          const exercise = await this.fetchExerciseByUrl(account, exerciseUrl);

          if (exercise) {
            const imported = this.mapExerciseToImportedActivity(exercise);

            // Apply date filters
            if (options?.startDate && imported.startDate < options.startDate) {
              this.logger.debug(
                `Skipping exercise ${imported.externalId}: before startDate`,
              );
              continue;
            }
            if (options?.endDate && imported.startDate > options.endDate) {
              this.logger.debug(
                `Skipping exercise ${imported.externalId}: after endDate`,
              );
              continue;
            }

            activities.push(imported);
            this.logger.debug(
              `Added exercise to import list: ${imported.name} (${imported.externalId})`,
            );
          }
        } catch (error) {
          this.logger.warn(
            `Failed to fetch Polar exercise from ${exerciseUrl}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      this.logger.log(
        `Polar activities import completed: ${activities.length} activities found`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to import Polar activities: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    return activities;
  }

  /**
   * Create exercise transaction
   */
  private async createExerciseTransaction(
    account: provider_account,
    userId: number,
  ): Promise<PolarExerciseTransaction | null> {
    try {
      const data = await this.makeAuthenticatedRequest(
        account,
        async (accessToken) => {
          return axios.post<PolarExerciseTransaction>(
            `${POLAR_API_BASE}/users/${userId}/exercise-transactions`,
            null,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json',
              },
            },
          );
        },
      );

      return data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 204) {
        // No new exercises
        return null;
      }
      throw error;
    }
  }

  /**
   * Get exercise transaction details
   */
  private async getExerciseTransaction(
    account: provider_account,
    userId: number,
    transactionId: number,
  ): Promise<PolarExerciseTransactionResponse | null> {
    try {
      const data = await this.makeAuthenticatedRequest(
        account,
        async (accessToken) => {
          return axios.get<PolarExerciseTransactionResponse>(
            `${POLAR_API_BASE}/users/${userId}/exercise-transactions/${transactionId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json',
              },
            },
          );
        },
      );

      return data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Fetch exercise by ID
   */
  private async fetchExercise(
    account: provider_account,
    exerciseId: string,
  ): Promise<PolarExercise | null> {
    try {
      const data = await this.makeAuthenticatedRequest(
        account,
        async (accessToken) => {
          return axios.get<PolarExercise>(
            `${POLAR_API_BASE}/exercises/${exerciseId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json',
              },
            },
          );
        },
      );

      return data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Fetch exercise by URL
   */
  private async fetchExerciseByUrl(
    account: provider_account,
    exerciseUrl: string,
  ): Promise<PolarExercise | null> {
    try {
      const data = await this.makeAuthenticatedRequest(
        account,
        async (accessToken) => {
          return axios.get<PolarExercise>(exerciseUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
          });
        },
      );

      return data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Map Polar exercise to ImportedActivity
   */
  private mapExerciseToImportedActivity(
    exercise: PolarExercise,
  ): ImportedActivity {
    const startDate = new Date(exercise['start-time']);
    const durationMatch = exercise.duration.match(
      /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/,
    );
    let durationSeconds = 0;
    if (durationMatch) {
      const hours = parseInt(durationMatch[1] || '0', 10);
      const minutes = parseInt(durationMatch[2] || '0', 10);
      const seconds = parseInt(durationMatch[3] || '0', 10);
      durationSeconds = hours * 3600 + minutes * 60 + seconds;
    }
    const endDate = new Date(startDate.getTime() + durationSeconds * 1000);

    // Map Polar sport to our sport_type (basic mapping)
    const sport = this.mapPolarSportToSportType(exercise.sport || 'OTHER');

    return {
      externalId: exercise['exercise-id'],
      name: exercise.sport || 'Exercise',
      startDate,
      endDate,
      sport,
      distance: exercise.distance,
      duration: durationSeconds,
      raw: exercise,
    };
  }

  /**
   * Map Polar sport to sport_type
   */
  private mapPolarSportToSportType(polarSport: string): sport_type {
    // Basic mapping - can be extended
    const upper = polarSport.toUpperCase();
    if (upper.includes('RUNNING') || upper.includes('RUN')) {
      return 'RUNNING';
    }
    if (upper.includes('CYCLING') || upper.includes('BIKE')) {
      return 'CYCLING';
    }
    if (upper.includes('SWIMMING') || upper.includes('SWIM')) {
      return 'SWIMMING';
    }
    if (upper.includes('TRAIL')) {
      return 'TRAIL_RUNNING';
    }
    return 'OTHER';
  }

  /**
   * Import a single activity
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

    const polarExercise = activity.raw as PolarExercise;
    const savedActivity = await this.saveActivityData(
      account,
      event,
      polarExercise,
    );

    // Try to fetch and process FIT file
    try {
      await this.processActivityFile(
        account,
        savedActivity,
        polarExercise['exercise-id'],
      );
    } catch (error) {
      // Activity saved without stream
      this.logger.debug(
        `Failed to fetch FIT file for Polar exercise ${polarExercise['exercise-id']}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return savedActivity;
  }

  /**
   * Save activity data
   */
  private async saveActivityData(
    account: provider_account,
    event: { event_id: number },
    exercise: PolarExercise,
  ): Promise<event_activity> {
    const durationMatch = exercise.duration.match(
      /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/,
    );
    let durationSeconds = 0;
    if (durationMatch) {
      const hours = parseInt(durationMatch[1] || '0', 10);
      const minutes = parseInt(durationMatch[2] || '0', 10);
      const seconds = parseInt(durationMatch[3] || '0', 10);
      durationSeconds = hours * 3600 + minutes * 60 + seconds;
    }

    return this.prisma.event_activity.create({
      data: {
        event_id: event.event_id,
        provider: connector_provider.POLAR,
        external_id: exercise['exercise-id'],
        distance: exercise.distance ? roundDistance(exercise.distance) : 0,
        moving_time: durationSeconds,
        average_speed: 0,
        max_speed: 0,
        elevation_gain: 0, // Polar doesn't provide this in exercise summary
        kilojoules: exercise.calories ? roundEnergy(exercise.calories) : null,
        average_heartrate: exercise['heart-rate']?.average
          ? roundHeartrate(exercise['heart-rate'].average)
          : null,
        max_heartrate: exercise['heart-rate']?.maximum
          ? roundHeartrate(exercise['heart-rate'].maximum)
          : null,
        sport: this.mapPolarSportToSportType(exercise.sport || 'OTHER'),
      },
    });
  }

  /**
   * Process activity file (FIT/TCX/GPX)
   */
  private async processActivityFile(
    account: provider_account,
    activity: event_activity,
    exerciseId: string,
  ): Promise<void> {
    try {
      // Try FIT first, then GPX (TCX parsing not implemented yet)
      let activityStream: ActivityStream | null = null;

      for (const type of ['fit', 'gpx'] as const) {
        try {
          const data = await this.makeAuthenticatedRequest(
            account,
            async (accessToken) => {
              return axios.get<ArrayBuffer>(
                `${POLAR_API_BASE}/exercises/${exerciseId}/${type}`,
                {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: '*/*',
                  },
                  responseType: 'arraybuffer',
                  timeout: 60000,
                },
              );
            },
          );

          if (type === 'fit') {
            const fitParseResult = await parseFitFile(data);
            activityStream = fitParseResult.stream;
          } else if (type === 'gpx') {
            activityStream = await parseGpxFile(data);
          }
          // TCX parsing not implemented yet, skip for now

          if (activityStream) {
            break;
          }
        } catch {
          // Try next format
          continue;
        }
      }

      if (!activityStream) {
        return;
      }

      const compressedStream = compressActivityStream(activityStream);

      await this.prisma.event_activity.update({
        where: {
          event_activity_id: activity.event_activity_id,
        },
        data: {
          stream: compressedStream as object,
        },
      });

      const activityWithEvent = await this.prisma.event_activity.findUnique({
        where: { event_activity_id: activity.event_activity_id },
        select: {
          event: { select: { athlete_id: true } },
          stream: true,
          event_id: true,
        },
      });

      if (
        activityWithEvent?.stream &&
        activityWithEvent.event &&
        activityWithEvent.event_id
      ) {
        await this.queueService.addActivityProcessingJob(
          activity.event_activity_id,
          activityWithEvent.event_id,
          false,
        );
      }
    } catch (error) {
      // Failed to download/parse file, activity remains without stream
      this.logger.debug(
        `Failed to process Polar activity file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Queue full import
   */
  async queueFullImport(account: provider_account): Promise<FullImportResult> {
    this.logger.log(
      `Starting Polar full import for account ${account.provider_account_id}`,
    );

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - this.importWindowMs);

    this.logger.log(
      `Import window: ${startDate.toISOString()} to ${endDate.toISOString()} (${this.importWindowMs / (24 * 60 * 60 * 1000)} days)`,
    );

    const activities = await this.importActivities(account, {
      startDate,
      endDate,
    });

    this.logger.log(
      `Found ${activities.length} activities, queuing for import`,
    );

    const queued = await this.enqueueActivities(account, activities);

    this.logger.log(
      `Polar full import completed: ${queued} activities queued (out of ${activities.length} found)`,
    );

    return {
      queuedActivities: queued,
      backfillRequested: false,
    };
  }

  /**
   * Enqueue activities for import
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
        `No new Polar activities to queue for account ${account.provider_account_id}`,
      );
      return 0;
    }

    await this.queueService.addActivityImportJobs(account, newActivities, true);
    return newActivities.length;
  }

  /**
   * Import activity summaries (daily metrics)
   */
  private async importActivitySummaries(
    account: provider_account,
  ): Promise<void> {
    const userId = parseInt(account.external_user_id || '0', 10);
    if (!userId) {
      return;
    }

    try {
      const transaction = await this.createActivityTransaction(account, userId);
      if (!transaction) {
        return;
      }

      const transactionDetails = await this.getActivityTransaction(
        account,
        userId,
        transaction['transaction-id'],
      );

      if (!transactionDetails || !transactionDetails.activities) {
        return;
      }

      const metrics: MetricRecord[] = [];

      for (const activityUrl of transactionDetails.activities) {
        try {
          const data = await this.makeAuthenticatedRequest(
            account,
            async (accessToken) => {
              return axios.get<PolarActivitySummary>(activityUrl, {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  Accept: 'application/json',
                },
              });
            },
          );

          const date = new Date(data.date);
          this.addMetricIfDefined(
            metrics,
            METRIC_TYPE.DAILY_STEPS,
            date,
            data.steps,
          );
          this.addMetricIfDefined(
            metrics,
            METRIC_TYPE.DAILY_DISTANCE,
            date,
            data['daily-activity'] ? data['daily-activity'] / 1000 : undefined, // Convert to km
          );
          this.addMetricIfDefined(
            metrics,
            METRIC_TYPE.DAILY_CALORIES,
            date,
            data.calories,
          );
          this.addMetricIfDefined(
            metrics,
            METRIC_TYPE.DAILY_ACTIVE_CALORIES,
            date,
            data['active-calories'],
          );
          this.addMetricIfDefined(
            metrics,
            METRIC_TYPE.DAILY_ACTIVE_MINUTES,
            date,
            data['daily-activity'] ? data['daily-activity'] / 60 : undefined, // Convert to minutes
          );
          this.addMetricIfDefined(
            metrics,
            METRIC_TYPE.HR_AVG_DAILY,
            date,
            data['heart-rate']?.average,
          );
          this.addMetricIfDefined(
            metrics,
            METRIC_TYPE.HR_MAX_DAILY,
            date,
            data['heart-rate']?.maximum,
          );
        } catch (error) {
          this.logger.warn(
            `Failed to fetch Polar activity summary: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      if (metrics.length > 0) {
        await this.saveMetrics(account.athlete_id, metrics);
      }
    } catch (error) {
      this.logger.error(
        `Failed to import Polar activity summaries: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Import continuous heart rate
   */
  private async importContinuousHeartRate(): Promise<void> {
    // Implementation for continuous heart rate import
    // This would use /v3/users/{user-id}/continuous-heart-rate endpoints
    this.logger.debug('Continuous heart rate import not yet implemented');
  }

  /**
   * Import sleep data
   */
  private async importSleep(account: provider_account): Promise<void> {
    const userId = parseInt(account.external_user_id || '0', 10);
    if (!userId) {
      return;
    }

    try {
      // Get sleep data for last 30 days
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const data = await this.makeAuthenticatedRequest(
        account,
        async (accessToken) => {
          return axios.get<PolarSleep[]>(
            `${POLAR_API_BASE}/users/${userId}/sleep`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json',
              },
              params: {
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0],
              },
            },
          );
        },
      );

      const metrics: MetricRecord[] = [];

      for (const sleep of data) {
        const date = new Date(sleep.date);
        this.addMetricIfDefined(
          metrics,
          METRIC_TYPE.SLEEP_DURATION,
          date,
          sleep['total-sleep-time']
            ? sleep['total-sleep-time'] / 3600
            : undefined, // Convert to hours
        );
        this.addMetricIfDefined(
          metrics,
          METRIC_TYPE.SLEEP_DEEP_DURATION,
          date,
          sleep['deep-sleep'] ? sleep['deep-sleep'] / 3600 : undefined,
        );
        this.addMetricIfDefined(
          metrics,
          METRIC_TYPE.SLEEP_LIGHT_DURATION,
          date,
          sleep['light-sleep'] ? sleep['light-sleep'] / 3600 : undefined,
        );
        this.addMetricIfDefined(
          metrics,
          METRIC_TYPE.SLEEP_REM_DURATION,
          date,
          sleep['rem-sleep'] ? sleep['rem-sleep'] / 3600 : undefined,
        );
        this.addMetricIfDefined(
          metrics,
          METRIC_TYPE.SLEEP_AWAKE_DURATION,
          date,
          sleep['awake-duration'] ? sleep['awake-duration'] / 3600 : undefined,
        );
        this.addMetricIfDefined(
          metrics,
          METRIC_TYPE.SLEEP_SCORE,
          date,
          sleep['sleep-score'],
        );
      }

      if (metrics.length > 0) {
        await this.saveMetrics(account.athlete_id, metrics);
      }
    } catch (error) {
      this.logger.error(
        `Failed to import Polar sleep: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Create activity transaction
   */
  private async createActivityTransaction(
    account: provider_account,
    userId: number,
  ): Promise<PolarActivityTransaction | null> {
    try {
      const data = await this.makeAuthenticatedRequest(
        account,
        async (accessToken) => {
          return axios.post<PolarActivityTransaction>(
            `${POLAR_API_BASE}/users/${userId}/activity-transactions`,
            null,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json',
              },
            },
          );
        },
      );

      return data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 204) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get activity transaction details
   */
  private async getActivityTransaction(
    account: provider_account,
    userId: number,
    transactionId: number,
  ): Promise<PolarActivityTransactionResponse | null> {
    try {
      const data = await this.makeAuthenticatedRequest(
        account,
        async (accessToken) => {
          return axios.get<PolarActivityTransactionResponse>(
            `${POLAR_API_BASE}/users/${userId}/activity-transactions/${transactionId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json',
              },
            },
          );
        },
      );

      return data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Save metrics
   */
  private async saveMetrics(
    athleteId: number,
    metrics: MetricRecord[],
  ): Promise<void> {
    if (metrics.length === 0) {
      return;
    }

    for (const metric of metrics) {
      try {
        await this.prisma.athlete_metric.upsert({
          where: {
            athlete_id_type_date: {
              athlete_id: athleteId,
              type: metric.type as metric_type,
              date: metric.date,
            },
          },
          create: {
            athlete_id: athleteId,
            type: metric.type as metric_type,
            date: metric.date,
            value: roundMetricValue(metric.value),
          },
          update: {
            value: roundMetricValue(metric.value),
          },
        });
      } catch (error) {
        this.logger.warn(
          `Failed to save metric ${metric.type} for athlete ${athleteId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  /**
   * Add metric if value is defined
   */
  private addMetricIfDefined(
    target: MetricRecord[],
    type: METRIC_TYPE,
    date: Date,
    value: number | undefined | null,
  ): void {
    if (value !== undefined && value !== null && Number.isFinite(value)) {
      target.push({
        type,
        date,
        value,
      });
    }
  }
}
