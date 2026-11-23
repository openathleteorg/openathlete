import { ForbiddenException } from '@nestjs/common';

import { Feature } from '@openathlete/shared';

import { AuthUser } from '../auth/decorators/user.decorator';
import { MessagesController } from '../messages/controllers/messages.controller';
import { QuestionnaireController } from '../questionnaire/questionnaire.controller';
import { featureLockedException } from './services/feature-access.service';

const user = { userId: 9 } as AuthUser;

/** A coach without coach tools, as FeatureAccessService answers for them */
function lockedFeatures() {
  return {
    assertAsCoach: jest.fn(async (_userId: number, feature: Feature) => {
      throw featureLockedException(feature);
    }),
  };
}

describe('group messages without coach tools', () => {
  function controller() {
    const broadcasts = {
      send: jest.fn().mockResolvedValue({ threads: [] }),
      updateScheduled: jest.fn(),
      cancelScheduled: jest.fn(),
    };
    const features = lockedFeatures();
    const messages = new MessagesController(
      {} as never,
      {} as never,
      {} as never,
      broadcasts as never,
      features as never,
    );
    return { messages, broadcasts, features };
  }

  it('still sends one message to one person, now', async () => {
    const { messages, broadcasts } = controller();
    await messages.sendBroadcast(user, {
      recipientUserIds: [3],
      content: 'Hi',
      mode: 'INDIVIDUAL',
    });
    expect(broadcasts.send).toHaveBeenCalled();
  });

  it('refuses several people, or a set time', async () => {
    const { messages, broadcasts } = controller();
    await expect(
      messages.sendBroadcast(user, {
        recipientUserIds: [3, 4],
        content: 'Hi',
        mode: 'INDIVIDUAL',
      }),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      messages.sendBroadcast(user, {
        recipientUserIds: [3],
        content: 'Hi',
        mode: 'INDIVIDUAL',
        sendAt: new Date(Date.now() + 3_600_000),
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(broadcasts.send).not.toHaveBeenCalled();
  });

  it('lets a waiting message be canceled, not changed', async () => {
    const { messages, broadcasts } = controller();
    await expect(
      messages.updateScheduled(
        user,
        { scheduledMessageId: 1 },
        { content: 'Later' },
      ),
    ).rejects.toThrow(ForbiddenException);
    await messages.cancelScheduled(user, { scheduledMessageId: 1 });
    expect(broadcasts.cancelScheduled).toHaveBeenCalled();
  });
});

describe('questionnaires without coach tools', () => {
  function build(active: number) {
    const questionnaires = {
      create: jest.fn().mockResolvedValue({}),
      restore: jest.fn().mockResolvedValue({}),
    };
    const prisma = {
      questionnaire: { count: jest.fn().mockResolvedValue(active) },
    };
    const controller = new QuestionnaireController(
      questionnaires as never,
      {} as never,
      lockedFeatures() as never,
      prisma as never,
    );
    return { controller, questionnaires };
  }

  it('writes the first active questionnaire for free', async () => {
    const { controller, questionnaires } = build(0);
    await controller.create(user, {} as never);
    expect(questionnaires.create).toHaveBeenCalled();
  });

  it('refuses a second active one, written or restored', async () => {
    const { controller, questionnaires } = build(1);
    await expect(controller.create(user, {} as never)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(controller.restore(user, 4)).rejects.toThrow(
      ForbiddenException,
    );
    expect(questionnaires.create).not.toHaveBeenCalled();
    expect(questionnaires.restore).not.toHaveBeenCalled();
  });
});
