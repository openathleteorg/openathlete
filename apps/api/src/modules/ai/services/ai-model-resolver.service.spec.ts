import { AiTask, CUSTOM_AI_PROVIDER } from '@openathlete/shared';

import {
  AiConsentRequiredException,
  AiHostedQuotaExceededException,
  AiNotConfiguredException,
} from '../ai.errors';
import { AiCredentialCipher } from './ai-credential-cipher';
import { AiModelResolverService } from './ai-model-resolver.service';
import { AiPolicyService, HostedAccessPolicy } from './ai-policy.service';
import { AiProviderCatalogService } from './ai-provider-catalog.service';

const cipher = new AiCredentialCipher('pepper-at-least-32-characters-long-xx');

type Preference = {
  userId: number;
  task: AiTask;
  modelId: string;
  credential: {
    aiCredentialId: number;
    provider: string;
    encryptedApiKey: string;
    encryptedHeaders: string | null;
    baseUrl: string | null;
  };
};

function preference(
  userId: number,
  task: AiTask,
  provider: string,
  modelId: string,
  apiKey: string,
  baseUrl: string | null = null,
  headers?: Record<string, string>,
): Preference {
  return {
    userId,
    task,
    modelId,
    credential: {
      aiCredentialId: userId * 10 + Object.keys(AiTask).indexOf(task),
      provider,
      encryptedApiKey: cipher.encrypt(apiKey),
      encryptedHeaders: headers
        ? cipher.encrypt(JSON.stringify(headers))
        : null,
      baseUrl,
    },
  };
}

interface Setup {
  preferences?: Preference[];
  hostedAccess?: HostedAccessPolicy;
  customEndpointsAllowed?: boolean;
  subscribers?: number[];
  env?: Record<string, string>;
  coaches?: number[];
  /** Users whose monthly allowance on the instance keys is used up */
  quotaExhausted?: number[];
  /** Users who have not allowed their data to be sent to AI providers */
  notConsented?: number[];
}

function setup({
  preferences = [],
  hostedAccess = 'subscribers',
  customEndpointsAllowed = false,
  subscribers = [],
  env = {},
  coaches = [],
  quotaExhausted = [],
  notConsented = [],
}: Setup = {}) {
  const prisma = {
    user: {
      findMany: jest.fn(({ where }: { where: { userId: { in: number[] } } }) =>
        Promise.resolve(
          where.userId.in
            .filter((userId) => !notConsented.includes(userId))
            .map((userId) => ({ userId })),
        ),
      ),
    },
    aiModelPreference: {
      findMany: jest.fn(
        ({ where }: { where: { userId: number; task: { in: AiTask[] } } }) =>
          Promise.resolve(
            preferences.filter(
              (item) =>
                item.userId === where.userId &&
                where.task.in.includes(item.task),
            ),
          ),
      ),
    },
    athlete: {
      findUnique: jest.fn().mockResolvedValue({
        userId: 1,
        coachAthletes: coaches.map((userId) => ({ userId })),
      }),
    },
  };
  const policy = { hostedAccess, customEndpointsAllowed } as AiPolicyService;
  const catalog = {
    isAvailable: (provider: string) =>
      provider !== CUSTOM_AI_PROVIDER || customEndpointsAllowed,
    apiKeyEnvVars: (provider: string) =>
      ({
        openai: ['OPENAI_API_KEY'],
        google: ['GOOGLE_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY'],
        'opencode-go': ['OPENCODE_API_KEY'],
      })[provider] ?? [],
  } as unknown as AiProviderCatalogService;
  const subscriptions = {
    hasAIFeaturesAccess: jest.fn((userId: number) =>
      Promise.resolve(subscribers.includes(userId)),
    ),
  };
  const usage = {
    hasHostedAllowanceLeft: jest.fn((userId: number) =>
      Promise.resolve(!quotaExhausted.includes(userId)),
    ),
    describe: jest.fn().mockResolvedValue({
      hostedTokens: 0,
      ownKeyTokens: 0,
      hostedBudgetUsed: null,
      resetsAt: '2026-11-01T00:00:00.000Z',
    }),
  };
  const resolver = new AiModelResolverService(
    prisma as never,
    policy,
    catalog,
    subscriptions as never,
    usage as never,
    cipher,
    env,
  );
  return { resolver, subscriptions };
}

describe('AiModelResolverService', () => {
  describe('own keys', () => {
    it("runs on the user's model for the task, with their key", async () => {
      const { resolver } = setup({
        preferences: [
          preference(1, AiTask.DEFAULT, 'openai', 'gpt-5-mini', 'sk-default'),
          preference(
            1,
            AiTask.EVENT_GENERATION,
            'anthropic',
            'claude-sonnet-4-5',
            'sk-ant-task',
          ),
        ],
      });

      const resolved = await resolver.resolveForUser(
        AiTask.EVENT_GENERATION,
        1,
      );

      expect(resolved).toMatchObject({
        source: 'own_key',
        userId: 1,
        provider: 'anthropic',
        modelId: 'claude-sonnet-4-5',
        config: { id: 'anthropic/claude-sonnet-4-5', apiKey: 'sk-ant-task' },
      });
    });

    it('falls back to their default model for other tasks', async () => {
      const { resolver } = setup({
        preferences: [
          preference(1, AiTask.DEFAULT, 'openai', 'gpt-5-mini', 'sk-default'),
        ],
      });

      const resolved = await resolver.resolveForUser(
        AiTask.FEEDBACK_EXTRACTION,
        1,
      );

      expect(resolved.config).toEqual({
        id: 'openai/gpt-5-mini',
        apiKey: 'sk-default',
      });
    });

    it('prefers own keys over hosted access', async () => {
      const { resolver } = setup({
        preferences: [
          preference(1, AiTask.DEFAULT, 'openai', 'gpt-5-mini', 'sk-mine'),
        ],
        hostedAccess: 'everyone',
        env: { OPENAI_API_KEY: 'sk-instance' },
      });

      const resolved = await resolver.resolveForUser(
        AiTask.EVENT_GENERATION,
        1,
      );

      expect(resolved).toMatchObject({ source: 'own_key' });
      expect(resolved.config.apiKey).toBe('sk-mine');
    });

    it('builds an OpenAI-compatible config for custom endpoints', async () => {
      const { resolver } = setup({
        customEndpointsAllowed: true,
        preferences: [
          preference(
            1,
            AiTask.DEFAULT,
            CUSTOM_AI_PROVIDER,
            'llama3.1',
            '',
            'http://ollama:11434/v1',
          ),
        ],
      });

      const resolved = await resolver.resolveForUser(
        AiTask.EVENT_GENERATION,
        1,
      );

      expect(resolved.config).toEqual({
        providerId: CUSTOM_AI_PROVIDER,
        modelId: 'llama3.1',
        url: 'http://ollama:11434/v1',
        apiKey: 'not-needed',
      });
    });

    it("adds a key's custom headers to its model config", async () => {
      const { resolver } = setup({
        preferences: [
          preference(
            1,
            AiTask.DEFAULT,
            'openai',
            'gpt-5-mini',
            'sk-mine',
            null,
            { 'X-Custom-Header': 'value' },
          ),
        ],
      });

      const resolved = await resolver.resolveForUser(
        AiTask.EVENT_GENERATION,
        1,
      );

      expect(resolved.config).toMatchObject({
        id: 'openai/gpt-5-mini',
        headers: { 'x-custom-header': 'value' },
      });
    });

    it('gives OpenCode Go a fresh session header on every call', async () => {
      const { resolver } = setup({
        preferences: [
          preference(
            1,
            AiTask.DEFAULT,
            'opencode-go',
            'kimi-k3',
            'sk-opencode',
          ),
        ],
      });

      const first = await resolver.resolveForUser(AiTask.EVENT_GENERATION, 1);
      const second = await resolver.resolveForUser(AiTask.EVENT_GENERATION, 1);

      expect(first.config.headers?.['x-opencode-session']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
      expect(first.config.headers?.['x-opencode-session']).not.toBe(
        second.config.headers?.['x-opencode-session'],
      );
    });

    it('ignores custom endpoints once the instance disallows them', async () => {
      const { resolver } = setup({
        customEndpointsAllowed: false,
        preferences: [
          preference(
            1,
            AiTask.DEFAULT,
            CUSTOM_AI_PROVIDER,
            'llama3.1',
            '',
            'http://ollama:11434/v1',
          ),
        ],
      });

      await expect(
        resolver.tryResolveForUser(AiTask.EVENT_GENERATION, 1),
      ).resolves.toBeNull();
    });

    it('skips keys it cannot decrypt instead of failing', async () => {
      const broken = preference(1, AiTask.DEFAULT, 'openai', 'gpt-5', 'sk-x');
      broken.credential.encryptedApiKey = 'v1:garbage:garbage:garbage';
      const { resolver } = setup({ preferences: [broken] });

      await expect(
        resolver.tryResolveForUser(AiTask.EVENT_GENERATION, 1),
      ).resolves.toBeNull();
    });
  });

  describe('hosted AI', () => {
    it('uses the instance key and model for subscribers', async () => {
      const { resolver } = setup({
        subscribers: [1],
        env: { OPENAI_API_KEY: 'sk-instance' },
      });

      const resolved = await resolver.resolveForUser(
        AiTask.EVENT_GENERATION,
        1,
      );

      expect(resolved).toMatchObject({
        source: 'hosted',
        credentialId: null,
        config: { id: 'openai/gpt-5.6-luna', apiKey: 'sk-instance' },
      });
    });

    it('refuses users without a plan when reserved to subscribers', async () => {
      const { resolver } = setup({ env: { OPENAI_API_KEY: 'sk-instance' } });

      await expect(
        resolver.resolveForUser(AiTask.EVENT_GENERATION, 1),
      ).rejects.toBeInstanceOf(AiNotConfiguredException);
    });

    it('serves everyone when the instance shares its keys', async () => {
      const { resolver, subscriptions } = setup({
        hostedAccess: 'everyone',
        env: { OPENAI_API_KEY: 'sk-instance' },
      });

      await expect(
        resolver.resolveForUser(AiTask.EVENT_GENERATION, 1),
      ).resolves.toMatchObject({ source: 'hosted' });
      expect(subscriptions.hasAIFeaturesAccess).not.toHaveBeenCalled();
    });

    it('never uses instance keys when hosted AI is off', async () => {
      const { resolver } = setup({
        hostedAccess: 'none',
        subscribers: [1],
        env: { OPENAI_API_KEY: 'sk-instance' },
      });

      await expect(
        resolver.tryResolveForUser(AiTask.EVENT_GENERATION, 1),
      ).resolves.toBeNull();
    });

    it("is unavailable when the instance lacks the model provider's key", async () => {
      // Every feature defaults to an OpenAI model
      const { resolver } = setup({
        hostedAccess: 'everyone',
        env: { GOOGLE_API_KEY: 'g-instance' },
      });

      await expect(
        resolver.tryResolveForUser(AiTask.POST_ACTIVITY_QUESTIONS, 1),
      ).resolves.toBeNull();
    });

    it('accepts any of the variable names of a provider key', async () => {
      const { resolver } = setup({
        hostedAccess: 'everyone',
        env: {
          AI_MODEL_POST_ACTIVITY_FEEDBACK: 'google/gemini-2.5-flash',
          GOOGLE_GENERATIVE_AI_API_KEY: 'g-instance',
        },
      });

      await expect(
        resolver.resolveForUser(AiTask.POST_ACTIVITY_QUESTIONS, 1),
      ).resolves.toMatchObject({
        config: { id: 'google/gemini-2.5-flash', apiKey: 'g-instance' },
      });
    });

    it('also adds the OpenCode Go session header on hosted calls', async () => {
      const { resolver } = setup({
        hostedAccess: 'everyone',
        env: {
          AI_MODEL_EVENT_GENERATION: 'opencode-go/kimi-k3',
          OPENCODE_API_KEY: 'sk-instance',
        },
      });

      const resolved = await resolver.resolveForUser(
        AiTask.EVENT_GENERATION,
        1,
      );

      expect(resolved.config.headers?.['x-opencode-session']).toEqual(
        expect.any(String),
      );
    });

    it('reads model names without provider as OpenAI models', async () => {
      const { resolver } = setup({
        hostedAccess: 'everyone',
        env: { AI_MODEL_EVENT_GENERATION: 'gpt-4o', OPENAI_API_KEY: 'sk-i' },
      });

      await expect(
        resolver.resolveForUser(AiTask.EVENT_GENERATION, 1),
      ).resolves.toMatchObject({
        config: { id: 'openai/gpt-4o', apiKey: 'sk-i' },
      });
    });

    it('follows AI_MODEL_DEFAULT for every task', async () => {
      const { resolver } = setup({
        hostedAccess: 'everyone',
        env: { AI_MODEL_DEFAULT: 'openai/gpt-5-mini', OPENAI_API_KEY: 'sk-i' },
      });

      await expect(
        resolver.resolveForUser(AiTask.POST_ACTIVITY_QUESTIONS, 1),
      ).resolves.toMatchObject({ modelId: 'gpt-5-mini' });
    });
  });

  describe('monthly allowance on the instance keys', () => {
    const instance = { OPENAI_API_KEY: 'sk-instance' };

    it('stops hosted AI once the allowance is used up', async () => {
      const { resolver } = setup({
        hostedAccess: 'everyone',
        env: instance,
        quotaExhausted: [1],
      });

      await expect(
        resolver.tryResolveForUser(AiTask.EVENT_GENERATION, 1),
      ).resolves.toBeNull();
      await expect(
        resolver.resolveForUser(AiTask.EVENT_GENERATION, 1),
      ).rejects.toBeInstanceOf(AiHostedQuotaExceededException);
    });

    it("never limits the user's own keys", async () => {
      const { resolver } = setup({
        hostedAccess: 'everyone',
        env: instance,
        quotaExhausted: [1],
        preferences: [
          preference(1, AiTask.DEFAULT, 'openai', 'gpt-5-mini', 'sk-mine'),
        ],
      });

      await expect(
        resolver.resolveForUser(AiTask.EVENT_GENERATION, 1),
      ).resolves.toMatchObject({ source: 'own_key' });
    });

    it('still says "not configured" to users without hosted access', async () => {
      const { resolver } = setup({ env: instance, quotaExhausted: [1] });

      await expect(
        resolver.resolveForUser(AiTask.EVENT_GENERATION, 1),
      ).rejects.toBeInstanceOf(AiNotConfiguredException);
    });

    it("falls back to a coach's allowance for background work", async () => {
      const { resolver } = setup({
        hostedAccess: 'everyone',
        env: instance,
        coaches: [2],
        quotaExhausted: [1],
      });

      await expect(
        resolver.tryResolveForAthlete(AiTask.FEEDBACK_EXTRACTION, 100),
      ).resolves.toMatchObject({ userId: 2, source: 'hosted' });
    });

    it('reports the used-up allowance in the access summary', async () => {
      const { resolver } = setup({
        hostedAccess: 'everyone',
        env: instance,
        quotaExhausted: [1],
      });

      const access = await resolver.describeAccess(1);

      expect(access.hostedQuotaExhausted).toBe(true);
      expect(access.tasks[AiTask.EVENT_GENERATION].available).toBe(false);
    });
  });

  describe("athletes' background work", () => {
    it("uses a coach's key when the athlete has none", async () => {
      const { resolver } = setup({
        coaches: [2, 3],
        preferences: [
          preference(3, AiTask.DEFAULT, 'openai', 'gpt-5-mini', 'sk-coach3'),
        ],
      });

      const resolved = await resolver.tryResolveForAthlete(
        AiTask.FEEDBACK_EXTRACTION,
        100,
      );

      expect(resolved).toMatchObject({ userId: 3, source: 'own_key' });
    });

    it("prefers the athlete's own access", async () => {
      const { resolver } = setup({
        coaches: [2],
        subscribers: [1, 2],
        env: { OPENAI_API_KEY: 'sk-instance' },
        preferences: [
          preference(2, AiTask.DEFAULT, 'openai', 'gpt-5-mini', 'sk-coach'),
        ],
      });

      await expect(
        resolver.tryResolveForAthlete(AiTask.FEEDBACK_EXTRACTION, 100),
      ).resolves.toMatchObject({ userId: 1, source: 'hosted' });
    });

    it('returns null when nobody has AI', async () => {
      const { resolver } = setup({ coaches: [2] });

      await expect(
        resolver.tryResolveForAthlete(AiTask.FEEDBACK_EXTRACTION, 100),
      ).resolves.toBeNull();
    });
  });

  describe('permission to send data to AI providers', () => {
    const ownKey = preference(
      1,
      AiTask.DEFAULT,
      'openai',
      'gpt-5-mini',
      'sk-1',
    );

    it('asks for it before a feature the user triggers', async () => {
      const { resolver } = setup({ preferences: [ownKey], notConsented: [1] });

      await expect(
        resolver.resolveForUser(AiTask.EVENT_GENERATION, 1),
      ).rejects.toBeInstanceOf(AiConsentRequiredException);
    });

    it('still says when no AI is set up at all', async () => {
      const { resolver } = setup({ notConsented: [1] });

      await expect(
        resolver.resolveForUser(AiTask.EVENT_GENERATION, 1),
      ).rejects.toBeInstanceOf(AiNotConfiguredException);
    });

    it("runs no background work on an athlete's data without theirs", async () => {
      const { resolver } = setup({
        coaches: [2],
        notConsented: [1],
        preferences: [
          ownKey,
          preference(2, AiTask.DEFAULT, 'openai', 'gpt-5-mini', 'sk-coach'),
        ],
      });

      await expect(
        resolver.tryResolveForAthlete(AiTask.FEEDBACK_EXTRACTION, 100),
      ).resolves.toBeNull();
    });

    it("skips a coach's key until that coach allowed it too", async () => {
      const { resolver } = setup({
        coaches: [2, 3],
        notConsented: [2],
        preferences: [
          preference(2, AiTask.DEFAULT, 'openai', 'gpt-5-mini', 'sk-coach2'),
          preference(3, AiTask.DEFAULT, 'openai', 'gpt-5-mini', 'sk-coach3'),
        ],
      });

      await expect(
        resolver.tryResolveForAthlete(AiTask.FEEDBACK_EXTRACTION, 100),
      ).resolves.toMatchObject({ userId: 3 });
    });

    it('names the providers before the user allows it', async () => {
      const { resolver } = setup({
        preferences: [ownKey],
        notConsented: [1],
        env: { OPENAI_API_KEY: 'sk-instance' },
      });

      const access = await resolver.describeAccess(1, 100);

      expect(access.tasks[AiTask.EVENT_GENERATION]).toMatchObject({
        available: true,
        provider: 'openai',
      });
      expect(access.dataSharingConsent).toBe(false);
      expect(access.athleteDataSharingConsent).toBe(false);
      expect(access.transcriptionProvider).toBe('openai');
    });
  });

  it('describes access per feature without exposing keys', async () => {
    const { resolver } = setup({
      preferences: [
        preference(1, AiTask.EVENT_GENERATION, 'openai', 'gpt-5.1', 'sk-mine'),
      ],
    });

    const access = await resolver.describeAccess(1);

    expect(access.tasks[AiTask.EVENT_GENERATION]).toEqual({
      available: true,
      source: 'own_key',
      provider: 'openai',
      modelId: 'gpt-5.1',
    });
    expect(access.tasks[AiTask.EVENT_MODIFICATION].available).toBe(false);
    expect(access.hostedAccess).toBe(false);
    // The instance has no keys: subscribing would not help
    expect(access.upgradeUnlocksHosted).toBe(false);
    expect(JSON.stringify(access)).not.toContain('sk-mine');
  });

  describe('hosted AI summary', () => {
    it('suggests subscribing when that unlocks the instance keys', async () => {
      const { resolver } = setup({ env: { OPENAI_API_KEY: 'sk-instance' } });

      await expect(resolver.describeAccess(1)).resolves.toMatchObject({
        hostedAccess: false,
        upgradeUnlocksHosted: true,
      });
    });

    it('reports hosted AI only when the instance has keys', async () => {
      const withKeys = setup({
        hostedAccess: 'everyone',
        env: { OPENAI_API_KEY: 'sk-instance' },
      });
      const withoutKeys = setup({ hostedAccess: 'everyone' });

      await expect(withKeys.resolver.describeAccess(1)).resolves.toMatchObject({
        hostedAccess: true,
      });
      await expect(
        withoutKeys.resolver.describeAccess(1),
      ).resolves.toMatchObject({
        hostedAccess: false,
        upgradeUnlocksHosted: false,
      });
    });
  });
});
