// @vitest-environment jsdom
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AiAccessDto, AiTask } from '@openathlete/shared';

import { AiInstructionsSection } from './ai-instructions-section';

const mutateAsync = vi.fn();
const hooks = vi.hoisted(() => ({
  credentials: [] as { aiCredentialId: number }[],
  instructions: [] as { task: string; instructions: string }[],
  access: undefined as AiAccessDto | undefined,
}));

vi.mock('@/api/ai-settings', () => ({
  useAiCredentialsQuery: () => ({ data: hooks.credentials }),
  useAiCustomInstructionsQuery: () => ({ data: hooks.instructions }),
  useAiAccessQuery: () => ({ data: hooks.access }),
  useUpdateAiCustomInstructionsMutation: () => ({
    mutateAsync,
    isPending: false,
  }),
}));
vi.mock('@/components/ai-settings/ai-labels', () => ({
  aiTaskLabel: (task: string) => task,
}));
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_, key) => () => String(key) }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const runsOn = (source: 'own_key' | 'hosted') => ({
  available: true,
  source,
  provider: 'openai',
  modelId: 'gpt-5.1',
});

function access(hostedTask: AiTask): AiAccessDto {
  const tasks = Object.fromEntries(
    [
      AiTask.EVENT_GENERATION,
      AiTask.EVENT_MODIFICATION,
      AiTask.POST_ACTIVITY_QUESTIONS,
      AiTask.FEEDBACK_EXTRACTION,
      AiTask.TRAINING_LOAD_ESTIMATION,
      AiTask.ACTIVITY_SUMMARY,
    ].map((task) => [task, runsOn(task === hostedTask ? 'hosted' : 'own_key')]),
  ) as AiAccessDto['tasks'];
  return { tasks } as AiAccessDto;
}

/** Types into a React-controlled field, as the browser would. */
function type(field: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    'value',
  )?.set;
  act(() => {
    setter?.call(field, value);
    field.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

describe('AiInstructionsSection', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    mutateAsync.mockReset().mockResolvedValue([]);
    hooks.credentials = [{ aiCredentialId: 1 }];
    hooks.instructions = [];
    hooks.access = access(AiTask.ACTIVITY_SUMMARY);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = () => act(() => root.render(<AiInstructionsSection />));
  const field = (task: AiTask) =>
    container.querySelector<HTMLTextAreaElement>(`#ai-instructions-${task}`)!;
  const saveButton = () => container.querySelector('button')!;

  it('is only for the owners of a key', () => {
    hooks.credentials = [];
    render();

    expect(container.textContent).toContain('ai_instructions_no_keys');
    expect(container.querySelector('textarea')).toBeNull();
  });

  it('saves the instructions written, trimmed, without the blank ones', async () => {
    hooks.instructions = [
      { task: AiTask.ACTIVITY_SUMMARY, instructions: 'Comment on cadence' },
    ];
    render();
    expect(saveButton().disabled).toBe(true);

    type(field(AiTask.EVENT_GENERATION), '  Warm up in zone 1  ');
    type(field(AiTask.ACTIVITY_SUMMARY), '   ');
    await act(async () => saveButton().click());

    expect(mutateAsync).toHaveBeenCalledWith({
      instructions: [
        { task: AiTask.EVENT_GENERATION, instructions: 'Warm up in zone 1' },
      ],
    });
  });

  it('says when a feature does not run on the user’s key', () => {
    hooks.instructions = [
      { task: AiTask.ACTIVITY_SUMMARY, instructions: 'Comment on cadence' },
      { task: AiTask.EVENT_GENERATION, instructions: 'Warm up in zone 1' },
    ];
    render();

    const notes = container.textContent?.match(/ai_instructions_not_used/g);
    expect(notes).toHaveLength(1);
  });

  it('writes the workout instructions once, for generating and editing', () => {
    hooks.instructions = [
      { task: AiTask.EVENT_GENERATION, instructions: 'Warm up in zone 1' },
    ];
    hooks.access = access(AiTask.EVENT_MODIFICATION);
    render();

    expect(field(AiTask.EVENT_MODIFICATION)).toBeNull();
    expect(field(AiTask.EVENT_GENERATION).value).toBe('Warm up in zone 1');
    expect(container.textContent).toContain('ai_instructions_workouts');
    // Editing runs elsewhere: the instructions would be left out there
    expect(container.textContent).toContain('ai_instructions_not_used');
  });
});
