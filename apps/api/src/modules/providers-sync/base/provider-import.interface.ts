import { ProviderAccount } from '@openathlete/database';

/**
 * Interface for providers that support activity import
 */
export interface ProviderImportCapability {
  /**
   * Import activities from the provider
   * @param account Provider account with valid tokens
   * @param options Import options (date range, etc.)
   */
  importActivities(
    account: ProviderAccount,
    options?: ImportOptions,
  ): Promise<ImportedActivity[]>;

  /**
   * Handle webhook from provider for new activities
   * @param payload Webhook payload
   */
  handleWebhook?(payload: unknown): Promise<void>;
}

export interface ImportOptions {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface ImportedActivity {
  externalId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  sport: string;
  distance?: number;
  duration?: number;
  // Additional metadata
  [key: string]: unknown;
}
