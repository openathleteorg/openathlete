// @vitest-environment jsdom
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AiModelPreferenceDto, AiProvider, AiTask } from '@openathlete/shared';

import { AiModelsSection } from './ai-models-section';

const hooks = vi.hoisted(() => ({
  preferences: [] as AiModelPreferenceDto[],
}));

const groq: AiProvider = {
  id: 'groq',
  name: 'Groq',
  docUrl: null,
  featured: true,
  requiresBaseUrl: false,
  apiKeyOptional: false,
  models: [
    { id: 'llama-3.3-70b-versatile' },
    { id: 'allam-2-7b', structuredOutput: false },
  ],
};

vi.mock('@/api/ai-settings', () => ({
  useAiProvidersQuery: () => ({ data: [groq] }),
  useAiCredentialsQuery: () => ({
    data: [{ aiCredentialId: 1, provider: 'groq', label: 'Groq' }],
  }),
  useAiModelPreferencesQuery: () => ({ data: hooks.preferences }),
  useAiAccessQuery: () => ({ data: undefined }),
  useUpdateAiModelPreferencesMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));
vi.mock('@/components/ai-settings/ai-labels', () => ({
  aiTaskLabel: (task: string) => task,
  aiProviderName: (_: unknown, id: string) => id,
}));
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_, key) => () => String(key) }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const preference = (modelId: string): AiModelPreferenceDto =>
  ({
    task: AiTask.TRAINING_LOAD_ESTIMATION,
    aiCredentialId: 1,
    modelId,
  }) as AiModelPreferenceDto;

describe('AiModelsSection', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('warns that a model without structured output will fail', () => {
    hooks.preferences = [preference('allam-2-7b')];
    act(() => root.render(<AiModelsSection />));

    expect(container.textContent).toContain('ai_models_no_structured_output');
  });

  it('says nothing for a model that returns JSON', () => {
    hooks.preferences = [preference('llama-3.3-70b-versatile')];
    act(() => root.render(<AiModelsSection />));

    expect(container.textContent).not.toContain(
      'ai_models_no_structured_output',
    );
  });
});
