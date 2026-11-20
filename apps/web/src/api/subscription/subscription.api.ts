import client, { routes } from '@/utils/axios';

import {
  AppleAccountTokenDto,
  CheckoutSessionResponseDto,
  CreateCheckoutSessionDto,
  CurrentSubscriptionDto,
  CustomerPortalResponseDto,
  InvoiceDto,
  SupporterBadgesDto,
  SupporterCountDto,
  UpdateSupporterWallDto,
} from '@openathlete/shared';

export class SubscriptionAPI {
  static async getCurrentSubscription(): Promise<CurrentSubscriptionDto> {
    const res = await client.get<CurrentSubscriptionDto>(
      routes.subscription.current,
    );
    return res.data;
  }

  static async getSupporterCount(): Promise<SupporterCountDto> {
    const res = await client.get<SupporterCountDto>(
      routes.subscription.supporters,
    );
    return res.data;
  }

  static async updateSupporterBadge(
    show: boolean,
  ): Promise<CurrentSubscriptionDto> {
    const res = await client.patch<CurrentSubscriptionDto>(
      routes.subscription.badge,
      { show },
    );
    return res.data;
  }

  /** Those of these users who show the Supporter badge to the user */
  static async getSupporterBadges(userIds: number[]): Promise<number[]> {
    const res = await client.get<SupporterBadgesDto>(
      routes.subscription.badges,
      {
        params: { userIds: userIds.join(',') },
      },
    );
    return res.data.userIds;
  }

  static async updateSupporterWall(
    data: UpdateSupporterWallDto,
  ): Promise<CurrentSubscriptionDto> {
    const res = await client.patch<CurrentSubscriptionDto>(
      routes.subscription.wall,
      data,
    );
    return res.data;
  }

  static async createCheckoutSession(
    data: CreateCheckoutSessionDto,
  ): Promise<CheckoutSessionResponseDto> {
    const res = await client.post<CheckoutSessionResponseDto>(
      routes.subscription.checkout,
      data,
    );
    return res.data;
  }

  static async cancelSubscription(): Promise<{ success: boolean }> {
    const res = await client.post<{ success: boolean }>(
      routes.subscription.cancel,
    );
    return res.data;
  }

  static async resumeSubscription(): Promise<{ success: boolean }> {
    const res = await client.post<{ success: boolean }>(
      routes.subscription.resume,
    );
    return res.data;
  }

  static async getInvoices(): Promise<InvoiceDto[]> {
    const res = await client.get<InvoiceDto[]>(routes.subscription.invoices);
    return res.data;
  }

  static async getCustomerPortalUrl(
    returnUrl?: string,
  ): Promise<CustomerPortalResponseDto> {
    const res = await client.get<CustomerPortalResponseDto>(
      routes.subscription.portal,
      {
        params: returnUrl ? { returnUrl } : undefined,
      },
    );
    return res.data;
  }

  static async getAppleAccountToken(): Promise<string> {
    const res = await client.get<AppleAccountTokenDto>(
      routes.subscription.appleAccountToken,
    );
    return res.data.appAccountToken;
  }

  /** Records a StoreKit purchase or restore, signed by the App Store */
  static async recordAppleTransaction(
    signedTransaction: string,
  ): Promise<CurrentSubscriptionDto> {
    const res = await client.post<CurrentSubscriptionDto>(
      routes.subscription.appleTransactions,
      { signedTransaction },
    );
    return res.data;
  }
}
