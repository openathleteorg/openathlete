// @vitest-environment jsdom
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TrainingPlanTemplateSummary } from '@openathlete/shared';

import { PlanLibraryPanel } from './plan-library-panel';

const plan = (
  id: number,
  name: string,
  overrides: Partial<TrainingPlanTemplateSummary> = {},
): TrainingPlanTemplateSummary => ({
  trainingPlanTemplateId: id,
  name,
  description: '',
  goal: '',
  sport: null,
  level: null,
  weeks: 8,
  sessions: 32,
  folderId: null,
  activeApplications: 0,
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
  ...overrides,
});

const api = vi.hoisted(() => ({
  plans: [] as unknown[],
  importPlan: vi.fn(),
}));
vi.mock('@/api/training-plan', () => ({
  TrainingPlanAPI: {},
  useTrainingPlanTemplatesQuery: () => ({ data: api.plans, isPending: false }),
  useDeleteTrainingPlanTemplateMutation: () => ({ isPending: false }),
  useImportTrainingPlanMutation: () => ({
    mutateAsync: api.importPlan,
    isPending: false,
  }),
}));
const opened = vi.hoisted(() => ({ applying: null as unknown }));
vi.mock('./apply-plan-dialog', () => ({
  ApplyPlanDialog: ({ plan: applying }: { plan: unknown }) => {
    opened.applying = applying;
    return null;
  },
}));
vi.mock('./edit-plan-dialog', () => ({ EditPlanDialog: () => null }));
vi.mock('./plan-details-dialog', () => ({ PlanDetailsDialog: () => null }));
vi.mock('./save-from-calendar-dialog', () => ({
  SaveFromCalendarDialog: () => null,
}));
vi.mock('@/components/sport-icon/sport-icon', () => ({
  SportIcon: () => null,
}));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));
// Every message renders as its key, followed by its parameters.
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy(
    {},
    {
      get: (_target, key) => (params?: Record<string, unknown>) =>
        [String(key), ...Object.values(params ?? {})].join(' '),
    },
  ),
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('PlanLibraryPanel', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    api.plans = [];
    api.importPlan.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
    opened.applying = null;
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = () => act(() => root.render(<PlanLibraryPanel />));
  const shownPlans = () =>
    [...container.querySelectorAll('[data-plan]')].map(
      (item) => item.querySelector('h3')?.textContent,
    );
  const type = (value: string) => {
    const input = container.querySelector<HTMLInputElement>(
      'input[aria-label="training_plans_search"]',
    )!;
    const setValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!;
    act(() => {
      setValue.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  };
  const chooseFile = async (text: string) => {
    const input = container.querySelector<HTMLInputElement>(
      '[data-plan-file-input]',
    )!;
    const file = new File([text], 'plan.json', { type: 'application/json' });
    // jsdom's File cannot read itself
    file.text = () => Promise.resolve(text);
    Object.defineProperty(input, 'files', {
      value: [file],
      configurable: true,
    });
    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve));
    });
  };

  it('says how to start when the library is empty', () => {
    render();
    expect(container.textContent).toContain('training_plans_empty');
  });

  it('lists the plans with their size and where they are applied', () => {
    api.plans = [plan(1, 'VO2max', { activeApplications: 2 })];
    render();

    const text = container.querySelector('[data-plan="1"]')?.textContent;
    expect(text).toContain('training_plans_weeks_count 8');
    expect(text).toContain('training_plans_sessions_count 32');
    expect(text).toContain('training_plans_active_count 2');
  });

  it('searches the name and the goal', () => {
    api.plans = [
      plan(1, 'VO2max'),
      plan(2, 'Base', { goal: 'First marathon' }),
    ];
    render();

    type('marathon');
    expect(shownPlans()).toEqual(['Base']);

    type('nothing like it');
    expect(container.textContent).toContain('training_plans_no_match');
  });

  it('opens the plan to apply', () => {
    api.plans = [plan(1, 'VO2max')];
    render();
    const apply = [...container.querySelectorAll('button')].find(
      (button) => button.textContent === 'training_plans_apply',
    )!;

    act(() => apply.click());

    expect(opened.applying).toMatchObject({ trainingPlanTemplateId: 1 });
  });

  it('imports a plan file', async () => {
    api.importPlan.mockResolvedValue({ name: 'VO2max' });
    render();

    await chooseFile('{"format":"openathlete-training-plan"}');

    expect(api.importPlan).toHaveBeenCalledWith({
      file: { format: 'openathlete-training-plan' },
    });
    expect(toast.success).toHaveBeenCalledWith(
      'training_plans_imported VO2max',
    );
  });

  it('refuses a file that is not JSON, without asking the API', async () => {
    render();

    await chooseFile('not a plan');

    expect(api.importPlan).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('training_plans_import_invalid');
  });
});
