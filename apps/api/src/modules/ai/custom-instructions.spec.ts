import { withCustomInstructions } from './custom-instructions';

describe('withCustomInstructions', () => {
  it('keeps the generic instructions first, as the cached prefix', () => {
    const result = withCustomInstructions(
      'You are a coach.',
      'Warm up in zone 1.',
    );

    expect(result.startsWith('You are a coach.\n\n')).toBe(true);
    expect(result).toContain(
      '<custom_instructions>\nWarm up in zone 1.\n</custom_instructions>',
    );
  });

  it('leaves the instructions untouched without custom ones', () => {
    expect(withCustomInstructions('You are a coach.', null)).toBe(
      'You are a coach.',
    );
    expect(withCustomInstructions('You are a coach.', '  \n ')).toBe(
      'You are a coach.',
    );
  });

  it('gives the same prompt for the same instructions, so it stays cached', () => {
    expect(withCustomInstructions('A', ' Ask about sleep. ')).toBe(
      withCustomInstructions('A', 'Ask about sleep.'),
    );
  });
});
