import { AiErrorCode, AiTask, CUSTOM_AI_PROVIDER } from '@openathlete/shared';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { ModelRegistry } from '../model-registry';
import { AiCredentialCipher } from './ai-credential-cipher';
import { AiModelResolverService } from './ai-model-resolver.service';
import { AiPolicyService } from './ai-policy.service';
import { AiProviderCatalogService } from './ai-provider-catalog.service';
import {
  AiSettingsService,
  MAX_AI_CREDENTIALS_PER_USER,
} from './ai-settings.service';
import { AiUsageService } from './ai-usage.service';
import { AiService } from './ai.service';

jest.mock('@mastra/core/agent', () => ({ Agent: jest.fn() }));

// Integration test: needs a migrated, disposable PostgreSQL database.
const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );
}

const registry: ModelRegistry = {
  providers: {
    openai: {
      name: 'OpenAI',
      apiKeyEnvVar: 'OPENAI_API_KEY',
      models: ['gpt-5.1'],
    },
    anthropic: {
      name: 'Anthropic',
      apiKeyEnvVar: 'ANTHROPIC_API_KEY',
      models: ['claude-sonnet-4-5'],
    },
    'opencode-go': {
      name: 'OpenCode Go',
      apiKeyEnvVar: 'OPENCODE_API_KEY',
      models: ['kimi-k3'],
    },
  },
  supportsStructuredOutput: () => undefined,
};

describe('AiSettingsService (PostgreSQL)', () => {
  let prisma: PrismaService;
  const cipher = new AiCredentialCipher(
    'pepper-at-least-32-characters-long-xx',
  );
  const policy = { hostedAccess: 'subscribers', customEndpointsAllowed: false };
  const ping = jest.fn();
  let service: AiSettingsService;
  let resolver: AiModelResolverService;
  let athleteUserId: number;
  let coachUserId: number;
  let strangerUserId: number;
  let athleteId: number;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    const catalog = new AiProviderCatalogService(
      registry,
      policy as AiPolicyService,
    );
    resolver = new AiModelResolverService(
      prisma,
      policy as AiPolicyService,
      catalog,
      { hasAIFeaturesAccess: () => Promise.resolve(false) } as never,
      new AiUsageService(prisma, policy as AiPolicyService),
      cipher,
      {},
    );
    service = new AiSettingsService(
      prisma,
      catalog,
      policy as AiPolicyService,
      resolver,
      { ping } as unknown as AiService,
      cipher,
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "user", athlete, coach_athlete, ai_credential, ai_model_preference, ai_custom_instruction RESTART IDENTITY CASCADE',
    );
    policy.customEndpointsAllowed = false;
    ping.mockReset().mockResolvedValue(undefined);

    const user = (email: string) =>
      prisma.user.create({
        data: { email, password: 'x', firstName: 'A', lastName: 'B' },
      });
    athleteUserId = (await user('athlete@example.com')).userId;
    coachUserId = (await user('coach@example.com')).userId;
    strangerUserId = (await user('stranger@example.com')).userId;
    athleteId = (
      await prisma.athlete.create({ data: { userId: athleteUserId } })
    ).athleteId;
    await prisma.coachAthlete.create({
      data: { userId: coachUserId, athleteId },
    });
  });

  it('stores keys encrypted and only ever returns a hint', async () => {
    const created = await service.createCredential(athleteUserId, {
      provider: 'openai',
      apiKey: 'sk-proj-supersecret1234',
    });

    expect(created).toMatchObject({
      provider: 'openai',
      label: 'OpenAI',
      apiKeyHint: '••••1234',
    });
    expect(JSON.stringify(created)).not.toContain('supersecret');

    const row = await prisma.aiCredential.findUniqueOrThrow({
      where: { aiCredentialId: created.aiCredentialId },
    });
    expect(row.encryptedApiKey).not.toContain('supersecret');
    expect(cipher.decrypt(row.encryptedApiKey)).toBe('sk-proj-supersecret1234');

    const listed = await service.listCredentials(athleteUserId);
    expect(JSON.stringify(listed)).not.toContain('supersecret');
    expect(listed[0]).not.toHaveProperty('encryptedApiKey');
  });

  it('stores custom headers encrypted and only returns their names', async () => {
    const created = await service.createCredential(athleteUserId, {
      provider: 'openai',
      apiKey: 'sk-with-headers-0001',
      headers: { 'X-Custom-Header': 'secret-header-value' },
    });

    expect(created.customHeaderNames).toEqual(['x-custom-header']);
    expect(JSON.stringify(created)).not.toContain('secret-header-value');

    const row = await prisma.aiCredential.findUniqueOrThrow({
      where: { aiCredentialId: created.aiCredentialId },
    });
    expect(row.encryptedHeaders).not.toContain('secret-header-value');
    expect(JSON.parse(cipher.decrypt(row.encryptedHeaders!))).toEqual({
      'x-custom-header': 'secret-header-value',
    });

    const [listed] = await service.listCredentials(athleteUserId);
    expect(listed.customHeaderNames).toEqual(['x-custom-header']);
    expect(JSON.stringify(listed)).not.toContain('secret-header-value');
  });

  it('only lists the user’s own keys', async () => {
    await service.createCredential(athleteUserId, {
      provider: 'openai',
      apiKey: 'sk-athlete-key-0001',
    });

    await expect(service.listCredentials(coachUserId)).resolves.toEqual([]);
  });

  it('requires a key for hosted providers', async () => {
    await expect(
      service.createCredential(athleteUserId, {
        provider: 'openai',
        apiKey: '',
      }),
    ).rejects.toThrow('An API key is required');
  });

  it('refuses unknown providers and, on public instances, custom URLs', async () => {
    await expect(
      service.createCredential(athleteUserId, {
        provider: 'made-up',
        apiKey: 'k',
      }),
    ).rejects.toThrow('not available');
    await expect(
      service.createCredential(athleteUserId, {
        provider: CUSTOM_AI_PROVIDER,
        apiKey: '',
        baseUrl: 'http://169.254.169.254/latest',
      }),
    ).rejects.toThrow('not available');
    await expect(
      service.createCredential(athleteUserId, {
        provider: 'openai',
        apiKey: 'sk-key-with-url-0001',
        baseUrl: 'https://proxy.example.com/v1',
      }),
    ).rejects.toThrow('Custom endpoint URLs are not allowed');
  });

  it('accepts keyless custom endpoints when the instance allows them', async () => {
    policy.customEndpointsAllowed = true;

    const created = await service.createCredential(athleteUserId, {
      provider: CUSTOM_AI_PROVIDER,
      apiKey: '',
      baseUrl: 'http://ollama:11434/v1',
    });

    expect(created).toMatchObject({
      label: 'ollama:11434',
      apiKeyHint: '',
      baseUrl: 'http://ollama:11434/v1',
    });
  });

  it(`stops at ${MAX_AI_CREDENTIALS_PER_USER} keys per user`, async () => {
    for (let i = 0; i < MAX_AI_CREDENTIALS_PER_USER; i++) {
      await service.createCredential(athleteUserId, {
        provider: 'openai',
        apiKey: `sk-key-number-${i}-padding`,
      });
    }

    await expect(
      service.createCredential(athleteUserId, {
        provider: 'openai',
        apiKey: 'sk-one-too-many-key',
      }),
    ).rejects.toThrow(`up to ${MAX_AI_CREDENTIALS_PER_USER}`);
  });

  it('replaces model choices, only with the user’s own keys', async () => {
    const own = await service.createCredential(athleteUserId, {
      provider: 'anthropic',
      apiKey: 'sk-ant-athlete-0001',
    });
    const coachKey = await service.createCredential(coachUserId, {
      provider: 'openai',
      apiKey: 'sk-coach-key-00001',
    });

    await expect(
      service.updateModelPreferences(athleteUserId, {
        preferences: [
          {
            task: AiTask.DEFAULT,
            aiCredentialId: coachKey.aiCredentialId,
            modelId: 'gpt-5.1',
          },
        ],
      }),
    ).rejects.toThrow('Unknown AI key');

    await service.updateModelPreferences(athleteUserId, {
      preferences: [
        {
          task: AiTask.DEFAULT,
          aiCredentialId: own.aiCredentialId,
          modelId: 'claude-sonnet-4-5',
        },
        {
          task: AiTask.EVENT_GENERATION,
          aiCredentialId: own.aiCredentialId,
          modelId: 'claude-opus-4-5',
        },
      ],
    });
    const replaced = await service.updateModelPreferences(athleteUserId, {
      preferences: [
        {
          task: AiTask.DEFAULT,
          aiCredentialId: own.aiCredentialId,
          modelId: 'claude-haiku-4-5',
        },
      ],
    });

    expect(replaced).toEqual([
      {
        task: AiTask.DEFAULT,
        aiCredentialId: own.aiCredentialId,
        modelId: 'claude-haiku-4-5',
      },
    ]);
  });

  it('removes the model choices of a deleted key', async () => {
    const key = await service.createCredential(athleteUserId, {
      provider: 'openai',
      apiKey: 'sk-to-delete-000001',
    });
    await service.updateModelPreferences(athleteUserId, {
      preferences: [
        {
          task: AiTask.DEFAULT,
          aiCredentialId: key.aiCredentialId,
          modelId: 'gpt-5.1',
        },
      ],
    });

    await service.deleteCredential(athleteUserId, key.aiCredentialId);

    await expect(service.getModelPreferences(athleteUserId)).resolves.toEqual(
      [],
    );
  });

  it('cannot delete or test someone else’s key', async () => {
    const key = await service.createCredential(athleteUserId, {
      provider: 'openai',
      apiKey: 'sk-not-yours-00001',
    });

    await expect(
      service.deleteCredential(strangerUserId, key.aiCredentialId),
    ).rejects.toThrow('AI key not found');
    await expect(
      service.testCredential(strangerUserId, key.aiCredentialId, 'gpt-5.1'),
    ).rejects.toThrow('AI key not found');
    expect(ping).not.toHaveBeenCalled();
  });

  it('tests a key with the decrypted secret and records the outcome', async () => {
    const key = await service.createCredential(athleteUserId, {
      provider: 'openai',
      apiKey: 'sk-test-me-0000001',
    });

    await expect(
      service.testCredential(athleteUserId, key.aiCredentialId, 'gpt-5.1'),
    ).resolves.toEqual({ ok: true });
    expect(ping).toHaveBeenCalledWith({
      id: 'openai/gpt-5.1',
      apiKey: 'sk-test-me-0000001',
    });

    ping.mockRejectedValue({ statusCode: 401 });
    await expect(
      service.testCredential(athleteUserId, key.aiCredentialId, 'gpt-5.1'),
    ).resolves.toMatchObject({
      ok: false,
      code: AiErrorCode.CREDENTIAL_REJECTED,
    });
    const [listed] = await service.listCredentials(athleteUserId);
    expect(listed.lastError).toBe(AiErrorCode.CREDENTIAL_REJECTED);
  });

  it('tests a key with the same headers real calls use', async () => {
    const key = await service.createCredential(athleteUserId, {
      provider: 'opencode-go',
      apiKey: 'sk-opencode-00001',
      headers: { 'X-Custom-Header': 'value' },
    });

    await expect(
      service.testCredential(athleteUserId, key.aiCredentialId, 'kimi-k3'),
    ).resolves.toEqual({ ok: true });
    expect(ping).toHaveBeenCalledWith({
      id: 'opencode-go/kimi-k3',
      apiKey: 'sk-opencode-00001',
      headers: {
        'x-custom-header': 'value',
        'x-opencode-session': expect.any(String),
      },
    });
  });

  it('describes access for an athlete to them and their coaches only', async () => {
    const key = await service.createCredential(coachUserId, {
      provider: 'openai',
      apiKey: 'sk-coach-pays-00001',
    });
    await service.updateModelPreferences(coachUserId, {
      preferences: [
        {
          task: AiTask.DEFAULT,
          aiCredentialId: key.aiCredentialId,
          modelId: 'gpt-5.1',
        },
      ],
    });

    // The athlete's background features run on the coach's key
    const access = await service.getAccess(athleteUserId, athleteId);
    expect(access.tasks[AiTask.FEEDBACK_EXTRACTION]).toMatchObject({
      available: true,
      source: 'own_key',
    });
    // ...but what the athlete triggers needs their own access
    expect(access.tasks[AiTask.EVENT_GENERATION].available).toBe(false);

    await expect(
      service.getAccess(coachUserId, athleteId),
    ).resolves.toBeTruthy();
    await expect(service.getAccess(strangerUserId, athleteId)).rejects.toThrow(
      'Athlete not accessible',
    );
  });

  it("runs AI on an athlete's data only once they and the coach allowed it", async () => {
    const key = await service.createCredential(coachUserId, {
      provider: 'openai',
      apiKey: 'sk-coach-pays-00001',
    });
    await service.updateModelPreferences(coachUserId, {
      preferences: [
        {
          task: AiTask.DEFAULT,
          aiCredentialId: key.aiCredentialId,
          modelId: 'gpt-5.1',
        },
      ],
    });
    const run = () =>
      resolver.tryResolveForAthlete(AiTask.FEEDBACK_EXTRACTION, athleteId);

    await expect(run()).resolves.toBeNull();

    await service.setDataSharingConsent(coachUserId, true);
    await expect(run()).resolves.toBeNull();

    const access = await service.setDataSharingConsent(athleteUserId, true);
    expect(access.dataSharingConsent).toBe(true);
    await expect(run()).resolves.toMatchObject({ userId: coachUserId });

    await service.setDataSharingConsent(athleteUserId, false);
    await expect(run()).resolves.toBeNull();
    expect(
      (await service.getAccess(coachUserId, athleteId))
        .athleteDataSharingConsent,
    ).toBe(false);
  });

  it('only lets the owner of an AI key write custom instructions', async () => {
    const write = () =>
      service.updateCustomInstructions(athleteUserId, {
        instructions: [
          {
            task: AiTask.EVENT_GENERATION,
            instructions: 'Warm up in zone 1',
          },
        ],
      });

    await expect(write()).rejects.toThrow('AI key of your own');
    // Clearing them needs no key, e.g. after deleting it
    await expect(
      service.updateCustomInstructions(athleteUserId, { instructions: [] }),
    ).resolves.toEqual([]);

    await service.createCredential(athleteUserId, {
      provider: 'openai',
      apiKey: 'sk-instructions-0001',
    });
    await expect(write()).resolves.toEqual([
      { task: AiTask.EVENT_GENERATION, instructions: 'Warm up in zone 1' },
    ]);
  });

  it('replaces custom instructions and drops blank ones', async () => {
    await service.createCredential(athleteUserId, {
      provider: 'openai',
      apiKey: 'sk-instructions-0002',
    });
    await service.updateCustomInstructions(athleteUserId, {
      instructions: [
        { task: AiTask.EVENT_GENERATION, instructions: 'Warm up in zone 1' },
        { task: AiTask.ACTIVITY_SUMMARY, instructions: 'Comment on cadence' },
      ],
    });

    const replaced = await service.updateCustomInstructions(athleteUserId, {
      instructions: [
        { task: AiTask.EVENT_GENERATION, instructions: '' },
        {
          task: AiTask.POST_ACTIVITY_QUESTIONS,
          instructions: 'Ask how I slept',
        },
      ],
    });

    expect(replaced).toEqual([
      {
        task: AiTask.POST_ACTIVITY_QUESTIONS,
        instructions: 'Ask how I slept',
      },
    ]);
    await expect(service.getCustomInstructions(coachUserId)).resolves.toEqual(
      [],
    );
  });
});
