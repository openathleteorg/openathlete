import { AiErrorCode } from '@openathlete/shared';

import { AiProviderException } from 'src/modules/ai/ai.errors';

import { ActivityFeedbackListener } from './activity-feedback.listener';

// An ESM package Jest cannot load, pulled in through the AI module
jest.mock('src/modules/ai', () => ({
  AiModelResolverService: class {},
  AiService: class {},
}));

const questions = {
  questions: [{ text: 'How did it feel?', qcmOptions: null }],
};

function setup() {
  const ai = { generateObject: jest.fn() };
  const listener = new ActivityFeedbackListener(
    {} as never,
    {} as never,
    ai as never,
  );
  const generate = (
    listener as unknown as {
      generateQuestions: (context: string, model: unknown) => Promise<unknown>;
    }
  ).generateQuestions.bind(listener);
  return { ai, generate };
}

describe('ActivityFeedbackListener question generation', () => {
  it('asks again once when the answer does not fit the schema', async () => {
    const { ai, generate } = setup();
    ai.generateObject
      .mockRejectedValueOnce(
        new AiProviderException(AiErrorCode.INVALID_OUTPUT, 'no valid result'),
      )
      .mockResolvedValueOnce(questions);

    await expect(generate('context', {})).resolves.toEqual(questions);
    expect(ai.generateObject).toHaveBeenCalledTimes(2);
  });

  it('does not retry a refused key', async () => {
    const { ai, generate } = setup();
    ai.generateObject.mockRejectedValue(
      new AiProviderException(AiErrorCode.CREDENTIAL_REJECTED, 'refused', 401),
    );

    await expect(generate('context', {})).rejects.toThrow('refused');
    expect(ai.generateObject).toHaveBeenCalledTimes(1);
  });
});
