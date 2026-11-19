import { z } from 'zod';

import { activityAiSummarySchema } from '@openathlete/shared';

import { clampToSchema, parseJsonAnswer } from './structured-output';

describe('parseJsonAnswer', () => {
  it('reads plain, fenced and surrounded JSON', () => {
    expect(parseJsonAnswer('{"a": 1}')).toEqual({ a: 1 });
    expect(parseJsonAnswer('```json\n{"a": 1}\n```')).toEqual({ a: 1 });
    expect(parseJsonAnswer('Here it is:\n```\n{"a": 1}\n```\nDone.')).toEqual({
      a: 1,
    });
    expect(parseJsonAnswer('Sure! {"a": {"b": 2}} Hope it helps')).toEqual({
      a: { b: 2 },
    });
    expect(parseJsonAnswer('<|channel|>final<|message|>{"a": 1}')).toEqual({
      a: 1,
    });
  });

  it('gives nothing for prose or cut JSON', () => {
    expect(parseJsonAnswer('')).toBeUndefined();
    expect(parseJsonAnswer('Great session!')).toBeUndefined();
    expect(parseJsonAnswer('{"a": "unfinished')).toBeUndefined();
  });
});

describe('clampToSchema', () => {
  it('fits an activity summary with a long point and one point too many', () => {
    const long = `${'Cadence held at 172 spm while the pace dropped '.repeat(8)}end`;
    const answer = {
      headline: 'Tempo held',
      points: [long, 'b', 'c', 'd'],
      suggestion: null,
    };

    const clamped = activityAiSummarySchema.parse(
      clampToSchema(answer, activityAiSummarySchema),
    );

    expect(clamped.points).toHaveLength(3);
    expect(clamped.points[0].length).toBeLessThanOrEqual(280);
    expect(clamped.points[0]).toMatch(/…$/);
    expect(clamped.points[0]).not.toMatch(/ …$/);
  });

  it('fills a nullable field the model left out', () => {
    const schema = z.object({
      questions: z.array(
        z.object({ text: z.string(), options: z.array(z.string()).nullable() }),
      ),
    });

    expect(
      clampToSchema({ questions: [{ text: 'How was it?' }] }, schema),
    ).toEqual({ questions: [{ text: 'How was it?', options: null }] });
  });

  it('goes through optional, lazy and refined schemas', () => {
    const schema = z.object({
      note: z.string().max(5).optional(),
      nested: z.lazy(() => z.array(z.string().max(3)).max(1)),
      refined: z
        .string()
        .max(4)
        .refine(() => true),
    });

    expect(
      clampToSchema(
        { note: 'abcdefgh', nested: ['abcdef', 'x'], refined: 'abcdefg' },
        schema,
      ),
    ).toEqual({ note: 'abcd…', nested: ['ab…'], refined: 'abc…' });
  });

  it('leaves values of the wrong type for the schema to refuse', () => {
    const schema = z.object({ points: z.array(z.string()).max(1) });
    expect(clampToSchema({ points: 'not an array' }, schema)).toEqual({
      points: 'not an array',
    });
  });
});
