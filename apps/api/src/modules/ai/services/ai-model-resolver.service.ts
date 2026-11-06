import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  AI_FEATURE_TASKS,
  AiAccessDto,
  AiAccessSource,
  AiFeatureTask,
  AiTask,
  AiTaskAccessDto,
  CUSTOM_AI_PROVIDER,
} from '@openathlete/shared';

import { hostedModelFor } from 'src/common/constants/ai-models.constant';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { SubscriptionService } from 'src/modules/subscription/services/subscription.service';

import {
  AiConsentRequiredException,
  AiHostedQuotaExceededException,
  AiNotConfiguredException,
} from '../ai.errors';
import { AiCredentialCipher } from './ai-credential-cipher';
import {
  mergeCredentialHeaders,
  parseCredentialHeaders,
  providerHeaders,
} from './ai-credential-headers';
import { AiPolicyService } from './ai-policy.service';
import { AiProviderCatalogService } from './ai-provider-catalog.service';
import { AiUsageService } from './ai-usage.service';

export const AI_CREDENTIAL_CIPHER = Symbol('AI_CREDENTIAL_CIPHER');
export const AI_ENV = Symbol('AI_ENV');

/** How Mastra reaches the model, with the key the call is billed to. */
export type AiModelConfig =
  | {
      id: `${string}/${string}`;
      apiKey: string;
      url?: string;
      headers?: Record<string, string>;
    }
  | {
      providerId: string;
      modelId: string;
      url: string;
      apiKey: string;
      headers?: Record<string, string>;
    };

export interface ResolvedAiModel {
  task: AiFeatureTask;
  source: AiAccessSource;
  /** User whose key or plan pays for the call */
  userId: number;
  provider: string;
  modelId: string;
  /** Set when the call runs on a user's own key */
  credentialId: number | null;
  config: AiModelConfig;
}

/** Placeholder for endpoints that need no key (local Ollama, LM Studio). */
const NO_API_KEY = 'not-needed';

/**
 * Decides which model and key run an AI feature:
 * 1. the model the user chose for the task (or their default), on their key;
 * 2. otherwise the instance keys, when their plan or the instance policy
 *    allows it (AI_HOSTED_ACCESS) and their monthly budget is not used up
 *    (AI_HOSTED_MONTHLY_BUDGET_USD);
 * 3. for work done on an athlete's behalf (feedback questions, analysis,
 *    load estimation), the same for each of the athlete's coaches.
 *
 * Nothing runs on someone's data until they allowed it to be sent to AI
 * providers (App Store guideline 5.1.2(i), GDPR).
 */
@Injectable()
export class AiModelResolverService {
  private readonly logger = new Logger(AiModelResolverService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: AiPolicyService,
    private readonly catalog: AiProviderCatalogService,
    private readonly subscriptionService: SubscriptionService,
    private readonly usage: AiUsageService,
    @Inject(AI_CREDENTIAL_CIPHER) private readonly cipher: AiCredentialCipher,
    @Inject(AI_ENV) private readonly env: Record<string, string | undefined>,
  ) {}

  /** For a feature the user triggers. Throws when no model is available. */
  async resolveForUser(
    task: AiFeatureTask,
    userId: number,
  ): Promise<ResolvedAiModel> {
    const resolved = await this.tryResolveForUser(task, userId);
    if (resolved) {
      if (!(await this.hasDataSharingConsent(userId))) {
        throw new AiConsentRequiredException();
      }
      return resolved;
    }
    if (
      this.resolveHosted(task, userId) &&
      (await this.hasHostedAccess(userId))
    ) {
      // Hosted AI would run it: only the allowance is missing
      throw new AiHostedQuotaExceededException();
    }
    throw new AiNotConfiguredException(task);
  }

  /**
   * For background work on an athlete's data: the athlete first, then their
   * coaches. Returns null when none of them has AI for the task, or when the
   * athlete has not allowed their data to be sent to AI providers.
   */
  async tryResolveForAthlete(
    task: AiFeatureTask,
    athleteId: number,
  ): Promise<ResolvedAiModel | null> {
    return this.resolveForAthleteChain(task, athleteId, true);
  }

  private async resolveForAthleteChain(
    task: AiFeatureTask,
    athleteId: number,
    requireConsent: boolean,
  ): Promise<ResolvedAiModel | null> {
    let userIds = await this.usersForAthlete(athleteId);
    if (requireConsent) {
      const consented = await this.consentedUserIds(userIds);
      // The athlete's data leaves only with their permission, and through a
      // coach's key only with that coach's permission too
      if (!consented.has(userIds[0])) return null;
      userIds = userIds.filter((userId) => consented.has(userId));
    }
    for (const userId of userIds) {
      const resolved = await this.tryResolveForUser(task, userId);
      if (resolved) return resolved;
    }
    return null;
  }

  async hasDataSharingConsent(userId: number): Promise<boolean> {
    return (await this.consentedUserIds([userId])).has(userId);
  }

  private async consentedUserIds(userIds: number[]): Promise<Set<number>> {
    if (userIds.length === 0) return new Set();
    const users = await this.prisma.user.findMany({
      where: { userId: { in: userIds }, aiDataSharingConsentAt: { not: null } },
      select: { userId: true },
    });
    return new Set(users.map((user) => user.userId));
  }

  async tryResolveForUser(
    task: AiFeatureTask,
    userId: number,
  ): Promise<ResolvedAiModel | null> {
    const ownKey = await this.resolveOwnKey(task, userId);
    if (ownKey) return ownKey;
    if (!(await this.hasHostedAccess(userId))) return null;
    const hosted = this.resolveHosted(task, userId);
    if (!hosted || !(await this.usage.hasHostedAllowanceLeft(userId))) {
      return null;
    }
    return hosted;
  }

  async hasHostedAccess(userId: number): Promise<boolean> {
    switch (this.policy.hostedAccess) {
      case 'everyone':
        return true;
      case 'none':
        return false;
      case 'subscribers':
        return this.subscriptionService.hasAIFeaturesAccess(userId);
    }
  }

  /**
   * What each feature would run on for the user, consent aside, so the app
   * can name the providers before asking for it. Background features use
   * the athlete's chain (athlete, then coaches) when an athlete is given.
   */
  async describeAccess(
    userId: number,
    athleteId?: number,
  ): Promise<AiAccessDto> {
    const backgroundTasks: AiFeatureTask[] = [
      AiTask.POST_ACTIVITY_QUESTIONS,
      AiTask.FEEDBACK_EXTRACTION,
      AiTask.TRAINING_LOAD_ESTIMATION,
      AiTask.ACTIVITY_SUMMARY,
    ];
    const entries = await Promise.all(
      AI_FEATURE_TASKS.map(async (task) => {
        const resolved =
          athleteId !== undefined && backgroundTasks.includes(task)
            ? await this.resolveForAthleteChain(task, athleteId, false)
            : await this.tryResolveForUser(task, userId);
        const access: AiTaskAccessDto = resolved
          ? {
              available: true,
              source: resolved.source,
              provider: resolved.provider,
              modelId: resolved.modelId,
            }
          : { available: false, source: null, provider: null, modelId: null };
        return [task, access] as const;
      }),
    );
    // Only worth mentioning when the instance has keys at all
    const instanceHasKeys = AI_FEATURE_TASKS.some(
      (task) => this.resolveHosted(task, userId) !== null,
    );
    const allowed = await this.hasHostedAccess(userId);
    const hostedAvailable = allowed && instanceHasKeys;
    const athleteUserId =
      athleteId === undefined
        ? undefined
        : (await this.usersForAthlete(athleteId))[0];
    return {
      tasks: Object.fromEntries(entries) as AiAccessDto['tasks'],
      hostedAccess: hostedAvailable,
      upgradeUnlocksHosted:
        !allowed &&
        instanceHasKeys &&
        this.policy.hostedAccess === 'subscribers',
      customEndpointsAllowed: this.policy.customEndpointsAllowed,
      hostedQuotaExhausted:
        hostedAvailable && !(await this.usage.hasHostedAllowanceLeft(userId)),
      usage: await this.usage.describe(userId),
      dataSharingConsent: await this.hasDataSharingConsent(userId),
      athleteDataSharingConsent:
        athleteUserId === undefined
          ? null
          : await this.hasDataSharingConsent(athleteUserId),
      // Voice notes go to OpenAI's Whisper on the instance key
      transcriptionProvider: this.env.OPENAI_API_KEY ? 'openai' : null,
    };
  }

  /** Builds the Mastra model config of a credential (also used to test it). */
  modelConfig(
    credential: {
      provider: string;
      encryptedApiKey: string;
      encryptedHeaders: string | null;
      baseUrl: string | null;
    },
    modelId: string,
  ): AiModelConfig {
    const apiKey =
      this.cipher.decrypt(credential.encryptedApiKey) || NO_API_KEY;
    const headers = this.credentialHeaders(
      credential.provider,
      credential.encryptedHeaders,
    );
    const headerConfig = Object.keys(headers).length ? { headers } : {};
    if (credential.provider === CUSTOM_AI_PROVIDER) {
      return {
        providerId: CUSTOM_AI_PROVIDER,
        modelId,
        url: credential.baseUrl ?? '',
        apiKey,
        ...headerConfig,
      };
    }
    return {
      id: `${credential.provider}/${modelId}`,
      apiKey,
      ...(credential.baseUrl ? { url: credential.baseUrl } : {}),
      ...headerConfig,
    };
  }

  private credentialHeaders(
    provider: string,
    encryptedHeaders: string | null,
  ): Record<string, string> {
    const custom = encryptedHeaders
      ? parseCredentialHeaders(this.cipher.decrypt(encryptedHeaders))
      : {};
    return mergeCredentialHeaders(provider, custom);
  }

  private async resolveOwnKey(
    task: AiFeatureTask,
    userId: number,
  ): Promise<ResolvedAiModel | null> {
    const preferences = await this.prisma.aiModelPreference.findMany({
      where: { userId, task: { in: [task, AiTask.DEFAULT] } },
      include: { credential: true },
    });
    const preference =
      preferences.find((item) => item.task === task) ??
      preferences.find((item) => item.task === AiTask.DEFAULT);
    if (!preference) return null;

    const { credential } = preference;
    if (
      !this.catalog.isAvailable(credential.provider) ||
      (credential.baseUrl && !this.policy.customEndpointsAllowed)
    ) {
      // e.g. a local endpoint once the instance disallows them
      return null;
    }
    try {
      return {
        task,
        source: 'own_key',
        userId,
        provider: credential.provider,
        modelId: preference.modelId,
        credentialId: credential.aiCredentialId,
        config: this.modelConfig(credential, preference.modelId),
      };
    } catch (error) {
      this.logger.error(
        `AI credential ${credential.aiCredentialId} cannot be decrypted (was HASH_PEPPER changed?): ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  private resolveHosted(
    task: AiFeatureTask,
    userId: number,
  ): ResolvedAiModel | null {
    let model = hostedModelFor(task, this.env);
    // Older configurations name OpenAI models without their provider
    if (!model.includes('/')) model = `openai/${model}`;
    const separator = model.indexOf('/');
    const provider = model.slice(0, separator);
    const modelId = model.slice(separator + 1);
    const apiKey = this.catalog
      .apiKeyEnvVars(provider)
      .map((name) => this.env[name])
      .find(Boolean);
    if (!apiKey) return null;

    const headers = providerHeaders(provider);
    return {
      task,
      source: 'hosted',
      userId,
      provider,
      modelId,
      credentialId: null,
      config: {
        id: `${provider}/${modelId}`,
        apiKey,
        ...(Object.keys(headers).length ? { headers } : {}),
      },
    };
  }

  private async usersForAthlete(athleteId: number): Promise<number[]> {
    const athlete = await this.prisma.athlete.findUnique({
      where: { athleteId },
      select: {
        userId: true,
        coachAthletes: {
          select: { userId: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!athlete) return [];
    return [
      athlete.userId,
      ...athlete.coachAthletes.map((link) => link.userId),
    ].filter((userId, index, all) => all.indexOf(userId) === index);
  }
}
