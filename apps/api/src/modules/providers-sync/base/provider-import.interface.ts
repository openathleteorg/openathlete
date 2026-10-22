import { EventActivity, ProviderAccount } from '@openathlete/database';

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

export interface ImportedActivity<TDate extends Date | string = Date> {
  externalId: string;
  name: string;
  startDate: TDate;
  endDate: TDate;
  sport: string;
  distance?: number;
  duration?: number;
  // Additional metadata
  [key: string]: unknown;
}

/** An imported activity, and whether this import is the one that saved it */
export interface ImportResult {
  activity: EventActivity | null;
  /** False when it was already saved, e.g. by an earlier webhook or sync */
  created: boolean;
  receiptId?: number;
  revision?: number;
  processingPending?: boolean;
}
