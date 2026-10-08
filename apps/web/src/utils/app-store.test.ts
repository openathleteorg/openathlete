import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PurchaseCancelledError,
  activeSupporterTransactions,
  buySupporter,
  supporterPrices,
} from './app-store';

const plugin = vi.hoisted(() => ({
  getProducts: vi.fn(),
  purchaseProduct: vi.fn(),
  restorePurchases: vi.fn(),
  getPurchases: vi.fn(),
}));

vi.mock('@capgo/native-purchases', () => ({
  NativePurchases: plugin,
  PURCHASE_TYPE: { SUBS: 'subs' },
}));

describe('App Store helpers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reads the localized price of each Supporter product', async () => {
    plugin.getProducts.mockResolvedValue({
      products: [
        {
          identifier: 'org.openathlete.supporter.yearly',
          priceString: '49,99 €',
        },
        {
          identifier: 'org.openathlete.supporter.monthly',
          priceString: '4,99 €',
        },
      ],
    });

    await expect(supporterPrices()).resolves.toEqual({
      month: '4,99 €',
      year: '49,99 €',
    });
  });

  it('buys with the account token and returns the signed transaction', async () => {
    plugin.purchaseProduct.mockResolvedValue({ jwsRepresentation: 'jws' });

    await expect(buySupporter('year' as never, 'token-uuid')).resolves.toBe(
      'jws',
    );
    expect(plugin.purchaseProduct).toHaveBeenCalledWith({
      productIdentifier: 'org.openathlete.supporter.yearly',
      productType: 'subs',
      appAccountToken: 'token-uuid',
    });
  });

  it('tells a cancelled purchase apart from a failure', async () => {
    plugin.purchaseProduct.mockRejectedValue(new Error('User cancelled'));
    await expect(buySupporter('month' as never, 't')).rejects.toBeInstanceOf(
      PurchaseCancelledError,
    );

    plugin.purchaseProduct.mockRejectedValue(new Error('Network down'));
    await expect(buySupporter('month' as never, 't')).rejects.toThrow(
      'Network down',
    );
  });

  it('restores only active Supporter subscriptions', async () => {
    plugin.getPurchases.mockResolvedValue({
      purchases: [
        {
          productIdentifier: 'org.openathlete.supporter.monthly',
          isActive: true,
          jwsRepresentation: 'active',
        },
        {
          productIdentifier: 'org.openathlete.supporter.yearly',
          isActive: false,
          jwsRepresentation: 'expired',
        },
        {
          productIdentifier: 'com.example.other',
          isActive: true,
          jwsRepresentation: 'not-ours',
        },
      ],
    });

    await expect(activeSupporterTransactions()).resolves.toEqual(['active']);
    expect(plugin.restorePurchases).toHaveBeenCalled();
  });
});
