import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { UserLanguage } from '@openathlete/database';
import { ApiEnvSchemaType } from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { ActivityFeedbackService } from './activity-feedback.service';

function setup(language: UserLanguage) {
  const create = jest.fn().mockResolvedValue({ text: 'Bonne séance' });
  const prisma = {
    user: {
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        aiDataSharingConsentAt: new Date(),
        language,
      }),
    },
  };
  const service = new ActivityFeedbackService(
    prisma as unknown as PrismaService,
    {} as CaslAbilityFactory,
    {} as EventEmitter2,
    { get: jest.fn() } as unknown as ConfigService<ApiEnvSchemaType, true>,
  );
  // The OpenAI client is created lazily: hand it a fake one
  (service as unknown as { openaiClient: unknown }).openaiClient = {
    audio: { transcriptions: { create } },
  };
  return { service, create };
}

const audio = {
  buffer: Buffer.from('audio'),
  mimetype: 'audio/webm',
  originalname: 'note.webm',
};

describe('voice note transcription', () => {
  it.each([
    [UserLanguage.EN, 'en'],
    [UserLanguage.FR, 'fr'],
    [UserLanguage.IT, 'it'],
    [UserLanguage.ES, 'es'],
    [UserLanguage.PT_BR, 'pt'],
  ])('transcribes a %s user in %s', async (language, code) => {
    const { service, create } = setup(language);

    await service.transcribeAudio({ userId: 1 } as AuthUser, audio);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'whisper-1', language: code }),
    );
  });
});
