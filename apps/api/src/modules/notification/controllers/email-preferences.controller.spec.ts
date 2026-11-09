import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { createUnsubscribeToken } from '../lifecycle/unsubscribe-token';
import { EmailPreferencesController } from './email-preferences.controller';

function setup() {
  const updateMany = jest.fn().mockResolvedValue({ count: 1 });
  const controller = new EmailPreferencesController(
    { user: { updateMany } } as unknown as PrismaService,
    { get: () => 'secret' } as unknown as ConfigService<never, true>,
  );
  return { controller, updateMany };
}

describe('EmailPreferencesController', () => {
  it.each([
    ['tips', { emailTips: false }],
    ['recap', { emailRecap: false }],
    ['news', { emailNewsConsentAt: null }],
  ] as const)('turns the %s emails off', async (list, data) => {
    const { controller, updateMany } = setup();
    await expect(
      controller.unsubscribe(createUnsubscribeToken('secret', 7, list)),
    ).resolves.toEqual({ list, subscribed: false });
    expect(updateMany).toHaveBeenCalledWith({ where: { userId: 7 }, data });
  });

  it('turns a list on again, dating the consent to news', async () => {
    const { controller, updateMany } = setup();
    await controller.resubscribe(createUnsubscribeToken('secret', 7, 'news'));
    expect(updateMany).toHaveBeenCalledWith({
      where: { userId: 7 },
      data: { emailNewsConsentAt: expect.any(Date) },
    });
  });

  it('refuses a missing or forged token', async () => {
    const { controller, updateMany } = setup();
    await expect(controller.unsubscribe(undefined as never)).rejects.toThrow(
      BadRequestException,
    );
    await expect(
      controller.unsubscribe(createUnsubscribeToken('other', 7, 'tips')),
    ).rejects.toThrow(BadRequestException);
    expect(updateMany).not.toHaveBeenCalled();
  });
});
