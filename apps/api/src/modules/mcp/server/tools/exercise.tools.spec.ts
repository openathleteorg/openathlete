import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { Workout, workoutSchema } from '../workout-format';
import {
  checkExercises,
  customExercisesOnce,
  registerExerciseTools,
  searchExercises,
} from './exercise.tools';

const entries = [
  {
    exerciseRef: 'c:barbell-full-squat',
    name: 'Barbell full squat',
    bodyPart: 'upper legs',
    equipment: 'barbell',
  },
  {
    exerciseRef: 'c:squat',
    name: 'Squat',
    bodyPart: 'upper legs',
    equipment: 'body weight',
  },
  {
    exerciseRef: 'c:dumbbell-squat',
    name: 'Dumbbell squat',
    bodyPart: 'upper legs',
    equipment: 'dumbbell',
  },
  {
    exerciseRef: 'c:cable-crossover-ecarte',
    name: 'Écarté cable',
    bodyPart: 'chest',
    equipment: 'cable',
  },
  {
    exerciseRef: 'u:5',
    name: 'Zercher squat',
    bodyPart: 'Upper Legs',
    custom: true,
  },
];

const names = (found: { name: string }[]) => found.map((item) => item.name);

describe('searchExercises', () => {
  it('matches every word of the query, in any order', () => {
    expect(names(searchExercises(entries, { query: 'squat barbell' }))).toEqual(
      ['Barbell full squat'],
    );
    expect(names(searchExercises(entries, { query: 'full barbell' }))).toEqual([
      'Barbell full squat',
    ]);
  });

  it('ignores case and accents, on both sides', () => {
    expect(names(searchExercises(entries, { query: 'ECARTE' }))).toEqual([
      'Écarté cable',
    ]);
    expect(names(searchExercises(entries, { query: 'écarté' }))).toEqual([
      'Écarté cable',
    ]);
  });

  it('returns everything without a query, by name (custom first)', () => {
    expect(names(searchExercises(entries, {}))).toEqual([
      'Zercher squat',
      'Barbell full squat',
      'Dumbbell squat',
      'Écarté cable',
      'Squat',
    ]);
  });

  it('splits the query on commas as well as spaces', () => {
    expect(
      names(searchExercises(entries, { query: 'squat, barbell' })),
    ).toEqual(['Barbell full squat']);
    expect(names(searchExercises(entries, { query: ' , ' }))).toHaveLength(
      entries.length,
    );
  });

  it('matches the equipment too', () => {
    expect(
      names(searchExercises(entries, { query: 'squat dumbbell' })),
    ).toEqual(['Dumbbell squat']);
    expect(names(searchExercises(entries, { query: 'cable' }))).toEqual([
      'Écarté cable',
    ]);
    // "body weight" is the equipment of Squat, not in its name
    expect(names(searchExercises(entries, { query: 'squat body' }))).toEqual([
      'Squat',
    ]);
  });

  it('ranks whole-word matches before substrings', () => {
    const rows = [
      { exerciseRef: 'c:narrow-row', name: 'Narrow grip pull' },
      { exerciseRef: 'c:throw', name: 'Medicine ball throw' },
      { exerciseRef: 'c:row', name: 'Seated cable row' },
    ];
    expect(names(searchExercises(rows, { query: 'row' }))).toEqual([
      'Seated cable row',
      'Narrow grip pull',
      'Medicine ball throw',
    ]);
  });

  it('filters by body part, ignoring case, custom exercises included', () => {
    expect(names(searchExercises(entries, { bodyPart: 'chest' }))).toEqual([
      'Écarté cable',
    ]);
    expect(names(searchExercises(entries, { bodyPart: 'upper legs' }))).toEqual(
      ['Zercher squat', 'Barbell full squat', 'Dumbbell squat', 'Squat'],
    );
  });

  it('puts custom exercises first, then names starting with the query, then the shorter', () => {
    expect(names(searchExercises(entries, { query: 'squat' }))).toEqual([
      'Zercher squat',
      'Squat',
      'Dumbbell squat',
      'Barbell full squat',
    ]);
    expect(names(searchExercises(entries, { query: 'dumb squat' }))).toEqual([
      'Dumbbell squat',
    ]);
  });

  it('finds nothing for a word no name has', () => {
    expect(searchExercises(entries, { query: 'squat kettlebell' })).toEqual([]);
  });
});

type Tool = (args: unknown) => Promise<CallToolResult>;

function setup(custom: object[] = []) {
  const tools: Record<string, Tool> = {};
  const server = {
    registerTool: (name: string, _config: unknown, handler: Tool) => {
      tools[name] = handler;
    },
  };
  const deps = {
    customExercises: { list: jest.fn().mockResolvedValue(custom) },
  };
  const ctx = { user: { userId: 1 } };
  registerExerciseTools(server as never, ctx as never, deps as never);
  return { tools, deps, ctx };
}

const own = {
  ref: 'u:5',
  name: 'Zercher squat',
  instructions: 'Hold the bar in the elbows',
  mediaUrl: 'https://example.org/z.mp4',
  bodyPart: 'upper legs',
  equipment: 'barbell',
  defaultDurationType: 'TIME',
  defaultDurationValue: 30,
};

describe('list_exercises', () => {
  it('pages the results and says when more remain', async () => {
    const { tools } = setup([own]);
    const first = await tools.list_exercises({
      query: 'squat',
      limit: 2,
      offset: 0,
    });
    const body = first.structuredContent as {
      count: number;
      truncated: boolean;
      exercises: { exerciseRef: string; custom?: boolean }[];
    };
    expect(body.count).toBeGreaterThan(5);
    expect(body.truncated).toBe(true);
    expect(body.exercises).toHaveLength(2);
    expect(body.exercises[0]).toMatchObject({
      exerciseRef: 'u:5',
      custom: true,
    });

    const last = await tools.list_exercises({
      query: 'squat',
      limit: 100,
      offset: body.count - 1,
    });
    const tail = last.structuredContent as typeof body;
    expect(tail.exercises).toHaveLength(1);
    expect(tail.truncated).toBe(false);
  });

  it('lists catalog exercises with their fields, and filters by body part', async () => {
    const { tools } = setup();
    const result = await tools.list_exercises({
      query: 'barbell full squat',
      bodyPart: 'upper legs',
      limit: 30,
      offset: 0,
    });
    expect(result.structuredContent?.exercises).toContainEqual({
      exerciseRef: 'c:barbell-full-squat',
      name: 'Barbell full squat',
      bodyPart: 'upper legs',
      equipment: 'barbell',
    });
  });
});

describe('get_exercise', () => {
  it('returns a catalog exercise without instructions', async () => {
    const { tools, deps } = setup();
    const result = await tools.get_exercise({
      exerciseRef: 'c:barbell-full-squat',
    });
    expect(result.structuredContent).toEqual({
      exerciseRef: 'c:barbell-full-squat',
      name: 'Barbell full squat',
      bodyPart: 'upper legs',
      equipment: 'barbell',
    });
    expect(deps.customExercises.list).not.toHaveBeenCalled();
  });

  it('returns a custom exercise with its instructions and defaults', async () => {
    const { tools } = setup([own]);
    const result = await tools.get_exercise({ exerciseRef: 'u:5' });
    expect(result.structuredContent).toEqual({
      exerciseRef: 'u:5',
      name: 'Zercher squat',
      bodyPart: 'upper legs',
      equipment: 'barbell',
      custom: true,
      instructions: 'Hold the bar in the elbows',
      mediaUrl: 'https://example.org/z.mp4',
      defaultSeconds: 30,
    });
  });

  it('refuses an unknown ref, pointing at list_exercises', async () => {
    const { tools } = setup([own]);
    for (const exerciseRef of ['c:back-squatt', 'u:99', 'squat', '']) {
      const result = await tools.get_exercise({ exerciseRef });
      expect(result.isError).toBe(true);
      expect(result.content[0]).toMatchObject({
        text: `unknown exerciseRef "${exerciseRef}": use list_exercises for valid refs`,
      });
    }
  });
});

describe('checkExercises', () => {
  const sets = [{ work: { type: 'REPS' as const, value: 5 } }];
  const workout = (...refs: string[]) =>
    workoutSchema.parse(
      refs.map((exerciseRef) => ({
        kind: 'exercise',
        exercise: { exerciseRef, sets },
      })),
    );
  /** What the input schema refuses, to prove the check does not rely on it */
  const unchecked = (items: unknown[]) => items as Workout;
  const loader = (custom: object[] = []) =>
    jest.fn(async () => custom as never[]);
  const problems = async (...args: Parameters<typeof checkExercises>) =>
    (await checkExercises(...args)).problems;

  it('names every unknown ref, quoted', async () => {
    expect(
      await problems(
        loader([own]),
        workout('c:band-squat', 'c:back-squatt', 'u:99', 'u:5', 'nope'),
      ),
    ).toEqual([
      'unknown exerciseRef "c:back-squatt", "u:99", "nope": use list_exercises for valid refs',
    ]);
  });

  it('reports an empty ref, in an item and in a group member', async () => {
    const message = 'unknown exerciseRef "": use list_exercises for valid refs';
    const item = unchecked([
      { kind: 'exercise', exercise: { exerciseRef: '', sets } },
    ]);
    const member = unchecked([
      {
        kind: 'group',
        group: 'SUPERSET',
        rounds: 2,
        exercises: [
          { exerciseRef: 'c:band-squat', sets: sets.slice(0, 1) },
          { exerciseRef: '', sets: sets.slice(0, 1) },
        ],
      },
    ]);
    expect(await problems(loader(), item)).toEqual([message]);
    expect(await problems(loader(), member)).toEqual([message]);
    // A flat step and a repeat child as well
    expect(
      await problems(
        loader(),
        unchecked([
          { kind: 'work', reps: 5, exerciseRef: '' },
          {
            kind: 'repeat',
            times: 2,
            steps: [{ kind: 'work', exerciseRef: '' }],
          },
        ]),
      ),
    ).toEqual([message]);
  });

  it('refuses an empty ref in the input schema', () => {
    expect(
      workoutSchema.safeParse([
        { kind: 'exercise', exercise: { exerciseRef: '', sets } },
      ]).success,
    ).toBe(false);
  });

  it('returns the problem instead of throwing, leaving the workout alone', async () => {
    const result = await checkExercises(loader(), workout('nope'));
    expect(result.problems).toHaveLength(1);
    expect(result.workout).toEqual(workout('nope'));
  });

  it('lets through refs already stored in the session', async () => {
    const checked = await checkExercises(
      loader(),
      workout('c:band-squat', 'u:99'),
      new Map([['u:99', 'Kept name']]),
    );
    expect(checked.problems).toEqual([]);
    expect(checked.workout).toHaveLength(2);
  });

  it('names a kept ref that is gone with its stored name, not its ref', async () => {
    const checked = await checkExercises(
      loader(),
      workout('u:99'),
      new Map([['u:99', 'Kept name']]),
    );
    expect(checked.workout?.[0]).toMatchObject({
      exercise: { exerciseRef: 'u:99', name: 'Kept name' },
    });
    // The live name wins over the stored one
    const live = await checkExercises(
      loader([own]),
      workout('u:5'),
      new Map([['u:5', 'Old name']]),
    );
    expect(live.workout?.[0]).toMatchObject({
      exercise: { name: 'Zercher squat' },
    });
  });

  it('names flat steps and repeat children that have a ref', async () => {
    const checked = await checkExercises(
      loader(),
      workoutSchema.parse([
        { kind: 'work', reps: 5, exerciseRef: 'c:band-squat' },
        {
          kind: 'repeat',
          times: 3,
          steps: [
            { kind: 'work', reps: 5, exerciseRef: 'c:band-squat' },
            {
              kind: 'work',
              reps: 5,
              exerciseRef: 'c:band-squat',
              name: 'Mine',
            },
            { kind: 'recovery', durationSeconds: 30 },
          ],
        },
      ]),
    );
    expect(checked.workout).toMatchObject([
      { name: 'Band squat' },
      {
        steps: [{ name: 'Band squat' }, { name: 'Mine' }, { kind: 'recovery' }],
      },
    ]);
  });

  it('leaves a stored flat step without a name unnamed', async () => {
    const checked = await checkExercises(
      loader(),
      workoutSchema.parse([
        { kind: 'work', reps: 5, exerciseRef: 'c:band-squat' },
        {
          kind: 'repeat',
          times: 2,
          steps: [{ kind: 'work', reps: 5, exerciseRef: 'c:band-squat' }],
        },
      ]),
      new Map([['c:band-squat', null]]),
    );
    const [flat, repeat] = checked.workout as unknown as {
      name?: string;
      steps: { name?: string }[];
    }[];
    expect(flat.name).toBeUndefined();
    expect(repeat.steps[0].name).toBeUndefined();
  });

  it('fills the stored name on flat steps and repeat children whose ref is stored with one', async () => {
    const checked = await checkExercises(
      loader(),
      workoutSchema.parse([
        { kind: 'work', reps: 5, exerciseRef: 'u:99' },
        {
          kind: 'repeat',
          times: 3,
          steps: [
            { kind: 'work', reps: 5, exerciseRef: 'u:99' },
            { kind: 'work', reps: 5, exerciseRef: 'u:99', name: 'Mine' },
            { kind: 'work', reps: 5, exerciseRef: 'u:98' },
          ],
        },
      ]),
      new Map<string, string | null>([
        ['u:99', 'Kept name'],
        ['u:98', null],
      ]),
    );
    expect(checked.problems).toEqual([]);
    const [flat, repeat] = checked.workout as unknown as {
      name?: string;
      steps: { name?: string }[];
    }[];
    expect(flat.name).toBe('Kept name');
    expect(repeat.steps.map((step) => step.name)).toEqual([
      'Kept name',
      'Mine',
      undefined,
    ]);
  });

  it('fills the names, and asks for the custom exercises only for u: refs', async () => {
    const custom = loader([own]);
    const catalogOnly = await checkExercises(custom, workout('c:band-squat'));
    expect(custom).not.toHaveBeenCalled();
    expect(catalogOnly.workout?.[0]).toMatchObject({
      exercise: { name: 'Band squat' },
    });

    const mixed = await checkExercises(custom, workout('c:band-squat', 'u:5'));
    expect(custom).toHaveBeenCalledTimes(1);
    expect(mixed.workout?.[1]).toMatchObject({
      exercise: { name: 'Zercher squat' },
    });
  });

  it('does nothing without a workout or without exercises', async () => {
    expect(await checkExercises(loader(), undefined)).toEqual({
      workout: undefined,
      problems: [],
    });
    const steps = workoutSchema.parse([
      { kind: 'steady', durationSeconds: 60 },
    ]);
    expect((await checkExercises(loader(), steps)).workout).toBe(steps);
  });
});

describe('customExercisesOnce', () => {
  it('loads the custom exercises once, however many sessions ask', async () => {
    const { deps, ctx } = setup([own]);
    const custom = customExercisesOnce(deps as never, ctx as never);
    const sets = [{ work: { type: 'REPS' as const, value: 5 } }];
    const session = (ref: string) =>
      workoutSchema.parse([
        { kind: 'exercise', exercise: { exerciseRef: ref, sets } },
      ]);
    await checkExercises(custom, session('u:5'));
    await checkExercises(custom, session('u:5'));
    expect(deps.customExercises.list).toHaveBeenCalledTimes(1);
  });

  it('does not load them before the first use', () => {
    const { deps, ctx } = setup([own]);
    customExercisesOnce(deps as never, ctx as never);
    expect(deps.customExercises.list).not.toHaveBeenCalled();
  });
});
