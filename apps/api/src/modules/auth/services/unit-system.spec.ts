import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { AuthUser } from '../decorators/user.decorator';
import { AccountDeletionService } from './account-deletion.service';
import { AthleteInvitationService } from './athlete-invitation.service';
import { CoachInvitationService } from './coach-invitation.service';
import { TokenService } from './token.service';
import { UserService } from './user.service';

function setup() {
  const update = jest.fn().mockResolvedValue({});
  const service = new UserService(
    { user: { update } } as unknown as PrismaService,
    { get: () => undefined } as unknown as ConfigService<
      ApiEnvSchemaType,
      true
    >,
    {} as EventEmitter2,
    {} as TokenService,
    {} as AthleteInvitationService,
    {} as CoachInvitationService,
    {} as AccountDeletionService,
  );
  const saved = async (body: object) => {
    await service.updateAccount({ userId: 1 } as AuthUser, body);
    return (update.mock.calls[0][0] as { data: Record<string, unknown> }).data;
  };
  return { saved };
}

describe('choosing a unit system', () => {
  it('remembers that the user chose it', async () => {
    const data = await setup().saved({ unitSystem: 'IMPERIAL' });
    expect(data.unitSystem).toBe('IMPERIAL');
    expect(data.unitSystemChosenAt).toBeInstanceOf(Date);
  });

  it('is not implied by saving anything else', async () => {
    const data = await setup().saved({ firstName: 'Ana' });
    expect(data.unitSystem).toBeUndefined();
    expect(data.unitSystemChosenAt).toBeUndefined();
  });
});
