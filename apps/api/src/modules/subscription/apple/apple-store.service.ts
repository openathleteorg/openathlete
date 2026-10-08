import {
  Environment,
  JWSRenewalInfoDecodedPayload,
  JWSTransactionDecodedPayload,
  ResponseBodyV2DecodedPayload,
  SignedDataVerifier,
  VerificationException,
  VerificationStatus,
} from '@apple/app-store-server-library';

import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType, IOS_APP_BUNDLE_ID } from '@openathlete/shared';

import { APPLE_ROOT_CA_G3 } from './apple-root-certificates';

/**
 * Environments whose data the App Store signs. Xcode and local StoreKit
 * testing produce unsigned data, which the library accepts without checking
 * any signature: they are never trusted here.
 */
const SIGNED_ENVIRONMENTS = [
  Environment.PRODUCTION,
  Environment.SANDBOX,
] as const;

export interface VerifiedAppleNotification {
  notification: ResponseBodyV2DecodedPayload;
  /** The subscription's latest transaction, when the notification has one */
  transaction: JWSTransactionDecodedPayload | null;
  renewalInfo: JWSRenewalInfoDecodedPayload | null;
}

/**
 * Verifies what the App Store signs: transactions sent by the iOS app and
 * App Store Server Notifications. Needs no Apple key, only the app's Apple ID
 * (APPLE_IAP_APP_ID); without it, App Store purchases are off.
 */
@Injectable()
export class AppleStoreService {
  private readonly verifiers = new Map<Environment, SignedDataVerifier>();

  constructor(
    private readonly configService: ConfigService<ApiEnvSchemaType, true>,
  ) {}

  get enabled(): boolean {
    return this.appAppleId !== undefined;
  }

  private get appAppleId(): number | undefined {
    const value = this.configService.get('APPLE_IAP_APP_ID', { infer: true });
    return value ? Number(value) : undefined;
  }

  /** Tests trust their own root and skip the online revocation checks */
  protected createVerifier(
    environment: Environment,
    appAppleId: number,
  ): SignedDataVerifier {
    return new SignedDataVerifier(
      [APPLE_ROOT_CA_G3],
      true,
      environment,
      IOS_APP_BUNDLE_ID,
      appAppleId,
    );
  }

  private verifier(environment: Environment): SignedDataVerifier {
    const appAppleId = this.appAppleId;
    if (appAppleId === undefined) {
      throw new ServiceUnavailableException(
        'App Store purchases are not configured (missing APPLE_IAP_APP_ID)',
      );
    }
    let verifier = this.verifiers.get(environment);
    if (!verifier) {
      verifier = this.createVerifier(environment, appAppleId);
      this.verifiers.set(environment, verifier);
    }
    return verifier;
  }

  /**
   * Production first, then the sandbox: TestFlight builds and App Review buy
   * in the sandbox, against the production server.
   */
  private async inSignedEnvironment<T>(
    verify: (verifier: SignedDataVerifier) => Promise<T>,
  ): Promise<{ value: T; environment: Environment }> {
    for (const environment of SIGNED_ENVIRONMENTS) {
      try {
        return { value: await verify(this.verifier(environment)), environment };
      } catch (error) {
        const wrongEnvironment =
          error instanceof VerificationException &&
          error.status === VerificationStatus.INVALID_ENVIRONMENT;
        if (!wrongEnvironment) throw error;
      }
    }
    throw new VerificationException(VerificationStatus.INVALID_ENVIRONMENT);
  }

  /** A StoreKit 2 transaction (jwsRepresentation) sent by the iOS app */
  async verifyTransaction(
    signedTransaction: string,
  ): Promise<JWSTransactionDecodedPayload> {
    const { value } = await this.inSignedEnvironment((verifier) =>
      verifier.verifyAndDecodeTransaction(signedTransaction),
    );
    return value;
  }

  /** An App Store Server Notification V2, with its transaction and renewal */
  async verifyNotification(
    signedPayload: string,
  ): Promise<VerifiedAppleNotification> {
    const { value: notification, environment } = await this.inSignedEnvironment(
      (verifier) => verifier.verifyAndDecodeNotification(signedPayload),
    );
    const verifier = this.verifier(environment);
    const data = notification.data;
    return {
      notification,
      transaction: data?.signedTransactionInfo
        ? await verifier.verifyAndDecodeTransaction(data.signedTransactionInfo)
        : null,
      renewalInfo: data?.signedRenewalInfo
        ? await verifier.verifyAndDecodeRenewalInfo(data.signedRenewalInfo)
        : null,
    };
  }
}
