import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AiCredential } from '@openathlete/database';
import {
  AiAccessDto,
  AiCredentialDto,
  AiModelPreferenceDto,
  AiProvider,
  CUSTOM_AI_PROVIDER,
  CreateAiCredentialDto,
  TestAiCredentialResponseDto,
  UpdateAiModelPreferencesDto,
} from '@openathlete/shared';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { AiProviderException, toAiProviderException } from '../ai.errors';
import { AiCredentialCipher, apiKeyHint } from './ai-credential-cipher';
import {
  normalizeCredentialHeaders,
  parseCredentialHeaders,
} from './ai-credential-headers';
import {
  AI_CREDENTIAL_CIPHER,
  AiModelResolverService,
} from './ai-model-resolver.service';
import { AiPolicyService } from './ai-policy.service';
import { AiProviderCatalogService } from './ai-provider-catalog.service';
import { AiService } from './ai.service';

/** Plenty for several providers; bounds what one account can store. */
export const MAX_AI_CREDENTIALS_PER_USER = 20;

/** The user's AI keys and model choices (Settings > AI). */
@Injectable()
export class AiSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: AiProviderCatalogService,
    private readonly policy: AiPolicyService,
    private readonly resolver: AiModelResolverService,
    private readonly aiService: AiService,
    @Inject(AI_CREDENTIAL_CIPHER) private readonly cipher: AiCredentialCipher,
  ) {}

  listProviders(): AiProvider[] {
    return this.catalog.list();
  }

  async listCredentials(userId: number): Promise<AiCredentialDto[]> {
    const credentials = await this.prisma.aiCredential.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return credentials.map((credential) =>
      toCredentialDto(
        credential,
        this.headerNames(credential.encryptedHeaders),
      ),
    );
  }

  async createCredential(
    userId: number,
    dto: CreateAiCredentialDto,
  ): Promise<AiCredentialDto> {
    if (!this.catalog.isAvailable(dto.provider)) {
      throw new BadRequestException(
        `AI provider "${dto.provider}" is not available on this instance`,
      );
    }
    if (dto.baseUrl && !this.policy.customEndpointsAllowed) {
      throw new BadRequestException(
        'Custom endpoint URLs are not allowed on this instance',
      );
    }
    if (!dto.apiKey && !this.catalog.isApiKeyOptional(dto.provider)) {
      throw new BadRequestException('An API key is required for this provider');
    }
    const count = await this.prisma.aiCredential.count({ where: { userId } });
    if (count >= MAX_AI_CREDENTIALS_PER_USER) {
      throw new BadRequestException(
        `You can store up to ${MAX_AI_CREDENTIALS_PER_USER} AI keys`,
      );
    }

    const provider = this.catalog
      .list()
      .find((item) => item.id === dto.provider);
    const headers = normalizeCredentialHeaders(dto.headers);
    const credential = await this.prisma.aiCredential.create({
      data: {
        userId,
        provider: dto.provider,
        label:
          dto.label ||
          (dto.provider === CUSTOM_AI_PROVIDER && dto.baseUrl
            ? new URL(dto.baseUrl).host
            : (provider?.name ?? dto.provider)),
        encryptedApiKey: this.cipher.encrypt(dto.apiKey),
        apiKeyHint: apiKeyHint(dto.apiKey),
        encryptedHeaders: Object.keys(headers).length
          ? this.cipher.encrypt(JSON.stringify(headers))
          : null,
        baseUrl: dto.baseUrl ?? null,
      },
    });
    return toCredentialDto(credential, Object.keys(headers));
  }

  private headerNames(encryptedHeaders: string | null): string[] {
    if (!encryptedHeaders) return [];
    try {
      return Object.keys(
        parseCredentialHeaders(this.cipher.decrypt(encryptedHeaders)),
      );
    } catch {
      return [];
    }
  }

  /** Also removes the model choices that used the key. */
  async deleteCredential(userId: number, aiCredentialId: number) {
    const { count } = await this.prisma.aiCredential.deleteMany({
      where: { userId, aiCredentialId },
    });
    if (count === 0) throw new NotFoundException('AI key not found');
  }

  /** Calls the model once with the key, and records the outcome. */
  async testCredential(
    userId: number,
    aiCredentialId: number,
    modelId: string,
  ): Promise<TestAiCredentialResponseDto> {
    const credential = await this.findOwnCredential(userId, aiCredentialId);
    // The server calls the URL: re-check in case the policy changed
    if (
      !this.catalog.isAvailable(credential.provider) ||
      (credential.baseUrl && !this.policy.customEndpointsAllowed)
    ) {
      throw new BadRequestException(
        'This AI key uses a provider or URL not allowed on this instance',
      );
    }
    let failure: AiProviderException | null = null;
    try {
      await this.aiService.ping(this.resolver.modelConfig(credential, modelId));
    } catch (error) {
      failure = toAiProviderException(error);
    }

    await this.prisma.aiCredential.update({
      where: { aiCredentialId },
      data: failure
        ? { lastError: failure.code, lastErrorAt: new Date() }
        : { lastUsedAt: new Date(), lastError: null, lastErrorAt: null },
    });
    return failure
      ? { ok: false, code: failure.code, message: failure.message }
      : { ok: true };
  }

  async getModelPreferences(userId: number): Promise<AiModelPreferenceDto[]> {
    const preferences = await this.prisma.aiModelPreference.findMany({
      where: { userId },
      orderBy: { task: 'asc' },
    });
    return preferences.map(({ task, aiCredentialId, modelId }) => ({
      task,
      aiCredentialId,
      modelId,
    })) as AiModelPreferenceDto[];
  }

  async updateModelPreferences(
    userId: number,
    dto: UpdateAiModelPreferencesDto,
  ): Promise<AiModelPreferenceDto[]> {
    const credentialIds = [
      ...new Set(dto.preferences.map((item) => item.aiCredentialId)),
    ];
    const owned = await this.prisma.aiCredential.count({
      where: { userId, aiCredentialId: { in: credentialIds } },
    });
    if (owned !== credentialIds.length) {
      throw new BadRequestException('Unknown AI key');
    }

    await this.prisma.$transaction([
      this.prisma.aiModelPreference.deleteMany({ where: { userId } }),
      this.prisma.aiModelPreference.createMany({
        data: dto.preferences.map((item) => ({ ...item, userId })),
      }),
    ]);
    return this.getModelPreferences(userId);
  }

  /** The user allows their data to be sent to AI providers, or withdraws it */
  async setDataSharingConsent(
    userId: number,
    consent: boolean,
  ): Promise<AiAccessDto> {
    await this.prisma.user.update({
      where: { userId },
      data: { aiDataSharingConsentAt: consent ? new Date() : null },
    });
    return this.resolver.describeAccess(userId);
  }

  async getAccess(userId: number, athleteId?: number): Promise<AiAccessDto> {
    if (athleteId !== undefined) {
      const athlete = await this.prisma.athlete.findFirst({
        where: {
          athleteId,
          OR: [{ userId }, { coachAthletes: { some: { userId } } }],
        },
        select: { athleteId: true },
      });
      if (!athlete) throw new ForbiddenException('Athlete not accessible');
    }
    return this.resolver.describeAccess(userId, athleteId);
  }

  private async findOwnCredential(userId: number, aiCredentialId: number) {
    const credential = await this.prisma.aiCredential.findFirst({
      where: { userId, aiCredentialId },
    });
    if (!credential) throw new NotFoundException('AI key not found');
    return credential;
  }
}

function toCredentialDto(
  credential: AiCredential,
  customHeaderNames: string[],
): AiCredentialDto {
  return {
    aiCredentialId: credential.aiCredentialId,
    provider: credential.provider,
    label: credential.label,
    apiKeyHint: credential.apiKeyHint,
    baseUrl: credential.baseUrl,
    customHeaderNames,
    lastError: credential.lastError,
    lastErrorAt: credential.lastErrorAt?.toISOString() ?? null,
    lastUsedAt: credential.lastUsedAt?.toISOString() ?? null,
    createdAt: credential.createdAt.toISOString(),
  };
}
