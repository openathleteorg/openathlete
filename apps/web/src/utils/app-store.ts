import {
  NativePurchases,
  PURCHASE_TYPE,
  type Transaction,
} from '@capgo/native-purchases';

import { APPLE_SUPPORTER_PRODUCTS } from '@openathlete/shared';

const PRODUCT_IDS = APPLE_SUPPORTER_PRODUCTS.map((item) => item.productId);

/**
 * The App Store's localized price of each Supporter product, by product id,
 * e.g. "7,99 €". Products not set up for the storefront are missing.
 */
export async function supporterPrices(): Promise<Record<string, string>> {
  const { products } = await NativePurchases.getProducts({
    productIdentifiers: PRODUCT_IDS,
    productType: PURCHASE_TYPE.SUBS,
  });
  return Object.fromEntries(
    products
      .filter((item) => PRODUCT_IDS.includes(item.identifier))
      .map((item) => [item.identifier, item.priceString]),
  );
}

export class PurchaseCancelledError extends Error {
  constructor() {
    super('The purchase was cancelled');
    this.name = 'PurchaseCancelledError';
  }
}

/**
 * Buys the Supporter subscription through StoreKit and returns the signed
 * transaction for the API to verify. The account token ties the purchase,
 * and every renewal Apple reports, to the user.
 */
export async function buySupporter(
  productId: string,
  appAccountToken: string,
): Promise<string> {
  let transaction: Transaction;
  try {
    transaction = await NativePurchases.purchaseProduct({
      productIdentifier: productId,
      productType: PURCHASE_TYPE.SUBS,
      appAccountToken,
    });
  } catch (error) {
    // The plugin rejects with this message when the user closes the sheet
    if (error instanceof Error && /cancel/i.test(error.message)) {
      throw new PurchaseCancelledError();
    }
    throw error;
  }
  if (!transaction.jwsRepresentation) {
    throw new Error('The App Store returned no signed transaction');
  }
  return transaction.jwsRepresentation;
}

/** Signed transactions of the Supporter subscriptions the Apple ID still has */
export async function activeSupporterTransactions(): Promise<string[]> {
  await NativePurchases.restorePurchases();
  const { purchases } = await NativePurchases.getPurchases({
    productType: PURCHASE_TYPE.SUBS,
  });
  const ours = new Set(PRODUCT_IDS);
  return purchases
    .filter((purchase) => ours.has(purchase.productIdentifier))
    .filter((purchase) => purchase.isActive !== false)
    .map((purchase) => purchase.jwsRepresentation)
    .filter((jws): jws is string => Boolean(jws));
}

/** Opens the App Store's page to change or cancel the subscription */
export function manageAppStoreSubscription(): Promise<void> {
  return NativePurchases.manageSubscriptions();
}
