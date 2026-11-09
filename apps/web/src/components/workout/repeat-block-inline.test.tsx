// @vitest-environment jsdom
import { act, useState } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type CreateWorkoutStepDto,
  SPORT_TYPE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  type WorkoutDto,
  type WorkoutStepDto,
} from '@openathlete/shared';

import { RepeatBlockInline } from './repeat-block-inline';
import { WorkoutBuilder } from './workout-builder';

vi.mock('@/paraglide/messages', () => {
  const m = new Proxy(
    {},
    {
      get: (_target, key) =>
        typeof key === 'symbol' || key === 'then'
          ? undefined
          : () => String(key),
    },
  );
  return {
    m,
    workout_step_repeat: () => 'workout_step_repeat',
    step_form_name: () => 'step_form_name',
    repeat_form_no_steps_description: () => 'repeat_form_no_steps_description',
    workout_add_step_to_repeat: () => 'workout_add_step_to_repeat',
    workout_edit_step: () => 'workout_edit_step',
    workout_add_step: () => 'workout_add_step',
    repeat_form_edit_step_description: () =>
      'repeat_form_edit_step_description',
    repeat_form_add_step_description: () => 'repeat_form_add_step_description',
    workout_structured_training: () => 'workout_structured_training',
    workout_add_repeat_block: () => 'workout_add_repeat_block',
    workout_no_steps: () => 'workout_no_steps',
    workout_update_step: () => 'workout_update_step',
    cancel: () => 'cancel',
    step_form_save: () => 'step_form_save',
    step_form_cancel: () => 'step_form_cancel',
  };
});

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const setInputValue = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

describe('RepeatBlockInline name field', () => {
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

  it('shows and updates the repeat step name, clearing to null when emptied', async () => {
    const onUpdate = vi.fn();
    const step: WorkoutStepDto & {
      repeatBlock: NonNullable<WorkoutStepDto['repeatBlock']>;
    } = {
      workoutStepId: 10,
      orderIndex: 0,
      stepType: WORKOUT_STEP_TYPE.REPEAT,
      name: '8 × 1 min 30 s VO₂max / 1 min 30 s récupération',
      durationType: WORKOUT_DURATION_TYPE.OPEN,
      durationValue: null,
      targets: [],
      repeatBlock: {
        repetitions: 8,
        childSteps: [],
      },
    };

    await act(async () => {
      root.render(
        <RepeatBlockInline
          step={step}
          onUpdate={onUpdate}
          onDelete={vi.fn()}
          onAddChildStep={vi.fn()}
          onEditChildStep={vi.fn()}
          onDeleteChildStep={vi.fn()}
        />,
      );
    });

    const nameInput =
      container.querySelector<HTMLInputElement>('#repeat-name-10')!;
    expect(nameInput).not.toBeNull();
    expect(nameInput.value).toBe(
      '8 × 1 min 30 s VO₂max / 1 min 30 s récupération',
    );

    await act(async () => {
      setInputValue(nameInput, '6 × 2 min / 1 min');
    });
    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        workoutStepId: 10,
        name: '6 × 2 min / 1 min',
      }),
    );

    await act(async () => {
      setInputValue(nameInput, '');
    });
    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        workoutStepId: 10,
        name: null,
      }),
    );
  });

  it('preserves input identity when parent recreates workout from onStepsChange', async () => {
    let latestSteps: CreateWorkoutStepDto[] = [];

    function Harness() {
      const [steps, setSteps] = useState<CreateWorkoutStepDto[]>([
        {
          stepType: WORKOUT_STEP_TYPE.REPEAT,
          name: '8x 90s/90s',
          durationType: WORKOUT_DURATION_TYPE.OPEN,
          durationValue: null,
          targets: [],
          repeatBlock: {
            repetitions: 8,
            childSteps: [],
          },
        },
      ]);

      // Mimic WorkoutSection: hash includes step.name when building workoutStepId
      const workout: WorkoutDto = {
        workoutId: 1,
        eventTrainingId: 1,
        steps: steps.map((s, idx) => ({
          ...s,
          workoutStepId: (s.name ?? '').length * 100 + idx + 1,
          orderIndex: idx,
        })) as WorkoutStepDto[],
      };

      return (
        <WorkoutBuilder
          workout={workout}
          sport={SPORT_TYPE.RUNNING}
          onStepsChange={(next) => {
            latestSteps = next;
            setSteps(next);
          }}
        />
      );
    }

    await act(async () => {
      root.render(<Harness />);
    });

    const initialInput = container.querySelector<HTMLInputElement>(
      'input[id^="repeat-name-"]',
    )!;
    expect(initialInput.value).toBe('8x 90s/90s');

    await act(async () => {
      setInputValue(initialInput, '6x 2min/1min');
    });

    const currentInput = container.querySelector<HTMLInputElement>(
      'input[id^="repeat-name-"]',
    )!;
    expect(currentInput).toBe(initialInput);
    expect(currentInput.value).toBe('6x 2min/1min');
    expect(latestSteps[0]?.name).toBe('6x 2min/1min');
  });
});
