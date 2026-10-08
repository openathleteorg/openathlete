import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';

import {
  TestAppleStoreService,
  appleNotification,
  appleTransaction,
  signLikeAppStore,
} from '../apple/apple-store.fixture';
import { AppleNotificationsController } from './apple-notifications.controller';
import { SubscriptionController } from './subscription.controller';

function setup(appleStore = new TestAppleStoreService()) {
  const subscriptionService = {
    applyAppleNotification: jest.fn().mockResolvedValue({ userId: 7 }),
    linkAppleTransaction: jest.fn().mockResolvedValue({
      subscriptionId: 1,
      plan: 'SUPPORTER',
      status: 'active',
      provider: 'apple',
    }),
    getMaxAthletesForUser: jest.fn().mockResolvedValue(null),
  };
  return {
    subscriptionService,
    notifications: new AppleNotificationsController(
      appleStore,
      subscriptionService as never,
    ),
    subscriptions: new SubscriptionController(
      subscriptionService as never,
      { billingEnabled: true } as never,
      {} as never,
      appleStore,
      {} as never,
    ),
  };
}

describe('AppleNotificationsController', () => {
  it('applies a verified notification to the subscription', async () => {
    const { notifications, subscriptionService } = setup();

    await expect(
      notifications.handleNotification({
        signedPayload: signLikeAppStore(appleNotification()),
      }),
    ).resolves.toEqual({ received: true });

    expect(subscriptionService.applyAppleNotification).toHaveBeenCalledWith(
      expect.objectContaining({ originalTransactionId: '2000000000000001' }),
      expect.objectContaining({ autoRenewStatus: 1 }),
    );
  });

  it('rejects a payload Apple did not sign', async () => {
    const { notifications, subscriptionService } = setup();
    const [header, payload] = signLikeAppStore(appleNotification()).split('.');

    await expect(
      notifications.handleNotification({
        signedPayload: `${header}.${payload}.AAAA`,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(subscriptionService.applyAppleNotification).not.toHaveBeenCalled();
  });

  it('answers 503 when App Store purchases are off', async () => {
    const { notifications } = setup(new TestAppleStoreService(null));

    await expect(
      notifications.handleNotification({
        signedPayload: signLikeAppStore(appleNotification()),
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});

describe('SubscriptionController.recordAppleTransaction', () => {
  const user = { userId: 7 } as never;

  it('links a verified transaction and returns the subscription', async () => {
    const { subscriptions, subscriptionService } = setup();

    const result = await subscriptions.recordAppleTransaction(user, {
      signedTransaction: signLikeAppStore(appleTransaction()),
    });

    expect(subscriptionService.linkAppleTransaction).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ originalTransactionId: '2000000000000001' }),
    );
    expect(result).toMatchObject({ provider: 'apple', appStoreEnabled: true });
  });

  it('refuses a transaction from another app', async () => {
    const { subscriptions, subscriptionService } = setup();

    await expect(
      subscriptions.recordAppleTransaction(user, {
        signedTransaction: signLikeAppStore(
          appleTransaction({ bundleId: 'com.example.other' }),
        ),
      }),
    ).rejects.toThrow('INVALID_APPLE_TRANSACTION');
    expect(subscriptionService.linkAppleTransaction).not.toHaveBeenCalled();
  });
});
