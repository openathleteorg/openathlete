import { ActivityFeedbackCompletedEvent } from 'src/events';
import { extractInjuryAgent, extractRpeAgent } from 'src/mastra/agents';
import { AiModelResolverService, AiService } from 'src/modules/ai';
import { CalendarWebSocketService } from 'src/modules/calendar/services/calendar-websocket.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { ActivityFeedbackExtractionListener } from './activity-feedback-extraction.listener';

// Jest cannot load Mastra's ESM providers: agents and AI services are
// replaced, the listener only sees their interfaces.
jest.mock('src/mastra/agents', () => ({
  extractInjuryAgent: { id: 'extract-injury' },
  extractRpeAgent: { id: 'extract-rpe' },
  injuriesOutputSchema: {},
  rpeOutputSchema: {},
}));
jest.mock('src/modules/ai', () => ({
  AiModelResolverService: class {},
  AiService: class {},
}));
jest.mock('src/modules/calendar/services/calendar-websocket.service', () => ({
  CalendarWebSocketService: class {},
}));

const model = { task: 'FEEDBACK_EXTRACTION', source: 'hosted' };

function setup() {
  const activity = {
    description: 'Felt strong',
    event: { eventId: 30, athleteId: 2 },
    feedbackQuestions: [
      { questionText: 'How did it go?', answerText: 'Hard, knee sore' },
    ],
  };
  const tx = {
    athleteInjury: { create: jest.fn() },
    eventActivity: { update: jest.fn() },
  };
  const prisma = {
    eventActivity: { findUnique: jest.fn().mockResolvedValue(activity) },
    athleteSettings: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ requireFeedbackQuestions: true }),
    },
    athleteInjury: { findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn(async (run: (client: typeof tx) => unknown) =>
      run(tx),
    ),
  };
  const resolver = { tryResolveForAthlete: jest.fn().mockResolvedValue(model) };
  const ai = {
    generateObject: jest.fn(async (agent: { id: string }) =>
      agent.id === 'extract-injury'
        ? {
            injuries: [
              {
                location: 'knee',
                painScore: 1.4,
                context: 'sore',
                status: 'STABLE',
              },
            ],
          }
        : { extractedRpe: 0.8 },
    ),
  };
  const calendar = { notifyActivityProcessed: jest.fn() };
  const listener = new ActivityFeedbackExtractionListener(
    prisma as unknown as PrismaService,
    calendar as unknown as CalendarWebSocketService,
    resolver as unknown as AiModelResolverService,
    ai as unknown as AiService,
  );
  const run = (
    trigger: ActivityFeedbackCompletedEvent['payload']['trigger'] = 'questions_completed',
  ) =>
    listener.handleActivityFeedbackCompleted({
      payload: { eventActivityId: 10, trigger },
    } as ActivityFeedbackCompletedEvent);
  return { prisma, tx, resolver, ai, calendar, run };
}

describe('ActivityFeedbackExtractionListener', () => {
  it('extracts injuries and RPE on the resolved model', async () => {
    const { tx, resolver, ai, calendar, run } = setup();
    await run();
    expect(resolver.tryResolveForAthlete).toHaveBeenCalledWith(
      'FEEDBACK_EXTRACTION',
      2,
    );
    expect(ai.generateObject).toHaveBeenCalledWith(
      extractInjuryAgent,
      model,
      expect.stringContaining('Hard, knee sore'),
      expect.anything(),
    );
    expect(ai.generateObject).toHaveBeenCalledWith(
      extractRpeAgent,
      model,
      expect.stringContaining('Felt strong'),
      expect.anything(),
    );
    // Pain is bounded to the stored 0-1 scale.
    expect(tx.athleteInjury.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        athleteId: 2,
        sourceActivityId: 10,
        location: 'knee',
        painScore: 1,
      }),
    });
    expect(tx.eventActivity.update).toHaveBeenCalledWith({
      where: { eventActivityId: 10 },
      data: { rpe: 0.8 },
    });
    expect(calendar.notifyActivityProcessed).toHaveBeenCalledWith(30, 2);
  });

  it.each([
    [null, 'questions_completed'],
    [{ requireFeedbackQuestions: false }, 'questions_completed'],
    // Saving an RPE with a comment triggers the analysis too.
    [{ requireFeedbackQuestions: false }, 'rpe_comment_updated'],
  ] as const)(
    'sends nothing to AI when the athlete turned questions off (%j, %s)',
    async (settings, trigger) => {
      const { prisma, resolver, ai, run } = setup();
      prisma.athleteSettings.findUnique.mockResolvedValue(settings);
      await run(trigger);
      expect(resolver.tryResolveForAthlete).not.toHaveBeenCalled();
      expect(ai.generateObject).not.toHaveBeenCalled();
    },
  );

  it('skips without AI for the athlete or their coaches', async () => {
    const { resolver, ai, prisma, run } = setup();
    resolver.tryResolveForAthlete.mockResolvedValue(null);
    await run();
    expect(ai.generateObject).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('waits until every question is answered', async () => {
    const { prisma, ai, run } = setup();
    prisma.eventActivity.findUnique.mockResolvedValue({
      description: '',
      event: { eventId: 30, athleteId: 2 },
      feedbackQuestions: [
        { questionText: 'How did it go?', answerText: 'Fine' },
        { questionText: 'Any pain?', answerText: null },
      ],
    });
    await run();
    expect(ai.generateObject).not.toHaveBeenCalled();
  });
});
