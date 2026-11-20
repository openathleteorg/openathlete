// @vitest-environment jsdom
import { act, useCallback, useState } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  TrainingPlanApplyPreview,
  TrainingPlanTemplateSummary,
} from '@openathlete/shared';

import { ApplyPlanDialog } from './apply-plan-dialog';

const plan = {
  trainingPlanTemplateId: 5,
  name: 'VO2max',
  weeks: 8,
  sessions: 32,
} as TrainingPlanTemplateSummary;

const preview: TrainingPlanApplyPreview = {
  athleteId: 70,
  athleteName: 'Ada Lovelace',
  startDate: '2026-12-01',
  endDate: '2027-01-25',
  sessions: 30,
  skipped: 2,
  conflicts: [{ eventId: 1, name: 'Easy run', date: '2026-12-02' }],
  races: [],
  periods: [],
  overlappingPlans: [],
};

const api = vi.hoisted(() => ({ preview: vi.fn(), apply: vi.fn() }));
vi.mock('@/api/training-plan', () => ({
  // Holds the answer as the real mutation does, until it is reset
  usePreviewTrainingPlanMutation: () => {
    const [data, setData] = useState<unknown>();
    const reset = useCallback(() => setData(undefined), []);
    return {
      data,
      reset,
      isPending: false,
      mutateAsync: async (request: unknown) => setData(api.preview(request)),
    };
  },
  useApplyTrainingPlanMutation: () => ({
    isPending: false,
    mutateAsync: api.apply,
  }),
}));
vi.mock('./use-plan-athletes', () => ({
  usePlanAthletes: () => [
    { athleteId: 70, name: 'Ada Lovelace' },
    { athleteId: 71, name: 'Alan Turing' },
  ],
}));
// Plain fields in place of the pickers: the form is what is tested
vi.mock('@/components/hook-form', async () => {
  const { useFormContext } = await import('react-hook-form');
  return {
    FormProvider: (
      await vi.importActual<typeof import('@/components/hook-form')>(
        '@/components/hook-form',
      )
    ).FormProvider,
    RHFDatePicker: ({ name }: { name: string }) => (
      <input data-field={name} {...useFormContext().register(name)} />
    ),
  };
});
vi.mock('@/components/hook-form/rhf-select', async () => {
  const { useFormContext } = await import('react-hook-form');
  return {
    RHFSelect: ({
      name,
      children,
    }: {
      name: string;
      children: React.ReactNode;
    }) => (
      <select data-field={name} {...useFormContext().register(name)}>
        {children}
      </select>
    ),
  };
});
vi.mock('@/components/ui/select', () => ({
  SelectItem: ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => <option value={value}>{children}</option>,
}));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));
vi.mock('@/paraglide/runtime', () => ({ getLocale: () => 'en' }));
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

describe('ApplyPlanDialog', () => {
  let container: HTMLDivElement;
  let root: Root;
  const onClose = vi.fn();

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    api.preview.mockReset().mockReturnValue([preview]);
    api.apply.mockReset().mockResolvedValue({
      status: 'done',
      results: [
        { athleteId: 70, trainingPlanId: 9, sessions: 30, replaced: 0 },
      ],
    });
    onClose.mockReset();
    toast.success.mockReset();
    act(() => root.render(<ApplyPlanDialog plan={plan} onClose={onClose} />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  // The dialog renders in a portal, outside the container
  const field = (name: string) =>
    document.querySelector<HTMLInputElement | HTMLSelectElement>(
      `[data-field="${name}"]`,
    )!;
  const change = (name: string, value: string) => {
    const element = field(name);
    const prototype =
      element instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
    act(() => {
      Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(
        element,
        value,
      );
      element.dispatchEvent(
        new Event(element instanceof HTMLSelectElement ? 'change' : 'input', {
          bubbles: true,
        }),
      );
    });
  };
  const submit = () =>
    act(async () => {
      document
        .querySelector('form')!
        .dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true }),
        );
      await new Promise((resolve) => setTimeout(resolve));
    });
  const shownPreview = () => document.querySelector('[data-plan-preview]');
  const submitLabel = () =>
    document.querySelector('button[type="submit"]')?.textContent;

  const request = {
    templateId: 5,
    body: {
      targets: [{ athleteId: 70, date: '2026-12-01' }],
      anchor: 'START',
      conflictMode: 'KEEP',
    },
  };

  it('shows what applying would do before applying anything', async () => {
    change('date', '2026-12-01T12:00:00');
    expect(submitLabel()).toBe('training_plans_preview');

    await submit();

    expect(api.preview).toHaveBeenCalledWith(request);
    expect(api.apply).not.toHaveBeenCalled();
    const text = shownPreview()?.textContent;
    expect(text).toContain('training_plans_preview_sessions 30');
    expect(text).toContain('training_plans_preview_skipped 2');
    expect(text).toContain('training_plans_preview_conflicts 1');
    expect(submitLabel()).toBe('training_plans_apply');
  });

  it('applies the plan that was previewed, then closes', async () => {
    change('date', '2026-12-01T12:00:00');
    await submit();
    await submit();

    expect(api.apply).toHaveBeenCalledWith(request);
    expect(toast.success).toHaveBeenCalledWith(
      'training_plans_applied_success 30',
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('asks for a new preview once a value changes', async () => {
    change('date', '2026-12-01T12:00:00');
    await submit();

    change('anchor', 'END');

    expect(shownPreview()).toBeNull();
    expect(submitLabel()).toBe('training_plans_preview');
    await submit();
    expect(api.apply).not.toHaveBeenCalled();
    expect(api.preview).toHaveBeenLastCalledWith({
      ...request,
      body: { ...request.body, anchor: 'END' },
    });
  });

  it('needs a date', async () => {
    await submit();

    expect(api.preview).not.toHaveBeenCalled();
  });
});
