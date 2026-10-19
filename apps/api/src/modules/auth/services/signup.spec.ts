import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ApiEnvSchemaType, EmailId } from '@openathlete/shared';

import { SendEmailEvent } from 'src/events';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { AccountDeletionService } from './account-deletion.service';
import { AthleteInvitationService } from './athlete-invitation.service';
import { CoachInvitationService } from './coach-invitation.service';
import { TokenService } from './token.service';
import { UserService } from './user.service';

function setup(env: Record<string, string> = {}) {
  const emitter = { emit: jest.fn() };
  const prisma = {
    user: {
      findFirst: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(3),
      create: jest.fn().mockResolvedValue({ userId: 42 }),
    },
  };
  const service = new UserService(
    prisma as unknown as PrismaService,
    {
      get: (key: string) =>
        ({ APP_URL: 'http://localhost', SIGNUP_MODE: 'open', ...env })[key],
    } as unknown as ConfigService<ApiEnvSchemaType, true>,
    emitter as unknown as EventEmitter2,
    {} as TokenService,
    {
      verifyInvitationToken: jest.fn(async (token: string) =>
        token === 'valid'
          ? { athleteInvitationId: 1, email: 'ana@example.com' }
          : null,
      ),
      consumeInvitation: jest.fn(),
    } as unknown as AthleteInvitationService,
    {
      verifyInvitationToken: jest.fn().mockResolvedValue(null),
      consumeInvitation: jest.fn(),
    } as unknown as CoachInvitationService,
    {} as AccountDeletionService,
  );
  const signUp = (
    extra: object = {},
    options?: Parameters<UserService['createAccount']>[1],
  ) =>
    service.createAccount(
      {
        email: 'Ana@Example.com',
        password: 'E2e-Test-Passw0rd!',
        firstName: 'Ana',
        lastName: 'Lopez',
        ...extra,
      },
      options,
    );
  const emails = () =>
    emitter.emit.mock.calls
      .filter(([slug]) => slug === SendEmailEvent.SLUG)
      .map(([, event]) => (event as SendEmailEvent<EmailId>).payload);
  const emailsTo = () => emails().map((email) => email.to);
  return { prisma, signUp, emails, emailsTo };
}

describe('sign-up notification', () => {
  it('tells nobody about new accounts by default', async () => {
    const { signUp, emailsTo } = setup();
    await signUp();
    // Only the welcome email, to the new user
    expect(emailsTo()).toEqual(['ana@example.com']);
  });

  it('notifies the address the instance chose', async () => {
    const { signUp, emailsTo } = setup({
      SIGNUP_NOTIFICATION_EMAIL: 'team@example.org',
    });
    await signUp();
    expect(emailsTo()).toEqual(['ana@example.com', 'team@example.org']);
  });
});

describe('sign-up mode', () => {
  it('lets anyone sign up by default', async () => {
    const { signUp, prisma } = setup();
    await expect(signUp()).resolves.toEqual({ userId: 42 });
    expect(prisma.user.count).not.toHaveBeenCalled();
  });

  it('needs a valid invitation in invite mode', async () => {
    const { signUp, prisma } = setup({ SIGNUP_MODE: 'invite' });
    await expect(signUp()).rejects.toThrow('SIGNUP_INVITE_ONLY');
    await expect(signUp({ invitationToken: 'expired' })).rejects.toThrow(
      'SIGNUP_INVITE_ONLY',
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
    await expect(signUp({ invitationToken: 'valid' })).resolves.toEqual({
      userId: 42,
    });
  });

  it('refuses every sign-up when closed', async () => {
    const { signUp } = setup({ SIGNUP_MODE: 'closed' });
    await expect(signUp({ invitationToken: 'valid' })).rejects.toThrow(
      'SIGNUP_CLOSED',
    );
  });

  it("always lets the instance's first account in", async () => {
    for (const mode of ['invite', 'closed']) {
      const { signUp, prisma } = setup({ SIGNUP_MODE: mode });
      prisma.user.count.mockResolvedValue(0);
      await expect(signUp()).resolves.toEqual({ userId: 42 });
    }
  });
});

describe('sign-up language', () => {
  it('saves the language the app was shown in and welcomes in it', async () => {
    const { signUp, prisma, emails } = setup();
    await signUp({ language: 'ES' });
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ language: 'ES' }),
      }),
    );
    expect(emails()).toEqual([
      expect.objectContaining({ type: 'welcome', language: 'ES' }),
    ]);
  });

  it('keeps the default language when the app sends none', async () => {
    const { signUp, prisma } = setup();
    await signUp();
    const { data } = prisma.user.create.mock.calls[0][0] as {
      data: { language?: string };
    };
    expect(data.language).toBeUndefined();
  });
});

describe('sign-up with an invitation link', () => {
  it('refuses a spent or unknown link before creating the account', async () => {
    const { signUp, prisma } = setup();
    await expect(signUp({ invitationToken: 'spent' })).rejects.toThrow(
      'Invalid or expired invitation token',
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('needs the invited address for a password sign-up', async () => {
    const { signUp, prisma } = setup();
    await expect(
      signUp({ invitationToken: 'valid', email: 'mallory@example.com' }),
    ).rejects.toThrow('INVITATION_EMAIL_MISMATCH');
    expect(prisma.user.create).not.toHaveBeenCalled();

    // Any case of the invited address
    await expect(signUp({ invitationToken: 'valid' })).resolves.toEqual({
      userId: 42,
    });
  });

  it('takes the address Google or Apple gives', async () => {
    const { signUp } = setup();
    await expect(
      signUp(
        { invitationToken: 'valid', email: 'relay@privaterelay.appleid.com' },
        { emailFromProvider: true },
      ),
    ).resolves.toEqual({ userId: 42 });
  });
});
