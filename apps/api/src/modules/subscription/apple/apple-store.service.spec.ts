import {
  Environment,
  VerificationException,
  VerificationStatus,
} from '@apple/app-store-server-library';
import { X509Certificate, generateKeyPairSync } from 'node:crypto';

import { ServiceUnavailableException } from '@nestjs/common';

import { APPLE_ROOT_CA_G3 } from './apple-root-certificates';
import {
  TestAppleStoreService,
  appleNotification,
  appleRenewalInfo,
  appleTransaction,
  signLikeAppStore,
} from './apple-store.fixture';

async function verificationStatus(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    if (error instanceof VerificationException) return error.status;
    throw error;
  }
  return VerificationStatus.OK;
}

describe('APPLE_ROOT_CA_G3', () => {
  it("is Apple Root CA - G3, by Apple's published fingerprint", () => {
    const certificate = new X509Certificate(APPLE_ROOT_CA_G3);
    expect(certificate.subject).toContain('CN=Apple Root CA - G3');
    expect(certificate.fingerprint256).toBe(
      '63:34:3A:BF:B8:9A:6A:03:EB:B5:7E:9B:3F:5F:A7:BE:7C:4F:5C:75:6F:30:17:B3:A8:C4:88:C3:65:3E:91:79',
    );
  });
});

describe('AppleStoreService', () => {
  const service = new TestAppleStoreService();

  describe('verifyTransaction', () => {
    it('decodes a production transaction signed through the App Store chain', async () => {
      const decoded = await service.verifyTransaction(
        signLikeAppStore(appleTransaction()),
      );
      expect(decoded).toMatchObject({
        originalTransactionId: '2000000000000001',
        productId: 'org.openathlete.supporter.monthly',
        environment: Environment.PRODUCTION,
      });
    });

    it('accepts sandbox transactions, which TestFlight and App Review make', async () => {
      const decoded = await service.verifyTransaction(
        signLikeAppStore(
          appleTransaction({ environment: Environment.SANDBOX }),
        ),
      );
      expect(decoded.environment).toBe(Environment.SANDBOX);
    });

    it('refuses Xcode transactions, which nothing signs', async () => {
      const status = await verificationStatus(
        service.verifyTransaction(
          signLikeAppStore(
            appleTransaction({ environment: Environment.XCODE }),
          ),
        ),
      );
      expect(status).toBe(VerificationStatus.INVALID_ENVIRONMENT);
    });

    it("refuses another app's transactions", async () => {
      const status = await verificationStatus(
        service.verifyTransaction(
          signLikeAppStore(appleTransaction({ bundleId: 'com.example.other' })),
        ),
      );
      expect(status).toBe(VerificationStatus.INVALID_APP_IDENTIFIER);
    });

    it('refuses a payload altered after signing', async () => {
      const [header, , signature] =
        signLikeAppStore(appleTransaction()).split('.');
      const forged = Buffer.from(
        JSON.stringify(appleTransaction({ expiresDate: 4_102_444_800_000 })),
      ).toString('base64url');

      const status = await verificationStatus(
        service.verifyTransaction(`${header}.${forged}.${signature}`),
      );
      expect(status).toBe(VerificationStatus.VERIFICATION_FAILURE);
    });

    it('refuses a transaction signed outside the App Store chain', async () => {
      const { privateKey } = generateKeyPairSync('ec', {
        namedCurve: 'prime256v1',
      });
      const status = await verificationStatus(
        service.verifyTransaction(
          signLikeAppStore(appleTransaction(), { key: privateKey }),
        ),
      );
      expect(status).toBe(VerificationStatus.VERIFICATION_FAILURE);
    });
  });

  describe('verifyNotification', () => {
    it('decodes a notification with its transaction and renewal info', async () => {
      const { notification, transaction, renewalInfo } =
        await service.verifyNotification(
          signLikeAppStore(
            appleNotification({
              renewalInfo: appleRenewalInfo({ autoRenewStatus: 0 }),
            }),
          ),
        );

      expect(notification.notificationType).toBe('DID_RENEW');
      expect(transaction?.originalTransactionId).toBe('2000000000000001');
      expect(renewalInfo?.autoRenewStatus).toBe(0);
    });

    it('decodes sandbox notifications', async () => {
      const sandbox = Environment.SANDBOX;
      const { transaction } = await service.verifyNotification(
        signLikeAppStore(
          appleNotification({
            environment: sandbox,
            transaction: appleTransaction({ environment: sandbox }),
            renewalInfo: appleRenewalInfo({ environment: sandbox }),
          }),
        ),
      );
      expect(transaction?.environment).toBe(sandbox);
    });

    it("refuses a production notification for another app's Apple ID", async () => {
      const status = await verificationStatus(
        service.verifyNotification(
          signLikeAppStore(appleNotification({ appAppleId: 42 })),
        ),
      );
      expect(status).toBe(VerificationStatus.INVALID_APP_IDENTIFIER);
    });

    it('handles notifications without a transaction', async () => {
      const verified = await service.verifyNotification(
        signLikeAppStore(
          appleNotification({
            notificationType: 'TEST',
            transaction: null,
            renewalInfo: null,
          }),
        ),
      );
      expect(verified.transaction).toBeNull();
    });
  });

  it('is off without APPLE_IAP_APP_ID', async () => {
    const disabled = new TestAppleStoreService(null);
    expect(disabled.enabled).toBe(false);
    await expect(
      disabled.verifyTransaction(signLikeAppStore(appleTransaction())),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});
