import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { UserLanguage } from '@openathlete/database';
import { ApiEnvSchemaType } from '@openathlete/shared';

import { VoiceTranscribedEvent } from 'src/events';
import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { ActivityFeedbackService } from './activity-feedback.service';

function setup(language: UserLanguage) {
  const create = jest
    .fn()
    .mockResolvedValue({ text: 'Bonne séance', duration: 12.5 });
  const emit = jest.fn();
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
    { emit } as unknown as EventEmitter2,
    { get: jest.fn() } as unknown as ConfigService<ApiEnvSchemaType, true>,
  );
  // The OpenAI client is created lazily: hand it a fake one
  (service as unknown as { openaiClient: unknown }).openaiClient = {
    audio: { transcriptions: { create } },
  };
  return { service, create, emit };
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
    [UserLanguage.DE, 'de'],
    [UserLanguage.PL, 'pl'],
    [UserLanguage.NL, 'nl'],
  ])('transcribes a %s user in %s', async (language, code) => {
    const { service, create } = setup(language);

    await service.transcribeAudio({ userId: 1 } as AuthUser, audio);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'whisper-1', language: code }),
    );
  });

  it('counts the length of the recording, which the instance pays for', async () => {
    const { service, create, emit } = setup(UserLanguage.FR);

    await expect(
      service.transcribeAudio({ userId: 7 } as AuthUser, audio),
    ).resolves.toEqual({ text: 'Bonne séance' });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ response_format: 'verbose_json' }),
    );
    expect(emit).toHaveBeenCalledWith(
      VoiceTranscribedEvent.SLUG,
      new VoiceTranscribedEvent({ userId: 7, seconds: 12.5 }),
    );
  });
});
