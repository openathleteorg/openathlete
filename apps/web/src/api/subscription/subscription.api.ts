import client, { routes } from '@/utils/axios';

import {
  CheckoutSessionResponseDto,
  CreateCheckoutSessionDto,
  CurrentSubscriptionDto,
  CustomerPortalResponseDto,
  FeatureName,
  InvoiceDto,
} from '@openathlete/shared';

export class SubscriptionAPI {
  static async getCurrentSubscription(): Promise<CurrentSubscriptionDto> {
    const res = await client.get<CurrentSubscriptionDto>(
      routes.subscription.current,
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

  static async getAthleteFeatureAccess(
    athleteId: number,
    featureName: FeatureName,
  ): Promise<{ hasAccess: boolean }> {
    const res = await client.get<{ hasAccess: boolean }>(
      routes.subscription.getAthleteFeatureAccess(athleteId, featureName),
    );
    return res.data;
  }
}
