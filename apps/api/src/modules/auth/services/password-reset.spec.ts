import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { SendEmailEvent } from 'src/events';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { AccountDeletionService } from './account-deletion.service';
import { AthleteInvitationService } from './athlete-invitation.service';
import { CoachInvitationService } from './coach-invitation.service';
import { TokenService } from './token.service';
import { UserService } from './user.service';

function setup(env: Record<string, string>) {
  const emitter = { emit: jest.fn() };
  const service = new UserService(
    {
      user: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ userId: 3, email: 'ana@example.com' }),
      },
    } as unknown as PrismaService,
    { get: (key: string) => env[key] } as unknown as ConfigService<
      ApiEnvSchemaType,
      true
    >,
    emitter as unknown as EventEmitter2,
    {
      createToken: jest.fn().mockResolvedValue({ token: 'tok' }),
    } as unknown as TokenService,
    {} as AthleteInvitationService,
    {} as CoachInvitationService,
    {} as AccountDeletionService,
  );
  return { service, emitter };
}

describe('password reset request', () => {
  const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  afterEach(() => warn.mockClear());

  it.each([
    ['Resend', { RESEND_API_KEY: 'key' }],
    ['Brevo', { BREVO_API_KEY: 'key' }],
    ['SMTP', { SMTP_HOST: 'smtp.example.org' }],
  ])('emails the link when the instance sends through %s', async (_, env) => {
    const { service, emitter } = setup({
      APP_URL: 'https://train.example.org',
      ...env,
    });
    await service.passwordResetRequest({ email: 'ana@example.com' });
    expect(emitter.emit).toHaveBeenCalledWith(
      SendEmailEvent.SLUG,
      expect.objectContaining({
        payload: expect.objectContaining({
          params: {
            url: 'https://train.example.org/auth/password-reset?token=tok',
          },
        }),
      }),
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('logs the link for the administrator without email', async () => {
    const { service, emitter } = setup({ APP_URL: 'http://localhost' });
    await service.passwordResetRequest({ email: 'ana@example.com' });
    expect(emitter.emit).not.toHaveBeenCalled();
    const [message] = warn.mock.calls[0] as [string];
    expect(message).toContain('http://localhost/auth/password-reset?token=tok');
    // Never the full address in the logs
    expect(message).not.toContain('ana@example.com');
  });
});
