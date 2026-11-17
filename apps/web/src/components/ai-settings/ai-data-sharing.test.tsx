// @vitest-environment jsdom
import { athleteAiTaskUsable } from '@/api/ai-settings/ai-settings.hooks';
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AiAccessDto, AiTask } from '@openathlete/shared';

import { AiConsentPrompt } from './ai-data-sharing';
import { needsAiDataSharingConsent } from './ai-data-sharing.hooks';

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/api/ai-settings', () => ({
  useAiProvidersQuery: () => ({
    data: [
      { id: 'openai', name: 'OpenAI' },
      { id: 'anthropic', name: 'Anthropic' },
    ],
  }),
  useAiDataSharingMutation: () => ({
    mutateAsync: mocks.mutateAsync,
    isPending: false,
  }),
}));
vi.mock('@/utils/consent', () => ({
  privacyPolicyUrl: () => 'https://openathlete.org/privacy-policy',
}));
vi.mock('sonner', () => ({ toast: mocks.toast }));
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_, key: string) => () => key }) as Record<
    string,
    () => string
  >,
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const off = { available: false, source: null, provider: null, modelId: null };

function access(overrides: Partial<AiAccessDto> = {}): AiAccessDto {
  return {
    tasks: {
      [AiTask.EVENT_GENERATION]: {
        available: true,
        source: 'hosted',
        provider: 'openai',
        modelId: 'gpt-5.6-luna',
      },
      [AiTask.EVENT_MODIFICATION]: off,
      [AiTask.POST_ACTIVITY_QUESTIONS]: {
        available: true,
        source: 'own_key',
        provider: 'anthropic',
        modelId: 'claude-sonnet-5',
      },
      [AiTask.FEEDBACK_EXTRACTION]: off,
      [AiTask.TRAINING_LOAD_ESTIMATION]: off,
      [AiTask.ACTIVITY_SUMMARY]: off,
    },
    hostedAccess: true,
    upgradeUnlocksHosted: false,
    customEndpointsAllowed: false,
    hostedQuotaExhausted: false,
    usage: {
      ownKeyTokens: 0,
      hostedBudgetUsed: null,
      resetsAt: '2026-11-01T00:00:00.000Z',
    },
    dataSharingConsent: false,
    athleteDataSharingConsent: null,
    transcriptionProvider: 'openai',
    ...overrides,
  };
}

const nothingSetUp = (overrides: Partial<AiAccessDto> = {}) =>
  access({
    tasks: {
      [AiTask.EVENT_GENERATION]: off,
      [AiTask.EVENT_MODIFICATION]: off,
      [AiTask.POST_ACTIVITY_QUESTIONS]: off,
      [AiTask.FEEDBACK_EXTRACTION]: off,
      [AiTask.TRAINING_LOAD_ESTIMATION]: off,
      [AiTask.ACTIVITY_SUMMARY]: off,
    },
    transcriptionProvider: null,
    ...overrides,
  });

describe('needsAiDataSharingConsent', () => {
  it('asks before anything set up can run', () => {
    expect(needsAiDataSharingConsent(access())).toBe(true);
  });

  it('asks for voice transcription alone too', () => {
    expect(
      needsAiDataSharingConsent(
        nothingSetUp({ transcriptionProvider: 'openai' }),
      ),
    ).toBe(true);
  });

  it('does not ask once allowed, or when no AI is set up', () => {
    expect(
      needsAiDataSharingConsent(access({ dataSharingConsent: true })),
    ).toBe(false);
    expect(needsAiDataSharingConsent(nothingSetUp())).toBe(false);
    expect(needsAiDataSharingConsent(undefined)).toBe(false);
  });
});

describe('athleteAiTaskUsable', () => {
  it("needs the athlete's permission for background features", () => {
    const task = AiTask.POST_ACTIVITY_QUESTIONS;
    expect(
      athleteAiTaskUsable(access({ athleteDataSharingConsent: false }), task),
    ).toBe(false);
    expect(
      athleteAiTaskUsable(access({ athleteDataSharingConsent: true }), task),
    ).toBe(true);
    expect(athleteAiTaskUsable(undefined, task)).toBeUndefined();
  });
});

describe('AiConsentPrompt', () => {
  let container: HTMLDivElement;
  let root: Root;
  const onDone = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mutateAsync.mockResolvedValue(access({ dataSharingConsent: true }));
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() =>
      root.render(<AiConsentPrompt access={access()} onDone={onDone} />),
    );
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const button = (name: string) =>
    [...container.querySelectorAll('button')].find(
      (item) => item.textContent === name,
    )!;

  it('names what is sent and every provider that receives it', () => {
    const text = container.textContent ?? '';
    expect(text).toContain('ai_sharing_item_activities');
    expect(text).toContain('ai_sharing_item_voice');
    expect(text).toContain('OpenAI (ai_sharing_source_hosted)');
    expect(text).toContain('Anthropic (ai_sharing_source_own)');
    expect(text).toContain('OpenAI (ai_sharing_source_voice)');
    expect(
      container.querySelector('a[href$="/privacy-policy"]'),
    ).not.toBeNull();
  });

  it('records the permission when the user allows it', async () => {
    await act(async () => button('ai_sharing_allow').click());

    expect(mocks.mutateAsync).toHaveBeenCalledWith(true);
    expect(mocks.toast.success).toHaveBeenCalled();
    expect(onDone).toHaveBeenCalled();
  });

  it('sends nothing when the user declines', async () => {
    await act(async () => button('ai_sharing_not_now').click());

    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    expect(onDone).toHaveBeenCalled();
  });
});
