// @vitest-environment jsdom
import { act, createElement } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  SPORT_TYPE,
  TRAINING_ZONE_TYPE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
} from '@openathlete/shared';

import { StepForm } from '../workout/step-form';
import type { ZonesByType } from '../workout/workout-profile';
import type { BuilderStep } from './builder-state';
import { StepPanel } from './step-panel';
import {
  type SwimDistanceUnit,
  displayDistance,
  fromMetres,
  toMetres,
} from './swim-distance';
import type { BuilderEnv } from './use-builder-env';

vi.mock('@/paraglide/messages', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/paraglide/messages')>();
  const messages = new Proxy(actual, {
    get: (target, key) => {
      if (key in target) return target[key as keyof typeof target];
      if (typeof key === 'symbol' || key === 'then') return undefined;
      return () => String(key);
    },
  });
  return messages;
});

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const env: BuilderEnv = {
  sport: SPORT_TYPE.SWIMMING,
  athleteId: null,
  zones: [],
  zonesByType: {} as ZonesByType,
  zoneType: TRAINING_ZONE_TYPE.HEARTRATE,
  metrics: undefined,
  locale: 'en',
};

const step = (durationValue: number): BuilderStep => ({
  uid: 'step-1',
  stepType: WORKOUT_STEP_TYPE.STEADY,
  name: null,
  durationType: WORKOUT_DURATION_TYPE.DISTANCE,
  durationValue,
  targets: [],
});

const click = (element: Element) =>
  element.dispatchEvent(new MouseEvent('click', { bubbles: true }));

describe('swim distance units', () => {
  it('converts yards to canonical metres and back', () => {
    expect(toMetres(100, 'yd')).toBeCloseTo(91.44, 9);
    expect(fromMetres(91.44, 'yd')).toBeCloseTo(100, 9);
  });

  it('leaves metres as they are', () => {
    expect(toMetres(91.44, 'm')).toBe(91.44);
    expect(fromMetres(91.44, 'm')).toBe(91.44);
  });

  it('shows a clean yard figure without rounding stored metres', () => {
    expect(displayDistance(91.44, 'yd')).toBe(100);
    expect(displayDistance(91.44, 'm')).toBe(91.44);
    expect(displayDistance(91.445, 'm')).toBe(91.445);
  });
});

describe('pool distance editor', () => {
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

  const renderPanel = async (durationValue: number) => {
    const dispatch = vi.fn();
    await act(async () => {
      root.render(
        createElement(StepPanel, {
          step: step(durationValue),
          env,
          dispatch,
          onClose: vi.fn(),
          onEditAsText: vi.fn(),
        }),
      );
    });
    const input = container.querySelector<HTMLInputElement>(
      '[data-panel-distance]',
    );
    return { dispatch, input };
  };

  const unitButton = (unit: SwimDistanceUnit) =>
    container.querySelector<HTMLButtonElement>(
      `[data-panel-pool-unit="${unit}"]`,
    )!;

  it('keeps the stored distance when only the display unit changes', async () => {
    const { dispatch, input } = await renderPanel(91.44);
    expect(input?.value).toBe('91.44');

    await act(async () => click(unitButton('yd')));
    expect(input?.value).toBe('100');
    expect(dispatch).not.toHaveBeenCalled();

    await act(async () => click(unitButton('m')));
    expect(input?.value).toBe('91.44');
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('stores a yard preset as canonical metres, without rounding', async () => {
    const { dispatch } = await renderPanel(91.44);

    await act(async () => click(unitButton('yd')));
    await act(async () =>
      click(container.querySelector('[data-panel-distance-preset="100"]')!),
    );

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'update',
      uid: 'step-1',
      patch: {
        durationType: WORKOUT_DURATION_TYPE.DISTANCE,
        durationValue: 91.44,
      },
    });
  });
});

describe('pool distance step form', () => {
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

  const renderForm = async () => {
    const onSubmit = vi.fn();
    await act(async () => {
      root.render(
        createElement(StepForm, {
          sport: 'SWIMMING',
          initialValues: {
            stepType: WORKOUT_STEP_TYPE.STEADY,
            durationType: WORKOUT_DURATION_TYPE.DISTANCE,
            durationValue: 91.44,
          },
          onSubmit,
        }),
      );
    });
    return { onSubmit };
  };

  const input = () =>
    container.querySelector<HTMLInputElement>('[data-pool-distance]')!;
  const unitButton = (unit: SwimDistanceUnit) =>
    container.querySelector<HTMLButtonElement>(`[data-pool-unit="${unit}"]`)!;
  const error = () => container.querySelector('[data-pool-distance-error]');
  const setDistance = async (value: string) => {
    await act(async () => {
      const field = input();
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )?.set;
      setter?.call(field, value);
      field.dispatchEvent(new Event('input', { bubbles: true }));
    });
  };
  const save = async () => {
    await act(async () => {
      container.querySelector('form')!.requestSubmit();
    });
  };

  it('saves the stored metres when only the display unit changes', async () => {
    const { onSubmit } = await renderForm();
    expect(input().value).toBe('91.44');

    await act(async () => click(unitButton('yd')));
    expect(input().value).toBe('100');

    await save();
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ durationValue: 91.44 }),
    );
  });

  it('writes a yard entry to the form as canonical metres', async () => {
    const { onSubmit } = await renderForm();

    await act(async () => click(unitButton('yd')));
    await setDistance('100');
    await save();

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ durationValue: 91.44 }),
    );
  });

  it('rejects an invalid draft instead of saving the previous distance', async () => {
    const { onSubmit } = await renderForm();

    await setDistance('-5');
    expect(input().value).toBe('-5');

    await save();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(error()).not.toBeNull();
  });

  it('clears the validation after a valid edit and saves it', async () => {
    const { onSubmit } = await renderForm();

    await setDistance('-5');
    expect(error()).not.toBeNull();

    await setDistance('100');
    expect(error()).toBeNull();

    await save();
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ durationValue: 100 }),
    );
  });
});
