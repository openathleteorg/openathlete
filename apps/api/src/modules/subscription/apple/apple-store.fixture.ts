import {
  Environment,
  SignedDataVerifier,
} from '@apple/app-store-server-library';
import { createPrivateKey, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  APPLE_SUPPORTER_PRODUCT_IDS,
  BillingInterval,
  IOS_APP_BUNDLE_ID,
} from '@openathlete/shared';

import { AppleStoreService } from './apple-store.service';

/**
 * Signs StoreKit payloads the way the App Store does (ES256, with the x5c
 * certificate chain in the header), with the throwaway chain of
 * test/fixtures/apple-test-pki, so tests run Apple's real verification code.
 */
const PKI = join(__dirname, '../../../../test/fixtures/apple-test-pki');
const read = (file: string) => readFileSync(join(PKI, file));

export const TEST_APP_APPLE_ID = 1234567890;
export const TEST_ROOT_CA = read('root.der');
const CHAIN = ['leaf.der', 'intermediate.der', 'root.der'].map((file) =>
  read(file).toString('base64'),
);
const LEAF_KEY = createPrivateKey(read('leaf-key.pem'));

export function signLikeAppStore(
  payload: object,
  { chain = CHAIN, key = LEAF_KEY } = {},
): string {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  const data = `${encode({ alg: 'ES256', x5c: chain })}.${encode(payload)}`;
  const signature = sign('sha256', Buffer.from(data), {
    key,
    dsaEncoding: 'ieee-p1363',
  });
  return `${data}.${signature.toString('base64url')}`;
}

const DAY = 24 * 60 * 60 * 1000;

/** A Supporter transaction, valid for a month from now unless overridden */
export function appleTransaction(overrides: Record<string, unknown> = {}) {
  const now = Date.now();
  return {
    transactionId: '2000000000000002',
    originalTransactionId: '2000000000000001',
    bundleId: IOS_APP_BUNDLE_ID,
    productId: APPLE_SUPPORTER_PRODUCT_IDS[BillingInterval.MONTH],
    purchaseDate: now - DAY,
    originalPurchaseDate: now - DAY,
    expiresDate: now + 29 * DAY,
    quantity: 1,
    type: 'Auto-Renewable Subscription',
    inAppOwnershipType: 'PURCHASED',
    signedDate: now,
    environment: Environment.PRODUCTION,
    transactionReason: 'PURCHASE',
    storefront: 'FRA',
    price: 4990,
    currency: 'EUR',
    ...overrides,
  };
}

export function appleRenewalInfo(overrides: Record<string, unknown> = {}) {
  return {
    originalTransactionId: '2000000000000001',
    autoRenewProductId: APPLE_SUPPORTER_PRODUCT_IDS[BillingInterval.MONTH],
    productId: APPLE_SUPPORTER_PRODUCT_IDS[BillingInterval.MONTH],
    autoRenewStatus: 1,
    signedDate: Date.now(),
    environment: Environment.PRODUCTION,
    ...overrides,
  };
}

export function appleNotification({
  notificationType = 'DID_RENEW',
  subtype,
  environment = Environment.PRODUCTION,
  appAppleId = TEST_APP_APPLE_ID,
  transaction = appleTransaction(),
  renewalInfo = appleRenewalInfo(),
}: {
  notificationType?: string;
  subtype?: string;
  environment?: Environment;
  appAppleId?: number;
  transaction?: object | null;
  renewalInfo?: object | null;
} = {}) {
  return {
    notificationType,
    ...(subtype && { subtype }),
    notificationUUID: '7e3fb20b-4cdb-47cc-936d-99d65f608138',
    version: '2.0',
    signedDate: Date.now(),
    data: {
      environment,
      appAppleId,
      bundleId: IOS_APP_BUNDLE_ID,
      ...(transaction && {
        signedTransactionInfo: signLikeAppStore(transaction),
      }),
      ...(renewalInfo && { signedRenewalInfo: signLikeAppStore(renewalInfo) }),
    },
  };
}

/** Trusts the test root and skips the online (OCSP) checks */
export class TestAppleStoreService extends AppleStoreService {
  /** null: APPLE_IAP_APP_ID unset */
  constructor(appAppleId: string | null = String(TEST_APP_APPLE_ID)) {
    super({ get: () => appAppleId ?? undefined } as never);
  }

  protected createVerifier(
    environment: Environment,
    appAppleId: number,
  ): SignedDataVerifier {
    return new SignedDataVerifier(
      [TEST_ROOT_CA],
      false,
      environment,
      IOS_APP_BUNDLE_ID,
      appAppleId,
    );
  }
}
