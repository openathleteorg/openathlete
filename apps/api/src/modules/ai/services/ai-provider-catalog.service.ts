import { Inject, Injectable } from '@nestjs/common';

import { AiProvider, CUSTOM_AI_PROVIDER } from '@openathlete/shared';

import { ModelRegistry, RegistryProvider } from '../model-registry';
import { AiPolicyService } from './ai-policy.service';

export const MODEL_REGISTRY = Symbol('MODEL_REGISTRY');

/** Listed first in the settings, in this order. */
const FEATURED_PROVIDERS = [
  'openai',
  'anthropic',
  'google',
  'mistral',
  'openrouter',
  'opencode-go',
  'deepseek',
  'xai',
  'groq',
  'ovhcloud',
  'scaleway',
  'togetherai',
  'fireworks-ai',
  'ollama-cloud',
  'lmstudio',
];

/** Hosts the server must not be pointed at on public instances. */
export function isPrivateUrl(url: string): boolean {
  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase().replace(/^\[|\]$/g, '');
  } catch {
    return true;
  }
  return (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    /^127\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    /^f[cd][0-9a-f]{2}:/.test(hostname) ||
    !hostname.includes('.')
  );
}

/**
 * AI providers and models users can pick from: the model registry bundled
 * with Mastra, plus custom OpenAI-compatible endpoints when the instance
 * allows them.
 */
@Injectable()
export class AiProviderCatalogService {
  constructor(
    @Inject(MODEL_REGISTRY) private readonly registry: ModelRegistry,
    private readonly policy: AiPolicyService,
  ) {}

  list(): AiProvider[] {
    const customAllowed = this.policy.customEndpointsAllowed;
    const providers = Object.entries(this.registry.providers)
      .filter(([, provider]) => customAllowed || !this.isLocal(provider))
      .map(([id, provider]) => this.toProvider(id, provider))
      .sort((a, b) => {
        const rank = (provider: AiProvider) => {
          const index = FEATURED_PROVIDERS.indexOf(provider.id);
          return index === -1 ? FEATURED_PROVIDERS.length : index;
        };
        return rank(a) - rank(b) || a.name.localeCompare(b.name);
      });

    if (customAllowed) {
      providers.push({
        id: CUSTOM_AI_PROVIDER,
        name: 'OpenAI-compatible endpoint',
        docUrl: null,
        featured: false,
        requiresBaseUrl: true,
        apiKeyOptional: true,
        models: [],
      });
    }
    return providers;
  }

  /** Whether users of this instance may use the provider. */
  isAvailable(providerId: string): boolean {
    if (providerId === CUSTOM_AI_PROVIDER) {
      return this.policy.customEndpointsAllowed;
    }
    const provider = this.registry.providers[providerId];
    if (!provider) return false;
    return this.policy.customEndpointsAllowed || !this.isLocal(provider);
  }

  isApiKeyOptional(providerId: string): boolean {
    if (providerId === CUSTOM_AI_PROVIDER) return true;
    const provider = this.registry.providers[providerId];
    return Boolean(provider?.url && isPrivateUrl(provider.url));
  }

  /** Names of the environment variables holding the instance key. */
  apiKeyEnvVars(providerId: string): string[] {
    const envVar = this.registry.providers[providerId]?.apiKeyEnvVar;
    if (!envVar) return [];
    return Array.isArray(envVar) ? envVar : [envVar];
  }

  supportsStructuredOutput(providerId: string, modelId: string) {
    if (providerId === CUSTOM_AI_PROVIDER) return undefined;
    return this.registry.supportsStructuredOutput(`${providerId}/${modelId}`);
  }

  private isLocal(provider: RegistryProvider): boolean {
    return Boolean(provider.url && isPrivateUrl(provider.url));
  }

  private toProvider(id: string, provider: RegistryProvider): AiProvider {
    const deprecated = new Set(provider.deprecatedModels ?? []);
    return {
      id,
      name: provider.name,
      docUrl: provider.docUrl ?? null,
      featured: FEATURED_PROVIDERS.includes(id),
      requiresBaseUrl: false,
      apiKeyOptional: this.isLocal(provider),
      models: provider.models
        .filter((model) => !deprecated.has(model))
        .map((model) =>
          this.registry.supportsStructuredOutput(`${id}/${model}`) === false
            ? { id: model, structuredOutput: false }
            : { id: model },
        ),
    };
  }
}
